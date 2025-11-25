const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      username: user.username,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Login with username and password (LDAP will be added later)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // For now, demo login (we'll add LDAP later)
    // Demo credentials: admin/admin or itstaff/itstaff
    let user;
    
    if (username === 'admin' && password === 'admin') {
      // Check if admin user exists
      user = await prisma.user.findUnique({
        where: { username: 'admin' }
      });

      // Create admin user if doesn't exist
      if (!user) {
        user = await prisma.user.create({
          data: {
            username: 'admin',
            email: 'admin@kuccps.ac.ke',
            name: 'IT Admin',
            role: 'admin',
            department: 'ICT'
          }
        });
      }
    } else if (username === 'itstaff' && password === 'itstaff') {
      user = await prisma.user.findUnique({
        where: { username: 'itstaff' }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            username: 'itstaff',
            email: 'itstaff@kuccps.ac.ke',
            name: 'IT Staff Member',
            role: 'staff',
            department: 'ICT'
          }
        });
      }
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      error: error.message 
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Logout (client-side will handle token removal)
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};