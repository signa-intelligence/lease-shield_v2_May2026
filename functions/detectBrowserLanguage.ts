import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Detects browser language and sets user preference automatically
 * Called on first app load for new users
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If user already has a language preference, don't override
    if (user.language && user.language !== 'en') {
      return Response.json({ 
        success: true, 
        language: user.language,
        alreadySet: true 
      });
    }

    const { headers } = await req.json();
    const acceptLanguage = headers['accept-language'] || headers['Accept-Language'] || '';
    
    // Parse Accept-Language header
    // Format: "en-US,en;q=0.9,th;q=0.8,zh-CN;q=0.7"
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, qValue] = lang.trim().split(';');
        const quality = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
        return { code: code.split('-')[0].toLowerCase(), quality };
      })
      .sort((a, b) => b.quality - a.quality);

    // Supported languages
    const supportedLanguages = ['en', 'th', 'zh', 'ja', 'ko'];
    
    // Find first supported language
    let detectedLanguage = 'en'; // Default fallback
    for (const lang of languages) {
      if (supportedLanguages.includes(lang.code)) {
        detectedLanguage = lang.code;
        break;
      }
    }

    // Update user's language preference
    await base44.auth.updateMe({ language: detectedLanguage });

    return Response.json({
      success: true,
      language: detectedLanguage,
      detected: true,
      browserLanguages: languages.map(l => l.code)
    });

  } catch (error) {
    console.error('Language detection error:', error);
    return Response.json({ 
      error: error.message,
      success: false,
      language: 'en' // Safe fallback
    }, { status: 500 });
  }
});