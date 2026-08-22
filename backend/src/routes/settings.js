const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const settingsController = require('../controllers/settingsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for logo upload'));
    }
    cb(null, true);
  }
});

// Protected routes - require authentication
router.get('/', authenticateToken, requireAdmin, settingsController.getSettings);
router.put('/', authenticateToken, requireAdmin, settingsController.updateSettings);
router.post('/logo', authenticateToken, requireAdmin, upload.single('logo'), settingsController.uploadLogo);

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
