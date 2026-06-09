const nodemailer = require('nodemailer');
const { simpleParser } = require('mailparser');
const Imap = require('imap');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function getInitialEmailSettings() {
  return {
    smtpHost: process.env.SMTP_HOST || process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || process.env.EMAIL_SMTP_PORT, 10) || 587,
    smtpSecure: String(process.env.SMTP_SECURE || process.env.EMAIL_SMTP_SECURE || '').toLowerCase() === 'true',
    smtpUser: process.env.SMTP_USER || process.env.EMAIL_USER || null,
    smtpPassword: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || null,
    imapHost: process.env.IMAP_HOST || 'imap.gmail.com',
    imapPort: parseInt(process.env.IMAP_PORT, 10) || 993,
    imapUser: process.env.IMAP_USER || process.env.EMAIL_USER || null,
    imapPassword: process.env.IMAP_PASSWORD || null,
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

  // Update cache
  settingsCache = settings;
  settingsCacheTimestamp = now;

  return settings;
}

function clearSettingsCache() {
  settingsCache = null;
  settingsCacheTimestamp = null;
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
      }
    });
  } else {
    // Fallback to original Gmail service from env
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
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

    // Replace common placeholders. Support both legacy [PLACEHOLDER] tokens and
    // the newer {{camelCase}} template tokens used by the admin reset defaults.
    const replacements = {
      '[TICKET_NUMBER]': data.ticketNumber || '',
      '{{ticketNumber}}': data.ticketNumber || '',
      '[SUBJECT]': data.subject || '',
      '{{subject}}': data.subject || '',
      '[DESCRIPTION]': data.description || '',
      '{{description}}': data.description || '',
      '[PRIORITY]': data.priority || '',
      '{{priority}}': data.priority || '',
      '[STATUS]': data.status || '',
      '{{status}}': data.status || '',
      '[CATEGORY]': data.category || '',
      '{{category}}': data.category || '',
      '[REQUESTER_NAME]': data.requesterName || '',
      '{{requesterName}}': data.requesterName || '',
      '[REQUESTER_EMAIL]': data.requesterEmail || '',
      '{{requesterEmail}}': data.requesterEmail || '',
      '[COMMENT]': data.comment || '',
      '{{comment}}': data.comment || '',
      '[RESOLUTION_COMMENT]': data.resolutionComment || '',
      '{{resolutionComment}}': data.resolutionComment || '',
      '[YEAR]': new Date().getFullYear().toString(),
      '{{year}}': new Date().getFullYear().toString(),
      '[ORGANIZATION_NAME]': settings.organizationName || 'KUCCPS IT Support',
      '{{organizationName}}': settings.organizationName || 'KUCCPS IT Support',
      '[EMAIL_FROM_NAME]': settings.emailFromName || 'KUCCPS IT Support',
      '{{emailFromName}}': settings.emailFromName || 'KUCCPS IT Support',
      '[SUPPORT_EMAIL]': settings.supportEmail || 'itsupport@kuccps.ac.ke',
      '{{supportEmail}}': settings.supportEmail || 'itsupport@kuccps.ac.ke',
      '{{primaryColor}}': settings.primaryColor || '#911414',
      '{{secondaryColor}}': settings.secondaryColor || '#d20001'
    };

    html = html
      .replace(/{{#if comment}}([\s\S]*?){{\/if}}/g, data.comment ? '$1' : '')
      .replace(/{{#if resolutionComment}}([\s\S]*?){{\/if}}/g, data.resolutionComment ? '$1' : '');

    const replaceAllLiteral = (input, token, value) =>
      input.split(token).join(String(value));

    // Apply replacements literally. Do not use RegExp here: legacy tokens like
    // [TICKET_NUMBER] contain regex metacharacters and would corrupt templates.
    for (const [placeholder, value] of Object.entries(replacements)) {
      subject = replaceAllLiteral(subject, placeholder, value);
      html = replaceAllLiteral(html, placeholder, value);
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
    const fromAddress = authenticatedSender || supportAddress;
    const mailOptions = {
      from: `${settings.emailFromName} <${fromAddress}>`,
      to: to,
      subject: subject,
      html: html,
      ...(supportAddress && supportAddress !== fromAddress ? { replyTo: supportAddress } : {}),
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

// Generate ticket number in format from settings
async function generateTicketNumber() {
  const settings = await getSystemSettings();
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
  const prefix = settings.ticketNumberPrefix || 'TICK';
  return `${prefix}-${dateStr}-${String(count + 1).padStart(4, '0')}`;
}

// Parse incoming email and create ticket
async function processIncomingEmail(emailData) {
  try {
    const parsed = await simpleParser(emailData);

    // Extract email details
    const from = parsed.from.value[0].address;
    const subject = parsed.subject || 'No Subject';
    const body = parsed.text || parsed.html || 'No content';
    const emailReferences = [
      parsed.inReplyTo,
      ...(Array.isArray(parsed.references) ? parsed.references : parsed.references ? [parsed.references] : [])
    ].filter(Boolean);

    // Get settings for ticket number prefix
    const settings = await getSystemSettings();
    const prefixRegex = settings.ticketNumberPrefix || 'TICK';
    const escapedPrefix = prefixRegex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const ticketNumberMatch = `${subject}\n${body}`.match(new RegExp(`(?:Ticket\\s*#)?(${escapedPrefix}-\\d{8}-\\d{4})`, 'i'));

    let ticket = null;
    let ticketNumber = null;

    if (ticketNumberMatch) {
      ticketNumber = ticketNumberMatch[1];
      ticket = await prisma.ticket.findFirst({ where: { ticketNumber } });
    }

    if (!ticket && emailReferences.length > 0) {
      ticket = await prisma.ticket.findFirst({
        where: {
          emailMessageId: { in: emailReferences }
        }
      });
      ticketNumber = ticket?.ticketNumber || null;
    }

    if (ticket) {
      // Resolve the comment author when the sender is a staff user. External
      // requester replies are stored with a null userId and shown as received.
      let userId = null;
      try {
        const commentAuthor = await prisma.user.findUnique({
          where: { email: from },
          select: { id: true }
        });
        userId = commentAuthor?.id || null;
      } catch (userErr) {
        console.log('Could not resolve comment author:', userErr.message);
      }

      await prisma.comment.create({
        data: {
          ticketId: ticket.id,
          userId: userId,
          content: body,
          isInternal: false
        }
      });

      if (!ticket.emailMessageId && parsed.messageId) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { emailMessageId: parsed.messageId }
        });
      }

      console.log(`Added reply to ticket ${ticketNumber}`);
      return { success: true, ticketNumber, isReply: true };
    }

    // Create new ticket with same format used by the main app
    const newTicketNumber = await generateTicketNumber();

    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber: newTicketNumber,
        subject: subject.substring(0, 255),
        description: body,
        requesterEmail: from,
        status: settings.defaultStatus || 'Open',
        priority: settings.defaultPriority || 'Medium',
        category: settings.defaultCategory || 'General Issues',
        emailMessageId: parsed.messageId || null
      }
    });

    // Send confirmation email
    const emailResult = await sendEmail(from, 'ticketCreated', newTicket);
    if (!newTicket.emailMessageId && emailResult.success && emailResult.messageId) {
      await prisma.ticket.update({
        where: { id: newTicket.id },
        data: { emailMessageId: emailResult.messageId }
      });
    }

    console.log(`Created new ticket ${newTicketNumber} from email`);
    return { success: true, ticketNumber: newTicketNumber, isReply: false };
  } catch (error) {
    console.error('Error processing email:', error);
    return { success: false, error: error.message };
  }
}

// Monitor inbox for new emails
function startEmailMonitoring() {
  const imap = new Imap({
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASSWORD,
    host: process.env.IMAP_HOST,
    port: parseInt(process.env.IMAP_PORT) || 993,
    tls: process.env.IMAP_TLS === 'true',
    tlsOptions: { rejectUnauthorized: false }
  });

  function openInbox(cb) {
    imap.openBox('INBOX', false, cb);
  }

  imap.once('ready', function() {
    console.log('✓ Email monitoring started');
    openInbox(function(err, box) {
      if (err) throw err;

      console.log('✓ Connected to inbox');

      // Listen for new emails
      imap.on('mail', function(numNewMsgs) {
        console.log(`${numNewMsgs} new email(s) received`);

        const fetch = imap.seq.fetch(box.messages.total + ':*', {
          bodies: '',
          struct: true
        });

        fetch.on('message', function(msg) {
          msg.on('body', function(stream) {
            processIncomingEmail(stream);
          });
        });
      });
    });
  });

  imap.once('error', function(err) {
    console.error('IMAP error:', err);
  });

  imap.once('end', function() {
    console.log('IMAP connection ended');
  });

  imap.connect();

  // Periodic fallback poll using node-cron to catch missed emails
  const pollInterval = parseInt(process.env.EMAIL_POLL_INTERVAL) || 5;
  if (cron.validate(`*/${pollInterval} * * * *`)) {
    cron.schedule(`*/${pollInterval} * * * *`, async () => {
      try {
        if (!imap || imap.state !== 'authenticated') return;
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            console.error('Cron poll openInbox error:', err.message);
            return;
          }
          const fetch = imap.seq.fetch(`${box.messages.total}:*`, {
            bodies: '',
            struct: true
          });
          fetch.on('message', function(msg) {
            msg.on('body', function(stream) {
              processIncomingEmail(stream);
            });
          });
        });
      } catch (e) {
        console.error('Cron poll error:', e.message);
      }
    });
    console.log(`✓ Email polling fallback scheduled every ${pollInterval} minutes`);
  }

  return imap;
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
  clearSettingsCache
};
