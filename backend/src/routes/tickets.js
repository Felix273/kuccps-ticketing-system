const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authMiddleware = require('../middleware/auth');

// Health check endpoint (no auth required) - MUST be before authMiddleware
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// All ticket routes require authentication
router.use(authMiddleware);

// IMPORTANT: Specific routes MUST come before parameterized routes
// Get statistics (must be before /:id route)
router.get('/statistics', ticketController.getStatistics);

// Get all tickets with filters
router.get('/', ticketController.getAllTickets);

// Get single ticket by ID
router.get('/:id', ticketController.getTicketById);

// Create new ticket
router.post('/', ticketController.createTicket);

// Update ticket
router.put('/:id', ticketController.updateTicket);

// Delete ticket
router.delete('/:id', ticketController.deleteTicket);

// Add comment to ticket
router.post('/:id/comments', ticketController.addComment);

module.exports = router;
