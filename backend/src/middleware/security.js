const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const memoryBuckets = new Map();

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
    const ip = getClientIp(req);
    const key = `${keyPrefix}:${ip}`;
    const bucket = memoryBuckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (bucket.resetAt <= now) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    memoryBuckets.set(key, bucket);

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

function requirePublicApiKey(req, res, next) {
  const envPath = path.join(__dirname, '../../.env');
  let fileKey = '';
  try {
    const env = fs.readFileSync(envPath, 'utf8');
    fileKey = (env.match(/^PUBLIC_TICKET_API_KEY=(.*)$/m)?.[1] || '')
      .trim()
      .replace(/^['"]|['"]$/g, '');
  } catch {
    fileKey = '';
  }

  const configuredKey = fileKey || process.env.PUBLIC_TICKET_API_KEY || process.env.BACKEND_API_KEY;
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
  const providedKey = req.headers['x-api-key'] || bearerKey || req.body?.apiKey;
  if (providedKey !== configuredKey) {
    auditLog('public_ticket.invalid_api_key', {
      requestId: req.id,
      providedLength: providedKey ? String(providedKey).length : 0,
      configuredLength: configuredKey ? String(configuredKey).length : 0,
      source: req.headers['x-api-key'] ? 'x-api-key' : bearerKey ? 'authorization' : req.body?.apiKey ? 'body' : 'missing'
    });
    return res.status(401).json({
      success: false,
      message: 'Invalid public API key'
    });
  }

  next();
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
  auditLog
};
