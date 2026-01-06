const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const { FileUpload } = require('../models/Upload');
const { AppError } = require('../middleware/errorMiddleware');

// ==============================
// MULTER CONFIG
// ==============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${req.user.business_id}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/json'
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new AppError('Invalid file type', 400));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ==============================
// POST: UPLOAD FILE
// ==============================
router.post(
  '/:module',
  protect,
  authorize('Owner', 'Admin', 'Manager'),
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return next(new AppError('No file uploaded', 400));
      }

      const { module } = req.params;
      const allowedModules = ['products', 'production', 'sales', 'inventory'];

      if (!allowedModules.includes(module)) {
        return next(new AppError('Invalid module', 400));
      }

      await FileUpload.create({
        business_id: req.user.business_id,
        user_id: req.user.id,
        filename: req.file.filename,
        file_type: req.file.mimetype,
        module,
        status: 'Completed'
      });

      res.status(201).json({
        success: true,
        message: 'File uploaded & saved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==============================
// GET: UPLOAD HISTORY
// ==============================
router.get('/history', protect, async (req, res, next) => {
  try {
    const uploads = await FileUpload.findAll({
      where: { business_id: req.user.business_id },
      order: [['uploaded_at', 'DESC']]
    });

    res.json({
      success: true,
      data: uploads
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
