const { Product, Production, Sale } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const Sequelize = require('sequelize');

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Owner, Admin, Manager)
exports.createProduct = async (req, res, next) => {
  try {
    const {
      product_code,
      product_name,
      category,
      description,
      unit,
      raw_material_cost,
      labor_cost,
      overhead_cost,
      selling_price,
      min_stock_level
    } = req.body;

    // Check if product code already exists for this business
    const existingProduct = await Product.findOne({
      where: {
        business_id: req.user.business_id,
        product_code
      }
    });

    if (existingProduct) {
      throw new AppError('Product code already exists', 400);
    }

    const product = await Product.create({
      business_id: req.user.business_id,
      product_code,
      product_name,
      category,
      description,
      unit: unit || 'PCS',
      raw_material_cost: raw_material_cost || 0,
      labor_cost: labor_cost || 0,
      overhead_cost: overhead_cost || 0,
      selling_price: selling_price || 0,
      min_stock_level: min_stock_level || 10
    });

    res.status(201).json({
      success: true,
      data: product
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get all products for business
// @route   GET /api/products
// @access  Private
exports.getProducts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      search,
      active = true 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = { business_id: req.user.business_id };

    if (active !== 'all') {
      where.is_active = active === 'true';
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where[Sequelize.Op.or] = [
        { product_code: { [Sequelize.Op.like]: `%${search}%` } },
        { product_name: { [Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        business_id: req.user.business_id
      }
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Owner, Admin, Manager)
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        business_id: req.user.business_id
      }
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Update product
    await product.update(req.body);

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
// @access  Private (Owner, Admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        business_id: req.user.business_id
      }
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Soft delete (mark as inactive)
    await product.update({ is_active: false });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get product statistics
// @route   GET /api/products/stats/overview
// @access  Private
exports.getProductStats = async (req, res, next) => {
  try {
    const totalProducts = await Product.count({
      where: { 
        business_id: req.user.business_id,
        is_active: true 
      }
    });

    const lowStockProducts = await Product.count({
      where: {
        business_id: req.user.business_id,
        is_active: true,
        current_stock: { [Sequelize.Op.lte]: Sequelize.col('min_stock_level') }
      }
    });

    // Top selling products (last 30 days)
    const topSelling = await Sale.findAll({
      attributes: [
        'product_id',
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'total_sold'],
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'total_revenue']
      ],
      include: [{
        model: Product,
        attributes: ['product_name', 'product_code'],
        where: { business_id: req.user.business_id }
      }],
      where: {
        sale_date: {
          [Sequelize.Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      group: ['product_id'],
      order: [[Sequelize.fn('SUM', Sequelize.col('quantity')), 'DESC']],
      limit: 5
    });

    // Low margin products
    const lowMarginProducts = await Product.findAll({
      where: {
        business_id: req.user.business_id,
        is_active: true,
        selling_price: { [Sequelize.Op.gt]: 0 }
      },
      attributes: ['id', 'product_code', 'product_name', 'selling_price', 'raw_material_cost', 'labor_cost', 'overhead_cost'],
      limit: 5
    });

    // Add margin calculation
    const lowMarginWithCalc = lowMarginProducts.map(product => {
      const totalCost = parseFloat(product.raw_material_cost) + 
                       parseFloat(product.labor_cost) + 
                       parseFloat(product.overhead_cost);
      const margin = product.selling_price > 0 ? 
        ((product.selling_price - totalCost) / product.selling_price * 100).toFixed(2) : 0;
      
      return {
        ...product.toJSON(),
        total_cost: totalCost,
        margin: margin
      };
    });

    res.status(200).json({
      success: true,
      data: {
        total_products: totalProducts,
        low_stock_products: lowStockProducts,
        top_selling: topSelling,
        low_margin_products: lowMarginWithCalc
      }
    });

  } catch (error) {
    next(error);
  }
};