const { Production, Product, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const Sequelize = require('sequelize');

// @desc    Create production record
// @route   POST /api/production
// @access  Private (Owner, Admin, Manager)
exports.createProduction = async (req, res, next) => {
  try {
    const {
      product_id,
      production_date,
      shift,
      planned_quantity,
      actual_quantity,
      good_quantity,
      rejected_quantity,
      machine_id,
      operator_id,
      notes
    } = req.body;

    // Validate required fields
    if (!product_id) {
      throw new AppError('Product ID is required', 400);
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

    // Set defaults
    const finalActualQuantity = actual_quantity || 0;
    const finalGoodQuantity = good_quantity || finalActualQuantity;
    const finalRejectedQuantity = rejected_quantity || 0;

    // Validate quantities
    if (finalGoodQuantity + finalRejectedQuantity !== finalActualQuantity) {
      throw new AppError('Good quantity + rejected quantity must equal actual quantity', 400);
    }

    // Create production record
    const production = await Production.create({
      business_id: req.user.business_id,
      product_id,
      production_date: production_date ? new Date(production_date) : new Date(),
      shift: shift || 'General',
      planned_quantity: planned_quantity || 0,
      actual_quantity: finalActualQuantity,
      good_quantity: finalGoodQuantity,
      rejected_quantity: finalRejectedQuantity,
      machine_id,
      operator_id,
      notes
    });

    // Update product stock with good quantity
    if (finalGoodQuantity > 0) {
      const newStock = product.current_stock + finalGoodQuantity;
      await product.update({ current_stock: newStock });
    }

    // Get production with details
    const productionWithDetails = await Production.findByPk(production.id, {
      include: [
        {
          model: Product,
          attributes: ['product_name', 'product_code', 'category', 'unit']
        },
        {
          model: User,
          as: 'Operator',
          attributes: ['full_name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Production record created successfully',
      data: productionWithDetails
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get all production records
// @route   GET /api/production
// @access  Private
exports.getProductions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      product_id,
      shift,
      machine_id
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { business_id: req.user.business_id };

    // Date filter
    if (startDate || endDate) {
      where.production_date = {};
      if (startDate) where.production_date[Sequelize.Op.gte] = new Date(startDate);
      if (endDate) where.production_date[Sequelize.Op.lte] = new Date(endDate);
    }

    // Product filter
    if (product_id) {
      where.product_id = product_id;
    }

    // Shift filter
    if (shift) {
      where.shift = shift;
    }

    // Machine filter
    if (machine_id) {
      where.machine_id = {
        [Sequelize.Op.like]: `%${machine_id}%`
      };
    }

    const { count, rows } = await Production.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          attributes: ['product_name', 'product_code', 'category', 'unit']
        },
        {
          model: User,
          as: 'Operator',
          attributes: ['full_name']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['production_date', 'DESC'], ['created_at', 'DESC']]
    });

    // Calculate totals
    const totals = await Production.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('planned_quantity')), 'total_planned'],
        [Sequelize.fn('SUM', Sequelize.col('actual_quantity')), 'total_actual'],
        [Sequelize.fn('SUM', Sequelize.col('good_quantity')), 'total_good'],
        [Sequelize.fn('SUM', Sequelize.col('rejected_quantity')), 'total_rejected']
      ],
      where
    });

    res.status(200).json({
      success: true,
      data: rows,
      summary: {
        total_planned: parseInt(totals?.dataValues?.total_planned) || 0,
        total_actual: parseInt(totals?.dataValues?.total_actual) || 0,
        total_good: parseInt(totals?.dataValues?.total_good) || 0,
        total_rejected: parseInt(totals?.dataValues?.total_rejected) || 0,
        efficiency: totals?.dataValues?.total_planned > 0 ?
          ((parseInt(totals.dataValues.total_actual) / parseInt(totals.dataValues.total_planned)) * 100).toFixed(2) : 0,
        rejection_rate: totals?.dataValues?.total_actual > 0 ?
          ((parseInt(totals.dataValues.total_rejected) / parseInt(totals.dataValues.total_actual)) * 100).toFixed(2) : 0
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

// @desc    Get production by ID
// @route   GET /api/production/:id
// @access  Private
exports.getProduction = async (req, res, next) => {
  try {
    const production = await Production.findOne({
      where: {
        id: req.params.id,
        business_id: req.user.business_id
      },
      include: [
        {
          model: Product,
          attributes: ['product_name', 'product_code', 'category', 'unit']
        },
        {
          model: User,
          as: 'Operator',
          attributes: ['full_name', 'email', 'mobile']
        }
      ]
    });

    if (!production) {
      throw new AppError('Production record not found', 404);
    }

    res.status(200).json({
      success: true,
      data: production
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update production record
// @route   PUT /api/production/:id
// @access  Private (Owner, Admin, Manager)
exports.updateProduction = async (req, res, next) => {
  try {
    const production = await Production.findOne({
      where: {
        id: req.params.id,
        business_id: req.user.business_id
      },
      include: [{
        model: Product
      }]
    });

    if (!production) {
      throw new AppError('Production record not found', 404);
    }

    // Handle stock adjustment if good quantity changes
    if (req.body.good_quantity && req.body.good_quantity !== production.good_quantity) {
      const product = await Product.findByPk(production.product_id);
      if (product) {
        const stockDifference = req.body.good_quantity - production.good_quantity;
        const newStock = product.current_stock + stockDifference;
        
        if (newStock < 0) {
          throw new AppError(`Cannot reduce stock below 0. Current: ${product.current_stock}`, 400);
        }
        
        await product.update({ current_stock: newStock });
      }
    }

    // Update production
    await production.update(req.body);

    const updatedProduction = await Production.findByPk(production.id, {
      include: [
        {
          model: Product,
          attributes: ['product_name', 'product_code']
        },
        {
          model: User,
          as: 'Operator',
          attributes: ['full_name']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Production record updated successfully',
      data: updatedProduction
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete production record
// @route   DELETE /api/production/:id
// @access  Private (Owner, Admin)
exports.deleteProduction = async (req, res, next) => {
  try {
    const production = await Production.findOne({
      where: {
        id: req.params.id,
        business_id: req.user.business_id
      },
      include: [{
        model: Product
      }]
    });

    if (!production) {
      throw new AppError('Production record not found', 404);
    }

    // Adjust stock (remove good quantity)
    if (production.Product && production.good_quantity > 0) {
      const newStock = production.Product.current_stock - production.good_quantity;
      await production.Product.update({ 
        current_stock: Math.max(0, newStock) 
      });
    }

    // Delete production record
    await production.destroy();

    res.status(200).json({
      success: true,
      message: 'Production record deleted successfully. Stock has been adjusted.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get production statistics
// @route   GET /api/production/stats/overview
// @access  Private
exports.getProductionStats = async (req, res, next) => {
  try {
    const businessId = req.user.business_id;
    const { period = 'monthly' } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'daily':
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const todayEnd = new Date(now.setHours(23, 59, 59, 999));
        dateFilter = {
          production_date: {
            [Sequelize.Op.between]: [todayStart, todayEnd]
          }
        };
        break;
      case 'weekly':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        weekStart.setHours(0, 0, 0, 0);
        dateFilter = {
          production_date: {
            [Sequelize.Op.gte]: weekStart
          }
        };
        break;
      default: // monthly
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = {
          production_date: {
            [Sequelize.Op.gte]: monthStart
          }
        };
    }

    // Overall production stats
    const productionStats = await Production.findOne({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_records'],
        [Sequelize.fn('SUM', Sequelize.col('planned_quantity')), 'total_planned'],
        [Sequelize.fn('SUM', Sequelize.col('actual_quantity')), 'total_actual'],
        [Sequelize.fn('SUM', Sequelize.col('good_quantity')), 'total_good'],
        [Sequelize.fn('SUM', Sequelize.col('rejected_quantity')), 'total_rejected'],
        [Sequelize.fn('AVG', Sequelize.literal('(actual_quantity/planned_quantity)*100')), 'avg_efficiency'],
        [Sequelize.fn('AVG', Sequelize.literal('(rejected_quantity/actual_quantity)*100')), 'avg_rejection_rate']
      ],
      where: {
        business_id: businessId,
        ...dateFilter,
        planned_quantity: { [Sequelize.Op.gt]: 0 }
      }
    });

    // Shift-wise production
    const shiftProduction = await Production.findAll({
      attributes: [
        'shift',
        [Sequelize.fn('SUM', Sequelize.col('actual_quantity')), 'total_production'],
        [Sequelize.fn('AVG', Sequelize.literal('(actual_quantity/planned_quantity)*100')), 'efficiency'],
        [Sequelize.fn('AVG', Sequelize.literal('(rejected_quantity/actual_quantity)*100')), 'rejection_rate']
      ],
      where: {
        business_id: businessId,
        ...dateFilter
      },
      group: ['shift']
    });

    // Product-wise production
    const productProduction = await Production.findAll({
      attributes: [
        'product_id',
        [Sequelize.fn('SUM', Sequelize.col('actual_quantity')), 'total_produced'],
        [Sequelize.fn('SUM', Sequelize.col('rejected_quantity')), 'total_rejected'],
        [Sequelize.fn('AVG', Sequelize.literal('(rejected_quantity/actual_quantity)*100')), 'rejection_rate']
      ],
      include: [{
        model: Product,
        attributes: ['product_name', 'product_code']
      }],
      where: {
        business_id: businessId,
        ...dateFilter
      },
      group: ['product_id'],
      order: [[Sequelize.literal('total_produced'), 'DESC']],
      limit: 5
    });

    // Daily production trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyTrend = await Production.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('production_date')), 'date'],
        [Sequelize.fn('SUM', Sequelize.col('actual_quantity')), 'daily_production'],
        [Sequelize.fn('SUM', Sequelize.col('rejected_quantity')), 'daily_rejected']
      ],
      where: {
        business_id: businessId,
        production_date: {
          [Sequelize.Op.gte]: sevenDaysAgo
        }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('production_date'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('production_date')), 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total_records: parseInt(productionStats?.dataValues?.total_records) || 0,
          total_planned: parseInt(productionStats?.dataValues?.total_planned) || 0,
          total_actual: parseInt(productionStats?.dataValues?.total_actual) || 0,
          total_good: parseInt(productionStats?.dataValues?.total_good) || 0,
          total_rejected: parseInt(productionStats?.dataValues?.total_rejected) || 0,
          avg_efficiency: parseFloat(productionStats?.dataValues?.avg_efficiency) || 0,
          avg_rejection_rate: parseFloat(productionStats?.dataValues?.avg_rejection_rate) || 0
        },
        shift_wise: shiftProduction,
        product_wise: productProduction,
        daily_trend: dailyTrend
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get OEE (Overall Equipment Effectiveness)
// @route   GET /api/production/oee
// @access  Private (Owner, Admin, Manager)
exports.getOEE = async (req, res, next) => {
  try {
    const businessId = req.user.business_id;
    const { machine_id, startDate, endDate } = req.query;

    const where = { business_id: businessId };

    if (machine_id) {
      where.machine_id = machine_id;
    }

    if (startDate && endDate) {
      where.production_date = {
        [Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Calculate OEE = Availability × Performance × Quality
    const productionData = await Production.findOne({
      attributes: [
        // Availability = Actual Running Time / Planned Production Time
        [Sequelize.fn('AVG', Sequelize.literal('(actual_quantity/planned_quantity)')), 'availability'],
        
        // Performance = (Total Pieces / Ideal Cycle Time) / Actual Running Time
        // Simplified: Actual quantity vs planned quantity
        [Sequelize.fn('AVG', Sequelize.literal('(actual_quantity/planned_quantity)')), 'performance'],
        
        // Quality = Good Pieces / Total Pieces
        [Sequelize.fn('AVG', Sequelize.literal('(good_quantity/actual_quantity)')), 'quality']
      ],
      where: {
        ...where,
        planned_quantity: { [Sequelize.Op.gt]: 0 },
        actual_quantity: { [Sequelize.Op.gt]: 0 }
      }
    });

    const availability = parseFloat(productionData?.dataValues?.availability) || 0;
    const performance = parseFloat(productionData?.dataValues?.performance) || 0;
    const quality = parseFloat(productionData?.dataValues?.quality) || 0;
    
    const oee = (availability * performance * quality * 100).toFixed(2);

    res.status(200).json({
      success: true,
      data: {
        oee: parseFloat(oee),
        components: {
          availability: (availability * 100).toFixed(2),
          performance: (performance * 100).toFixed(2),
          quality: (quality * 100).toFixed(2)
        },
        interpretation: getOEEInterpretation(parseFloat(oee))
      }
    });

  } catch (error) {
    next(error);
  }
};

// Helper function for OEE interpretation
function getOEEInterpretation(oee) {
  if (oee >= 85) return 'World Class';
  if (oee >= 70) return 'Good';
  if (oee >= 50) return 'Average';
  if (oee >= 30) return 'Poor';
  return 'Very Poor - Needs Immediate Attention';
}