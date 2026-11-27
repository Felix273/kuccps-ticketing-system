const express = require('express');
const router = express.Router();
const operationsController = require('../controllers/operationsController');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { rateLimit } = require('../middleware/security');

router.get('/dashboard', authenticateToken, requirePermission('reports.view'), operationsController.getDashboardAnalytics);
router.get('/csat-report', authenticateToken, requirePermission('reports.view'), operationsController.getCsatReport);
router.get('/sla-timelines', authenticateToken, requirePermission('settings.service-desk'), operationsController.getSlaTimelines);
router.put('/sla-timelines', authenticateToken, requirePermission('settings.service-desk'), operationsController.updateSlaTimelines);
router.post('/sla-timelines/reset', authenticateToken, requirePermission('settings.service-desk'), operationsController.resetSlaTimelines);
router.get('/sla-policies', authenticateToken, requirePermission('settings.service-desk'), operationsController.getSlaPolicies);
router.post('/sla-policies', authenticateToken, requirePermission('settings.service-desk'), operationsController.createSlaPolicy);
router.put('/sla-policies/:id', authenticateToken, requirePermission('settings.service-desk'), operationsController.updateSlaPolicy);
router.get('/csat/public', rateLimit({ windowMs: 15 * 60 * 1000, max: 60, keyPrefix: 'public-csat' }), operationsController.getPublicCsat);
router.post('/csat/public', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: 'public-csat-submit' }), operationsController.createPublicCsatResponse);
router.post('/csat', authenticateToken, operationsController.createCsatResponse);
router.get('/csat/rate', rateLimit({ windowMs: 15 * 60 * 1000, max: 60, keyPrefix: 'legacy-csat-rate' }), operationsController.handleEmailCsatRate);

module.exports = router;
