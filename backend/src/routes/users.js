const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireStaffOrAdmin, requirePermission } = require('../middleware/auth');

router.use(authenticateToken);

// Read-Only User Directory
router.get('/', requireStaffOrAdmin, userController.getAllUsers);

// AD sync is separately permission-gated as an Active Directory setting action.
router.post('/sync/ad', requirePermission('settings.ldap.update'), userController.syncUsersFromAd);

// Local Mutations: Permanently disabled because AD is the authoritative source
const disabledUserMutationHandler = (req, res) => {
  res.status(405).json({
    success: false,
    message: 'Manual creation, editing, and deletion of user accounts is disabled. Users are synchronized directly from Active Directory.'
  });
};

router.post('/', requireStaffOrAdmin, disabledUserMutationHandler);
router.put('/:id', requireStaffOrAdmin, disabledUserMutationHandler);
router.delete('/:id', requireStaffOrAdmin, disabledUserMutationHandler);

module.exports = router;
