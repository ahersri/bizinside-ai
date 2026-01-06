const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorMiddleware');

// Public routes
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));

// Protected routes
router.get('/me', authenticate, asyncHandler(authController.getProfile));
router.put('/update', authenticate, asyncHandler(authController.updateProfile));
router.put('/updatepassword', authenticate, asyncHandler(authController.updatePassword));

module.exports = router;