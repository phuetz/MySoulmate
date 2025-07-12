const express = require('express');
const router = express.Router();
const companionController = require('../controllers/companionController');

router.get('/', companionController.getCompanion);

module.exports = router;
