import { api } from './api';

export const ticketService = {
  async getAll() {
    return api.get('/tickets');
  },

  async getById(id) {
    return api.get(`/tickets/${id}`);
  },

  async create(ticket) {
    return api.post('/tickets', ticket);
  },

  async update(id, ticket) {
    return api.put(`/tickets/${id}`, ticket);
  },

  async updateStatus(id, status) {
    return api.put(`/tickets/${id}/status`, { status });
  },

  async delete(id) {
    return api.delete(`/tickets/${id}`);
  },

  async getStatistics() {
    return api.get('/tickets/statistics');
  },

  async assign(ticketId, userId) {
    return api.put(`/tickets/${ticketId}/assign`, { assignedToId: userId });
  },

  async addComment(ticketId, comment) {
    return api.post(`/tickets/${ticketId}/comments`, comment);
  }
};
