import { api } from './api';

export const formService = {
  getForms(params = {}) {
    const query = new URLSearchParams(params).toString();
    return api.get(`/forms${query ? `?${query}` : ''}`);
  },

  createForm(form) {
    return api.post('/forms', form);
  },

  updateForm(id, form) {
    return api.put(`/forms/${id}`, form);
  },

  deleteForm(id) {
    return api.delete(`/forms/${id}`);
  }
};
