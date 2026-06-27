const express = require('express');
const router = express.Router();
const { register, login, loginByCode, getMe, updateProfile } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { authValidation } = require('../middleware/validation');
const User = require('../models/User');

const openRegisterIfEmpty = async (req, res, next) => {
  try {
    const userCount = await User.count();
    if (userCount === 0) {
      return next();
    }
    return protect(req, res, () => authorize('ADMIN')(req, res, next));
  } catch (error) {
    return next();
  }
};

router.post('/register', openRegisterIfEmpty, authValidation.register, register);
router.post('/login', authValidation.login, login);
router.post('/login-by-code', loginByCode);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
