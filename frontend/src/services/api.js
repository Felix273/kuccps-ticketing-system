import { API_BASE_URL } from '../utils/constants';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async validateToken() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }

      const response = await this.get('/auth/profile');
      return response.success;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async request(endpoint, options = {}) {
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login if not already on login page
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
        
        throw new Error('Authentication failed. Please login again.');
      }
      
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : {
            success: response.ok,
            message: await response.text()
          };
      
      // Check if response indicates failure
      if (!response.ok && !data.success) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
