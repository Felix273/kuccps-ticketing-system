// Server-side ticket filtering, segmentation and pagination.
// Every list screen sends its filters here instead of downloading every ticket.

const VALID_STATUSES = ['Open', 'InProgress', 'OnHold', 'Resolved', 'Closed'];
const VALID_PRIORITIES = ['VeryLow', 'Low', 'Medium', 'High', 'VeryHigh', 'Critical'];
const ACTIVE_STATUSES = ['Open', 'InProgress', 'OnHold'];
const URGENT_PRIORITIES = ['VeryHigh', 'Critical'];
const SORTABLE_FIELDS = new Set(['createdAt', 'updatedAt', 'ticketNumber', 'priority', 'status', 'slaDueAt']);

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const MAX_EXPORT_ROWS = 10000;

class TicketQueryError extends Error {}

function text(value, name, max = 200) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new TicketQueryError(`${name} must be a single value`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new TicketQueryError(`${name} is too long`);
  return trimmed || undefined;
}

function list(value, name, allowed) {
  const raw = text(value, name, 2000);
  if (!raw) return undefined;
  const items = [...new Set(raw.split(',').map(item => item.trim()).filter(Boolean))];
  if (allowed && items.some(item => !allowed.includes(item))) {
    throw new TicketQueryError(`${name} contains an invalid value`);
  }
  return items.length ? items : undefined;
}

function date(value, name, endOfDay = false) {
  const raw = text(value, name, 40);
  if (!raw) return undefined;
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) && endOfDay ? `${raw}T23:59:59.999` : raw);
  if (Number.isNaN(parsed.getTime())) throw new TicketQueryError(`${name} is not a valid date`);
  return parsed;
}

function positiveInt(value, name, fallback, max) {
  if (value === undefined || value === '') return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new TicketQueryError(`${name} must be a positive whole number`);
  return Math.min(number, max);
}

function segmentWhere(segment, userId) {
  switch (segment) {
    case undefined:
    case 'all':
      return {};
    case 'unassigned':
      return { assignedToId: null };
    case 'my-tickets':
      return { assignedToId: userId };
    case 'critical':
      return { priority: { in: URGENT_PRIORITIES }, status: { in: ACTIVE_STATUSES } };
    case 'in-progress':
      return { status: 'InProgress' };
    case 'on-hold':
      return { status: 'OnHold' };
    case 'resolved':
      return { status: 'Resolved' };
    case 'closed':
      return { status: 'Closed' };
    case 'active':
      return { status: { in: ACTIVE_STATUSES } };
    default:
      throw new TicketQueryError('Unknown segment');
  }
}

const SEGMENTS = ['all', 'unassigned', 'my-tickets', 'in-progress', 'on-hold', 'critical', 'resolved', 'closed'];

/**
 * Parses query parameters into a Prisma `where` (excluding the segment) plus options.
 * Supported filters: q, status, priority, departmentId, assignedToId ('unassigned'|'me'|id),
 * ticketNumber, subject, requesterEmail, dateFrom, dateTo, hasSla, hasCsat, segment.
 */
function parseTicketQuery(query = {}, currentUser = {}) {
  const and = [];
  const q = text(query.q, 'q');
  if (q) {
    and.push({
      OR: [
        { ticketNumber: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { requesterEmail: { contains: q, mode: 'insensitive' } },
        { requesterName: { contains: q, mode: 'insensitive' } }
      ]
    });
  }
  for (const field of ['ticketNumber', 'subject', 'requesterEmail']) {
    const value = text(query[field], field);
    if (value) and.push({ [field]: { contains: value, mode: 'insensitive' } });
  }

  const statuses = list(query.status, 'status', VALID_STATUSES);
  if (statuses) and.push({ status: { in: statuses } });
  const priorities = list(query.priority, 'priority', VALID_PRIORITIES);
  if (priorities) {
    // "VeryHigh" and the legacy "Critical" are the same urgency level.
    const expanded = priorities.flatMap(p => (URGENT_PRIORITIES.includes(p) ? URGENT_PRIORITIES : [p]));
    and.push({ priority: { in: [...new Set(expanded)] } });
  }

  const departmentIds = list(query.departmentId, 'departmentId');
  if (departmentIds) and.push({ departmentId: { in: departmentIds } });

  const assignees = list(query.assignedToId, 'assignedToId');
  if (assignees) {
    const ids = assignees.map(id => (id === 'me' ? currentUser.id : id)).filter(id => id && id !== 'unassigned');
    const options = [];
    if (assignees.includes('unassigned')) options.push({ assignedToId: null });
    if (ids.length) options.push({ assignedToId: { in: ids } });
    and.push(options.length === 1 ? options[0] : { OR: options });
  }

  const createdAt = {};
  const dateFrom = date(query.dateFrom, 'dateFrom');
  const dateTo = date(query.dateTo, 'dateTo', true);
  if (dateFrom) createdAt.gte = dateFrom;
  if (dateTo) createdAt.lte = dateTo;
  if (Object.keys(createdAt).length) and.push({ createdAt });

  if (query.hasSla === 'true') {
    and.push({ OR: [{ responseDueAt: { not: null } }, { slaDueAt: { not: null } }] });
  }
  if (query.hasCsat === 'true') and.push({ csatResponses: { some: {} } });

  const segment = text(query.segment, 'segment', 20);
  if (segment && !SEGMENTS.includes(segment) && segment !== 'active') {
    throw new TicketQueryError('Unknown segment');
  }

  const sortBy = text(query.sortBy, 'sortBy', 30) || 'createdAt';
  if (!SORTABLE_FIELDS.has(sortBy)) throw new TicketQueryError('sortBy is not supported');
  const sortOrder = text(query.sortOrder, 'sortOrder', 4) || 'desc';
  if (!['asc', 'desc'].includes(sortOrder)) throw new TicketQueryError('sortOrder must be asc or desc');

  return {
    baseWhere: and.length ? { AND: and } : {},
    segment: segment || 'all',
    orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
    page: positiveInt(query.page, 'page', 1, 1000000),
    pageSize: positiveInt(query.pageSize, 'pageSize', DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
  };
}

function combineWhere(baseWhere, extra) {
  const parts = [baseWhere, extra].filter(part => part && Object.keys(part).length);
  if (!parts.length) return {};
  return parts.length === 1 ? parts[0] : { AND: parts };
}

module.exports = {
  ACTIVE_STATUSES,
  URGENT_PRIORITIES,
  MAX_EXPORT_ROWS,
  SEGMENTS,
  TicketQueryError,
  combineWhere,
  parseTicketQuery,
  segmentWhere
};
