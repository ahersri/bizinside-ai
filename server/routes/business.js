const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Business } = require('../models');

// @desc    Get business details
// @route   GET /api/business
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const business = await Business.findByPk(req.user.business_id);
    res.json({
      success: true,
      data: business
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update business details
// @route   PUT /api/business
// @access  Private (Owner, Admin)
router.put('/', protect, authorize('Owner', 'Admin'), async (req, res, next) => {
  try {
    const business = await Business.findByPk(req.user.business_id);
    await business.update(req.body);
    res.json({
      success: true,
      data: business
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Setup business dashboard configuration
// @route   POST /api/business/setup
// @access  Private (Owner, Admin)
router.post('/setup', protect, authorize('Owner', 'Admin'), async (req, res, next) => {
  try {
    const {
      industry_type,
      business_size,
      production_type,
      modules,
      data_source,
      alerts,
      view_preferences,
      business_goals
    } = req.body;

    const business = await Business.findByPk(req.user.business_id);
    
    await business.update({
      dashboard_config: {
        industry_type,
        business_size,
        production_type,
        modules: modules || [],
        alerts: alerts || [],
        view_preferences: view_preferences || {},
        business_goals: business_goals || []
      },
      data_source_config: data_source || {}
    });

    res.json({
      success: true,
      message: 'Business dashboard configured successfully',
      data: business.dashboard_config
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;