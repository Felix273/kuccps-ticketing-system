const {
  CSAT_SATISFIED_MIN_RATING,
  calculateSatisfactionRate,
  verifyCsatToken
} = require('../services/csatService');
const {
  SLA_DEFAULT_POLICIES,
  calculateSlaCompliance,
  getActiveOverdueDeadline,
  isActiveTicketOverdue,
  resetSlaPoliciesToDefaults,
  saveSlaPolicyUpdates,
  validateSlaPolicyUpdates
} = require('../services/slaService');
const prisma = require('../lib/prisma');
const { normalizePriority } = require('../services/ticketEnums');

const OPEN_STATUSES = new Set(['Open', 'InProgress', 'OnHold']);
const RESOLVED_STATUSES = new Set(['Resolved', 'Closed']);

function hoursBetween(start, end = new Date()) {
  return Math.max(0, Math.round((end.getTime() - new Date(start).getTime()) / 360_000) / 10);
}

function getTerms(value) {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'has', 'are', 'was', 'were',
    'you', 'your', 'issue', 'ticket', 'request', 'please', 'kindly', 'error', 'problem'
  ]);
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !stopWords.has(term));
}

function getDepartmentName(ticket) {
  return ticket.department?.name || ticket.assignedTo?.department?.name || 'Unmapped';
}

function getNextSlaDeadline(ticket) {
  const deadlines = [];
  if (ticket.responseDueAt && !ticket.firstRespondedAt) deadlines.push(new Date(ticket.responseDueAt));
  if (ticket.slaDueAt && !ticket.resolvedAt) deadlines.push(new Date(ticket.slaDueAt));
  return deadlines.sort((left, right) => left - right)[0] || null;
}

function buildAiInsights(tickets, users) {
  const now = new Date();
  const activeTickets = tickets.filter(ticket => OPEN_STATUSES.has(ticket.status));
  const resolvedTickets = tickets.filter(ticket => RESOLVED_STATUSES.has(ticket.status));
  const highPriorityActive = activeTickets.filter(ticket => ['High', 'VeryHigh', 'Critical'].includes(ticket.priority));
  const overdueTickets = activeTickets.filter(ticket => isActiveTicketOverdue(ticket, now));
  const dueSoonTickets = activeTickets.filter(ticket => {
    const dueAt = getNextSlaDeadline(ticket);
    if (!dueAt) return false;
    const minutesRemaining = (dueAt.getTime() - now.getTime()) / 60_000;
    return minutesRemaining >= 0 && minutesRemaining <= 240;
  });

  const categoryCounts = {};
  const departmentCounts = {};
  const requesterCounts = {};
  const termCounts = {};
  const workloadByAgent = {};
  const resolutionByCategory = {};
  const responseByCategory = {};

  tickets.forEach(ticket => {
    const category = ticket.category || 'Uncategorised';
    const department = getDepartmentName(ticket);
    const requester = ticket.requesterEmail || 'Unknown';

    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    departmentCounts[department] = (departmentCounts[department] || 0) + 1;
    requesterCounts[requester] = (requesterCounts[requester] || 0) + 1;

    getTerms(`${ticket.subject} ${ticket.description}`).forEach(term => {
      termCounts[term] = (termCounts[term] || 0) + 1;
    });

    if (ticket.assignedTo && OPEN_STATUSES.has(ticket.status)) {
      const agentName = ticket.assignedTo.name || ticket.assignedTo.email;
      if (!workloadByAgent[agentName]) {
        workloadByAgent[agentName] = {
          agent: agentName,
          department: ticket.assignedTo.department?.name || 'Unmapped',
          active: 0,
          highPriority: 0,
          overdue: 0
        };
      }
      workloadByAgent[agentName].active += 1;
      if (['High', 'VeryHigh', 'Critical'].includes(ticket.priority)) workloadByAgent[agentName].highPriority += 1;
      if (isActiveTicketOverdue(ticket, now)) workloadByAgent[agentName].overdue += 1;
    }

    if (ticket.resolutionTime != null) {
      if (!resolutionByCategory[category]) resolutionByCategory[category] = [];
      resolutionByCategory[category].push(ticket.resolutionTime);
    }

    if (ticket.responseTime != null) {
      if (!responseByCategory[category]) responseByCategory[category] = [];
      responseByCategory[category].push(ticket.responseTime);
    }
  });

  const recurringIssues = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: tickets.length ? Math.round((count / tickets.length) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const departmentTrends = Object.entries(departmentCounts)
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const repeatedRequesters = Object.entries(requesterCounts)
    .map(([email, count]) => ({ email, count }))
    .filter(item => item.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const commonSignals = Object.entries(termCounts)
    .map(([term, count]) => ({ term, count }))
    .filter(item => item.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const bottlenecks = Object.entries(resolutionByCategory)
    .map(([category, values]) => ({
      category,
      averageResolutionMinutes: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
      resolvedTickets: values.length
    }))
    .sort((a, b) => b.averageResolutionMinutes - a.averageResolutionMinutes)
    .slice(0, 6);

  const slowResponseCategories = Object.entries(responseByCategory)
    .map(([category, values]) => ({
      category,
      averageResponseMinutes: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
      sampleSize: values.length
    }))
    .sort((a, b) => b.averageResponseMinutes - a.averageResponseMinutes)
    .slice(0, 6);

  const workloadBalance = Object.values(workloadByAgent)
    .sort((a, b) => b.active - a.active || b.highPriority - a.highPriority)
    .slice(0, 10);

  const availableAgents = users
    .filter(user => ['staff', 'admin'].includes(user.role))
    .map(user => ({
      id: user.id,
      name: user.name,
      department: user.department?.name || 'Unmapped',
      activeTickets: workloadByAgent[user.name]?.active || 0
    }))
    .sort((a, b) => a.activeTickets - b.activeTickets)
    .slice(0, 5);

  // Tokenise each active ticket once and compare only within the same category.
  const activeTerms = new Map(activeTickets.map(ticket => [
    ticket.id,
    new Set(getTerms(`${ticket.subject} ${ticket.description}`))
  ]));
  const activeByCategory = new Map();
  for (const ticket of activeTickets) {
    if (!activeByCategory.has(ticket.category)) activeByCategory.set(ticket.category, []);
    activeByCategory.get(ticket.category).push(ticket);
  }
  const duplicateSignals = activeTickets
    .map(ticket => {
      const terms = activeTerms.get(ticket.id);
      const related = activeByCategory.get(ticket.category).filter(other => {
        if (other.id === ticket.id) return false;
        const otherTerms = activeTerms.get(other.id);
        let overlap = 0;
        for (const term of terms) {
          if (otherTerms.has(term) && ++overlap >= 3) return true;
        }
        return false;
      });
      return related.length ? {
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        similarActiveTickets: related.length
      } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.similarActiveTickets - a.similarActiveTickets)
    .slice(0, 5);

  const escalationRecommendations = [
    ...overdueTickets.slice(0, 4).map(ticket => ({
      ticketNumber: ticket.ticketNumber,
      reason: `Overdue by ${hoursBetween(getActiveOverdueDeadline(ticket, now), now)} hour(s).`,
      recommendation: ['Critical', 'VeryHigh'].includes(ticket.priority)
        ? 'Escalate vertically to a senior officer and post an internal update.'
        : 'Escalate horizontally to a peer with capacity or notify the department lead.'
    })),
    ...highPriorityActive.filter(ticket => !ticket.assignedToId).slice(0, 4).map(ticket => ({
      ticketNumber: ticket.ticketNumber,
      reason: `${ticket.priority} priority ticket is still unclaimed.`,
      recommendation: 'Claim immediately or assign to the lowest-workload officer in the responsible department.'
    }))
  ].slice(0, 6);

  const executiveSummary = [
    activeTickets.length
      ? `${activeTickets.length} active ticket(s), including ${highPriorityActive.length} high/critical item(s).`
      : 'No active tickets currently require operational attention.',
    overdueTickets.length
      ? `${overdueTickets.length} ticket(s) are overdue and should be reviewed for escalation.`
      : 'No active tickets are currently overdue.',
    recurringIssues[0]
      ? `${recurringIssues[0].category} is the leading category at ${recurringIssues[0].count} ticket(s).`
      : 'Not enough ticket history yet to identify a leading issue category.',
    duplicateSignals.length
      ? `${duplicateSignals.length} possible duplicate or incident cluster(s) detected.`
      : 'No strong duplicate clusters detected from active tickets.'
  ];

  return {
    generatedAt: now.toISOString(),
    executiveSummary,
    slaRisk: {
      overdue: overdueTickets.length,
      dueSoon: dueSoonTickets.length,
      highPriorityActive: highPriorityActive.length,
      highestRiskTickets: activeTickets
        .filter(ticket => ticket.slaDueAt || ticket.responseDueAt || ['High', 'VeryHigh', 'Critical'].includes(ticket.priority))
        .map(ticket => ({
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          priority: ticket.priority,
          status: ticket.status,
          category: ticket.category,
          assignedTo: ticket.assignedTo?.name || 'Unclaimed',
          responseDueAt: ticket.responseDueAt,
          slaDueAt: ticket.slaDueAt,
          ageHours: hoursBetween(ticket.createdAt, now),
          isOverdue: isActiveTicketOverdue(ticket, now)
        }))
        .sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue) || b.ageHours - a.ageHours)
        .slice(0, 8)
    },
    recurringIssues,
    departmentTrends,
    bottlenecks,
    slowResponseCategories,
    workloadBalance,
    availableAgents,
    repeatedRequesters,
    commonSignals,
    duplicateSignals,
    escalationRecommendations,
    knowledgeGaps: recurringIssues
      .filter(issue => issue.count >= 2)
      .slice(0, 5)
      .map(issue => ({
        category: issue.category,
        reason: `${issue.count} ticket(s) exist in this category. Confirm KB coverage and create a deflection article if missing.`
      }))
  };
}

exports.getSlaPolicies = async (req, res) => {
  try {
    const policies = await prisma.slaPolicy.findMany({
      include: { department: true },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }]
    });
    res.json({ success: true, policies });
  } catch (error) {
    console.error('Get SLA policies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch SLA policies' });
  }
};

const MAX_SLA_MINUTES = 365 * 24 * 60;

// Validates SLA policy input; returns { data, error }. `partial` allows omitted fields (updates).
async function validateSlaPolicyInput(body, { partial }) {
  const input = body || {};
  const data = {};
  if (input.name !== undefined || !partial) {
    if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 120) {
      return { error: 'SLA policy name is required (max 120 characters)' };
    }
    data.name = input.name.trim();
  }
  if (input.priority !== undefined) {
    if (input.priority === null || input.priority === '') data.priority = null;
    else {
      data.priority = normalizePriority(input.priority);
      if (!data.priority) return { error: 'Invalid SLA priority' };
    }
  }
  if (input.category !== undefined) {
    if (input.category !== null && typeof input.category !== 'string') return { error: 'Category must be text' };
    data.category = input.category ? input.category.trim().slice(0, 120) : null;
  }
  if (input.departmentId !== undefined) {
    if (input.departmentId) {
      if (typeof input.departmentId !== 'string') return { error: 'Invalid department' };
      const department = await prisma.department.findUnique({ where: { id: input.departmentId }, select: { id: true } });
      if (!department) return { error: 'Selected department does not exist' };
    }
    data.departmentId = input.departmentId || null;
  }
  for (const [field, fallback] of [['responseMinutes', 240], ['resolutionMinutes', 1440]]) {
    if (input[field] === undefined) {
      if (!partial) data[field] = fallback;
      continue;
    }
    const minutes = Number(input[field]);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_SLA_MINUTES) {
      return { error: `${field} must be a whole number of minutes between 1 and ${MAX_SLA_MINUTES}` };
    }
    data[field] = minutes;
  }
  const response = data.responseMinutes;
  const resolution = data.resolutionMinutes;
  if (response !== undefined && resolution !== undefined && response > resolution) {
    return { error: 'Response time cannot be longer than resolution time' };
  }
  if (input.isActive !== undefined) {
    if (typeof input.isActive !== 'boolean') return { error: 'isActive must be true or false' };
    data.isActive = input.isActive;
  } else if (!partial) {
    data.isActive = true;
  }
  return { data };
}

exports.createSlaPolicy = async (req, res) => {
  try {
    const { data, error } = await validateSlaPolicyInput(req.body, { partial: false });
    if (error) return res.status(400).json({ success: false, message: error });
    const policy = await prisma.slaPolicy.create({ data });
    res.status(201).json({ success: true, policy });
  } catch (error) {
    console.error('Create SLA policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to create SLA policy' });
  }
};

exports.updateSlaPolicy = async (req, res) => {
  try {
    const existing = await prisma.slaPolicy.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'SLA policy not found' });
    const { data, error } = await validateSlaPolicyInput(req.body, { partial: true });
    if (error) return res.status(400).json({ success: false, message: error });
    const responseMinutes = data.responseMinutes ?? existing.responseMinutes;
    const resolutionMinutes = data.resolutionMinutes ?? existing.resolutionMinutes;
    if (responseMinutes > resolutionMinutes) {
      return res.status(400).json({ success: false, message: 'Response time cannot be longer than resolution time' });
    }
    const policy = await prisma.slaPolicy.update({ where: { id: existing.id }, data });
    res.json({ success: true, policy });
  } catch (error) {
    console.error('Update SLA policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to update SLA policy' });
  }
};

exports.getSlaTimelines = async (req, res) => {
  try {
    const policies = await prisma.slaPolicy.findMany({
      where: { isSlaDefault: true },
      orderBy: [{ category: 'asc' }, { priority: 'asc' }, { name: 'asc' }]
    });
    const policyOrder = new Map(SLA_DEFAULT_POLICIES.map((policy, index) => [policy.policyKey, index]));
    policies.sort((left, right) =>
      (policyOrder.get(left.policyKey) ?? Number.MAX_SAFE_INTEGER) -
      (policyOrder.get(right.policyKey) ?? Number.MAX_SAFE_INTEGER)
    );
    const audits = await prisma.slaPolicyAudit.findMany({
      where: { policyKey: { in: SLA_DEFAULT_POLICIES.map(policy => policy.policyKey) } },
      include: { policy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    const latestAuditByPolicy = new Map();
    for (const audit of audits) {
      if (!latestAuditByPolicy.has(audit.policyKey)) latestAuditByPolicy.set(audit.policyKey, audit);
    }
    res.json({
      success: true,
      audits,
      policies: policies.map(policy => ({
        ...policy,
        lastUpdatedAt: latestAuditByPolicy.get(policy.policyKey)?.createdAt || policy.updatedAt,
        lastUpdatedBy: latestAuditByPolicy.get(policy.policyKey)?.changedByName || 'SLA defaults'
      }))
    });
  } catch (error) {
    console.error('Get SLA timelines error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch SLA timelines' });
  }
};

exports.updateSlaTimelines = async (req, res) => {
  try {
    const currentPolicies = await prisma.slaPolicy.findMany({ where: { isSlaDefault: true } });
    const validationError = validateSlaPolicyUpdates(req.body?.policies, currentPolicies);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }
    const policies = await saveSlaPolicyUpdates(prisma, req.user, req.body.policies);
    res.json({ success: true, policies });
  } catch (error) {
    console.error('Update SLA timelines error:', error);
    res.status(500).json({ success: false, message: 'Failed to update SLA timelines' });
  }
};

exports.resetSlaTimelines = async (req, res) => {
  try {
    const policies = await resetSlaPoliciesToDefaults(prisma, req.user);
    res.json({ success: true, policies });
  } catch (error) {
    console.error('Reset SLA timelines error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset SLA timelines' });
  }
};

const CSAT_RESPONSE_SELECT = { id: true, rating: true, comment: true, createdAt: true };

/**
 * Records a requester's satisfaction rating once per ticket and closes a Resolved ticket.
 * A comment sent after the rating (the feedback page saves the rating first) is attached
 * to the existing response instead of being discarded.
 */
async function recordRequesterCsat({ ticket, rating, comment, userId }) {
  const safeComment = typeof comment === 'string' ? comment.trim().slice(0, 2000) : '';
  let response = await prisma.csatResponse.findFirst({
    where: { ticketId: ticket.id },
    orderBy: { createdAt: 'desc' },
    select: CSAT_RESPONSE_SELECT
  });
  let alreadyRecorded = Boolean(response);

  if (!response) {
    try {
      response = await prisma.csatResponse.create({
        data: { ticketId: ticket.id, rating, comment: safeComment || null, userId: userId || null },
        select: CSAT_RESPONSE_SELECT
      });
    } catch (error) {
      if (error.code !== 'P2002') throw error;
      // A concurrent submission won the race; use the stored response.
      response = await prisma.csatResponse.findFirst({ where: { ticketId: ticket.id }, select: CSAT_RESPONSE_SELECT });
      alreadyRecorded = true;
    }
  }

  if (alreadyRecorded && safeComment && !response.comment) {
    response = await prisma.csatResponse.update({
      where: { id: response.id },
      data: { comment: safeComment },
      select: CSAT_RESPONSE_SELECT
    });
  }

  let ticketStatus = ticket.status;
  if (ticket.status === 'Resolved') {
    const closed = await prisma.ticket.updateMany({
      where: { id: ticket.id, status: 'Resolved' },
      data: { status: 'Closed', closedAt: new Date() }
    });
    if (closed.count) {
      ticketStatus = 'Closed';
      await prisma.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          field: 'status',
          oldValue: 'Resolved',
          newValue: 'Closed',
          changedBy: userId || 'Requester (CSAT)'
        }
      });
    }
  }

  return { response, alreadyRecorded, ticketStatus };
}

function parseRating(value) {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

exports.createCsatResponse = async (req, res) => {
  try {
    const { ticketId, comment } = req.body || {};
    const numericRating = parseRating(req.body?.rating);
    if (typeof ticketId !== 'string' || !ticketId || !numericRating) {
      return res.status(400).json({ success: false, message: 'Ticket and rating from 1 to 5 are required' });
    }
    if (comment != null && typeof comment !== 'string') {
      return res.status(400).json({ success: false, message: 'Comment must be text' });
    }
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true, requesterEmail: true }
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    // Satisfaction must come from the person who raised the ticket, not from staff.
    if (ticket.requesterEmail.toLowerCase() !== String(req.user.email || '').toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Only the ticket requester can rate this ticket' });
    }
    if (!RESOLVED_STATUSES.has(ticket.status)) {
      return res.status(400).json({ success: false, message: 'Feedback is available after a ticket is resolved' });
    }

    const result = await recordRequesterCsat({ ticket, rating: numericRating, comment, userId: req.user.id });
    res.status(200).json({ success: true, response: result.response, ticketStatus: result.ticketStatus });
  } catch (error) {
    console.error('Create CSAT response error:', error);
    res.status(500).json({ success: false, message: 'Failed to save CSAT response' });
  }
};

exports.getPublicCsat = async (req, res) => {
  try {
    const token = req.query.token;
    if (typeof token !== 'string' || !token) {
      return res.status(400).json({ success: false, message: 'A valid feedback link is required' });
    }

    let payload;
    try {
      payload = verifyCsatToken(token);
    } catch {
      return res.status(400).json({ success: false, message: 'This feedback link is invalid or has expired' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      select: { id: true, ticketNumber: true, requesterEmail: true, status: true }
    });
    if (!ticket || ticket.requesterEmail.toLowerCase() !== payload.requesterEmail.toLowerCase()) {
      return res.status(404).json({ success: false, message: 'Ticket not found for this feedback link' });
    }
    if (!RESOLVED_STATUSES.has(ticket.status)) {
      return res.status(409).json({ success: false, message: 'This ticket is no longer resolved and cannot receive feedback' });
    }

    res.json({
      success: true,
      ticketNumber: ticket.ticketNumber,
      rating: payload.rating
    });
  } catch (error) {
    console.error('Validate public CSAT link error:', error);
    res.status(500).json({ success: false, message: 'Unable to validate this feedback link' });
  }
};

exports.createPublicCsatResponse = async (req, res) => {
  try {
    const { token, comment } = req.body;
    if (typeof token !== 'string' || !token) {
      return res.status(400).json({ success: false, message: 'A valid feedback link is required' });
    }
    if (comment != null && typeof comment !== 'string') {
      return res.status(400).json({ success: false, message: 'Comment must be text' });
    }

    let payload;
    try {
      payload = verifyCsatToken(token);
    } catch {
      return res.status(400).json({ success: false, message: 'This feedback link is invalid or has expired' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      select: { id: true, requesterEmail: true, status: true }
    });
    if (!ticket || ticket.requesterEmail.toLowerCase() !== payload.requesterEmail.toLowerCase()) {
      return res.status(404).json({ success: false, message: 'Ticket not found for this feedback link' });
    }
    if (!RESOLVED_STATUSES.has(ticket.status)) {
      return res.status(409).json({ success: false, message: 'This ticket is no longer resolved and cannot receive feedback' });
    }

    const requester = await prisma.user.findUnique({
      where: { email: ticket.requesterEmail },
      select: { id: true }
    });
    const result = await recordRequesterCsat({
      ticket,
      rating: payload.rating,
      comment,
      userId: requester?.id || null
    });

    res.status(200).json({
      success: true,
      message: result.alreadyRecorded ? 'Feedback already recorded for this ticket' : 'Ticket closed and feedback recorded.',
      response: result.response,
      ticketStatus: result.ticketStatus
    });
  } catch (error) {
    console.error('Create public CSAT response error:', error);
    res.status(500).json({ success: false, message: 'Failed to save your feedback' });
  }
};

// Legacy unsigned rating links (/csat/rate?ticketId=..&rating=..) used to be exchanged here
// for a signed feedback token. Because the signed token also closes the ticket, minting one
// for anyone who knows a ticket ID defeated the signature, so the exchange is retired.
// Current emails always carry signed links (see csatService.ensureWorkingCsatLinks).
exports.handleEmailCsatRate = (req, res) => {
  res.status(410)
    .type('html')
    .send(
      '<!doctype html><meta charset="utf-8"><title>Feedback link expired</title>' +
      '<div style="font-family:Arial,sans-serif;max-width:520px;margin:48px auto;padding:24px;border:1px solid #e4e4e7;border-radius:8px">' +
      '<h2 style="margin-top:0">This feedback link is no longer valid</h2>' +
      '<p>Please use the rating buttons in the most recent resolution email for your ticket, ' +
      'or reply to that email to share your feedback with ICT Support.</p></div>'
    );
};

exports.recordRequesterCsat = recordRequesterCsat;

exports.getDashboardAnalytics = async (req, res) => {
  try {
    const { departmentId, agentId, from, to } = req.query;
    if ([departmentId, agentId, from, to].some(value => value !== undefined && typeof value !== 'string')) {
      return res.status(400).json({ success: false, message: 'Invalid dashboard filter' });
    }
    const createdAt = {};
    for (const [key, value] of [['gte', from], ['lte', to]]) {
      if (!value) continue;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({ success: false, message: `Invalid ${key === 'gte' ? 'from' : 'to'} date` });
      }
      createdAt[key] = date;
    }

    const ticketWhere = {
      ...(Object.keys(createdAt).length ? { createdAt } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(agentId ? { assignedToId: agentId } : {})
    };
    // CSAT figures follow the same filters as the ticket figures.
    const csatWhere = Object.keys(ticketWhere).length ? { ticket: ticketWhere } : {};

    const [
      total, open, inProgress, onHold, resolved, closed,
      csat, csatSatisfiedCount, csatResponses, tickets, users, categoryGroups, slaTickets
    ] = await Promise.all([
      prisma.ticket.count({ where: ticketWhere }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'Open' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'InProgress' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'OnHold' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'Resolved' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'Closed' } }),
      prisma.csatResponse.aggregate({ where: csatWhere, _avg: { rating: true }, _count: { rating: true } }),
      prisma.csatResponse.count({ where: { ...csatWhere, rating: { gte: CSAT_SATISFIED_MIN_RATING } } }),
      prisma.csatResponse.findMany({
        where: csatWhere,
        select: { ticketId: true },
        distinct: ['ticketId']
      }),
      prisma.ticket.findMany({
        where: ticketWhere,
        include: {
          department: true,
          assignedTo: { include: { department: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 1000
      }),
      prisma.user.findMany({
        where: { role: { in: ['staff', 'admin'] } },
        select: { id: true, name: true, role: true, department: { select: { name: true } } },
        orderBy: { name: 'asc' }
      }),
      prisma.ticket.groupBy({
        by: ['category'],
        where: ticketWhere,
        _count: { _all: true }
      }),
      prisma.ticket.findMany({
        where: {
          ...ticketWhere,
          OR: [{ responseDueAt: { not: null } }, { slaDueAt: { not: null } }]
        },
        select: {
          status: true,
          responseDueAt: true,
          firstRespondedAt: true,
          slaResponseTargetPercent: true,
          slaDueAt: true,
          slaResolutionTargetPercent: true,
          resolvedAt: true,
          closedAt: true
        }
      })
    ]);

    const aiInsights = buildAiInsights(tickets, users);
    const slaMetrics = calculateSlaCompliance(slaTickets);
    const categoryIssues = categoryGroups
      .map(group => ({
        name: group.category,
        count: group._count?._all || 0,
        percentage: total ? Math.round(((group._count?._all || 0) / total) * 100) : 0
      }))
      .sort((left, right) => right.count - left.count);
    const csatTicketIds = [...new Set(csatResponses.map(response => response.ticketId))];

    res.json({
      success: true,
      analytics: {
        total,
        open,
        inProgress,
        onHold,
        resolved,
        closed,
        slaBreached: slaMetrics.breachedTickets,
        slaCompliance: slaMetrics.compliance,
        slaTargetAttainment: slaMetrics.targetAttainment,
        categoryIssues,
        csatScore: csat._avg.rating == null ? null : Number(csat._avg.rating.toFixed(2)),
        csatResponses: csat._count.rating,
        csatSatisfactionRate: calculateSatisfactionRate(csat._count.rating, csatSatisfiedCount),
        csatTicketIds,
        aiInsights
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard analytics' });
  }
};
