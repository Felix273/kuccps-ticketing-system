const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

const KEY_A = crypto.randomBytes(32).toString('hex');
const KEY_B = crypto.randomBytes(32).toString('hex');

function withEnv(values, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

const { encryptSecret, decryptSecret, isEncrypted, withDecryptedSecrets } = require('../src/services/secretBox');

test('stored credentials are encrypted with AES-GCM and decrypt back', () => {
  withEnv({ SETTINGS_ENCRYPTION_KEY: KEY_A, SETTINGS_ENCRYPTION_KEY_PREVIOUS: undefined }, () => {
    const encrypted = encryptSecret('smtp-app-password');
    assert.ok(isEncrypted(encrypted));
    assert.doesNotMatch(encrypted, /smtp-app-password/);
    assert.notEqual(encryptSecret('smtp-app-password'), encrypted, 'random IV per encryption');
    assert.equal(decryptSecret(encrypted), 'smtp-app-password');
    assert.equal(encryptSecret(encrypted), encrypted, 'already-encrypted values are not double-encrypted');
    assert.equal(decryptSecret('legacy-plaintext'), 'legacy-plaintext', 'legacy plaintext stays readable');
    assert.equal(encryptSecret(null), null);
  });
});

test('tampered ciphertext or the wrong key is rejected; the previous key supports rotation', () => {
  const encrypted = withEnv({ SETTINGS_ENCRYPTION_KEY: KEY_A }, () => encryptSecret('ldap-bind-secret'));
  const tampered = `${encrypted.slice(0, -2)}AA`;
  withEnv({ SETTINGS_ENCRYPTION_KEY: KEY_A }, () => assert.throws(() => decryptSecret(tampered)));
  withEnv({ SETTINGS_ENCRYPTION_KEY: KEY_B, SETTINGS_ENCRYPTION_KEY_PREVIOUS: undefined }, () => {
    assert.throws(() => decryptSecret(encrypted), /could not be decrypted/);
    assert.equal(withDecryptedSecrets({ smtpPassword: encrypted }).smtpPassword, null);
  });
  withEnv({ SETTINGS_ENCRYPTION_KEY: KEY_B, SETTINGS_ENCRYPTION_KEY_PREVIOUS: KEY_A }, () => {
    assert.equal(decryptSecret(encrypted), 'ldap-bind-secret');
  });
});

test('production refuses to run without an explicit encryption key', () => {
  withEnv({ NODE_ENV: 'production', SETTINGS_ENCRYPTION_KEY: undefined }, () => {
    assert.throws(() => encryptSecret('x'), /required in production/);
  });
});

const { parseTicketQuery, segmentWhere, combineWhere, TicketQueryError } = require('../src/services/ticketQuery');

test('ticket list queries are validated and paginated server-side', () => {
  const query = parseTicketQuery({
    q: 'printer',
    status: 'Open,InProgress',
    priority: 'VeryHigh',
    assignedToId: 'me,unassigned',
    page: '3',
    pageSize: '500',
    sortBy: 'ticketNumber',
    sortOrder: 'asc'
  }, { id: 'user-1' });
  assert.equal(query.page, 3);
  assert.equal(query.pageSize, 100, 'page size is capped');
  assert.deepEqual(query.orderBy, [{ ticketNumber: 'asc' }, { id: 'asc' }]);
  const where = JSON.stringify(query.baseWhere);
  assert.match(where, /"status":\{"in":\["Open","InProgress"\]\}/);
  assert.match(where, /"priority":\{"in":\["VeryHigh","Critical"\]\}/, 'VeryHigh includes legacy Critical');
  assert.match(where, /"assignedToId":null/);
  assert.match(where, /"assignedToId":\{"in":\["user-1"\]\}/);

  for (const bad of [{ status: 'Bogus' }, { q: ['a', 'b'] }, { page: '0' }, { sortBy: 'password' }, { dateFrom: 'nope' }, { segment: 'x' }]) {
    assert.throws(() => parseTicketQuery(bad, { id: 'u' }), TicketQueryError, JSON.stringify(bad));
  }
  assert.deepEqual(segmentWhere('unassigned', 'u'), { assignedToId: null });
  assert.deepEqual(combineWhere({}, {}), {});
});

const { getRequestToken, isCsrfSafe, parseCookies } = require('../src/middleware/sessionCookie');

test('sessions come from the httpOnly cookie and cookie writes require the anti-forgery header', () => {
  assert.deepEqual(parseCookies('a=1; kuccps_session=abc.def; b=x%20y'), { a: '1', kuccps_session: 'abc.def', b: 'x y' });
  const cookieRequest = { method: 'PUT', headers: { cookie: 'kuccps_session=tok' } };
  assert.deepEqual(getRequestToken(cookieRequest), { token: 'tok', source: 'cookie' });
  assert.equal(isCsrfSafe(cookieRequest, 'cookie'), false, 'cross-site form cannot set X-Requested-With');
  assert.equal(isCsrfSafe({ ...cookieRequest, headers: { ...cookieRequest.headers, 'x-requested-with': 'XMLHttpRequest' } }, 'cookie'), true);
  assert.equal(isCsrfSafe({ method: 'GET', headers: {} }, 'cookie'), true);
  assert.deepEqual(getRequestToken({ headers: { authorization: 'Bearer xyz' } }), { token: 'xyz', source: 'bearer' });
  assert.equal(isCsrfSafe({ method: 'POST', headers: {} }, 'bearer'), true, 'bearer tokens are not sent automatically by browsers');
});
