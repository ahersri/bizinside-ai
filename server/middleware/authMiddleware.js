const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { logger } = require('../utils/logger');

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({
        error: 'Invalid or inactive user'
      });
    }

    req.user = decoded;
    req.user.business_id = user.business_id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }
    logger.error(`Authentication error: ${error.message}`);
    res.status(500).json({
      error: 'Authentication failed'
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

exports.businessAccess = async (req, res, next) => {
  try {
    const businessId = req.params.businessId || req.body.business_id;
    
    if (businessId && businessId !== req.user.business_id) {
      return res.status(403).json({
        error: 'Access denied to this business'
      });
    }
    
    next();
  } catch (error) {
    logger.error(`Business access error: ${error.message}`);
    res.status(500).json({
      error: 'Access validation failed'
    });
  }
};