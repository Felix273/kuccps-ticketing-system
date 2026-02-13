import { api } from './api';

export const userService = {
  async getAll(role) {
    const query = role ? `?role=${role}` : '';
    return api.get(`/users${query}`);
  },

  async create(user) {
    return api.post('/users', user);
  },

  async update(id, user) {
    return api.put(`/users/${id}`, user);
  },

  async delete(id) {
    return api.delete(`/users/${id}`);
  }
};
