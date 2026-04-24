const API_BASE = 'http://localhost:5270/api';

// Helper to handle the new ApiResponse wrapper format
async function handleResponse(response) {
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || 'An error occurred');
  }
  return json.data; // Return the actual payload
}

export const api = {
  // --- Auth ---
  async register(fullName, email, password) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password }),
    });
    return handleResponse(response);
  },

  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  // --- Categories ---
  async getCategories() {
    const response = await fetch(`${API_BASE}/categories`);
    return handleResponse(response);
  },

  async getActiveCategories() {
    const response = await fetch(`${API_BASE}/categories/active`);
    return handleResponse(response);
  },

  // --- Parts ---
  async getAllParts() {
    const response = await fetch(`${API_BASE}/parts`);
    return handleResponse(response);
  },
  
  async searchParts(keyword) {
    const response = await fetch(`${API_BASE}/parts/search?keyword=${encodeURIComponent(keyword)}`);
    return handleResponse(response);
  },

  // --- Utility ---
  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  saveAuth(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ email: data.email, fullName: data.fullName }));
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};
