const { Product, Sale, Production, InventoryTransaction } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const Sequelize = require('sequelize');

// @desc    Analyze business data and provide insights
// @route   POST /api/ai/analyze
// @access  Private
exports.analyzeBusiness = async (req, res, next) => {
  try {
    const { question, analysis_type } = req.body;
    const businessId = req.user.business_id;

    let insights = {
      question: question || 'General business analysis',
      analysis_type: analysis_type || 'comprehensive',
      timestamp: new Date().toISOString(),
      insights: [],
      recommendations: [],
      confidence_score: 0
    };

    // 1. PROFIT ANALYSIS
    if (!question || question.toLowerCase().includes('profit') || question.toLowerCase().includes('loss')) {
      const profitInsight = await analyzeProfitability(businessId);
      insights.insights.push(...profitInsight.insights);
      insights.recommendations.push(...profitInsight.recommendations);
      insights.confidence_score += profitInsight.confidence;
    }

    // 2. SALES ANALYSIS
    if (!question || question.toLowerCase().includes('sales') || question.toLowerCase().includes('revenue')) {
      const salesInsight = await analyzeSales(businessId);
      insights.insights.push(...salesInsight.insights);
      insights.recommendations.push(...salesInsight.recommendations);
      insights.confidence_score += salesInsight.confidence;
    }

    // 3. INVENTORY ANALYSIS
    if (!question || question.toLowerCase().includes('inventory') || question.toLowerCase().includes('stock')) {
      const inventoryInsight = await analyzeInventory(businessId);
      insights.insights.push(...inventoryInsight.insights);
      insights.recommendations.push(...inventoryInsight.recommendations);
      insights.confidence_score += inventoryInsight.confidence;
    }

    // 4. PRODUCTION ANALYSIS
    if (!question || question.toLowerCase().includes('production') || question.toLowerCase().includes('efficiency')) {
      const productionInsight = await analyzeProduction(businessId);
      insights.insights.push(...productionInsight.insights);
      insights.recommendations.push(...productionInsight.recommendations);
      insights.confidence_score += productionInsight.confidence;
    }

    // 5. COST ANALYSIS
    if (!question || question.toLowerCase().includes('cost') || question.toLowerCase().includes('expensive')) {
      const costInsight = await analyzeCosts(businessId);
      insights.insights.push(...costInsight.insights);
      insights.recommendations.push(...costInsight.recommendations);
      insights.confidence_score += costInsight.confidence;
    }

    // Calculate average confidence
    insights.confidence_score = Math.min(100, Math.round(insights.confidence_score / 5));

    // Sort recommendations by priority
    insights.recommendations.sort((a, b) => b.priority - a.priority);

    res.status(200).json({
      success: true,
      data: insights
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get specific AI insight
// @route   GET /api/ai/insights/:type
// @access  Private
exports.getInsight = async (req, res, next) => {
  try {
    const { type } = req.params;
    const businessId = req.user.business_id;

    const validTypes = ['profit', 'sales', 'inventory', 'production', 'cost', 'risk'];
    if (!validTypes.includes(type)) {
      throw new AppError(`Invalid insight type. Valid types: ${validTypes.join(', ')}`, 400);
    }

    let insight;
    switch (type) {
      case 'profit':
        insight = await analyzeProfitability(businessId);
        break;
      case 'sales':
        insight = await analyzeSales(businessId);
        break;
      case 'inventory':
        insight = await analyzeInventory(businessId);
        break;
      case 'production':
        insight = await analyzeProduction(businessId);
        break;
      case 'cost':
        insight = await analyzeCosts(businessId);
        break;
      case 'risk':
        insight = await analyzeRisks(businessId);
        break;
    }

    res.status(200).json({
      success: true,
      data: {
        type: type,
        generated_at: new Date().toISOString(),
        ...insight
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Predict next month sales
// @route   GET /api/ai/predict/sales
// @access  Private (Owner, Admin, Manager)
exports.predictSales = async (req, res, next) => {
  try {
    const businessId = req.user.business_id;
    const { months = 1 } = req.query;

    // Get historical sales data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const historicalSales = await Sale.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('sale_date'), '%Y-%m'), 'month'],
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'revenue'],
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'quantity']
      ],
      where: {
        business_id: businessId,
        sale_date: {
          [Sequelize.Op.gte]: sixMonthsAgo
        }
      },
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('sale_date'), '%Y-%m')],
      order: [[Sequelize.col('month'), 'ASC']]
    });

    // Simple linear regression for prediction
    const monthsData = historicalSales.map((sale, index) => ({
      month: sale.dataValues.month,
      revenue: parseFloat(sale.dataValues.revenue) || 0,
      x: index // time index
    }));

    if (monthsData.length < 2) {
      throw new AppError('Insufficient data for prediction. Need at least 2 months of sales data.', 400);
    }

    // Calculate linear regression
    const n = monthsData.length;
    const sumX = monthsData.reduce((sum, d) => sum + d.x, 0);
    const sumY = monthsData.reduce((sum, d) => sum + d.revenue, 0);
    const sumXY = monthsData.reduce((sum, d) => sum + d.x * d.revenue, 0);
    const sumX2 = monthsData.reduce((sum, d) => sum + d.x * d.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next months
    const predictions = [];
    for (let i = 0; i < parseInt(months); i++) {
      const futureX = n + i;
      const predictedRevenue = slope * futureX + intercept;
      
      // Add seasonality factor (simplified)
      const monthIndex = (new Date().getMonth() + i) % 12;
      const seasonalityFactor = getSeasonalityFactor(monthIndex);
      const adjustedRevenue = Math.max(0, predictedRevenue * seasonalityFactor);

      predictions.push({
        month: getFutureMonth(i),
        predicted_revenue: Math.round(adjustedRevenue),
        growth_rate: i === 0 ? 
          ((adjustedRevenue - monthsData[n-1].revenue) / monthsData[n-1].revenue * 100).toFixed(1) :
          ((adjustedRevenue - predictions[i-1].predicted_revenue) / predictions[i-1].predicted_revenue * 100).toFixed(1),
        confidence: Math.max(50, 100 - (i * 15)) // Confidence decreases for farther predictions
      });
    }

    // Product-wise prediction
    const productSales = await Sale.findAll({
      attributes: [
        'product_id',
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'revenue'],
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'quantity']
      ],
      include: [{
        model: Product,
        attributes: ['product_name', 'product_code']
      }],
      where: {
        business_id: businessId,
        sale_date: {
          [Sequelize.Op.gte]: sixMonthsAgo
        }
      },
      group: ['product_id'],
      order: [[Sequelize.literal('revenue'), 'DESC']],
      limit: 5
    });

    const productPredictions = productSales.map(product => {
      const growthTrend = 1.05; // Assume 5% growth for top products
      return {
        product_id: product.product_id,
        product_name: product.Product.product_name,
        product_code: product.Product.product_code,
        current_revenue: parseFloat(product.dataValues.revenue) || 0,
        predicted_revenue: Math.round(parseFloat(product.dataValues.revenue) * growthTrend),
        predicted_growth: '5%',
        recommendation: 'Focus on this high-performing product'
      };
    });

    res.status(200).json({
      success: true,
      data: {
        historical_data: monthsData,
        predictions: predictions,
        product_predictions: productPredictions,
        assumptions: [
          'Based on linear trend from last 6 months',
          'Includes basic seasonality adjustment',
          'Assumes similar market conditions',
          'Does not account for major events or promotions'
        ],
        recommended_actions: [
          'Increase inventory for predicted high-demand products',
          'Plan marketing for predicted high-sales months',
          'Review and adjust production schedules',
          'Set sales targets based on predictions'
        ]
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Detect anomalies and risks
// @route   GET /api/ai/detect-anomalies
// @access  Private (Owner, Admin)
exports.detectAnomalies = async (req, res, next) => {
  try {
    const businessId = req.user.business_id;
    const anomalies = [];

    // 1. Check for sudden sales drop
    const recentSales = await Sale.findOne({
      attributes: [
        [Sequelize.fn('AVG', Sequelize.literal('quantity * unit_price')), 'avg_daily_sales']
      ],
      where: {
        business_id: businessId,
        sale_date: {
          [Sequelize.Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const historicalSales = await Sale.findOne({
      attributes: [
        [Sequelize.fn('AVG', Sequelize.literal('quantity * unit_price')), 'avg_daily_sales']
      ],
      where: {
        business_id: businessId,
        sale_date: {
          [Sequelize.Op.lt]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000),
          [Sequelize.Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const recentAvg = parseFloat(recentSales?.dataValues?.avg_daily_sales) || 0;
    const historicalAvg = parseFloat(historicalSales?.dataValues?.avg_daily_sales) || 0;

    if (historicalAvg > 0 && recentAvg < historicalAvg * 0.7) {
      anomalies.push({
        type: 'SALES_DROP',
        severity: 'HIGH',
        description: `Sales dropped by ${((historicalAvg - recentAvg) / historicalAvg * 100).toFixed(1)}% in the last week`,
        impact: 'Revenue decrease, potential cash flow issues',
        suggested_action: 'Investigate market conditions, check competitor pricing, review marketing efforts'
      });
    }

    // 2. Check for high rejection rates
    const rejectionData = await Production.findOne({
      attributes: [
        [Sequelize.fn('AVG', Sequelize.literal('(rejected_quantity/actual_quantity)*100')), 'avg_rejection_rate']
      ],
      where: {
        business_id: businessId,
        production_date: {
          [Sequelize.Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        },
        actual_quantity: { [Sequelize.Op.gt]: 0 }
      }
    });

    const rejectionRate = parseFloat(rejectionData?.dataValues?.avg_rejection_rate) || 0;
    if (rejectionRate > 10) {
      anomalies.push({
        type: 'HIGH_REJECTION',
        severity: 'MEDIUM',
        description: `Production rejection rate is ${rejectionRate.toFixed(1)}% (above 10% threshold)`,
        impact: 'Increased costs, waste of materials, lower efficiency',
        suggested_action: 'Review quality control processes, check machine maintenance, train operators'
      });
    }

    // 3. Check for low stock items
    const lowStockItems = await Product.count({
      where: {
        business_id: businessId,
        is_active: true,
        current_stock: {
          [Sequelize.Op.lte]: Sequelize.col('min_stock_level')
        }
      }
    });

    if (lowStockItems > 0) {
      anomalies.push({
        type: 'LOW_STOCK',
        severity: lowStockItems > 5 ? 'HIGH' : 'MEDIUM',
        description: `${lowStockItems} products are below minimum stock level`,
        impact: 'Risk of stockouts, lost sales opportunities',
        suggested_action: 'Place purchase orders immediately, review minimum stock levels'
      });
    }

    // 4. Check for pending payments
    const pendingPayments = await Sale.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'total_pending']
      ],
      where: {
        business_id: businessId,
        payment_status: 'Pending',
        sale_date: {
          [Sequelize.Op.lt]: new Date(new Date() - 15 * 24 * 60 * 60 * 1000) // Older than 15 days
        }
      }
    });

    const pendingAmount = parseFloat(pendingPayments?.dataValues?.total_pending) || 0;
    if (pendingAmount > 10000) {
      anomalies.push({
        type: 'OVERDUE_PAYMENTS',
        severity: 'HIGH',
        description: `₹${pendingAmount.toFixed(2)} in payments overdue by more than 15 days`,
        impact: 'Cash flow blockage, increased credit risk',
        suggested_action: 'Follow up with customers, implement stricter payment terms, offer early payment discounts'
      });
    }

    // 5. Check for cost increases
    const costData = await Product.findOne({
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('raw_material_cost')), 'avg_material_cost']
      ],
      where: {
        business_id: businessId,
        is_active: true
      }
    });

    // In a real app, compare with historical costs
    const avgCost = parseFloat(costData?.dataValues?.avg_material_cost) || 0;
    if (avgCost > 1000) { // Example threshold
      anomalies.push({
        type: 'HIGH_MATERIAL_COSTS',
        severity: 'MEDIUM',
        description: `Average material cost is ₹${avgCost.toFixed(2)} per unit`,
        impact: 'Reduced profit margins, pricing pressure',
        suggested_action: 'Negotiate with suppliers, find alternative materials, optimize material usage'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        total_anomalies: anomalies.length,
        anomalies: anomalies,
        risk_score: calculateRiskScore(anomalies),
        summary: {
          high_priority: anomalies.filter(a => a.severity === 'HIGH').length,
          medium_priority: anomalies.filter(a => a.severity === 'MEDIUM').length,
          low_priority: anomalies.filter(a => a.severity === 'LOW').length
        },
        monitoring_suggestions: [
          'Set up automated alerts for key metrics',
          'Regularly review these anomaly reports',
          'Create action plans for recurring issues',
          'Monitor competitor pricing and market trends'
        ]
      }
    });

  } catch (error) {
    next(error);
  }
};

// HELPER FUNCTIONS

async function analyzeProfitability(businessId) {
  const thirtyDaysAgo = new Date(new Date() - 30 * 24 * 60 * 60 * 1000);
  
  const salesData = await Sale.findOne({
    attributes: [
      [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'revenue']
    ],
    where: {
      business_id: businessId,
      sale_date: { [Sequelize.Op.gte]: thirtyDaysAgo }
    }
  });

  const products = await Product.findAll({
    where: { business_id: businessId, is_active: true },
    attributes: ['id', 'product_name', 'selling_price', 'raw_material_cost', 'labor_cost', 'overhead_cost']
  });

  let lowMarginProducts = [];
  let totalMargin = 0;

  products.forEach(product => {
    const cost = 
      parseFloat(product.raw_material_cost) +
      parseFloat(product.labor_cost) +
      parseFloat(product.overhead_cost);
    
    const margin = product.selling_price > 0 ? 
      ((product.selling_price - cost) / product.selling_price * 100) : 0;
    
    totalMargin += margin;

    if (margin < 20 && product.selling_price > 0) {
      lowMarginProducts.push({
        product_name: product.product_name,
        margin: margin.toFixed(1),
        selling_price: product.selling_price,
        cost: cost
      });
    }
  });

  const avgMargin = products.length > 0 ? totalMargin / products.length : 0;

  return {
    insights: [
      avgMargin < 25 ? 
        `Average profit margin is ${avgMargin.toFixed(1)}%, which is below the healthy threshold of 25%` :
        `Average profit margin is ${avgMargin.toFixed(1)}%, which is healthy`,
      
      lowMarginProducts.length > 0 ?
        `${lowMarginProducts.length} products have margins below 20%` :
        'All products have healthy profit margins',
      
      parseFloat(salesData?.dataValues?.revenue) > 0 ?
        `Last 30 days revenue: ₹${parseFloat(salesData.dataValues.revenue).toFixed(2)}` :
        'No sales recorded in the last 30 days'
    ],
    recommendations: lowMarginProducts.map(product => ({
      action: `Review pricing or reduce costs for ${product.product_name}`,
      reason: `Current margin: ${product.margin}%`,
      priority: product.margin < 10 ? 1 : product.margin < 20 ? 2 : 3
    })),
    confidence: 85
  };
}

async function analyzeSales(businessId) {
  const thirtyDaysAgo = new Date(new Date() - 30 * 24 * 60 * 60 * 1000);
  
  const salesTrend = await Sale.findAll({
    attributes: [
      [Sequelize.fn('DATE', Sequelize.col('sale_date')), 'date'],
      [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'daily_revenue']
    ],
    where: {
      business_id: businessId,
      sale_date: { [Sequelize.Op.gte]: thirtyDaysAgo }
    },
    group: [Sequelize.fn('DATE', Sequelize.col('sale_date'))],
    order: [[Sequelize.fn('DATE', Sequelize.col('sale_date')), 'DESC']],
    limit: 7
  });

  const topProducts = await Sale.findAll({
    attributes: [
      'product_id',
      [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'revenue'],
      [Sequelize.fn('SUM', Sequelize.col('quantity')), 'quantity']
    ],
    include: [{
      model: Product,
      attributes: ['product_name']
    }],
    where: {
      business_id: businessId,
      sale_date: { [Sequelize.Op.gte]: thirtyDaysAgo }
    },
    group: ['product_id'],
    order: [[Sequelize.literal('revenue'), 'DESC']],
    limit: 3
  });

  const dailyRevenues = salesTrend.map(s => parseFloat(s.dataValues.daily_revenue) || 0);
  const avgDaily = dailyRevenues.length > 0 ? 
    dailyRevenues.reduce((a, b) => a + b) / dailyRevenues.length : 0;
  
  const trend = dailyRevenues.length > 1 ?
    ((dailyRevenues[0] - dailyRevenues[dailyRevenues.length - 1]) / dailyRevenues[dailyRevenues.length - 1] * 100) : 0;

  return {
    insights: [
      `Average daily sales: ₹${avgDaily.toFixed(2)}`,
      trend > 0 ? 
        `Sales trend: UP by ${trend.toFixed(1)}% over the last week` :
        `Sales trend: DOWN by ${Math.abs(trend).toFixed(1)}% over the last week`,
      
      topProducts.length > 0 ?
        `Top product: ${topProducts[0].Product.product_name} (₹${parseFloat(topProducts[0].dataValues.revenue).toFixed(2)})` :
        'No top products identified'
    ],
    recommendations: [
      {
        action: trend < 0 ? 'Investigate recent sales drop' : 'Capitalize on positive sales trend',
        reason: trend < 0 ? 'Sales decreasing' : 'Sales increasing',
        priority: trend < -10 ? 1 : 2
      },
      {
        action: 'Focus marketing on top-performing products',
        reason: '80% of revenue often comes from 20% of products',
        priority: 2
      }
    ],
    confidence: 80
  };
}

async function analyzeInventory(businessId) {
  const products = await Product.findAll({
    where: { business_id: businessId, is_active: true },
    attributes: ['id', 'product_name', 'current_stock', 'min_stock_level']
  });

  const lowStock = products.filter(p => p.current_stock <= p.min_stock_level);
  const excessStock = products.filter(p => p.current_stock > p.min_stock_level * 3);

  const thirtyDaysAgo = new Date(new Date() - 30 * 24 * 60 * 60 * 1000);
  const slowMoving = [];

  for (const product of products) {
    const sales = await Sale.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'total_sold']
      ],
      where: {
        business_id: businessId,
        product_id: product.id,
        sale_date: { [Sequelize.Op.gte]: thirtyDaysAgo }
      }
    });

    const sold = parseInt(sales?.dataValues?.total_sold) || 0;
    if (sold === 0 && product.current_stock > 0) {
      slowMoving.push({
        product_name: product.product_name,
        current_stock: product.current_stock,
        days_of_supply: '∞'
      });
    }
  }

  return {
    insights: [
      lowStock.length > 0 ? 
        `${lowStock.length} products are below minimum stock level` :
        'All products have sufficient stock',
      
      excessStock.length > 0 ?
        `${excessStock.length} products have excess inventory (more than 3x minimum)` :
        'No excess inventory identified',
      
      slowMoving.length > 0 ?
        `${slowMoving.length} products are slow-moving (no sales in 30 days)` :
        'No slow-moving products identified'
    ],
    recommendations: [
      ...lowStock.map(p => ({
        action: `Reorder ${p.product_name}`,
        reason: `Stock: ${p.current_stock}, Minimum: ${p.min_stock_level}`,
        priority: 1
      })),
      ...excessStock.map(p => ({
        action: `Review stock levels for ${p.product_name}`,
        reason: `Excess stock: ${p.current_stock} units`,
        priority: 3
      })),
      ...slowMoving.map(p => ({
        action: `Create promotion for ${p.product_name}`,
        reason: 'No sales in last 30 days',
        priority: 2
      }))
    ],
    confidence: 90
  };
}

async function analyzeProduction(businessId) {
  const thirtyDaysAgo = new Date(new Date() - 30 * 24 * 60 * 60 * 1000);
  
  const productionData = await Production.findOne({
    attributes: [
      [Sequelize.fn('SUM', Sequelize.col('planned_quantity')), 'total_planned'],
      [Sequelize.fn('SUM', Sequelize.col('actual_quantity')), 'total_actual'],
      [Sequelize.fn('SUM', Sequelize.col('rejected_quantity')), 'total_rejected'],
      [Sequelize.fn('AVG', Sequelize.literal('(actual_quantity/planned_quantity)*100')), 'efficiency'],
      [Sequelize.fn('AVG', Sequelize.literal('(rejected_quantity/actual_quantity)*100')), 'rejection_rate']
    ],
    where: {
      business_id: businessId,
      production_date: { [Sequelize.Op.gte]: thirtyDaysAgo },
      planned_quantity: { [Sequelize.Op.gt]: 0 }
    }
  });

  const efficiency = parseFloat(productionData?.dataValues?.efficiency) || 0;
  const rejectionRate = parseFloat(productionData?.dataValues?.rejection_rate) || 0;

  return {
    insights: [
      efficiency > 0 ?
        `Production efficiency: ${efficiency.toFixed(1)}%` :
        'No production data available',
      
      rejectionRate > 0 ?
        `Quality rejection rate: ${rejectionRate.toFixed(1)}%` :
        'No rejection data available',
      
      rejectionRate > 5 ?
        `High rejection rate detected (above 5% threshold)` :
        'Rejection rate within acceptable limits'
    ],
    recommendations: [
      {
        action: efficiency < 90 ? 'Improve production planning and scheduling' : 'Maintain current efficiency',
        reason: efficiency < 90 ? 'Efficiency below target' : 'Good efficiency',
        priority: efficiency < 80 ? 1 : 3
      },
      {
        action: rejectionRate > 5 ? 'Review quality control processes' : 'Continue current quality practices',
        reason: rejectionRate > 5 ? 'High rejection rate' : 'Acceptable quality',
        priority: rejectionRate > 10 ? 1 : 2
      }
    ],
    confidence: 75
  };
}

async function analyzeCosts(businessId) {
  const products = await Product.findAll({
    where: { business_id: businessId, is_active: true },
    attributes: [
      'id', 'product_name', 
      'raw_material_cost', 'labor_cost', 'overhead_cost',
      'selling_price'
    ]
  });

  let highCostProducts = [];
  let totalMaterialCost = 0;
  let totalLaborCost = 0;
  let totalOverhead = 0;

  products.forEach(product => {
    const material = parseFloat(product.raw_material_cost) || 0;
    const labor = parseFloat(product.labor_cost) || 0;
    const overhead = parseFloat(product.overhead_cost) || 0;
    const totalCost = material + labor + overhead;
    const price = parseFloat(product.selling_price) || 0;
    
    totalMaterialCost += material;
    totalLaborCost += labor;
    totalOverhead += overhead;

    if (totalCost > price * 0.8) { // Cost > 80% of price
      highCostProducts.push({
        product_name: product.product_name,
        cost: totalCost,
        price: price,
        cost_percentage: price > 0 ? (totalCost / price * 100).toFixed(1) : 'N/A'
      });
    }
  });

  const totalProducts = products.length;
  const avgMaterial = totalProducts > 0 ? totalMaterialCost / totalProducts : 0;
  const avgLabor = totalProducts > 0 ? totalLaborCost / totalProducts : 0;
  const avgOverhead = totalProducts > 0 ? totalOverhead / totalProducts : 0;

  return {
    insights: [
      `Average material cost per product: ₹${avgMaterial.toFixed(2)}`,
      `Average labor cost per product: ₹${avgLabor.toFixed(2)}`,
      `Average overhead per product: ₹${avgOverhead.toFixed(2)}`,
      
      highCostProducts.length > 0 ?
        `${highCostProducts.length} products have costs exceeding 80% of selling price` :
        'All products have reasonable cost structures'
    ],
    recommendations: [
      ...highCostProducts.map(p => ({
        action: `Reduce costs for ${p.product_name}`,
        reason: `Cost is ${p.cost_percentage}% of selling price`,
        priority: parseFloat(p.cost_percentage) > 90 ? 1 : 2
      })),
      {
        action: avgMaterial > avgLabor * 2 ? 'Focus on material cost reduction' : 'Review labor efficiency',
        reason: avgMaterial > avgLabor * 2 ? 'Material costs are high' : 'Labor costs significant',
        priority: 2
      }
    ],
    confidence: 70
  };
}

async function analyzeRisks(businessId) {
  // Similar to detectAnomalies but focused on risk assessment
  return {
    insights: ['Risk analysis would identify potential business risks'],
    recommendations: [
      { action: 'Implement regular risk assessments', reason: 'Proactive risk management', priority: 2 }
    ],
    confidence: 65
  };
}

function calculateRiskScore(anomalies) {
  let score = 0;
  anomalies.forEach(anomaly => {
    switch (anomaly.severity) {
      case 'HIGH': score += 3; break;
      case 'MEDIUM': score += 2; break;
      case 'LOW': score += 1; break;
    }
  });
  
  if (score >= 10) return 'CRITICAL';
  if (score >= 6) return 'HIGH';
  if (score >= 3) return 'MEDIUM';
  return 'LOW';
}

function getSeasonalityFactor(monthIndex) {
  // Simple seasonality model - adjust based on business type
  const factors = [
    0.9, 0.8, 1.0, 1.1, 1.2, 1.3,  // Jan-Jun
    1.2, 1.1, 1.0, 1.1, 1.3, 1.4   // Jul-Dec
  ];
  return factors[monthIndex] || 1.0;
}

function getFutureMonth(offset) {
  const date = new Date();
  date.setMonth(date.getMonth() + offset + 1);
  return date.toISOString().slice(0, 7); // YYYY-MM
}