const axios = require('axios');
const logger = require('../utils/logger');
const { AIImage, User } = require('../models');

/**
 * AI Image Generation Service
 * Supports multiple providers: DALL-E 3, Flux, Stable Diffusion XL
 */

// Provider configurations
const PROVIDERS = {
  dalle3: {
    name: 'DALL-E 3',
    apiUrl: 'https://api.openai.com/v1/images/generations',
    quality: 'best',
    speed: 'slow',
    costMultiplier: 1.5
  },
  flux: {
    name: 'Flux Pro',
    apiUrl: 'https://api.bfl.ml/v1/flux-pro',
    quality: 'excellent',
    speed: 'fast',
    costMultiplier: 1.2
  },
  sdxl: {
    name: 'Stable Diffusion XL',
    apiUrl: 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    quality: 'good',
    speed: 'fastest',
    costMultiplier: 0.8
  }
};

// Style presets with enhanced prompting
const STYLE_PRESETS = {
  realistic: {
    prefix: 'photorealistic, highly detailed, 8k resolution, professional photography',
    suffix: 'cinematic lighting, sharp focus, depth of field'
  },
  anime: {
    prefix: 'anime style, detailed anime art, vibrant colors, cel shaded',
    suffix: 'high quality anime artwork, expressive eyes, clean linework'
  },
  artistic: {
    prefix: 'artistic painting, oil painting style, masterpiece quality',
    suffix: 'detailed brushstrokes, rich colors, museum quality'
  },
  professional: {
    prefix: 'professional portrait, studio lighting, high-end photography',
    suffix: 'editorial quality, fashion photography, impeccable detail'
  },
  fantasy: {
    prefix: 'fantasy art, magical atmosphere, ethereal lighting',
    suffix: 'mystical, dreamlike quality, enchanted scene'
  },
  romantic: {
    prefix: 'romantic scene, soft lighting, warm tones, intimate atmosphere',
    suffix: 'dreamy, tender moment, emotional connection'
  }
};

// Companion appearance templates
const COMPANION_APPEARANCES = {
  default: 'attractive person with kind eyes and warm smile',
  elegant: 'elegant and sophisticated person with refined features',
  cute: 'cute and cheerful person with bright eyes',
  mysterious: 'mysterious and alluring person with captivating gaze',
  athletic: 'athletic and energetic person with confident posture'
};

/**
 * Enhance user prompt with AI styling and companion details
 */
function enhancePrompt(basePrompt, options = {}) {
  const {
    style = 'realistic',
    companionName = 'companion',
    companionAppearance = 'default',
    setting = '',
    outfit = '',
    pose = ''
  } = options;

  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.realistic;
  const appearance = COMPANION_APPEARANCES[companionAppearance] || COMPANION_APPEARANCES.default;

  let enhanced = stylePreset.prefix + ', ';

  // Add companion description
  enhanced += appearance;

  // Add outfit if specified
  if (outfit) {
    enhanced += `, wearing ${outfit}`;
  }

  // Add pose if specified
  if (pose) {
    enhanced += `, ${pose}`;
  }

  // Add setting if specified
  if (setting) {
    enhanced += `, in ${setting}`;
  }

  // Add user's custom prompt
  if (basePrompt) {
    enhanced += `, ${basePrompt}`;
  }

  // Add style suffix
  enhanced += ', ' + stylePreset.suffix;

  // Add quality markers
  enhanced += ', masterpiece, best quality, highly detailed';

  return enhanced;
}

/**
 * Generate image with DALL-E 3 (OpenAI)
 */
async function generateWithDallE3(prompt, options = {}) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await axios.post(
      PROVIDERS.dalle3.apiUrl,
      {
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: `${options.width || 1024}x${options.height || 1024}`,
        quality: options.quality === 'ultra' ? 'hd' : 'standard',
        style: options.style === 'anime' ? 'vivid' : 'natural'
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    return {
      success: true,
      imageUrl: response.data.data[0].url,
      revisedPrompt: response.data.data[0].revised_prompt,
      provider: 'dalle3'
    };
  } catch (error) {
    logger.error('DALL-E 3 generation failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Generate image with Flux Pro (Black Forest Labs)
 */
async function generateWithFlux(prompt, options = {}) {
  try {
    const apiKey = process.env.FLUX_API_KEY;
    if (!apiKey) {
      throw new Error('FLUX_API_KEY not configured');
    }

    const response = await axios.post(
      PROVIDERS.flux.apiUrl,
      {
        prompt: prompt,
        width: options.width || 1024,
        height: options.height || 1024,
        steps: options.quality === 'ultra' ? 50 : 30,
        guidance: 7.5,
        safety_tolerance: 2
      },
      {
        headers: {
          'X-Key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    // Flux returns task ID, need to poll for result
    const taskId = response.data.id;
    const imageUrl = await pollFluxResult(taskId, apiKey);

    return {
      success: true,
      imageUrl: imageUrl,
      provider: 'flux'
    };
  } catch (error) {
    logger.error('Flux generation failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Poll Flux API for generation result
 */
async function pollFluxResult(taskId, apiKey, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(
        `https://api.bfl.ml/v1/get_result?id=${taskId}`,
        {
          headers: { 'X-Key': apiKey }
        }
      );

      if (response.data.status === 'Ready') {
        return response.data.result.sample;
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      logger.error('Flux polling error:', error.message);
    }
  }

  throw new Error('Flux generation timeout');
}

/**
 * Generate image with Stable Diffusion XL
 */
async function generateWithSDXL(prompt, options = {}) {
  try {
    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) {
      throw new Error('STABILITY_API_KEY not configured');
    }

    const formData = new FormData();
    formData.append('text_prompts[0][text]', prompt);
    formData.append('text_prompts[0][weight]', '1');
    formData.append('cfg_scale', '7');
    formData.append('width', options.width || 1024);
    formData.append('height', options.height || 1024);
    formData.append('steps', options.quality === 'ultra' ? 50 : 30);
    formData.append('samples', '1');

    const response = await axios.post(
      PROVIDERS.sdxl.apiUrl,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        timeout: 60000
      }
    );

    const base64Image = response.data.artifacts[0].base64;
    // In production, upload to S3/CloudFlare and get URL
    const imageUrl = `data:image/png;base64,${base64Image}`;

    return {
      success: true,
      imageUrl: imageUrl,
      provider: 'sdxl'
    };
  } catch (error) {
    logger.error('SDXL generation failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main generation function with provider fallback
 */
async function generateImage(userId, prompt, options = {}) {
  const startTime = Date.now();

  // Check user's coin balance
  const user = await User.findByPk(userId);
  const costTokens = calculateCost(options);

  if (user.coins < costTokens) {
    throw new Error('Insufficient coins. Please purchase more or upgrade to Premium.');
  }

  // Enhance prompt
  const enhancedPrompt = enhancePrompt(prompt, options);
  logger.info('Enhanced prompt:', enhancedPrompt);

  // Try providers in order of preference
  const provider = options.provider || 'dalle3';
  let result;

  switch (provider) {
    case 'flux':
      result = await generateWithFlux(enhancedPrompt, options);
      if (!result.success) {
        logger.warn('Flux failed, falling back to DALL-E 3');
        result = await generateWithDallE3(enhancedPrompt, options);
      }
      break;

    case 'sdxl':
      result = await generateWithSDXL(enhancedPrompt, options);
      if (!result.success) {
        logger.warn('SDXL failed, falling back to DALL-E 3');
        result = await generateWithDallE3(enhancedPrompt, options);
      }
      break;

    case 'dalle3':
    default:
      result = await generateWithDallE3(enhancedPrompt, options);
      if (!result.success) {
        logger.warn('DALL-E 3 failed, falling back to Flux');
        result = await generateWithFlux(enhancedPrompt, options);
      }
      break;
  }

  if (!result.success) {
    throw new Error('All image generation providers failed');
  }

  const generationTime = Date.now() - startTime;

  // Deduct coins
  await user.decrement('coins', { by: costTokens });

  // Save to database
  const aiImage = await AIImage.create({
    userId,
    prompt,
    enhancedPrompt,
    imageUrl: result.imageUrl,
    provider: result.provider,
    style: options.style || 'realistic',
    companionId: options.companionId,
    companionName: options.companionName,
    setting: options.setting,
    outfit: options.outfit,
    pose: options.pose,
    width: options.width || 1024,
    height: options.height || 1024,
    quality: options.quality || 'hd',
    costTokens,
    generationTime,
    metadata: {
      revisedPrompt: result.revisedPrompt,
      originalProvider: provider,
      actualProvider: result.provider
    }
  });

  return aiImage;
}

/**
 * Calculate generation cost based on options
 */
function calculateCost(options = {}) {
  let baseCost = 50; // Standard cost

  // Quality multiplier
  if (options.quality === 'ultra') {
    baseCost *= 2;
  } else if (options.quality === 'hd') {
    baseCost *= 1.5;
  }

  // Size multiplier
  const pixels = (options.width || 1024) * (options.height || 1024);
  if (pixels > 1024 * 1024) {
    baseCost *= 1.5;
  }

  // Provider multiplier
  const provider = PROVIDERS[options.provider || 'dalle3'];
  if (provider) {
    baseCost *= provider.costMultiplier;
  }

  return Math.round(baseCost);
}

/**
 * Get user's image gallery
 */
async function getUserGallery(userId, options = {}) {
  const { limit = 50, offset = 0, isPublic = null } = options;

  const where = { userId };
  if (isPublic !== null) {
    where.isPublic = isPublic;
  }

  const images = await AIImage.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return images;
}

/**
 * Generate template-based images (quick presets)
 */
async function generateFromTemplate(userId, templateId, customization = {}) {
  const templates = {
    'selfie': {
      prompt: 'taking a selfie, smiling at camera',
      style: 'realistic',
      pose: 'selfie pose with phone'
    },
    'formal': {
      prompt: 'professional portrait',
      style: 'professional',
      outfit: 'formal business attire'
    },
    'casual': {
      prompt: 'relaxed and comfortable',
      style: 'realistic',
      outfit: 'casual everyday clothes'
    },
    'fantasy': {
      prompt: 'in a magical setting',
      style: 'fantasy',
      setting: 'enchanted forest with glowing lights'
    },
    'beach': {
      prompt: 'enjoying the beach',
      style: 'realistic',
      setting: 'beautiful tropical beach at sunset',
      outfit: 'beach attire'
    },
    'coffee': {
      prompt: 'at a cozy café',
      style: 'artistic',
      setting: 'warm coffee shop interior',
      pose: 'sitting with coffee cup'
    }
  };

  const template = templates[templateId];
  if (!template) {
    throw new Error('Template not found');
  }

  const options = {
    ...template,
    ...customization
  };

  return generateImage(userId, template.prompt, options);
}

module.exports = {
  generateImage,
  getUserGallery,
  generateFromTemplate,
  enhancePrompt,
  calculateCost,
  STYLE_PRESETS,
  PROVIDERS
};
