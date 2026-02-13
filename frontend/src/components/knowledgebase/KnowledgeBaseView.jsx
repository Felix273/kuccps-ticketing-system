import React, { useState } from 'react';
import { Book, Search, FileText, HelpCircle, TrendingUp, Clock } from 'lucide-react';

export const KnowledgeBaseView = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Sample articles - you can move this to backend later
  const articles = [
    {
      id: 1,
      title: 'How to Reset Your Password',
      category: 'Account Management',
      views: 1250,
      helpful: 145,
      lastUpdated: '2 days ago',
      excerpt: 'Step-by-step guide to reset your KUCCPS account password...',
      icon: '🔐'
    },
    {
      id: 2,
      title: 'Network Issues Troubleshooting',
      category: 'Network & Connectivity',
      views: 892,
      helpful: 98,
      lastUpdated: '1 week ago',
      excerpt: 'Common network problems and how to fix them...',
      icon: '🌐'
    },
    {
      id: 3,
      title: 'Software Installation Guide',
      category: 'Software Issues',
      views: 756,
      helpful: 87,
      lastUpdated: '3 days ago',
      excerpt: 'How to install and configure approved software...',
      icon: '💿'
    },
    {
      id: 4,
      title: 'Email Configuration on Mobile',
      category: 'Email & Communication',
      views: 634,
      helpful: 72,
      lastUpdated: '5 days ago',
      excerpt: 'Set up your KUCCPS email on iOS and Android devices...',
      icon: '📧'
    },
    {
      id: 5,
      title: 'Printer Setup Instructions',
      category: 'Printer & Peripheral',
      views: 523,
      helpful: 65,
      lastUpdated: '1 week ago',
      excerpt: 'Connect to network printers and troubleshoot common issues...',
      icon: '🖨️'
    },
    {
      id: 6,
      title: 'VPN Access Setup',
      category: 'Security Issues',
      views: 445,
      helpful: 58,
      lastUpdated: '4 days ago',
      excerpt: 'Configure VPN for remote access to KUCCPS systems...',
      icon: '🔒'
    }
  ];

  const categories = [
    { name: 'All Articles', count: articles.length, icon: FileText },
    { name: 'Most Popular', count: 3, icon: TrendingUp },
    { name: 'Recently Updated', count: 4, icon: Clock },
    { name: 'Getting Started', count: 5, icon: HelpCircle }
  ];

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-xl p-8 shadow-xl">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Book className="w-12 h-12" />
            <h1 className="text-4xl font-bold">Knowledge Base</h1>
          </div>
          <p className="text-white/90 text-lg mb-6">
            Find answers and solve problems quickly with our self-service articles
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for articles, guides, or solutions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-gray-900 rounded-xl border-2 border-white/20 focus:border-white focus:outline-none text-lg"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category, index) => (
          <button
            key={index}
            className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-[#911414] hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <category.icon className="w-8 h-8 text-[#911414]" />
              <span className="text-2xl font-bold text-gray-900">{category.count}</span>
            </div>
            <h3 className="font-semibold text-gray-900">{category.name}</h3>
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {searchQuery ? `Search Results (${filteredArticles.length})` : 'Popular Articles'}
        </h2>

        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-[#911414] hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="text-4xl mb-4">{article.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{article.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{article.excerpt}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">
                    {article.category}
                  </span>
                  <span>{article.lastUpdated}</span>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">👁️ {article.views}</span>
                    <span className="text-green-600">👍 {article.helpful}</span>
                  </div>
                  <span className="text-[#911414] font-semibold text-sm">Read →</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No articles found for "{searchQuery}"</p>
            <p className="text-gray-500 text-sm mt-2">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Help Footer */}
      <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Can't find what you're looking for?</h3>
            <p className="text-gray-600">Submit a ticket and our IT team will help you directly</p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-lg font-semibold hover:shadow-lg transition-all whitespace-nowrap">
            Create Ticket
          </button>
        </div>
      </div>
    </div>
  );
};
