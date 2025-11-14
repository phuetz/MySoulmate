/**
 * Application Constants
 *
 * Centralized constants for the application to avoid magic numbers and strings
 */

// Authentication
const AUTH = {
  JWT_EXPIRATION: '24h',
  REFRESH_TOKEN_EXPIRATION_DAYS: 7,
  SESSION_EXPIRATION_DAYS: 30,
  PASSWORD_RESET_EXPIRATION_HOURS: 1,
  EMAIL_VERIFICATION_EXPIRATION_HOURS: 24,
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  BCRYPT_SALT_ROUNDS: 10
};

// Rate Limiting
const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 10 // Stricter for auth endpoints
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 500 // Higher for authenticated API calls
  }
};

// Pagination
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// File Upload
const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime'],
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg']
};

// Database
const DATABASE = {
  SYNC_OPTIONS: {
    alter: process.env.NODE_ENV === 'development',
    force: false
  },
  POOL: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Cache
const CACHE = {
  AI_RESPONSE_TTL: 5 * 60, // 5 minutes in seconds
  SESSION_TTL: 24 * 60 * 60, // 24 hours in seconds
  USER_DATA_TTL: 60 * 60 // 1 hour in seconds
};

// AI/OpenAI
const AI = {
  MODEL: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  MAX_TOKENS: 500,
  TEMPERATURE: 0.7,
  TOP_P: 1,
  FREQUENCY_PENALTY: 0,
  PRESENCE_PENALTY: 0.6
};

// Companion
const COMPANION = {
  PERSONALITY_TRAITS: [
    'Caring',
    'Intelligent',
    'Witty',
    'Mysterious',
    'Adventurous',
    'Romantic',
    'Supportive',
    'Creative'
  ],
  RELATIONSHIP_LEVELS: [
    'Acquaintance',
    'Friend',
    'Close Friend',
    'Romantic'
  ],
  MIN_AFFECTION: 0,
  MAX_AFFECTION: 100,
  AFFECTION_DECAY_RATE: 1, // Points per day of inactivity
  MIN_LEVEL: 1,
  MAX_LEVEL: 100
};

// Gifts
const GIFTS = {
  CATEGORIES: ['Flowers', 'Food', 'Jewelry', 'Tech', 'Books', 'Special'],
  MIN_PRICE: 1,
  MAX_PRICE: 1000
};

// Notifications
const NOTIFICATIONS = {
  TYPES: {
    MESSAGE: 'message',
    GIFT: 'gift',
    LEVEL_UP: 'level_up',
    ACHIEVEMENT: 'achievement',
    REMINDER: 'reminder',
    SYSTEM: 'system'
  },
  PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  }
};

// User Roles
const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
};

// Subscription Plans
const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  VIP: 'vip'
};

// Error Codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR'
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Regex Patterns
const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  ALPHA_NUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHA_NUMERIC_SPACE: /^[a-zA-Z0-9\s]+$/
};

module.exports = {
  AUTH,
  RATE_LIMITS,
  PAGINATION,
  FILE_UPLOAD,
  DATABASE,
  CACHE,
  AI,
  COMPANION,
  GIFTS,
  NOTIFICATIONS,
  USER_ROLES,
  SUBSCRIPTION_PLANS,
  ERROR_CODES,
  HTTP_STATUS,
  REGEX
};
