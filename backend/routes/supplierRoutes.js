const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  recordSupplierPayment,
  getSupplierPayments
} = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/auth');
const { supplierValidation, paginationValidation } = require('../middleware/validation');

router.get('/', protect, paginationValidation, getSuppliers);
router.post('/payment', protect, authorize('ADMIN'), recordSupplierPayment);
router.get('/:supplierId/payments', protect, paginationValidation, getSupplierPayments);
router.get('/:id', protect, getSupplierById);
router.post('/', protect, authorize('ADMIN'), supplierValidation.create, createSupplier);
router.put('/:id', protect, authorize('ADMIN'), updateSupplier);
router.delete('/:id', protect, authorize('ADMIN'), deleteSupplier);

module.exports = router;
