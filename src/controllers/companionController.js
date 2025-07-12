const companion = require('../data/companion');

exports.getCompanion = async (req, res, next) => {
  try {
    res.status(200).json({ companion });
  } catch (error) {
    next(error);
  }
};
