import { api, toQueryString } from './api';

export const ticketService = {
  /**
   * Server-paginated ticket list.
   * @param {object} params page, pageSize, segment, q, status, priority, departmentId,
   *   assignedToId, ticketNumber, subject, requesterEmail, dateFrom, dateTo, hasSla, hasCsat,
   *   sortBy, sortOrder
   * @returns {Promise<{tickets: object[], pagination: object, segmentCounts: object}>}
   */
  async list(params = {}) {
    return api.get(`/tickets${toQueryString(params)}`);
  },

  // Same filters as list(); returns up to the server's export limit.
  async exportTickets(params = {}) {
    return api.get(`/tickets/export${toQueryString(params)}`);
  },

  async getOverview() {
    return api.get('/tickets/overview');
  },

  async getWorkload() {
    return api.get('/tickets/workload');
  },

  async getById(id) {
    return api.get(`/tickets/${id}`);
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
    const response = await api.rawFetch(`/tickets/${ticketId}/attachments`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  },

  async downloadAttachment(ticketId, attachmentId, filename) {
    const response = await api.rawFetch(`/tickets/${ticketId}/attachments/${attachmentId}`);
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
