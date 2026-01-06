const jwt = require('jsonwebtoken');
const { User, Business } = require('../models');
const { logger } = require('../utils/logger');
const { sendEmail } = require('../services/emailService');

const generateToken = (userId, role, businessId) => {
  return jwt.sign(
    { userId, role, businessId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { business: businessData, owner: ownerData } = req.body;

    // Check if business email already exists
    const existingBusiness = await Business.findOne({
      where: { business_email: businessData.business_email }
    });

    if (existingBusiness) {
      return res.status(400).json({
        error: 'Business with this email already exists'
      });
    }

    // Create business
    const business = await Business.create(businessData);

    // Create owner user
    const user = await User.create({
      ...ownerData,
      business_id: business.id,
      role: 'Owner',
      email_verified: true
    });

    // Generate token
    const token = generateToken(user.id, user.role, business.id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          business_name: business.business_name
        },
        business: {
          id: business.id,
          business_name: business.business_name,
          business_type: business.business_type
        }
      },
      message: 'Registration successful'
    });

    // Send welcome email
    await sendEmail({
      to: user.email,
      subject: 'Welcome to BizInside.ai',
      template: 'welcome',
      data: {
        name: user.full_name,
        business_name: business.business_name
      }
    });

  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Business,
        attributes: ['id', 'business_name', 'business_type', 'status']
      }]
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        error: 'Invalid credentials or account inactive'
      });
    }

    // Verify password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user.id, user.role, user.business_id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          business_name: user.Business.business_name
        }
      },
      message: 'Login successful'
    });

  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      include: [{
        model: Business,
        attributes: ['id', 'business_name', 'business_type', 'industry']
      }]
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch profile'
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone, designation } = req.body;
    
    const user = await User.findByPk(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    await user.update({
      full_name: full_name || user.full_name,
      phone: phone || user.phone,
      designation: designation || user.designation
    });

    res.json({
      success: true,
      data: { user },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to update profile'
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    const user = await User.findByPk(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Verify current password
    const isValid = await user.verifyPassword(current_password);
    if (!isValid) {
      return res.status(400).json({
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password_hash = new_password;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    logger.error(`Update password error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to update password'
    });
  }
};