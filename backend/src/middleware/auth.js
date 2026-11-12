const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const {
  SETTINGS_SECTIONS,
  getRequiredSettingsPermissions,
  getPermissionsForUser,
  requirePermission
} = require('../services/accessControlService');
const prisma = new PrismaClient();

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Ensure JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET is not set in environment variables');
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error' 
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, tokenUser) => {
      if (err) {
        console.error('JWT verification failed:', err.message);
        
        // Provide specific error messages
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token has expired. Please login again.'
          });
        } else if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'Invalid token. Please login again.'
          });
        }
        
        return res.status(401).json({
          success: false,
          message: 'Authentication failed'
        });
      }

      try {
        const currentUser = await prisma.user.findUnique({
          where: { id: tokenUser.id },
          select: { id: true, email: true, username: true, role: true }
        });
        if (!currentUser) {
          return res.status(401).json({ success: false, message: 'User account is unavailable' });
        }
        req.user = { ...tokenUser, ...currentUser };
        next();
      } catch (error) {
        console.error('Authentication user lookup error:', error);
        res.status(500).json({ success: false, message: 'Unable to verify user account' });
      }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

const requireSettingsSection = (action) => async (req, res, next) => {
  const section = req.query.section;
  const permissionPrefix = SETTINGS_SECTIONS[section];
  if (!permissionPrefix) {
    return res.status(403).json({ success: false, message: 'A permitted settings section is required' });
  }
  return requirePermission(`${permissionPrefix}.${action}`)(req, res, next);
};

const requireSettingsUpdatePermissions = async (req, res, next) => {
  try {
    const fields = Object.keys(req.body || {});
    const required = getRequiredSettingsPermissions(fields);
    if (!required) {
      return res.status(400).json({ success: false, message: 'Invalid settings fields' });
    }
    if (Object.hasOwn(req.body, 'ldapDefaultRole') && !['user', 'staff'].includes(req.body.ldapDefaultRole)) {
      return res.status(400).json({ success: false, message: 'LDAP default role must be user or staff' });
    }
    const permissions = await getPermissionsForUser(req.user.id);
    if (required.some(permission => !permissions.includes(permission))) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  } catch (error) {
    console.error('Settings update authorization error:', error);
    res.status(500).json({ success: false, message: 'Unable to verify permissions' });
  }
};

const requireAdmin = authorizeRoles('admin');
const requireStaffOrAdmin = authorizeRoles('staff', 'admin');

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireAdmin,
  requireStaffOrAdmin,
  requirePermission,
  requireSettingsSection,
  requireSettingsUpdatePermissions
};
