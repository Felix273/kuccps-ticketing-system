const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;