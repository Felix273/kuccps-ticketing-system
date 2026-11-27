// Officer notifications: every alert appears in the in-app bell and, if the officer's
// email preference for that kind of alert is on (Alerts in the sidebar), is also emailed.
// Requester-facing emails are sent by emailService.sendEmail with the email templates.

const { createEmailTransporter, getSystemSettings } = require('./emailService');
const { safeColor } = require('../utils/html');

const prisma = require('../lib/prisma');

// Which preference controls the email for each alert type (null = in-app only).
const EMAIL_PREFERENCE_BY_TYPE = {
  new_ticket: 'emailOnNewTicket',
  assignment: 'emailOnAssignment',
  status_change: 'emailOnStatusChange',
  comment: 'emailOnNewComment',
  escalation: 'escalationAlerts',
  sla_warning: 'escalationAlerts',
  csat_low: 'escalationAlerts',
  knowledge_review: null
};

const DEFAULT_PREFERENCES = {
  emailOnNewTicket: true,
  emailOnAssignment: true,
  emailOnStatusChange: true,
  emailOnNewComment: true,
  dailyDigest: false,
  escalationAlerts: true
};

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

async function sendEmailNotification(to, { title, message, ticketNumber }) {
  if (!to) return;

  const [settings, transporter] = await Promise.all([
    getSystemSettings(),
    createEmailTransporter()
  ]);
  const from = settings.smtpUser || settings.supportEmail || process.env.EMAIL_USER;
  if (!from) throw new Error('No sender email is configured');
  // Test mode sends every email to the ICT test mailbox instead of real recipients.
  const testAddress = settings.emailTestMode && settings.emailTestAddress ? settings.emailTestAddress : null;
  const subject = ticketNumber ? `[Ticket #${ticketNumber}] ${title}` : title;

  await transporter.sendMail({
    from: { name: settings.emailFromName || 'KUCCPS IT Support', address: from },
    to: testAddress || to,
    subject: testAddress ? `[TEST → ${to}] ${subject}` : subject,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b">
        <h2 style="color:${safeColor(settings.primaryColor, '#990024')}">${escapeHtml(title)}</h2>
        <p style="white-space:pre-line">${escapeHtml(message)}</p>
        ${ticketNumber ? `<p><strong>Ticket:</strong> ${escapeHtml(ticketNumber)}</p>` : ''}
        <p style="color:#71717a;font-size:12px">You receive this because of your alert settings in the ICT service desk (Alerts in the sidebar).</p>
      </div>
    `
  });
}

// Creates an in-app notification. Returns { notification, created } — `created` is false
// when a notification with the same dedupe key already existed (so nothing is re-sent).
async function createNotification({ userId, ticketId, type, title, message, dedupeKey }) {
  try {
    if (dedupeKey) {
      const existing = await prisma.notification.findUnique({
        where: { userId_dedupeKey: { userId, dedupeKey } }
      });
      if (existing) return { notification: existing, created: false };
      try {
        const notification = await prisma.notification.create({
          data: { userId, ticketId, type, title, message, dedupeKey }
        });
        return { notification, created: true };
      } catch (error) {
        if (error.code !== 'P2002') throw error;
        const notification = await prisma.notification.findUnique({
          where: { userId_dedupeKey: { userId, dedupeKey } }
        });
        return { notification, created: false };
      }
    }
    const notification = await prisma.notification.create({
      data: { userId, ticketId, type, title, message }
    });
    return { notification, created: true };
  } catch (error) {
    console.error('Create notification failed:', { userId, type, message: error.message });
    return { notification: null, created: false };
  }
}

async function getPreferences(userId) {
  const preferences = await prisma.notificationPreference.findUnique({ where: { userId } });
  return { ...DEFAULT_PREFERENCES, ...(preferences || {}) };
}

async function emailIfWanted({ userId, type, title, message, ticketNumber }) {
  const preferenceKey = EMAIL_PREFERENCE_BY_TYPE[type];
  if (!preferenceKey) return false;
  const [preferences, user] = await Promise.all([
    getPreferences(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  ]);
  if (!preferences[preferenceKey] || !user?.email) return false;
  try {
    await sendEmailNotification(user.email, { title, message, ticketNumber });
    return true;
  } catch (error) {
    console.error('Notification email failed:', { userId, type, message: error.message });
    return false;
  }
}

async function createTicketNotification({ userId, ticket, type, title, message, dedupeKey }) {
  const result = await createNotification({ userId, ticketId: ticket.id, type, title, message, dedupeKey });
  if (result.created) {
    await emailIfWanted({ userId, type, title, message, ticketNumber: ticket.ticketNumber });
  }
  return result.notification;
}

// Alerts everyone whose role grants `permission` (e.g. all officers for a new ticket).
async function notifyPermissionHolders({ permission, excludeUserIds = [], ticket, type, title, message, dedupeKey }) {
  const holders = await prisma.user.findMany({
    where: {
      id: { notIn: excludeUserIds.filter(Boolean) },
      roleAssignments: { some: { role: { permissions: { some: { permission: { key: permission } } } } } }
    },
    select: { id: true }
  });
  for (const holder of holders) {
    if (ticket) {
      await createTicketNotification({ userId: holder.id, ticket, type, title, message, dedupeKey });
    } else {
      const result = await createNotification({ userId: holder.id, type, title, message, dedupeKey });
      if (result.created) await emailIfWanted({ userId: holder.id, type, title, message });
    }
  }
  return holders.length;
}

// Morning summary for officers who opted in: their open tickets and anything overdue.
async function sendDailyDigests(now = new Date()) {
  const subscribers = await prisma.notificationPreference.findMany({
    where: { dailyDigest: true },
    select: { user: { select: { id: true, name: true, email: true } } }
  });
  let sent = 0;
  for (const { user } of subscribers) {
    if (!user?.email) continue;
    const open = await prisma.ticket.findMany({
      where: { assignedToId: user.id, status: { in: ['Open', 'InProgress', 'OnHold'] } },
      select: { ticketNumber: true, subject: true, status: true, priority: true, slaDueAt: true },
      orderBy: [{ slaDueAt: 'asc' }]
    });
    const unclaimed = await prisma.ticket.count({ where: { assignedToId: null, status: 'Open' } });
    const overdue = open.filter(ticket => ticket.status !== 'OnHold' && ticket.slaDueAt && ticket.slaDueAt < now);
    const lines = open.slice(0, 25).map(ticket =>
      `• ${ticket.ticketNumber} [${ticket.status}, ${ticket.priority}] ${ticket.subject}${ticket.slaDueAt ? ` — due ${ticket.slaDueAt.toLocaleString('en-GB', { timeZone: process.env.TICKET_TIMEZONE || 'Africa/Nairobi', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}`
    );
    const message = [
      `Good morning ${user.name || ''}.`,
      `You have ${open.length} open ticket(s)${overdue.length ? `, ${overdue.length} overdue` : ''}. ${unclaimed} ticket(s) are waiting to be claimed in the queue.`,
      '',
      ...(lines.length ? lines : ['You have no open tickets.']),
      ...(open.length > 25 ? [`…and ${open.length - 25} more.`] : [])
    ].join('\n');
    try {
      await sendEmailNotification(user.email, { title: 'Your daily ticket summary', message });
      sent += 1;
    } catch (error) {
      console.error('Daily digest failed:', { userId: user.id, message: error.message });
    }
  }
  return sent;
}

module.exports = {
  DEFAULT_PREFERENCES,
  EMAIL_PREFERENCE_BY_TYPE,
  createNotification,
  createTicketNotification,
  notifyPermissionHolders,
  sendDailyDigests,
  sendEmailNotification
};
