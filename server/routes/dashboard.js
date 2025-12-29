const express = require('express');
const router = express.Router();
const {
  getDashboardOverview,
  getSalesAnalytics,
  getProductionAnalytics,
  getBusinessHealthScore
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Dashboard routes
router.get('/overview', getDashboardOverview);
router.get('/sales-analytics', getSalesAnalytics);
router.get('/production-analytics', getProductionAnalytics);
router.get('/health-score', authorize('Owner', 'Admin'), getBusinessHealthScore);

module.exports = router;