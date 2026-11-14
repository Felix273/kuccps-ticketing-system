const express = require('express');
const router = express.Router();
const operationsController = require('../controllers/operationsController');
const {
  authenticateToken,
  requireStaffOrAdmin,
  requirePermission,
  requireAdmin
} = require('../middleware/auth');
const { rateLimit } = require('../middleware/security');

router.get('/dashboard', authenticateToken, requireStaffOrAdmin, operationsController.getDashboardAnalytics);
router.get('/sla-timelines', authenticateToken, requireAdmin, operationsController.getSlaTimelines);
router.put('/sla-timelines', authenticateToken, requireAdmin, operationsController.updateSlaTimelines);
router.post('/sla-timelines/reset', authenticateToken, requireAdmin, operationsController.resetSlaTimelines);
router.get('/sla-policies', authenticateToken, requirePermission('settings.tickets.view'), operationsController.getSlaPolicies);
router.post('/sla-policies', authenticateToken, requirePermission('settings.tickets.update'), operationsController.createSlaPolicy);
router.put('/sla-policies/:id', authenticateToken, requirePermission('settings.tickets.update'), operationsController.updateSlaPolicy);
router.get('/csat/public', rateLimit({ windowMs: 15 * 60 * 1000, max: 60, keyPrefix: 'public-csat' }), operationsController.getPublicCsat);
router.post('/csat/public', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: 'public-csat-submit' }), operationsController.createPublicCsatResponse);
router.post('/csat', authenticateToken, operationsController.createCsatResponse);

module.exports = router;
