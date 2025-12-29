const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductStats
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Product routes
router.post('/', authorize('Owner', 'Admin', 'Manager'), createProduct);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.put('/:id', authorize('Owner', 'Admin', 'Manager'), updateProduct);
router.delete('/:id', authorize('Owner', 'Admin'), deleteProduct);

// Statistics
router.get('/stats/overview', getProductStats);

module.exports = router;