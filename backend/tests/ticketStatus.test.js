const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ACTIVE_TICKET_STATUSES,
  VALID_TICKET_STATUSES,
  isValidTicketStatusTransition
} = require('../src/services/ticketStatus');

test('On Hold is a recognized unresolved status included in the active backlog', () => {
  assert.equal(VALID_TICKET_STATUSES.has('On Hold'), true);
  assert.equal(ACTIVE_TICKET_STATUSES.has('On Hold'), true);
});

test('ticket status transitions support hold, resolution, closure, and reopening', () => {
  assert.equal(isValidTicketStatusTransition('Open', 'On Hold'), true);
  assert.equal(isValidTicketStatusTransition('In Progress', 'On Hold'), true);
  assert.equal(isValidTicketStatusTransition('On Hold', 'In Progress'), true);
  assert.equal(isValidTicketStatusTransition('On Hold', 'Resolved'), true);
  assert.equal(isValidTicketStatusTransition('Resolved', 'Closed'), true);
  assert.equal(isValidTicketStatusTransition('Closed', 'Open'), true);
});

test('tickets cannot be closed before resolution or transition from closed to hold', () => {
  assert.equal(isValidTicketStatusTransition('Open', 'Closed'), false);
  assert.equal(isValidTicketStatusTransition('In Progress', 'Closed'), false);
  assert.equal(isValidTicketStatusTransition('Closed', 'On Hold'), false);
});
