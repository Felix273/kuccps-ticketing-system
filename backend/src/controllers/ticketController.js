const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('../services/emailService');
const prisma = new PrismaClient();

async function generateTicketNumber() {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const count = await prisma.ticket.count({
    where: { createdAt: { gte: todayStart, lt: todayEnd } }
  });
  return `TICK-${dateStr}-${String(count + 1).padStart(4, '0')}`;
}

exports.createTicket = async (req, res) => {
  try {
    console.log('Received ticket data:', { requesterEmail: req.body.requesterEmail, senderEmail: req.body.senderEmail });
    const { subject, description, requesterEmail, senderEmail, senderName, departmentId, category, priority } = req.body;
    const email = requesterEmail || senderEmail;
    const name = senderName || null;
    if (!subject || !description || !email) {
      return res.status(400).json({ success: false, message: 'Subject, description, and requester email are required' });
    }
    let createdById = null;
    try {
      const existingUser = await prisma.user.findUnique({ where: { email: email } });
      if (existingUser) {
        createdById = existingUser.id;
        console.log('Linked ticket to user:', existingUser.name, existingUser.email);
      } else {
        console.log('No user found for email:', email);
      }
    } catch (userError) {
      console.log('Could not find user:', userError.message);
    }
    let resolvedDepartmentId = departmentId || null;
    if (!resolvedDepartmentId && email) {
      try {
        const departments = await prisma.department.findMany();
        resolvedDepartmentId = departments.length > 0 ? departments[0].id : null;
      } catch (deptError) {
        console.log('Could not resolve department:', deptError.message);
      }
    }
    const ticketNumber = await generateTicketNumber();
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject,
        description,
        requesterEmail: email,
        requesterName: name,
        category: category || 'General Issues',
        priority: priority || 'Medium',
        status: 'Open',
        departmentId: resolvedDepartmentId,
        createdById: createdById
      },
      include: { department: true, assignedTo: true, createdBy: true }
    });
    console.log('Ticket created:', ticket.ticketNumber);
    try {
      await sendEmail(email, 'ticketCreated', ticket);
    } catch (emailError) {
      console.log('Could not send confirmation email:', emailError.message);
    }
    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket: { id: ticket.id, ticketNumber: ticket.ticketNumber, subject: ticket.subject, status: ticket.status, priority: ticket.priority, category: ticket.category, createdAt: ticket.createdAt }
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({ success: false, message: 'Failed to create ticket', error: error.message });
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: { department: true, assignedTo: { select: { id: true, name: true, email: true } }, createdBy: { select: { id: true, name: true, email: true } }, _count: { select: { comments: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { department: true, assignedTo: { select: { id: true, name: true, email: true } }, createdBy: { select: { id: true, name: true, email: true } }, comments: { include: { user: { select: { id: true, name: true, email: true, role: true } } }, orderBy: { createdAt: 'asc' } }, attachments: true, history: { orderBy: { createdAt: 'desc' } } }
    });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    return res.json({ success: true, ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedToId, departmentId, category, resolution } = req.body;
    const userId = req.user?.id;
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    const updateData = {};
    const historyEntries = [];
    if (status && status !== existing.status) {
      updateData.status = status;
      historyEntries.push({ field: 'status', oldValue: existing.status, newValue: status });
      if (status === 'In Progress' && !existing.responseTime) {
        updateData.responseTime = Math.floor((new Date() - new Date(existing.createdAt)) / 60000);
      }
      if ((status === 'Resolved' || status === 'Closed') && !existing.resolutionTime) {
        updateData.resolutionTime = Math.floor((new Date() - new Date(existing.createdAt)) / 60000);
      }
    }
    if (priority && priority !== existing.priority) {
      updateData.priority = priority;
      historyEntries.push({ field: 'priority', oldValue: existing.priority, newValue: priority });
    }
    if (assignedToId !== undefined && assignedToId !== existing.assignedToId) {
      updateData.assignedToId = assignedToId || null;
      historyEntries.push({ field: 'assignedTo', oldValue: existing.assignedToId, newValue: assignedToId });
    }
    if (departmentId && departmentId !== existing.departmentId) {
      updateData.departmentId = departmentId;
      historyEntries.push({ field: 'department', oldValue: existing.departmentId, newValue: departmentId });
    }
    if (category) updateData.category = category;
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
    return res.json({ success: true, ticket });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return res.status(500).json({ success: false, message: 'Failed to update ticket' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isInternal } = req.body;
    const userId = req.user?.id;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }
    const comment = await prisma.comment.create({
      data: { ticketId: id, userId, content, isInternal: isInternal || false },
      include: { user: { select: { id: true, name: true, email: true, role: true } } }
    });
    return res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const [total, open, inProgress, resolved, closed, critical] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'Open' } }),
      prisma.ticket.count({ where: { status: 'In Progress' } }),
      prisma.ticket.count({ where: { status: 'Resolved' } }),
      prisma.ticket.count({ where: { status: 'Closed' } }),
      prisma.ticket.count({ where: { priority: 'Critical', status: { notIn: ['Resolved', 'Closed'] } } })
    ]);
    return res.json({ success: true, statistics: { total, open, inProgress, resolved, closed, critical } });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};
