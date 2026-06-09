const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const ictDept = await prisma.department.upsert({
    where: { name: 'ICT' },
    update: {},
    create: { name: 'ICT', code: 'ICT' }
  });

  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@kuccps.ac.ke',
      name: 'System Administrator',
      password: adminPassword,
      role: 'admin',
      departmentId: ictDept.id
    }
  });

  const staffPassword = await bcrypt.hash('staff123', 10);
  await prisma.user.upsert({
    where: { username: 'itstaff' },
    update: {},
    create: {
      username: 'itstaff',
      email: 'itstaff@kuccps.ac.ke',
      name: 'IT Support Staff',
      password: staffPassword,
      role: 'staff',
      departmentId: ictDept.id
    }
  });

  const settingsCount = await prisma.systemSettings.count();
  if (settingsCount === 0) {
    await prisma.systemSettings.create({
      data: {}
    });
    console.log('Default system settings created');
  }

  // Create default email templates
  const emailTemplatesCount = await prisma.emailTemplate.count();
  if (emailTemplatesCount === 0) {
    const defaultTemplates = [
      {
        type: 'ticketCreated',
        subject: '[Ticket #[TICKET_NUMBER]] Your support request has been received',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, [PRIMARY_COLOR] 0%, [SECONDARY_COLOR] 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">[EMAIL_FROM_NAME]</h1>
            </div>

            <div style="padding: 30px; background-color: #f9fafb;">
              <h2 style="color: #111827;">Ticket Created Successfully</h2>

              <p style="color: #4b5563; font-size: 16px;">
                Hello,
              </p>

              <p style="color: #4b5563; font-size: 16px;">
                Your support ticket has been created and assigned ticket number <strong>[TICKET_NUMBER]</strong>.
              </p>

              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid [PRIMARY_COLOR];">
                <h3 style="margin-top: 0; color: #111827;">Ticket Details</h3>
                <p style="margin: 10px 0;"><strong>Subject:</strong> [SUBJECT]</p>
                <p style="margin: 10px 0;"><strong>Priority:</strong> [PRIORITY]</p>
                <p style="margin: 10px 0;"><strong>Status:</strong> [STATUS]</p>
                <p style="margin: 10px 0;"><strong>Category:</strong> [CATEGORY]</p>
              </div>

              <p style="color: #4b5563; font-size: 16px;">
                Our IT team will review your request and respond as soon as possible. You will receive email updates when there are changes to your ticket.
              </p>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                If you have any questions, please reply to this email with your ticket number in the subject line.
              </p>
            </div>

            <div style="background-color: {{primaryColor}}; padding: 20px; text-align: center;">
              <p style="color: white; margin: 0; font-size: 14px;">
                © {{year}} {{organizationName}}. All rights reserved.
              </p>
            </div>
          </div>
        `
      },
      {
        type: 'ticketUpdated',
        subject: '[Ticket #{{ticketNumber}}] Update on your support request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">{{emailFromName}}</h1>
            </div>

            <div style="padding: 30px; background-color: #f9fafb;">
              <h2 style="color: #111827;">Ticket Update</h2>

              <p style="color: #4b5563; font-size: 16px;">
                Hello,
              </p>

              <p style="color: #4b5563; font-size: 16px;">
                There's an update on your ticket <strong>{{ticketNumber}}</strong>.
              </p>

              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid {{primaryColor}};">
                <h3 style="margin-top: 0; color: #111827;">Current Status</h3>
                <p style="margin: 10px 0;"><strong>Subject:</strong> {{subject}}</p>
                <p style="margin: 10px 0;"><strong>Status:</strong> {{status}}</p>
                <p style="margin: 10px 0;"><strong>Priority:</strong> {{priority}}</p>
              </div>

              {{#if comment}}
              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #111827;">Latest Response</h3>
                <p style="color: #374151; white-space: pre-wrap;">{{comment}}</p>
              </div>
              {{/if}}

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                To respond, simply reply to this email.
              </p>
            </div>

            <div style="background-color: {{primaryColor}}; padding: 20px; text-align: center;">
              <p style="color: white; margin: 0; font-size: 14px;">
                © {{year}} {{organizationName}}. All rights reserved.
              </p>
            </div>
          </div>
        `
      },
      {
        type: 'ticketResolved',
        subject: '[Ticket #{{ticketNumber}}] Your support request has been resolved',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">{{emailFromName}}</h1>
            </div>

            <div style="padding: 30px; background-color: #f9fafb;">
              <h2 style="color: #111827;">✓ Ticket Resolved</h2>

              <p style="color: #4b5563; font-size: 16px;">
                Hello,
              </p>

              <p style="color: #4b5563; font-size: 16px;">
                Great news! Your support ticket <strong>{{ticketNumber}}</strong> has been resolved.
              </p>

              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h3 style="margin-top: 0; color: #111827;">Ticket Details</h3>
                <p style="margin: 10px 0;"><strong>Subject:</strong> {{subject}}</p>
                <p style="margin: 10px 0;"><strong>Status:</strong> {{status}}</p>
              </div>

              {{#if resolutionComment}}
              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #111827;">Resolution Details</h3>
                <p style="color: #374151; white-space: pre-wrap;">{{resolutionComment}}</p>
              </div>
              {{/if}}

              <p style="color: #4b5563; font-size: 16px;">
                If you're satisfied with the resolution, no further action is needed. If you need additional assistance, please reply to this email.
              </p>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Thank you for using {{emailFromName}}!
              </p>
            </div>

            <div style="background-color: {{primaryColor}}; padding: 20px; text-align: center;">
              <p style="color: white; margin: 0; font-size: 14px;">
                © {{year}} {{organizationName}}. All rights reserved.
              </p>
            </div>
          </div>
        `
      }
    ];

    // Insert default templates
    for (const templateData of defaultTemplates) {
      await prisma.emailTemplate.create({
        data: templateData
      });
    }

    console.log('Default email templates created');
  }

  console.log('Seed complete!');
  console.log('admin / admin123');
  console.log('itstaff / staff123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());