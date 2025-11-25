const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDepartments() {
  try {
    const departments = [
      { name: 'Administration', code: 'ADMIN' },
      { name: 'Finance', code: 'FIN' },
      { name: 'Human Resources', code: 'HR' },
      { name: 'Placement Services', code: 'PLACE' },
      { name: 'ICT', code: 'ICT' },
      { name: 'Legal', code: 'LEGAL' },
      { name: 'Public Relations', code: 'PR' },
      { name: 'Quality Assurance', code: 'QA' }
    ];
    
    for (const dept of departments) {
      const existing = await prisma.department.findUnique({
        where: { name: dept.name }
      });
      
      if (!existing) {
        await prisma.department.create({ data: dept });
        console.log('Created:', dept.name);
      } else {
        console.log('Already exists:', dept.name);
      }
    }
    
    console.log('\nDepartments seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedDepartments();
