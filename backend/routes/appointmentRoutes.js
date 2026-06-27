const express = require('express');
const router = express.Router();
const { getAppointments, createAppointment, updateAppointment, deleteAppointment } = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');
const { appointmentValidation, paginationValidation } = require('../middleware/validation');

router.use(protect);
router.get('/', paginationValidation, getAppointments);
router.post('/', appointmentValidation.create, createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

module.exports = router;
