const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const adService = require('../services/adService');
const prisma = new PrismaClient();

const VALID_ROLES = new Set(['user', 'staff', 'admin']);

function validatePassword(password) {
  const value = String(password || '');
  if (value.length < 12) return 'Password must be at least 12 characters.';
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
    return 'Password must include uppercase, lowercase, and numeric characters.';
  }
  return null;
}

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

// Get all users with optional filtering
exports.getAllUsers = async (req, res) => {
  try {
    const { role, department } = req.query;
    
    const where = {};
    if (role) where.role = role;
    if (department) where.department = { name: department };
    
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
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

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { username, password, email, name, role, departmentId } = req.body;
    const safeUsername = cleanText(username, 80);
    const safeEmail = cleanText(email, 254).toLowerCase();
    const safeName = cleanText(name, 160);
    const safeRole = VALID_ROLES.has(role) ? role : 'staff';
    const resolvedDepartmentId = departmentId || null;
    
    // Validate required fields
    if (!safeUsername || !password || !safeEmail || !safeName) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, email, and name are required'
      });
    }
    if (!isValidEmail(safeEmail)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required' });
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }
    
    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: safeUsername },
          { email: safeEmail }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.username === safeUsername ? 'Username already exists' : 'Email already exists'
      });
    }
    
    if (resolvedDepartmentId) {
      const dept = await prisma.department.findUnique({ where: { id: resolvedDepartmentId } });
      if (!dept) {
        return res.status(400).json({ success: false, message: 'Selected department does not exist' });
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        username: safeUsername,
        password: hashedPassword,
        email: safeEmail,
        name: safeName,
        role: safeRole,
        departmentId: resolvedDepartmentId
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        department: true,
        createdAt: true
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, name, role, departmentId, password } = req.body;
    const safeUsername = username !== undefined ? cleanText(username, 80) : undefined;
    const safeEmail = email !== undefined ? cleanText(email, 254).toLowerCase() : undefined;
    const safeName = name !== undefined ? cleanText(name, 160) : undefined;
    const safeRole = role !== undefined ? role : undefined;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept) {
        return res.status(400).json({ success: false, message: 'Selected department does not exist' });
      }
    }
    
    if (safeEmail !== undefined && !isValidEmail(safeEmail)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required' });
    }
    if (safeRole !== undefined && !VALID_ROLES.has(safeRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (safeUsername || safeEmail) {
      const duplicate = await prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(safeUsername ? [{ username: safeUsername }] : []),
            ...(safeEmail ? [{ email: safeEmail }] : [])
          ]
        }
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: duplicate.username === safeUsername ? 'Username already exists' : 'Email already exists'
        });
      }
    }
    if (password) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        return res.status(400).json({ success: false, message: passwordError });
      }
    }

    // Prepare update data
    const updateData = {
      ...(safeUsername && { username: safeUsername }),
      ...(safeEmail && { email: safeEmail }),
      ...(safeName && { name: safeName }),
      ...(safeRole && { role: safeRole }),
      ...(departmentId !== undefined && { departmentId: departmentId || null })
    };
    
    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        department: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Delete user
    await prisma.user.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

exports.syncUsersFromAd = async (req, res) => {
  try {
    const result = await adService.syncUsers();
    res.json({
      success: true,
      message: `Synced ${result.count} user(s) from Active Directory`,
      count: result.count,
      users: result.users
    });
  } catch (error) {
    console.error('AD user sync error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync users from Active Directory'
    });
  }
};
