const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `article-${Date.now()}`;
}

function getTerms(value) {
  const stopWords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'has', 'are', 'was', 'were', 'you', 'your', 'issue', 'ticket', 'request']);
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !stopWords.has(term));
}

function average(values) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

function inferPriority(ticket) {
  const text = `${ticket.subject || ''} ${ticket.description || ''}`.toLowerCase();
  const criticalSignals = ['all users', 'entire office', 'system down', 'cannot login', 'outage', 'breach', 'security incident', 'production', 'urgent'];
  const highSignals = ['many users', 'deadline', 'payment', 'portal', 'network down', 'email down', 'blocked'];

  if (criticalSignals.some(signal => text.includes(signal))) return 'Critical';
  if (highSignals.some(signal => text.includes(signal))) return 'High';
  if (text.length < 80) return 'Medium';
  return ticket.priority || 'Medium';
}

function getMissingInfo(ticket) {
  const text = `${ticket.subject || ''} ${ticket.description || ''}`.toLowerCase();
  const missing = [];

  if (!/(office|room|floor|building|location|desk|branch|station)/i.test(text)) {
    missing.push('Requester location or office is not clear.');
  }
  if (!/(error|screenshot|message|code|failed|warning|prompt)/i.test(text)) {
    missing.push('Exact error message or screenshot is not included.');
  }
  if (!/(asset|tag|serial|ip|device|model|laptop|printer|desktop)/i.test(text)) {
    missing.push('Affected device, asset tag, IP address, or serial number may be needed.');
  }
  return missing;
}

// ── 1. GET ARTICLES (Search with Telemetry & Device Filter) ───
exports.getArticles = async (req, res) => {
  try {
    const { q, category, device, tag, includeArchived } = req.query;
    // Guard against literal string 'undefined' from URLSearchParams
    const status = req.query.status && req.query.status !== 'undefined' ? req.query.status : undefined;
    const isStaffOrAdmin = req.user && ['admin', 'staff'].includes(req.user.role);
    
    // Status filter: Public only sees published. Staff sees published/pending.
    let statusFilter = 'published';
    if (isStaffOrAdmin) {
      statusFilter = status || undefined; // If not specified, returns non-archived
    }

    const where = {
      isArchived: includeArchived === 'true' ? undefined : false,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(category && category !== 'All' ? { category } : {}),
      ...(device && device !== 'All' ? { affectedDevices: { contains: device, mode: 'insensitive' } } : {}),
      ...(tag ? { tags: { contains: tag, mode: 'insensitive' } } : {})
    };

    // Advanced Typo-Tolerant & Multi-Field Search
    if (q && q.trim()) {
      const tokens = getTerms(q);
      const searchConditions = [
        { title: { contains: q, mode: 'insensitive' } },
        { symptoms: { contains: q, mode: 'insensitive' } },
        { affectedDevices: { contains: q, mode: 'insensitive' } },
        { cause: { contains: q, mode: 'insensitive' } },
        { resolution: { contains: q, mode: 'insensitive' } },
        { tags: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } }
      ];

      // If multi-word, also match individual tokens
      tokens.forEach(token => {
        searchConditions.push(
          { title: { contains: token, mode: 'insensitive' } },
          { symptoms: { contains: token, mode: 'insensitive' } },
          { affectedDevices: { contains: token, mode: 'insensitive' } },
          { tags: { contains: token, mode: 'insensitive' } }
        );
      });

      where.OR = searchConditions;
    }

    const articles = await prisma.knowledgeArticle.findMany({
      where,
      orderBy: [{ views: 'desc' }, { updatedAt: 'desc' }]
    });

    // Log Search Telemetry (Tracks Zero-Result Content Gaps!)
    if (q && q.trim().length >= 2) {
      prisma.knowledgeSearchLog.create({
        data: {
          query: q.trim().toLowerCase(),
          category: category || null,
          resultCount: articles.length,
          userId: req.user?.id || null,
          userRole: req.user?.role || 'public'
        }
      }).catch(err => console.warn('Search log skipped:', err.message));
    }

    res.json({ success: true, count: articles.length, articles });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch articles' });
  }
};

// ── 2. GET SINGLE ARTICLE ────────────────────────────────────
exports.getArticle = async (req, res) => {
  try {
    const idOrSlug = req.params.idOrSlug;
    const article = await prisma.knowledgeArticle.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      },
      include: {
        revisions: {
          orderBy: { version: 'desc' },
          take: 5
        }
      }
    });

    if (!article || (!req.user && article.status !== 'published')) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Increment view count asynchronously
    await prisma.knowledgeArticle.update({
      where: { id: article.id },
      data: { views: { increment: 1 } }
    }).catch(() => null);

    res.json({ success: true, article: { ...article, views: article.views + 1 } });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch article' });
  }
};

// ── 3. CREATE ARTICLE (Officer Contribution) ─────────────────
exports.createArticle = async (req, res) => {
  try {
    const { 
      title, 
      category, 
      symptoms, 
      affectedDevices, 
      cause, 
      resolution, 
      escalation, 
      tags, 
      excerpt, 
      content, 
      relatedArticles,
      status 
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and Category are required' });
    }

    const isAdmin = req.user?.role === 'admin';
    // Officer submissions default to published if specified or pending_review
    const initialStatus = status || (isAdmin ? 'published' : 'pending_review');

    // Build synthesized markdown content if not explicitly provided
    const resolvedContent = content || `
## Problem Symptoms
${symptoms || 'No symptoms documented.'}

## Affected Devices & Models
${affectedDevices || 'All systems'}

## Root Cause
${cause || 'Standard operating issue.'}

## Step-by-Step Resolution
${resolution || 'Refer to standard ICT checklist.'}

## Escalation Path
${escalation || 'Escalate to Tier 3 Lead if unresolved after standard procedure.'}
`.trim();

    let slug = slugify(title);
    const existingSlug = await prisma.knowledgeArticle.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const article = await prisma.knowledgeArticle.create({
      data: {
        title,
        slug,
        category,
        excerpt: excerpt || symptoms?.slice(0, 160) || 'ICT Troubleshooting guide',
        content: resolvedContent,
        symptoms: symptoms || null,
        affectedDevices: affectedDevices || null,
        cause: cause || null,
        resolution: resolution || null,
        escalation: escalation || null,
        tags: tags || '',
        status: initialStatus,
        relatedArticles: relatedArticles || null,
        authorId: req.user?.id || null,
        authorName: req.user?.name || 'ICT Officer',
        authorRole: req.user?.role || 'staff',
        version: 1,
        revisions: {
          create: {
            version: 1,
            title,
            content: resolvedContent,
            symptoms,
            resolution,
            changedBy: req.user?.name || 'ICT Officer',
            reason: 'Initial creation'
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: initialStatus === 'pending_review' 
        ? 'Article submitted successfully and queued for Administrator review.' 
        : 'Article published successfully.',
      article
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create article' });
  }
};

// ── 4. UPDATE ARTICLE (Strictly Administrator Only) ───────────
exports.updateArticle = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Only ICT Administrators can edit knowledge articles.'
      });
    }

    const { id } = req.params;
    const existing = await prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const {
      title,
      category,
      symptoms,
      affectedDevices,
      cause,
      resolution,
      escalation,
      tags,
      excerpt,
      content,
      status,
      editReason
    } = req.body;

    const newVersion = (existing.version || 1) + 1;

    // Snapshot existing version before modifying
    await prisma.knowledgeRevision.create({
      data: {
        articleId: existing.id,
        version: existing.version || 1,
        title: existing.title,
        content: existing.content,
        symptoms: existing.symptoms,
        resolution: existing.resolution,
        changedBy: req.user.name,
        reason: editReason || 'Administrative update'
      }
    });

    const updated = await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        ...(title ? { title, slug: slugify(title) } : {}),
        ...(category ? { category } : {}),
        ...(symptoms !== undefined ? { symptoms } : {}),
        ...(affectedDevices !== undefined ? { affectedDevices } : {}),
        ...(cause !== undefined ? { cause } : {}),
        ...(resolution !== undefined ? { resolution } : {}),
        ...(escalation !== undefined ? { escalation } : {}),
        ...(tags !== undefined ? { tags } : {}),
        ...(excerpt !== undefined ? { excerpt } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(status ? { status } : {}),
        version: newVersion,
        updatedAt: new Date()
      }
    });

    res.json({ success: true, message: 'Article updated and revision logged.', article: updated });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ success: false, message: 'Failed to update article' });
  }
};

// ── 5. DELETE ARTICLE (Soft Delete - Admin Only) ──────────────
exports.deleteArticle = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Only ICT Administrators can delete knowledge articles.'
      });
    }

    const { id } = req.params;
    const existing = await prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Soft delete preserves integrity with resolved tickets
    await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        isArchived: true,
        status: 'archived',
        deletedAt: new Date()
      }
    });

    res.json({ success: true, message: 'Article archived successfully (soft deleted).' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ success: false, message: 'Failed to archive article' });
  }
};

// ── 6. RESTORE ARTICLE (Admin Only) ──────────────────────────
exports.restoreArticle = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    const { id } = req.params;
    const restored = await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        isArchived: false,
        status: 'published',
        deletedAt: null
      }
    });

    res.json({ success: true, message: 'Article restored to published status.', article: restored });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to restore article' });
  }
};

// ── 7. APPROVE OFFICER SUBMISSION (Admin Only) ───────────────
exports.approveArticle = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    const { id } = req.params;
    const approved = await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        status: 'published',
        approvedBy: req.user.name,
        approvedAt: new Date()
      }
    });

    res.json({ success: true, message: 'Article approved and published organization-wide.', article: approved });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve article' });
  }
};

// ── 8. UNRESOLVED SEARCH TELEMETRY (Content Gaps) ─────────────
exports.getSearchGaps = async (req, res) => {
  try {
    const logs = await prisma.knowledgeSearchLog.findMany({
      where: { resultCount: 0 },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Group queries by frequency
    const frequencyMap = {};
    logs.forEach(log => {
      const q = log.query.toLowerCase().trim();
      frequencyMap[q] = (frequencyMap[q] || 0) + 1;
    });

    const topUnresolved = Object.entries(frequencyMap)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    res.json({ success: true, gaps: topUnresolved, totalZeroResultSearches: logs.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch search telemetry' });
  }
};

// ── 9. SUBMIT FEEDBACK & HELPFULNESS RATING ──────────────────
exports.submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { wasHelpful, comment } = req.body;

    await Promise.all([
      prisma.knowledgeArticle.update({
        where: { id },
        data: wasHelpful ? { helpful: { increment: 1 } } : { notHelpful: { increment: 1 } }
      }),
      prisma.knowledgeFeedback.create({
        data: {
          articleId: id,
          wasHelpful: Boolean(wasHelpful),
          comment: comment || null,
          userId: req.user?.id || null
        }
      })
    ]);

    res.json({ success: true, message: 'Thank you for your feedback.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to log feedback' });
  }
};

exports.rateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body;
    const updated = await prisma.knowledgeArticle.update({
      where: { id },
      data: helpful ? { helpful: { increment: 1 } } : { notHelpful: { increment: 1 } }
    });
    res.json({ success: true, article: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to rate article' });
  }
};

exports.getRevisions = async (req, res) => {
  try {
    const { id } = req.params;
    const revisions = await prisma.knowledgeRevision.findMany({
      where: { articleId: id },
      orderBy: { version: 'desc' }
    });
    res.json({ success: true, revisions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load revisions' });
  }
};

// ── 10. MATERIAL UPLOAD (Officer Documents & Guides) ─────────
exports.uploadArticleMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { title, category, tags } = req.body;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const size = req.file.size;

    let extractedText = '';
    const isText = mimeType.startsWith('text/') || /\.(md|txt|csv|json|log)$/i.test(originalName);
    if (isText) {
      extractedText = req.file.buffer.toString('utf-8').slice(0, 10000);
    }

    const resolvedTitle = title || originalName.replace(/\.[^/.]+$/, '');
    const slug = `${slugify(resolvedTitle)}-${Date.now().toString().slice(-4)}`;

    const article = await prisma.knowledgeArticle.create({
      data: {
        title: resolvedTitle,
        slug,
        category: category || 'Hardware & Peripherals',
        tags: tags || 'uploaded-material',
        excerpt: `Document guide: ${originalName} (${Math.round(size / 1024)} KB)`,
        content: extractedText || `Technical documentation attachment: **${originalName}**\n\nUploaded by ICT Officer: ${req.user?.name || 'Staff'}.`,
        affectedDevices: 'Document Attachment',
        resolution: 'Download and review attached technical documentation.',
        attachments: [{
          name: originalName,
          size,
          mimeType,
          uploadedAt: new Date()
        }],
        status: req.user?.role === 'admin' ? 'published' : 'pending_review',
        authorId: req.user?.id || null,
        authorName: req.user?.name || 'ICT Officer',
        authorRole: req.user?.role || 'staff'
      }
    });

    res.status(201).json({ success: true, article, message: 'Material uploaded and indexed successfully.' });
  } catch (error) {
    console.error('Upload material error:', error);
    res.status(500).json({ success: false, message: 'Failed to process material upload' });
  }
};

// ── 11. PRESERVED INSIGHTS & TICKET DEFLECTION ───────────────
exports.getKnowledgeInsights = async (req, res) => {
  try {
    const [articles, tickets, resolvedTickets] = await Promise.all([
      prisma.knowledgeArticle.findMany({ where: { status: 'published', isArchived: false } }),
      prisma.ticket.findMany({
        select: {
          category: true,
          priority: true,
          subject: true,
          description: true,
          status: true,
          resolutionTime: true,
          createdAt: true
        }
      }),
      prisma.ticket.findMany({
        where: { resolutionTime: { not: null } },
        select: { category: true, resolutionTime: true }
      })
    ]);

    const categoryCounts = {};
    const articleCoverage = {};
    articles.forEach(article => {
      articleCoverage[article.category] = (articleCoverage[article.category] || 0) + 1;
    });

    tickets.forEach(ticket => {
      categoryCounts[ticket.category] = (categoryCounts[ticket.category] || 0) + 1;
    });

    const recurringIssues = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const resolutionByCategory = {};
    resolvedTickets.forEach(ticket => {
      if (!resolutionByCategory[ticket.category]) resolutionByCategory[ticket.category] = [];
      resolutionByCategory[ticket.category].push(ticket.resolutionTime);
    });

    const resolutionTimes = Object.entries(resolutionByCategory)
      .map(([category, values]) => ({
        category,
        averageMinutes: average(values),
        resolvedTickets: values.length
      }))
      .sort((a, b) => b.averageMinutes - a.averageMinutes);

    const termCounts = {};
    tickets.forEach(ticket => {
      getTerms(`${ticket.subject} ${ticket.description}`).forEach(term => {
        termCounts[term] = (termCounts[term] || 0) + 1;
      });
    });

    const commonTerms = Object.entries(termCounts)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const knowledgeGaps = recurringIssues
      .map(issue => ({
        category: issue.category,
        tickets: issue.count,
        articles: articleCoverage[issue.category] || 0,
        recommendation: articleCoverage[issue.category]
          ? `Review whether the ${articleCoverage[issue.category]} article(s) for this category answer the repeated ticket pattern.`
          : 'Create a knowledge-base article for this recurring category.'
      }))
      .filter(issue => issue.tickets >= 2 && issue.articles < Math.ceil(issue.tickets / 5))
      .slice(0, 6);

    const articleEffectiveness = articles
      .map(article => ({
        title: article.title,
        category: article.category,
        views: article.views,
        helpful: article.helpful,
        notHelpful: article.notHelpful,
        score: article.views + article.helpful * 3 - article.notHelpful * 2
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    res.json({
      success: true,
      insights: {
        articleCount: articles.length,
        ticketCount: tickets.length,
        recurringIssues,
        resolutionTimes,
        commonTerms,
        knowledgeGaps,
        articleEffectiveness,
        overview: recurringIssues.length
          ? `Most recurring category is ${recurringIssues[0].category} with ${recurringIssues[0].count} ticket(s).`
          : 'Not enough ticket history yet for recurring issue analysis.'
      }
    });
  } catch (error) {
    console.error('Knowledge insights error:', error);
    res.status(500).json({ success: false, message: 'Failed to build knowledge insights' });
  }
};

exports.getTicketSuggestions = async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.ticketId },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        description: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true
      }
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const articles = await prisma.knowledgeArticle.findMany({ 
      where: { status: 'published', isArchived: false } 
    });

    const terms = getTerms(`${ticket.subject} ${ticket.description}`);
    const scoredArticles = articles
      .map(article => {
        const text = `${article.title} ${article.symptoms || ''} ${article.affectedDevices || ''} ${article.tags || ''}`.toLowerCase();
        const score = terms.reduce((acc, t) => acc + (text.includes(t) ? 2 : 0), 0) + (article.category === ticket.category ? 3 : 0);
        return { ...article, score };
      })
      .filter(a => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    res.json({
      success: true,
      suggestions: {
        summary: `Found ${scoredArticles.length} relevant standard fix(es) for ticket #${ticket.ticketNumber}`,
        recommendedActions: [
          'Verify requester symptoms match the affected hardware/software checklist.',
          'Execute the step-by-step resolution from the top matching SOP.',
          'If symptoms persist after procedure, escalate to Senior Support Engineer.'
        ],
        missingInfo: getMissingInfo(ticket),
        priorityAssessment: {
          current: ticket.priority,
          suggested: inferPriority(ticket),
          shouldReview: ticket.priority !== inferPriority(ticket)
        },
        articles: scoredArticles
      }
    });
  } catch (error) {
    console.error('Ticket suggestions error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate ticket suggestions' });
  }
};
