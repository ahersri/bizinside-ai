const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { uploadFile, handleUploadError } = require('../middleware/uploadMiddleware');

// ======================================================
// AUTH (ALL PRODUCT ROUTES REQUIRE LOGIN)
// ======================================================
router.use(authenticate);

// ======================================================
// CREATE
// ======================================================
router.post(
  '/',
  authorize('Owner', 'Admin', 'Manager'),
  asyncHandler(productController.createProduct)
);

// ======================================================
// READ (LIST + STATS)
// ======================================================
router.get('/', asyncHandler(productController.getProducts));

router.get(
  '/stats/overview',
  asyncHandler(productController.getProductStats)
);

// ======================================================
// IMPORT / EXPORT (STATIC ROUTES → BEFORE :id)
// ======================================================
router.post(
  '/import',
  authorize('Owner', 'Admin'),
  uploadFile('file'),
  handleUploadError,
  asyncHandler(productController.importProducts)
);

router.get(
  '/export',
  authorize('Owner', 'Admin', 'Manager'),
  asyncHandler(productController.exportProducts)
);

// ======================================================
// BULK OPERATIONS
// ======================================================
router.post(
  '/bulk-update',
  authorize('Owner', 'Admin'),
  asyncHandler(productController.bulkUpdateProducts)
);

router.post(
  '/bulk-delete',
  authorize('Owner', 'Admin'),
  asyncHandler(productController.bulkDeleteProducts)
);

// ======================================================
// STOCK MANAGEMENT
// ======================================================
router.post(
  '/stock-adjust',
  authorize('Owner', 'Admin', 'Manager'),
  asyncHandler(productController.adjustStock)
);

router.post(
  '/stock-undo/:id',
  authorize('Owner', 'Admin'),
  asyncHandler(productController.undoStock)
);

router.get(
  '/stock-logs',
  authorize('Owner', 'Admin'),
  asyncHandler(productController.getStockLogs)
);

// ======================================================
// SINGLE PRODUCT (⚠️ ALWAYS LAST)
// ======================================================
router.get(
  '/:id',
  asyncHandler(productController.getProduct)
);

router.put(
  '/:id',
  authorize('Owner', 'Admin', 'Manager'),
  asyncHandler(productController.updateProduct)
);

router.delete(
  '/:id',
  authorize('Owner', 'Admin'),
  asyncHandler(productController.deleteProduct)
);

module.exports = router;
