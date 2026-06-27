const express = require('express');
const router = express.Router();
const {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesStats
} = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');
const { expenseValidation, paginationValidation } = require('../middleware/validation');

router.get('/', protect, paginationValidation, getExpenses);
router.get('/stats', protect, getExpensesStats);
router.get('/:id', protect, getExpenseById);
router.post('/', protect, authorize('ADMIN'), expenseValidation.create, createExpense);
router.put('/:id', protect, authorize('ADMIN'), updateExpense);
router.delete('/:id', protect, authorize('ADMIN'), deleteExpense);

module.exports = router;
