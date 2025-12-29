const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.business_id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/json'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel, CSV, and JSON files are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// @desc    Upload file
// @route   POST /api/upload/:module
// @access  Private (Owner, Admin, Manager)
router.post('/:module', protect, authorize('Owner', 'Admin', 'Manager'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { module } = req.params;
    const allowedModules = ['products', 'production', 'sales', 'inventory'];

    if (!allowedModules.includes(module)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid module. Allowed: products, production, sales, inventory'
      });
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        module: module
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get upload history
// @route   GET /api/upload/history
// @access  Private
router.get('/history', protect, async (req, res, next) => {
  try {
    const uploadDir = 'uploads/';
    let files = [];
    
    if (fs.existsSync(uploadDir)) {
      files = fs.readdirSync(uploadDir)
        .filter(file => file.startsWith(`${req.user.business_id}-`))
        .map(file => ({
          filename: file,
          path: path.join(uploadDir, file),
          uploaded: fs.statSync(path.join(uploadDir, file)).mtime
        }));
    }

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;