/**
 * Pagination utilities for API responses
 */

/**
 * Calculate pagination metadata
 * @param {number} page - Current page number (1-indexed)
 * @param {number} limit - Items per page
 * @param {number} totalItems - Total number of items
 * @returns {Object} Pagination metadata
 */
exports.getPaginationMeta = (page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? currentPage + 1 : null,
    prevPage: hasPrevPage ? currentPage - 1 : null
  };
};

/**
 * Calculate offset for database queries
 * @param {number} page - Current page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {number} Offset for database query
 */
exports.getOffset = (page, limit) => {
  return (Math.max(1, page) - 1) * limit;
};

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Express request query object
 * @param {Object} options - Options for default values
 * @returns {Object} Parsed pagination parameters
 */
exports.parsePaginationParams = (query, options = {}) => {
  const defaultPage = options.defaultPage || 1;
  const defaultLimit = options.defaultLimit || 10;
  const maxLimit = options.maxLimit || 100;

  let page = parseInt(query.page) || defaultPage;
  let limit = parseInt(query.limit) || defaultLimit;

  // Validate and constrain values
  page = Math.max(1, page);
  limit = Math.max(1, Math.min(limit, maxLimit));

  return {
    page,
    limit,
    offset: this.getOffset(page, limit)
  };
};

/**
 * Format paginated response
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination parameters
 * @param {number} totalItems - Total number of items
 * @returns {Object} Formatted response
 */
exports.formatPaginatedResponse = (data, pagination, totalItems) => {
  const meta = this.getPaginationMeta(
    pagination.page,
    pagination.limit,
    totalItems
  );

  return {
    data,
    meta,
    links: {
      self: pagination.currentUrl,
      first: pagination.baseUrl ? `${pagination.baseUrl}?page=1&limit=${pagination.limit}` : null,
      last: pagination.baseUrl && meta.totalPages > 0
        ? `${pagination.baseUrl}?page=${meta.totalPages}&limit=${pagination.limit}`
        : null,
      next: pagination.baseUrl && meta.hasNextPage
        ? `${pagination.baseUrl}?page=${meta.nextPage}&limit=${pagination.limit}`
        : null,
      prev: pagination.baseUrl && meta.hasPrevPage
        ? `${pagination.baseUrl}?page=${meta.prevPage}&limit=${pagination.limit}`
        : null
    }
  };
};

/**
 * Middleware to add pagination helpers to request
 */
exports.paginationMiddleware = (options = {}) => {
  return (req, res, next) => {
    const params = this.parsePaginationParams(req.query, options);

    // Add pagination helpers to request
    req.pagination = {
      ...params,
      baseUrl: `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`,
      currentUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`
    };

    // Add helper method to format response
    res.paginate = (data, totalItems) => {
      return this.formatPaginatedResponse(data, req.pagination, totalItems);
    };

    next();
  };
};

/**
 * Create Sequelize pagination options
 * @param {Object} pagination - Pagination parameters
 * @returns {Object} Sequelize options
 */
exports.getSequelizePagination = (pagination) => {
  return {
    limit: pagination.limit,
    offset: pagination.offset
  };
};

/**
 * Apply cursor-based pagination (for large datasets)
 * @param {Object} query - Express request query
 * @param {Object} options - Cursor options
 * @returns {Object} Cursor pagination parameters
 */
exports.parseCursorParams = (query, options = {}) => {
  const defaultLimit = options.defaultLimit || 20;
  const maxLimit = options.maxLimit || 100;

  const cursor = query.cursor || null;
  const limit = Math.min(parseInt(query.limit) || defaultLimit, maxLimit);
  const direction = query.direction === 'prev' ? 'prev' : 'next';

  return {
    cursor,
    limit,
    direction
  };
};

/**
 * Format cursor-based paginated response
 * @param {Array} data - Array of items
 * @param {Function} getCursor - Function to extract cursor from item
 * @param {Object} params - Cursor parameters
 * @returns {Object} Formatted response
 */
exports.formatCursorResponse = (data, getCursor, params) => {
  const hasMore = data.length > params.limit;
  const items = hasMore ? data.slice(0, params.limit) : data;

  return {
    data: items,
    meta: {
      hasMore,
      count: items.length
    },
    cursors: {
      next: hasMore && items.length > 0 ? getCursor(items[items.length - 1]) : null,
      prev: items.length > 0 ? getCursor(items[0]) : null
    }
  };
};
