const config = {
  // API Configuration
  api: {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    timeout: 30000,
    uploadTimeout: 60000,
  },
  
  // Application Settings
  app: {
    name: 'bizinside.ai',
    version: '1.0.0',
    demoMode: process.env.REACT_APP_DEMO_MODE === 'true',
  },
  
  // Features Flags
  features: {
    aiInsights: true,
    realTimeUpdates: false, // Enable when WebSocket is implemented
    exportToPDF: true,
    exportToExcel: true,
    multiLanguage: false,
    darkMode: true,
  },
  
  // Chart Configuration
  charts: {
    colors: {
      primary: '#1976d2',
      secondary: '#dc004e',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3',
    },
    defaultOptions: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
      },
    },
  },
  
  // Pagination
  pagination: {
    defaultPageSize: 10,
    pageSizes: [10, 25, 50, 100],
  },
  
  // Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['.csv', '.xlsx', '.xls', '.pdf', '.jpg', '.jpeg', '.png'],
    maxFiles: 5,
  },
  
  // Local Storage Keys
  storageKeys: {
    token: 'bizinside_token',
    user: 'bizinside_user',
    business: 'bizinside_business',
    theme: 'bizinside_theme',
    language: 'bizinside_language',
  },
  
  // Date & Time Format
  dateTime: {
    displayFormat: 'DD/MM/YYYY',
    apiFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD/MM/YYYY HH:mm',
  },
  
  // Currency Configuration
  currency: {
    default: 'INR',
    symbol: '₹',
    formats: {
      INR: { symbol: '₹', decimal: 2, separator: ',' },
      USD: { symbol: '$', decimal: 2, separator: ',' },
      EUR: { symbol: '€', decimal: 2, separator: '.' },
    },
  },
};

// Helper functions
export const formatCurrency = (amount, currency = 'INR') => {
  const format = config.currency.formats[currency] || config.currency.formats.INR;
  return `${format.symbol}${amount.toFixed(format.decimal).replace(/\B(?=(\d{3})+(?!\d))/g, format.separator)}`;
};

export const formatDate = (date, format = 'display') => {
  const dateObj = new Date(date);
  const formats = {
    display: config.dateTime.displayFormat,
    api: config.dateTime.apiFormat,
    time: config.dateTime.timeFormat,
    datetime: config.dateTime.dateTimeFormat,
  };
  
  const selectedFormat = formats[format] || format;
  
  // Simple date formatting (for production, use date-fns or moment.js)
  if (selectedFormat === 'DD/MM/YYYY') {
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  return dateObj.toLocaleDateString();
};

export default config;