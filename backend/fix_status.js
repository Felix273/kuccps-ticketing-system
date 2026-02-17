const fs = require('fs');

// Read the current controller
let content = fs.readFileSync('src/controllers/ticketController.js', 'utf8');

// Find the updateTicketStatus function and replace it
const newFunction = `
// Update ticket status
exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('📝 Updating ticket status:', { id, status });

    const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: Open, In Progress, Resolved, Closed'
      });
    }

    // Get existing ticket to check old status
    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        }
      }
    });

    if (!existingTicket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const oldStatus = existingTicket.status;
    console.log('🔄 Status change:', oldStatus, '→', status);

    // Update ticket
    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === 'Resolved' ? new Date() : existingTicket.resolvedAt,
        closedAt: status === 'Closed' ? new Date() : existingTicket.closedAt,
        updatedAt: new Date()
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        },
        department: true,
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
            createdAt: 'desc'
          }
        }
      }
    });

    console.log('✅ Ticket updated successfully');

    // Send status change notification (non-blocking)
    setImmediate(async () => {
      try {
        await notifyStatusChange(ticket, oldStatus, status);
      } catch (notifyError) {
        console.error('⚠️  Notification error (non-critical):', notifyError.message);
      }
    });

    res.json({
      success: true,
      message: \`Ticket status updated to \${status}\`,
      ticket
    });
  } catch (error) {
    console.error('❌ Error updating ticket status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket status',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
`;

// Find and replace the function
const regex = /\/\/ Update ticket status\nexports\.updateTicketStatus = async \(req, res\) => \{[\s\S]*?\n\};/;
if (regex.test(content)) {
  content = content.replace(regex, newFunction.trim());
  fs.writeFileSync('src/controllers/ticketController.js', content);
  console.log('✅ Successfully replaced updateTicketStatus function!');
} else {
  console.log('❌ Could not find the function to replace');
  console.log('Please share the complete controller file');
}
