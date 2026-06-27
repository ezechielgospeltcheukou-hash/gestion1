const express = require('express');
const router = express.Router();
const { getCredits, createCredit, updateCredit, deleteCredit } = require('../controllers/creditController');
const { protect, authorize } = require('../middleware/auth');
const { creditValidation, paginationValidation } = require('../middleware/validation');

router.use(protect);
router.get('/', paginationValidation, getCredits);
router.post('/', authorize('ADMIN'), creditValidation.create, createCredit);
router.put('/:id', authorize('ADMIN'), updateCredit);
router.delete('/:id', authorize('ADMIN'), deleteCredit);

module.exports = router;
