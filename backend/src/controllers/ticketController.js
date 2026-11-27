const { resolveUploadPath, removeUploadFile } = require('../services/uploadStorage');
const { sendEmail, sendTicketReply } = require('../services/emailService');
const { createTicketNotification } = require('../services/notificationService');
const { auditLog } = require('../middleware/security');
const {
  ACTIVE_TICKET_STATUSES,
  VALID_TICKET_STATUSES,
  isValidTicketStatusTransition
} = require('../services/ticketStatus');
const {
  getConfiguredTicketSlaDeadlines,
  getActiveOverdueDeadline,
  getTicketSlaChecks,
  isActiveTicketOverdue
} = require('../services/slaService');
const prisma = require('../lib/prisma');
const { normalizePriority, normalizeStatus } = require('../services/ticketEnums');
const { createTicketWithNumber } = require('../services/ticketNumber');
const {
  ACTIVE_STATUSES,
  MAX_EXPORT_ROWS,
  SEGMENTS,
  TicketQueryError,
  URGENT_PRIORITIES,
  combineWhere,
  parseTicketQuery,
  segmentWhere
} = require('../services/ticketQuery');

function decorateTicket(ticket) {
  if (!ticket) return ticket;
  const isOverdue = isActiveTicketOverdue(ticket);
  const dueAt = getActiveOverdueDeadline(ticket);
  return {
    ...ticket,
    isOverdue,
    overdueMinutes: isOverdue ? Math.floor((Date.now() - dueAt.getTime()) / 60000) : 0
  };
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

function cleanFilename(value) {
  return String(value || 'attachment')
    .split(/[\\/]/)
    .pop()
    .replace(/[^a-zA-Z0-9._ -]/g, '_')
    .slice(0, 180) || 'attachment';
}

exports.createTicket = async (req, res) => {
  try {
    const { subject, description, requesterEmail, senderEmail, senderName, departmentId, category, priority } = req.body || {};
    if ([subject, description, requesterEmail, senderEmail, senderName, departmentId, category, priority]
      .some(value => value != null && typeof value !== 'string')) {
      return res.status(400).json({ success: false, message: 'Ticket fields must be text' });
    }
    const email = cleanText(requesterEmail || senderEmail, 254).toLowerCase();
    const name = senderName ? cleanText(senderName, 160) : null;
    const safeSubject = cleanText(subject, 255);
    const safeDescription = cleanText(description, 10000);
    if (!subject || !description || !email) {
      return res.status(400).json({ success: false, message: 'Subject, description, and requester email are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'A valid requester email is required' });
    }
    if (safeSubject.length < 3 || safeDescription.length < 5) {
      return res.status(400).json({ success: false, message: 'Ticket subject or description is too short' });
    }
    const normalizedPriority = normalizePriority(priority);
if (priority && !normalizedPriority) {
      return res.status(400).json({ success: false, message: 'Invalid priority' });
    }
    const resolvedPriorityInput = normalizedPriority || undefined;
    let existingUser = null;
    let createdById = null;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: email },
        select: { id: true, departmentId: true }
      });
      if (existingUser) {
        createdById = existingUser.id;
      }
    } catch (userError) {
      auditLog('ticket.user_lookup_failed', { requestId: req.id, error: userError.message });
    }
    let resolvedDepartmentId = departmentId || null;
    if (!resolvedDepartmentId && existingUser?.departmentId) {
      resolvedDepartmentId = existingUser.departmentId;
    }
    if (!resolvedDepartmentId && email) {
      try {
        const departments = await prisma.department.findMany();
        resolvedDepartmentId = departments.length > 0 ? departments[0].id : null;
      } catch (deptError) {
        auditLog('ticket.department_lookup_failed', { requestId: req.id, error: deptError.message });
      }
    }
    if (resolvedDepartmentId) {
      const departmentExists = await prisma.department.findUnique({
        where: { id: resolvedDepartmentId },
        select: { id: true }
      });
      if (!departmentExists) {
        return res.status(400).json({ success: false, message: 'Selected department does not exist' });
      }
    }

    // Get system settings for defaults
    const settings = await prisma.systemSettings.findFirst();
    const resolvedPriority = resolvedPriorityInput || normalizePriority(settings ? settings.defaultPriority : null) || 'Medium';
    const resolvedCategory = cleanText(category, 120) || settings?.defaultCategory || 'General Issues';
    const createdAt = new Date();
    const slaDeadlines = await getConfiguredTicketSlaDeadlines(prisma, resolvedCategory, resolvedPriority, createdAt);
    const ticket = await createTicketWithNumber(ticketNumber => prisma.ticket.create({
      data: {
        ticketNumber,
        subject: safeSubject,
        description: safeDescription,
        requesterEmail: email,
        requesterName: name,
        category: resolvedCategory,
        priority: resolvedPriority,
        status: normalizeStatus(settings?.defaultStatus) || 'Open',
        departmentId: resolvedDepartmentId,
        createdById: createdById,
        createdAt,
        responseDueAt: slaDeadlines.responseDueAt,
        slaDueAt: slaDeadlines.slaDueAt,
        slaEscalationAt: slaDeadlines.slaEscalationAt,
        slaResponseTargetPercent: slaDeadlines.slaResponseTargetPercent,
        slaResolutionTargetPercent: slaDeadlines.slaResolutionTargetPercent,
        slaBreached: false
      },
      include: { department: true }
    }));
    auditLog('ticket.created', { requestId: req.id, ticketNumber: ticket.ticketNumber, email });
    try {
      const emailResult = await sendEmail(email, 'ticketCreated', ticket);
      if (emailResult.success && emailResult.messageId) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { emailMessageId: emailResult.messageId }
        });
      }
    } catch (emailError) {
      auditLog('ticket.confirmation_email_failed', { requestId: req.id, ticketNumber: ticket.ticketNumber, error: emailError.message });
    }
    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt,
        responseDueAt: ticket.responseDueAt,
        slaDueAt: ticket.slaDueAt,
        slaEscalationAt: ticket.slaEscalationAt
      }
    });
  } catch (error) {
    console.error('Error creating ticket:', { requestId: req.id, message: error.message });
    return res.status(500).json({ success: false, message: 'Failed to create ticket' });
  }
};

// Google Workspace Add-on: a requester's recent tickets (API-key protected; the add-on
// supplies the signed-in Gmail user's address from Session.getActiveUser()).
exports.getRequesterTickets = async (req, res) => {
  try {
    const email = typeof req.query.email === 'string' ? cleanText(req.query.email, 254).toLowerCase() : '';
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'A valid requester email is required' });
    }
    const tickets = await prisma.ticket.findMany({
      where: { requesterEmail: { equals: email, mode: 'insensitive' } },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        priority: true,
        category: true,
        createdAt: true,
        resolvedAt: true,
        csatResponses: { select: { id: true }, take: 1 }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return res.json({
      success: true,
      tickets: tickets.map(({ csatResponses, ...ticket }) => ({ ...ticket, csatRated: csatResponses.length > 0 }))
    });
  } catch (error) {
    console.error('Error fetching requester tickets:', { requestId: req.id, message: error.message });
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
};

// Google Workspace Add-on: requester satisfaction rating for their own resolved ticket.
exports.submitRequesterCsat = async (req, res) => {
  try {
    const { ticketId, comment } = req.body || {};
    const requesterEmail = typeof req.body?.requesterEmail === 'string' ? req.body.requesterEmail.trim().toLowerCase() : '';
    const rating = Number(req.body?.rating);
    if (typeof ticketId !== 'string' || !ticketId || !isValidEmail(requesterEmail) ||
        !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Ticket, requester email and a rating from 1 to 5 are required' });
    }
    if (comment != null && typeof comment !== 'string') {
      return res.status(400).json({ success: false, message: 'Comment must be text' });
    }
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true, requesterEmail: true }
    });
    if (!ticket || ticket.requesterEmail.toLowerCase() !== requesterEmail) {
      return res.status(404).json({ success: false, message: 'Ticket not found for this requester' });
    }
    if (!['Resolved', 'Closed'].includes(ticket.status)) {
      return res.status(409).json({ success: false, message: 'Feedback is available after a ticket is resolved' });
    }
    const requester = await prisma.user.findUnique({ where: { email: requesterEmail }, select: { id: true } });
    const { recordRequesterCsat } = require('./operationsController');
    const result = await recordRequesterCsat({ ticket, rating, comment, userId: requester?.id || null });
    return res.json({ success: true, response: result.response, ticketStatus: result.ticketStatus });
  } catch (error) {
    console.error('Error recording requester CSAT:', { requestId: req.id, message: error.message });
    return res.status(500).json({ success: false, message: 'Failed to save feedback' });
  }
};

const TICKET_LIST_INCLUDE = {
  department: { select: { id: true, name: true, code: true } },
  assignedTo: { select: { id: true, name: true, email: true, department: { select: { id: true, name: true } } } },
  createdBy: { select: { id: true, name: true, email: true } },
  csatResponses: { select: { id: true }, take: 1 },
  _count: { select: { comments: true } }
};

function serializeListTicket({ csatResponses, ...ticket }) {
  return { ...decorateTicket(ticket), csatRated: csatResponses.length > 0 };
}

function sendQueryError(res, error, fallbackMessage) {
  if (error instanceof TicketQueryError) {
    return res.status(400).json({ success: false, message: error.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ success: false, message: fallbackMessage });
}

// Paginated, server-filtered ticket list. Segment counts use the same filters
// (minus the segment) so the tab badges always match what each tab would show.
exports.getAllTickets = async (req, res) => {
  try {
    const query = parseTicketQuery(req.query, req.user);
    const where = combineWhere(query.baseWhere, segmentWhere(query.segment, req.user.id));
    const [total, tickets, counts] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        include: TICKET_LIST_INCLUDE,
        orderBy: query.orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      Promise.all(SEGMENTS.map(segment => prisma.ticket.count({
        where: combineWhere(query.baseWhere, segmentWhere(segment, req.user.id))
      })))
    ]);

    return res.json({
      success: true,
      tickets: tickets.map(serializeListTicket),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize))
      },
      segmentCounts: Object.fromEntries(SEGMENTS.map((segment, index) => [segment, counts[index]]))
    });
  } catch (error) {
    return sendQueryError(res, error, 'Failed to fetch tickets');
  }
};

// Same filters as the list, for CSV export; bounded so one request cannot load everything.
exports.exportTickets = async (req, res) => {
  try {
    const query = parseTicketQuery(req.query, req.user);
    const where = combineWhere(query.baseWhere, segmentWhere(query.segment, req.user.id));
    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          status: true,
          priority: true,
          category: true,
          requesterEmail: true,
          createdAt: true,
          updatedAt: true,
          resolvedAt: true,
          department: { select: { name: true } },
          assignedTo: { select: { name: true, department: { select: { name: true } } } }
        },
        orderBy: query.orderBy,
        take: MAX_EXPORT_ROWS
      })
    ]);
    return res.json({ success: true, tickets, total, truncated: total > tickets.length, limit: MAX_EXPORT_ROWS });
  } catch (error) {
    return sendQueryError(res, error, 'Failed to export tickets');
  }
};

function dateKeyInTimezone(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.TICKET_TIMEZONE || 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

// Dashboard aggregates computed in the database (no full ticket download).
exports.getOverview = async (req, res) => {
  try {
    const timeZone = process.env.TICKET_TIMEZONE || 'Africa/Nairobi';
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(now.getTime() - (6 - index) * 24 * 60 * 60 * 1000);
      return {
        key: dateKeyInTimezone(day),
        date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone }),
        created: 0,
        resolved: 0,
        closed: 0
      };
    });
    const windowStart = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

    const [total, statusGroups, slaCount, csatCount, trendRows, departmentRows, watchlist, staffGroups] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.ticket.count({ where: { OR: [{ responseDueAt: { not: null } }, { slaDueAt: { not: null } }] } }),
      prisma.ticket.count({ where: { csatResponses: { some: {} } } }),
      prisma.$queryRaw`
        SELECT 'created' AS metric, to_char("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone}, 'YYYY-MM-DD') AS day, count(*)::int AS count
          FROM "Ticket" WHERE "createdAt" >= ${windowStart} GROUP BY 2
        UNION ALL
        SELECT 'resolved', to_char("resolvedAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone}, 'YYYY-MM-DD'), count(*)::int
          FROM "Ticket" WHERE "resolvedAt" >= ${windowStart} GROUP BY 2
        UNION ALL
        SELECT 'closed', to_char("closedAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone}, 'YYYY-MM-DD'), count(*)::int
          FROM "Ticket" WHERE "closedAt" >= ${windowStart} GROUP BY 2`,
      prisma.$queryRaw`
        SELECT COALESCE(ad.name, td.name) AS name,
               count(*)::int AS total,
               count(*) FILTER (WHERE t.status IN ('Resolved', 'Closed'))::int AS resolved
          FROM "Ticket" t
          LEFT JOIN "User" u ON u.id = t."assignedToId"
          LEFT JOIN "Department" ad ON ad.id = u."departmentId"
          LEFT JOIN "Department" td ON td.id = t."departmentId"
         WHERE COALESCE(ad.name, td.name) IS NOT NULL
         GROUP BY 1 ORDER BY total DESC LIMIT 6`,
      prisma.ticket.findMany({
        where: { status: { in: ACTIVE_STATUSES } },
        select: { id: true, ticketNumber: true, subject: true, priority: true, status: true, createdAt: true },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        take: 5
      }),
      prisma.ticket.groupBy({
        by: ['assignedToId', 'status'],
        where: { assignedToId: { not: null } },
        _count: { _all: true }
      })
    ]);

    const byStatus = Object.fromEntries(['Open', 'InProgress', 'OnHold', 'Resolved', 'Closed'].map(status => [status, 0]));
    statusGroups.forEach(group => { byStatus[group.status] = group._count._all; });

    const dayIndex = new Map(days.map(day => [day.key, day]));
    trendRows.forEach(row => {
      const day = dayIndex.get(row.day);
      if (day) day[row.metric] = row.count;
    });

    const staff = new Map();
    staffGroups.forEach(group => {
      const entry = staff.get(group.assignedToId) || { userId: group.assignedToId, open: 0, resolved: 0, total: 0 };
      entry.total += group._count._all;
      if (['Resolved', 'Closed'].includes(group.status)) entry.resolved += group._count._all;
      else entry.open += group._count._all;
      staff.set(group.assignedToId, entry);
    });
    const topStaff = [...staff.values()].sort((a, b) => b.resolved - a.resolved).slice(0, 5);
    const staffNames = await prisma.user.findMany({
      where: { id: { in: topStaff.map(entry => entry.userId) } },
      select: { id: true, name: true }
    });
    const nameById = new Map(staffNames.map(user => [user.id, user.name]));

    const rate = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
    return res.json({
      success: true,
      overview: {
        total,
        byStatus,
        active: byStatus.Open + byStatus.InProgress + byStatus.OnHold,
        withSla: slaCount,
        withCsat: csatCount,
        trendData: days.map(({ key, ...day }) => day),
        departments: departmentRows.map(row => ({ ...row, open: row.total - row.resolved, rate: rate(row.resolved, row.total) })),
        priorityWatchlist: watchlist,
        staffLeaderboard: topStaff.map(entry => ({
          ...entry,
          name: nameById.get(entry.userId) || 'Unknown',
          rate: rate(entry.resolved, entry.total)
        }))
      }
    });
  } catch (error) {
    console.error('Error building ticket overview:', error);
    return res.status(500).json({ success: false, message: 'Failed to load ticket overview' });
  }
};

function emptyWorkload() {
  return { total: 0, open: 0, inProgress: 0, onHold: 0, resolved: 0, closed: 0, critical: 0, unclaimed: 0 };
}

const STATUS_KEYS = { Open: 'open', InProgress: 'inProgress', OnHold: 'onHold', Resolved: 'resolved', Closed: 'closed' };

// Per-department and per-officer ticket counts for the Departments screen.
// A department's tickets are those routed to it or assigned to one of its officers.
exports.getWorkload = async (req, res) => {
  try {
    const [departmentRows, userGroups, userCritical] = await Promise.all([
      prisma.$queryRaw`
        SELECT d.id AS "departmentId", t.status::text AS status,
               count(*)::int AS count,
               count(*) FILTER (WHERE t.priority IN ('VeryHigh', 'Critical') AND t.status IN ('Open', 'InProgress', 'OnHold'))::int AS critical,
               count(*) FILTER (WHERE t."assignedToId" IS NULL)::int AS unclaimed
          FROM "Department" d
          JOIN "Ticket" t ON t."departmentId" = d.id
            OR t."assignedToId" IN (SELECT u.id FROM "User" u WHERE u."departmentId" = d.id)
         GROUP BY d.id, t.status`,
      prisma.ticket.groupBy({ by: ['assignedToId', 'status'], where: { assignedToId: { not: null } }, _count: { _all: true } }),
      prisma.ticket.groupBy({
        by: ['assignedToId'],
        where: { assignedToId: { not: null }, priority: { in: URGENT_PRIORITIES }, status: { in: ACTIVE_STATUSES } },
        _count: { _all: true }
      })
    ]);

    const departments = {};
    departmentRows.forEach(row => {
      const entry = departments[row.departmentId] || (departments[row.departmentId] = emptyWorkload());
      entry.total += row.count;
      entry[STATUS_KEYS[row.status]] += row.count;
      entry.critical += row.critical;
      entry.unclaimed += row.unclaimed;
    });

    const users = {};
    userGroups.forEach(group => {
      const entry = users[group.assignedToId] || (users[group.assignedToId] = emptyWorkload());
      entry.total += group._count._all;
      entry[STATUS_KEYS[group.status]] += group._count._all;
    });
    userCritical.forEach(group => {
      (users[group.assignedToId] || (users[group.assignedToId] = emptyWorkload())).critical = group._count._all;
    });

    const activeTotal = await prisma.ticket.count({ where: { status: { in: ACTIVE_STATUSES } } });
    return res.json({ success: true, workload: { departments, users, activeTotal } });
  } catch (error) {
    console.error('Error building workload:', error);
    return res.status(500).json({ success: false, message: 'Failed to load workload' });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        department: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        comments: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
          orderBy: { createdAt: 'asc' }
        },
        attachments: {
          select: { id: true, filename: true, mimetype: true, size: true, createdAt: true }
        },
        history: { orderBy: { createdAt: 'desc' } }
      }
    });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    return res.json({ success: true, ticket: decorateTicket(ticket) });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedToId, departmentId, category, resolution } = req.body;
    if (status && !VALID_TICKET_STATUSES.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket status' });
    }
    const normalizedUpdatePriority = priority ? normalizePriority(priority) : null;
    if (priority && !normalizedUpdatePriority) {
      return res.status(400).json({ success: false, message: 'Invalid ticket priority' });
    }
    const userId = req.user?.id;
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    if (status && !isValidTicketStatusTransition(existing.status, status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change ticket status from ${existing.status} to ${status}`
      });
    }
    const updateData = {};
    const historyEntries = [];
    if (status && status !== existing.status) {
      updateData.status = status;
      historyEntries.push({ field: 'status', oldValue: existing.status, newValue: status });
      if ((status === 'Resolved' || status === 'Closed') && !existing.resolutionTime) {
        const resolvedAt = new Date();
        updateData.resolutionTime = Math.floor((resolvedAt - new Date(existing.createdAt)) / 60000);
        if (!existing.firstRespondedAt) {
          updateData.firstRespondedAt = resolvedAt;
          updateData.responseTime = updateData.resolutionTime;
        }
      }
      if (status === 'Resolved') {
        updateData.resolvedAt = new Date();
      }
      if (status === 'Closed') {
        updateData.closedAt = new Date();
        if (!existing.resolvedAt) updateData.resolvedAt = new Date();
      }
      if (status === 'Open' || status === 'InProgress') {
        updateData.resolvedAt = null;
        updateData.closedAt = null;
      }
    }
    if (normalizedUpdatePriority && normalizedUpdatePriority !== existing.priority) {
      updateData.priority = normalizedUpdatePriority;
      historyEntries.push({ field: 'priority', oldValue: existing.priority, newValue: normalizedUpdatePriority });
    }
    if (assignedToId !== undefined && assignedToId !== existing.assignedToId) {
      if (assignedToId) {
        const assignee = await prisma.user.findUnique({
          where: { id: assignedToId },
          select: { id: true, role: true }
        });
        if (!assignee || !['staff', 'admin'].includes(assignee.role)) {
          return res.status(400).json({ success: false, message: 'Ticket can only be claimed by ICT staff or administrators' });
        }
      }
      updateData.assignedToId = assignedToId || null;
      historyEntries.push({ field: 'assignedTo', oldValue: existing.assignedToId, newValue: assignedToId });
      if (assignedToId && existing.status === 'Open' && status === undefined) {
        updateData.status = 'InProgress';
        historyEntries.push({ field: 'status', oldValue: existing.status, newValue: 'InProgress' });
      }
    }
    if (departmentId && departmentId !== existing.departmentId) {
      const departmentExists = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true }
      });
      if (!departmentExists) {
        return res.status(400).json({ success: false, message: 'Selected department does not exist' });
      }
      updateData.departmentId = departmentId;
      historyEntries.push({ field: 'department', oldValue: existing.departmentId, newValue: departmentId });
    }
    if (category !== undefined) {
      const safeCategory = cleanText(category, 120);
      if (!safeCategory) {
        return res.status(400).json({ success: false, message: 'Category cannot be empty' });
      }
      if (safeCategory !== existing.category) {
        updateData.category = safeCategory;
        historyEntries.push({ field: 'category', oldValue: existing.category, newValue: safeCategory });
      }
    }
    if ((updateData.status || status) === 'Open') {
      updateData.assignedToId = null;
      if (existing.assignedToId) {
        historyEntries.push({ field: 'assignedTo', oldValue: existing.assignedToId, newValue: '' });
      }
    }
    if (existing.slaDueAt || existing.responseDueAt) {
      const currentTime = new Date();
      const nextStatus = updateData.status || existing.status;
      const firstRespondedAt = updateData.firstRespondedAt || existing.firstRespondedAt;
      const responseBreached = existing.responseDueAt && (
        firstRespondedAt
          ? new Date(firstRespondedAt) > new Date(existing.responseDueAt)
          : currentTime > new Date(existing.responseDueAt)
      );
      const resolvedAt = updateData.resolvedAt || existing.resolvedAt || (nextStatus === 'Closed' ? updateData.closedAt : null);
      const resolutionBreached = existing.slaDueAt && (
        resolvedAt
          ? new Date(resolvedAt) > new Date(existing.slaDueAt)
          : ACTIVE_TICKET_STATUSES.has(nextStatus) && currentTime > new Date(existing.slaDueAt)
      );
      updateData.slaBreached = Boolean(responseBreached || resolutionBreached);
    }
    // resolution field not in schema, skipping
    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: { department: true, assignedTo: { select: { id: true, name: true, email: true } } }
    });
    if (historyEntries.length > 0 && userId) {
      await Promise.all(historyEntries.map(entry =>
        prisma.ticketHistory.create({
          data: { ticketId: id, changedBy: userId, field: entry.field, oldValue: entry.oldValue || '', newValue: entry.newValue || '' }
        })
      ));
    }
    if (status && status !== existing.status) {
      const templateType = status === 'Resolved' ? 'ticketResolved' : 'ticketUpdated';
      await sendEmail(ticket.requesterEmail, templateType, {
        ...ticket,
        emailMessageId: existing.emailMessageId,
        resolutionComment: resolution || ''
      });
    } else if (assignedToId !== undefined && assignedToId !== existing.assignedToId) {
      await sendEmail(ticket.requesterEmail, 'ticketUpdated', {
        ...ticket,
        emailMessageId: existing.emailMessageId,
        comment: `Your ticket has been claimed by ${ticket.assignedTo?.name || 'a support agent'}.`
      });
    }

    const notificationRecipients = new Set();
    if (ticket.status !== existing.status) {
      if (existing.createdById) notificationRecipients.add(existing.createdById);
      const newlyAssignedTo = assignedToId !== undefined && assignedToId !== existing.assignedToId
        ? assignedToId
        : null;
      if (newlyAssignedTo) notificationRecipients.delete(newlyAssignedTo);
      if (ticket.assignedToId && ticket.assignedToId !== newlyAssignedTo) {
        notificationRecipients.add(ticket.assignedToId);
      }
      await Promise.all([...notificationRecipients]
        .filter(recipientId => recipientId !== userId)
        .map(recipientId => createTicketNotification({
          userId: recipientId,
          ticket,
          type: 'status_change',
          title: 'Ticket status updated',
          message: `${ticket.ticketNumber}: status changed from ${existing.status} to ${ticket.status}`
        })));
    }

    if (assignedToId && assignedToId !== existing.assignedToId && assignedToId !== userId) {
      await createTicketNotification({
        userId: assignedToId,
        ticket,
        type: 'assignment',
        title: 'Ticket assigned to you',
        message: `${ticket.ticketNumber}: ${ticket.subject}`
      });
    }
    return res.json({ success: true, ticket: decorateTicket(ticket) });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return res.status(500).json({ success: false, message: 'Failed to update ticket' });
  }
};

exports.escalateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetUserId, escalationType, reason } = req.body;
    const userId = req.user?.id;
    const safeReason = cleanText(reason, 1000);
    const type = escalationType === 'vertical' ? 'vertical' : 'horizontal';

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target officer is required' });
    }

    const [ticket, targetUser] = await Promise.all([
      prisma.ticket.findUnique({ where: { id } }),
      prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, name: true, email: true, role: true } })
    ]);

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (!targetUser) return res.status(404).json({ success: false, message: 'Target officer not found' });
    if (!['staff', 'admin'].includes(targetUser.role)) {
      return res.status(400).json({ success: false, message: 'Escalation target must be ICT staff or an administrator' });
    }
    if (['Resolved', 'Closed'].includes(ticket.status)) {
      return res.status(400).json({ success: false, message: 'Resolved or closed tickets cannot be escalated' });
    }

    const updateData = {
      assignedToId: targetUser.id,
      status: ticket.status === 'Open' ? 'InProgress' : ticket.status
    };

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: { department: true, assignedTo: { select: { id: true, name: true, email: true } }, createdBy: { select: { id: true, name: true, email: true } } }
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId: id,
        changedBy: userId || '',
        field: 'escalation',
        oldValue: ticket.assignedToId || '',
        newValue: `${type}:${targetUser.name}${safeReason ? ` - ${safeReason}` : ''}`
      }
    });

    await prisma.comment.create({
      data: {
        ticketId: id,
        userId: userId || null,
        isInternal: true,
        content: `Escalated ${type} to ${targetUser.name}.${safeReason ? ` Reason: ${safeReason}` : ''}`
      }
    });
await sendEmail(targetUser.email, 'ticketUpdated', {
      ...updated,
      emailMessageId: ticket.emailMessageId,
      comment: `A ticket has been escalated to you: ${updated.ticketNumber} - ${updated.subject}`
    });

    if (targetUser.id !== userId) {
      await createTicketNotification({
        userId: targetUser.id,
        ticket: updated,
        type: 'escalation',
        title: 'Ticket escalated to you',
        message: `${updated.ticketNumber}: ${updated.subject}${safeReason ? ` - ${safeReason}` : ''}`
      });
    }

    return res.json({ success: true, message: 'Ticket escalated successfully', ticket: decorateTicket(updated) });
  } catch (error) {
    console.error('Error escalating ticket:', error);
    return res.status(500).json({ success: false, message: 'Failed to escalate ticket' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isInternal } = req.body;
    const userId = req.user?.id;
    const safeContent = cleanText(content, 10000);
    if (!safeContent) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }
    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        assignedToId: true,
        createdById: true,
        createdAt: true,
        responseTime: true,
        firstRespondedAt: true,
        responseDueAt: true,
        slaDueAt: true,
        slaBreached: true,
        status: true,
        resolvedAt: true,
        closedAt: true
      }
    });
    if (!existingTicket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    const comment = await prisma.comment.create({
      data: { ticketId: id, userId: userId, content: safeContent, isInternal: isInternal === true },
      include: { user: { select: { id: true, name: true, email: true, role: true } } }
    });
    if (!comment.isInternal && ['staff', 'admin'].includes(comment.user?.role) && !existingTicket.firstRespondedAt) {
      const respondedAt = comment.createdAt || new Date();
      await prisma.ticket.update({
        where: { id },
        data: {
          firstRespondedAt: respondedAt,
          slaBreached: existingTicket.slaBreached || getTicketSlaChecks({
            ...existingTicket,
            firstRespondedAt: respondedAt
          }, respondedAt).some(check => !check),
          responseTime: Math.floor((respondedAt - new Date(existingTicket.createdAt)) / 60000)
        }
      });
    }
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { assignedTo: { select: { id: true, name: true, email: true } } }
    });
    if (ticket && !comment.isInternal) {
      const emailResult = await sendTicketReply(ticket, safeContent);
      if (!ticket.emailMessageId && emailResult.success && emailResult.messageId) {
        await prisma.ticket.update({
          where: { id },
          data: { emailMessageId: emailResult.messageId }
        });
      }
    }

    const recipients = new Set([existingTicket.assignedToId, existingTicket.createdById].filter(Boolean));
    const commentAuthorName = comment.user?.name || 'Someone';
    await Promise.all([...recipients]
      .filter(recipientId => recipientId !== userId)
      .map(recipientId => createTicketNotification({
        userId: recipientId,
        ticket: existingTicket,
        type: 'comment',
        title: 'New ticket comment',
        message: `${commentAuthorName} commented on ${existingTicket.ticketNumber}: ${safeContent.slice(0, 180)}`
      })));

    return res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

exports.addAttachment = async (req, res) => {
  let uploadedPath;
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Attachment file is required' });
    }
    uploadedPath = req.file.path;
    const settings = await prisma.systemSettings.findFirst({ select: { maxFileSize: true } });
    if (settings?.maxFileSize && req.file.size > settings.maxFileSize) {
      await removeUploadFile(uploadedPath, req.id);
      return res.status(413).json({
        success: false,
        message: `Attachment exceeds the ${Math.round(settings.maxFileSize / (1024 * 1024))} MB limit`
      });
    }
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      await removeUploadFile(uploadedPath, req.id);
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const originalName = cleanFilename(req.file.originalname);
    const attachment = await prisma.$transaction(async tx => {
      const savedAttachment = await tx.attachment.create({
        data: {
          ticketId: id,
          filename: originalName,
          filepath: req.file.filename,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: id,
          field: 'attachment',
          oldValue: '',
          newValue: originalName,
          changedBy: req.user?.id || ''
        }
      });

      return savedAttachment;
    });
    uploadedPath = null;

    res.status(201).json({
      success: true,
      attachment: {
        id: attachment.id,
        filename: attachment.filename,
        mimetype: attachment.mimetype,
        size: attachment.size,
        createdAt: attachment.createdAt
      }
    });
  } catch (error) {
    if (uploadedPath) await removeUploadFile(uploadedPath, req.id);
    console.error('Error adding attachment:', error);
    res.status(500).json({ success: false, message: 'Failed to add attachment' });
  }
};

exports.downloadAttachment = async (req, res) => {
  try {
    const attachment = await prisma.attachment.findFirst({
      where: { id: req.params.attachmentId, ticketId: req.params.id }
    });
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    const filePath = resolveUploadPath(attachment.filepath);
    if (!filePath) {
      console.error('Attachment path is outside the configured upload directory:', {
        requestId: req.id,
        attachmentId: attachment.id
      });
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    return res.download(filePath, cleanFilename(attachment.filename), error => {
      if (!error) return;
      console.error('Attachment download failed:', {
        requestId: req.id,
        attachmentId: attachment.id,
        message: error.message
      });
      if (!res.headersSent) {
        res.status(error.code === 'ENOENT' ? 404 : 500).json({
          success: false,
          message: error.code === 'ENOENT' ? 'Attachment not found' : 'Failed to download attachment'
        });
      }
    });
  } catch (error) {
    console.error('Attachment lookup failed:', { requestId: req.id, message: error.message });
    return res.status(500).json({ success: false, message: 'Failed to download attachment' });
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const [total, open, inProgress, resolved, closed, onHold, critical, overdue] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'Open' } }),
      prisma.ticket.count({ where: { status: 'InProgress' } }),
      prisma.ticket.count({ where: { status: 'Resolved' } }),
      prisma.ticket.count({ where: { status: 'Closed' } }),
      prisma.ticket.count({ where: { status: 'OnHold' } }),
      prisma.ticket.count({ where: { priority: { in: ['VeryHigh', 'Critical'] }, status: { notIn: ['Resolved', 'Closed'] } } }),
      prisma.ticket.count({
        where: {
          status: { in: [...ACTIVE_TICKET_STATUSES] },
          OR: [
            { slaDueAt: { lt: new Date() }, resolvedAt: null },
            { responseDueAt: { lt: new Date() }, firstRespondedAt: null }
          ]
        }
      })
    ]);
    return res.json({
      success: true,
      statistics: {
        total,
        open,
        inProgress,
        resolved,
        closed,
        onHold,
        critical,
        totalTickets: total,
        openTickets: open,
        inProgressTickets: inProgress,
        resolvedTickets: resolved,
        closedTickets: closed,
        onHoldTickets: onHold,
        criticalTickets: critical,
        overdueTickets: overdue,
        assignedTickets: await prisma.ticket.count({ where: { assignedToId: { not: null } } })
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};
