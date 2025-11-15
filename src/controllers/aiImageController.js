const aiImageService = require('../services/aiImageService');
const { AIImage, User } = require('../models');
const logger = require('../utils/logger');

/**
 * Generate AI image
 */
const generateImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      prompt,
      provider = 'dalle3',
      style = 'realistic',
      companionId,
      companionName,
      setting,
      outfit,
      pose,
      width = 1024,
      height = 1024,
      quality = 'hd'
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    // Check premium status for certain features
    const user = await User.findByPk(userId);

    // Ultra quality and large sizes require premium
    if ((quality === 'ultra' || width > 1024 || height > 1024) && !user.isPremium) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required for ultra quality and large sizes',
        upgrade: true
      });
    }

    // Calculate and show cost
    const cost = aiImageService.calculateCost({
      provider,
      quality,
      width,
      height
    });

    if (user.coins < cost) {
      return res.status(402).json({
        success: false,
        message: `Insufficient coins. Need ${cost} coins, you have ${user.coins}`,
        cost,
        currentCoins: user.coins,
        purchaseUrl: '/api/v1/payments/coins'
      });
    }

    // Generate image
    const image = await aiImageService.generateImage(userId, prompt, {
      provider,
      style,
      companionId,
      companionName,
      setting,
      outfit,
      pose,
      width,
      height,
      quality
    });

    res.json({
      success: true,
      image: {
        id: image.id,
        imageUrl: image.imageUrl,
        thumbnailUrl: image.thumbnailUrl,
        prompt: image.prompt,
        enhancedPrompt: image.enhancedPrompt,
        provider: image.provider,
        style: image.style,
        costTokens: image.costTokens,
        generationTime: image.generationTime,
        createdAt: image.createdAt
      },
      remainingCoins: user.coins - cost
    });
  } catch (error) {
    logger.error('Error generating image:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating image'
    });
  }
};

/**
 * Generate from template (quick presets)
 */
const generateFromTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { templateId, companionId, companionName, ...customization } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: 'Template ID is required'
      });
    }

    const image = await aiImageService.generateFromTemplate(userId, templateId, {
      ...customization,
      companionId,
      companionName
    });

    res.json({
      success: true,
      image: {
        id: image.id,
        imageUrl: image.imageUrl,
        prompt: image.prompt,
        style: image.style,
        costTokens: image.costTokens
      }
    });
  } catch (error) {
    logger.error('Error generating from template:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating image from template'
    });
  }
};

/**
 * Get user's gallery
 */
const getGallery = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const images = await aiImageService.getUserGallery(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      images: images.map(img => ({
        id: img.id,
        imageUrl: img.imageUrl,
        thumbnailUrl: img.thumbnailUrl,
        prompt: img.prompt,
        style: img.style,
        provider: img.provider,
        isFavorite: img.isFavorite,
        likes: img.likes,
        createdAt: img.createdAt
      })),
      total: images.length
    });
  } catch (error) {
    logger.error('Error getting gallery:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gallery'
    });
  }
};

/**
 * Toggle favorite
 */
const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageId } = req.params;

    const image = await AIImage.findOne({
      where: { id: imageId, userId }
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    image.isFavorite = !image.isFavorite;
    await image.save();

    res.json({
      success: true,
      isFavorite: image.isFavorite
    });
  } catch (error) {
    logger.error('Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating favorite status'
    });
  }
};

/**
 * Delete image
 */
const deleteImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageId } = req.params;

    const image = await AIImage.findOne({
      where: { id: imageId, userId }
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    await image.destroy();

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image'
    });
  }
};

/**
 * Get generation cost estimate
 */
const getCostEstimate = async (req, res) => {
  try {
    const { provider, quality, width, height } = req.query;

    const cost = aiImageService.calculateCost({
      provider,
      quality,
      width: parseInt(width) || 1024,
      height: parseInt(height) || 1024
    });

    const user = await User.findByPk(req.user.id);

    res.json({
      success: true,
      cost,
      currentCoins: user.coins,
      canAfford: user.coins >= cost,
      provider: aiImageService.PROVIDERS[provider] || aiImageService.PROVIDERS.dalle3
    });
  } catch (error) {
    logger.error('Error estimating cost:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating cost'
    });
  }
};

/**
 * Get available templates
 */
const getTemplates = async (req, res) => {
  try {
    const templates = [
      {
        id: 'selfie',
        name: 'Selfie',
        description: 'Cute selfie with your companion',
        icon: '🤳',
        cost: 50,
        preview: '/assets/templates/selfie.jpg'
      },
      {
        id: 'formal',
        name: 'Professional',
        description: 'Formal professional portrait',
        icon: '👔',
        cost: 50,
        preview: '/assets/templates/formal.jpg'
      },
      {
        id: 'casual',
        name: 'Casual',
        description: 'Relaxed everyday look',
        icon: '👕',
        cost: 50,
        preview: '/assets/templates/casual.jpg'
      },
      {
        id: 'fantasy',
        name: 'Fantasy',
        description: 'Magical fantasy setting',
        icon: '✨',
        cost: 75,
        isPremium: true,
        preview: '/assets/templates/fantasy.jpg'
      },
      {
        id: 'beach',
        name: 'Beach',
        description: 'Tropical beach paradise',
        icon: '🏖️',
        cost: 75,
        isPremium: true,
        preview: '/assets/templates/beach.jpg'
      },
      {
        id: 'coffee',
        name: 'Coffee Shop',
        description: 'Cozy café atmosphere',
        icon: '☕',
        cost: 50,
        preview: '/assets/templates/coffee.jpg'
      }
    ];

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    logger.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching templates'
    });
  }
};

/**
 * Get public gallery (community images)
 */
const getPublicGallery = async (req, res) => {
  try {
    const { limit = 20, offset = 0, style } = req.query;

    const where = { isPublic: true };
    if (style) {
      where.style = style;
    }

    const images = await AIImage.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatarUrl']
        }
      ],
      order: [['likes', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      images: images.map(img => ({
        id: img.id,
        imageUrl: img.imageUrl,
        prompt: img.prompt,
        style: img.style,
        likes: img.likes,
        creator: {
          id: img.user.id,
          name: img.user.name,
          avatarUrl: img.user.avatarUrl
        },
        createdAt: img.createdAt
      }))
    });
  } catch (error) {
    logger.error('Error getting public gallery:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching public gallery'
    });
  }
};

module.exports = {
  generateImage,
  generateFromTemplate,
  getGallery,
  toggleFavorite,
  deleteImage,
  getCostEstimate,
  getTemplates,
  getPublicGallery
};
