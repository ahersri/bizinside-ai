const { Business, Product, Production, Sale } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const Sequelize = require('sequelize');

// @desc    Get business overview dashboard
// @route   GET /api/dashboard/overview
// @access  Private
exports.getDashboardOverview = async (req, res, next) => {
  try {
    const businessId = req.user.business_id;

    // Total products
    const totalProducts = await Product.count({
      where: { business_id: businessId, is_active: true }
    });

    // Total sales (last 30 days)
    const salesData = await Sale.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'total_quantity'],
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'total_revenue']
      ],
      where: {
        business_id: businessId,
        sale_date: {
          [Sequelize.Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Total production (last 30 days)
    const productionData = await Production.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('actual_quantity')), 'total_production']
      ],
      where: {
        business_id: businessId,
        production_date: {
          [Sequelize.Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Low stock products
    const lowStockProducts = await Product.count({
      where: {
        business_id: businessId,
        is_active: true,
        current_stock: { [Sequelize.Op.lte]: Sequelize.col('min_stock_level') }
      }
    });

    // Recent sales (last 5)
    const recentSales = await Sale.findAll({
      where: { business_id: businessId },
      include: [{
        model: Product,
        attributes: ['product_name', 'product_code']
      }],
      order: [['sale_date', 'DESC']],
      limit: 5
    });

    // Recent production (last 5)
    const recentProduction = await Production.findAll({
      where: { business_id: businessId },
      include: [{
        model: Product,
        attributes: ['product_name', 'product_code']
      }],
      order: [['production_date', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total_products: totalProducts || 0,
          total_sales: parseFloat(salesData?.dataValues?.total_revenue) || 0,
          total_production: parseInt(productionData?.dataValues?.total_production) || 0,
          low_stock_products: lowStockProducts || 0
        },
        recent_sales: recentSales,
        recent_production: recentProduction
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get sales analytics
// @route   GET /api/dashboard/sales-analytics
// @access  Private
exports.getSalesAnalytics = async (req, res, next) => {
  try {
    const businessId = req.user.business_id;
    const { period = 'monthly' } = req.query;

    let dateFormat;
    
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        dateFormat = '%Y-%U';
        break;
      default: // monthly
        dateFormat = '%Y-%m';
    }

    const salesTrend = await Sale.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('sale_date'), dateFormat), 'period'],
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'revenue'],
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'quantity']
      ],
      where: { business_id: businessId },
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('sale_date'), dateFormat)],
      order: [[Sequelize.col('period'), 'ASC']],
      limit: 12
    });

    // Top products by revenue
    const topProducts = await Sale.findAll({
      attributes: [
        'product_id',
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'revenue'],
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'quantity']
      ],
      include: [{
        model: Product,
        attributes: ['product_name', 'product_code']
      }],
      where: { business_id: businessId },
      group: ['product_id'],
      order: [[Sequelize.literal('revenue'), 'DESC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: {
        sales_trend: salesTrend,
        top_products: topProducts
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get production analytics
// @route   GET /api/dashboard/production-analytics
// @access  Private
exports.getProductionAnalytics = async (req, res, next) => {
  try {
    const businessId = req.user.business_id;

    // Production efficiency (planned vs actual)
    const productionEfficiency = await Production.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('planned_quantity')), 'total_planned'],
        [Sequelize.fn('SUM', Sequelize.col('actual_quantity')), 'total_actual'],
        [Sequelize.fn('AVG', Sequelize.literal('(actual_quantity/planned_quantity)*100')), 'efficiency_percentage']
      ],
      where: { 
        business_id: businessId,
        planned_quantity: { [Sequelize.Op.gt]: 0 }
      }
    });

    // Rejection rate
    const rejectionData = await Production.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('actual_quantity')), 'total_produced'],
        [Sequelize.fn('SUM', Sequelize.col('rejected_quantity')), 'total_rejected'],
        [Sequelize.fn('AVG', Sequelize.literal('(rejected_quantity/actual_quantity)*100')), 'rejection_rate']
      ],
      where: { 
        business_id: businessId,
        actual_quantity: { [Sequelize.Op.gt]: 0 }
      }
    });

    // Shift-wise production
    const shiftProduction = await Production.findAll({
      attributes: [
        'shift',
        [Sequelize.fn('SUM', Sequelize.col('actual_quantity')), 'total_production']
      ],
      where: { business_id: businessId },
      group: ['shift']
    });

    res.status(200).json({
      success: true,
      data: {
        production_efficiency: productionEfficiency,
        rejection_analysis: rejectionData,
        shift_wise_production: shiftProduction
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get business health score
// @route   GET /api/dashboard/health-score
// @access  Private (Owner, Admin)
exports.getBusinessHealthScore = async (req, res, next) => {
  try {
    const businessId = req.user.business_id;
    
    // Calculate health score based on multiple factors
    let score = 0;
    const factors = [];

    // 1. Stock availability (25 points)
    const lowStockCount = await Product.count({
      where: {
        business_id: businessId,
        current_stock: { [Sequelize.Op.lte]: Sequelize.col('min_stock_level') }
      }
    });

    const totalProducts = await Product.count({
      where: { business_id: businessId, is_active: true }
    });

    const stockScore = totalProducts > 0 ? 
      Math.max(0, 25 - (lowStockCount / totalProducts * 25)) : 25;
    score += stockScore;
    factors.push({ name: 'Stock Availability', score: stockScore.toFixed(1), max: 25 });

    // 2. Production efficiency (25 points)
    const efficiencyData = await Production.findOne({
      attributes: [
        [Sequelize.fn('AVG', Sequelize.literal('(actual_quantity/planned_quantity)*100')), 'avg_efficiency']
      ],
      where: { 
        business_id: businessId,
        planned_quantity: { [Sequelize.Op.gt]: 0 }
      }
    });

    const efficiencyScore = efficiencyData?.dataValues?.avg_efficiency ? 
      Math.min(25, (efficiencyData.dataValues.avg_efficiency / 100) * 25) : 15;
    score += efficiencyScore;
    factors.push({ name: 'Production Efficiency', score: efficiencyScore.toFixed(1), max: 25 });

    // 3. Sales trend (25 points)
    const recentSales = await Sale.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'revenue']
      ],
      where: {
        business_id: businessId,
        sale_date: {
          [Sequelize.Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Simple sales trend logic
    const salesScore = recentSales?.dataValues?.revenue > 10000 ? 20 : 15;
    score += salesScore;
    factors.push({ name: 'Sales Performance', score: salesScore.toFixed(1), max: 25 });

    // 4. Profit margin (25 points)
    const profitScore = 20;
    score += profitScore;
    factors.push({ name: 'Profit Margin', score: profitScore.toFixed(1), max: 25 });

    // Determine health status
    let status = 'Healthy';
    let color = 'green';
    
    if (score < 50) {
      status = 'Critical';
      color = 'red';
    } else if (score < 70) {
      status = 'Warning';
      color = 'orange';
    } else if (score < 85) {
      status = 'Good';
      color = 'yellow';
    }

    res.status(200).json({
      success: true,
      data: {
        overall_score: Math.round(score),
        health_status: status,
        status_color: color,
        factors: factors,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
};