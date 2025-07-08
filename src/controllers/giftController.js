const { Gift } = require('../models');
const logger = require('../utils/logger');

exports.getAllGifts = async (req, res, next) => {
  try {
    const gifts = await Gift.findAll({ order: [['createdAt', 'ASC']] });
    res.status(200).json({ gifts });
  } catch (error) {
    logger.error('Erreur lors de la récupération des cadeaux:', error);
    next(error);
  }
};
