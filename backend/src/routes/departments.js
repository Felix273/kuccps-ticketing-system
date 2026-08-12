const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticateToken, requireAdmin, requireStaffOrAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);
router.use(requireStaffOrAdmin);

// Get all departments
router.get('/', departmentController.getAllDepartments);

// Sync directorates from Active Directory
router.post('/sync/ad', requireAdmin, departmentController.syncDirectoratesFromAd);

// Get single department
router.get('/:id', departmentController.getDepartmentById);

// Create department
router.post('/', requireAdmin, departmentController.createDepartment);

// Update department
router.put('/:id', requireAdmin, departmentController.updateDepartment);

// Delete department
router.delete('/:id', requireAdmin, departmentController.deleteDepartment);

module.exports = router;
