const express = require('express');
const router = express.Router();
const {
  analyzeBusiness,
  getInsight,
  predictSales,
  detectAnomalies
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// General AI analysis
router.post('/analyze', analyzeBusiness);

// Specific insights
router.get('/insights/:type', getInsight);

// Sales prediction
router.get('/predict/sales', authorize('Owner', 'Admin', 'Manager'), predictSales);

// Anomaly detection
router.get('/detect-anomalies', authorize('Owner', 'Admin'), detectAnomalies);

// Additional AI endpoints can be added here:
// router.post('/what-if-analysis', authorize('Owner', 'Admin'), whatIfAnalysis);
// router.get('/optimization-suggestions', authorize('Owner', 'Admin'), getOptimizationSuggestions);

module.exports = router;