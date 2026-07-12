const express = require('express');
const router = express.Router();
const { register, login, loginByCode, getMe, updateProfile, refreshToken, logout } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { authValidation } = require('../middleware/validation');
const User = require('../models/User');

router.post('/register', authValidation.register, register);
router.post('/login', authValidation.login, login);
router.post('/login-by-code', loginByCode);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);

module.exports = router;
