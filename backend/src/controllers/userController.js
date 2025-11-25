const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all users with optional filtering
exports.getAllUsers = async (req, res) => {
  try {
    const { role, department } = req.query;
    
    const where = {};
    if (role) where.role = role;
    if (department) where.department = department;
    
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};