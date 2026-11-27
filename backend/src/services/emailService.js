const nodemailer = require('nodemailer');
const { simpleParser } = require('mailparser');
const Imap = require('imap');
const cron = require('node-cron');
const { getConfiguredTicketSlaDeadlines, getTicketSlaChecks } = require('./slaService');
const { getDefaultAllowedFileTypesRelation } = require('./systemSettingsDefaults');
const {
  ensureWorkingCsatLinks,
  removeLegacyCsatSection,
  renderCsatLinks
} = require('./csatService');
const { normalizePriority, normalizeStatus, normalizeCategory } = require('./ticketEnums');
const { EVENTS, recordTicketEvent } = require('./ticketActivity');
// notificationService imports this module, so it is required lazily to avoid a cycle.
const createTicketNotification = (...args) => require('./notificationService').createTicketNotification(...args);

function formatExpectedDate(date) {
  return new Date(date).toLocaleString('en-GB', {
    timeZone: process.env.TICKET_TIMEZONE || 'Africa/Nairobi',
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) + ' (EAT)';
}
const { createTicketWithNumber } = require('./ticketNumber');
const { escapeHtml, textToHtml, safeColor } = require('../utils/html');
const { encryptSecret, withDecryptedSecrets } = require('./secretBox');

const prisma = require('../lib/prisma');

function getInitialEmailSettings() {
  return {
    allowedFileTypes: getDefaultAllowedFileTypesRelation(),
    smtpHost: process.env.SMTP_HOST || process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || process.env.EMAIL_SMTP_PORT, 10) || 587,
    smtpSecure: String(process.env.SMTP_SECURE || process.env.EMAIL_SMTP_SECURE || '').toLowerCase() === 'true',
    smtpUser: process.env.SMTP_USER || process.env.EMAIL_USER || null,
    smtpPassword: encryptSecret(process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || null),
    imapHost: process.env.IMAP_HOST || 'imap.gmail.com',
    imapPort: parseInt(process.env.IMAP_PORT, 10) || 993,
    imapUser: process.env.IMAP_USER || process.env.EMAIL_USER || null,
    imapPassword: encryptSecret(process.env.IMAP_PASSWORD || null),
    imapEnabled: String(process.env.IMAP_ENABLED || '').toLowerCase() === 'true',
    imapPollInterval: parseInt(process.env.EMAIL_POLL_INTERVAL || process.env.IMAP_POLL_INTERVAL, 10) || 5
  };
}

// Cache for settings to avoid fetching on every email
let settingsCache = null;
let settingsCacheTimestamp = null;
const SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache for email templates
let templatesCache = null;
let templatesCacheTimestamp = null;
const TEMPLATES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get system settings with caching
async function getSystemSettings() {
  const now = Date.now();

  // Return cached settings if still valid
  if (settingsCache && settingsCacheTimestamp && (now - settingsCacheTimestamp) < SETTINGS_CACHE_TTL) {
    return settingsCache;
  }

  // Fetch fresh settings
  let settings = await prisma.systemSettings.findFirst();

  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: getInitialEmailSettings()
    });
  }

  // Update cache (credentials decrypted for internal use; never sent to clients)
  settingsCache = withDecryptedSecrets(settings);
  settings = settingsCache;
  settingsCacheTimestamp = now;

  return settings;
}

// Clears both the settings and the email-template caches so admin edits apply immediately.
function clearSettingsCache() {
  settingsCache = null;
  settingsCacheTimestamp = null;
  templatesCache = null;
  templatesCacheTimestamp = null;
}

// Get email templates with caching
async function getEmailTemplates() {
  const now = Date.now();

  // Return cached templates if still valid
  if (templatesCache && templatesCacheTimestamp && (now - templatesCacheTimestamp) < TEMPLATES_CACHE_TTL) {
    return templatesCache;
  }

  // Fetch fresh templates
  const templateRecords = await prisma.emailTemplate.findMany();

  // Convert to object keyed by type
  const templates = {};
  // Ensure templateRecords is an array before iterating
  if (Array.isArray(templateRecords)) {
    templateRecords.forEach(template => {
      templates[template.type] = {
        subject: template.subject,
        html: template.html
      };
    });
  }

  // Update cache
  templatesCache = templates;
  templatesCacheTimestamp = now;

  return templates;
}

// Create email transporter with dynamic settings
async function createEmailTransporter() {
  const settings = await getSystemSettings();
  const smtpPort = Number(settings?.smtpPort || process.env.SMTP_PORT || process.env.EMAIL_SMTP_PORT || 587);
  const rejectUnauthorized = String(process.env.SMTP_TLS_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false';
  const smtpSecure = smtpPort === 465
    ? true
    : smtpPort === 587
      ? false
      : Boolean(settings?.smtpSecure);

  // Use SMTP settings if configured, otherwise fall back to Gmail service
  if (settings && settings.smtpHost && settings.smtpUser && settings.smtpPassword) {
    return nodemailer.createTransport({
      host: settings.smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword
      },
      tls: { rejectUnauthorized }
    });
  } else {
    // Fallback to original Gmail service from env
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: { rejectUnauthorized }
    });
  }
}

// Send email function
async function sendEmail(to, templateType, data) {
  try {
    const transporter = await createEmailTransporter();
    const settings = await getSystemSettings();
    const templates = await getEmailTemplates();

    // Get template for the given type
    const template = templates[templateType];

    if (!template) {
      throw new Error(`Email template not found for type: ${templateType}`);
    }

    // Replace placeholders in subject and html
    let subject = template.subject;
    let html = template.html;
    if (templateType === 'ticketResolved') {
      html = removeLegacyCsatSection(html);
    }

    // Replace common placeholders. Support both legacy [PLACEHOLDER] tokens and
    // the newer {{camelCase}} template tokens used by the admin reset defaults.
    // Text values come from requesters and staff, so they are HTML-escaped in the
    // body (the subject line is plain text and uses the raw values).
    const primaryColor = safeColor(settings.primaryColor, '#911414');
    const textValues = {
      TICKET_NUMBER: ['ticketNumber', data.ticketNumber],
      SUBJECT: ['subject', data.subject],
      DESCRIPTION: ['description', data.description],
      PRIORITY: ['priority', data.priority],
      STATUS: ['status', data.status],
      CATEGORY: ['category', data.category],
      REQUESTER_NAME: ['requesterName', data.requesterName],
      REQUESTER_EMAIL: ['requesterEmail', data.requesterEmail],
      COMMENT: ['comment', data.comment],
      RESOLUTION_COMMENT: ['resolutionComment', data.resolutionComment],
      YEAR: ['year', new Date().getFullYear().toString()],
      ORGANIZATION_NAME: ['organizationName', settings.organizationName || 'KUCCPS IT Support'],
      EMAIL_FROM_NAME: ['emailFromName', settings.emailFromName || 'KUCCPS IT Support'],
      SUPPORT_EMAIL: ['supportEmail', settings.supportEmail || 'itsupport@kuccps.ac.ke'],
      NOREPLY_EMAIL: ['noreplyEmail', settings.noreplyEmail || settings.supportEmail || 'noreply@kuccps.ac.ke']
    };
    const subjectReplacements = {};
    const replacements = {};
    for (const [legacyToken, [camelToken, value]] of Object.entries(textValues)) {
      const raw = String(value ?? '');
      subjectReplacements[`[${legacyToken}]`] = raw;
      subjectReplacements[`{{${camelToken}}}`] = raw;
      replacements[`[${legacyToken}]`] = textToHtml(raw);
      replacements[`{{${camelToken}}}`] = textToHtml(raw);
    }
    const secondaryColor = safeColor(settings.secondaryColor, '#d20001');
    Object.assign(replacements, {
      '{{primaryColor}}': primaryColor,
      '{{secondaryColor}}': secondaryColor,
      '[PRIMARY_COLOR]': primaryColor,
      '[SECONDARY_COLOR]': secondaryColor,
      '{{expectedResolution}}': escapeHtml(data.expectedResolution || ''),
      '[EXPECTED_RESOLUTION]': escapeHtml(data.expectedResolution || ''),
      '{{csatLinks}}': templateType === 'ticketResolved' && data.id && data.requesterEmail
        ? renderCsatLinks(data, primaryColor)
        : '',
      '{{ticketId}}': escapeHtml(data.id || ''),
      '{{csatRatingUrl}}': escapeHtml(`${process.env.FRONTEND_URL || 'https://itsupport.kuccps.ac.ke'}/api/operations/csat/rate`)
    });

    html = html
      .replace(/{{#if comment}}([\s\S]*?){{\/if}}/g, data.comment ? '$1' : '')
      .replace(/{{#if resolutionComment}}([\s\S]*?){{\/if}}/g, data.resolutionComment ? '$1' : '');

    const replaceAllLiteral = (input, token, value) =>
      input.split(token).join(String(value));

    // Track whether the template had a {{csatLinks}} placeholder before replacement.
    // If it did, the loop below already replaced it with rendered links; if not,
    // we need to append them via ensureWorkingCsatLinks.
    const hadCsatLinksPlaceholder = html.includes('{{csatLinks}}');

    // Apply replacements literally. Do not use RegExp here: legacy tokens like
    // [TICKET_NUMBER] contain regex metacharacters and would corrupt templates.
    for (const [placeholder, value] of Object.entries(subjectReplacements)) {
      subject = replaceAllLiteral(subject, placeholder, value);
    }
    const templateHasExpectedDate = /\{\{expectedResolution\}\}|\[EXPECTED_RESOLUTION\]/.test(html);
    for (const [placeholder, value] of Object.entries(replacements)) {
      html = replaceAllLiteral(html, placeholder, value);
    }

    // The acknowledgement always states the Service Charter resolution target, even if an
    // administrator's template does not include the {{expectedResolution}} placeholder.
    if (data.expectedResolution && !templateHasExpectedDate) {
      const notice = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0"><tr><td style="padding:14px 16px;border:1px solid #e4e4e7;border-left:4px solid ${primaryColor};border-radius:6px;font-family:Arial,sans-serif;font-size:13px;color:#18181b">` +
        `<strong>Expected resolution:</strong> ${escapeHtml(data.expectedResolution)}<br>` +
        '<span style="color:#71717a">Based on the ICT Service Charter. We will email you if this changes. No action is required from you unless an officer contacts you.</span>' +
        '</td></tr></table>';
      html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${notice}</body>`) : `${html}${notice}`;
    }

    if (templateType === 'ticketResolved' && data.id && data.requesterEmail) {
      // Only append CSAT links if the template did not already contain {{csatLinks}}.
      // When {{csatLinks}} was present it was already replaced above; calling
      // ensureWorkingCsatLinks unconditionally would append a duplicate block.
      if (!hadCsatLinksPlaceholder) {
        html = ensureWorkingCsatLinks(html, data, primaryColor);
      }
    }

    const ticketTemplateTypes = new Set(['ticketCreated', 'ticketUpdated', 'ticketResolved']);
    if (ticketTemplateTypes.has(templateType) && data.ticketNumber) {
      const cleanTicketSubject = String(data.subject || 'Support request')
        .replace(new RegExp(`^\\s*(re|fw|fwd):\\s*`, 'i'), '')
        .trim();
      subject = `[Ticket #${data.ticketNumber}] ${cleanTicketSubject}`;
    }

    const authenticatedSender = settings.smtpUser || process.env.EMAIL_USER;
    const supportAddress = settings.supportEmail || authenticatedSender;
    const noReplyAddress = settings.noreplyEmail || supportAddress;
    const fromAddress = authenticatedSender || supportAddress;
    // Test mode: every email goes to the ICT test mailbox instead of real users.
    const testAddress = settings.emailTestMode && settings.emailTestAddress ? settings.emailTestAddress : null;
    if (testAddress) subject = `[TEST → ${to}] ${subject}`;
    const mailOptions = {
      from: { name: settings.emailFromName || 'KUCCPS IT Support', address: fromAddress },
      to: testAddress || to,
      subject: subject,
      html: html,
      ...(noReplyAddress ? { replyTo: noReplyAddress } : {}),
      ...(data.emailMessageId ? {
        inReplyTo: data.emailMessageId,
        references: data.emailMessageId
      } : {})
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

async function sendTicketReply(ticket, comment) {
  return sendEmail(ticket.requesterEmail, 'ticketUpdated', {
    ...ticket,
    comment,
    emailMessageId: ticket.emailMessageId
  });
}

// Legacy export kept for callers; new tickets use createTicketWithNumber().
async function generateTicketNumber() {
  const { nextTicketNumber } = require('./ticketNumber');
  return nextTicketNumber(prisma);
}

const MAX_EMAIL_BODY_LENGTH = 10000;
const AUTOMATED_SENDER_PATTERN = /^(mailer-daemon|postmaster|no-?reply|do-?not-?reply|bounce[s]?)@/i;

function htmlToText(html) {
  return String(html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getEmailBody(parsed) {
  const text = parsed.text || htmlToText(parsed.html) || 'No content';
  return text.replace(/\u0000/g, '').trim().slice(0, MAX_EMAIL_BODY_LENGTH) || 'No content';
}

// Auto-replies, bounces and list mail must never open tickets or trigger
// confirmations, otherwise two auto-responders can loop indefinitely.
function isAutomatedMessage(parsed, from, ownAddresses) {
  const autoSubmitted = String(parsed.headers?.get('auto-submitted') || '').toLowerCase();
  if (autoSubmitted && autoSubmitted !== 'no') return true;
  const precedence = String(parsed.headers?.get('precedence') || '').toLowerCase();
  if (['bulk', 'junk', 'list', 'auto_reply'].includes(precedence)) return true;
  if (parsed.headers?.has('x-autoreply') || parsed.headers?.has('x-autorespond')) return true;
  if (AUTOMATED_SENDER_PATTERN.test(from)) return true;
  return ownAddresses.has(from);
}

// Only trust a sender's identity for staff attribution when the receiving
// server did not record an SPF/DKIM/DMARC failure for the message.
function hasFailedSenderAuthentication(parsed) {
  const results = parsed.headers?.get('authentication-results');
  const text = (Array.isArray(results) ? results.join(' ') : String(results || '')).toLowerCase();
  return /\b(dmarc|spf|dkim)=(fail|softfail|permerror)\b/.test(text);
}

async function claimMessageId(messageId) {
  if (!messageId) return true;
  try {
    await prisma.processedEmail.create({ data: { messageId } });
    return true;
  } catch (error) {
    if (error.code === 'P2002') return false;
    throw error;
  }
}

async function releaseMessageId(messageId) {
  if (!messageId) return;
  await prisma.processedEmail.delete({ where: { messageId } }).catch(() => null);
}

// Parse an incoming email and either add it to an existing ticket or open a new one.
async function processIncomingEmail(emailData) {
  let claimedMessageId = null;
  try {
    const parsed = await simpleParser(emailData);
    const from = String(parsed.from?.value?.[0]?.address || '').trim().toLowerCase();
    if (!from) return { success: false, skipped: true, reason: 'missing sender' };

    const settings = await getSystemSettings();
    const ownAddresses = new Set([
      settings.smtpUser, settings.supportEmail, settings.noreplyEmail, settings.imapUser,
      process.env.EMAIL_USER, process.env.IMAP_USER, process.env.SUPPORT_EMAIL
    ].filter(Boolean).map(address => String(address).toLowerCase()));
    if (isAutomatedMessage(parsed, from, ownAddresses)) {
      console.log('Skipped automated/self-sent email from', from);
      return { success: true, skipped: true, reason: 'automated message' };
    }

    const messageId = parsed.messageId || null;
    if (!(await claimMessageId(messageId))) {
      return { success: true, skipped: true, reason: 'already processed' };
    }
    claimedMessageId = messageId;

    const subject = String(parsed.subject || 'No Subject').replace(/\u0000/g, '').trim() || 'No Subject';
    const body = getEmailBody(parsed);
    const emailReferences = [
      parsed.inReplyTo,
      ...(Array.isArray(parsed.references) ? parsed.references : parsed.references ? [parsed.references] : [])
    ].filter(Boolean);

    // Match replies by the ticket number in the subject, then by mail threading headers.
    const escapedPrefix = (settings.ticketNumberPrefix || 'TICK').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const ticketNumberMatch = subject.match(new RegExp(`(${escapedPrefix}-\\d{8}-\\d{4,})`, 'i'));
    let ticket = null;
    if (ticketNumberMatch) {
      ticket = await prisma.ticket.findFirst({ where: { ticketNumber: ticketNumberMatch[1].toUpperCase() } });
    }
    if (!ticket && emailReferences.length > 0) {
      ticket = await prisma.ticket.findFirst({ where: { emailMessageId: { in: emailReferences } } });
    }

    const senderUser = await prisma.user.findUnique({
      where: { email: from },
      select: { id: true, role: true }
    });
    const senderIsStaff = ['staff', 'admin'].includes(senderUser?.role) && !hasFailedSenderAuthentication(parsed);

    // A reply is accepted only from the ticket's requester or ICT staff. Anyone else
    // quoting a ticket number gets a new ticket instead of writing into someone else's.
    const isRequester = Boolean(ticket) && ticket.requesterEmail.toLowerCase() === from;
    const isFinished = Boolean(ticket) && ['Resolved', 'Closed'].includes(ticket.status);
    const reopenWindowMs = (settings.reopenWindowDays ?? 14) * 24 * 60 * 60 * 1000;
    const finishedAt = ticket?.closedAt || ticket?.resolvedAt;
    const withinReopenWindow = !finishedAt || Date.now() - new Date(finishedAt).getTime() <= reopenWindowMs;

    // A requester replying to a long-closed ticket gets a new ticket instead of a reopen.
    if (ticket && (senderIsStaff || (isRequester && (!isFinished || withinReopenWindow)))) {
      if (isRequester && isFinished) {
        // Team decision: a requester's reply never reopens a closed ticket. The reply is kept
        // on the ticket and the officer is alerted so they can reopen it if needed.
        await recordTicketEvent(prisma, {
          ticketId: ticket.id,
          field: EVENTS.emailReply,
          newValue: 'Requester replied after closure',
          actor: { id: from, name: `Requester (${from})` },
          note: body.slice(0, 500)
        });
        const recipients = ticket.assignedToId
          ? [ticket.assignedToId]
          : (await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } })).map(user => user.id);
        for (const userId of recipients) {
          await createTicketNotification({
            userId,
            ticket,
            type: 'comment',
            title: 'Requester replied to a closed ticket',
            message: `${ticket.ticketNumber}: review the reply and reopen the ticket if the issue persists`
          }).catch(() => null);
        }
      }
      if (senderIsStaff && !ticket.firstRespondedAt) {
        const respondedAt = new Date();
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            firstRespondedAt: respondedAt,
            slaBreached: ticket.slaBreached || getTicketSlaChecks({
              ...ticket,
              firstRespondedAt: respondedAt
            }, respondedAt).some(check => !check),
            responseTime: Math.floor((respondedAt - new Date(ticket.createdAt)) / 60000)
          }
        });
      }

      await prisma.comment.create({
        data: {
          ticketId: ticket.id,
          userId: senderIsStaff ? senderUser.id : null,
          content: body,
          isInternal: false
        }
      });

      if (!ticket.emailMessageId && messageId) {
        await prisma.ticket.update({ where: { id: ticket.id }, data: { emailMessageId: messageId } });
      }
      if (messageId) {
        await prisma.processedEmail.update({ where: { messageId }, data: { ticketId: ticket.id } }).catch(() => null);
      }

      // Tell the officer the requester replied (closed tickets are alerted above).
      if (isRequester && !isFinished) {
        const { notifyPermissionHolders } = require('./notificationService');
        const alert = {
          ticket,
          type: 'comment',
          title: 'Requester replied',
          message: `${ticket.ticketNumber}: ${body.slice(0, 300)}`
        };
        if (ticket.assignedToId) {
          await createTicketNotification({ userId: ticket.assignedToId, ...alert }).catch(() => null);
        } else {
          await notifyPermissionHolders({ permission: 'tickets.assign', ...alert }).catch(() => null);
        }
      }

      console.log(`Added email reply to ticket ${ticket.ticketNumber}`);
      return { success: true, ticketNumber: ticket.ticketNumber, isReply: true };
    }

    const createdAt = new Date();
    const category = normalizeCategory(settings.defaultCategory);
    const priority = normalizePriority(settings.defaultPriority) || 'Medium';
    const slaDeadlines = await getConfiguredTicketSlaDeadlines(prisma, category, priority, createdAt);
    const requesterName = String(parsed.from?.value?.[0]?.name || '').trim().slice(0, 160) || null;

    const newTicket = await createTicketWithNumber(ticketNumber => prisma.ticket.create({
      data: {
        ticketNumber,
        subject: subject.substring(0, 255),
        description: body,
        requesterEmail: from,
        requesterName,
        status: normalizeStatus(settings.defaultStatus) || 'Open',
        priority,
        category,
        createdById: senderUser?.id || null,
        departmentId: null,
        emailMessageId: messageId,
        createdAt,
        responseDueAt: slaDeadlines.responseDueAt,
        slaDueAt: slaDeadlines.slaDueAt,
        slaEscalationAt: slaDeadlines.slaEscalationAt,
        slaResponseTargetPercent: slaDeadlines.slaResponseTargetPercent,
        slaResolutionTargetPercent: slaDeadlines.slaResolutionTargetPercent,
        slaBreached: false
      }
    }));
    if (messageId) {
      await prisma.processedEmail.update({ where: { messageId }, data: { ticketId: newTicket.id } }).catch(() => null);
    }

    const expectedResolution = newTicket.slaDueAt ? formatExpectedDate(newTicket.slaDueAt) : null;
    await recordTicketEvent(prisma, {
      ticketId: newTicket.id,
      field: EVENTS.created,
      newValue: newTicket.ticketNumber,
      actor: { id: from, name: requesterName || from },
      note: `Received by email${expectedResolution ? `; expected resolution ${expectedResolution}` : ''}`
    });
    const emailResult = await sendEmail(from, 'ticketCreated', { ...newTicket, expectedResolution });
    if (!newTicket.emailMessageId && emailResult.success && emailResult.messageId) {
      await prisma.ticket.update({
        where: { id: newTicket.id },
        data: { emailMessageId: emailResult.messageId }
      });
    }

    // Alert the service desk that a new ticket is waiting in the queue.
    await require('./notificationService').notifyPermissionHolders({
      permission: 'tickets.work',
      ticket: newTicket,
      type: 'new_ticket',
      title: 'New ticket in the queue',
      message: `${newTicket.ticketNumber}: ${newTicket.subject}\nFrom: ${from} · ${newTicket.category} · ${newTicket.priority}${expectedResolution ? `\nExpected resolution: ${expectedResolution}` : ''}`
    }).catch(error => console.error('New ticket alert failed:', error.message));

    console.log(`Created new ticket ${newTicket.ticketNumber} from email`);
    return { success: true, ticketNumber: newTicket.ticketNumber, isReply: false };
  } catch (error) {
    // Allow a later poll to retry a message whose processing failed part-way.
    await releaseMessageId(claimedMessageId);
    console.error('Error processing email:', error.message);
    return { success: false, error: error.message };
  }
}

// IMAP connection settings: Settings → Email when inbound email is enabled there,
// otherwise the IMAP_* environment variables. Returns null when neither is configured.
async function getImapConfig() {
  clearSettingsCache();
  const settings = await getSystemSettings();
  if (settings.imapEnabled && settings.imapHost && settings.imapUser && settings.imapPassword) {
    const port = settings.imapPort || 993;
    return {
      user: settings.imapUser,
      password: settings.imapPassword,
      host: settings.imapHost,
      port,
      // 993 (IMAPS) is encrypted; 143/3143 are plain IMAP (allowed only outside production).
      tls: !(process.env.NODE_ENV !== 'production' && [143, 3143].includes(Number(port)))
    };
  }
  if (process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASSWORD) {
    return {
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASSWORD,
      host: process.env.IMAP_HOST,
      port: parseInt(process.env.IMAP_PORT, 10) || 993,
      tls: String(process.env.IMAP_TLS || 'true').toLowerCase() !== 'false'
    };
  }
  return null;
}

function readStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.once('end', () => resolve(Buffer.concat(chunks)));
    stream.once('error', reject);
  });
}

// Monitor the inbox: process UNSEEN messages, flag each as \Seen only after it has
// been handled, and reconnect with backoff if the connection drops.
function startEmailMonitoring() {
  const rejectUnauthorized = String(process.env.IMAP_TLS_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false';
  const envPollMinutes = parseInt(process.env.EMAIL_POLL_INTERVAL || process.env.IMAP_POLL_INTERVAL, 10) || 5;
  let imap = null;
  let processing = false;
  let pendingRun = false;
  let reconnectDelayMs = 5000;
  let reconnectTimer = null;

  function processUnseen() {
    if (!imap || imap.state !== 'authenticated') return;
    if (processing) {
      pendingRun = true;
      return;
    }
    processing = true;
    const connection = imap;

    connection.search(['UNSEEN'], (searchError, uids) => {
      if (searchError || !uids?.length) {
        if (searchError) console.error('IMAP search error:', searchError.message);
        finishRun();
        return;
      }

      const messages = [];
      const fetch = connection.fetch(uids, { bodies: '', markSeen: false });
      fetch.on('message', msg => {
        const message = { uid: null, body: null };
        messages.push(message);
        msg.once('attributes', attrs => { message.uid = attrs.uid; });
        msg.on('body', stream => { message.body = readStream(stream); });
      });
      fetch.once('error', fetchError => console.error('IMAP fetch error:', fetchError.message));
      fetch.once('end', async () => {
        for (const message of messages) {
          try {
            const result = await processIncomingEmail(await message.body);
            if (result.success && message.uid) {
              await new Promise(resolve => connection.addFlags(message.uid, '\\Seen', () => resolve()));
            }
          } catch (error) {
            console.error('Inbound email handling failed:', error.message);
          }
        }
        finishRun();
      });
    });
  }

  function finishRun() {
    processing = false;
    if (pendingRun) {
      pendingRun = false;
      setImmediate(processUnseen);
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    console.log(`IMAP reconnecting in ${Math.round(reconnectDelayMs / 1000)}s`);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect().catch(error => {
        console.error('IMAP connection setup failed:', error.message);
        scheduleReconnect();
      });
    }, reconnectDelayMs);
    reconnectDelayMs = Math.min(reconnectDelayMs * 2, 5 * 60 * 1000);
  }

  async function connect() {
    const config = await getImapConfig();
    if (!config) {
      console.log('Inbound email is not configured; monitoring stopped');
      return;
    }
    imap = new Imap({ ...config, tlsOptions: { rejectUnauthorized }, keepalive: true });

    imap.once('ready', () => {
      reconnectDelayMs = 5000;
      imap.openBox('INBOX', false, openError => {
        if (openError) {
          console.error('IMAP open inbox error:', openError.message);
          imap.end();
          return;
        }
        console.log('✓ Email monitoring connected to inbox');
        processUnseen();
      });
    });
    imap.on('mail', () => processUnseen());
    imap.once('error', error => {
      console.error('IMAP error:', error.message);
      scheduleReconnect();
    });
    imap.once('end', () => {
      console.log('IMAP connection ended');
      scheduleReconnect();
    });
    imap.connect();
  }

  connect().catch(error => {
    console.error('IMAP connection setup failed:', error.message);
    scheduleReconnect();
  });

  // Fallback poll in case IDLE notifications are missed, every 'Email polling interval'
  // minutes from Settings → Email (falls back to EMAIL_POLL_INTERVAL, default 5).
  let minutesSincePoll = 0;
  cron.schedule('* * * * *', async () => {
    minutesSincePoll += 1;
    const settings = await getSystemSettings().catch(() => null);
    const interval = Math.min(Math.max(Number(settings?.imapPollInterval) || envPollMinutes, 1), 59);
    if (minutesSincePoll >= interval) {
      minutesSincePoll = 0;
      processUnseen();
    }
  });
  console.log('✓ Email polling fallback scheduled (interval from Settings → Email)');

  return { processUnseen };
}

module.exports = {
  sendEmail,
  sendTicketReply,
  processIncomingEmail,
  startEmailMonitoring,
  generateTicketNumber,
  getSystemSettings,
  getEmailTemplates,
  createEmailTransporter,
  clearSettingsCache,
  getImapConfig,
  htmlToText,
  isAutomatedMessage
};
