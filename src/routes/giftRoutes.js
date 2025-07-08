const express = require('express');
const router = express.Router();
const giftController = require('../controllers/giftController');
const { protect, restrictToAdmin } = require('../middleware/authMiddleware');
const { validateGift } = require('../middleware/validationMiddleware');

router.get('/', giftController.getAllGifts);
router.get('/:id', giftController.getGiftById);
router.post('/', protect, restrictToAdmin, validateGift, giftController.createGift);
router.put('/:id', protect, restrictToAdmin, validateGift, giftController.updateGift);
router.delete('/:id', protect, restrictToAdmin, giftController.deleteGift);

module.exports = router;
