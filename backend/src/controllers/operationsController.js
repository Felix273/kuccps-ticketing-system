const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

    const [total, open, inProgress, resolved, closed, breached, csat] = await Promise.all([
      prisma.ticket.count({ where: ticketWhere }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'Open' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'In Progress' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'Resolved' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'Closed' } }),
      prisma.ticket.count({ where: { ...ticketWhere, slaBreached: true } }),
      prisma.csatResponse.aggregate({ _avg: { rating: true }, _count: { rating: true } })
    ]);

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
        csatResponses: csat._count.rating
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard analytics' });
  }
};
