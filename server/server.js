const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const sequelize = require('./config/database');
require('./models'); // Load models

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const dashboardRoutes = require('./routes/dashboard');
const businessRoutes = require('./routes/business');
const uploadRoutes = require('./routes/upload');
const salesRoutes = require('./routes/sales');
const productionRoutes = require('./routes/production');
// Add these imports after other route imports
const inventoryRoutes = require('./routes/inventory');
const financeRoutes = require('./routes/finance');
const aiRoutes = require('./routes/ai');

// Import error handler
const { errorHandler } = require('./middleware/errorHandler');

const app = express(); // ✅ DECLARE APP FIRST

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      success: true,
      message: 'MySQL database connected successfully',
      database: process.env.DB_NAME,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'MySQL connection failed',
      details: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sales', salesRoutes); // ✅ ADD SALES ROUTES
app.use('/api/production', productionRoutes); // ✅ ADD PRODUCTION ROUTES
app.use('/api/inventory', inventoryRoutes);      // Add this
app.use('/api/finance', financeRoutes);          // Add this
app.use('/api/ai', aiRoutes);                    // Add this

// Base route
app.get('/', (req, res) => {
  res.json({ 
    message: 'bizinside.ai API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      test_db: '/test-db',
      register: '/api/auth/register (POST)',
      login: '/api/auth/login (POST)',
      get_profile: '/api/auth/me (GET)',
      products: '/api/products (GET/POST)',
      dashboard: '/api/dashboard/overview (GET)',
      business: '/api/business/setup (POST)',
      sales: '/api/sales (GET/POST)',
      production: '/api/production (GET/POST)',
      inventory: '/api/inventory/overview (GET)',
      finance: '/api/finance/profit-loss (GET)',
      ai: '/api/ai/analyze (POST)'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'bizinside.ai API',
    database: 'MySQL',
    uptime: process.uptime()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: MySQL (${process.env.DB_NAME})`);
  console.log(`👤 User: ${process.env.DB_USER}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Test DB: http://localhost:${PORT}/test-db`);
  console.log(`👤 Auth: http://localhost:${PORT}/api/auth/register`);
  console.log(`🏭 Products: http://localhost:${PORT}/api/products`);
  console.log(`📈 Dashboard: http://localhost:${PORT}/api/dashboard/overview`);
  console.log(`💰 Sales: http://localhost:${PORT}/api/sales`);
  console.log(`🏭 Production: http://localhost:${PORT}/api/production`);
  console.log(`📦 Inventory: http://localhost:${PORT}/api/inventory/overview`);
  console.log(`💰 Finance: http://localhost:${PORT}/api/finance/profit-loss`);
  console.log(`🧠 AI Insights: http://localhost:${PORT}/api/ai/analyze`);
  console.log(`📁 Upload: http://localhost:${PORT}/api/upload/products`);
  console.log(`🏢 Business: http://localhost:${PORT}/api/business`);
  console.log(`\n✅ ALL 11 MODULES LOADED SUCCESSFULLY!`);
});