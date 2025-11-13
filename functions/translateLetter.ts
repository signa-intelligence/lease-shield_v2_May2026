import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Translates legal letters to user's preferred language
 * Uses AI for natural, human-sounding translations
 * Always includes disclaimer that letters are templates, not legal advice
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { letterContent, targetLanguage, letterType } = await req.json();

    if (!letterContent || !targetLanguage) {
      return Response.json({ 
        error: 'Missing required fields: letterContent, targetLanguage' 
      }, { status: 400 });
    }

    // If already in target language, return as is
    if (targetLanguage === 'en' || targetLanguage === 'th') {
      return Response.json({
        success: true,
        translatedContent: letterContent,
        language: targetLanguage,
        translated: false
      });
    }

    // Language names for better prompts
    const languageNames = {
      zh: 'Simplified Chinese (简体中文)',
      ja: 'Japanese (日本語)',
      ko: 'Korean (한국어)'
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;

    // Disclaimer in all languages
    const disclaimers = {
      en: `⚠️ IMPORTANT DISCLAIMER:\nThis letter is a template for informational purposes only. It does not constitute legal advice. For legal matters, please consult a qualified attorney in Thailand.`,
      th: `⚠️ คำเตือนสำคัญ:\nจดหมายฉบับนี้เป็นแบบฟอร์มเพื่อการให้ข้อมูลเท่านั้น ไม่ถือเป็นคำแนะนำทางกฎหมาย สำหรับเรื่องทางกฎหมาย กรุณาปรึกษาทนายความที่มีใบอนุญาตในประเทศไทย`,
      zh: `⚠️ 重要免责声明：\n本信函仅为信息模板，不构成法律建议。如有法律事务，请咨询泰国的执业律师。`,
      ja: `⚠️ 重要な免責事項：\nこの書簡は情報提供のみを目的としたテンプレートです。法的助言を構成するものではありません。法的問題については、タイの資格を持つ弁護士にご相談ください。`,
      ko: `⚠️ 중요 면책 조항:\n이 서신은 정보 제공 목적의 템플릿일 뿐이며 법적 조언을 구성하지 않습니다. 법적 문제는 태국의 자격을 갖춘 변호사와 상담하시기 바랍니다。`
    };

    // Create translation prompt with emphasis on natural, human tone
    const translationPrompt = `You are a professional translator specializing in rental dispute letters in Thailand. 

Translate the following letter to ${targetLangName}.

CRITICAL REQUIREMENTS:
1. Use natural, human-sounding language (NOT robotic or stiff)
2. Maintain professional but friendly tone
3. Keep cultural sensitivity for Thai rental context
4. Preserve all formatting, dates, amounts, and names exactly
5. Sound like a real person wrote it, not a machine
6. Use polite but firm language appropriate for landlord communications
7. Maintain the structure but make it flow naturally

LETTER TYPE: ${letterType || 'General correspondence'}

ORIGINAL LETTER:
${letterContent}

Respond with ONLY the translated letter content. Do not include explanations or notes.`;

    // Call LLM for translation
    const translation = await base44.integrations.Core.InvokeLLM({
      prompt: translationPrompt,
      add_context_from_internet: false
    });

    // Add disclaimer
    const finalContent = `${disclaimers[targetLanguage]}\n\n${translation}\n\n---\n\n${disclaimers.en}`;

    return Response.json({
      success: true,
      translatedContent: finalContent,
      language: targetLanguage,
      translated: true,
      disclaimer: disclaimers[targetLanguage]
    });

  } catch (error) {
    console.error('Translation error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});