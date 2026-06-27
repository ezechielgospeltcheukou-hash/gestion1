const express = require('express');
const router = express.Router();
const { getEmployees, createEmployee, updateEmployee, deleteEmployee, resetEmployeeCode } = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');
const { employeeValidation, paginationValidation } = require('../middleware/validation');

router.get('/', protect, paginationValidation, getEmployees);
router.post('/', protect, authorize('ADMIN'), employeeValidation.create, createEmployee);
router.put('/:id', protect, authorize('ADMIN'), employeeValidation.update, updateEmployee);
router.delete('/:id', protect, authorize('ADMIN'), deleteEmployee);
router.post('/:id/reset-code', protect, authorize('ADMIN'), resetEmployeeCode);

module.exports = router;
