/**
 * CSRF Protection Middleware
 * Implements token-based CSRF protection for state-changing operations
 */
const crypto = require('crypto');
const logger = require('../utils/logger');

// Store for CSRF tokens (in production, use Redis)
const tokenStore = new Map();

// Token expiration time (15 minutes)
const TOKEN_EXPIRATION = 15 * 60 * 1000;

/**
 * Generate a CSRF token
 * @param {string} sessionId - Session ID
 * @returns {string} CSRF token
 */
const generateToken = (sessionId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + TOKEN_EXPIRATION;

  tokenStore.set(token, { sessionId, expiry });

  // Clean up expired tokens periodically
  if (tokenStore.size > 1000) {
    cleanExpiredTokens();
  }

  return token;
};

/**
 * Validate CSRF token
 * @param {string} token - CSRF token
 * @param {string} sessionId - Session ID
 * @returns {boolean} Valid or not
 */
const validateToken = (token, sessionId) => {
  if (!token || !sessionId) {
    return false;
  }

  const storedData = tokenStore.get(token);

  if (!storedData) {
    return false;
  }

  // Check expiration
  if (storedData.expiry < Date.now()) {
    tokenStore.delete(token);
    return false;
  }

  // Check session match
  if (storedData.sessionId !== sessionId) {
    return false;
  }

  // Token is valid and can be used once
  tokenStore.delete(token);
  return true;
};

/**
 * Clean expired tokens from store
 */
const cleanExpiredTokens = () => {
  const now = Date.now();
  let cleaned = 0;

  for (const [token, data] of tokenStore.entries()) {
    if (data.expiry < now) {
      tokenStore.delete(token);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug(`Cleaned ${cleaned} expired CSRF tokens`);
  }
};

/**
 * Middleware to generate and attach CSRF token to response
 */
exports.generateCsrfToken = (req, res, next) => {
  const sessionToken = req.headers['x-session-token'] || req.body.sessionToken || req.query.sessionToken;

  if (!sessionToken) {
    // No session, no CSRF token needed
    return next();
  }

  const csrfToken = generateToken(sessionToken);

  // Attach to response headers
  res.set('X-CSRF-Token', csrfToken);

  // Also make it available in res.locals for rendering
  res.locals.csrfToken = csrfToken;

  next();
};

/**
 * Middleware to verify CSRF token on state-changing requests
 */
exports.verifyCsrfToken = (req, res, next) => {
  // Only check on state-changing methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const sessionToken = req.headers['x-session-token'] || req.body.sessionToken;
  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;

  if (!sessionToken) {
    // No session token, skip CSRF check (will fail auth anyway)
    return next();
  }

  if (!validateToken(csrfToken, sessionToken)) {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      hasToken: !!csrfToken,
      hasSession: !!sessionToken
    });

    return res.status(403).json({
      message: 'Invalid CSRF token',
      code: 'CSRF_VALIDATION_FAILED'
    });
  }

  next();
};

/**
 * Get CSRF token endpoint
 */
exports.getCsrfToken = (req, res) => {
  const sessionToken = req.headers['x-session-token'] || req.query.sessionToken;

  if (!sessionToken) {
    return res.status(400).json({
      message: 'Session token required'
    });
  }

  const csrfToken = generateToken(sessionToken);

  res.status(200).json({
    csrfToken,
    expiresIn: TOKEN_EXPIRATION
  });
};

// Clean expired tokens every 5 minutes
setInterval(cleanExpiredTokens, 5 * 60 * 1000);
