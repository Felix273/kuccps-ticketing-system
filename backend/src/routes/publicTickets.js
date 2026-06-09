const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { requirePublicApiKey } = require('../middleware/security');

// Public endpoint for Google Workspace Add-on (no auth required)
router.post('/', requirePublicApiKey, ticketController.createTicket);

module.exports = router;
