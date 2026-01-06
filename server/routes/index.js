const express = require('express');
const { logger } = require('../utils/logger');

const setupRoutes = (app) => {
  // Create routers
  const authRouter = express.Router();
  const productsRouter = express.Router();
  const businessRouter = express.Router();

  // ====================
  // AUTH ROUTES
  // ====================
  
  // Register endpoint
  authRouter.post('/register', (req, res) => {
    logger.info('Register attempt', { email: req.body.owner?.email });
    
    // Validation
    if (!req.body.business || !req.body.owner) {
      return res.status(400).json({
        success: false,
        error: 'Business and owner data required'
      });
    }

    // Mock successful registration
    res.status(201).json({
      success: true,
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: 1,
          full_name: req.body.owner.full_name,
          email: req.body.owner.email,
          role: 'Owner',
          business_name: req.body.business.business_name
        },
        business: {
          id: 1,
          business_name: req.body.business.business_name,
          business_type: req.body.business.business_type || 'MSME',
          industry: req.body.business.industry || 'Manufacturing'
        }
      },
      message: 'Registration successful'
    });
  });

  // Login endpoint
  authRouter.post('/login', (req, res) => {
    const { email, password } = req.body;
    logger.info('Login attempt', { email });
    
    // Mock login - accept any credentials
    res.json({
      success: true,
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: 1,
          full_name: 'Test User',
          email: email,
          role: 'Owner',
          business_name: 'Test Business'
        }
      },
      message: 'Login successful'
    });
  });

  // Get profile
  authRouter.get('/me', (req, res) => {
    res.json({
      success: true,
      data: {
        user: {
          id: 1,
          full_name: 'Test User',
          email: 'test@example.com',
          role: 'Owner',
          business_name: 'Test Business',
          business_type: 'MSME'
        }
      }
    });
  });

  // Update profile
  authRouter.put('/update', (req, res) => {
    res.json({
      success: true,
      data: { user: req.body },
      message: 'Profile updated successfully'
    });
  });

  // ====================
  // PRODUCTS ROUTES
  // ====================
  
  productsRouter.get('/', (req, res) => {
    res.json({
      success: true,
      data: {
        products: [
          {
            id: 1,
            product_code: 'PROD-001',
            product_name: 'Steel Bolts 10mm',
            category: 'Fasteners',
            unit: 'PCS',
            selling_price: 12.00,
            cost_price: 9.00,
            current_stock: 500,
            min_stock_level: 100
          },
          {
            id: 2,
            product_code: 'PROD-002',
            product_name: 'Aluminum Sheet',
            category: 'Raw Material',
            unit: 'KG',
            selling_price: 350.00,
            cost_price: 325.00,
            current_stock: 200,
            min_stock_level: 50
          }
        ],
        pagination: {
          total: 2,
          page: 1,
          pages: 1,
          limit: 10
        }
      }
    });
  });

  productsRouter.post('/', (req, res) => {
    logger.info('Creating product', req.body);
    res.status(201).json({
      success: true,
      data: {
        product: {
          id: Date.now(),
          ...req.body,
          created_at: new Date().toISOString()
        }
      },
      message: 'Product created successfully'
    });
  });

  // ====================
  // BUSINESS ROUTES
  // ====================
  
  businessRouter.get('/', (req, res) => {
    res.json({
      success: true,
      data: {
        business: {
          id: 1,
          business_name: 'Test Manufacturing Ltd.',
          business_email: 'test@manufacturing.com',
          business_type: 'MSME',
          industry: 'Manufacturing',
          country: 'India',
          state: 'Maharashtra',
          city: 'Mumbai'
        }
      }
    });
  });

  businessRouter.put('/', (req, res) => {
    logger.info('Updating business', req.body);
    res.json({
      success: true,
      data: {
        business: {
          id: 1,
          ...req.body,
          updated_at: new Date().toISOString()
        }
      },
      message: 'Business updated successfully'
    });
  });

  // ====================
// SALES ROUTES
// ====================
const salesRouter = express.Router();

salesRouter.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      sales: [
        {
          id: 1,
          customer_name: 'ABC Industries',
          product_id: 1,
          quantity: 100,
          unit_price: 12.00,
          total_amount: 1200.00,
          sale_date: '2024-01-15',
          payment_status: 'Paid'
        }
      ]
    }
  });
});

salesRouter.post('/', (req, res) => {
  res.status(201).json({
    success: true,
    data: {
      sale: {
        id: Date.now(),
        ...req.body,
        created_at: new Date().toISOString()
      }
    },
    message: 'Sale created successfully'
  });
});

// ====================
// DASHBOARD ROUTES
// ====================
const dashboardRouter = express.Router();

dashboardRouter.get('/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      summary: {
        total_products: 15,
        total_sales: 250000,
        total_production: 5000,
        low_stock_products: 3
      },
      recent_sales: [
        { customer_name: 'ABC Corp', total_amount: 50000, payment_status: 'Paid' },
        { customer_name: 'XYZ Ltd', total_amount: 75000, payment_status: 'Pending' }
      ],
      recent_production: [
        { product_name: 'Steel Bolts', actual_quantity: 1000, efficiency: 95 },
        { product_name: 'Aluminum Sheets', actual_quantity: 500, efficiency: 92 }
      ]
    }
  });
});

dashboardRouter.get('/health-score', (req, res) => {
  res.json({
    success: true,
    data: {
      overall_score: 85,
      health_status: 'Healthy',
      factors: [
        { name: 'Inventory Turnover', score: 80 },
        { name: 'Profit Margin', score: 90 },
        { name: 'Cash Flow', score: 75 }
      ],
      timestamp: new Date().toISOString()
    }
  });
});

// Mount additional routes
app.use('/api/sales', salesRouter);
app.use('/api/dashboard', dashboardRouter);

  // ====================
  // MOUNT ROUTES
  // ====================
  
  app.use('/api/auth', authRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/business', businessRouter);

  // API documentation
  app.get('/api', (req, res) => {
    res.json({
      message: 'BizInside.ai API',
      version: '1.0.0',
      endpoints: [
        'POST   /api/auth/register - Register business and owner',
        'POST   /api/auth/login - Login user',
        'GET    /api/auth/me - Get user profile',
        'PUT    /api/auth/update - Update profile',
        'GET    /api/products - List products',
        'POST   /api/products - Create product',
        'GET    /api/sales - List sales',
        'POST   /api/sales - Create sale',
        'GET    /api/dashboard/overview - Dashboard data',
        'GET    /api/dashboard/health-score - Business health',
        'GET    /api/business - Get business info',
        'PUT    /api/business - Update business'
      ]
    });
  });

  logger.info('✅ Routes loaded successfully');
};

module.exports = setupRoutes;