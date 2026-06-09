const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const adService = require('../services/adService');
const { auditLog } = require('../middleware/security');

const prisma = new PrismaClient();

// Generate JWT Token
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      username: user.username,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
};

// Login with username and password (AD/LDAP Authentication)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    const adSettings = await adService.getAdSettings();
    let user;

    if (adSettings.ldapEnabled) {
      try {
        const authResult = await adService.authenticate(username, password);
        if (!authResult.isIct) {
          auditLog('auth.denied_non_ict', { requestId: req.id, username });
          return res.status(403).json({
            success: false,
            message: 'Access denied. Only ICT staff and administrators can access this system.'
          });
        }
        user = await adService.upsertAdUser(authResult.adUser, authResult.settings, 'staff');
      } catch (ldapError) {
        auditLog('auth.ldap_failed', { requestId: req.id, username, error: ldapError.message });
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid Active Directory credentials' 
        });
      }
    } else {
      user = await prisma.user.findUnique({
        where: { username },
        include: { department: true }
      });

      if (!user) {
        auditLog('auth.local_failed_unknown_user', { requestId: req.id, username });
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        auditLog('auth.local_failed_bad_password', { requestId: req.id, username });
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

    }

    const token = generateToken(user);
    auditLog('auth.login_success', { requestId: req.id, username: user.username, email: user.email, role: user.role });
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login error:', { requestId: req.id, message: error.message });
    res.status(500).json({ 
      success: false, 
      message: 'Login failed'
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
