const { Product, InventoryTransaction, Business } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const Sequelize = require('sequelize');

// @desc    Get inventory overview
// @route   GET /api/inventory/overview
// @access  Private
exports.getInventoryOverview = async (req, res, next) => {
  try {
    const businessId = req.user.business_id;

    // Get all products with stock status
    const products = await Product.findAll({
      where: {
        business_id: businessId,
        is_active: true
      },
      attributes: [
        'id', 'product_code', 'product_name', 'category',
        'current_stock', 'min_stock_level', 'unit',
        [Sequelize.literal('CASE WHEN current_stock <= min_stock_level THEN "LOW" WHEN current_stock <= min_stock_level * 1.5 THEN "MEDIUM" ELSE "HIGH" END'), 'stock_status']
      ],
      order: [
        [Sequelize.literal('CASE WHEN current_stock <= min_stock_level THEN 1 WHEN current_stock <= min_stock_level * 1.5 THEN 2 ELSE 3 END'), 'ASC'],
        ['product_name', 'ASC']
      ]
    });

    // Calculate inventory value
    const inventoryValue = await Product.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.literal('current_stock * (raw_material_cost + labor_cost + overhead_cost)')), 'total_value'],
        [Sequelize.fn('SUM', Sequelize.literal('current_stock * selling_price')), 'potential_revenue']
      ],
      where: {
        business_id: businessId,
        is_active: true
      }
    });

    // Stock status summary
    const lowStock = products.filter(p => p.dataValues.current_stock <= p.dataValues.min_stock_level).length;
    const mediumStock = products.filter(p => 
      p.dataValues.current_stock > p.dataValues.min_stock_level && 
      p.dataValues.current_stock <= p.dataValues.min_stock_level * 1.5
    ).length;
    const highStock = products.filter(p => p.dataValues.current_stock > p.dataValues.min_stock_level * 1.5).length;

    // Slow moving products (no sales in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const inventoryTransactions = await InventoryTransaction.findAll({
      where: {
        business_id: businessId,
        transaction_date: {
          [Sequelize.Op.gte]: thirtyDaysAgo
        },
        transaction_type: 'Sale'
      },
      attributes: ['product_id'],
      group: ['product_id']
    });

    const activeProductIds = inventoryTransactions.map(t => t.product_id);
    const slowMovingProducts = products.filter(p => !activeProductIds.includes(p.id));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total_products: products.length,
          low_stock_items: lowStock,
          medium_stock_items: mediumStock,
          high_stock_items: highStock,
          inventory_value: parseFloat(inventoryValue?.dataValues?.total_value) || 0,
          potential_revenue: parseFloat(inventoryValue?.dataValues?.potential_revenue) || 0,
          slow_moving_items: slowMovingProducts.length
        },
        products: products,
        slow_moving: slowMovingProducts.slice(0, 10) // Top 10 slow moving
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Create inventory transaction (Purchase/Adjustment/Return)
// @route   POST /api/inventory/transaction
// @access  Private (Owner, Admin, Manager)
exports.createTransaction = async (req, res, next) => {
  try {
    const {
      product_id,
      transaction_type,
      quantity,
      unit_price,
      reference_id,
      notes,
      transaction_date
    } = req.body;

    // Validate transaction type
    const validTypes = ['Purchase', 'Adjustment', 'Return', 'Wastage'];
    if (!validTypes.includes(transaction_type)) {
      throw new AppError(`Invalid transaction type. Valid types: ${validTypes.join(', ')}`, 400);
    }

    // Check if product exists
    const product = await Product.findOne({
      where: {
        id: product_id,
        business_id: req.user.business_id
      }
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Calculate new stock based on transaction type
    let newStock = product.current_stock;
    const totalValue = quantity * (unit_price || product.raw_material_cost);

    switch (transaction_type) {
      case 'Purchase':
        newStock += quantity;
        break;
      case 'Return':
        newStock += quantity;
        break;
      case 'Wastage':
      case 'Adjustment':
        newStock += quantity; // quantity can be negative for reduction
        if (newStock < 0) {
          throw new AppError(`Cannot reduce stock below 0. Current: ${product.current_stock}`, 400);
        }
        break;
    }

    // Create transaction
    const transaction = await InventoryTransaction.create({
      business_id: req.user.business_id,
      product_id,
      transaction_type,
      quantity,
      unit_price: unit_price || product.raw_material_cost,
      total_value: totalValue,
      reference_id,
      notes,
      transaction_date: transaction_date ? new Date(transaction_date) : new Date()
    });

    // Update product stock
    await product.update({ current_stock: newStock });

    // Get transaction with product details
    const transactionWithDetails = await InventoryTransaction.findByPk(transaction.id, {
      include: [{
        model: Product,
        attributes: ['product_name', 'product_code', 'unit']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Inventory transaction recorded successfully',
      data: transactionWithDetails,
      stock_after: newStock
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory transactions
// @route   GET /api/inventory/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      product_id,
      transaction_type
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { business_id: req.user.business_id };

    // Date filter
    if (startDate || endDate) {
      where.transaction_date = {};
      if (startDate) where.transaction_date[Sequelize.Op.gte] = new Date(startDate);
      if (endDate) where.transaction_date[Sequelize.Op.lte] = new Date(endDate);
    }

    // Product filter
    if (product_id) {
      where.product_id = product_id;
    }

    // Transaction type filter
    if (transaction_type) {
      where.transaction_type = transaction_type;
    }

    const { count, rows } = await InventoryTransaction.findAndCountAll({
      where,
      include: [{
        model: Product,
        attributes: ['product_name', 'product_code', 'unit']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['transaction_date', 'DESC'], ['created_at', 'DESC']]
    });

    // Calculate totals
    const totals = await InventoryTransaction.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('total_value')), 'total_value'],
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'total_quantity']
      ],
      where
    });

    // Transaction type summary
    const typeSummary = await InventoryTransaction.findAll({
      attributes: [
        'transaction_type',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('total_value')), 'value']
      ],
      where: { business_id: req.user.business_id },
      group: ['transaction_type']
    });

    res.status(200).json({
      success: true,
      data: rows,
      summary: {
        total_transactions: count,
        total_value: parseFloat(totals?.dataValues?.total_value) || 0,
        total_quantity: parseInt(totals?.dataValues?.total_quantity) || 0,
        type_summary: typeSummary
      },
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

// @desc    Get stock movement report
// @route   GET /api/inventory/movement
// @access  Private
exports.getStockMovement = async (req, res, next) => {
  try {
    const { product_id, days = 30 } = req.query;
    const businessId = req.user.business_id;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const where = {
      business_id: businessId,
      transaction_date: {
        [Sequelize.Op.gte]: startDate
      }
    };

    if (product_id) {
      where.product_id = product_id;
    }

    // Get opening stock (stock before start date)
    const openingStockQuery = product_id ? 
      `SELECT current_stock FROM Products WHERE id = ${product_id} AND business_id = ${businessId}` :
      `SELECT SUM(current_stock) as total_stock FROM Products WHERE business_id = ${businessId}`;

    const transactions = await InventoryTransaction.findAll({
      where,
      include: [{
        model: Product,
        attributes: ['product_name', 'product_code']
      }],
      order: [['transaction_date', 'ASC']]
    });

    // Calculate running stock
    let runningStock = 0;
    const movement = transactions.map(t => {
      let stockChange = 0;
      
      switch (t.transaction_type) {
        case 'Purchase':
        case 'Return':
          stockChange = t.quantity;
          break;
        case 'Sale':
          stockChange = -t.quantity;
          break;
        case 'Wastage':
        case 'Adjustment':
          stockChange = t.quantity; // can be positive or negative
          break;
      }

      runningStock += stockChange;

      return {
        date: t.transaction_date,
        type: t.transaction_type,
        reference: t.reference_id,
        quantity: t.quantity,
        value: t.total_value,
        stock_change: stockChange,
        running_stock: runningStock,
        product: t.Product ? {
          name: t.Product.product_name,
          code: t.Product.product_code
        } : null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        period_days: parseInt(days),
        start_date: startDate,
        end_date: new Date(),
        total_transactions: transactions.length,
        movement: movement
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Generate reorder suggestions
// @route   GET /api/inventory/reorder-suggestions
// @access  Private (Owner, Admin, Manager)
exports.getReorderSuggestions = async (req, res, next) => {
  try {
    const businessId = req.user.business_id;

    // Get products below reorder level
    const lowStockProducts = await Product.findAll({
      where: {
        business_id: businessId,
        is_active: true,
        current_stock: {
          [Sequelize.Op.lte]: Sequelize.col('min_stock_level')
        }
      },
      attributes: [
        'id', 'product_code', 'product_name', 'category', 'unit',
        'current_stock', 'min_stock_level',
        [Sequelize.literal('min_stock_level * 2'), 'suggested_order'],
        [Sequelize.literal('(min_stock_level * 2 - current_stock) * raw_material_cost'), 'estimated_cost']
      ],
      order: [[Sequelize.literal('(min_stock_level - current_stock) / min_stock_level'), 'DESC']]
    });

    // Calculate daily consumption rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (let product of lowStockProducts) {
      const sales = await InventoryTransaction.findOne({
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('quantity')), 'total_sold']
        ],
        where: {
          business_id: businessId,
          product_id: product.id,
          transaction_type: 'Sale',
          transaction_date: {
            [Sequelize.Op.gte]: thirtyDaysAgo
          }
        }
      });

      const totalSold = parseInt(sales?.dataValues?.total_sold) || 0;
      const dailyConsumption = totalSold / 30;
      const daysOfStock = product.current_stock / (dailyConsumption || 1);

      product.dataValues.daily_consumption = dailyConsumption.toFixed(2);
      product.dataValues.days_of_stock = daysOfStock.toFixed(1);
      product.dataValues.urgency = daysOfStock < 3 ? 'HIGH' : daysOfStock < 7 ? 'MEDIUM' : 'LOW';
    }

    // Calculate total reorder cost
    const totalCost = lowStockProducts.reduce((sum, product) => {
      return sum + (parseFloat(product.dataValues.estimated_cost) || 0);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        total_low_stock_items: lowStockProducts.length,
        total_reorder_cost: totalCost.toFixed(2),
        suggestions: lowStockProducts,
        summary_by_urgency: {
          high: lowStockProducts.filter(p => p.dataValues.urgency === 'HIGH').length,
          medium: lowStockProducts.filter(p => p.dataValues.urgency === 'MEDIUM').length,
          low: lowStockProducts.filter(p => p.dataValues.urgency === 'LOW').length
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update minimum stock level
// @route   PUT /api/inventory/min-stock/:product_id
// @access  Private (Owner, Admin, Manager)
exports.updateMinStockLevel = async (req, res, next) => {
  try {
    const { product_id } = req.params;
    const { min_stock_level } = req.body;

    if (!min_stock_level || min_stock_level < 0) {
      throw new AppError('Valid minimum stock level is required', 400);
    }

    const product = await Product.findOne({
      where: {
        id: product_id,
        business_id: req.user.business_id
      }
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    await product.update({ min_stock_level });

    res.status(200).json({
      success: true,
      message: 'Minimum stock level updated successfully',
      data: {
        product_id: product.id,
        product_code: product.product_code,
        product_name: product.product_name,
        old_min_stock: product.min_stock_level,
        new_min_stock: min_stock_level,
        current_stock: product.current_stock,
        status: product.current_stock <= min_stock_level ? 'BELOW MINIMUM' : 'ABOVE MINIMUM'
      }
    });

  } catch (error) {
    next(error);
  }
};