import { API_BASE_URL } from '../utils/constants';

// The session lives in an httpOnly cookie set by the API; page scripts never see the token.
// Every request sends the cookie (credentials: 'include') plus X-Requested-With, which the
// API requires on state-changing cookie-authenticated requests (CSRF protection).
const CSRF_HEADER = { 'X-Requested-With': 'XMLHttpRequest' };

function signalSessionEnded() {
  const hadSession = Boolean(localStorage.getItem('user'));
  localStorage.removeItem('user');
  if (hadSession) window.dispatchEvent(new CustomEvent('auth:expired'));
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async validateToken() {
    try {
      const response = await this.get('/auth/profile');
      return response.success;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  // Headers for callers that build their own fetch (multipart uploads, downloads).
  getAuthHeader() {
    return { ...CSRF_HEADER };
  }

  /**
   * Low-level fetch with cookies and the anti-forgery header. Handles session expiry.
   * @returns {Promise<Response>}
   */
  async rawFetch(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: { ...CSRF_HEADER, ...options.headers }
    });
    if (response.status === 401 && endpoint !== '/auth/login') {
      signalSessionEnded();
      throw new Error('Your session has ended. Please login again.');
    }
    return response;
  }

  async request(endpoint, options = {}) {
    const isLoginEndpoint = endpoint === '/auth/login';
    try {
      const response = await this.rawFetch(endpoint, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers }
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : { success: response.ok, message: await response.text() };

      // Login failures return the server message to the caller instead of throwing.
      if (!response.ok && !data.success && !isLoginEndpoint) {
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

// Builds a query string, skipping empty values and joining arrays with commas.
export function toQueryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return;
    if (Array.isArray(value)) {
      if (value.length) search.set(key, value.join(','));
      return;
    }
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}
