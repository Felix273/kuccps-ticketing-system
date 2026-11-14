const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { createTicketNotification, sendEmailNotification } = require('./notificationService');

const prisma = new PrismaClient();
const ACTIVE_STATUSES = ['Open', 'In Progress', 'On Hold'];

async function sendDailyDigests() {
  const preferences = await prisma.notificationPreference.findMany({
    where: { dailyDigest: true },
    include: { user: { select: { id: true, email: true, name: true } } }
  });

  for (const { user } of preferences) {
    if (!user.email) continue;

    const tickets = await prisma.ticket.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        OR: [{ assignedToId: user.id }, { createdById: user.id }]
      },
      select: { ticketNumber: true, subject: true, status: true, priority: true },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });

    if (!tickets.length) continue;
    const ticketLines = tickets.map(ticket =>
      `${ticket.ticketNumber} - ${ticket.subject} (${ticket.status}, ${ticket.priority})`
    );
    try {
      await sendEmailNotification(user.email, {
        title: 'Your daily support ticket digest',
        message: `${user.name}, you have ${tickets.length} active ticket(s):\n${ticketLines.join('\n')}`
      });
    } catch (error) {
      console.error('Daily notification digest failed:', { userId: user.id, message: error.message });
    }
  }
}

async function sendEscalationAlerts() {
  const now = new Date();
  const legacyOverdueBefore = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const overdueTickets = await prisma.ticket.findMany({
    where: {
      status: { in: ACTIVE_STATUSES },
      priority: { in: ['High', 'Very High', 'Critical'] },
      OR: [
        { slaEscalationAt: { not: null, lte: now } },
        {
          slaEscalationAt: null,
          slaDueAt: { lte: legacyOverdueBefore }
        }
      ]
    },
    include: {
      assignedTo: { select: { id: true } }
    },
    orderBy: { slaDueAt: 'asc' }
  });
  const administrators = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true }
  });

  for (const ticket of overdueTickets) {
    const recipients = new Set([
      ticket.assignedTo?.id,
      ...administrators.map(admin => admin.id)
    ].filter(Boolean));
    const message = `${ticket.ticketNumber}: ${ticket.subject} has passed its configured post-SLA escalation grace period.`;

    await Promise.all([...recipients].map(userId =>
      createTicketNotification({
        userId,
        ticket,
        type: 'escalation',
        title: 'Overdue high-priority ticket',
        message,
        emailPreference: 'escalationAlerts',
        dedupeKey: `sla-overdue-${ticket.id}`,
        emailEveryTime: true
      })
    ));
  }
}

function startNotificationJobs() {
  cron.schedule('0 8 * * *', () => {
    sendDailyDigests().catch(error => {
      console.error('Daily notification digest job failed:', error);
    });
  }, { timezone: 'Africa/Nairobi' });

  cron.schedule('0 */2 * * *', () => {
    sendEscalationAlerts().catch(error => {
      console.error('Escalation notification job failed:', error);
    });
  }, { timezone: 'Africa/Nairobi' });
}

module.exports = { startNotificationJobs, sendDailyDigests, sendEscalationAlerts };
