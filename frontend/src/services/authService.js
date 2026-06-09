import { api } from './api';

export const authService = {
  async login(username, password) {
    const data = await api.post('/auth/login', { username, password });

    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  },

  async validateToken() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false };

      const response = await api.get('/auth/profile');
      return { success: response.success };
    } catch {
      return { success: false };
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};
