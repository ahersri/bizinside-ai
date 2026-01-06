const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { Op, sequelize } = require('sequelize');
const { Product, StockAuditLog } = require('../models');
const { Parser } = require('json2csv');
const { logger } = require('../utils/logger');

/**
 * =====================
 * CREATE PRODUCT
 * =====================
 */
exports.createProduct = async (req, res) => {
  const { business_id } = req.user;

  const existing = await Product.findOne({
    where: { business_id, product_code: req.body.product_code },
  });

  if (existing) {
    return res.status(400).json({ error: 'Product with this code already exists' });
  }

  const product = await Product.create({ ...req.body, business_id });

  res.status(201).json({
    success: true,
    data: { product },
  });
};

/**
 * =====================
 * GET PRODUCTS (PAGINATION)
 * =====================
 */
exports.getProducts = async (req, res) => {
  const { business_id } = req.user;
  const {
    page = 1,
    limit = 10,
    category,
    search,
    min_price,
    max_price,
    sort_by = 'created_at',
    sort_order = 'DESC',
  } = req.query;

  const where = { business_id };

  if (category) where.category = category;

  if (search) {
    where[Op.or] = [
      { product_name: { [Op.iLike]: `%${search}%` } },
      { product_code: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (min_price || max_price) {
    where.selling_price = {};
    if (min_price) where.selling_price[Op.gte] = min_price;
    if (max_price) where.selling_price[Op.lte] = max_price;
  }

  const { count, rows } = await Product.findAndCountAll({
    where,
    limit: Number(limit),
    offset: (page - 1) * limit,
    order: [[sort_by, sort_order]],
  });

  res.json({
    success: true,
    data: {
      products: rows,
      pagination: {
        total: count,
        page: Number(page),
        pages: Math.ceil(count / limit),
        limit: Number(limit),
      },
    },
  });
};

/**
 * =====================
 * GET SINGLE PRODUCT
 * =====================
 */
exports.getProduct = async (req, res) => {
  const product = await Product.findOne({
    where: { id: req.params.id, business_id: req.user.business_id },
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({ success: true, data: { product } });
};

/**
 * =====================
 * UPDATE PRODUCT
 * =====================
 */
exports.updateProduct = async (req, res) => {
  const product = await Product.findOne({
    where: { id: req.params.id, business_id: req.user.business_id },
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  await product.update(req.body);

  res.json({ success: true, data: { product } });
};

/**
 * =====================
 * DELETE PRODUCT
 * =====================
 */
exports.deleteProduct = async (req, res) => {
  const product = await Product.findOne({
    where: { id: req.params.id, business_id: req.user.business_id },
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  await product.destroy();

  res.json({ success: true });
};

/**
 * =====================
 * PRODUCT STATS
 * =====================
 */
exports.getProductStats = async (req, res) => {
  const stats = await Product.findAll({
    where: { business_id: req.user.business_id },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_products'],
      [sequelize.fn('SUM', sequelize.col('current_stock')), 'total_stock'],
      [
        sequelize.fn(
          'SUM',
          sequelize.literal('CASE WHEN current_stock <= min_stock_level THEN 1 ELSE 0 END')
        ),
        'low_stock_count',
      ],
    ],
    raw: true,
  });

  res.json({ success: true, data: stats[0] });
};

/**
 * =====================
 * IMPORT CSV + XLSX
 * =====================
 */
exports.importProducts = async (req, res) => {
  const { business_id } = req.user;
  const ext = req.file.originalname.split('.').pop().toLowerCase();
  let products = [];

  if (ext === 'csv') {
    await new Promise((resolve) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => products.push({ ...row, business_id }))
        .on('end', resolve);
    });
  } else {
    const workbook = XLSX.readFile(req.file.path);
    products = XLSX.utils
      .sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
      .map((row) => ({ ...row, business_id }));
  }

  await Product.bulkCreate(products, { ignoreDuplicates: true });

  res.json({ success: true, count: products.length });
};

/**
 * =====================
 * EXPORT CSV
 * =====================
 */
exports.exportProducts = async (req, res) => {
  const products = await Product.findAll({
    where: { business_id: req.user.business_id },
    raw: true,
  });

  const parser = new Parser();
  res.header('Content-Type', 'text/csv');
  res.attachment('products.csv');
  res.send(parser.parse(products));
};

/**
 * =====================
 * BULK UPDATE
 * =====================
 */
exports.bulkUpdateProducts = async (req, res) => {
  const { ids, updates } = req.body;

  await Product.update(updates, {
    where: { id: ids, business_id: req.user.business_id },
  });

  res.json({ success: true });
};

/**
 * =====================
 * BULK DELETE
 * =====================
 */
exports.bulkDeleteProducts = async (req, res) => {
  await Product.destroy({
    where: { id: req.body.ids, business_id: req.user.business_id },
  });

  res.json({ success: true });
};

/**
 * =====================
 * STOCK ADJUSTMENT
 * =====================
 */
exports.adjustStock = async (req, res) => {
  const { product_id, new_stock, reason } = req.body;

  const product = await Product.findOne({
    where: { id: product_id, business_id: req.user.business_id },
  });

  await StockAuditLog.create({
    business_id: req.user.business_id,
    product_id,
    user_id: req.user.id,
    change_type: 'ADJUST',
    quantity_before: product.current_stock,
    quantity_after: new_stock,
    reason,
  });

  await product.update({ current_stock: new_stock });

  res.json({ success: true });
};

/**
 * =====================
 * STOCK LOGS
 * =====================
 */
exports.getStockLogs = async (req, res) => {
  const logs = await StockAuditLog.findAll({
    where: { business_id: req.user.business_id },
    order: [['created_at', 'DESC']],
  });

  res.json({ success: true, data: logs });
};
