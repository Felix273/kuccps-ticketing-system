const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all users
router.get('/', userController.getAllUsers);

// Sync users from Active Directory
router.post('/sync/ad', requireAdmin, userController.syncUsersFromAd);

// Create new user
router.post('/', requireAdmin, userController.createUser);

// Update user
router.put('/:id', requireAdmin, userController.updateUser);

// Delete user
router.delete('/:id', requireAdmin, userController.deleteUser);

module.exports = router;
