const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Read-Only Directory: Available to all authenticated users
router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);

// AD Sync: Allowed strictly for administrators
router.post('/sync/ad', requireAdmin, departmentController.syncDirectoratesFromAd);

// Local Mutations: Permanently disabled because AD is the authoritative source
const disabledMutationHandler = (req, res) => {
  res.status(405).json({
    success: false,
    message: 'Manual creation, editing, and deletion of directorates is disabled. Directorates are synchronized directly from Active Directory.'
  });
};

router.post('/', disabledMutationHandler);
router.put('/:id', disabledMutationHandler);
router.delete('/:id', disabledMutationHandler);

module.exports = router;
