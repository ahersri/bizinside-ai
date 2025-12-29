const express = require('express');
const router = express.Router();
const {
  createProduction,
  getProductions,
  getProduction,
  updateProduction,
  deleteProduction,
  getProductionStats,
  getOEE
} = require('../controllers/productionController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Production routes
router.post('/', authorize('Owner', 'Admin', 'Manager'), createProduction);
router.get('/', getProductions);
router.get('/stats/overview', getProductionStats);
router.get('/oee', getOEE);
router.get('/:id', getProduction);
router.put('/:id', authorize('Owner', 'Admin', 'Manager'), updateProduction);
router.delete('/:id', authorize('Owner', 'Admin'), deleteProduction);

module.exports = router;