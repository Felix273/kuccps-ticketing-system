const express = require('express');
const router = express.Router();
const multer = require('multer');
const knowledgeBaseController = require('../controllers/knowledgeBaseController');
const { authenticateToken, requireAdmin, requireStaffOrAdmin } = require('../middleware/auth');

// Strict file validation for officer uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_KB_UPLOAD_BYTES, 10) || 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = new Set([
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]);
    const allowedExtensions = /\.(txt|md|csv|json|log|pdf|doc|docx|png|jpg|jpeg|webp)$/i;
    if (!allowedTypes.has(file.mimetype) && !allowedExtensions.test(file.originalname)) {
      return cb(new Error('Invalid file type. Allowed: PDF, DOCX, TXT, MD, CSV, JSON, PNG, JPG'));
    }
    cb(null, true);
  }
});

// ── PUBLIC & GENERAL READ ROUTES ──────────────────────────────
router.get('/public/articles', knowledgeBaseController.getArticles);
router.get('/public/articles/:idOrSlug', knowledgeBaseController.getArticle);
router.post('/articles/:id/feedback', knowledgeBaseController.submitFeedback);

// ── PROTECTED OFFICER & ADMIN WORKBENCH ───────────────────────
router.use(authenticateToken);
router.use(requireStaffOrAdmin);

// Search & Read
router.get('/articles', knowledgeBaseController.getArticles);
router.get('/articles/:idOrSlug', knowledgeBaseController.getArticle);
router.get('/articles/:id/revisions', knowledgeBaseController.getRevisions);

// Officer Contributions
router.post('/articles', knowledgeBaseController.createArticle);
router.post('/materials/upload', upload.single('file'), knowledgeBaseController.uploadArticleMaterial);

// Insights & Ticket Contextual Deflection
router.get('/insights', knowledgeBaseController.getKnowledgeInsights);
router.get('/suggestions/tickets/:ticketId', knowledgeBaseController.getTicketSuggestions);
router.post('/articles/:id/rate', knowledgeBaseController.rateArticle);

// ── STRICTLY ADMINISTRATOR ONLY (Requirement 3) ───────────────
// Only admins can edit, approve, delete, or restore articles
router.put('/articles/:id', requireAdmin, knowledgeBaseController.updateArticle);
router.delete('/articles/:id', requireAdmin, knowledgeBaseController.deleteArticle);
router.post('/articles/:id/restore', requireAdmin, knowledgeBaseController.restoreArticle);
router.post('/articles/:id/approve', requireAdmin, knowledgeBaseController.approveArticle);
router.get('/analytics/search-gaps', requireAdmin, knowledgeBaseController.getSearchGaps);

module.exports = router;
