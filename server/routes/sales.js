const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSale,
  updateSale,
  deleteSale,
  getSalesStats,
  updatePaymentStatus
} = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Sale routes
router.post('/', authorize('Owner', 'Admin', 'Manager'), createSale);
router.get('/', getSales);
router.get('/stats/overview', getSalesStats);
router.get('/:id', getSale);
router.put('/:id', authorize('Owner', 'Admin', 'Manager'), updateSale);
router.delete('/:id', authorize('Owner', 'Admin'), deleteSale);
router.put('/:id/payment', authorize('Owner', 'Admin', 'Manager', 'Accountant'), updatePaymentStatus);

module.exports = router;