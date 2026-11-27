const test = require('node:test');
const assert = require('node:assert/strict');
const { getProductionConfigErrors } = require('../src/middleware/security');

const validProductionConfig = {
  NODE_ENV: 'production',
  JWT_SECRET: '0123456789abcdef'.repeat(3),
  PUBLIC_TICKET_API_KEY: 'fedcba9876543210'.repeat(3),
  REQUIRE_PUBLIC_TICKET_API_KEY: 'true',
  CORS_ORIGINS: 'https://tickets.example.org,https://www.example.org',
  SETTINGS_ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8'.repeat(4)
};

test('production config requires a 32-byte settings encryption key', () => {
  const errors = getProductionConfigErrors({ ...validProductionConfig, SETTINGS_ENCRYPTION_KEY: 'too-short' });
  assert.ok(errors.some(error => error.includes('SETTINGS_ENCRYPTION_KEY')));
});

test('production config accepts strong secrets and explicit HTTPS origins', () => {
  assert.deepEqual(getProductionConfigErrors(validProductionConfig), []);
});

test('production config rejects insecure or non-origin CORS entries', () => {
  for (const origin of [
    'http://tickets.example.org',
    'https://tickets.example.org/path',
    'https://user:password@tickets.example.org',
    '*'
  ]) {
    const errors = getProductionConfigErrors({
      ...validProductionConfig,
      CORS_ORIGINS: origin
    });
    assert.ok(errors.length > 0, `Expected ${origin} to be rejected`);
  }
});

test('production config requires strong public credentials and API-key enforcement', () => {
  const errors = getProductionConfigErrors({
    ...validProductionConfig,
    JWT_SECRET: 'short',
    PUBLIC_TICKET_API_KEY: '',
    REQUIRE_PUBLIC_TICKET_API_KEY: 'false'
  });

  assert.ok(errors.some(error => error.includes('JWT_SECRET')));
  assert.ok(errors.some(error => error.includes('PUBLIC_TICKET_API_KEY')));
  assert.ok(errors.some(error => error.includes('REQUIRE_PUBLIC_TICKET_API_KEY')));
});

test('production config rejects obvious placeholder and low-complexity secrets', () => {
  for (const secret of [
    'change-this-to-a-long-random-secret',
    'a'.repeat(64)
  ]) {
    const errors = getProductionConfigErrors({
      ...validProductionConfig,
      JWT_SECRET: secret
    });
    assert.ok(errors.some(error => error.includes('JWT_SECRET')), `Expected ${secret} to be rejected`);
  }
});

test('non-production config does not impose production-only requirements', () => {
  assert.deepEqual(getProductionConfigErrors({ NODE_ENV: 'development' }), []);
});
