const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { requirePublicApiKey } = require('../middleware/security');

// Public intake for the Google Workspace Add-on (API key, rate limited where mounted).
// Mounted at /api/public/tickets and at the legacy alias /api/tickets/public.
router.post('/', requirePublicApiKey, ticketController.createTicket);
// Legacy path /api/tickets/public/tickets used by older add-on builds.
router.post('/tickets', requirePublicApiKey, ticketController.createTicket);
router.get('/my-tickets', requirePublicApiKey, ticketController.getRequesterTickets);
router.post('/csat', requirePublicApiKey, ticketController.submitRequesterCsat);

module.exports = router;
