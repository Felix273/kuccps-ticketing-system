const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ticketController = require('../controllers/ticketController');
const { authenticateToken } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-excel'
]);
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: parseInt(process.env.MAX_UPLOAD_BYTES, 10) || 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
      return cb(new Error('File type is not allowed'));
    }
    cb(null, true);
  }
});

// Public route - create ticket (for Google Addon)
router.post('/public/tickets', ticketController.createTicket);

// Protected routes - require authentication
router.post("/", authenticateToken, (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Tickets must be generated from requester email intake. Manual staff ticket creation is disabled.'
  });
});
router.get('/', authenticateToken, ticketController.getAllTickets);
router.get('/statistics', authenticateToken, ticketController.getStatistics);
router.get('/:id', authenticateToken, ticketController.getTicketById);
router.put('/:id', authenticateToken, ticketController.updateTicket);
router.post('/:id/comments', authenticateToken, ticketController.addComment);
router.post('/:id/attachments', authenticateToken, upload.single('file'), ticketController.addAttachment);

// Note: We don't have a delete function yet, so commenting this out
// If you need to add delete functionality later, add it to the controller first
// router.delete('/tickets/:id', authenticateToken, ticketController.deleteTicket);

module.exports = router;
