const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getTerms(value) {
  const stopWords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'has', 'are', 'was', 'were', 'you', 'your', 'issue', 'ticket', 'request']);
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !stopWords.has(term));
}

function scoreArticle(article, terms, category) {
  const haystack = `${article.title} ${article.excerpt || ''} ${article.content || ''} ${article.tags || ''}`.toLowerCase();
  const termScore = terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
  const categoryScore = category && article.category === category ? 3 : 0;
  return termScore + categoryScore + Math.min(article.helpful || 0, 5) * 0.2;
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
  if (!/(asset|serial|tag|device|laptop|printer|computer|ip|mac)/i.test(text) && /(hardware|printer|network|device|computer|laptop)/i.test(ticket.category || text)) {
    missing.push('Affected device, asset tag, IP address, or serial number may be needed.');
  }
  if (!/(one user|all users|many users|department|directorate|everyone|team)/i.test(text)) {
    missing.push('Impact scope is not stated clearly.');
  }

  return missing.slice(0, 4);
}

function similarityScore(ticket, other) {
  const terms = new Set(getTerms(`${ticket.subject} ${ticket.description}`));
  const otherTerms = new Set(getTerms(`${other.subject} ${other.description}`));
  const overlap = [...terms].filter(term => otherTerms.has(term)).length;
  return overlap + (ticket.category === other.category ? 2 : 0);
}

exports.getArticles = async (req, res) => {
  try {
    const { q, category, status } = req.query;
    const isPublic = !req.user;
    const where = {
      ...(isPublic ? { status: 'published' } : status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(q ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { excerpt: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
          { tags: { contains: q, mode: 'insensitive' } }
        ]
      } : {})
    };

    const articles = await prisma.knowledgeArticle.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }]
    });
    res.json({ success: true, articles });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch articles' });
  }
};

exports.getArticle = async (req, res) => {
  try {
    const idOrSlug = req.params.idOrSlug;
    const article = await prisma.knowledgeArticle.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      }
    });
    if (!article || (!req.user && article.status !== 'published')) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    await prisma.knowledgeArticle.update({
      where: { id: article.id },
      data: { views: { increment: 1 } }
    });
    res.json({ success: true, article: { ...article, views: article.views + 1 } });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch article' });
  }
};

exports.createArticle = async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, status } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Title, content, and category are required' });
    }

    const baseSlug = slugify(title);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.knowledgeArticle.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const article = await prisma.knowledgeArticle.create({
      data: {
        title,
        slug,
        excerpt: excerpt || '',
        content,
        category,
        tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
        status: status || 'draft',
        createdBy: req.user.id
      }
    });

    res.status(201).json({ success: true, article });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ success: false, message: 'Failed to create article' });
  }
};

exports.uploadArticleMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Upload file is required' });
    }

    const { category, status, tags } = req.body;
    const mimetype = req.file.mimetype || '';
    const canReadAsText = mimetype.startsWith('text/') ||
      ['application/json', 'application/csv', 'application/xml'].includes(mimetype) ||
      /\.(txt|md|csv|json|log)$/i.test(req.file.originalname);

    const content = canReadAsText
      ? req.file.buffer.toString('utf8')
      : `Uploaded material: ${req.file.originalname}\n\nThis file type cannot be text-extracted yet. Keep this record as a reference material entry.`;

    const title = req.body.title || req.file.originalname.replace(/\.[^.]+$/, '');
    const baseSlug = slugify(title);
    let slug = baseSlug || `uploaded-material-${Date.now()}`;
    let suffix = 1;
    while (await prisma.knowledgeArticle.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const article = await prisma.knowledgeArticle.create({
      data: {
        title,
        slug,
        excerpt: content.slice(0, 240),
        content,
        category: category || 'General Issues',
        tags: tags || 'uploaded-material',
        status: status || 'published',
        createdBy: req.user.id
      }
    });

    res.status(201).json({ success: true, article });
  } catch (error) {
    console.error('Upload KB material error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload knowledge material' });
  }
};

exports.getKnowledgeInsights = async (req, res) => {
  try {
    const [articles, tickets, resolvedTickets] = await Promise.all([
      prisma.knowledgeArticle.findMany({ where: { status: 'published' } }),
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

    const [articles, categoryHistory, activeTickets] = await Promise.all([
      prisma.knowledgeArticle.findMany({ where: { status: 'published' } }),
      prisma.ticket.findMany({
        where: {
          category: ticket.category,
          resolutionTime: { not: null }
        },
        select: {
          subject: true,
          resolutionTime: true,
          status: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      }),
      prisma.ticket.findMany({
        where: {
          id: { not: ticket.id },
          status: { in: ['Open', 'In Progress'] }
        },
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          description: true,
          category: true,
          priority: true,
          status: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    ]);

    const terms = getTerms(`${ticket.subject} ${ticket.description} ${ticket.category}`);
    const suggestions = articles
      .map(article => ({
        id: article.id,
        title: article.title,
        category: article.category,
        excerpt: article.excerpt || article.content.slice(0, 220),
        helpful: article.helpful,
        score: scoreArticle(article, terms, ticket.category)
      }))
      .filter(article => article.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const avgResolution = categoryHistory.length
      ? average(categoryHistory.map(item => item.resolutionTime))
      : null;
    const missingInfo = getMissingInfo(ticket);
    const inferredPriority = inferPriority(ticket);
    const similarTickets = activeTickets
      .map(item => ({ ...item, score: similarityScore(ticket, item) }))
      .filter(item => item.score >= 4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => ({
        ticketNumber: item.ticketNumber,
        subject: item.subject,
        category: item.category,
        priority: item.priority,
        status: item.status
      }));

    res.json({
      success: true,
      suggestions: {
        summary: suggestions.length
          ? `Found ${suggestions.length} related knowledge article(s). Start with "${suggestions[0].title}".`
          : 'No strong knowledge-base match yet. Capture the resolution as a new article after solving this ticket.',
        recommendedActions: [
          `Confirm requester impact and exact affected service for ${ticket.category}.`,
          missingInfo.length ? `Ask for missing details: ${missingInfo.join(' ')}` : 'Ticket has enough basic detail to start triage.',
          inferredPriority !== ticket.priority ? `Review priority: content suggests ${inferredPriority}, current priority is ${ticket.priority}.` : `Priority appears consistent as ${ticket.priority}.`,
          similarTickets.length ? `Check ${similarTickets.length} similar active ticket(s) before creating duplicate work.` : 'No strong duplicate active-ticket signal detected.',
          ticket.priority === 'Critical' ? 'Escalate immediately and post regular updates.' : 'Check similar resolved tickets before escalating.',
          avgResolution ? `Historical average resolution for this category is about ${avgResolution} minutes.` : 'No resolution baseline exists yet for this category.'
        ],
        missingInfo,
        priorityAssessment: {
          current: ticket.priority,
          suggested: inferredPriority,
          shouldReview: inferredPriority !== ticket.priority
        },
        similarTickets,
        articles: suggestions,
        history: {
          averageResolutionMinutes: avgResolution,
          sampleSize: categoryHistory.length
        }
      }
    });
  } catch (error) {
    console.error('Ticket suggestions error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate ticket suggestions' });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, status } = req.body;
    const data = {
      ...(title !== undefined && { title }),
      ...(excerpt !== undefined && { excerpt }),
      ...(content !== undefined && { content }),
      ...(category !== undefined && { category }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags.join(',') : tags }),
      ...(status !== undefined && { status })
    };
    if (title) data.slug = slugify(title);
    const article = await prisma.knowledgeArticle.update({ where: { id: req.params.id }, data });
    res.json({ success: true, article });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ success: false, message: 'Failed to update article' });
  }
};

exports.rateArticle = async (req, res) => {
  try {
    const helpful = Boolean(req.body.helpful);
    const article = await prisma.knowledgeArticle.update({
      where: { id: req.params.id },
      data: helpful ? { helpful: { increment: 1 } } : { notHelpful: { increment: 1 } }
    });
    res.json({ success: true, article });
  } catch (error) {
    console.error('Rate article error:', error);
    res.status(500).json({ success: false, message: 'Failed to rate article' });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    await prisma.knowledgeArticle.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Article deleted' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete article' });
  }
};
