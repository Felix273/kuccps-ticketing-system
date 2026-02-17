const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://kuccps_ticketing_db_user:xtxL3C0dCyFFmFsHewnYF9FRXxNudZSc@dpg-d67fgier433s73f58el0-a.oregon-postgres.render.com/kuccps_ticketing_db?ssl=true'
    }
  }
});

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.user.create({
      data: {
        name: 'System Administrator',
        email: 'admin@kuccps.ac.ke',
        username: 'admin',
        password: hashedPassword,
        role: 'Admin',
        department: 'IT'
      }
    });
    
    console.log('✅ Admin user created!');
    console.log('');
    console.log('Login credentials:');
    console.log('Email: admin@kuccps.ac.ke');
    console.log('Password: admin123');
    console.log('');
    console.log('⚠️  Change this password after first login!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
