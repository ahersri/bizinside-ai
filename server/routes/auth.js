const express = require('express');
const router = express.Router();
const {
  registerBusiness,
  loginUser,
  getMe,
  updateDetails,
  updatePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', registerBusiness);
router.post('/login', loginUser);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;