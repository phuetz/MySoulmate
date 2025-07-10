const { UserGift, Gift } = require('../models');
const logger = require('../utils/logger');

exports.getInventory = async (req, res, next) => {
  try {
    const items = await UserGift.findAll({
      where: { userId: req.user.id },
      include: [{ model: Gift, as: 'gift' }]
    });
    res.status(200).json({ items });
  } catch (error) {
    logger.error('Erreur lors de la récupération de linventaire:', error);
    next(error);
  }
};

exports.addGift = async (req, res, next) => {
  try {
    const { giftId, quantity = 1 } = req.body;
    const gift = await Gift.findByPk(giftId);
    if (!gift) {
      return res.status(404).json({ message: 'Gift not found' });
    }
    const [item, created] = await UserGift.findOrCreate({
      where: { userId: req.user.id, giftId },
      defaults: { quantity }
    });
    if (!created) {
      item.quantity += quantity;
      await item.save();
    }
    res.status(200).json({ message: 'Gift added', item });
  } catch (error) {
    logger.error('Erreur lors de lajout de cadeau à linventaire:', error);
    next(error);
  }
};
