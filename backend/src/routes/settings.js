const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Protected routes - require authentication
router.get('/', authenticateToken, requireAdmin, settingsController.getSettings);
router.put('/', authenticateToken, requireAdmin, settingsController.updateSettings);

// Public route - no authentication needed
router.get('/public', settingsController.getPublicSettings);

// Email Template Management - require authentication
router.get('/email-templates', authenticateToken, requireAdmin, settingsController.getEmailTemplates);
router.get('/email-templates/:type', authenticateToken, requireAdmin, settingsController.getEmailTemplate);
router.post('/email-templates', authenticateToken, requireAdmin, settingsController.createEmailTemplate);
router.put('/email-templates/:type', authenticateToken, requireAdmin, settingsController.updateEmailTemplate);
router.delete('/email-templates/:type', authenticateToken, requireAdmin, settingsController.deleteEmailTemplate);
router.post('/email-templates/reset', authenticateToken, requireAdmin, settingsController.resetEmailTemplatesToDefault);

module.exports = router;
