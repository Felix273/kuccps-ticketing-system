import { api } from './api';

export const knowledgeBaseService = {
  getArticles(params = {}) {
    // Filter out undefined/null/empty strings so URLSearchParams doesn't serialize 'undefined'
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '' && v !== 'undefined')
    );
    const query = new URLSearchParams(cleanParams).toString();
    return api.get(`/knowledge-base/articles${query ? `?${query}` : ''}`);
  },

  getArticle(idOrSlug) {
    return api.get(`/knowledge-base/articles/${idOrSlug}`);
  },

  createArticle(article) {
    return api.post('/knowledge-base/articles', article);
  },

  updateArticle(id, article) {
    return api.put(`/knowledge-base/articles/${id}`, article);
  },

  deleteArticle(id) {
    return api.delete(`/knowledge-base/articles/${id}`);
  },

  restoreArticle(id) {
    return api.post(`/knowledge-base/articles/${id}/restore`, {});
  },

  approveArticle(id) {
    return api.post(`/knowledge-base/articles/${id}/approve`, {});
  },

  getSearchGaps() {
    return api.get('/knowledge-base/analytics/search-gaps');
  },

  getRevisions(id) {
    return api.get(`/knowledge-base/articles/${id}/revisions`);
  },

  rateArticle(id, wasHelpful) {
    return api.post(`/knowledge-base/articles/${id}/feedback`, { wasHelpful });
  },

  async uploadMaterial(file, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });

    const response = await fetch(`${api.baseURL}/knowledge-base/materials/upload`, {
      method: 'POST',
      headers: {
        ...api.getAuthHeader()
      },
      body: formData
    });
    return response.json();
  },

  getInsights() {
    return api.get('/knowledge-base/insights');
  },

  getTicketSuggestions(ticketId) {
    return api.get(`/knowledge-base/suggestions/tickets/${ticketId}`);
  }
};
