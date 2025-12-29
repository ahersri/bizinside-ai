const { Sale, Product, InventoryTransaction, Business } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const Sequelize = require('sequelize');

// @desc    Get Profit & Loss Statement
// @route   GET /api/finance/profit-loss
// @access  Private (Owner, Admin, Accountant)
exports.getProfitLoss = async (req, res, next) => {
  try {
    const { startDate, endDate, format = 'summary' } = req.query;
    const businessId = req.user.business_id;

    // Set date range (default: current month)
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const dateRange = {
      start: startDate ? new Date(startDate) : defaultStart,
      end: endDate ? new Date(endDate) : defaultEnd
    };

    // REVENUE: Total Sales
    const revenueData = await Sale.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'total_revenue'],
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price * gst_percentage / 100')), 'total_gst']
      ],
      where: {
        business_id: businessId,
        sale_date: {
          [Sequelize.Op.between]: [dateRange.start, dateRange.end]
        }
      }
    });

    const totalRevenue = parseFloat(revenueData?.dataValues?.total_revenue) || 0;
    const totalGST = parseFloat(revenueData?.dataValues?.total_gst) || 0;
    const netRevenue = totalRevenue - totalGST;

    // COST OF GOODS SOLD (COGS)
    // Calculate based on products sold
    const cogsData = await Sale.findAll({
      attributes: [
        'product_id',
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'total_sold']
      ],
      include: [{
        model: Product,
        attributes: ['raw_material_cost', 'labor_cost', 'overhead_cost']
      }],
      where: {
        business_id: businessId,
        sale_date: {
          [Sequelize.Op.between]: [dateRange.start, dateRange.end]
        }
      },
      group: ['product_id']
    });

    let totalCOGS = 0;
    const cogsDetails = [];

    for (const item of cogsData) {
      const productCost = 
        parseFloat(item.Product.raw_material_cost) +
        parseFloat(item.Product.labor_cost) +
        parseFloat(item.Product.overhead_cost);
      
      const itemCOGS = productCost * parseInt(item.dataValues.total_sold);
      totalCOGS += itemCOGS;

      cogsDetails.push({
        product_id: item.product_id,
        quantity_sold: parseInt(item.dataValues.total_sold),
        unit_cost: productCost,
        total_cost: itemCOGS
      });
    }

    // OPERATING EXPENSES (from inventory transactions)
    const expensesData = await InventoryTransaction.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('total_value')), 'total_expenses']
      ],
      where: {
        business_id: businessId,
        transaction_type: {
          [Sequelize.Op.in]: ['Wastage', 'Adjustment']
        },
        transaction_date: {
          [Sequelize.Op.between]: [dateRange.start, dateRange.end]
        }
      }
    });

    const operatingExpenses = parseFloat(expensesData?.dataValues?.total_expenses) || 0;

    // CALCULATE PROFIT
    const grossProfit = netRevenue - totalCOGS;
    const netProfit = grossProfit - operatingExpenses;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100).toFixed(2) : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100).toFixed(2) : 0;

    // Product-wise profitability
    const productProfitability = await Sale.findAll({
      attributes: [
        'product_id',
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'revenue'],
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'quantity_sold']
      ],
      include: [{
        model: Product,
        attributes: ['product_name', 'product_code', 'raw_material_cost', 'labor_cost', 'overhead_cost']
      }],
      where: {
        business_id: businessId,
        sale_date: {
          [Sequelize.Op.between]: [dateRange.start, dateRange.end]
        }
      },
      group: ['product_id'],
      order: [[Sequelize.literal('revenue'), 'DESC']]
    });

    const productAnalysis = productProfitability.map(item => {
      const revenue = parseFloat(item.dataValues.revenue) || 0;
      const quantity = parseInt(item.dataValues.quantity_sold) || 0;
      const product = item.Product;
      
      const unitCost = 
        parseFloat(product.raw_material_cost) +
        parseFloat(product.labor_cost) +
        parseFloat(product.overhead_cost);
      
      const totalCost = unitCost * quantity;
      const profit = revenue - totalCost;
      const margin = revenue > 0 ? (profit / revenue * 100).toFixed(2) : 0;

      return {
        product_id: item.product_id,
        product_name: product.product_name,
        product_code: product.product_code,
        quantity_sold: quantity,
        revenue: revenue,
        cost: totalCost,
        profit: profit,
        margin: parseFloat(margin),
        unit_price: revenue / quantity,
        unit_cost: unitCost
      };
    });

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Sale.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('sale_date'), '%Y-%m'), 'month'],
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'revenue'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'transactions']
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

    res.status(200).json({
      success: true,
      data: {
        period: {
          start: dateRange.start,
          end: dateRange.end,
          days: Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24))
        },
        income_statement: {
          revenue: {
            total_sales: totalRevenue,
            gst_collected: totalGST,
            net_revenue: netRevenue
          },
          cost_of_goods_sold: {
            total_cogs: totalCOGS,
            details: format === 'detailed' ? cogsDetails : undefined
          },
          gross_profit: {
            amount: grossProfit,
            margin_percentage: parseFloat(grossMargin)
          },
          operating_expenses: {
            total: operatingExpenses,
            breakdown: {
              wastage: 0, // Could be detailed further
              adjustments: 0
            }
          },
          net_profit: {
            amount: netProfit,
            margin_percentage: parseFloat(netMargin)
          }
        },
        product_analysis: productAnalysis,
        monthly_trend: monthlyTrend,
        key_metrics: {
          average_order_value: totalRevenue / (cogsDetails.length || 1),
          profit_per_product: netProfit / (productAnalysis.length || 1),
          best_selling_product: productAnalysis.length > 0 ? productAnalysis[0] : null,
          worst_margin_product: productAnalysis.length > 0 ? 
            productAnalysis.reduce((min, p) => p.margin < min.margin ? p : min) : null
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get Balance Sheet
// @route   GET /api/finance/balance-sheet
// @access  Private (Owner, Admin, Accountant)
exports.getBalanceSheet = async (req, res, next) => {
  try {
    const { asOfDate } = req.query;
    const businessId = req.user.business_id;

    const balanceDate = asOfDate ? new Date(asOfDate) : new Date();

    // ASSETS
    // 1. Current Assets
    // a) Inventory Value
    const inventoryValue = await Product.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.literal('current_stock * (raw_material_cost + labor_cost + overhead_cost)')), 'total_value']
      ],
      where: {
        business_id: businessId,
        is_active: true
      }
    });

    // b) Accounts Receivable (Pending payments)
    const accountsReceivable = await Sale.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'total_outstanding']
      ],
      where: {
        business_id: businessId,
        payment_status: 'Pending',
        sale_date: {
          [Sequelize.Op.lte]: balanceDate
        }
      }
    });

    // 2. Fixed Assets (simplified - could be from separate table)
    const fixedAssets = 0; // In real app, this would come from assets table

    // LIABILITIES
    // Accounts Payable (simplified)
    const accountsPayable = 0; // In real app, this would come from purchase orders

    // EQUITY
    // Calculate equity as Assets - Liabilities
    const totalAssets = 
      (parseFloat(inventoryValue?.dataValues?.total_value) || 0) +
      (parseFloat(accountsReceivable?.dataValues?.total_outstanding) || 0) +
      fixedAssets;

    const totalLiabilities = accountsPayable;
    const totalEquity = totalAssets - totalLiabilities;

    res.status(200).json({
      success: true,
      data: {
        as_of_date: balanceDate,
        assets: {
          current_assets: {
            inventory: parseFloat(inventoryValue?.dataValues?.total_value) || 0,
            accounts_receivable: parseFloat(accountsReceivable?.dataValues?.total_outstanding) || 0,
            total_current_assets: 
              (parseFloat(inventoryValue?.dataValues?.total_value) || 0) +
              (parseFloat(accountsReceivable?.dataValues?.total_outstanding) || 0)
          },
          fixed_assets: fixedAssets,
          total_assets: totalAssets
        },
        liabilities: {
          current_liabilities: {
            accounts_payable: accountsPayable,
            total_current_liabilities: accountsPayable
          },
          total_liabilities: totalLiabilities
        },
        equity: {
          owners_equity: totalEquity,
          total_equity: totalEquity
        },
        balance_check: totalAssets === (totalLiabilities + totalEquity) ? 'BALANCED' : 'UNBALANCED'
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get Cash Flow Statement
// @route   GET /api/finance/cash-flow
// @access  Private (Owner, Admin, Accountant)
exports.getCashFlow = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const businessId = req.user.business_id;

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const dateRange = {
      start: startDate ? new Date(startDate) : defaultStart,
      end: endDate ? new Date(endDate) : defaultEnd
    };

    // CASH FLOW FROM OPERATING ACTIVITIES
    // Cash received from customers (Paid sales)
    const cashSales = await Sale.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'total_cash_in']
      ],
      where: {
        business_id: businessId,
        payment_status: 'Paid',
        sale_date: {
          [Sequelize.Op.between]: [dateRange.start, dateRange.end]
        }
      }
    });

    // Cash paid for inventory (Purchases)
    const cashPurchases = await InventoryTransaction.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('total_value')), 'total_cash_out']
      ],
      where: {
        business_id: businessId,
        transaction_type: 'Purchase',
        transaction_date: {
          [Sequelize.Op.between]: [dateRange.start, dateRange.end]
        }
      }
    });

    const operatingCashFlow = 
      (parseFloat(cashSales?.dataValues?.total_cash_in) || 0) -
      (parseFloat(cashPurchases?.dataValues?.total_cash_out) || 0);

    // CASH FLOW FROM INVESTING ACTIVITIES (simplified)
    const investingCashFlow = 0; // In real app, from assets table

    // CASH FLOW FROM FINANCING ACTIVITIES (simplified)
    const financingCashFlow = 0; // In real app, from loans/investments table

    // NET CASH FLOW
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

    // Cash flow trend (daily for last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyCashFlow = await Sale.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('sale_date')), 'date'],
        [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN payment_status = "Paid" THEN quantity * unit_price ELSE 0 END')), 'cash_in'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'transactions']
      ],
      where: {
        business_id: businessId,
        sale_date: {
          [Sequelize.Op.between]: [sevenDaysAgo, dateRange.end]
        }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('sale_date'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('sale_date')), 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        period: {
          start: dateRange.start,
          end: dateRange.end
        },
        cash_flow_statement: {
          operating_activities: {
            cash_received_from_customers: parseFloat(cashSales?.dataValues?.total_cash_in) || 0,
            cash_paid_for_inventory: parseFloat(cashPurchases?.dataValues?.total_cash_out) || 0,
            net_cash_from_operations: operatingCashFlow
          },
          investing_activities: {
            net_cash_from_investing: investingCashFlow
          },
          financing_activities: {
            net_cash_from_financing: financingCashFlow
          },
          net_increase_in_cash: netCashFlow
        },
        daily_trend: dailyCashFlow,
        cash_position: {
          operating_cash_flow_ratio: operatingCashFlow > 0 ? 'POSITIVE' : 'NEGATIVE',
          days_of_cash_cover: operatingCashFlow > 0 ? 'ADEQUATE' : 'INADEQUATE'
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Generate financial report (PDF/Excel)
// @route   POST /api/finance/generate-report
// @access  Private (Owner, Admin, Accountant)
exports.generateReport = async (req, res, next) => {
  try {
    const { report_type, startDate, endDate, format = 'json' } = req.body;
    
    const validReports = ['profit_loss', 'balance_sheet', 'cash_flow', 'inventory_valuation'];
    if (!validReports.includes(report_type)) {
      throw new AppError(`Invalid report type. Valid types: ${validReports.join(', ')}`, 400);
    }

    const business = await Business.findByPk(req.user.business_id);

    let reportData;
    const now = new Date();

    switch (report_type) {
      case 'profit_loss':
        reportData = await this.getProfitLossData(req.user.business_id, startDate, endDate);
        break;
      case 'balance_sheet':
        reportData = await this.getBalanceSheetData(req.user.business_id, endDate || now);
        break;
      case 'cash_flow':
        reportData = await this.getCashFlowData(req.user.business_id, startDate, endDate);
        break;
      case 'inventory_valuation':
        reportData = await this.getInventoryValuationData(req.user.business_id);
        break;
    }

    // Add report metadata
    const report = {
      metadata: {
        report_id: `REP-${business.id}-${Date.now()}`,
        report_type: report_type,
        generated_at: new Date().toISOString(),
        period: {
          start: startDate || new Date(now.getFullYear(), now.getMonth(), 1),
          end: endDate || now
        },
        business: {
          name: business.business_name,
          id: business.id,
          industry: business.industry
        },
        generated_by: {
          user_id: req.user.id,
          user_name: req.user.full_name,
          role: req.user.role
        }
      },
      data: reportData
    };

    if (format === 'pdf') {
      // In production, use libraries like pdfkit or puppeteer
      res.status(200).json({
        success: true,
        message: 'PDF generation would be implemented here',
        data: report,
        download_url: `/api/finance/download/${report.metadata.report_id}.pdf`
      });
    } else {
      res.status(200).json({
        success: true,
        data: report
      });
    }

  } catch (error) {
    next(error);
  }
};

// Helper methods for report generation
exports.getProfitLossData = async (businessId, startDate, endDate) => {
  // Implementation would extract from getProfitLoss method
  return { summary: 'Profit Loss Data' };
};

exports.getBalanceSheetData = async (businessId, asOfDate) => {
  // Implementation would extract from getBalanceSheet method
  return { summary: 'Balance Sheet Data' };
};

exports.getCashFlowData = async (businessId, startDate, endDate) => {
  // Implementation would extract from getCashFlow method
  return { summary: 'Cash Flow Data' };
};

exports.getInventoryValuationData = async (businessId) => {
  const inventory = await Product.findAll({
    where: { business_id: businessId, is_active: true },
    attributes: [
      'id', 'product_code', 'product_name', 'category', 'unit',
      'current_stock', 'raw_material_cost', 'labor_cost', 'overhead_cost',
      [Sequelize.literal('current_stock * (raw_material_cost + labor_cost + overhead_cost)'), 'total_value']
    ],
    order: [[Sequelize.literal('total_value'), 'DESC']]
  });

  return {
    total_items: inventory.length,
    total_value: inventory.reduce((sum, item) => sum + parseFloat(item.dataValues.total_value), 0),
    items: inventory
  };
};