/**
 * Common Validation Helpers
 *
 * Reusable validation functions for various data types
 */

const { REGEX } = require('../config/constants');

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} Valid or not
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return REGEX.EMAIL.test(email.trim().toLowerCase());
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with errors
 */
function validatePassword(password, options = {}) {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false
  } = options;

  const errors = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate phone number
 * @param {string} phone - Phone number
 * @returns {boolean} Valid or not
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  return REGEX.PHONE.test(phone.trim());
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} Valid or not
 */
function isValidURL(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  return REGEX.URL.test(url.trim());
}

/**
 * Validate UUID
 * @param {string} uuid - UUID to validate
 * @returns {boolean} Valid or not
 */
function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  return REGEX.UUID.test(uuid.trim());
}

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
function sanitizeString(input, options = {}) {
  const {
    trim = true,
    lowercase = false,
    uppercase = false,
    removeSpecialChars = false,
    maxLength = null
  } = options;

  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  if (trim) {
    sanitized = sanitized.trim();
  }

  if (lowercase) {
    sanitized = sanitized.toLowerCase();
  }

  if (uppercase) {
    sanitized = sanitized.toUpperCase();
  }

  if (removeSpecialChars) {
    sanitized = sanitized.replace(/[^\w\s]/g, '');
  }

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate object against schema
 * @param {Object} obj - Object to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation result
 */
function validateObject(obj, schema) {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = obj[field];

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }

    // Skip further validation if not required and value is empty
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type check
    if (rules.type && typeof value !== rules.type) {
      errors[field] = `${field} must be of type ${rules.type}`;
      continue;
    }

    // String validations
    if (rules.type === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors[field] = `${field} must be at least ${rules.minLength} characters`;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors[field] = `${field} must not exceed ${rules.maxLength} characters`;
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors[field] = `${field} format is invalid`;
      }
    }

    // Number validations
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors[field] = `${field} must be at least ${rules.min}`;
      }
      if (rules.max !== undefined && value > rules.max) {
        errors[field] = `${field} must not exceed ${rules.max}`;
      }
    }

    // Array validations
    if (Array.isArray(value)) {
      if (rules.minItems && value.length < rules.minItems) {
        errors[field] = `${field} must have at least ${rules.minItems} items`;
      }
      if (rules.maxItems && value.length > rules.maxItems) {
        errors[field] = `${field} must not have more than ${rules.maxItems} items`;
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors[field] = `${field} must be one of: ${rules.enum.join(', ')}`;
    }

    // Custom validator
    if (rules.validator && typeof rules.validator === 'function') {
      const customError = rules.validator(value);
      if (customError) {
        errors[field] = customError;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate date string
 * @param {string} dateString - Date string to validate
 * @returns {boolean} Valid or not
 */
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Check if date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} Is in past
 */
function isDateInPast(date) {
  return new Date(date) < new Date();
}

/**
 * Check if date is in the future
 * @param {string|Date} date - Date to check
 * @returns {boolean} Is in future
 */
function isDateInFuture(date) {
  return new Date(date) > new Date();
}

/**
 * Validate age (must be at least minAge years old)
 * @param {string|Date} birthdate - Birthdate
 * @param {number} minAge - Minimum age (default 18)
 * @returns {boolean} Valid or not
 */
function isValidAge(birthdate, minAge = 18) {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age >= minAge;
}

module.exports = {
  isValidEmail,
  validatePassword,
  isValidPhone,
  isValidURL,
  isValidUUID,
  sanitizeString,
  validateObject,
  isValidDate,
  isDateInPast,
  isDateInFuture,
  isValidAge
};
