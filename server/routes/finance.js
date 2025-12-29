const express = require('express');
const router = express.Router();
const {
  getProfitLoss,
  getBalanceSheet,
  getCashFlow,
  generateReport
} = require('../controllers/financeController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Financial reports - only for Owner, Admin, Accountant
router.get('/profit-loss', authorize('Owner', 'Admin', 'Accountant'), getProfitLoss);
router.get('/balance-sheet', authorize('Owner', 'Admin', 'Accountant'), getBalanceSheet);
router.get('/cash-flow', authorize('Owner', 'Admin', 'Accountant'), getCashFlow);

// Generate comprehensive report
router.post('/generate-report', authorize('Owner', 'Admin', 'Accountant'), generateReport);

// Additional finance endpoints can be added here:
// router.get('/gst-summary', authorize('Owner', 'Admin', 'Accountant'), getGSTSummary);
// router.get('/expense-breakdown', authorize('Owner', 'Admin', 'Accountant'), getExpenseBreakdown);

module.exports = router;