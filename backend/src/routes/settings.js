const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const {
  authenticateToken,
  requirePermission,
  requireSettingsSection,
  requireSettingsUpdatePermissions
} = require('../middleware/auth');

router.get('/', authenticateToken, requireSettingsSection(), settingsController.getSettings);
router.put('/', authenticateToken, requireSettingsUpdatePermissions, settingsController.updateSettings);

// Public route - no authentication needed
router.get('/public', settingsController.getPublicSettings);

// Email Template Management - require authentication
router.get('/email-templates', authenticateToken, requirePermission('settings.email'), settingsController.getEmailTemplates);
router.get('/email-templates/:type', authenticateToken, requirePermission('settings.email'), settingsController.getEmailTemplate);
router.post('/email-templates', authenticateToken, requirePermission('settings.email'), settingsController.createEmailTemplate);
router.put('/email-templates/:type', authenticateToken, requirePermission('settings.email'), settingsController.updateEmailTemplate);
router.delete('/email-templates/:type', authenticateToken, requirePermission('settings.email'), settingsController.deleteEmailTemplate);
router.post('/email-templates/reset', authenticateToken, requirePermission('settings.email'), settingsController.resetEmailTemplatesToDefault);

module.exports = router;
