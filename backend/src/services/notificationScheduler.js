// Automatic SLA escalation (all priorities), run every 15 minutes:
//  1. Warning  — when a ticket has used `slaWarningPercent` (default 75%) of its resolution
//                time, the assigned officer (or administrators, if unclaimed) is alerted.
//  2. Escalate — when the deadline (plus any configured escalation grace) passes, the ticket
//                is escalated to administrators and the configured escalation email
//                addresses, and the requester is told it has been escalated.
// Each stage is sent once per ticket and written to the activity log. The SLA clock only
// runs for Open/InProgress tickets — On Hold tickets are skipped (their deadlines are
// pushed back when they resume).

const cron = require('node-cron');
const { createTicketNotification, sendDailyDigests, sendEmailNotification } = require('./notificationService');
const { EVENTS, recordTicketEvent } = require('./ticketActivity');

const prisma = require('../lib/prisma');
const RUNNING_STATUSES = ['Open', 'InProgress'];
const SYSTEM_ACTOR = { id: 'system', name: 'SLA monitor' };

function formatDue(date) {
  return new Date(date).toLocaleString('en-GB', {
    timeZone: process.env.TICKET_TIMEZONE || 'Africa/Nairobi',
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  }) + ' EAT';
}

function parseEmails(value) {
  return String(value || '')
    .split(/[,;\s]+/)
    .map(item => item.trim().toLowerCase())
    .filter(item => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
}

// Moment at which `percent` of the resolution window has elapsed (hold time excluded,
// because the deadline itself was already pushed back by any time on hold).
function warningMoment(ticket, percent) {
  if (!ticket.slaDueAt) return null;
  const start = new Date(ticket.createdAt).getTime() + (ticket.totalHoldMinutes || 0) * 60000;
  const due = new Date(ticket.slaDueAt).getTime();
  if (due <= start) return new Date(due);
  return new Date(start + (due - start) * (percent / 100));
}

async function sendWarnings(now, settings, administrators) {
  const percent = Math.min(Math.max(settings?.slaWarningPercent ?? 75, 10), 99);
  const candidates = await prisma.ticket.findMany({
    where: { status: { in: RUNNING_STATUSES }, slaWarningSentAt: null, slaDueAt: { gt: now } },
    include: { assignedTo: { select: { id: true, name: true, email: true } } }
  });
  let sent = 0;
  for (const ticket of candidates) {
    const warnAt = warningMoment(ticket, percent);
    if (!warnAt || warnAt > now) continue;
    // Claim the stage first so a second instance running the job cannot double-send.
    const claimed = await prisma.ticket.updateMany({
      where: { id: ticket.id, slaWarningSentAt: null },
      data: { slaWarningSentAt: now }
    });
    if (!claimed.count) continue;

    const recipients = ticket.assignedTo ? [ticket.assignedTo] : administrators;
    const message = `${ticket.ticketNumber}: "${ticket.subject}" has used ${percent}% of its SLA time and is due ${formatDue(ticket.slaDueAt)}.`;
    for (const recipient of recipients) {
      await createTicketNotification({
        userId: recipient.id,
        ticket,
        type: 'sla_warning',
        title: 'Ticket approaching its SLA deadline',
        message,
        dedupeKey: `sla-warning-${ticket.id}`
      }).catch(() => null); // emails the officer if their escalation alerts are on
    }
    await recordTicketEvent(prisma, {
      ticketId: ticket.id,
      field: EVENTS.slaWarning,
      newValue: `${percent}% of SLA used`,
      actor: SYSTEM_ACTOR,
      note: `Alerted ${recipients.map(recipient => recipient.name).join(', ') || 'administrators'}; due ${formatDue(ticket.slaDueAt)}`
    });
    sent += 1;
  }
  return sent;
}

async function sendEscalations(now, settings, administrators) {
  const candidates = await prisma.ticket.findMany({
    where: {
      status: { in: RUNNING_STATUSES },
      slaEscalatedAt: null,
      OR: [
        { slaEscalationAt: { not: null, lte: now } },
        { slaEscalationAt: null, slaDueAt: { not: null, lte: now } }
      ]
    },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
    orderBy: { slaDueAt: 'asc' }
  });
  const extraEmails = parseEmails(settings?.escalationEmails);
  const { sendEmail } = require('./emailService');
  let escalated = 0;

  for (const ticket of candidates) {
    const claimed = await prisma.ticket.updateMany({
      where: { id: ticket.id, slaEscalatedAt: null },
      data: { slaEscalatedAt: now, slaBreached: true }
    });
    if (!claimed.count) continue;

    const message = `${ticket.ticketNumber}: "${ticket.subject}" (${ticket.priority}) has exceeded its SLA deadline of ${formatDue(ticket.slaDueAt)}. Assigned to: ${ticket.assignedTo?.name || 'nobody (unclaimed)'}.`;
    const officerRecipients = new Map(administrators.map(admin => [admin.id, admin]));
    if (ticket.assignedTo) officerRecipients.set(ticket.assignedTo.id, ticket.assignedTo);
    for (const recipient of officerRecipients.values()) {
      await createTicketNotification({
        userId: recipient.id,
        ticket,
        type: 'escalation',
        title: 'Ticket escalated: SLA exceeded',
        message,
        dedupeKey: `sla-overdue-${ticket.id}`
      }).catch(() => null);
    }
    // Officers are emailed through their notification (escalation alerts preference);
    // the configured escalation addresses (e.g. Head of ICT) are always emailed.
    const officerEmails = new Set([...officerRecipients.values()].map(recipient => String(recipient.email || '').toLowerCase()));
    const extraRecipients = extraEmails.filter(address => !officerEmails.has(address));
    for (const address of extraRecipients) {
      await sendEmailNotification(address, { title: 'Ticket escalated: SLA exceeded', message, ticketNumber: ticket.ticketNumber }).catch(() => null);
    }
    const emailRecipients = [...officerRecipients.values()].map(recipient => recipient.email).filter(Boolean).concat(extraRecipients);
    await sendEmail(ticket.requesterEmail, 'ticketUpdated', {
      ...ticket,
      comment: 'Your ticket is taking longer than our Service Charter target and has been escalated to ICT supervisors for priority attention. We will update you as soon as there is progress. No action is required from you.'
    }).catch(() => null);
    await recordTicketEvent(prisma, {
      ticketId: ticket.id,
      field: EVENTS.slaBreach,
      newValue: 'Automatically escalated (SLA exceeded)',
      actor: SYSTEM_ACTOR,
      note: `Escalated to ${emailRecipients.join(', ') || 'administrators'}`
    });
    escalated += 1;
  }
  return escalated;
}

async function runSlaEscalation(now = new Date()) {
  const [settings, administrators] = await Promise.all([
    prisma.systemSettings.findFirst({ select: { slaWarningPercent: true, escalationEmails: true } }),
    prisma.user.findMany({ where: { role: 'admin' }, select: { id: true, name: true, email: true } })
  ]);
  const warnings = await sendWarnings(now, settings, administrators);
  const escalations = await sendEscalations(now, settings, administrators);
  return { warnings, escalations };
}

function startNotificationJobs() {
  cron.schedule('*/15 * * * *', () => {
    runSlaEscalation().catch(error => {
      console.error('SLA escalation job failed:', error);
    });
  }, { timezone: 'Africa/Nairobi' });

  // Daily ticket summary for officers who opted in (weekdays 07:30 EAT).
  cron.schedule('30 7 * * 1-5', () => {
    sendDailyDigests().catch(error => console.error('Daily digest job failed:', error));
  }, { timezone: 'Africa/Nairobi' });
}

// Kept for callers of the previous API.
const sendEscalationAlerts = runSlaEscalation;

module.exports = { startNotificationJobs, runSlaEscalation, sendEscalationAlerts, warningMoment };
