const express = require('express');
const router = express.Router();
const {
  getInventoryOverview,
  createTransaction,
  getTransactions,
  getStockMovement,
  getReorderSuggestions,
  updateMinStockLevel
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Inventory overview
router.get('/overview', getInventoryOverview);

// Inventory transactions
router.post('/transaction', authorize('Owner', 'Admin', 'Manager'), createTransaction);
router.get('/transactions', getTransactions);

// Stock movement analysis
router.get('/movement', getStockMovement);

// Reorder suggestions
router.get('/reorder-suggestions', authorize('Owner', 'Admin', 'Manager'), getReorderSuggestions);

// Update minimum stock level
router.put('/min-stock/:product_id', authorize('Owner', 'Admin', 'Manager'), updateMinStockLevel);

module.exports = router;