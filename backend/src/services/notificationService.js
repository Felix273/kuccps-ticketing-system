const { PrismaClient } = require('@prisma/client');
const { createEmailTransporter, getSystemSettings } = require('./emailService');

const prisma = new PrismaClient();
const emailPreferenceKeys = new Set([
  'emailOnAssignment',
  'emailOnStatusChange',
  'emailOnNewComment',
  'escalationAlerts'
]);

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

  await transporter.sendMail({
    from: `${settings.emailFromName || 'KUCCPS IT Support'} <${from}>`,
    to,
    subject: ticketNumber ? `[Ticket #${ticketNumber}] ${title}` : title,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b">
        <h2 style="color:${settings.primaryColor || '#990024'}">${escapeHtml(title)}</h2>
        <p style="white-space:pre-line">${escapeHtml(message)}</p>
        ${ticketNumber ? `<p><strong>Ticket:</strong> ${escapeHtml(ticketNumber)}</p>` : ''}
      </div>
    `
  });
}

async function createNotification({
  userId,
  ticketId,
  type,
  title,
  message,
  dedupeKey,
  emailPreference,
  ticketNumber,
  emailEveryTime = false
}) {
  try {
    let notification;
    let wasCreated = true;

    if (dedupeKey) {
      notification = await prisma.notification.findUnique({
        where: { userId_dedupeKey: { userId, dedupeKey } }
      });
      if (notification) {
        wasCreated = false;
      } else {
        try {
          notification = await prisma.notification.create({
            data: { userId, ticketId, type, title, message, dedupeKey }
          });
        } catch (error) {
          if (error.code !== 'P2002') throw error;
          notification = await prisma.notification.findUnique({
            where: { userId_dedupeKey: { userId, dedupeKey } }
          });
          wasCreated = false;
        }
      }
    } else {
      notification = await prisma.notification.create({
        data: { userId, ticketId, type, title, message }
      });
    }

    if (emailPreference && emailPreferenceKeys.has(emailPreference) && (wasCreated || emailEveryTime)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          notificationPreference: { select: { [emailPreference]: true } }
        }
      });
      const enabled = user?.notificationPreference?.[emailPreference] ?? true;
      if (enabled && user?.email) {
        try {
          await sendEmailNotification(user.email, { title, message, ticketNumber });
        } catch (error) {
          console.error('Notification email failed:', { userId, type, message: error.message });
        }
      }
    }

    return notification;
  } catch (error) {
    console.error('Create notification failed:', { userId, type, message: error.message });
    return null;
  }
}

async function createTicketNotification({
  userId,
  ticket,
  type,
  title,
  message,
  emailPreference,
  dedupeKey,
  emailEveryTime
}) {
  return createNotification({
    userId,
    ticketId: ticket.id,
    type,
    title,
    message,
    emailPreference,
    dedupeKey,
    ticketNumber: ticket.ticketNumber,
    emailEveryTime
  });
}

module.exports = {
  createNotification,
  createTicketNotification,
  sendEmailNotification,
  emailPreferenceKeys
};
