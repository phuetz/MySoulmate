const photoAnalysisService = require('../services/photoAnalysisService');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Analyze uploaded photo
 */
const analyzePhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageUrl, provider = 'gpt4vision' } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    // Get user's companion details for personalized response
    const user = await User.findByPk(userId);

    const companionContext = {
      companionName: user.companionName || 'Companion',
      companionPersonality: {
        friendly: 0.9,
        caring: 0.9,
        playful: 0.7,
        supportive: 0.9
      },
      provider
    };

    // Analyze photo
    const analysis = await photoAnalysisService.analyzePhoto(imageUrl, companionContext);

    // Generate follow-up question
    const followUpQuestion = photoAnalysisService.generateFollowUpQuestion(analysis.structured);

    res.json({
      success: true,
      analysis: {
        response: analysis.response,
        followUpQuestion,
        structured: analysis.structured,
        provider: analysis.provider
      }
    });
  } catch (error) {
    logger.error('Error analyzing photo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error analyzing photo'
    });
  }
};

/**
 * Get supported vision providers
 */
const getProviders = async (req, res) => {
  try {
    const providers = Object.entries(photoAnalysisService.VISION_PROVIDERS).map(([key, value]) => ({
      id: key,
      name: value.name,
      quality: value.quality,
      speed: value.speed
    }));

    res.json({
      success: true,
      providers
    });
  } catch (error) {
    logger.error('Error getting providers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching providers'
    });
  }
};

module.exports = {
  analyzePhoto,
  getProviders
};
