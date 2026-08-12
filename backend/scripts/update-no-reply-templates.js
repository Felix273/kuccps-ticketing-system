const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const replacements = [
  [
    'If you have any questions, please reply to this email with your ticket number in the subject line.',
    'Please do not reply to this automated email. Contact ICT directly at {{supportEmail}} if you need to follow up.'
  ],
  [
    'To respond, simply reply to this email.',
    'Please do not reply to this automated email. Contact ICT directly at {{supportEmail}} if you need to follow up.'
  ],
  [
    "If you're satisfied with the resolution, no further action is needed. If you need additional assistance, please reply to this email.",
    "If you're satisfied with the resolution, no further action is needed. Please do not reply to this automated email. Contact ICT directly at {{supportEmail}} if you need additional assistance."
  ]
];

async function main() {
  const templates = await prisma.emailTemplate.findMany();
  let updated = 0;

  for (const template of templates) {
    let html = template.html;

    for (const [from, to] of replacements) {
      html = html.split(from).join(to);
    }

    if (html !== template.html) {
      await prisma.emailTemplate.update({
        where: { id: template.id },
        data: { html }
      });
      updated += 1;
    }
  }

  console.log(JSON.stringify({ updated }));
}

main()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
