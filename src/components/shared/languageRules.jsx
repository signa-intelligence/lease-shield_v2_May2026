/**
 * LeaseShield Multi-Language Letter Generation Rules
 * Single source of truth for language selection in letters & notifications
 * 
 * CRITICAL RULES:
 * 1. Juristic: Always TH + EN (no options)
 * 2. Landlord: Landlord language + EN + optional (tenant lang, TH)
 * 3. Tenant: Tenant language + EN + optional (landlord lang, TH)
 * 4. ONE credit = ONE letter pack (all languages included)
 * 5. Maintenance notifications: FREE (no credits used)
 */

const SUPPORTED_LANGUAGES = ['en', 'th', 'ja', 'zh', 'ko', 'ru'];

/**
 * Clean and validate language code
 */
function cleanLanguageCode(lang, fallback = 'en') {
  if (!lang || typeof lang !== 'string') return fallback;
  const cleaned = lang.toLowerCase().trim();
  return SUPPORTED_LANGUAGES.includes(cleaned) ? cleaned : fallback;
}

/**
 * Build language pack for letter generation
 * 
 * @param {Object} context
 * @param {string} context.recipientType - 'tenant' | 'landlord' | 'juristic'
 * @param {string} context.tenantLanguage - User's preferred language
 * @param {string} [context.landlordLanguage] - Landlord's language (if known)
 * @param {boolean} [context.includeTenantCopy] - Include tenant language in landlord letters
 * @param {boolean} [context.includeThaiCopy] - Include Thai copy
 * @param {boolean} [context.includeLandlordCopy] - Include landlord language in tenant letters
 * 
 * @returns {Object} { primary: string, allLanguages: string[] }
 */
export function buildLetterLanguagePack(context) {
  const {
    recipientType,
    tenantLanguage,
    landlordLanguage,
    includeTenantCopy = false,
    includeThaiCopy = false,
    includeLandlordCopy = false
  } = context;

  // Juristic: Always Thai + English
  if (recipientType === 'juristic') {
    return {
      primary: 'th',
      allLanguages: ['th', 'en']
    };
  }

  // Landlord letters
  if (recipientType === 'landlord') {
    const landlordLang = cleanLanguageCode(landlordLanguage, 'th');
    const tenantLang = cleanLanguageCode(tenantLanguage, 'en');
    
    const langs = new Set();
    langs.add(landlordLang); // Primary
    langs.add('en'); // Always include English

    if (includeTenantCopy) {
      langs.add(tenantLang);
    }
    if (includeThaiCopy && landlordLang !== 'th') {
      langs.add('th');
    }

    return {
      primary: landlordLang,
      allLanguages: Array.from(langs)
    };
  }

  // Tenant letters (default)
  const tenantLang = cleanLanguageCode(tenantLanguage, 'en');
  const landlordLang = cleanLanguageCode(landlordLanguage, 'th');
  
  const langs = new Set();
  langs.add(tenantLang); // Primary
  langs.add('en'); // Always include English

  if (includeLandlordCopy && landlordLanguage) {
    langs.add(landlordLang);
  }
  if (includeThaiCopy && tenantLang !== 'th') {
    langs.add('th');
  }

  return {
    primary: tenantLang,
    allLanguages: Array.from(langs)
  };
}

/**
 * Build language pack for maintenance notifications
 * Similar to letters but for emails/LINE messages
 * 
 * @param {Object} context
 * @param {string} context.recipientType - 'tenant' | 'landlord' | 'juristic'
 * @param {string} context.tenantLanguage
 * @param {string} [context.landlordLanguage]
 * 
 * @returns {Object} { primary: string, includeBilingual: boolean }
 */
export function buildNotificationLanguage(context) {
  const {
    recipientType,
    tenantLanguage,
    landlordLanguage
  } = context;

  // Juristic: Thai with English section
  if (recipientType === 'juristic') {
    return {
      primary: 'th',
      includeBilingual: true, // Include English section
      secondary: 'en'
    };
  }

  // Landlord: Landlord language with English section
  if (recipientType === 'landlord') {
    const landlordLang = cleanLanguageCode(landlordLanguage, 'th');
    return {
      primary: landlordLang,
      includeBilingual: true,
      secondary: 'en'
    };
  }

  // Tenant: Tenant language with optional English
  const tenantLang = cleanLanguageCode(tenantLanguage, 'en');
  return {
    primary: tenantLang,
    includeBilingual: tenantLang !== 'en', // Include English if not primary
    secondary: 'en'
  };
}

/**
 * Get language-specific label
 */
export function getLanguageLabel(code, currentLanguage = 'en') {
  const labels = {
    en: { en: 'English', th: 'Thai', ja: 'Japanese', zh: 'Chinese', ko: 'Korean', ru: 'Russian' },
    th: { en: 'อังกฤษ', th: 'ไทย', ja: 'ญี่ปุ่น', zh: 'จีน', ko: 'เกาหลี', ru: 'รัสเซีย' },
    zh: { en: '英语', th: '泰语', ja: '日语', zh: '中文', ko: '韩语', ru: '俄语' },
    ja: { en: '英語', th: 'タイ語', ja: '日本語', zh: '中国語', ko: '韓国語', ru: 'ロシア語' },
    ko: { en: '영어', th: '태국어', ja: '일본어', zh: '중국어', ko: '한국어', ru: '러시아어' },
    ru: { en: 'Английский', th: 'Тайский', ja: 'Японский', zh: 'Китайский', ko: 'Корейский', ru: 'Русский' }
  };

  return labels[currentLanguage]?.[code] || labels.en[code] || code;
}

/**
 * Format language list for display
 */
export function formatLanguageList(languages, currentLanguage = 'en') {
  if (!languages || languages.length === 0) return '';
  
  return languages
    .map(code => getLanguageLabel(code, currentLanguage))
    .join(', ');
}