const OpenAI = require('openai');
const fs = require('fs');
const logger = require('../utils/logger');

let openai;

exports.generateAvatar = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'test') {
      if (!req.file) {
        return res.status(400).json({ message: 'Image file is required' });
      }
      return res.status(200).json({ avatarUrl: 'http://example.com/avatar.png' });
    }
    if (!openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
      }
      openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const response = await openai.images.createVariation({
      image: fs.createReadStream(req.file.path),
      n: 1,
      size: '512x512'
    });

    fs.unlink(req.file.path, () => {});

    const url = response.data?.data?.[0]?.url;
    if (!url) {
      throw new Error('No image returned from AI service');
    }
    res.status(200).json({ avatarUrl: url });
  } catch (error) {
    logger.error('Erreur lors de la génération d\'avatar:', error);
    next(error);
  }
};
