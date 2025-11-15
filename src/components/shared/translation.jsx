/**
 * Translation helpers for multilingual maintenance notifications
 * Uses AI to detect and translate text with fallbacks
 */

import { base44 } from "@/api/base44Client";

/**
 * Detect language of text using AI
 * @param {string} text - Text to analyze
 * @returns {Promise<string>} - 2-letter language code (en, th, ja, ko, zh, etc.)
 */
export async function detectLanguage(text) {
  if (!text || text.trim().length < 3) return 'en';
  
  try {
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Return ONLY a 2-letter ISO language code (en, th, ja, ko, zh, etc.) for this text. If uncertain, return 'en'. Text: "${text.substring(0, 200)}"`,
      response_json_schema: {
        type: "object",
        properties: {
          code: { type: "string" }
        }
      }
    });
    
    const code = response?.code?.toLowerCase() || 'en';
    return code.length === 2 ? code : 'en';
  } catch (error) {
    console.error('Language detection failed:', error);
    return 'en';
  }
}

/**
 * Translate text to target language using AI
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (en, th, ja, etc.)
 * @returns {Promise<string>} - Translated text (or original if same language or error)
 */
export async function translateText(text, targetLang) {
  if (!text || !targetLang) return text;
  
  try {
    const detectedLang = await detectLanguage(text);
    
    if (detectedLang === targetLang) {
      return text;
    }
    
    const langNames = {
      en: 'English',
      th: 'Thai',
      ja: 'Japanese',
      ko: 'Korean',
      zh: 'Chinese'
    };
    
    const targetName = langNames[targetLang] || targetLang;
    
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Translate this text to ${targetName}. Return ONLY the translation, no explanations or commentary. Preserve the meaning and tone. Text: "${text}"`,
      response_json_schema: {
        type: "object",
        properties: {
          translation: { type: "string" }
        }
      }
    });
    
    return response?.translation || text;
  } catch (error) {
    console.error('Translation failed:', error);
    return text;
  }
}

/**
 * Translate with comprehensive metadata and fallback
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @returns {Promise<{detectedLang: string, translated: string, original: string}>}
 */
export async function translateWithFallback(text, targetLang) {
  const original = text || '';
  
  try {
    const detectedLang = await detectLanguage(original);
    const translated = await translateText(original, targetLang);
    
    return {
      detectedLang,
      translated,
      original
    };
  } catch (error) {
    console.error('Translation with fallback failed:', error);
    return {
      detectedLang: 'unknown',
      translated: original,
      original
    };
  }
}

/**
 * Get recipient language based on role
 * @param {string} role - Recipient role (tenant, landlord, juristic, etc.)
 * @param {object} user - Optional user object with language preference
 * @returns {string} - Language code
 */
export function getRecipientLanguage(role, user) {
  if (user?.language) return user.language;
  
  if (role === 'juristic' || role === 'building' || role === 'manager') return 'th';
  if (role === 'landlord' || role === 'owner') return 'en';
  
  return 'en';
}