const VALID_TICKET_STATUSES = new Set(['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed']);
const ACTIVE_TICKET_STATUSES = new Set(['Open', 'In Progress', 'On Hold']);
const STATUS_TRANSITIONS = {
  Open: new Set(['In Progress', 'On Hold', 'Resolved']),
  'In Progress': new Set(['Open', 'On Hold', 'Resolved']),
  'On Hold': new Set(['Open', 'In Progress', 'Resolved']),
  Resolved: new Set(['Open', 'Closed']),
  Closed: new Set(['Open'])
};

function isValidTicketStatusTransition(currentStatus, nextStatus) {
  return currentStatus === nextStatus || Boolean(STATUS_TRANSITIONS[currentStatus]?.has(nextStatus));
}

module.exports = {
  ACTIVE_TICKET_STATUSES,
  VALID_TICKET_STATUSES,
  isValidTicketStatusTransition
};
