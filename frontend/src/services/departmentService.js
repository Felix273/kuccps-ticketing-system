import { api } from './api';

export const departmentService = {
  async getAll() {
    return api.get('/departments');
  },

  async create(department) {
    return api.post('/departments', department);
  },

  async update(id, department) {
    return api.put(`/departments/${String(id)}`, department);
  },

  async delete(id) {
    return api.delete(`/departments/${String(id)}`);
  }
};
