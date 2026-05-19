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

  console.log('Seed complete!');
  console.log('admin / admin123');
  console.log('itstaff / staff123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
