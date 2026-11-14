const { PrismaClient } = require('@prisma/client');
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
const prisma = new PrismaClient();
const VALID_PRIORITIES = new Set(['Very High', 'High', 'Medium', 'Low', 'Very Low', 'Critical']);

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

async function generateTicketNumber() {
  const settings = await prisma.systemSettings.findFirst();
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const count = await prisma.ticket.count({
    where: { createdAt: { gte: todayStart, lt: todayEnd } }
  });

  // Use dynamic prefix from settings
  const prefix = settings ? settings.ticketNumberPrefix : 'TICK';
  return `${prefix}-${dateStr}-${String(count + 1).padStart(4, '0')}`;
}

exports.createTicket = async (req, res) => {
  try {
    const { subject, description, requesterEmail, senderEmail, senderName, departmentId, category, priority } = req.body;
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
    if (priority && !VALID_PRIORITIES.has(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority' });
    }
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
    const ticketNumber = await generateTicketNumber();
    const resolvedPriority = priority || (settings ? settings.defaultPriority : 'Medium');
    const resolvedCategory = category || (settings ? settings.defaultCategory : 'General Issues');
    const createdAt = new Date();
    const slaDeadlines = await getConfiguredTicketSlaDeadlines(prisma, resolvedCategory, resolvedPriority, createdAt);
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject: safeSubject,
        description: safeDescription,
        requesterEmail: email,
        requesterName: name,
        category: resolvedCategory,
        priority: resolvedPriority,
        status: settings ? (settings.defaultStatus || 'Open') : 'Open',
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
      include: { department: true, assignedTo: true, createdBy: true }
    });
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

exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: { department: true, assignedTo: { select: { id: true, name: true, email: true } }, createdBy: { select: { id: true, name: true, email: true } }, _count: { select: { comments: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, tickets: tickets.map(decorateTicket) });
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
    if (priority && !VALID_PRIORITIES.has(priority)) {
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
      if (status === 'Open' || status === 'In Progress') {
        updateData.resolvedAt = null;
        updateData.closedAt = null;
      }
    }
    if (priority && priority !== existing.priority) {
      updateData.priority = priority;
      historyEntries.push({ field: 'priority', oldValue: existing.priority, newValue: priority });
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
        updateData.status = 'In Progress';
        historyEntries.push({ field: 'status', oldValue: existing.status, newValue: 'In Progress' });
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
    if (category) updateData.category = category;
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
          message: `${ticket.ticketNumber}: status changed from ${existing.status} to ${ticket.status}`,
          emailPreference: 'emailOnStatusChange'
        })));
    }

    if (assignedToId && assignedToId !== existing.assignedToId && assignedToId !== userId) {
      await createTicketNotification({
        userId: assignedToId,
        ticket,
        type: 'assignment',
        title: 'Ticket assigned to you',
        message: `${ticket.ticketNumber}: ${ticket.subject}`,
        emailPreference: 'emailOnAssignment'
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
      status: ticket.status === 'Open' ? 'In Progress' : ticket.status
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

    if (targetUser.id !== userId) {
      await createTicketNotification({
        userId: targetUser.id,
        ticket: updated,
        type: 'escalation',
        title: 'Ticket escalated to you',
        message: `${updated.ticketNumber}: ${updated.subject}${safeReason ? ` - ${safeReason}` : ''}`,
        emailPreference: 'escalationAlerts'
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
      data: { ticketId: id, userId: userId, content: safeContent, isInternal: isInternal || false },
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
        message: `${commentAuthorName} commented on ${existingTicket.ticketNumber}: ${safeContent.slice(0, 180)}`,
        emailPreference: 'emailOnNewComment'
      })));

    return res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

exports.addAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Attachment file is required' });
    }
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const originalName = cleanFilename(req.file.originalname);
    const attachment = await prisma.attachment.create({
      data: {
        ticketId: id,
        filename: originalName,
        filepath: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId: id,
        field: 'attachment',
        oldValue: '',
        newValue: originalName,
        changedBy: req.user?.id || ''
      }
    });

    res.status(201).json({ success: true, attachment });
  } catch (error) {
    console.error('Error adding attachment:', error);
    res.status(500).json({ success: false, message: 'Failed to add attachment' });
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const [total, open, inProgress, resolved, closed, onHold, critical, overdue] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'Open' } }),
      prisma.ticket.count({ where: { status: 'In Progress' } }),
      prisma.ticket.count({ where: { status: 'Resolved' } }),
      prisma.ticket.count({ where: { status: 'Closed' } }),
      prisma.ticket.count({ where: { status: 'On Hold' } }),
      prisma.ticket.count({ where: { priority: 'Critical', status: { notIn: ['Resolved', 'Closed'] } } }),
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
