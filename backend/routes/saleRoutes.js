const express = require('express');
const router = express.Router();
const {
  getSales,
  getSaleById,
  createSale,
  deleteSale,
  getSalesStats
} = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/auth');
const { saleValidation, paginationValidation } = require('../middleware/validation');

router.get('/', protect, paginationValidation, getSales);
router.get('/stats', protect, getSalesStats);
router.get('/:id', protect, getSaleById);
router.post('/', protect, saleValidation.create, createSale);
router.delete('/:id', protect, authorize('ADMIN'), deleteSale);

module.exports = router;
