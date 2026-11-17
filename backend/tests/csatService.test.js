const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CSAT_SATISFIED_MIN_RATING,
  calculateSatisfactionRate,
  createCsatLinks,
  ensureWorkingCsatLinks,
  removeLegacyCsatSection,
  verifyCsatToken
} = require('../src/services/csatService');

const originalEnv = {
  JWT_SECRET: process.env.JWT_SECRET,
  PUBLIC_APP_URL: process.env.PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV
};

test.beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret-with-more-than-thirty-two-characters';
  process.env.PUBLIC_APP_URL = 'https://support.example.test';
  delete process.env.NODE_ENV;
});

test.after(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('resolved-ticket email links open the public feedback page with signed ticket and rating tokens', () => {
  const ticket = { id: 'ticket-123', requesterEmail: 'requester@example.test' };
  const links = createCsatLinks(ticket);

  assert.deepEqual(links.map(link => link.rating), [5, 4, 3, 2, 1]);
  for (const link of links) {
    const url = new URL(link.url);
    assert.equal(url.origin, 'https://support.example.test');
    assert.equal(url.pathname, '/');
    assert.equal(url.searchParams.get('csatToken') !== null, true);
    const payload = verifyCsatToken(url.searchParams.get('csatToken'));
    assert.equal(payload.purpose, 'csat');
    assert.equal(payload.ticketId, ticket.id);
    assert.equal(payload.requesterEmail, ticket.requesterEmail);
    assert.equal(payload.rating, link.rating);
    assert.equal(payload.iss, 'kuccps-ticketing');
    assert.equal(payload.aud, 'kuccps-csat');
    assert.ok(payload.exp - payload.iat <= 30 * 24 * 60 * 60);
  }
});

test('legacy rating links in stored resolved templates are replaced with signed feedback links', () => {
  const ticket = { id: 'ticket-456', requesterEmail: 'requester@example.test' };
  const legacyLinks = [5, 4, 3, 2, 1].map(rating =>
    `<a href="/api/operations/csat/rate?ticketId=${ticket.id}&rating=${rating}">${rating} Stars - Rating</a>`
  ).join('');

  const rendered = ensureWorkingCsatLinks(`<main>${legacyLinks}</main>`, ticket, '#990024');
  const links = [...rendered.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];

  assert.equal(links.length, 5);
  for (const [, href, label] of links) {
    const url = new URL(href);
    assert.equal(url.origin, 'https://support.example.test');
    assert.equal(url.pathname, '/');
    assert.match(url.search, /csatToken=/);
    assert.doesNotMatch(href, /\/api\/operations\/csat\/rate/);
    const rating = Number(label.match(/\b([1-5])\s+Stars?\b/i)[1]);
    assert.equal(verifyCsatToken(url.searchParams.get('csatToken')).rating, rating);
  }
});

test('legacy duplicate email card is removed when the signed-link placeholder is present', () => {
  const template = [
    '<!-- 1-Click CSAT Rating Section -->',
    '<div><a href="/legacy">5 Stars - old rating</a></div>',
    '{{csatLinks}}'
  ].join('');

  const cleaned = removeLegacyCsatSection(template);

  assert.doesNotMatch(cleaned, /1-Click CSAT Rating Section|old rating|\/legacy/);
  assert.match(cleaned, /\{\{csatLinks\}\}/);
});

test('satisfaction rate uses 4- and 5-star responses and has an explicit empty state', () => {
  assert.equal(CSAT_SATISFIED_MIN_RATING, 4);
  assert.equal(calculateSatisfactionRate(10, 7), 70);
  assert.equal(calculateSatisfactionRate(3, 0), 0);
  assert.equal(calculateSatisfactionRate(0, 0), null);
  assert.throws(() => calculateSatisfactionRate(2, 3), /between zero and total responses/);
});

test('production email feedback links reject localhost as the public app URL', () => {
  process.env.NODE_ENV = 'production';
  process.env.PUBLIC_APP_URL = 'http://localhost:5173';

  assert.throws(() => createCsatLinks({ id: 'ticket-789', requesterEmail: 'user@example.test' }), /publicly reachable frontend URL/);
});
