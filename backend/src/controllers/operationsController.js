const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OPEN_STATUSES = new Set(['Open', 'In Progress']);
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

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildAiInsights(tickets, users) {
  const now = new Date();
  const activeTickets = tickets.filter(ticket => OPEN_STATUSES.has(ticket.status));
  const resolvedTickets = tickets.filter(ticket => RESOLVED_STATUSES.has(ticket.status));
  const highPriorityActive = activeTickets.filter(ticket => ['High', 'Critical'].includes(ticket.priority));
  const overdueTickets = activeTickets.filter(ticket => ticket.slaDueAt && new Date(ticket.slaDueAt) < now);
  const dueSoonTickets = activeTickets.filter(ticket => {
    if (!ticket.slaDueAt) return false;
    const dueAt = new Date(ticket.slaDueAt);
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
      if (['High', 'Critical'].includes(ticket.priority)) workloadByAgent[agentName].highPriority += 1;
      if (ticket.slaDueAt && new Date(ticket.slaDueAt) < now) workloadByAgent[agentName].overdue += 1;
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
      reason: `Overdue by ${hoursBetween(ticket.slaDueAt, now)} hour(s).`,
      recommendation: ticket.priority === 'Critical'
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
        .filter(ticket => ticket.slaDueAt || ['High', 'Critical'].includes(ticket.priority))
        .map(ticket => ({
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          priority: ticket.priority,
          status: ticket.status,
          category: ticket.category,
          assignedTo: ticket.assignedTo?.name || 'Unclaimed',
          slaDueAt: ticket.slaDueAt,
          ageHours: hoursBetween(ticket.createdAt, now),
          isOverdue: Boolean(ticket.slaDueAt && new Date(ticket.slaDueAt) < now)
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

exports.createCsatResponse = async (req, res) => {
  try {
    const { ticketId, rating, comment } = req.body;
    const numericRating = Number(rating);
    if (!ticketId || !numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Ticket and rating from 1 to 5 are required' });
    }
    const response = await prisma.csatResponse.create({
      data: {
        ticketId,
        rating: numericRating,
        comment: comment || null,
        userId: req.user?.id || null
      }
    });
    res.status(201).json({ success: true, response });
  } catch (error) {
    console.error('Create CSAT response error:', error);
    res.status(500).json({ success: false, message: 'Failed to save CSAT response' });
  }
};

exports.createPublicCsatResponse = async (req, res) => {
  try {
    const { ticketId, rating, comment } = req.body;
    const numericRating = Number(rating);
    if (!ticketId || !numericRating || numericRating < 1 || numericRating > 5) {
      if (req.accepts('html')) {
        return res.status(400).send('<h2>Invalid rating request</h2>');
      }
      return res.status(400).json({ success: false, message: 'Ticket ID and valid rating (1-5) are required' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, ticketNumber: true, subject: true }
    });

    if (!ticket) {
      if (req.accepts('html')) {
        return res.status(404).send('<h2>Ticket not found</h2>');
      }
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Upsert CSAT response to prevent duplicate entries for the same ticket
    const existingCsat = await prisma.csatResponse.findFirst({
      where: { ticketId }
    });

    let response;
    if (existingCsat) {
      response = await prisma.csatResponse.update({
        where: { id: existingCsat.id },
        data: {
          rating: numericRating,
          comment: comment ? String(comment).trim() : existingCsat.comment
        }
      });
    } else {
      response = await prisma.csatResponse.create({
        data: {
          ticketId,
          rating: numericRating,
          comment: comment ? String(comment).trim() : null
        }
      });
    }

    // If request comes from an HTML form submission (content-type application/x-www-form-urlencoded or accepts html)
    if (req.headers['content-type']?.includes('application/x-www-form-urlencoded') || req.accepts('html')) {
      const isContented = numericRating >= 3;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>KUCCPS IT Support - Thank You</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 20px; text-align: center; }
            .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
            .header { background: #911414; color: white; padding: 16px; border-radius: 8px; font-weight: bold; font-size: 20px; margin-bottom: 24px; }
            .message { color: #111827; font-size: 20px; font-weight: bold; margin-bottom: 12px; }
            .subtext { color: #4b5563; font-size: 15px; margin-bottom: 24px; line-height: 1.5; }
            .footer { margin-top: 24px; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">KUCCPS IT Support</div>
            <div class="message">${isContented ? 'Thank You for Your Feedback!' : 'Feedback Submitted'}</div>
            <div class="subtext">
              Your feedback for ticket <b>${ticket.ticketNumber}</b> has been saved. We appreciate your input as we continuously improve ICT support services for KUCCPS.
            </div>
            <div class="footer">KUCCPS IT Ticketing System • Service Desk</div>
          </div>
        </body>
        </html>
      `;
      return res.send(html);
    }

    return res.status(201).json({ success: true, message: 'Rating saved successfully', response });
  } catch (error) {
    console.error('Create public CSAT error:', error);
    if (req.accepts('html')) {
      return res.status(500).send('<h2>Failed to save feedback</h2>');
    }
    return res.status(500).json({ success: false, message: 'Failed to save rating' });
  }
};

exports.handleEmailCsatRate = async (req, res) => {
  try {
    const { ticketId, rating } = req.query;
    const numericRating = Number(rating);

    if (!ticketId || !numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).send('<h2>Invalid rating request</h2>');
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, ticketNumber: true, subject: true }
    });

    if (!ticket) {
      return res.status(404).send('<h2>Ticket not found</h2>');
    }

    // Upsert initial rating to ensure idempotency and prevent duplicate records
    const existingCsat = await prisma.csatResponse.findFirst({
      where: { ticketId }
    });

    if (existingCsat) {
      await prisma.csatResponse.update({
        where: { id: existingCsat.id },
        data: { rating: numericRating }
      });
    } else {
      await prisma.csatResponse.create({
        data: {
          ticketId,
          rating: numericRating
        }
      });
    }

    const isContented = numericRating >= 3;
    const ratingStars = '⭐'.repeat(numericRating);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>KUCCPS IT Support - Rating Received</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 20px; text-align: center; }
          .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
          .header { background: #911414; color: white; padding: 16px; border-radius: 8px; font-weight: bold; font-size: 20px; margin-bottom: 24px; }
          .stars { font-size: 32px; margin: 16px 0; }
          .message { color: #111827; font-size: 18px; font-weight: 600; margin-bottom: 8px; }
          .subtext { color: #4b5563; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
          textarea { width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; margin-bottom: 16px; min-height: 90px; }
          button { background-color: #911414; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; width: 100%; }
          button:hover { background-color: #720e0e; }
          .footer { margin-top: 24px; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">KUCCPS IT Support</div>
          <div class="stars">${ratingStars}</div>
          <div class="message">${isContented ? 'Thank you for your rating!' : 'Thank you for your feedback'}</div>
          <div class="subtext">
            Your rating of <b>${numericRating}/5</b> for ticket <b>${escapeHtml(ticket.ticketNumber)}</b> ("${escapeHtml(ticket.subject)}") has been recorded.
            ${isContented ? 'We are glad we could assist you!' : 'We regret that the service did not meet your expectations. Our ICT supervisor has been notified.'}
          </div>
          <form action="/api/operations/csat/public" method="POST">
            <input type="hidden" name="ticketId" value="${ticket.id}">
            <input type="hidden" name="rating" value="${numericRating}">
            <textarea name="comment" placeholder="Optional: Share any comments or details about your experience..."></textarea>
            <button type="submit">Submit Comments</button>
          </form>
          <div class="footer">KUCCPS IT Ticketing System • Service Desk</div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Handle email CSAT rate error:', error);
    res.status(500).send('<h2>Failed to record rating</h2>');
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

    const [total, open, inProgress, resolved, closed, breached, csat, tickets, users] = await Promise.all([
      prisma.ticket.count({ where: ticketWhere }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'Open' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'In Progress' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'Resolved' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'Closed' } }),
      prisma.ticket.count({ where: { ...ticketWhere, slaBreached: true } }),
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
      })
    ]);

    const aiInsights = buildAiInsights(tickets, users);

    res.json({
      success: true,
      analytics: {
        total,
        open,
        inProgress,
        resolved,
        closed,
        slaBreached: breached,
        slaCompliance: total > 0 ? Math.round(((total - breached) / total) * 100) : 100,
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
