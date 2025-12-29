const multer = require('multer');
const xlsx = require('xlsx');
const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.UPLOAD_PATH || './uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `${req.user.business_id}-${uniqueSuffix}-${file.originalname}`)
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/vnd.ms-excel' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'text/csv') {
    cb(null, true);
  } else {
    cb(new AppError('Please upload only Excel or CSV files', 400), false);
  }
};

exports.upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880
  }
});

// Process Excel/CSV upload
exports.processUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Please upload a file', 400);
    }

    const { module, mapping } = req.body;
    const filePath = req.file.path;

    // Log upload
    const uploadLog = await query(
      `INSERT INTO file_uploads (business_id, user_id, filename, file_type, module, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        req.user.business_id,
        req.user.id,
        req.file.originalname,
        req.file.mimetype,
        module || 'Unknown',
        'Processing'
      ]
    );

    const uploadId = uploadLog.rows[0].id;

    // Process based on file type
    let data;
    if (req.file.mimetype.includes('excel') || req.file.mimetype.includes('spreadsheet')) {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else if (req.file.mimetype.includes('csv')) {
      // CSV processing would go here
      data = []; // Placeholder
    }

    // Validate data
    const validationResult = validateData(data, module, mapping);
    
    if (!validationResult.valid) {
      await query(
        'UPDATE file_uploads SET status = $1, error_message = $2 WHERE id = $3',
        ['Failed', validationResult.errors.join(', '), uploadId]
      );
      
      throw new AppError(`Data validation failed: ${validationResult.errors.join(', ')}`, 400);
    }

    // Save to database based on module
    const saveResult = await saveDataToModule(data, module, req.user.business_id);

    // Update upload log
    await query(
      'UPDATE file_uploads SET status = $1, row_count = $2 WHERE id = $3',
      ['Completed', saveResult.rowCount, uploadId]
    );

    res.status(200).json({
      success: true,
      message: `Successfully imported ${saveResult.rowCount} records`,
      data: {
        upload_id: uploadId,
        rows_processed: saveResult.rowCount,
        sample_data: data.slice(0, 3) // Return first 3 rows as sample
      }
    });

  } catch (error) {
    next(error);
  }
};

// Helper function to validate data
function validateData(data, module, mapping) {
  const errors = [];
  
  if (!data || data.length === 0) {
    errors.push('File is empty or cannot be parsed');
    return { valid: false, errors };
  }

  // Check required columns based on module
  const requiredColumns = {
    'products': ['product_code', 'product_name'],
    'production': ['product_code', 'quantity', 'date'],
    'sales': ['product_code', 'quantity', 'unit_price', 'date'],
    'inventory': ['product_code', 'quantity', 'transaction_type']
  };

  if (requiredColumns[module]) {
    const firstRow = data[0];
    const missingColumns = requiredColumns[module].filter(col => !firstRow.hasOwnProperty(col));
    
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Helper function to save data
async function saveDataToModule(data, module, businessId) {
  let rowCount = 0;

  switch (module) {
    case 'products':
      for (const row of data) {
        await query(
          `INSERT INTO products (
            business_id, product_code, product_name, category, 
            unit, raw_material_cost, selling_price, min_stock_level
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (business_id, product_code) 
          DO UPDATE SET 
            product_name = EXCLUDED.product_name,
            category = EXCLUDED.category,
            updated_at = CURRENT_TIMESTAMP`,
          [
            businessId,
            row.product_code,
            row.product_name,
            row.category || null,
            row.unit || 'PCS',
            parseFloat(row.raw_material_cost) || 0,
            parseFloat(row.selling_price) || 0,
            parseInt(row.min_stock_level) || 10
          ]
        );
        rowCount++;
      }
      break;

    case 'production':
      for (const row of data) {
        // Get product ID
        const productResult = await query(
          'SELECT id FROM products WHERE business_id = $1 AND product_code = $2',
          [businessId, row.product_code]
        );

        if (productResult.rows.length > 0) {
          await query(
            `INSERT INTO production_logs (
              business_id, product_id, production_date, shift,
              planned_quantity, actual_quantity, good_quantity, rejected_quantity
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              businessId,
              productResult.rows[0].id,
              new Date(row.date),
              row.shift || 'General',
              parseInt(row.planned_quantity) || 0,
              parseInt(row.quantity) || 0,
              parseInt(row.good_quantity) || parseInt(row.quantity) || 0,
              parseInt(row.rejected_quantity) || 0
            ]
          );
          rowCount++;
        }
      }
      break;

    // Add more module cases as needed
  }

  return { rowCount };
}