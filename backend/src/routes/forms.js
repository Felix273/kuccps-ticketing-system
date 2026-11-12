const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

router.get('/public', formController.getForms);
router.get('/', authenticateToken, requirePermission('settings.forms.view'), formController.getForms);
router.post('/', authenticateToken, requirePermission('settings.forms.create'), formController.createForm);
router.put('/:id', authenticateToken, requirePermission('settings.forms.update'), formController.updateForm);
router.delete('/:id', authenticateToken, requirePermission('settings.forms.delete'), formController.deleteForm);

module.exports = router;
