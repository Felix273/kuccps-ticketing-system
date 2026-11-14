const { PrismaClient } = require('@prisma/client');
const { verifyCsatToken } = require('../services/csatService');
const {
  SLA_CATEGORIES,
  SLA_DEFAULT_POLICIES,
  calculateSlaCompliance,
  buildSlaCategoryIssues,
  getActiveOverdueDeadline,
  isActiveTicketOverdue,
  resetSlaPoliciesToDefaults,
  saveSlaPolicyUpdates,
  validateSlaPolicyUpdates
} = require('../services/slaService');
const prisma = new PrismaClient();

const OPEN_STATUSES = new Set(['Open', 'In Progress', 'On Hold']);
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
  const highPriorityActive = activeTickets.filter(ticket => ['High', 'Very High', 'Critical'].includes(ticket.priority));
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
      if (['High', 'Very High', 'Critical'].includes(ticket.priority)) workloadByAgent[agentName].highPriority += 1;
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

  const duplicateSignals = activeTickets
    .map(ticket => {
      const terms = getTerms(`${ticket.subject} ${ticket.description}`);
      const related = activeTickets.filter(other => {
        if (other.id === ticket.id || other.category !== ticket.category) return false;
        const otherTerms = new Set(getTerms(`${other.subject} ${other.description}`));
        const overlap = terms.filter(term => otherTerms.has(term)).length;
        return overlap >= 3;
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
      recommendation: ['Critical', 'Very High'].includes(ticket.priority)
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
        .filter(ticket => ticket.slaDueAt || ticket.responseDueAt || ['High', 'Very High', 'Critical'].includes(ticket.priority))
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

exports.createSlaPolicy = async (req, res) => {
  try {
    const { name, priority, category, departmentId, responseMinutes, resolutionMinutes, isActive } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'SLA policy name is required' });
    const policy = await prisma.slaPolicy.create({
      data: {
        name,
        priority: priority || null,
        category: category || null,
        departmentId: departmentId || null,
        responseMinutes: responseMinutes || 240,
        resolutionMinutes: resolutionMinutes || 1440,
        isActive: isActive !== false
      }
    });
    res.status(201).json({ success: true, policy });
  } catch (error) {
    console.error('Create SLA policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to create SLA policy' });
  }
};

exports.updateSlaPolicy = async (req, res) => {
  try {
    const { name, priority, category, departmentId, responseMinutes, resolutionMinutes, isActive } = req.body;
    const policy = await prisma.slaPolicy.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(priority !== undefined && { priority }),
        ...(category !== undefined && { category }),
        ...(departmentId !== undefined && { departmentId }),
        ...(responseMinutes !== undefined && { responseMinutes }),
        ...(resolutionMinutes !== undefined && { resolutionMinutes }),
        ...(isActive !== undefined && { isActive })
      }
    });
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

exports.createCsatResponse = async (req, res) => {
  try {
    const { ticketId, rating, comment } = req.body;
    const numericRating = Number(rating);
    if (!ticketId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Ticket and rating from 1 to 5 are required' });
    }
    if (comment != null && typeof comment !== 'string') {
      return res.status(400).json({ success: false, message: 'Comment must be text' });
    }
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true }
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (!RESOLVED_STATUSES.has(ticket.status)) {
      return res.status(400).json({ success: false, message: 'Feedback is available after a ticket is resolved' });
    }
    const response = await prisma.csatResponse.create({
      data: {
        ticketId,
        rating: numericRating,
        comment: comment?.trim().slice(0, 2000) || null,
        userId: req.user?.id || null
      }
    });
    res.status(200).json({ success: true, response });
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
    const response = await prisma.csatResponse.create({
      data: {
        ticketId: ticket.id,
        rating: payload.rating,
        comment: comment?.trim().slice(0, 2000) || null,
        userId: requester?.id || null
      }
    });
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error('Create public CSAT response error:', error);
    res.status(500).json({ success: false, message: 'Failed to save your feedback' });
  }
};

exports.getDashboardAnalytics = async (req, res) => {
  try {
    const { departmentId, agentId, from, to } = req.query;
    const createdAt = {};
    if (from) createdAt.gte = new Date(from);
    if (to) createdAt.lte = new Date(to);

    const ticketWhere = {
      ...(Object.keys(createdAt).length ? { createdAt } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(agentId ? { assignedToId: agentId } : {})
    };

    const [total, open, inProgress, onHold, resolved, closed, csat, tickets, users, categoryGroups, slaTickets] = await Promise.all([
      prisma.ticket.count({ where: ticketWhere }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'Open' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'In Progress' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'On Hold' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'Resolved' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'Closed' } }),
      prisma.csatResponse.aggregate({ _avg: { rating: true }, _count: { rating: true } }),
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
        include: { department: true },
        orderBy: { name: 'asc' }
      }),
      prisma.ticket.groupBy({
        by: ['category'],
        where: { ...ticketWhere, category: { in: SLA_CATEGORIES } },
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
    const categoryIssues = buildSlaCategoryIssues(categoryGroups);

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
        csatScore: csat._avg.rating ? Number(csat._avg.rating.toFixed(2)) : null,
        csatResponses: csat._count.rating,
        aiInsights
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard analytics' });
  }
};
