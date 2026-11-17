const cron = require('node-cron');
const { createTicketNotification } = require('./notificationService');

const prisma = require('../lib/prisma');
const ACTIVE_STATUSES = ['Open', 'InProgress', 'OnHold'];

async function sendEscalationAlerts() {
  const now = new Date();
  const legacyOverdueBefore = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const overdueTickets = await prisma.ticket.findMany({
    where: {
      status: { in: ACTIVE_STATUSES },
      priority: { in: ['High', 'VeryHigh', 'Critical'] },
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
        dedupeKey: `sla-overdue-${ticket.id}`
      })
    ));
  }
}

function startNotificationJobs() {
  cron.schedule('0 */2 * * *', () => {
    sendEscalationAlerts().catch(error => {
      console.error('Escalation notification job failed:', error);
    });
  }, { timezone: 'Africa/Nairobi' });
}

module.exports = { startNotificationJobs, sendEscalationAlerts };
