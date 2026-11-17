const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ACTIVE_TICKET_STATUSES,
  VALID_TICKET_STATUSES,
  isValidTicketStatusTransition
} = require('../src/services/ticketStatus');

test('On Hold is a recognized unresolved status included in the active backlog', () => {
  assert.equal(VALID_TICKET_STATUSES.has('OnHold'), true);
  assert.equal(ACTIVE_TICKET_STATUSES.has('OnHold'), true);
});

test('ticket status transitions support hold, resolution, closure, and reopening', () => {
  assert.equal(isValidTicketStatusTransition('Open', 'OnHold'), true);
  assert.equal(isValidTicketStatusTransition('InProgress', 'OnHold'), true);
  assert.equal(isValidTicketStatusTransition('OnHold', 'InProgress'), true);
  assert.equal(isValidTicketStatusTransition('OnHold', 'Resolved'), true);
  assert.equal(isValidTicketStatusTransition('Resolved', 'Closed'), true);
  assert.equal(isValidTicketStatusTransition('Closed', 'Open'), true);
});

test('tickets cannot be closed before resolution or transition from closed to hold', () => {
  assert.equal(isValidTicketStatusTransition('Open', 'Closed'), false);
  assert.equal(isValidTicketStatusTransition('InProgress', 'Closed'), false);
  assert.equal(isValidTicketStatusTransition('Closed', 'OnHold'), false);
});
