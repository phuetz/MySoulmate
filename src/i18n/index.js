/**
 * Internationalization (i18n) Service
 * Provides multi-language support for the application
 */

const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

class I18nService {
  constructor() {
    this.translations = {};
    this.defaultLocale = process.env.DEFAULT_LOCALE || 'en';
    this.supportedLocales = (process.env.SUPPORTED_LOCALES || 'en,fr,es,de,it,pt,ja,zh').split(',');
    this.fallbackLocale = 'en';
  }

  /**
   * Initialize i18n service
   */
  async initialize() {
    try {
      // Load all translation files
      for (const locale of this.supportedLocales) {
        await this.loadTranslations(locale);
      }

      logger.info(`i18n initialized with ${this.supportedLocales.length} locales: ${this.supportedLocales.join(', ')}`);
    } catch (error) {
      logger.error('i18n initialization error:', error);
    }
  }

  /**
   * Load translations for a specific locale
   */
  async loadTranslations(locale) {
    try {
      const translationPath = path.join(__dirname, 'translations', `${locale}.json`);

      if (fs.existsSync(translationPath)) {
        const content = fs.readFileSync(translationPath, 'utf8');
        this.translations[locale] = JSON.parse(content);
        logger.debug(`Loaded translations for locale: ${locale}`);
      } else {
        logger.warn(`Translation file not found: ${translationPath}`);
        this.translations[locale] = {};
      }
    } catch (error) {
      logger.error(`Error loading translations for locale ${locale}:`, error);
      this.translations[locale] = {};
    }
  }

  /**
   * Get translation for a key
   * @param {string} key - Translation key (e.g., 'auth.login.title')
   * @param {string} locale - Locale code
   * @param {Object} params - Parameters for interpolation
   * @returns {string} Translated string
   */
  t(key, locale = this.defaultLocale, params = {}) {
    // Get locale translations
    const localeTranslations = this.translations[locale] || this.translations[this.fallbackLocale] || {};

    // Get translation by key (supports nested keys like 'auth.login.title')
    let translation = this.getNestedValue(localeTranslations, key);

    // Fallback to default locale if not found
    if (!translation && locale !== this.fallbackLocale) {
      const fallbackTranslations = this.translations[this.fallbackLocale] || {};
      translation = this.getNestedValue(fallbackTranslations, key);
    }

    // Fallback to key if translation not found
    if (!translation) {
      logger.warn(`Translation not found: ${key} (locale: ${locale})`);
      return key;
    }

    // Interpolate parameters
    return this.interpolate(translation, params);
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Interpolate parameters in translation string
   * Example: "Hello {{name}}" with { name: "John" } => "Hello John"
   */
  interpolate(str, params) {
    return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * Get all translations for a locale
   */
  getTranslations(locale) {
    return this.translations[locale] || {};
  }

  /**
   * Check if locale is supported
   */
  isLocaleSupported(locale) {
    return this.supportedLocales.includes(locale);
  }

  /**
   * Get best matching locale from Accept-Language header
   */
  getBestLocale(acceptLanguage) {
    if (!acceptLanguage) {
      return this.defaultLocale;
    }

    // Parse Accept-Language header
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const parts = lang.trim().split(';');
        const code = parts[0].split('-')[0]; // Extract language code (en from en-US)
        const quality = parts[1] ? parseFloat(parts[1].split('=')[1]) : 1.0;
        return { code, quality };
      })
      .sort((a, b) => b.quality - a.quality);

    // Find first supported locale
    for (const lang of languages) {
      if (this.isLocaleSupported(lang.code)) {
        return lang.code;
      }
    }

    return this.defaultLocale;
  }

  /**
   * Add or update translation dynamically
   */
  addTranslation(locale, key, value) {
    if (!this.translations[locale]) {
      this.translations[locale] = {};
    }

    this.setNestedValue(this.translations[locale], key, value);
  }

  /**
   * Set nested value in object using dot notation
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Format date according to locale
   */
  formatDate(date, locale = this.defaultLocale, options = {}) {
    try {
      return new Intl.DateTimeFormat(locale, options).format(new Date(date));
    } catch (error) {
      logger.error('Date formatting error:', error);
      return date.toString();
    }
  }

  /**
   * Format number according to locale
   */
  formatNumber(number, locale = this.defaultLocale, options = {}) {
    try {
      return new Intl.NumberFormat(locale, options).format(number);
    } catch (error) {
      logger.error('Number formatting error:', error);
      return number.toString();
    }
  }

  /**
   * Format currency according to locale
   */
  formatCurrency(amount, currency = 'USD', locale = this.defaultLocale) {
    return this.formatNumber(amount, locale, {
      style: 'currency',
      currency
    });
  }

  /**
   * Pluralize translation based on count
   * Translation format: { "zero": "...", "one": "...", "other": "..." }
   */
  pluralize(key, count, locale = this.defaultLocale, params = {}) {
    const pluralForms = this.t(key, locale);

    if (typeof pluralForms !== 'object') {
      return this.interpolate(pluralForms, { count, ...params });
    }

    let form;
    if (count === 0 && pluralForms.zero) {
      form = pluralForms.zero;
    } else if (count === 1 && pluralForms.one) {
      form = pluralForms.one;
    } else {
      form = pluralForms.other || pluralForms.one || '';
    }

    return this.interpolate(form, { count, ...params });
  }
}

// Singleton instance
const i18nService = new I18nService();

// Auto-initialize
i18nService.initialize().catch(err => {
  logger.error('i18n auto-initialization failed:', err);
});

module.exports = i18nService;
