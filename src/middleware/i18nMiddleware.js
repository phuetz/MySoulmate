/**
 * i18n Middleware
 * Adds internationalization support to requests
 */

const i18nService = require('../i18n');

/**
 * Middleware to detect and set locale for the request
 */
function detectLocale(req, res, next) {
  // Priority:
  // 1. Query parameter (?lang=fr)
  // 2. Custom header (X-Locale)
  // 3. Accept-Language header
  // 4. Default locale

  let locale = req.query.lang
    || req.headers['x-locale']
    || i18nService.getBestLocale(req.headers['accept-language']);

  // Validate locale
  if (!i18nService.isLocaleSupported(locale)) {
    locale = i18nService.defaultLocale;
  }

  // Attach locale to request
  req.locale = locale;

  // Attach translation function to request
  req.t = (key, params) => i18nService.t(key, req.locale, params);
  req.pluralize = (key, count, params) => i18nService.pluralize(key, count, req.locale, params);

  // Attach formatting functions
  req.formatDate = (date, options) => i18nService.formatDate(date, req.locale, options);
  req.formatNumber = (number, options) => i18nService.formatNumber(number, req.locale, options);
  req.formatCurrency = (amount, currency) => i18nService.formatCurrency(amount, currency, req.locale);

  next();
}

/**
 * Middleware to set Content-Language header in response
 */
function setContentLanguage(req, res, next) {
  if (req.locale) {
    res.setHeader('Content-Language', req.locale);
  }
  next();
}

module.exports = {
  detectLocale,
  setContentLanguage
};
