// Maps user/legacy input (e.g. "In Progress", "very high") to the TicketStatus / TicketPriority DB enums.

const PRIORITY_MAP = {
  veryhigh: 'VeryHigh',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  verylow: 'VeryLow',
  critical: 'VeryHigh',
  normal: 'Medium',
  urgent: 'High'
};

const STATUS_MAP = {
  open: 'Open',
  inprogress: 'InProgress',
  onhold: 'OnHold',
  resolved: 'Resolved',
  closed: 'Closed'
};

const compact = value => String(value).replace(/[\s_-]+/g, '').toLowerCase();

function normalizePriority(value) {
  if (!value) return null;
  return PRIORITY_MAP[compact(value)] || null;
}

function normalizeStatus(value) {
  if (!value) return null;
  return STATUS_MAP[compact(value)] || null;
}

module.exports = { normalizePriority, normalizeStatus };
