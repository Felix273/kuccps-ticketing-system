import { api } from './api';

export const statusIssueService = {
  getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    return api.get(`/status-issues${query ? `?${query}` : ''}`);
  },

  create(issue) {
    return api.post('/status-issues', issue);
  },

  update(id, issue) {
    return api.put(`/status-issues/${id}`, issue);
  },

  addUpdate(id, update) {
    return api.post(`/status-issues/${id}/updates`, update);
  }
};
