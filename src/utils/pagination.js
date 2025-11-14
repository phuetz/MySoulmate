/**
 * Pagination Utilities
 *
 * Helper functions for implementing pagination in API endpoints
 */

const { PAGINATION } = require('../config/constants');

/**
 * Parse pagination parameters from request
 * @param {Object} req - Express request object
 * @returns {Object} Pagination parameters
 */
function getPaginationParams(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT)
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Create pagination metadata
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} baseUrl - Base URL for pagination links
 * @returns {Object} Pagination metadata
 */
function createPaginationMeta(total, page, limit, baseUrl = '') {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const meta = {
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage
  };

  // Add pagination links if baseUrl provided
  if (baseUrl) {
    meta.links = {
      self: `${baseUrl}?page=${page}&limit=${limit}`,
      first: `${baseUrl}?page=1&limit=${limit}`,
      last: `${baseUrl}?page=${totalPages}&limit=${limit}`
    };

    if (hasNextPage) {
      meta.links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
    }

    if (hasPrevPage) {
      meta.links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
    }
  }

  return meta;
}

/**
 * Create paginated response
 * @param {Array} data - Data items
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} baseUrl - Base URL for pagination links
 * @returns {Object} Paginated response
 */
function createPaginatedResponse(data, total, page, limit, baseUrl = '') {
  return {
    data,
    meta: createPaginationMeta(total, page, limit, baseUrl)
  };
}

/**
 * Apply pagination to Sequelize query
 * @param {Object} options - Sequelize query options
 * @param {Object} params - Pagination parameters from getPaginationParams
 * @returns {Object} Query options with pagination
 */
function applyPagination(options, params) {
  return {
    ...options,
    limit: params.limit,
    offset: params.offset
  };
}

module.exports = {
  getPaginationParams,
  createPaginationMeta,
  createPaginatedResponse,
  applyPagination
};
