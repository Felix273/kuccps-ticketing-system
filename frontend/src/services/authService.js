import { api } from './api';

// Only the non-secret user profile is kept in localStorage (for the UI shell).
// The session itself is an httpOnly cookie managed by the API.
export const authService = {
  async login(username, password) {
    const data = await api.post('/auth/login', { username, password });

    if (data.success) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  },

  // Confirms the cookie session with the server and refreshes the cached profile.
  async validateSession() {
    try {
      const response = await api.get('/auth/profile');
      if (response.success && response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        return { success: true, user: response.user };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  },

  logout() {
    // Revoke the session server-side and clear the cookie (best effort).
    api.post('/auth/logout', {}).catch(() => {});
    localStorage.removeItem('user');
    // Remove any token left by older versions of the app.
    localStorage.removeItem('token');
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem('user'));
  }
};
