const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const {
  authenticateToken,
  requirePermission,
  requireSettingsSection,
  requireSettingsUpdatePermissions
} = require('../middleware/auth');

router.get('/', authenticateToken, requireSettingsSection('view'), settingsController.getSettings);
router.put('/', authenticateToken, requireSettingsUpdatePermissions, settingsController.updateSettings);

// Public route - no authentication needed
router.get('/public', settingsController.getPublicSettings);

// Email Template Management - require authentication
router.get('/email-templates', authenticateToken, requirePermission('settings.templates.view'), settingsController.getEmailTemplates);
router.get('/email-templates/:type', authenticateToken, requirePermission('settings.templates.view'), settingsController.getEmailTemplate);
router.post('/email-templates', authenticateToken, requirePermission('settings.templates.create'), settingsController.createEmailTemplate);
router.put('/email-templates/:type', authenticateToken, requirePermission('settings.templates.update'), settingsController.updateEmailTemplate);
router.delete('/email-templates/:type', authenticateToken, requirePermission('settings.templates.delete'), settingsController.deleteEmailTemplate);
router.post('/email-templates/reset', authenticateToken, requirePermission('settings.templates.reset'), settingsController.resetEmailTemplatesToDefault);

module.exports = router;
