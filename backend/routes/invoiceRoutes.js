const express = require('express');
const router = express.Router();
const { getInvoices, createInvoice, updateInvoice, deleteInvoice } = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');
const { invoiceValidation, paginationValidation } = require('../middleware/validation');

router.use(protect);
router.get('/', paginationValidation, getInvoices);
router.post('/', authorize('ADMIN'), invoiceValidation.create, createInvoice);
router.put('/:id', authorize('ADMIN'), updateInvoice);
router.delete('/:id', authorize('ADMIN'), deleteInvoice);

module.exports = router;
