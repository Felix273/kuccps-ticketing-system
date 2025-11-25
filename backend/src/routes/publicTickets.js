const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// Public endpoint for Google Workspace Add-on (no auth required)
router.post('/', ticketController.createTicket);

module.exports = router;
