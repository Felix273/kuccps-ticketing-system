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

  submitCsat(response) {
    return api.post('/operations/csat', response);
  }
};
