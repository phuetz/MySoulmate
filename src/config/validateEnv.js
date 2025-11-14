/**
 * Environment Variables Validation
 *
 * This module validates that all required environment variables are properly set
 * before the application starts. This prevents runtime errors and provides clear
 * feedback about configuration issues.
 */

const logger = require('../utils/logger');

/**
 * Required environment variables for the application to run
 */
const REQUIRED_VARS = [
  'JWT_SECRET',
  'PAYMENT_SECRET',
  'PORT'
];

/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_VARS = [
  'OPENAI_API_KEY',
  'STRIPE_SECRET_KEY',
  'NODE_ENV'
];

/**
 * Minimum length requirements for sensitive secrets
 */
const MIN_SECRET_LENGTHS = {
  JWT_SECRET: 32,
  PAYMENT_SECRET: 32
};

/**
 * Validate that a variable exists and meets requirements
 * @param {string} varName - Environment variable name
 * @param {boolean} required - Whether the variable is required
 * @returns {Object} Validation result
 */
function validateVar(varName, required = true) {
  const value = process.env[varName];
  const errors = [];
  const warnings = [];

  // Check if variable exists
  if (!value || value.trim() === '') {
    if (required) {
      errors.push(`${varName} is required but not set`);
    } else {
      warnings.push(`${varName} is not set (recommended for production)`);
    }
    return { varName, valid: !required, errors, warnings };
  }

  // Check minimum length for secrets
  if (MIN_SECRET_LENGTHS[varName] && value.length < MIN_SECRET_LENGTHS[varName]) {
    errors.push(
      `${varName} must be at least ${MIN_SECRET_LENGTHS[varName]} characters (currently ${value.length})`
    );
  }

  // Check for default/example values
  const defaultPatterns = [
    'your_',
    'yoursecret',
    'example',
    'changeme',
    'default_'
  ];

  const lowerValue = value.toLowerCase();
  const hasDefaultPattern = defaultPatterns.some(pattern =>
    lowerValue.includes(pattern.toLowerCase())
  );

  if (hasDefaultPattern) {
    warnings.push(
      `${varName} appears to contain a default/example value - please update for production`
    );
  }

  return {
    varName,
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate all environment variables
 * @returns {Object} Validation results
 */
function validateEnvironment() {
  const results = {
    valid: true,
    errors: [],
    warnings: []
  };

  // Validate required variables
  for (const varName of REQUIRED_VARS) {
    const result = validateVar(varName, true);
    if (!result.valid) {
      results.valid = false;
      results.errors.push(...result.errors);
    }
    results.warnings.push(...result.warnings);
  }

  // Validate recommended variables
  for (const varName of RECOMMENDED_VARS) {
    const result = validateVar(varName, false);
    results.warnings.push(...result.warnings);
  }

  // Additional validations
  if (process.env.NODE_ENV === 'production') {
    // In production, warn about missing recommended vars more strongly
    if (!process.env.OPENAI_API_KEY) {
      results.warnings.push('OPENAI_API_KEY not set - AI features will not work');
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      results.warnings.push('STRIPE_SECRET_KEY not set - payment features will not work');
    }

    // Check database configuration
    if (process.env.DB_DIALECT === 'sqlite') {
      results.warnings.push('Using SQLite in production is not recommended - consider PostgreSQL');
    }
  }

  return results;
}

/**
 * Run validation and log results
 * Exits the process if validation fails in production
 */
function runValidation() {
  logger.info('Validating environment variables...');

  const results = validateEnvironment();

  // Log errors
  if (results.errors.length > 0) {
    logger.error('Environment validation failed:');
    results.errors.forEach(error => logger.error(`  ❌ ${error}`));
  }

  // Log warnings
  if (results.warnings.length > 0) {
    logger.warn('Environment validation warnings:');
    results.warnings.forEach(warning => logger.warn(`  ⚠️  ${warning}`));
  }

  // If validation failed
  if (!results.valid) {
    logger.error('');
    logger.error('Environment validation failed! Please check your .env file.');
    logger.error('See .env.example for required variables.');

    // In production or test, exit immediately
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
      process.exit(1);
    } else {
      // In development, just warn
      logger.warn('Continuing in development mode despite validation errors...');
    }
  } else {
    logger.info('✅ Environment validation passed');
  }

  return results;
}

module.exports = {
  validateEnvironment,
  runValidation,
  validateVar
};
