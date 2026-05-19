const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken } = require('../middleware/auth');

// Public route - create ticket (for Google Addon)
router.post('/public/tickets', ticketController.createTicket);

// Protected routes - require authentication
router.post("/", authenticateToken, ticketController.createTicket);
router.get('/', authenticateToken, ticketController.getAllTickets);
router.get('/statistics', authenticateToken, ticketController.getStatistics);
router.get('/:id', authenticateToken, ticketController.getTicketById);
router.put('/:id', authenticateToken, ticketController.updateTicket);
router.post('/:id/comments', authenticateToken, ticketController.addComment);

// Note: We don't have a delete function yet, so commenting this out
// If you need to add delete functionality later, add it to the controller first
// router.delete('/tickets/:id', authenticateToken, ticketController.deleteTicket);

module.exports = router;
