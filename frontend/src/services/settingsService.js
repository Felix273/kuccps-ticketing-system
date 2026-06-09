import { api } from './api';

export const settingsService = {
  // System Settings
  getSystemSettings: async () => {
    return await api.get('/settings/');
  },

  updateSystemSettings: async (settingsData) => {
    return await api.put('/settings/', settingsData);
  },

  getPublicSettings: async () => {
    return await api.get('/settings/public');
  },

  // Email Templates
  getEmailTemplates: async () => {
    return await api.get('/settings/email-templates');
  },

  getEmailTemplate: async (type) => {
    return await api.get(`/settings/email-templates/${type}`);
  },

  createEmailTemplate: async (templateData) => {
    return await api.post('/settings/email-templates', templateData);
  },

  updateEmailTemplate: async (type, templateData) => {
    return await api.put(`/settings/email-templates/${type}`, templateData);
  },

  deleteEmailTemplate: async (type) => {
    return await api.delete(`/settings/email-templates/${type}`);
  },

  resetEmailTemplatesToDefault: async () => {
    return await api.post('/settings/email-templates/reset');
  }
};