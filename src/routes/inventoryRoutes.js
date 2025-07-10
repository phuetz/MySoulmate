const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, inventoryController.getInventory);
router.post('/', protect, inventoryController.addGift);

module.exports = router;
