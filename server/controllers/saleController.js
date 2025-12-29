const { Sale, Product, Business } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const Sequelize = require('sequelize');

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private (Owner, Admin, Manager)
exports.createSale = async (req, res, next) => {
  try {
    const {
      product_id,
      customer_name,
      sale_date,
      quantity,
      unit_price,
      gst_percentage,
      payment_status,
      invoice_number,
      notes
    } = req.body;

    // Validate required fields
    if (!product_id || !quantity || !unit_price) {
      throw new AppError('Product ID, quantity and unit price are required', 400);
    }

    // Check if product exists and belongs to business
    const product = await Product.findOne({
      where: {
        id: product_id,
        business_id: req.user.business_id
      }
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check stock availability
    if (product.current_stock < quantity) {
      throw new AppError(`Insufficient stock. Available: ${product.current_stock}`, 400);
    }

    // Generate invoice number if not provided
    let finalInvoiceNumber = invoice_number;
    if (!finalInvoiceNumber) {
      const business = await Business.findByPk(req.user.business_id);
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const count = await Sale.count({
        where: {
          business_id: req.user.business_id,
          sale_date: {
            [Sequelize.Op.gte]: new Date(date.getFullYear(), date.getMonth(), 1)
          }
        }
      });
      finalInvoiceNumber = `INV-${business.id}-${year}${month}-${(count + 1).toString().padStart(3, '0')}`;
    }

    // Create sale
    const sale = await Sale.create({
      business_id: req.user.business_id,
      product_id,
      invoice_number: finalInvoiceNumber,
      customer_name: customer_name || 'Walk-in Customer',
      sale_date: sale_date ? new Date(sale_date) : new Date(),
      quantity,
      unit_price,
      gst_percentage: gst_percentage || 0,
      payment_status: payment_status || 'Pending',
      notes
    });

    // Update product stock
    const newStock = product.current_stock - quantity;
    await product.update({ current_stock: Math.max(0, newStock) });

    // Get sale with product details
    const saleWithDetails = await Sale.findByPk(sale.id, {
      include: [{
        model: Product,
        attributes: ['product_name', 'product_code', 'category']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: saleWithDetails
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
exports.getSales = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      product_id,
      customer_name,
      payment_status
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { business_id: req.user.business_id };

    // Date filter
    if (startDate || endDate) {
      where.sale_date = {};
      if (startDate) where.sale_date[Sequelize.Op.gte] = new Date(startDate);
      if (endDate) where.sale_date[Sequelize.Op.lte] = new Date(endDate);
    }

    // Product filter
    if (product_id) {
      where.product_id = product_id;
    }

    // Customer filter
    if (customer_name) {
      where.customer_name = {
        [Sequelize.Op.like]: `%${customer_name}%`
      };
    }

    // Payment status filter
    if (payment_status) {
      where.payment_status = payment_status;
    }

    const { count, rows } = await Sale.findAndCountAll({
      where,
      include: [{
        model: Product,
        attributes: ['product_name', 'product_code', 'category', 'unit']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['sale_date', 'DESC'], ['created_at', 'DESC']]
    });

    // Calculate totals
    const totals = await Sale.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'total_revenue'],
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'total_quantity']
      ],
      where
    });

    res.status(200).json({
      success: true,
      data: rows,
      summary: {
        total_revenue: parseFloat(totals?.dataValues?.total_revenue) || 0,
        total_quantity: parseInt(totals?.dataValues?.total_quantity) || 0
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

// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Private
exports.getSale = async (req, res, next) => {
  try {
    const sale = await Sale.findOne({
      where: {
        id: req.params.id,
        business_id: req.user.business_id
      },
      include: [{
        model: Product,
        attributes: ['product_name', 'product_code', 'category', 'unit', 'selling_price']
      }]
    });

    if (!sale) {
      throw new AppError('Sale not found', 404);
    }

    res.status(200).json({
      success: true,
      data: sale
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update sale
// @route   PUT /api/sales/:id
// @access  Private (Owner, Admin, Manager)
exports.updateSale = async (req, res, next) => {
  try {
    const sale = await Sale.findOne({
      where: {
        id: req.params.id,
        business_id: req.user.business_id
      },
      include: [{
        model: Product
      }]
    });

    if (!sale) {
      throw new AppError('Sale not found', 404);
    }

    // Handle stock adjustment if quantity changes
    if (req.body.quantity && req.body.quantity !== sale.quantity) {
      const product = await Product.findByPk(sale.product_id);
      if (product) {
        const stockDifference = sale.quantity - req.body.quantity;
        const newStock = product.current_stock + stockDifference;
        
        if (newStock < 0) {
          throw new AppError(`Insufficient stock for adjustment. Available: ${product.current_stock}`, 400);
        }
        
        await product.update({ current_stock: newStock });
      }
    }

    // Update sale
    await sale.update(req.body);

    const updatedSale = await Sale.findByPk(sale.id, {
      include: [{
        model: Product,
        attributes: ['product_name', 'product_code']
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Sale updated successfully',
      data: updatedSale
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete sale
// @route   DELETE /api/sales/:id
// @access  Private (Owner, Admin)
exports.deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findOne({
      where: {
        id: req.params.id,
        business_id: req.user.business_id
      },
      include: [{
        model: Product
      }]
    });

    if (!sale) {
      throw new AppError('Sale not found', 404);
    }

    // Restore stock
    if (sale.Product) {
      const newStock = sale.Product.current_stock + sale.quantity;
      await sale.Product.update({ current_stock: newStock });
    }

    // Delete sale
    await sale.destroy();

    res.status(200).json({
      success: true,
      message: 'Sale deleted successfully. Stock has been restored.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get sales statistics
// @route   GET /api/sales/stats/overview
// @access  Private
exports.getSalesStats = async (req, res, next) => {
  try {
    const businessId = req.user.business_id;
    const { period = 'monthly' } = req.query;

    // Today's sales
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaySales = await Sale.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'revenue'],
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'quantity']
      ],
      where: {
        business_id: businessId,
        sale_date: {
          [Sequelize.Op.between]: [todayStart, todayEnd]
        }
      }
    });

    // Monthly sales
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlySales = await Sale.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'revenue'],
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'quantity']
      ],
      where: {
        business_id: businessId,
        sale_date: {
          [Sequelize.Op.gte]: monthStart
        }
      }
    });

    // Yearly sales
    const yearStart = new Date(new Date().getFullYear(), 0, 1);

    const yearlySales = await Sale.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'revenue'],
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'quantity']
      ],
      where: {
        business_id: businessId,
        sale_date: {
          [Sequelize.Op.gte]: yearStart
        }
      }
    });

    // Top customers
    const topCustomers = await Sale.findAll({
      attributes: [
        'customer_name',
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'total_spent'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_orders']
      ],
      where: { business_id: businessId },
      group: ['customer_name'],
      order: [[Sequelize.literal('total_spent'), 'DESC']],
      limit: 5
    });

    // Payment status summary
    const paymentSummary = await Sale.findAll({
      attributes: [
        'payment_status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'amount']
      ],
      where: { business_id: businessId },
      group: ['payment_status']
    });

    res.status(200).json({
      success: true,
      data: {
        today: {
          revenue: parseFloat(todaySales?.dataValues?.revenue) || 0,
          quantity: parseInt(todaySales?.dataValues?.quantity) || 0
        },
        monthly: {
          revenue: parseFloat(monthlySales?.dataValues?.revenue) || 0,
          quantity: parseInt(monthlySales?.dataValues?.quantity) || 0
        },
        yearly: {
          revenue: parseFloat(yearlySales?.dataValues?.revenue) || 0,
          quantity: parseInt(yearlySales?.dataValues?.quantity) || 0
        },
        top_customers: topCustomers,
        payment_summary: paymentSummary
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update payment status
// @route   PUT /api/sales/:id/payment
// @access  Private (Owner, Admin, Manager, Accountant)
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { payment_status, payment_date } = req.body;

    const sale = await Sale.findOne({
      where: {
        id: req.params.id,
        business_id: req.user.business_id
      }
    });

    if (!sale) {
      throw new AppError('Sale not found', 404);
    }

    await sale.update({
      payment_status,
      payment_date: payment_date || (payment_status === 'Paid' ? new Date() : null)
    });

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: sale
    });

  } catch (error) {
    next(error);
  }
};