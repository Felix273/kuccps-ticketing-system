import { api } from './api';

export const notificationService = {
  async getNotifications(unreadOnly = false) {
    return api.get(`/notifications?unreadOnly=${unreadOnly}`);
  },

  async markAsRead(notificationId) {
    return api.put(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead() {
    return api.put('/notifications/read/all');
  },

  async deleteNotification(notificationId) {
    return api.delete(`/notifications/${notificationId}`);
  },

  async getPreferences() {
    return api.get('/notifications/preferences');
  },

  async updatePreferences(preferences) {
    return api.put('/notifications/preferences', preferences);
  },

  async sendTestNotification() {
    return api.post('/notifications/test');
  }
};
