const express = require('express');
const router = express.Router();
const { getBilan } = require('../controllers/bilanController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getBilan);

module.exports = router;
