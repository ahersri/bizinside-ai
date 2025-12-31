'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const sequelize = require('./config/database');
require('./models'); // Load models

// ======================= ROUTES =======================
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const dashboardRoutes = require('./routes/dashboard');
const businessRoutes = require('./routes/business');
const uploadRoutes = require('./routes/upload');
const salesRoutes = require('./routes/sales');
const productionRoutes = require('./routes/production');
const inventoryRoutes = require('./routes/inventory');
const financeRoutes = require('./routes/finance');
const aiRoutes = require('./routes/ai');

// ======================= ERROR HANDLER =======================
const { errorHandler } = require('./middleware/errorHandler');

const app = express(); // ✅ MUST BE FIRST

// ======================= SECURITY =======================
app.use(helmet());

// ======================= CORS (FIXED) =======================
const allowedOrigins = [
  'http://localhost:3000',
  'http://192.168.56.1:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server / Postman
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 🔥 REQUIRED FOR PREFLIGHT
app.options('*', cors());

// ======================= RATE LIMIT =======================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api', limiter);

// ======================= BODY PARSER =======================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ======================= LOGGER =======================
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
  next();
});

// ======================= TEST DB =======================
app.get('/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      success: true,
      message: 'MySQL connected',
      database: process.env.DB_NAME
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ======================= API ROUTES =======================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/ai', aiRoutes);

// ======================= ROOT =======================
app.get('/', (req, res) => {
  res.json({
    message: 'bizinside.ai API running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      dashboard: '/api/dashboard/overview',
      inventory: '/api/inventory/overview',
      finance: '/api/finance/profit-loss',
      ai: '/api/ai/analyze'
    }
  });
});

// ======================= HEALTH =======================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    database: 'MySQL'
  });
});

// ======================= 404 =======================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// ======================= ERROR HANDLER =======================
app.use(errorHandler);

// ======================= START SERVER =======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Test DB: http://localhost:${PORT}/test-db`);
  console.log(`✅ ALL MODULES LOADED`);
});
