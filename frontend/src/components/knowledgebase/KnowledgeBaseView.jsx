import React, { useEffect, useMemo, useState } from 'react';
import { Book, Search, FileText, HelpCircle, TrendingUp, Clock, Plus, ThumbsUp, Upload, Sparkles, AlertTriangle, Lightbulb, Gauge } from 'lucide-react';
import { knowledgeBaseService } from '../../services/knowledgeBaseService';
import { ISSUE_CATEGORIES } from '../../utils/constants';
import { authService } from '../../services/authService';
import { operationsService } from '../../services/operationsService';

export const KnowledgeBaseView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMeta, setUploadMeta] = useState({ title: '', category: ISSUE_CATEGORIES[0], tags: 'uploaded-material' });
  const [insights, setInsights] = useState(null);
  const [operationsInsights, setOperationsInsights] = useState(null);
  const [draft, setDraft] = useState({
    title: '',
    category: ISSUE_CATEGORIES[0],
    excerpt: '',
    content: '',
    tags: '',
    status: 'published'
  });

  const currentUser = authService.getCurrentUser();
  const canManage = ['admin', 'staff'].includes(currentUser?.role);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadArticles();
      loadInsights();
      loadOperationsInsights();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const response = await knowledgeBaseService.getArticles();
      if (response.success) setArticles(response.articles || []);
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInsights = async () => {
    try {
      const response = await knowledgeBaseService.getInsights();
      if (response.success) setInsights(response.insights);
    } catch (error) {
      console.warn('Knowledge insights unavailable:', error.message);
    }
  };

  const loadOperationsInsights = async () => {
    try {
      const response = await operationsService.getDashboardAnalytics();
      if (response.success) setOperationsInsights(response.analytics?.aiInsights || null);
    } catch (error) {
      console.warn('Operational insights unavailable:', error.message);
    }
  };

  const filteredArticles = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return articles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query) ||
      (article.tags || '').toLowerCase().includes(query) ||
      (article.excerpt || '').toLowerCase().includes(query)
    );
  }, [articles, searchQuery]);

  const categories = useMemo(() => {
    const counts = articles.reduce((acc, article) => {
      acc[article.category] = (acc[article.category] || 0) + 1;
      return acc;
    }, {});
    return [
      { name: 'All Articles', count: articles.length, icon: FileText },
      { name: 'Most Popular', count: articles.filter(a => a.views > 0).length, icon: TrendingUp },
      { name: 'Recently Updated', count: articles.slice(0, 4).length, icon: Clock },
      ...Object.entries(counts).slice(0, 3).map(([name, count]) => ({ name, count, icon: HelpCircle }))
    ];
  }, [articles]);

  const createArticle = async (event) => {
    event.preventDefault();
    const response = await knowledgeBaseService.createArticle(draft);
    if (response.success) {
      setArticles(prev => [response.article, ...prev]);
      loadInsights();
      setShowEditor(false);
      setDraft({ title: '', category: ISSUE_CATEGORIES[0], excerpt: '', content: '', tags: '', status: 'published' });
    }
  };

  const uploadMaterial = async (event) => {
    event.preventDefault();
    if (!uploadFile) {
      alert('Please choose a file to upload');
      return;
    }
    const response = await knowledgeBaseService.uploadMaterial(uploadFile, uploadMeta);
    if (response.success) {
      setArticles(prev => [response.article, ...prev]);
      setShowUpload(false);
      setUploadFile(null);
      setUploadMeta({ title: '', category: ISSUE_CATEGORIES[0], tags: 'uploaded-material' });
      loadInsights();
    } else {
      alert(response.message || 'Failed to upload material');
    }
  };

  const rateArticle = async (article) => {
    const response = await knowledgeBaseService.rateArticle(article.id, true);
    if (response.success) {
      setArticles(prev => prev.map(item => item.id === article.id ? response.article : item));
      setSelectedArticle(response.article);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-xl p-8 shadow-xl">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Book className="w-12 h-12" />
            <h1 className="text-4xl font-bold">Knowledge Base</h1>
          </div>
          <p className="text-white/90 text-lg mb-6">
            Search reusable fixes before opening or escalating a ticket
          </p>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles, tags, categories, or symptoms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-gray-900 rounded-xl border-2 border-white/20 focus:border-white focus:outline-none text-lg"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
          {categories.slice(0, 4).map((category) => (
            <button
              key={category.name}
              onClick={() => category.name !== 'All Articles' && setSearchQuery(category.name)}
              className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-[#911414] hover:shadow-lg transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <category.icon className="w-7 h-7 text-[#911414]" />
                <span className="text-2xl font-bold text-gray-900">{category.count}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
            </button>
          ))}
        </div>
        {canManage && (
          <div className="ml-4 flex gap-2">
            <button
              onClick={() => setShowUpload(true)}
              className="px-4 py-3 border border-[#911414] text-[#911414] rounded-lg hover:bg-red-50 flex items-center gap-2 font-medium"
            >
              <Upload className="w-5 h-5" />
              Upload
            </button>
            <button
              onClick={() => setShowEditor(true)}
              className="px-4 py-3 bg-[#911414] text-white rounded-lg hover:bg-[#ac0807] flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Article
            </button>
          </div>
        )}
      </div>

      {operationsInsights && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-700" />
                AI Operational Insights
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Generated {new Date(operationsInsights.generatedAt).toLocaleString()}
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-800 text-sm font-semibold">
              <Gauge className="w-4 h-4" />
              {operationsInsights.slaRisk?.overdue || 0} overdue
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
            {(operationsInsights.executiveSummary || []).map((item, index) => (
              <div key={index} className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-sm font-medium text-indigo-950">{item}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                SLA Risk
              </h3>
              <div className="space-y-3">
                {(operationsInsights.slaRisk?.highestRiskTickets || []).slice(0, 5).map(ticket => (
                  <div key={ticket.ticketNumber} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold text-gray-900">{ticket.ticketNumber}</span>
                      <span className={ticket.isOverdue ? 'text-red-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {ticket.isOverdue ? 'Overdue' : `${ticket.ageHours}h old`}
                      </span>
                    </div>
                    <p className="text-gray-600 truncate">{ticket.subject}</p>
                    <p className="text-xs text-gray-500">{ticket.priority} • {ticket.assignedTo}</p>
                  </div>
                ))}
                {(operationsInsights.slaRisk?.highestRiskTickets || []).length === 0 && (
                  <p className="text-sm text-gray-500">No immediate SLA risk detected.</p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#911414]" />
                Recurring Patterns
              </h3>
              <div className="space-y-3">
                {(operationsInsights.recurringIssues || []).slice(0, 5).map(item => (
                  <div key={item.category} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-700">{item.category}</span>
                    <span className="font-semibold text-[#911414] flex-shrink-0">{item.count} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
              {(operationsInsights.duplicateSignals || []).length > 0 && (
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-sm font-semibold text-amber-900">
                    {operationsInsights.duplicateSignals.length} possible duplicate cluster(s)
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-emerald-600" />
                Recommended Actions
              </h3>
              <div className="space-y-3">
                {(operationsInsights.escalationRecommendations || []).slice(0, 4).map(item => (
                  <div key={`${item.ticketNumber}-${item.reason}`} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                    <p className="font-semibold text-gray-900">{item.ticketNumber}</p>
                    <p className="text-gray-600">{item.reason}</p>
                    <p className="text-emerald-700 mt-1">{item.recommendation}</p>
                  </div>
                ))}
                {(operationsInsights.escalationRecommendations || []).length === 0 && (
                  <p className="text-sm text-gray-500">No escalation recommendation right now.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {insights && (
        <div className="bg-indigo-50 rounded-xl p-6 border-2 border-indigo-200">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-700" />
            AI Knowledge Overview
          </h2>
          <p className="text-sm text-indigo-900 mb-4">{insights.overview}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <h3 className="font-semibold text-gray-900 mb-2">Recurring Issues</h3>
              <div className="space-y-2">
                {insights.recurringIssues.slice(0, 5).map(item => (
                  <div key={item.category} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.category}</span>
                    <span className="font-semibold text-indigo-700">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <h3 className="font-semibold text-gray-900 mb-2">Resolution Time</h3>
              <div className="space-y-2">
                {insights.resolutionTimes.slice(0, 5).map(item => (
                  <div key={item.category} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">{item.category}</span>
                      <span className="font-semibold text-indigo-700">{item.averageMinutes}m</span>
                    </div>
                    <p className="text-xs text-gray-500">{item.resolvedTickets} resolved ticket(s)</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <h3 className="font-semibold text-gray-900 mb-2">Common Signals</h3>
              <div className="flex flex-wrap gap-2">
                {insights.commonTerms.map(item => (
                  <span key={item.term} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
                    {item.term} ({item.count})
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <h3 className="font-semibold text-gray-900 mb-2">Knowledge Gaps</h3>
              <div className="space-y-2">
                {(insights.knowledgeGaps || []).slice(0, 5).map(item => (
                  <div key={item.category} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium text-gray-900">{item.category}</span>
                      <span className="text-indigo-700 font-semibold">{item.tickets} tickets / {item.articles} articles</span>
                    </div>
                    <p className="text-gray-600">{item.recommendation}</p>
                  </div>
                ))}
                {(!insights.knowledgeGaps || insights.knowledgeGaps.length === 0) && (
                  <p className="text-sm text-gray-500">No urgent article gaps detected.</p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <h3 className="font-semibold text-gray-900 mb-2">Article Effectiveness</h3>
              <div className="space-y-2">
                {(insights.articleEffectiveness || []).slice(0, 5).map(article => (
                  <div key={article.title} className="flex justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{article.title}</p>
                      <p className="text-xs text-gray-500">{article.category}</p>
                    </div>
                    <span className="text-indigo-700 font-semibold flex-shrink-0">{article.views} views</span>
                  </div>
                ))}
                {(!insights.articleEffectiveness || insights.articleEffectiveness.length === 0) && (
                  <p className="text-sm text-gray-500">Article usage will appear after staff begin viewing and rating content.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showUpload && (
        <form onSubmit={uploadMaterial} className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Upload Knowledge Material</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="px-4 py-3 border border-gray-300 rounded-lg"
            />
            <select
              value={uploadMeta.category}
              onChange={(e) => setUploadMeta(prev => ({ ...prev, category: e.target.value }))}
              className="px-4 py-3 border border-gray-300 rounded-lg"
            >
              {ISSUE_CATEGORIES.map(category => <option key={category}>{category}</option>)}
            </select>
          </div>
          <input
            value={uploadMeta.title}
            onChange={(e) => setUploadMeta(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Optional title. Defaults to filename."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
          <input
            value={uploadMeta.tags}
            onChange={(e) => setUploadMeta(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="Tags separated by commas"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
          <p className="text-sm text-gray-600">Text, markdown, CSV, JSON, and log files are extracted into searchable knowledge articles. Other files are stored as reference entries.</p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowUpload(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-[#911414] text-white rounded-lg">Upload Material</button>
          </div>
        </form>
      )}

      {showEditor && (
        <form onSubmit={createArticle} className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">New Knowledge Article</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              required
              value={draft.title}
              onChange={(e) => setDraft(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Article title"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
            />
            <select
              value={draft.category}
              onChange={(e) => setDraft(prev => ({ ...prev, category: e.target.value }))}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
            >
              {ISSUE_CATEGORIES.map(category => <option key={category}>{category}</option>)}
            </select>
          </div>
          <input
            value={draft.tags}
            onChange={(e) => setDraft(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="Tags separated by commas"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
          />
          <textarea
            value={draft.excerpt}
            onChange={(e) => setDraft(prev => ({ ...prev, excerpt: e.target.value }))}
            placeholder="Short summary"
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
          />
          <textarea
            required
            value={draft.content}
            onChange={(e) => setDraft(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Article content"
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowEditor(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-[#911414] text-white rounded-lg">Publish</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {searchQuery ? `Search Results (${filteredArticles.length})` : 'Published Articles'}
        </h2>

        {isLoading ? (
          <p className="text-gray-600">Loading articles...</p>
        ) : filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-[#911414] hover:shadow-lg transition-all text-left"
                >
                  <FileText className="w-8 h-8 text-[#911414] mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{article.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{article.excerpt || article.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">{article.category}</span>
                    <span>{new Date(article.updatedAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              {selectedArticle ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-[#911414] uppercase">{selectedArticle.category}</p>
                    <h3 className="text-xl font-bold text-gray-900">{selectedArticle.title}</h3>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedArticle.content}</p>
                  <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
                    <span>{selectedArticle.views} views</span>
                    <button onClick={() => rateArticle(selectedArticle)} className="flex items-center gap-2 text-green-700 font-medium">
                      <ThumbsUp className="w-4 h-4" />
                      Helpful ({selectedArticle.helpful})
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Select an article to preview it.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No articles found</p>
          </div>
        )}
      </div>
    </div>
  );
};
