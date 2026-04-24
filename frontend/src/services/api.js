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

  // ── Roles & Permissions ───────────────────────────────────────────────────
  getRoles: () => fetch(`${API_BASE}/roles`, { headers: getAuthHeaders() }).then(handleResponse),
  getPermissions: () => fetch(`${API_BASE}/roles/permissions`, { headers: getAuthHeaders() }).then(handleResponse),
  createRole: (role) => fetch(`${API_BASE}/roles`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(role)
  }).then(handleResponse),
  assignPermissions: (roleId, permissionIds) => fetch(`${API_BASE}/roles/${roleId}/permissions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(permissionIds)
  }).then(handleResponse),
  deleteRole: (id) => fetch(`${API_BASE}/roles/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  }).then(handleResponse),

  // ── Permissions ────────────────────────────────────────────────────────────
  createPermission: (permission) => fetch(`${API_BASE}/permissions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(permission)
  }).then(handleResponse),
  deletePermission: (id) => fetch(`${API_BASE}/permissions/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  }).then(handleResponse),

  // ── User Management ────────────────────────────────────────────────────────
  getUsers: () => fetch(`${API_BASE}/users`, { headers: getAuthHeaders() }).then(handleResponse),
  assignUserRoles: (userId, roleIds) => fetch(`${API_BASE}/users/${userId}/roles`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(roleIds)
  }).then(handleResponse),

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
    localStorage.setItem('user', JSON.stringify({ 
      email: data.email, 
      fullName: data.fullName,
      role: data.role // Save the role
    }));
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};

// Helper for authenticated requests
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}
