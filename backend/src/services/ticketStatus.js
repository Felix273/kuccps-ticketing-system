const VALID_TICKET_STATUSES = new Set(['Open', 'InProgress', 'OnHold', 'Resolved', 'Closed']);
const ACTIVE_TICKET_STATUSES = new Set(['Open', 'InProgress', 'OnHold']);
const STATUS_TRANSITIONS = {
  Open: new Set(['InProgress', 'OnHold', 'Resolved']),
  'InProgress': new Set(['Open', 'OnHold', 'Resolved']),
  'OnHold': new Set(['Open', 'InProgress', 'Resolved']),
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
