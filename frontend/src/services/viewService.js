import { api } from './api';

export const viewService = {
  getAll(entity = 'tickets') {
    return api.get(`/views?entity=${encodeURIComponent(entity)}`);
  },

  create(view) {
    return api.post('/views', view);
  },

  update(id, view) {
    return api.put(`/views/${id}`, view);
  },

  delete(id) {
    return api.delete(`/views/${id}`);
  }
};
