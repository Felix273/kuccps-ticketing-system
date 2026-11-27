const express = require('express');
const accessControlController = require('../controllers/accessControlController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.get('/me', accessControlController.getMyAccess);
router.get('/roles', requirePermission('access.manage'), accessControlController.getRoles);
router.post('/roles', requirePermission('access.manage'), accessControlController.createRole);
router.put('/roles/:id', requirePermission('access.manage'), accessControlController.updateRole);
router.delete('/roles/:id', requirePermission('access.manage'), accessControlController.deleteRole);
router.get('/users', requirePermission('access.manage'), accessControlController.getUsers);
router.put('/users/:userId/roles', requirePermission('access.manage'), accessControlController.replaceUserRoles);
router.get('/audit', requirePermission('audit.view', 'access.manage'), accessControlController.getAuditLog);

module.exports = router;
