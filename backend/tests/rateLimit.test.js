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
  const limiter = rateLimit({ windowMs: 60000, max: 2, keyPrefix: 'test-auth' });
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
  const limiter = rateLimit({ windowMs: 60000, max: 1, keyPrefix: 'test-public' });
  let allowed = 0;

  limiter(requestFrom('192.0.2.11'), response(), () => { allowed += 1; });
  limiter(requestFrom('192.0.2.12'), response(), () => { allowed += 1; });

  assert.equal(allowed, 2);
});
