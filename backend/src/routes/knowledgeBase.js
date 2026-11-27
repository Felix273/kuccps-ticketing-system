const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const multer = require('multer');
const knowledgeBaseController = require('../controllers/knowledgeBaseController');
const { authenticateToken, requireAdmin, requireStaffOrAdmin } = require('../middleware/auth');
const { uploadDir } = require('../services/uploadStorage');
const { rateLimit } = require('../middleware/security');

// Strict file validation for officer uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, callback) => callback(null, `kb-${crypto.randomUUID()}`)
  }),
  limits: { fileSize: parseInt(process.env.MAX_KB_UPLOAD_BYTES, 10) || 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = new Set([
      'text/plain',
      'text/markdown',
      'text/x-markdown',
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
    // The extension must be allowed AND the declared type must match the allow-list
    // (browsers report unknown plain-text types such as .md/.log as octet-stream).
    const name = String(file.originalname || '');
    const typeAllowed = allowedTypes.has(file.mimetype) ||
      (file.mimetype === 'application/octet-stream' && /\.(md|log|txt|csv|json)$/i.test(name));
    if (!allowedExtensions.test(name) || !typeAllowed) {
      return cb(new Error('Invalid file type. Allowed: PDF, DOCX, TXT, MD, CSV, JSON, PNG, JPG'));
    }
    cb(null, true);
  }
});

// ── PUBLIC & GENERAL READ ROUTES ──────────────────────────────
const publicReadLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, keyPrefix: 'kb-public-read' });
const feedbackLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: 'kb-feedback' });
router.get('/public/articles', publicReadLimit, knowledgeBaseController.getArticles);
router.get('/public/articles/:idOrSlug', publicReadLimit, knowledgeBaseController.getArticle);
router.post('/articles/:id/feedback', feedbackLimit, knowledgeBaseController.submitFeedback);

// ── PROTECTED OFFICER & ADMIN WORKBENCH ───────────────────────
router.use(authenticateToken);
router.use(requireStaffOrAdmin);

// Search & Read
router.get('/articles', knowledgeBaseController.getArticles);
router.get('/articles/:idOrSlug', knowledgeBaseController.getArticle);
router.get('/articles/:id/revisions', knowledgeBaseController.getRevisions);
router.get('/articles/:id/attachments/:storageKey', knowledgeBaseController.downloadArticleMaterial);

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
