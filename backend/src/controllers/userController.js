const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
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

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { username, password, email, name, role, department, departmentId } = req.body;
    
    // Validate required fields
    if (!username || !password || !email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, email, and name are required'
      });
    }
    
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    // Get department name from departmentId if provided
    let departmentName = department;
    if (departmentId && !department) {
      const dept = await prisma.department.findUnique({
        where: { id: departmentId }
      });
      if (dept) {
        departmentName = dept.name;
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        name,
        role: role || 'staff',
        department: departmentName || null
      },
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
    const { username, email, name, role, department, departmentId, password } = req.body;
    
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
    
    // Get department name from departmentId if provided
    let departmentName = department;
    if (departmentId && !department) {
      const dept = await prisma.department.findUnique({
        where: { id: departmentId }
      });
      if (dept) {
        departmentName = dept.name;
      }
    }
    
    // Prepare update data
    const updateData = {
      ...(username && { username }),
      ...(email && { email }),
      ...(name && { name }),
      ...(role && { role }),
      ...(departmentName && { department: departmentName })
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
