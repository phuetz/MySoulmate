const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');

router.get('/import', calendarController.importFromUrl);

module.exports = router;
