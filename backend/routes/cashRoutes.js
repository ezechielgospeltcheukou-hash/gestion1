const express = require('express');
const router = express.Router();
const { getCashTransactions, createCashTransaction, deleteCashTransaction } = require('../controllers/cashController');
const { protect, authorize } = require('../middleware/auth');
const { cashValidation, paginationValidation } = require('../middleware/validation');

router.use(protect);
router.get('/', paginationValidation, getCashTransactions);
router.post('/', authorize('ADMIN'), cashValidation.create, createCashTransaction);
router.delete('/:id', authorize('ADMIN'), deleteCashTransaction);

module.exports = router;
