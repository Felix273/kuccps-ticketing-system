const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Get notifications for current user (returns empty - notification feature not yet implemented)
router.get('/', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      notifications: [],
      count: 0
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      notifications: [],
      count: 0
    });
  }
});

// Get notification preferences (returns default preferences)
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      preferences: {
        emailNotifications: true,
        browserNotifications: false,
        dailyDigest: false
      }
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      preferences: {
        emailNotifications: true,
        browserNotifications: false,
        dailyDigest: false
      }
    });
  }
});

module.exports = router;
