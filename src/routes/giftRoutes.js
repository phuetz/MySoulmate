const express = require('express');
const router = express.Router();
const giftController = require('../controllers/giftController');

router.get('/', giftController.getAllGifts);

module.exports = router;
