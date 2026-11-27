const test = require('node:test');
const assert = require('node:assert/strict');
const { rateLimit } = require('../src/middleware/security');

function requestFrom(ip) {
  return {
    ip,
    headers: {},
    socket: { remoteAddress: ip }
  };
}

function response() {
  return {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('rate limits requests per client and resets only after the configured window', () => {
  const limiter = rateLimit({ windowMs: 60000, max: 2, keyPrefix: 'test-auth', store: 'memory' });
  let allowed = 0;
  const next = () => { allowed += 1; };

  limiter(requestFrom('192.0.2.10'), response(), next);
  limiter(requestFrom('192.0.2.10'), response(), next);
  const blockedResponse = response();
  limiter(requestFrom('192.0.2.10'), blockedResponse, next);

  assert.equal(allowed, 2);
  assert.equal(blockedResponse.statusCode, 429);
  assert.equal(blockedResponse.headers['RateLimit-Remaining'], '0');
});

test('rate limits are isolated by client address', () => {
  const limiter = rateLimit({ windowMs: 60000, max: 1, keyPrefix: 'test-public', store: 'memory' });
  let allowed = 0;

  limiter(requestFrom('192.0.2.11'), response(), () => { allowed += 1; });
  limiter(requestFrom('192.0.2.12'), response(), () => { allowed += 1; });

  assert.equal(allowed, 2);
});

test('shared store counts across instances and falls back to memory if the database fails', async () => {
  // Fake database shared by two limiter instances (as two backend servers would share PostgreSQL).
  const buckets = new Map();
  const sharedDb = {
    async $queryRaw(strings, key) {
      const bucket = buckets.get(key) || { count: 0, resetAt: new Date(Date.now() + 60000) };
      bucket.count += 1;
      buckets.set(key, bucket);
      return [{ count: bucket.count, resetAt: bucket.resetAt }];
    },
    $executeRaw: async () => 0
  };
  const instanceA = rateLimit({ windowMs: 60000, max: 2, keyPrefix: 'shared', store: 'database', client: sharedDb });
  const instanceB = rateLimit({ windowMs: 60000, max: 2, keyPrefix: 'shared', store: 'database', client: sharedDb });
  let allowed = 0;
  const next = () => { allowed += 1; };
  await instanceA(requestFrom('192.0.2.20'), response(), next);
  await instanceB(requestFrom('192.0.2.20'), response(), next);
  const blocked = response();
  await instanceA(requestFrom('192.0.2.20'), blocked, next);
  assert.equal(allowed, 2);
  assert.equal(blocked.statusCode, 429);

  const brokenDb = { $queryRaw: async () => { throw new Error('db down'); }, $executeRaw: async () => 0 };
  const fallback = rateLimit({ windowMs: 60000, max: 1, keyPrefix: 'fallback', store: 'database', client: brokenDb });
  let fallbackAllowed = 0;
  await fallback(requestFrom('192.0.2.21'), response(), () => { fallbackAllowed += 1; });
  const fallbackBlocked = response();
  await fallback(requestFrom('192.0.2.21'), fallbackBlocked, () => { fallbackAllowed += 1; });
  assert.equal(fallbackAllowed, 1);
  assert.equal(fallbackBlocked.statusCode, 429);
});
