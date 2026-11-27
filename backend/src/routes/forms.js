const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Custom intake forms. No intake channel uses them yet, so they are not shown in Settings;
// the API is kept (service-desk managers only) for a future intake page.
router.get('/public', formController.getForms);
router.get('/', authenticateToken, requirePermission('settings.service-desk'), formController.getForms);
router.post('/', authenticateToken, requirePermission('settings.service-desk'), formController.createForm);
router.put('/:id', authenticateToken, requirePermission('settings.service-desk'), formController.updateForm);
router.delete('/:id', authenticateToken, requirePermission('settings.service-desk'), formController.deleteForm);

module.exports = router;
