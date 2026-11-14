require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { seedSlaPolicies } = require('../src/services/slaService');

const prisma = new PrismaClient();

seedSlaPolicies(prisma)
  .then(() => console.log('SLA timeline defaults seeded without overwriting admin changes.'))
  .catch(error => {
    console.error('SLA defaults seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
