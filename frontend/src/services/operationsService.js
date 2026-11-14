import { api } from './api';

export const operationsService = {
  getDashboardAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return api.get(`/operations/dashboard${query ? `?${query}` : ''}`);
  },

  getSlaPolicies() {
    return api.get('/operations/sla-policies');
  },

  createSlaPolicy(policy) {
    return api.post('/operations/sla-policies', policy);
  },

  updateSlaPolicy(id, policy) {
    return api.put(`/operations/sla-policies/${id}`, policy);
  },

  getSlaTimelines() {
    return api.get('/operations/sla-timelines');
  },

  updateSlaTimelines(payload) {
    return api.put('/operations/sla-timelines', payload);
  },

  resetSlaTimelines() {
    return api.post('/operations/sla-timelines/reset');
  },

  submitCsat(response) {
    return api.post('/operations/csat', response);
  },

  getPublicCsat(token) {
    const query = new URLSearchParams({ token }).toString();
    return api.get(`/operations/csat/public?${query}`);
  },

  submitPublicCsat(token, comment) {
    return api.post('/operations/csat/public', { token, comment });
  }
};
