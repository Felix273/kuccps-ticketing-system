const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { tickets: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      departments
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
};

// Create a new department
exports.createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required'
      });
    }

    // Check if department with same name already exists
    const existingDept = await prisma.department.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: 'A department with this name already exists'
      });
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        code: code ? code.trim().toUpperCase() : null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department',
      error: error.message
    });
  }
};

// Update a department
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required'
      });
    }

    // Check if department exists
    const existingDept = await prisma.department.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingDept) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if another department with same name exists
    const duplicateDept = await prisma.department.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        },
        NOT: {
          id: parseInt(id)
        }
      }
    });

    if (duplicateDept) {
      return res.status(400).json({
        success: false,
        message: 'A department with this name already exists'
      });
    }

    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        code: code ? code.trim().toUpperCase() : null
      }
    });

    res.json({
      success: true,
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department',
      error: error.message
    });
  }
};

// Delete a department
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { tickets: true }
        }
      }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has any tickets
    if (department._count.tickets > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department with ${department._count.tickets} active tickets. Please reassign or close tickets first.`
      });
    }

    await prisma.department.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: error.message
    });
  }
};