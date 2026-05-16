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

router.get('/', protect, getClients);
router.get('/:id', protect, getClientById);
router.post('/', protect, createClient);
router.put('/:id', protect, authorize('ADMIN'), updateClient);
router.delete('/:id', protect, authorize('ADMIN'), deleteClient);

module.exports = router;
