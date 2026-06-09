const express = require('express');
const router = express.Router();
const multer = require('multer');
const knowledgeBaseController = require('../controllers/knowledgeBaseController');
const { authenticateToken, requireStaffOrAdmin } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/public/articles', knowledgeBaseController.getArticles);
router.get('/public/articles/:idOrSlug', knowledgeBaseController.getArticle);

router.get('/articles', authenticateToken, knowledgeBaseController.getArticles);
router.get('/insights', authenticateToken, requireStaffOrAdmin, knowledgeBaseController.getKnowledgeInsights);
router.get('/suggestions/tickets/:ticketId', authenticateToken, requireStaffOrAdmin, knowledgeBaseController.getTicketSuggestions);
router.get('/articles/:idOrSlug', authenticateToken, knowledgeBaseController.getArticle);
router.post('/articles', authenticateToken, requireStaffOrAdmin, knowledgeBaseController.createArticle);
router.post('/materials/upload', authenticateToken, requireStaffOrAdmin, upload.single('file'), knowledgeBaseController.uploadArticleMaterial);
router.put('/articles/:id', authenticateToken, requireStaffOrAdmin, knowledgeBaseController.updateArticle);
router.post('/articles/:id/rate', knowledgeBaseController.rateArticle);
router.delete('/articles/:id', authenticateToken, requireStaffOrAdmin, knowledgeBaseController.deleteArticle);

module.exports = router;
