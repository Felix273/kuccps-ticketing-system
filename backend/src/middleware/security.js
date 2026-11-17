const crypto = require('crypto');
const memoryBuckets = new Map();
const MAX_RATE_LIMIT_BUCKETS = 50000;
const RATE_LIMIT_BUCKET_SWEEP_INTERVAL_MS = 60000;
let nextRateLimitBucketSweep = 0;

function sweepExpiredRateLimitBuckets(now) {
  if (now < nextRateLimitBucketSweep) return;
  for (const [key, bucket] of memoryBuckets) {
    if (bucket.resetAt <= now) memoryBuckets.delete(key);
  }
  nextRateLimitBucketSweep = now + RATE_LIMIT_BUCKET_SWEEP_INTERVAL_MS;
}

function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Cache-Control', 'no-store');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

function getClientIp(req) {
  return req.ip || req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
}

function rateLimit({ windowMs, max, keyPrefix, message }) {
  return (req, res, next) => {
    const now = Date.now();
    sweepExpiredRateLimitBuckets(now);
    const ip = getClientIp(req);
    const key = `${keyPrefix}:${ip}`;
    let bucket = memoryBuckets.get(key);

    if (!bucket) {
      if (memoryBuckets.size >= MAX_RATE_LIMIT_BUCKETS) {
        res.setHeader('RateLimit-Limit', String(max));
        res.setHeader('RateLimit-Remaining', '0');
        res.setHeader('RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));
        return res.status(429).json({
          success: false,
          message: message || 'Too many requests. Please try again later.'
        });
      }
      bucket = { count: 0, resetAt: now + windowMs };
      memoryBuckets.set(key, bucket);
    }

    if (bucket.resetAt <= now) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;

    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      return res.status(429).json({
        success: false,
        message: message || 'Too many requests. Please try again later.'
      });
    }

    next();
  };
}

function cleanSecret(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
}

function isStrongProductionSecret(value) {
  const secret = cleanSecret(value);
  const placeholderPattern = /change[-_ ]?this|change[-_ ]?me|replace[-_ ]?me|your[-_ ]|example|placeholder|development|password|test/i;
  return secret.length >= 32 && new Set(secret).size >= 12 && !placeholderPattern.test(secret);
}

function timingSafeEqualText(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function requirePublicApiKey(req, res, next) {
  const configuredKey = cleanSecret(process.env.PUBLIC_TICKET_API_KEY || process.env.BACKEND_API_KEY);
  const mustEnforce = process.env.NODE_ENV === 'production' || process.env.REQUIRE_PUBLIC_TICKET_API_KEY === 'true';

  if (!configuredKey && !mustEnforce) return next();
  if (!configuredKey && mustEnforce) {
    return res.status(503).json({
      success: false,
      message: 'Public ticket intake is not configured securely'
    });
  }

  const authorization = req.headers.authorization || '';
  const bearerKey = authorization.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : '';
  const bodyKeyAllowed = process.env.ALLOW_PUBLIC_API_KEY_IN_BODY === 'true' && process.env.NODE_ENV !== 'production';
  const providedKey = cleanSecret(req.headers['x-api-key'] || bearerKey || (bodyKeyAllowed ? req.body?.apiKey : ''));
  if (!providedKey || !timingSafeEqualText(providedKey, configuredKey)) {
    auditLog('public_ticket.invalid_api_key', {
      requestId: req.id,
      providedLength: providedKey ? String(providedKey).length : 0,
      configuredLength: configuredKey ? String(configuredKey).length : 0,
      source: req.headers['x-api-key'] ? 'x-api-key' : bearerKey ? 'authorization' : bodyKeyAllowed && req.body?.apiKey ? 'body' : 'missing'
    });
    return res.status(401).json({
      success: false,
      message: 'Invalid public API key'
    });
  }

  next();
}

function validateProductionConfig() {
  const failures = getProductionConfigErrors();

  if (failures.length > 0) {
    throw new Error(`Production configuration is not safe:\n- ${failures.join('\n- ')}`);
  }
}

function getProductionConfigErrors(env = process.env) {
  if (env.NODE_ENV !== 'production') return [];

  const failures = [];
  const jwtSecret = cleanSecret(env.JWT_SECRET);
  const publicTicketKey = cleanSecret(env.PUBLIC_TICKET_API_KEY || env.BACKEND_API_KEY);
  const configuredOrigins = cleanSecret(env.CORS_ORIGINS || env.FRONTEND_URL);
  const origins = configuredOrigins.split(',').map(origin => origin.trim()).filter(Boolean);

  if (!isStrongProductionSecret(jwtSecret)) {
    failures.push('JWT_SECRET must be a high-entropy random value of at least 32 characters in production.');
  }
  if (!isStrongProductionSecret(publicTicketKey)) {
    failures.push('PUBLIC_TICKET_API_KEY must be a high-entropy random value of at least 32 characters in production.');
  }
  if (env.REQUIRE_PUBLIC_TICKET_API_KEY !== 'true') failures.push('REQUIRE_PUBLIC_TICKET_API_KEY must be true in production.');
  if (!origins.length) {
    failures.push('CORS_ORIGINS/FRONTEND_URL must contain at least one production HTTPS origin.');
  } else {
    for (const origin of origins) {
      try {
        const parsed = new URL(origin);
        if (
          parsed.protocol !== 'https:' ||
          parsed.origin !== origin ||
          parsed.username ||
          parsed.password
        ) {
          failures.push('CORS_ORIGINS/FRONTEND_URL entries must be HTTPS origins without paths or credentials.');
          break;
        }
      } catch {
        failures.push('CORS_ORIGINS/FRONTEND_URL must contain valid HTTPS origins.');
        break;
      }
    }
  }
  if (String(env.LDAP_URL || '').startsWith('ldap://')) {
    failures.push('Use LDAPS for production Active Directory connections.');
  }

  return failures;
}

function redact(value) {
  if (!value) return value;
  return String(value).replace(/^(.{2}).*(@.*)?$/, (_, start, domain) => `${start}***${domain || ''}`);
}

function auditLog(event, details = {}) {
  const safeDetails = { ...details };
  ['password', 'smtpPassword', 'imapPassword', 'ldapBindPassword', 'token', 'authorization'].forEach(key => {
    if (safeDetails[key]) safeDetails[key] = '[REDACTED]';
  });
  if (safeDetails.email) safeDetails.email = redact(safeDetails.email);
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    event,
    ...safeDetails
  }));
}

module.exports = {
  requestId,
  securityHeaders,
  rateLimit,
  requirePublicApiKey,
  getProductionConfigErrors,
  validateProductionConfig,
  auditLog
};
