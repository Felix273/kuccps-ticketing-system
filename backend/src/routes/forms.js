const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/public', formController.getForms);
router.get('/', authenticateToken, formController.getForms);
router.post('/', authenticateToken, requireAdmin, formController.createForm);
router.put('/:id', authenticateToken, requireAdmin, formController.updateForm);
router.delete('/:id', authenticateToken, requireAdmin, formController.deleteForm);

module.exports = router;
