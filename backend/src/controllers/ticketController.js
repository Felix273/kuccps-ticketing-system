const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('../services/emailService');

const prisma = new PrismaClient();

// Get all tickets
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        department: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        comments: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      tickets
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
};

// Get statistics
exports.getStatistics = async (req, res) => {
  try {
    const totalTickets = await prisma.ticket.count();
    const openTickets = await prisma.ticket.count({ where: { status: 'Open' } });
    const inProgressTickets = await prisma.ticket.count({ where: { status: 'In Progress' } });
    const resolvedTickets = await prisma.ticket.count({ 
      where: { 
        OR: [
          { status: 'Resolved' },
          { status: 'Closed' }
        ]
      } 
    });
    const criticalTickets = await prisma.ticket.count({ 
      where: { 
        priority: 'Critical',
        NOT: {
          status: 'Closed'
        }
      } 
    });

    // Calculate average response and resolution times
    const ticketsWithResponseTime = await prisma.ticket.findMany({
      where: {
        responseTime: { not: null }
      },
      select: {
        responseTime: true
      }
    });

    const ticketsWithResolutionTime = await prisma.ticket.findMany({
      where: {
        resolutionTime: { not: null }
      },
      select: {
        resolutionTime: true
      }
    });

    const avgResponseTime = ticketsWithResponseTime.length > 0
      ? ticketsWithResponseTime.reduce((sum, t) => sum + t.responseTime, 0) / ticketsWithResponseTime.length
      : 0;

    const avgResolutionTime = ticketsWithResolutionTime.length > 0
      ? ticketsWithResolutionTime.reduce((sum, t) => sum + t.resolutionTime, 0) / ticketsWithResolutionTime.length
      : 0;

    res.json({
      success: true,
      statistics: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        criticalTickets,
        avgResponseTime: avgResponseTime.toFixed(1),
        avgResolutionTime: avgResolutionTime.toFixed(1)
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// Get single ticket
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        department: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message
    });
  }
};

// Create ticket
exports.createTicket = async (req, res) => {
  try {
    const { subject, description, requesterEmail, departmentId, category, priority } = req.body;

    // Validate required fields
    if (!subject || !description || !requesterEmail) {
      return res.status(400).json({
        success: false,
        message: 'Subject, description, and requester email are required'
      });
    }

    // Generate ticket number
    const ticketCount = await prisma.ticket.count();
    const ticketNumber = `TKT-${String(ticketCount + 1).padStart(6, '0')}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject,
        description,
        requesterEmail,
        departmentId: departmentId || null,
        category: category || 'General Issues',
        priority: priority || 'Medium',
        status: 'Open'
      },
      include: {
        department: true
      }
    });

    // Send confirmation email
    try {
      await sendEmail(requesterEmail, 'ticketCreated', ticket);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ticket',
      error: error.message
    });
  }
};

// Update ticket
exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, category, assignedToId } = req.body;

    const oldTicket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!oldTicket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        status,
        priority,
        category,
        assignedToId: assignedToId || null,
        responseTime: !oldTicket.responseTime ? Math.floor((Date.now() - oldTicket.createdAt.getTime()) / (1000 * 60 * 60)) : oldTicket.responseTime,
        resolutionTime: (status === 'Resolved' || status === 'Closed') && !oldTicket.resolutionTime 
          ? Math.floor((Date.now() - oldTicket.createdAt.getTime()) / (1000 * 60 * 60))
          : oldTicket.resolutionTime
      },
      include: {
        department: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Send email notification if status changed to Resolved
    try {
      if (status === 'Resolved' && oldTicket.status !== 'Resolved') {
        await sendEmail(ticket.requesterEmail, 'ticketResolved', ticket);
      } else if (status !== oldTicket.status) {
        await sendEmail(ticket.requesterEmail, 'ticketUpdated', ticket);
      }
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket',
      error: error.message
    });
  }
};

// Add comment to ticket
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isInternal } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const comment = await prisma.comment.create({
      data: {
        ticketId: id,
        userId: userId,
        content,
        isInternal: isInternal || false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Send email notification if comment is not internal
    try {
      if (!isInternal) {
        await sendEmail(ticket.requesterEmail, 'ticketUpdated', ticket, content);
      }
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

// Delete ticket
exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    await prisma.ticket.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ticket',
      error: error.message
    });
  }
};
