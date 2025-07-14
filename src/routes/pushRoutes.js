const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushController');

router.post('/register', pushController.registerToken);
router.post('/send', pushController.sendNotification);

module.exports = router;
