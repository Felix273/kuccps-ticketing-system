const nodemailer = require('nodemailer');
const { simpleParser } = require('mailparser');
const Imap = require('imap');
const cron = require('node-cron');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Create email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Email templates
const emailTemplates = {
  ticketCreated: (ticket) => ({
    subject: `[Ticket #${ticket.ticketNumber}] Your support request has been received`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #911414 0%, #d20001 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">KUCCPS IT Support</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #111827;">Ticket Created Successfully</h2>
          
          <p style="color: #4b5563; font-size: 16px;">
            Hello,
          </p>
          
          <p style="color: #4b5563; font-size: 16px;">
            Your support ticket has been created and assigned ticket number <strong>${ticket.ticketNumber}</strong>.
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #911414;">
            <h3 style="margin-top: 0; color: #111827;">Ticket Details</h3>
            <p style="margin: 10px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
            <p style="margin: 10px 0;"><strong>Priority:</strong> ${ticket.priority}</p>
            <p style="margin: 10px 0;"><strong>Status:</strong> ${ticket.status}</p>
            <p style="margin: 10px 0;"><strong>Category:</strong> ${ticket.category}</p>
          </div>
          
          <p style="color: #4b5563; font-size: 16px;">
            Our IT team will review your request and respond as soon as possible. You will receive email updates when there are changes to your ticket.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you have any questions, please reply to this email with your ticket number in the subject line.
          </p>
        </div>
        
        <div style="background-color: #911414; padding: 20px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 14px;">
            © ${new Date().getFullYear()} KUCCPS IT Department. All rights reserved.
          </p>
        </div>
      </div>
    `
  }),

  ticketUpdated: (ticket, comment) => ({
    subject: `[Ticket #${ticket.ticketNumber}] Update on your support request`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #911414 0%, #d20001 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">KUCCPS IT Support</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #111827;">Ticket Update</h2>
          
          <p style="color: #4b5563; font-size: 16px;">
            Hello,
          </p>
          
          <p style="color: #4b5563; font-size: 16px;">
            There's an update on your ticket <strong>${ticket.ticketNumber}</strong>.
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #911414;">
            <h3 style="margin-top: 0; color: #111827;">Current Status</h3>
            <p style="margin: 10px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
            <p style="margin: 10px 0;"><strong>Status:</strong> ${ticket.status}</p>
            <p style="margin: 10px 0;"><strong>Priority:</strong> ${ticket.priority}</p>
          </div>
          
          ${comment ? `
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #111827;">Latest Response</h3>
            <p style="color: #374151; white-space: pre-wrap;">${comment}</p>
          </div>
          ` : ''}
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            To respond, simply reply to this email.
          </p>
        </div>
        
        <div style="background-color: #911414; padding: 20px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 14px;">
            © ${new Date().getFullYear()} KUCCPS IT Department. All rights reserved.
          </p>
        </div>
      </div>
    `
  }),

  ticketResolved: (ticket, resolutionComment) => ({
    subject: `[Ticket #${ticket.ticketNumber}] Your support request has been resolved`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #911414 0%, #d20001 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">KUCCPS IT Support</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #111827;">✓ Ticket Resolved</h2>
          
          <p style="color: #4b5563; font-size: 16px;">
            Hello,
          </p>
          
          <p style="color: #4b5563; font-size: 16px;">
            Great news! Your support ticket <strong>${ticket.ticketNumber}</strong> has been resolved.
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #111827;">Ticket Details</h3>
            <p style="margin: 10px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
            <p style="margin: 10px 0;"><strong>Status:</strong> ${ticket.status}</p>
          </div>
          
          ${resolutionComment ? `
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #111827;">Resolution Details</h3>
            <p style="color: #374151; white-space: pre-wrap;">${resolutionComment}</p>
          </div>
          ` : ''}
          
          <p style="color: #4b5563; font-size: 16px;">
            If you're satisfied with the resolution, no further action is needed. If you need additional assistance, please reply to this email.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Thank you for using KUCCPS IT Support!
          </p>
        </div>
        
        <div style="background-color: #911414; padding: 20px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 14px;">
            © ${new Date().getFullYear()} KUCCPS IT Department. All rights reserved.
          </p>
        </div>
      </div>
    `
  })
};

// Send email function
async function sendEmail(to, template, data) {
  try {
    const emailContent = emailTemplates[template](data);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Generate ticket number in TICK-YYYYMM-XXXX format
async function generateTicketNumber() {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const count = await prisma.ticket.count({
    where: { createdAt: { gte: todayStart, lt: todayEnd } }
  });
  return `TICK-${dateStr}-${String(count + 1).padStart(4, '0')}`;
}

// Parse incoming email and create ticket
async function processIncomingEmail(emailData) {
  try {
    const parsed = await simpleParser(emailData);
    
    // Extract email details
    const from = parsed.from.value[0].address;
    const subject = parsed.subject || 'No Subject';
    const body = parsed.text || parsed.html || 'No content';
    
    // Check if this is a reply to existing ticket (look for ticket number in subject)
    const ticketNumberMatch = subject.match(/\[Ticket #(TICK-\d{8}-\d{4})\]/);
    
    if (ticketNumberMatch) {
      // This is a reply to an existing ticket
      const ticketNumber = ticketNumberMatch[1];
      const ticket = await prisma.ticket.findFirst({
        where: { ticketNumber }
      });
      
      if (ticket) {
        // Resolve the comment author: find existing user or create a lightweight placeholder
        let userId = null;
        try {
          let commentAuthor = await prisma.user.findUnique({
            where: { email: from },
            select: { id: true }
          });
          if (!commentAuthor) {
            commentAuthor = await prisma.user.create({
              data: {
                email: from,
                username: from.split('@')[0],
                name: from.split('@')[0],
                password: await bcrypt.hash(Math.random().toString(36), 10),
                role: 'staff'
              },
              select: { id: true }
            });
          }
          userId = commentAuthor.id;
        } catch (userErr) {
          console.log('Could not resolve comment author:', userErr.message);
        }

        // Add comment to existing ticket
        await prisma.comment.create({
          data: {
            ticketId: ticket.id,
            userId: userId,
            content: body,
            isInternal: false
          }
        });
        
        console.log(`Added reply to ticket ${ticketNumber}`);
        return { success: true, ticketNumber, isReply: true };
      }
    }
    
    // Create new ticket with same TICK-YYYYMM-XXXX format used by the main app
    const newTicketNumber = await generateTicketNumber();
    
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: newTicketNumber,
        subject: subject.substring(0, 255),
        description: body,
        requesterEmail: from,
        status: 'Open',
        priority: 'Medium',
        category: 'General Issues'
      }
    });
    
    // Send confirmation email
    await sendEmail(from, 'ticketCreated', ticket);
    
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
  processIncomingEmail,
  startEmailMonitoring,
  emailTemplates,
  generateTicketNumber
};
