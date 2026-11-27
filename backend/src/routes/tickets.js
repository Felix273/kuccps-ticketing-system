const express = require('express');
const router = express.Router();
const multer = require('multer');
const ticketController = require('../controllers/ticketController');
const { authenticateToken, requireStaffOrAdmin } = require('../middleware/auth');
const { uploadDir } = require('../services/uploadStorage');
const prisma = require('../lib/prisma');

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
const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'csv', 'doc', 'docx', 'xls', 'xlsx']);

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: parseInt(process.env.MAX_UPLOAD_BYTES, 10) || 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = String(file.originalname || '').split('.').pop().toLowerCase();
    // Declared type and extension must both be on the built-in safe list; the
    // administrator's "allowed file types" setting can narrow it further.
    if (!allowedTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      return cb(new Error('File type is not allowed'));
    }
    prisma.systemSettingsAllowedFileType.findMany({ select: { extension: true } })
      .then(configured => {
        const adminAllowed = new Set(configured.map(item => item.extension.replace(/^\./, '').toLowerCase()));
        if (adminAllowed.size && !adminAllowed.has(extension)) {
          return cb(new Error('File type is not allowed'));
        }
        cb(null, true);
      })
      .catch(cb);
  }
});

// Public intake lives in routes/publicTickets.js (mounted before this router with rate limiting).

// Protected routes - require authentication
router.use(authenticateToken);
router.use(requireStaffOrAdmin);

router.post("/", (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Tickets must be generated from requester email intake. Manual staff ticket creation is disabled.'
  });
});
router.get('/', ticketController.getAllTickets);
router.get('/statistics', ticketController.getStatistics);
router.get('/overview', ticketController.getOverview);
router.get('/workload', ticketController.getWorkload);
router.get('/export', ticketController.exportTickets);
router.get('/:id', ticketController.getTicketById);
router.get('/:id/attachments/:attachmentId', ticketController.downloadAttachment);
router.put('/:id', ticketController.updateTicket);
router.post('/:id/escalate', ticketController.escalateTicket);
router.post('/:id/comments', ticketController.addComment);
router.post('/:id/attachments', upload.single('file'), ticketController.addAttachment);

// Note: We don't have a delete function yet, so commenting this out
// If you need to add delete functionality later, add it to the controller first
// router.delete('/tickets/:id', authenticateToken, ticketController.deleteTicket);

module.exports = router;
