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
  // Accept a caller-supplied ID only if it is short and log-safe.
  const supplied = req.headers['x-request-id'];
  req.id = typeof supplied === 'string' && /^[A-Za-z0-9._:-]{1,64}$/.test(supplied)
    ? supplied
    : crypto.randomUUID();
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

// In-process counter. Used when RATE_LIMIT_STORE=memory, in unit tests, and as a
// fallback if the shared database store is temporarily unavailable.
function memoryHit(key, windowMs) {
  const now = Date.now();
  sweepExpiredRateLimitBuckets(now);
  let bucket = memoryBuckets.get(key);
  if (!bucket) {
    if (memoryBuckets.size >= MAX_RATE_LIMIT_BUCKETS) return { count: Infinity, resetAt: now + windowMs };
    bucket = { count: 0, resetAt: now + windowMs };
    memoryBuckets.set(key, bucket);
  }
  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  return { count: bucket.count, resetAt: bucket.resetAt };
}

let nextDatabaseSweep = 0;

// Shared counter in PostgreSQL: one atomic upsert per request, timed by the database
// clock, so every backend instance enforces the same limit.
async function databaseHit(client, key, windowMs) {
  const rows = await client.$queryRaw`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + make_interval(secs => ${windowMs / 1000}))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."resetAt" <= now() THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" <= now()
        THEN now() + make_interval(secs => ${windowMs / 1000}) ELSE "RateLimitBucket"."resetAt" END
    RETURNING "count", "resetAt"`;
  const now = Date.now();
  if (now >= nextDatabaseSweep) {
    nextDatabaseSweep = now + RATE_LIMIT_BUCKET_SWEEP_INTERVAL_MS;
    client.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "resetAt" < now() - interval '1 hour'`
      .catch(error => console.warn('Rate-limit cleanup skipped:', error.message));
  }
  return { count: Number(rows[0].count), resetAt: new Date(rows[0].resetAt).getTime() };
}

/**
 * @param {object} options
 * @param {'database'|'memory'} [options.store] defaults to RATE_LIMIT_STORE or 'database'
 * @param {object} [options.client] Prisma client for the database store (defaults to the app client)
 */
function rateLimit({ windowMs, max, keyPrefix, message, store, client }) {
  const storeName = store || process.env.RATE_LIMIT_STORE || 'database';

  function respond(req, res, next, { count, resetAt }) {
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
    if (count > max) {
      return res.status(429).json({
        success: false,
        message: message || 'Too many requests. Please try again later.'
      });
    }
    return next();
  }

  return (req, res, next) => {
    const key = `${keyPrefix}:${getClientIp(req)}`;
    if (storeName === 'memory') return respond(req, res, next, memoryHit(key, windowMs));

    const prismaClient = client || require('../lib/prisma');
    return databaseHit(prismaClient, key, windowMs)
      .catch(error => {
        console.warn('Shared rate limit unavailable, using in-process limit:', error.message);
        return memoryHit(key, windowMs);
      })
      .then(result => respond(req, res, next, result));
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
  const encryptionKey = cleanSecret(env.SETTINGS_ENCRYPTION_KEY);
  if (!/^[0-9a-f]{64}$/i.test(encryptionKey) && Buffer.from(encryptionKey, 'base64').length !== 32) {
    failures.push('SETTINGS_ENCRYPTION_KEY must be 32 random bytes (64 hex characters) in production.');
  }
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
