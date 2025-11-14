/**
 * Content Moderation Utilities
 * Provides content filtering and moderation capabilities
 */
const logger = require('./logger');

// Inappropriate words and phrases (basic list - expand in production)
const INAPPROPRIATE_WORDS = [
  // Add actual inappropriate words in production
  // This is a placeholder structure
];

// Patterns for detecting various types of content
const PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g,
  url: /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  spamKeywords: /(buy now|click here|limited time|act now|free money|viagra|casino)/gi
};

// Content categories for moderation
const CATEGORIES = {
  SPAM: 'spam',
  HARASSMENT: 'harassment',
  HATE_SPEECH: 'hate_speech',
  VIOLENCE: 'violence',
  SEXUAL: 'sexual',
  ILLEGAL: 'illegal',
  PII: 'personal_identifiable_information',
  SAFE: 'safe'
};

/**
 * Moderate text content
 * @param {string} text - Text to moderate
 * @param {Object} options - Moderation options
 * @returns {Object} Moderation result
 */
exports.moderateText = (text, options = {}) => {
  const {
    checkPII = true,
    checkInappropriate = true,
    checkSpam = true,
    strictMode = false
  } = options;

  const result = {
    isApproved: true,
    confidence: 1.0,
    categories: [],
    flags: [],
    sanitizedText: text,
    warnings: []
  };

  if (!text || typeof text !== 'string') {
    return result;
  }

  const lowerText = text.toLowerCase();

  // Check for PII (Personal Identifiable Information)
  if (checkPII) {
    if (PATTERNS.email.test(text)) {
      result.flags.push({ type: CATEGORIES.PII, detail: 'Email address detected' });
      result.warnings.push('Contains email address');
      if (strictMode) result.isApproved = false;
    }

    if (PATTERNS.phone.test(text)) {
      result.flags.push({ type: CATEGORIES.PII, detail: 'Phone number detected' });
      result.warnings.push('Contains phone number');
      if (strictMode) result.isApproved = false;
    }

    if (PATTERNS.creditCard.test(text)) {
      result.flags.push({ type: CATEGORIES.PII, detail: 'Credit card number detected' });
      result.warnings.push('Contains credit card number');
      result.isApproved = false;
    }

    if (PATTERNS.ssn.test(text)) {
      result.flags.push({ type: CATEGORIES.PII, detail: 'SSN detected' });
      result.warnings.push('Contains social security number');
      result.isApproved = false;
    }
  }

  // Check for spam
  if (checkSpam) {
    const spamMatches = text.match(PATTERNS.spamKeywords);
    if (spamMatches && spamMatches.length > 2) {
      result.flags.push({ type: CATEGORIES.SPAM, detail: 'Multiple spam keywords detected' });
      result.categories.push(CATEGORIES.SPAM);
      result.confidence *= 0.5;
      if (strictMode) result.isApproved = false;
    }

    // Check for excessive links
    const urlMatches = text.match(PATTERNS.url);
    if (urlMatches && urlMatches.length > 3) {
      result.flags.push({ type: CATEGORIES.SPAM, detail: 'Excessive URLs detected' });
      result.warnings.push('Contains many URLs');
      if (strictMode) result.isApproved = false;
    }
  }

  // Check for inappropriate content
  if (checkInappropriate) {
    for (const word of INAPPROPRIATE_WORDS) {
      if (lowerText.includes(word)) {
        result.flags.push({ type: CATEGORIES.HARASSMENT, detail: 'Inappropriate language' });
        result.categories.push(CATEGORIES.HARASSMENT);
        result.isApproved = false;
        result.confidence *= 0.3;
        break;
      }
    }
  }

  // Check for excessive caps (shouting)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.6 && text.length > 20) {
    result.flags.push({ type: 'CAPS', detail: 'Excessive capitalization' });
    result.warnings.push('Excessive caps detected');
  }

  // Check for repeated characters (aaaaaaa)
  if (/(.)\1{5,}/.test(text)) {
    result.flags.push({ type: 'SPAM', detail: 'Character repetition detected' });
    result.warnings.push('Excessive character repetition');
  }

  // Determine final category
  if (result.categories.length === 0 && result.flags.length === 0) {
    result.categories.push(CATEGORIES.SAFE);
  }

  return result;
};

/**
 * Sanitize text by removing or masking sensitive information
 * @param {string} text - Text to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized text
 */
exports.sanitizeText = (text, options = {}) => {
  const {
    maskEmails = true,
    maskPhones = true,
    maskCreditCards = true,
    maskUrls = false
  } = options;

  let sanitized = text;

  if (maskEmails) {
    sanitized = sanitized.replace(PATTERNS.email, '[EMAIL_REDACTED]');
  }

  if (maskPhones) {
    sanitized = sanitized.replace(PATTERNS.phone, '[PHONE_REDACTED]');
  }

  if (maskCreditCards) {
    sanitized = sanitized.replace(PATTERNS.creditCard, '[CARD_REDACTED]');
  }

  if (maskUrls) {
    sanitized = sanitized.replace(PATTERNS.url, '[URL_REDACTED]');
  }

  sanitized = sanitized.replace(PATTERNS.ssn, '[SSN_REDACTED]');

  return sanitized;
};

/**
 * Check if text contains profanity
 * @param {string} text - Text to check
 * @returns {boolean} Contains profanity
 */
exports.containsProfanity = (text) => {
  if (!text) return false;

  const lowerText = text.toLowerCase();
  return INAPPROPRIATE_WORDS.some(word => lowerText.includes(word));
};

/**
 * Calculate toxicity score (0-1)
 * @param {string} text - Text to analyze
 * @returns {number} Toxicity score
 */
exports.calculateToxicityScore = (text) => {
  if (!text) return 0;

  let score = 0;
  const lowerText = text.toLowerCase();

  // Check inappropriate words
  const profanityCount = INAPPROPRIATE_WORDS.filter(word =>
    lowerText.includes(word)
  ).length;
  score += Math.min(profanityCount * 0.3, 0.7);

  // Check excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.6) score += 0.2;

  // Check excessive punctuation
  const punctCount = (text.match(/[!?]{2,}/g) || []).length;
  score += Math.min(punctCount * 0.1, 0.2);

  return Math.min(score, 1.0);
};

/**
 * Moderate image (placeholder - integrate with external service in production)
 * @param {string} imageUrl - URL of image to moderate
 * @returns {Promise<Object>} Moderation result
 */
exports.moderateImage = async (imageUrl) => {
  try {
    // In production, integrate with services like:
    // - Google Cloud Vision API
    // - AWS Rekognition
    // - Microsoft Azure Content Moderator
    // - Clarifai

    logger.info('Image moderation requested:', imageUrl);

    // Placeholder response
    return {
      isApproved: true,
      confidence: 0.95,
      categories: [CATEGORIES.SAFE],
      flags: [],
      warnings: []
    };
  } catch (error) {
    logger.error('Image moderation error:', error);
    return {
      isApproved: false,
      confidence: 0,
      categories: [],
      flags: [{ type: 'ERROR', detail: 'Moderation failed' }],
      warnings: ['Failed to moderate image']
    };
  }
};

/**
 * Middleware for automatic content moderation
 * @param {Object} options - Moderation options
 * @returns {Function} Express middleware
 */
exports.moderationMiddleware = (options = {}) => {
  return async (req, res, next) => {
    const fieldsToCheck = options.fields || ['content', 'message', 'text', 'body'];
    const strictMode = options.strictMode || false;

    try {
      for (const field of fieldsToCheck) {
        const text = req.body[field];

        if (text && typeof text === 'string') {
          const moderation = exports.moderateText(text, { strictMode });

          if (!moderation.isApproved) {
            logger.warn('Content moderation failed', {
              userId: req.user?.id,
              field,
              flags: moderation.flags
            });

            return res.status(400).json({
              message: 'Content violates community guidelines',
              code: 'CONTENT_MODERATION_FAILED',
              flags: moderation.flags,
              warnings: moderation.warnings
            });
          }

          // Attach moderation result to request
          req.moderation = req.moderation || {};
          req.moderation[field] = moderation;

          // Optionally sanitize the content
          if (options.autoSanitize) {
            req.body[field] = exports.sanitizeText(text);
          }
        }
      }

      next();
    } catch (error) {
      logger.error('Moderation middleware error:', error);
      next(error);
    }
  };
};

/**
 * Report content for manual review
 * @param {Object} params - Report parameters
 * @returns {Promise<Object>} Report result
 */
exports.reportContent = async ({ contentId, contentType, reason, reportedBy, details }) => {
  try {
    // In production, store in database and create ticket
    logger.info('Content reported', {
      contentId,
      contentType,
      reason,
      reportedBy
    });

    return {
      reportId: `REP-${Date.now()}`,
      status: 'pending_review',
      message: 'Report submitted successfully'
    };
  } catch (error) {
    logger.error('Report content error:', error);
    throw error;
  }
};

/**
 * Get moderation statistics
 * @returns {Object} Statistics
 */
exports.getModerationStats = () => {
  return {
    categoriesAvailable: Object.values(CATEGORIES),
    patternsDetected: Object.keys(PATTERNS),
    inappropriateWordsCount: INAPPROPRIATE_WORDS.length,
    features: {
      textModeration: true,
      imageModeration: false, // Requires external service
      videoModeration: false, // Requires external service
      audioModeration: false  // Requires external service
    }
  };
};

module.exports = exports;
