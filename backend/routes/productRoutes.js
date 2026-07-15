const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { productValidation, paginationValidation } = require('../middleware/validation');

router.get('/', protect, paginationValidation, getProducts);
router.get('/:id', protect, getProductById);
router.post('/', protect, authorize('ADMIN'), productValidation.create, createProduct);
router.put('/:id', protect, authorize('ADMIN'), productValidation.update, updateProduct);
router.delete('/:id', protect, deleteProduct);
router.post('/:id/adjust-stock', protect, adjustStock);

module.exports = router;
