/**
 * Translation utility hook
 * Automatically falls back to English if translation missing
 * Usage: const strings = useTranslation(translationObject, language);
 */

export function useTranslation(translations, language = 'en') {
  // If translations exist for the requested language, use them
  if (translations && translations[language]) {
    return translations[language];
  }
  
  // Fallback to English
  if (translations && translations.en) {
    return translations.en;
  }
  
  // Last resort: return empty object
  return {};
}

/**
 * Get translated string with fallback chain
 * Falls back: requested language → English → key itself
 */
export function t(translations, key, language = 'en') {
  if (!translations) return key;
  
  // Try requested language
  if (translations[language] && translations[language][key]) {
    return translations[language][key];
  }
  
  // Fallback to English
  if (translations.en && translations.en[key]) {
    return translations.en[key];
  }
  
  // Return key as last resort
  return key;
}

/**
 * Get all supported languages from translation object
 */
export function getSupportedLanguages(translations) {
  if (!translations) return ['en'];
  return Object.keys(translations);
}

/**
 * Check if language is supported
 */
export function isLanguageSupported(language, translations) {
  if (!translations) return language === 'en';
  return language in translations;
}

export default useTranslation;