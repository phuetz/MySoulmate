const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Payment provider webhook endpoint
router.post('/webhook', express.json({ type: '*/*' }), paymentController.handleWebhook);

// Generate receipt
router.post('/receipt', paymentController.generateReceipt);

module.exports = router;
