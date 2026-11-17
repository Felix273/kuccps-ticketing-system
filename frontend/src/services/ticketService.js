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
    return api.put(`/tickets/${id}`, { status });
  },

  async startWorking(id, userId) {
    return api.put(`/tickets/${id}`, { status: 'InProgress', assignedToId: userId });
  },
  
  async delete(id) {
    return api.delete(`/tickets/${id}`);
  },
  
  async getStatistics() {
    return api.get('/tickets/statistics');
  },
  
  async assign(ticketId, userId) {
    return api.put(`/tickets/${ticketId}`, { assignedToId: userId });
  },

  async escalate(ticketId, escalation) {
    return api.post(`/tickets/${ticketId}/escalate`, escalation);
  },
  
  async addComment(ticketId, comment) {
    return api.post(`/tickets/${ticketId}/comments`, comment);
  },

  async addAttachment(ticketId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${api.baseURL}/tickets/${ticketId}/attachments`, {
      method: 'POST',
      headers: {
        ...api.getAuthHeader()
      },
      body: formData
    });
    return response.json();
  },

  async downloadAttachment(ticketId, attachmentId, filename) {
    const response = await fetch(`${api.baseURL}/tickets/${ticketId}/attachments/${attachmentId}`, {
      headers: api.getAuthHeader()
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/') window.location.href = '/';
      throw new Error('Authentication failed. Please login again.');
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `Download failed with status ${response.status}`);
    }

    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};
