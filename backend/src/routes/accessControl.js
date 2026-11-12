const express = require('express');
const accessControlController = require('../controllers/accessControlController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authenticateToken, accessControlController.getMyAccess);
router.use(authenticateToken, requireAdmin);
router.get('/roles', accessControlController.getRoles);
router.post('/roles', accessControlController.createRole);
router.put('/roles/:id', accessControlController.updateRole);
router.delete('/roles/:id', accessControlController.deleteRole);
router.get('/users', accessControlController.getUsers);
router.put('/users/:userId/roles', accessControlController.replaceUserRoles);
router.get('/audit', accessControlController.getAuditLog);

module.exports = router;
