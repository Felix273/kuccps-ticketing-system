const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken } = require('../middleware/auth');

// Public route - create ticket (for Google Addon)
router.post('/public/tickets', ticketController.createTicket);

// Protected routes - require authentication
router.get('/tickets', authenticateToken, ticketController.getAllTickets);
router.get('/tickets/statistics', authenticateToken, ticketController.getStatistics);
router.get('/tickets/:id', authenticateToken, ticketController.getTicketById);
router.put('/tickets/:id', authenticateToken, ticketController.updateTicket);
router.post('/tickets/:id/comments', authenticateToken, ticketController.addComment);

// Note: We don't have a delete function yet, so commenting this out
// If you need to add delete functionality later, add it to the controller first
// router.delete('/tickets/:id', authenticateToken, ticketController.deleteTicket);

module.exports = router;
