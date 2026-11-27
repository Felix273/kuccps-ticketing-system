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

// Ticket categories follow the ICT Service Charter; each one maps to an SLA timeline
// (Incident/Problem Resolution uses the priority/urgency matrix).
const TICKET_CATEGORIES = [
  'Equipment Issuance',
  'Hardware Support',
  'Software Support',
  'Provision of Information',
  'Incident/Problem Resolution',
  'Software Development',
  'Information Inquiry'
];
const DEFAULT_CATEGORY = 'Incident/Problem Resolution';

// Legacy/free-text categories from older forms, the add-on and email intake.
const LEGACY_CATEGORY_MAP = {
  'hardware issues': 'Hardware Support',
  hardware: 'Hardware Support',
  'peripheral devices': 'Hardware Support',
  'printer & peripheral issues': 'Hardware Support',
  'software issues': 'Software Support',
  software: 'Software Support',
  'general requests': 'Information Inquiry'
};

function normalizeCategory(value) {
  const text = String(value || '').trim();
  if (!text) return DEFAULT_CATEGORY;
  const exact = TICKET_CATEGORIES.find(category => category.toLowerCase() === text.toLowerCase());
  return exact || LEGACY_CATEGORY_MAP[text.toLowerCase()] || DEFAULT_CATEGORY;
}

module.exports.TICKET_CATEGORIES = TICKET_CATEGORIES;
module.exports.DEFAULT_CATEGORY = DEFAULT_CATEGORY;
module.exports.normalizeCategory = normalizeCategory;
