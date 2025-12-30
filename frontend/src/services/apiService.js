import { api } from '../utils/axiosConfig';
import config from '../config/config';

// Extended API service with all endpoints
export const apiService = {
  // ==================== AUTH ====================
  auth: {
    register: (businessData, ownerData) => 
      api.post('/auth/register', { business: businessData, owner: ownerData }),
    
    login: (email, password) => 
      api.post('/auth/login', { email, password }),
    
    getProfile: () => 
      api.get('/auth/me'),
    
    updateProfile: (data) => 
      api.put('/auth/update', data),
    
    updatePassword: (data) => 
      api.put('/auth/updatepassword', data),
    
    logout: () => {
      localStorage.removeItem(config.storageKeys.token);
      localStorage.removeItem(config.storageKeys.user);
      return Promise.resolve();
    },
  },
  
  // ==================== BUSINESS ====================
  business: {
    getBusiness: () => 
      api.get('/business'),
    
    updateBusiness: (data) => 
      api.put('/business', data),
    
    setupBusiness: (data) => 
      api.post('/business/setup', data),
    
    getSettings: () => 
      api.get('/business/settings'),
    
    updateSettings: (data) => 
      api.put('/business/settings', data),
  },
  
  // ==================== PRODUCTS ====================
  products: {
    getProducts: (params = {}) => 
      api.get('/products', { params }),
    
    getProduct: (id) => 
      api.get(`/products/${id}`),
    
    createProduct: (data) => 
      api.post('/products', data),
    
    updateProduct: (id, data) => 
      api.put(`/products/${id}`, data),
    
    deleteProduct: (id) => 
      api.delete(`/products/${id}`),
    
    getProductStats: () => 
      api.get('/products/stats/overview'),
    
    bulkImport: (file, onProgress) => 
      api.upload('/upload', file, 'products', onProgress),
    
    exportProducts: (format = 'csv') => 
      api.get(`/products/export?format=${format}`, { responseType: 'blob' }),
  },
  
  // ==================== SALES ====================
  sales: {
    getSales: (params = {}) => 
      api.get('/sales', { params }),
    
    getSale: (id) => 
      api.get(`/sales/${id}`),
    
    createSale: (data) => 
      api.post('/sales', data),
    
    updateSale: (id, data) => 
      api.put(`/sales/${id}`, data),
    
    deleteSale: (id) => 
      api.delete(`/sales/${id}`),
    
    getSalesStats: (period = 'month') => 
      api.get(`/sales/stats/overview?period=${period}`),
    
    getSalesTrend: (params = {}) => 
      api.get('/sales/trend', { params }),
    
    generateInvoice: (saleId) => 
      api.get(`/sales/${saleId}/invoice`, { responseType: 'blob' }),
  },
  
  // ==================== PRODUCTION ====================
  production: {
    getProductions: (params = {}) => 
      api.get('/production', { params }),
    
    getProduction: (id) => 
      api.get(`/production/${id}`),
    
    createProduction: (data) => 
      api.post('/production', data),
    
    updateProduction: (id, data) => 
      api.put(`/production/${id}`, data),
    
    deleteProduction: (id) => 
      api.delete(`/production/${id}`),
    
    getProductionStats: () => 
      api.get('/production/stats/overview'),
    
    getOEE: (params = {}) => 
      api.get('/production/oee', { params }),
    
    getMachineEfficiency: () => 
      api.get('/production/machine-efficiency'),
  },
  
  // ==================== INVENTORY ====================
  inventory: {
    getOverview: () => 
      api.get('/inventory/overview'),
    
    getTransactions: (params = {}) => 
      api.get('/inventory/transactions', { params }),
    
    createTransaction: (data) => 
      api.post('/inventory/transaction', data),
    
    getReorderSuggestions: () => 
      api.get('/inventory/reorder-suggestions'),
    
    getValuation: () => 
      api.get('/inventory/valuation'),
    
    getStockMovement: (params = {}) => 
      api.get('/inventory/stock-movement', { params }),
    
    adjustStock: (data) => 
      api.post('/inventory/adjust', data),
  },
  
  // ==================== FINANCE ====================
  finance: {
    getProfitLoss: (params = {}) => 
      api.get('/finance/profit-loss', { params }),
    
    getBalanceSheet: (params = {}) => 
      api.get('/finance/balance-sheet', { params }),
    
    getCashFlow: (params = {}) => 
      api.get('/finance/cash-flow', { params }),
    
    getFinancialStats: () => 
      api.get('/finance/stats'),
    
    getRevenueExpense: (params = {}) => 
      api.get('/finance/revenue-expense', { params }),
    
    exportFinancialReport: (type, format = 'pdf') => 
      api.get(`/finance/export/${type}?format=${format}`, { responseType: 'blob' }),
  },
  
  // ==================== AI INSIGHTS ====================
  ai: {
    analyzeBusiness: (data) => 
      api.post('/ai/analyze', data),
    
    predictSales: (params = {}) => 
      api.get('/ai/predict/sales', { params }),
    
    detectAnomalies: () => 
      api.get('/ai/detect-anomalies'),
    
    getRecommendations: () => 
      api.get('/ai/recommendations'),
    
    getBusinessHealth: () => 
      api.get('/ai/business-health'),
    
    forecastDemand: (params = {}) => 
      api.get('/ai/forecast/demand', { params }),
  },
  
  // ==================== DASHBOARD ====================
  dashboard: {
    getOverview: () => 
      api.get('/dashboard/overview'),
    
    getHealthScore: () => 
      api.get('/dashboard/health-score'),
    
    getKPIs: () => 
      api.get('/dashboard/kpis'),
    
    getRecentActivity: () => 
      api.get('/dashboard/recent-activity'),
  },
  
  // ==================== UPLOAD ====================
  upload: {
    uploadFile: (module, file, onProgress) => 
      api.upload('/upload', file, module, onProgress),
    
    getUploadHistory: () => 
      api.get('/upload/history'),
    
    deleteUpload: (id) => 
      api.delete(`/upload/${id}`),
  },
  
  // ==================== UTILS ====================
  utils: {
    getCountries: () => 
      api.get('/utils/countries'),
    
    getCurrencies: () => 
      api.get('/utils/currencies'),
    
    getTimezones: () => 
      api.get('/utils/timezones'),
    
    getIndustries: () => 
      api.get('/utils/industries'),
  },
};

// Export individual services for backward compatibility
export const authAPI = apiService.auth;
export const businessAPI = apiService.business;
export const productAPI = apiService.products;
export const salesAPI = apiService.sales;
export const productionAPI = apiService.production;
export const inventoryAPI = apiService.inventory;
export const financeAPI = apiService.finance;
export const aiAPI = apiService.ai;
export const dashboardAPI = apiService.dashboard;
export const uploadAPI = apiService.upload;

export default apiService;