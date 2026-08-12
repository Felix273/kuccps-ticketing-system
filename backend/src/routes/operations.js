const express = require('express');
const router = express.Router();
const operationsController = require('../controllers/operationsController');
const { authenticateToken, requireAdmin, requireStaffOrAdmin } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, requireStaffOrAdmin, operationsController.getDashboardAnalytics);
router.get('/sla-policies', authenticateToken, requireStaffOrAdmin, operationsController.getSlaPolicies);
router.post('/sla-policies', authenticateToken, requireAdmin, operationsController.createSlaPolicy);
router.put('/sla-policies/:id', authenticateToken, requireAdmin, operationsController.updateSlaPolicy);
router.post('/csat', authenticateToken, operationsController.createCsatResponse);

module.exports = router;
