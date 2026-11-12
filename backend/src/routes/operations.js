const express = require('express');
const router = express.Router();
const operationsController = require('../controllers/operationsController');
const { authenticateToken, requireAdmin, requireStaffOrAdmin, requirePermission } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, requireStaffOrAdmin, operationsController.getDashboardAnalytics);
router.get('/sla-policies', authenticateToken, requirePermission('settings.tickets.view'), operationsController.getSlaPolicies);
router.post('/sla-policies', authenticateToken, requirePermission('settings.tickets.update'), operationsController.createSlaPolicy);
router.put('/sla-policies/:id', authenticateToken, requirePermission('settings.tickets.update'), operationsController.updateSlaPolicy);
router.post('/csat', authenticateToken, operationsController.createCsatResponse);
router.get('/csat/rate', operationsController.handleEmailCsatRate);
router.post('/csat/public', operationsController.createPublicCsatResponse);

module.exports = router;
