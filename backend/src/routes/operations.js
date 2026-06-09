const express = require('express');
const router = express.Router();
const operationsController = require('../controllers/operationsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, operationsController.getDashboardAnalytics);
router.get('/sla-policies', authenticateToken, operationsController.getSlaPolicies);
router.post('/sla-policies', authenticateToken, requireAdmin, operationsController.createSlaPolicy);
router.put('/sla-policies/:id', authenticateToken, requireAdmin, operationsController.updateSlaPolicy);
router.post('/csat', authenticateToken, operationsController.createCsatResponse);

module.exports = router;
