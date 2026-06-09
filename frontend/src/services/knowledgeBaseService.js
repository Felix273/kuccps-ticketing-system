import { api } from './api';

export const knowledgeBaseService = {
  getArticles(params = {}) {
    const query = new URLSearchParams(params).toString();
    return api.get(`/knowledge-base/articles${query ? `?${query}` : ''}`);
  },

  getArticle(idOrSlug) {
    return api.get(`/knowledge-base/articles/${idOrSlug}`);
  },

  createArticle(article) {
    return api.post('/knowledge-base/articles', article);
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
  },

  updateArticle(id, article) {
    return api.put(`/knowledge-base/articles/${id}`, article);
  },

  rateArticle(id, helpful) {
    return api.post(`/knowledge-base/articles/${id}/rate`, { helpful });
  },

  deleteArticle(id) {
    return api.delete(`/knowledge-base/articles/${id}`);
  }
};
