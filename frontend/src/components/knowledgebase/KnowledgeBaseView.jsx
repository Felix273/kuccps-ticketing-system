import React, { useEffect, useMemo, useState } from 'react';
import { 
  Book, 
  Search, 
  HelpCircle, 
  Plus, 
  ThumbsUp, 
  ThumbsDown,
  AlertTriangle, 
  X, 
  ChevronRight, 
  Eye, 
  Printer,
  CheckCircle2,
  Cpu,
  Wrench,
  CheckSquare,
  Square,
  Copy,
  Check,
  RefreshCw,
  Edit2,
  Trash2
} from 'lucide-react';
import { knowledgeBaseService } from '../../services/knowledgeBaseService';
import { authService } from '../../services/authService';

// Clean inline markdown parser for **bold** and `code`
const formatInlineMarkdown = (str) => {
  if (!str) return '';
  const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-zinc-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-800 rounded font-mono text-[11px] border border-zinc-200">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

export const KnowledgeBaseView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDevice, setSelectedDevice] = useState('All');
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'gaps'
  const [searchGaps, setSearchGaps] = useState([]);
  const [copiedStep, setCopiedStep] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState({});
  const [feedbackSent, setFeedbackSent] = useState(false);

  const [draft, setDraft] = useState({
    title: '',
    category: 'Printers & Scanners',
    affectedDevices: '',
    symptoms: '',
    cause: '',
    resolution: '',
    escalation: '',
    tags: ''
  });

  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const isStaff = currentUser?.role === 'staff' || isAdmin;

  useEffect(() => {
    loadArticles();
    if (isAdmin) {
      loadSearchGaps();
    }
  }, [isAdmin]);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const response = await knowledgeBaseService.getArticles({
        includeArchived: 'false',
        status: isStaff ? undefined : 'published'
      });
      if (response.success) setArticles(response.articles || []);
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSearchGaps = async () => {
    try {
      const response = await knowledgeBaseService.getSearchGaps();
      if (response.success) setSearchGaps(response.gaps || []);
    } catch (err) {
      console.warn('Search gaps telemetry unavailable:', err.message);
    }
  };

  const deviceOptions = [
    'All',
    'Kyocera TASKalfa',
    'Kyocera ECOSYS',
    'Windows 10/11',
    'Microsoft 365',
    'FortiClient VPN',
    'Dell / HP Docks',
    'Active Directory',
    'Logitech MeetUp'
  ];

  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return articles.filter(article => {
      const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
      const matchesDevice = selectedDevice === 'All' || 
        (article.affectedDevices && article.affectedDevices.toLowerCase().includes(selectedDevice.toLowerCase()));

      const matchesQuery = !q || (
        article.title?.toLowerCase().includes(q) ||
        article.symptoms?.toLowerCase().includes(q) ||
        article.affectedDevices?.toLowerCase().includes(q) ||
        article.cause?.toLowerCase().includes(q) ||
        article.resolution?.toLowerCase().includes(q) ||
        article.tags?.toLowerCase().includes(q) ||
        article.category?.toLowerCase().includes(q)
      );

      const matchesTab = activeTab === 'all' 
        ? article.status === 'published'
        : activeTab === 'pending'
        ? article.status === 'pending_review'
        : true;

      return matchesCategory && matchesDevice && matchesQuery && matchesTab;
    });
  }, [articles, searchQuery, selectedCategory, selectedDevice, activeTab]);

  const categories = useMemo(() => {
    const list = Array.from(new Set(articles.map(a => a.category).filter(Boolean)));
    return ['All', ...list];
  }, [articles]);

  const handleOpenArticle = async (article) => {
    try {
      const res = await knowledgeBaseService.getArticle(article.id);
      setSelectedArticle(res.success ? res.article : article);
    } catch {
      setSelectedArticle(article);
    }
    setCheckedSteps({});
    setFeedbackSent(false);
  };

  const handleEdit = (article, e) => {
    if (e) e.stopPropagation();
    if (!isAdmin) return;

    setEditingArticleId(article.id);
    setDraft({
      title: article.title || '',
      category: article.category || 'Printers & Scanners',
      affectedDevices: article.affectedDevices || '',
      symptoms: article.symptoms || '',
      cause: article.cause || '',
      resolution: article.resolution || '',
      escalation: article.escalation || '',
      tags: article.tags || ''
    });
    setShowEditor(true);
  };

  const toggleCheckStep = (stepIdx) => {
    setCheckedSteps(prev => ({ ...prev, [stepIdx]: !prev[stepIdx] }));
  };

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(idx);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const handleRate = async (articleId, wasHelpful) => {
    if (feedbackSent) return;
    try {
      await knowledgeBaseService.rateArticle(articleId, wasHelpful);
      setFeedbackSent(true);
      setSelectedArticle(prev => prev ? {
        ...prev,
        helpful: wasHelpful ? prev.helpful + 1 : prev.helpful,
        notHelpful: !wasHelpful ? prev.notHelpful + 1 : prev.notHelpful
      } : null);
    } catch (err) {
      console.error('Rating failed:', err);
    }
  };

  const handleApprove = async (articleId) => {
    if (!isAdmin) return;
    try {
      const res = await knowledgeBaseService.approveArticle(articleId);
      if (res.success) {
        alert('Article approved and published to all staff.');
        loadArticles();
        setSelectedArticle(null);
      }
    } catch (err) {
      alert('Approval failed: ' + err.message);
    }
  };

  const handleDelete = async (articleId) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to archive this knowledge article?')) return;
    try {
      const res = await knowledgeBaseService.deleteArticle(articleId);
      if (res.success) {
        alert('Article archived.');
        loadArticles();
        setSelectedArticle(null);
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveArticle = async (e) => {
    e.preventDefault();
    try {
      if (editingArticleId) {
        // Update existing article (Admin only)
        const res = await knowledgeBaseService.updateArticle(editingArticleId, {
          ...draft,
          editReason: 'Administrative update'
        });
        if (res.success) {
          alert('SOP updated successfully (new revision logged).');
          setShowEditor(false);
          setEditingArticleId(null);
          loadArticles();
          if (selectedArticle && selectedArticle.id === editingArticleId) {
            setSelectedArticle(res.article);
          }
        }
      } else {
        // Create new article
        const res = await knowledgeBaseService.createArticle(draft);
        if (res.success) {
          alert(isAdmin ? 'Article published.' : 'Article submitted for Administrator review.');
          setShowEditor(false);
          setDraft({
            title: '',
            category: 'Printers & Scanners',
            affectedDevices: '',
            symptoms: '',
            cause: '',
            resolution: '',
            escalation: '',
            tags: ''
          });
          loadArticles();
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to save article');
    }
  };

  const parsedSteps = useMemo(() => {
    if (!selectedArticle) return [];
    const text = selectedArticle.resolution || selectedArticle.content || '';
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('##') && !line.startsWith('**When'));
  }, [selectedArticle]);

  return (
    <div className="space-y-5 font-sans">
      
      {/* 1. TOP UTILITY HEADER */}
      <div className="border border-zinc-200 bg-white p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Book className="w-5 h-5 text-[#990024]" />
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                ICT Knowledge Base & Standard Operating Procedures
              </h2>
              <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                Verified SOPs
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Model-specific troubleshooting guides, driver setups, network procedures, and institutional checklists
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
            {isAdmin && (
              <div className="flex items-center border border-zinc-200 rounded p-0.5 bg-zinc-50 font-mono text-xs">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    activeTab === 'all' ? 'bg-white shadow-2xs font-bold text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  Published ({articles.filter(a => a.status === 'published').length})
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    activeTab === 'pending' ? 'bg-white shadow-2xs font-bold text-amber-800' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  Review Queue ({articles.filter(a => a.status === 'pending_review').length})
                </button>
                <button
                  onClick={() => setActiveTab('gaps')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    activeTab === 'gaps' ? 'bg-white shadow-2xs font-bold text-rose-800' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  Search Gaps ({searchGaps.length})
                </button>
              </div>
            )}

            {isStaff && (
              <button
                onClick={() => {
                  setEditingArticleId(null);
                  setDraft({
                    title: '',
                    category: 'Printers & Scanners',
                    affectedDevices: '',
                    symptoms: '',
                    cause: '',
                    resolution: '',
                    escalation: '',
                    tags: ''
                  });
                  setShowEditor(true);
                }}
                className="px-3.5 py-1.5 text-xs font-mono font-semibold text-white bg-[#990024] hover:bg-[#80001e] rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Propose SOP Article</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search problem, error code, Kyocera jam, driver, eduroam, VPN, password reset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs font-sans bg-zinc-50 border border-zinc-200 rounded text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#990024] focus:bg-white"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-zinc-400 shrink-0 hidden sm:block" />
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded text-zinc-700 focus:outline-none focus:border-[#990024] cursor-pointer"
            >
              <option value="All">All Hardware & Models</option>
              {deviceOptions.filter(d => d !== 'All').map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex overflow-x-auto gap-1.5 pt-3 scrollbar-none font-mono text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded text-xs whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white font-bold'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 2. ADMIN CONTENT GAPS REPORT TAB */}
      {isAdmin && activeTab === 'gaps' && (
        <div className="border border-zinc-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Unresolved Searches (Content Gaps Telemetry)
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Problems searched by ICT officers that returned 0 results. Use this list to prioritize new articles.
              </p>
            </div>
            <button onClick={loadSearchGaps} className="p-1 text-zinc-400 hover:text-zinc-600">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {searchGaps.length > 0 ? (
            <div className="divide-y divide-zinc-100 font-mono text-xs">
              {searchGaps.map((gap, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-zinc-400 font-bold">#{i + 1}</span>
                    <span className="font-semibold text-zinc-900">"{gap.query}"</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                      {gap.count} failed searches
                    </span>
                    <button
                      onClick={() => {
                        setEditingArticleId(null);
                        setDraft(prev => ({ ...prev, title: `SOP: Resolving ${gap.query}` }));
                        setShowEditor(true);
                      }}
                      className="px-2 py-0.5 bg-zinc-900 text-white text-[10px] font-bold rounded hover:bg-zinc-800 cursor-pointer"
                    >
                      Write SOP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center font-mono text-xs text-zinc-400">
              No content gaps recorded. All searched queries currently return verified articles.
            </div>
          )}
        </div>
      )}

      {/* 3. ARTICLES GRID (Linear / getdesign.md Craft Grid) */}
      {activeTab !== 'gaps' && (
        isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
              <RefreshCw className="w-4 h-4 animate-spin text-[#990024]" />
              <span>INDEXING_KNOWLEDGE_SOP_STREAM...</span>
            </div>
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map(article => (
              <div
                key={article.id}
                onClick={() => handleOpenArticle(article)}
                className="bg-white border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-100 text-zinc-700 border border-zinc-200 truncate">
                      {article.category}
                    </span>

                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      {article.status === 'pending_review' ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Pending Review
                        </span>
                      ) : (
                        <span className="text-zinc-400">
                          v{article.version || 1}.0
                        </span>
                      )}

                      {/* Admin Quick Action Button on Cards */}
                      {isAdmin && (
                        <button
                          onClick={(e) => handleEdit(article, e)}
                          className="p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded"
                          title="Edit SOP"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-zinc-900 group-hover:text-[#990024] transition-colors leading-snug line-clamp-2">
                    {article.title}
                  </h3>

                  {article.affectedDevices && (
                    <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-zinc-600 bg-zinc-50 p-1.5 rounded border border-zinc-100 truncate">
                      <Cpu className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="truncate">{article.affectedDevices}</span>
                    </div>
                  )}

                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {article.symptoms || article.excerpt}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs font-mono text-zinc-400">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {article.views || 0}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <ThumbsUp className="w-3 h-3" /> {article.helpful || 0}
                    </span>
                  </div>

                  <span className="text-zinc-400 group-hover:text-zinc-900 transition-colors flex items-center gap-0.5 text-xs font-semibold">
                    <span>View SOP</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-zinc-200 bg-white p-12 text-center font-mono">
            <HelpCircle className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-zinc-800">NO_SOP_MATCH_FOUND</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5 max-w-sm mx-auto">
              {searchQuery 
                ? `No procedure matched "${searchQuery}". Query has been logged for ICT Admin content creation.` 
                : 'No articles in this category yet.'}
            </p>
          </div>
        )
      )}

      {/* 4. OFFICIAL SOP DOCUMENT & PDF MODAL (Print-Ready) */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 font-sans">
          <div className="bg-white rounded-xl border border-zinc-300 shadow-2xl max-w-4xl w-full max-h-[94vh] overflow-hidden flex flex-col animate-slide-in">
            
            {/* Modal Controls Bar */}
            <div className="p-3.5 px-6 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
                <span>DOCUMENT_VIEWER</span>
                <span>•</span>
                <span className="font-bold text-zinc-900">KUCCPS/ICT/SOP-{selectedArticle.id?.slice(0, 4).toUpperCase() || 'REF'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 text-xs font-mono font-semibold bg-white border border-zinc-200 rounded hover:bg-zinc-100 flex items-center gap-1.5 text-zinc-700 shadow-2xs cursor-pointer"
                  title="Print or Save as Official PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Print / Save as PDF</span>
                </button>

                {/* ADMIN ACTIONS: EDIT & DELETE TOGETHER */}
                {isAdmin && (
                  <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-200">
                    {selectedArticle.status === 'pending_review' && (
                      <button
                        onClick={() => handleApprove(selectedArticle.id)}
                        className="px-2.5 py-1.5 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => handleEdit(selectedArticle, e)}
                      className="px-2.5 py-1.5 text-xs font-mono font-semibold text-zinc-700 hover:bg-zinc-100 border border-zinc-200 rounded cursor-pointer flex items-center gap-1"
                      title="Edit Article (Admin Only)"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDelete(selectedArticle.id)}
                      className="px-2.5 py-1.5 text-xs font-mono font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded cursor-pointer flex items-center gap-1"
                      title="Archive Article (Admin Only)"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded transition-colors ml-2 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINT-READY OFFICIAL SOP DOCUMENT (A4 Whitepaper Layout) */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 bg-white print:p-0 print:space-y-4">
              
              {/* Official Institutional Header */}
              <div className="pb-4 border-b-2 border-zinc-900 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#990024]">
                      Kenya Universities and Colleges Central Placement Service
                    </p>
                    <h1 className="font-sans text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight mt-0.5">
                      ICT Standard Operating Procedure (SOP)
                    </h1>
                  </div>

                  <div className="border border-zinc-300 p-2 font-mono text-[10px] text-right space-y-0.5 bg-zinc-50 shrink-0">
                    <p>DOC ID: <strong className="text-zinc-900">SOP-{selectedArticle.id?.slice(0, 6).toUpperCase()}</strong></p>
                    <p>VERSION: <strong className="text-zinc-900">{selectedArticle.version || 1}.0</strong></p>
                    <p>STATUS: <strong className="text-emerald-700 uppercase">{selectedArticle.status}</strong></p>
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 leading-snug pt-2">
                  {selectedArticle.title}
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono text-zinc-500 border-t border-zinc-100">
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 block">Category</span>
                    <span className="font-semibold text-zinc-800">{selectedArticle.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 block">Effective Date</span>
                    <span className="font-semibold text-zinc-800">{new Date(selectedArticle.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 block">Author / Reviewer</span>
                    <span className="font-semibold text-zinc-800">{selectedArticle.authorName || 'ICT Directorate'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 block">Classification</span>
                    <span className="font-semibold text-zinc-800">Internal Use Only</span>
                  </div>
                </div>
              </div>

              {/* 1. Target Hardware & Affected Devices */}
              {selectedArticle.affectedDevices && (
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
                  <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                    <Cpu className="w-3.5 h-3.5 text-[#990024]" />
                    <span>Target Hardware / Software Scope</span>
                  </div>
                  <p className="font-mono text-xs font-semibold text-zinc-900 pl-5">
                    {selectedArticle.affectedDevices}
                  </p>
                </div>
              )}

              {/* 2. Problem Symptoms */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>1.0 Failure Symptoms & Diagnostic Triggers</span>
                </div>
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg text-xs sm:text-sm text-zinc-800 leading-relaxed font-sans">
                  {selectedArticle.symptoms || selectedArticle.excerpt || 'No specific symptoms documented.'}
                </div>
              </div>

              {/* 3. Root Cause Analysis */}
              {selectedArticle.cause && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-700">
                    <Wrench className="w-4 h-4 text-zinc-500" />
                    <span>2.0 Root Cause & Engineering Analysis</span>
                  </div>
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-xs sm:text-sm text-zinc-700 leading-relaxed font-sans">
                    {selectedArticle.cause}
                  </div>
                </div>
              )}

              {/* 4. Step-by-Step Tested Resolution (Interactive Checklist with Parsed Markdown) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>3.0 Step-by-Step Resolution Procedure</span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400 print:hidden">
                    Interactive Checklist ({Object.values(checkedSteps).filter(Boolean).length}/{parsedSteps.length} complete)
                  </span>
                </div>

                <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-200 bg-white">
                  {parsedSteps.map((step, idx) => {
                    const isChecked = !!checkedSteps[idx];
                    const isCodeBlock = step.startsWith('netsh') || step.startsWith('ipconfig') || step.startsWith('ping') || step.startsWith('Get-') || step.startsWith('Remove-');

                    return (
                      <div 
                        key={idx} 
                        className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors ${
                          isChecked ? 'bg-emerald-50/40 text-zinc-500 line-through' : 'hover:bg-zinc-50/60'
                        }`}
                      >
                        <button
                          onClick={() => toggleCheckStep(idx)}
                          className="mt-0.5 text-zinc-400 hover:text-emerald-600 cursor-pointer print:hidden"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0 text-xs sm:text-sm leading-relaxed">
                          {isCodeBlock ? (
                            <div className="flex items-center justify-between p-2 bg-zinc-900 text-zinc-100 rounded font-mono text-xs my-1">
                              <code>{step}</code>
                              <button 
                                onClick={() => handleCopyText(step, idx)}
                                className="text-zinc-400 hover:text-white p-1"
                                title="Copy Command"
                              >
                                {copiedStep === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ) : (
                            <span className={isChecked ? 'line-through' : ''}>
                              {formatInlineMarkdown(step.replace(/^\d+\.\s*/, '').replace(/^-\s*/, ''))}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. Escalation Criteria */}
              {selectedArticle.escalation && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>4.0 When to Escalate (Tier 3 Handover Boundary)</span>
                  </div>
                  <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-lg text-xs sm:text-sm text-rose-900 leading-relaxed font-sans">
                    {selectedArticle.escalation}
                  </div>
                </div>
              )}

              {/* Document Sign-Off Box (Print-Only) */}
              <div className="hidden print:block pt-8 border-t-2 border-zinc-900 mt-8 font-mono text-xs">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="font-bold">ICT Technical Lead Sign-Off:</p>
                    <div className="h-10 border-b border-zinc-400 mt-2"></div>
                    <p className="text-[10px] text-zinc-500 mt-1">Signature & Date</p>
                  </div>
                  <div>
                    <p className="font-bold">Directorate Verification:</p>
                    <div className="h-10 border-b border-zinc-400 mt-2"></div>
                    <p className="text-[10px] text-zinc-500 mt-1">KUCCPS ICT Directorate Seal</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Reader Footer Feedback */}
            <div className="p-4 px-6 border-t border-zinc-200 bg-zinc-50 flex flex-wrap items-center justify-between gap-3 text-xs font-mono print:hidden">
              <div className="flex items-center gap-3">
                <span className="text-zinc-500">Was this SOP helpful?</span>
                <button
                  onClick={() => handleRate(selectedArticle.id, true)}
                  disabled={feedbackSent}
                  className="px-2.5 py-1 bg-white border border-zinc-200 rounded text-emerald-700 hover:bg-emerald-50 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Yes ({selectedArticle.helpful || 0})</span>
                </button>
                <button
                  onClick={() => handleRate(selectedArticle.id, false)}
                  disabled={feedbackSent}
                  className="px-2.5 py-1 bg-white border border-zinc-200 rounded text-zinc-600 hover:bg-zinc-100 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>No ({selectedArticle.notHelpful || 0})</span>
                </button>
                {feedbackSent && <span className="text-emerald-700 font-bold">Feedback recorded.</span>}
              </div>

              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. CREATE & EDIT SOP MODAL */}
      {showEditor && (
        <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-xl border border-zinc-300 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <div>
                <h3 className="font-bold text-zinc-900 text-base">
                  {editingArticleId ? 'Edit Standard Operating Procedure' : 'Propose Standard Operating Procedure'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {editingArticleId 
                    ? 'Updating will create an auditable version increment (v2.0, v3.0)' 
                    : isAdmin ? 'Will be published immediately' : 'Will be queued for Administrator review'}
                </p>
              </div>
              <button 
                onClick={() => { setShowEditor(false); setEditingArticleId(null); }} 
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-zinc-600 font-bold uppercase mb-1">Article Title *</label>
                <input
                  required
                  placeholder="e.g. Kyocera TASKalfa: Clearing Paper Jam J-0511 in Cassette 1"
                  value={draft.title}
                  onChange={(e) => setDraft(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded font-sans focus:outline-none focus:border-[#990024]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 font-bold uppercase mb-1">Category *</label>
                  <select
                    value={draft.category}
                    onChange={(e) => setDraft(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded focus:outline-none"
                  >
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-600 font-bold uppercase mb-1">Affected Models / Devices *</label>
                  <input
                    placeholder="e.g. Kyocera TASKalfa 4054ci / 5054ci"
                    value={draft.affectedDevices}
                    onChange={(e) => setDraft(prev => ({ ...prev, affectedDevices: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-600 font-bold uppercase mb-1">Problem Symptoms *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="What does the user or machine display when this issue occurs?"
                  value={draft.symptoms}
                  onChange={(e) => setDraft(prev => ({ ...prev, symptoms: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded font-sans focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-600 font-bold uppercase mb-1">Root Cause</label>
                <textarea
                  rows={2}
                  placeholder="Technical cause (e.g. WSD port timeout, glazed rollers, expired cert)..."
                  value={draft.cause}
                  onChange={(e) => setDraft(prev => ({ ...prev, cause: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded font-sans focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-600 font-bold uppercase mb-1">Step-by-Step Tested Resolution *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="1. First step...\n2. Second step...\n3. Verification step..."
                  value={draft.resolution}
                  onChange={(e) => setDraft(prev => ({ ...prev, resolution: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded font-sans focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-600 font-bold uppercase mb-1">When to Escalate (Tier 3 Boundary)</label>
                <textarea
                  rows={2}
                  placeholder="When should the officer stop and escalate to Network Lead or Vendor?"
                  value={draft.escalation}
                  onChange={(e) => setDraft(prev => ({ ...prev, escalation: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded font-sans focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => { setShowEditor(false); setEditingArticleId(null); }}
                  className="px-4 py-2 border border-zinc-200 rounded text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#990024] hover:bg-[#80001e] text-white font-bold rounded shadow-xs"
                >
                  {editingArticleId ? 'Save & Update SOP' : isAdmin ? 'Publish SOP' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
