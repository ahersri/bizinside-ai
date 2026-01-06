import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// ============================
// AXIOS INSTANCE
// ============================
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ============================
// REQUEST INTERCEPTOR
// ============================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================
// RESPONSE INTERCEPTOR
// ============================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================
// AUTH APIs
// ============================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update', data),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
};

// ============================
// PRODUCT APIs (SINGLE SOURCE OF TRUTH)
// ============================
export const productAPI = {
  // CRUD
  getProducts: (params = {}) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),

  // Stats
  getProductStats: () => api.get('/products/stats/overview'),

  // Import (CSV / XLSX + optional mapping)
  importProducts: (file, mapping = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (mapping) formData.append('mapping', JSON.stringify(mapping));

    return api.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Export
  exportProducts: () =>
    api.get('/products/export', { responseType: 'blob' }),

  // Bulk
  bulkUpdate: (ids, updates) =>
    api.post('/products/bulk-update', { ids, updates }),

  bulkDelete: (ids) =>
    api.post('/products/bulk-delete', { ids }),

  // Stock
  adjustStock: (data) =>
    api.post('/products/adjust-stock', data),

  undoStock: (id) =>
    api.post(`/products/stock-undo/${id}`),

  getStockLogs: () =>
    api.get('/products/stock-logs'),
};

// ============================
// SALES APIs
// ============================
export const salesAPI = {
  getSales: (params) => api.get('/sales', { params }),
  createSale: (data) => api.post('/sales', data),
  getSalesStats: () => api.get('/sales/stats/overview'),
};

// ============================
// PRODUCTION APIs
// ============================
export const productionAPI = {
  getProductions: (params) => api.get('/production', { params }),
  createProduction: (data) => api.post('/production', data),
  getProductionStats: () => api.get('/production/stats/overview'),
  getOEE: (params) => api.get('/production/oee', { params }),
};

// ============================
// INVENTORY APIs
// ============================
export const inventoryAPI = {
  getOverview: () => api.get('/inventory/overview'),
  createTransaction: (data) => api.post('/inventory/transaction', data),
  getTransactions: (params) => api.get('/inventory/transactions', { params }),
  getReorderSuggestions: () => api.get('/inventory/reorder-suggestions'),
};

// ============================
// FINANCE APIs
// ============================
export const financeAPI = {
  getProfitLoss: (params) => api.get('/finance/profit-loss', { params }),
  getBalanceSheet: (params) => api.get('/finance/balance-sheet', { params }),
  getCashFlow: (params) => api.get('/finance/cash-flow', { params }),
};

// ============================
// AI APIs
// ============================
export const aiAPI = {
  analyzeBusiness: (data) => api.post('/ai/analyze', data),
  predictSales: (params) => api.get('/ai/predict/sales', { params }),
  detectAnomalies: () => api.get('/ai/detect-anomalies'),
};

// ============================
// DASHBOARD APIs
// ============================
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getHealthScore: () => api.get('/dashboard/health-score'),
};

// ============================
// BUSINESS APIs
// ============================
export const businessAPI = {
  getBusiness: () => api.get('/business'),
  updateBusiness: (data) => api.put('/business', data),
  setupBusiness: (data) => api.post('/business/setup', data),
};

// ============================
// UPLOAD APIs
// ============================
export const uploadAPI = {
  uploadFile: (module, file) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(`/upload/${module}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
