const express = require('express');
const router = express.Router();
const viewController = require('../controllers/viewController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/', viewController.getViews);
router.post('/', viewController.createView);
router.put('/:id', viewController.updateView);
router.delete('/:id', viewController.deleteView);

module.exports = router;
