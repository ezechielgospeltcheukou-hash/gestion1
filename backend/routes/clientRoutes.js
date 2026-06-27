const express = require('express');
const router = express.Router();
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} = require('../controllers/clientController');
const { protect, authorize } = require('../middleware/auth');
const { clientValidation, paginationValidation } = require('../middleware/validation');

router.get('/', protect, paginationValidation, getClients);
router.get('/:id', protect, getClientById);
router.post('/', protect, clientValidation.create, createClient);
router.put('/:id', protect, authorize('ADMIN'), clientValidation.update, updateClient);
router.delete('/:id', protect, authorize('ADMIN'), deleteClient);

module.exports = router;
