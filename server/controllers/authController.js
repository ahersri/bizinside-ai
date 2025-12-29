const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Business, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
// const sendEmail = require('../utils/email'); // Uncomment when email is set up

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register business & owner
// @route   POST /api/auth/register
// @access  Public
exports.registerBusiness = async (req, res, next) => {
  try {
    const { business, owner } = req.body;

    // Validate required fields
    if (!business || !owner) {
      throw new AppError('Business and owner details are required', 400);
    }

    // Check if business email exists
    const existingBusiness = await Business.findOne({ 
      where: { business_email: business.business_email } 
    });
    
    if (existingBusiness) {
      throw new AppError('Business email already registered', 400);
    }

    // Check if owner email exists
    const existingUser = await User.findOne({ 
      where: { email: owner.email } 
    });
    
    if (existingUser) {
      throw new AppError('Owner email already registered', 400);
    }

    // Create business
    const newBusiness = await Business.create({
      business_name: business.business_name,
      business_email: business.business_email,
      phone: business.phone || null,
      mobile: business.mobile,
      gst_number: business.gst_number || null,
      pan_number: business.pan_number || null,
      business_type: business.business_type || 'Small Business',
      industry: business.industry || 'Manufacturing',
      establishment_year: business.establishment_year || new Date().getFullYear(),
      employee_count: business.employee_count || '1-5',
      country: business.country || 'India',
      state: business.state || null,
      city: business.city || null,
      pincode: business.pincode || null,
      address: business.address || null,
      is_multi_location: business.is_multi_location || false
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(owner.password, salt);

    // Create owner user
    const newUser = await User.create({
      business_id: newBusiness.id,
      full_name: owner.full_name,
      email: owner.email,
      password_hash: hashedPassword,
      mobile: owner.mobile || null,
      designation: owner.designation || 'Owner',
      role: 'Owner'
    });

    // Generate token
    const token = generateToken(newUser.id);

    // Update last login
    await newUser.update({ last_login: new Date() });

    // Send welcome email (optional)
    // try {
    //   await sendEmail({
    //     email: owner.email,
    //     subject: 'Welcome to bizinside.ai',
    //     html: `<h1>Welcome ${owner.full_name}!</h1>`
    //   });
    // } catch (emailError) {
    //   console.log('Email sending failed:', emailError);
    // }

    res.status(201).json({
      success: true,
      token,
      data: {
        business: {
          id: newBusiness.id,
          business_name: newBusiness.business_name,
          business_email: newBusiness.business_email,
          industry: newBusiness.industry
        },
        user: {
          id: newUser.id,
          full_name: newUser.full_name,
          email: newUser.email,
          role: newUser.role
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Validate email & password
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    // Get user with business
    const user = await User.findOne({
      where: { email },
      include: [{ model: Business }]
    });

    if (!user || !user.is_active) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if role matches (if specified)
    if (role && user.role !== role) {
      throw new AppError(`You are not registered as ${role}`, 401);
    }

    // Check password
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate token
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      token,
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          business_id: user.business_id,
          business_name: user.Business.business_name,
          industry: user.Business.industry
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Business }],
      attributes: { exclude: ['password_hash'] }
    });

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/auth/update
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      full_name: req.body.full_name,
      mobile: req.body.mobile,
      designation: req.body.designation
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByPk(req.user.id);
    await user.update(fieldsToUpdate);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          mobile: user.mobile,
          designation: user.designation,
          role: user.role
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findByPk(req.user.id);

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    next(error);
  }
};