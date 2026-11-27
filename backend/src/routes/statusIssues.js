const express = require('express');
const router = express.Router();
const statusIssueController = require('../controllers/statusIssueController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

router.get('/public', statusIssueController.getIssues);
router.get('/', authenticateToken, requirePermission('tickets.view', 'status.manage'), statusIssueController.getIssues);
router.post('/', authenticateToken, requirePermission('status.manage'), statusIssueController.createIssue);
router.put('/:id', authenticateToken, requirePermission('status.manage'), statusIssueController.updateIssue);
router.post('/:id/updates', authenticateToken, requirePermission('status.manage'), statusIssueController.addIssueUpdate);

module.exports = router;
