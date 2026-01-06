const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorMiddleware');
const { notFound } = require('./middleware/errorMiddleware');
const { logger } = require('./utils/logger');

const app = express();

// ====================
// Middleware
// ====================

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { 
    stream: { write: message => logger.info(message.trim()) } 
  }));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ====================
// Routes
// ====================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const { sequelize } = require('./models');
    await sequelize.authenticate();
    res.json({ 
      status: 'Database connected successfully',
      database: sequelize.config.database,
      dialect: sequelize.config.dialect
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Database connection failed',
      message: error.message 
    });
  }
});

// API routes
const setupRoutes = require('./routes');
setupRoutes(app);

// ====================
// Error Handling
// ====================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;