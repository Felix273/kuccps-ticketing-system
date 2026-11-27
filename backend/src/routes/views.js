const express = require('express');
const router = express.Router();
const viewController = require('../controllers/viewController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requirePermission('tickets.view'));
router.get('/', viewController.getViews);
router.post('/', viewController.createView);
router.put('/:id', viewController.updateView);
router.delete('/:id', viewController.deleteView);

module.exports = router;
