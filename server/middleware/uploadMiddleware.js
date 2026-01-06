const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const module = req.params.module || 'general';
    const moduleDir = path.join(uploadsDir, module);
    
    if (!fs.existsSync(moduleDir)) {
      fs.mkdirSync(moduleDir, { recursive: true });
    }
    
    cb(null, moduleDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'products': ['.csv', '.xlsx', '.xls'],
    'logo': ['.jpg', '.jpeg', '.png', '.gif'],
    'general': ['.csv', '.xlsx', '.xls', '.pdf', '.jpg', '.jpeg', '.png']
  };

  const module = req.params.module || 'general';
  const allowedExtensions = allowedTypes[module] || allowedTypes.general;
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`), false);
  }
};

// Create upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Max 5 files
  }
});

// Middleware functions
exports.uploadFile = (fieldName = 'file') => upload.single(fieldName);

exports.uploadMultiple = (fieldName = 'files', maxCount = 5) => 
  upload.array(fieldName, maxCount);

exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 10MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files. Maximum is 5 files'
      });
    }
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: err.message
    });
  }
  
  next(err);
};