/**
 * i18n Routes
 * Endpoints for internationalization
 */

const express = require('express');
const router = express.Router();
const i18nService = require('../i18n');

/**
 * @route   GET /api/v1/i18n/translations/:locale
 * @desc    Get all translations for a specific locale
 * @access  Public
 */
router.get('/translations/:locale', (req, res) => {
  try {
    const { locale } = req.params;

    if (!i18nService.isLocaleSupported(locale)) {
      return res.status(404).json({
        error: 'Locale not supported',
        supportedLocales: i18nService.supportedLocales
      });
    }

    const translations = i18nService.getTranslations(locale);

    res.json({
      locale,
      translations
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

/**
 * @route   GET /api/v1/i18n/locales
 * @desc    Get list of supported locales
 * @access  Public
 */
router.get('/locales', (req, res) => {
  try {
    res.json({
      defaultLocale: i18nService.defaultLocale,
      supportedLocales: i18nService.supportedLocales,
      locales: i18nService.supportedLocales.map(locale => ({
        code: locale,
        name: getLocaleName(locale)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locales' });
  }
});

/**
 * @route   GET /api/v1/i18n/translate
 * @desc    Translate a specific key
 * @access  Public
 */
router.get('/translate', (req, res) => {
  try {
    const { key, locale, params } = req.query;

    if (!key) {
      return res.status(400).json({ error: 'Translation key is required' });
    }

    const targetLocale = locale || req.locale || i18nService.defaultLocale;
    const translationParams = params ? JSON.parse(params) : {};

    const translation = i18nService.t(key, targetLocale, translationParams);

    res.json({
      key,
      locale: targetLocale,
      translation
    });
  } catch (error) {
    res.status(500).json({ error: 'Translation failed' });
  }
});

/**
 * Helper function to get locale display name
 */
function getLocaleName(locale) {
  const names = {
    en: 'English',
    fr: 'Français',
    es: 'Español',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    ja: '日本語',
    zh: '中文'
  };
  return names[locale] || locale;
}

module.exports = router;
