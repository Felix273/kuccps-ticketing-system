const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePriority, normalizeStatus } = require('../src/services/ticketEnums');

test('legacy and human-readable ticket statuses map to TicketStatus enum values', () => {
  assert.equal(normalizeStatus('In Progress'), 'InProgress');
  assert.equal(normalizeStatus('on_hold'), 'OnHold');
  assert.equal(normalizeStatus('InProgress'), 'InProgress');
  assert.equal(normalizeStatus('Open'), 'Open');
  assert.equal(normalizeStatus('pending'), null);
  assert.equal(normalizeStatus(''), null);
});

test('legacy and human-readable priorities map to TicketPriority enum values', () => {
  assert.equal(normalizePriority('Very High'), 'VeryHigh');
  assert.equal(normalizePriority('critical'), 'VeryHigh');
  assert.equal(normalizePriority('normal'), 'Medium');
  assert.equal(normalizePriority('unknown'), null);
});
