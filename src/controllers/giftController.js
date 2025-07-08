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
exports.getGiftById = async (req, res, next) => {
  try {
    const gift = await Gift.findByPk(req.params.id);
    if (!gift) {
      return res.status(404).json({ message: 'Cadeau non trouve' });
    }
    res.status(200).json(gift);
  } catch (error) {
    logger.error(`Erreur lors de la recuperation du cadeau ${req.params.id}:`, error);
    next(error);
  }
};

exports.createGift = async (req, res, next) => {
  try {
    const gift = await Gift.create(req.body);
    res.status(201).json({ message: 'Cadeau cree avec succes', gift });
  } catch (error) {
    logger.error('Erreur lors de la creation du cadeau:', error);
    next(error);
  }
};

exports.updateGift = async (req, res, next) => {
  try {
    const gift = await Gift.findByPk(req.params.id);
    if (!gift) {
      return res.status(404).json({ message: 'Cadeau non trouve' });
    }
    await gift.update(req.body);
    res.status(200).json({ message: 'Cadeau mis a jour avec succes', gift });
  } catch (error) {
    logger.error(`Erreur lors de la mise a jour du cadeau ${req.params.id}:`, error);
    next(error);
  }
};

exports.deleteGift = async (req, res, next) => {
  try {
    const gift = await Gift.findByPk(req.params.id);
    if (!gift) {
      return res.status(404).json({ message: 'Cadeau non trouve' });
    }
    await gift.destroy();
    res.status(200).json({ message: 'Cadeau supprime avec succes' });
  } catch (error) {
    logger.error(`Erreur lors de la suppression du cadeau ${req.params.id}:`, error);
    next(error);
  }
};

