const express = require('express');
const router = express.Router();
const { getMessages, createMessage, deleteMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { messageValidation, paginationValidation } = require('../middleware/validation');

router.use(protect);
router.get('/', paginationValidation, getMessages);
router.post('/', messageValidation.create, createMessage);
router.delete('/:id', deleteMessage);

module.exports = router;
