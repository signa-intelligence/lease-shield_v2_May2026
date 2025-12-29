/**
 * Runtime template translation utility
 * Translates template content from EN to target language using LLM
 * Caches results in session storage to minimize API calls
 */

import { base44 } from "@/api/base44Client";

// Session cache for translated content
const translationCache = new Map();

/**
 * Get cache key for a translation
 */
function getCacheKey(templateKey, contentType, targetLang) {
  return `template_${templateKey}_${contentType}_${targetLang}`;
}

/**
 * Translate template content to target language
 * @param {string} templateKey - Template identifier
 * @param {string} content - Content to translate (EN source)
 * @param {string} targetLang - Target language (zh, ja, ko, ru)
 * @param {string} contentType - 'title', 'description', or 'preview'
 * @returns {Promise<string>} Translated content
 */
export async function translateTemplateContent(templateKey, content, targetLang, contentType = 'preview') {
  // Return original if already in EN/TH
  if (['en', 'th'].includes(targetLang)) {
    return content;
  }

  // Check cache first
  const cacheKey = getCacheKey(templateKey, contentType, targetLang);
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  // Validate input
  if (!content || content.trim().length < 5) {
    return content;
  }

  try {
    // Language names for prompt
    const langNames = {
      zh: 'Simplified Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      ru: 'Russian'
    };

    const targetLangName = langNames[targetLang] || targetLang;

    // Tailored prompt based on content type
    let prompt = '';
    if (contentType === 'title') {
      prompt = `Translate this document title to ${targetLangName}. Keep it concise and professional:\n\n"${content}"\n\nProvide ONLY the translated title, no explanation.`;
    } else if (contentType === 'description') {
      prompt = `Translate this brief description to ${targetLangName}. Keep it concise:\n\n"${content}"\n\nProvide ONLY the translated description, no explanation.`;
    } else {
      // For preview content
      prompt = `Translate the following legal document template to ${targetLangName}. Maintain professional legal tone, formatting, and structure:\n\n${content}\n\nProvide ONLY the translated text, preserving all formatting and line breaks.`;
    }

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: false
    });

    const translated = typeof response === 'string' ? response.trim() : (response.text || content);

    // Cache the result
    translationCache.set(cacheKey, translated);

    return translated;
  } catch (error) {
    console.error('[TRANSLATE] Failed to translate template content:', error);
    // Return original content on error
    return content;
  }
}

/**
 * Batch translate template metadata (title + description)
 * @param {object} template - Template with title_en, description_en
 * @param {string} targetLang - Target language
 * @returns {Promise<{title: string, description: string}>}
 */
export async function translateTemplateMetadata(template, targetLang) {
  if (['en', 'th'].includes(targetLang)) {
    return {
      title: targetLang === 'th' ? (template.title_th || template.title_en) : template.title_en,
      description: targetLang === 'th' ? (template.description_th || template.description_en) : template.description_en
    };
  }

  const titleEn = template.title_en || '';
  const descEn = template.description_en || '';

  // Translate both in parallel
  const [title, description] = await Promise.all([
    translateTemplateContent(template.template_key, titleEn, targetLang, 'title'),
    translateTemplateContent(template.template_key, descEn, targetLang, 'description')
  ]);

  return { title, description };
}

/**
 * Clear translation cache (useful for memory management)
 */
export function clearTranslationCache() {
  translationCache.clear();
}