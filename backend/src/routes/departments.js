const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get all departments
router.get('/', departmentController.getAllDepartments);

// Get single department
router.get('/:id', departmentController.getDepartmentById);

// Create department
router.post('/', departmentController.createDepartment);

// Update department
router.put('/:id', departmentController.updateDepartment);

// Delete department
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;