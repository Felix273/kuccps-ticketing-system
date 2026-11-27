const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeCategory, TICKET_CATEGORIES } = require('../src/services/ticketEnums');
const { getPolicyKey } = require('../src/services/slaService');
const { warningMoment } = require('../src/services/notificationScheduler');

test('every ticket category maps to a Service Charter SLA timeline', () => {
  for (const category of TICKET_CATEGORIES) {
    assert.ok(getPolicyKey(category, 'Medium'), `${category} has an SLA policy`);
  }
  assert.equal(normalizeCategory('Hardware Issues'), 'Hardware Support');
  assert.equal(normalizeCategory('software issues'), 'Software Support');
  assert.equal(normalizeCategory('Network & Connectivity Issues'), 'Incident/Problem Resolution');
  assert.equal(normalizeCategory('information inquiry'), 'Information Inquiry');
  assert.equal(normalizeCategory(''), 'Incident/Problem Resolution');
});

test('SLA warning fires at the configured share of the resolution window, excluding hold time', () => {
  const createdAt = new Date('2026-03-02T06:00:00Z');
  const slaDueAt = new Date('2026-03-02T16:00:00Z'); // 10 hours
  assert.equal(warningMoment({ createdAt, slaDueAt, totalHoldMinutes: 0 }, 75).toISOString(), '2026-03-02T13:30:00.000Z');
  // 2 hours on hold: the deadline was pushed back already, so the window starts 2 hours later.
  const shifted = new Date('2026-03-02T18:00:00Z');
  assert.equal(warningMoment({ createdAt, slaDueAt: shifted, totalHoldMinutes: 120 }, 75).toISOString(), '2026-03-02T15:30:00.000Z');
  assert.equal(warningMoment({ createdAt, slaDueAt: null }, 75), null);
});
