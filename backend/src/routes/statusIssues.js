const express = require('express');
const router = express.Router();
const statusIssueController = require('../controllers/statusIssueController');
const { authenticateToken, requireStaffOrAdmin } = require('../middleware/auth');

router.get('/public', statusIssueController.getIssues);
router.get('/', authenticateToken, requireStaffOrAdmin, statusIssueController.getIssues);
router.post('/', authenticateToken, requireStaffOrAdmin, statusIssueController.createIssue);
router.put('/:id', authenticateToken, requireStaffOrAdmin, statusIssueController.updateIssue);
router.post('/:id/updates', authenticateToken, requireStaffOrAdmin, statusIssueController.addIssueUpdate);

module.exports = router;
