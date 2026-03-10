/******************************************************************************
 * ⚠️ PRODUCTION CODE - RE-FROZEN March 3, 2026 ⚠️
 * 
 * Last Working State: March 3, 2026
 * Status: PRODUCTION READY
 * Version: 1.1.0
 * 
 * CHANGE LOG:
 * v1.1.0 (2026-03-03): Added image file detection to prevent crashes on 
 *   JPG/PNG uploads. PDFParser only works on PDF files — images now return
 *   a clear error instead of crashing.
 * v1.0.0 (2026-02-22): Initial frozen version.
 * 
 * Features working:
 * - OpenAI clause analysis (full mode) ✅
 * - Preview mode (top 5 risks summary) ✅
 * - Key terms extraction with fallback ✅
 * - PDF parsing and text extraction ✅
 * - Risk scoring and categorization ✅
 * - Image file rejection with clear error ✅
 * 
 * CRITICAL: scanMode logic determines tier display (preview vs full)
 ******************************************************************************/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import PDFParser from 'npm:pdf-parse@1.1.1';

// Helper functions for text extraction
function extractAddressFromText(text) {
  const addressPatterns = [
    /(?:property|premises|address|located at)[:\s]+([^\n]{10,150})/i,
    /(\d+[\/\-\s]?\d*\s+[A-Za-z\s,]+(?:Road|Street|Avenue|Lane|Drive|Soi|Thanon)[^\n]{0,50})/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+\d+[^\n]{10,80})/
  ];
  
  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) return match[1]?.trim();
  }
  return null;
}

function extractDateFromText(text, type = 'start') {
  const datePatterns = type === 'start' 
    ? [/(?:commence|start|from)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i]
    : [/(?:end|expire|until)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractRentFromText(text) {
  const rentPatterns = [
    /(?:rent|rental)[:\s]+(?:THB|฿|USD|\$)?\s*([\d,]+)/i,
    /(?:monthly payment)[:\s]+(?:THB|฿|USD|\$)?\s*([\d,]+)/i
  ];
  
  for (const pattern of rentPatterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(value)) return value;
    }
  }
  return null;
}

function extractDepositFromText(text) {
  const depositPatterns = [
    /(?:deposit|security)[:\s]+(?:THB|฿|USD|\$)?\s*([\d,]+)/i,
    /(?:guarantee)[:\s]+(?:THB|฿|USD|\$)?\s*([\d,]+)/i
  ];
  
  for (const pattern of depositPatterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(value)) return value;
    }
  }
  return null;
}

function extractRentDayFromText(text) {
  const dayPatterns = [
    /(?:due on|payable on)[:\s]+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?/i,
    /(?:rent)[^\n]{0,50}(\d{1,2})(?:st|nd|rd|th)?\s+(?:of each month|day)/i
  ];
  
  for (const pattern of dayPatterns) {
    const match = text.match(pattern);
    if (match) {
      const day = parseInt(match[1]);
      if (day >= 1 && day <= 31) return day;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  const correlationId = `analyze-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  console.log('[ANALYZE_LEASE_START]', {
    correlationId,
    timestamp: new Date().toISOString()
  });

  try {
    const base44 = createClientFromRequest(req);

    const bodyText = await req.text();
    let payload = {};
    try {
      payload = JSON.parse(bodyText || '{}');
    } catch (_) {
      payload = {};
    }

    const {
      fileUrl = null,
      leaseId = null,
      scanId: inputScanId = null,
      language = 'en',
      scanMode = 'full'
    } = payload;

    const isPreviewMode = scanMode === 'preview';

    console.log('[ANALYZE_LEASE_PARAMS]', {
      correlationId,
      leaseId,
      language,
      hasFileUrl: !!fileUrl,
      scanMode,
      isPreviewMode
    });

    if (!fileUrl || !leaseId) {
      return new Response(JSON.stringify({
        ok: false,
        step: 'INPUT_VALIDATION',
        error_code: 'MISSING_PARAMS',
        message: 'fileUrl and leaseId are required',
        correlationId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // FIX v1.1.0: Detect image files BEFORE attempting PDF parsing
    // PDFParser crashes on JPG/PNG — reject with clear error message
    // ═══════════════════════════════════════════════════════════════
    const urlPath = fileUrl.split('?')[0]; // Strip query params
    const fileExtension = urlPath.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff'].includes(fileExtension);
    
    console.log('[ANALYZE_LEASE_FILE_TYPE_CHECK]', {
      correlationId,
      fileExtension,
      isImage,
      urlPreview: fileUrl.substring(0, 100)
    });

    if (isImage) {
      console.warn('[ANALYZE_LEASE_IMAGE_REJECTED]', {
        correlationId,
        fileExtension,
        message: 'Image files not supported — PDF required'
      });
      
      return new Response(JSON.stringify({
        ok: false,
        step: 'FILE_TYPE_VALIDATION',
        error_code: 'IMAGE_NOT_SUPPORTED',
        message: 'Image files (JPG/PNG) are not yet supported. Please upload a PDF file with readable text.',
        correlationId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Download PDF
    console.log('[ANALYZE_LEASE_DOWNLOAD_START]', { correlationId, fileUrl });
    const pdfResponse = await fetch(fileUrl);
    if (!pdfResponse.ok) {
      return new Response(JSON.stringify({
        ok: false,
        step: 'PDF_DOWNLOAD',
        error_code: 'DOWNLOAD_FAILED',
        message: `Failed to download PDF: ${pdfResponse.statusText}`,
        correlationId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const contentType = pdfResponse.headers.get('content-type') || '';
    console.log('[ANALYZE_LEASE_FILE_DOWNLOADED]', {
      correlationId,
      sizeBytes: pdfBuffer.byteLength,
      contentType
    });

    // Second safety net: check content-type header for images
    const isImageContentType = contentType.startsWith('image/');
    if (isImageContentType) {
      console.warn('[ANALYZE_LEASE_IMAGE_CONTENT_TYPE_REJECTED]', {
        correlationId,
        contentType,
        message: 'Server returned image content-type — PDF required'
      });
      
      return new Response(JSON.stringify({
        ok: false,
        step: 'FILE_TYPE_VALIDATION',
        error_code: 'IMAGE_NOT_SUPPORTED',
        message: 'Image files (JPG/PNG) are not yet supported. Please upload a PDF file with readable text.',
        correlationId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract text from PDF
    console.log('[ANALYZE_LEASE_PDF_EXTRACTION_START]', { correlationId, isPreviewMode });
    const pdfData = await PDFParser(new Uint8Array(pdfBuffer));
    const pdfText = pdfData.text || '';
    const pageCount = pdfData.numpages || 0;

    console.log('[ANALYZE_LEASE_PDF_EXTRACTED]', {
      correlationId,
      textLength: pdfText.length,
      pages: pageCount
    });

    if (pdfText.length < 100) {
      return new Response(JSON.stringify({
        ok: false,
        step: 'PDF_EXTRACTION',
        error_code: 'TEXT_TOO_SHORT',
        message: 'Extracted text is too short - PDF may be empty or image-based',
        correlationId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call OpenAI for analysis
    console.log('[ANALYZE_LEASE_OPENAI_START]', {
      correlationId,
      inputLength: pdfText.length,
      isPreviewMode
    });

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({
        ok: false,
        step: 'CONFIG',
        error_code: 'MISSING_API_KEY',
        message: 'OpenAI API key not configured',
        correlationId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Language support for all 6 app languages
    const languageMap = {
      'en': 'English',
      'th': 'Thai',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ru': 'Russian'
    };
    const languageName = languageMap[language] || 'English';

    // CRITICAL: Different prompts for preview vs full mode
    const systemPrompt = isPreviewMode 
      ? `You are a lease analysis expert. Analyze this lease document and provide a risk assessment with executive summary and top risks.

CRITICAL: Respond entirely in ${languageName}. All analysis text, findings, summaries, risk descriptions, and recommendations must be written in ${languageName}. JSON keys must remain in English.

CRITICAL: You MUST return a valid JSON object with this EXACT structure (include ALL fields, especially key_terms FIRST):

{
  "key_terms": {
    "property_address": "string or null",
    "lease_start_date": "YYYY-MM-DD or null",
    "lease_end_date": "YYYY-MM-DD or null",
    "monthly_rent": number or null,
    "security_deposit": number or null,
    "rent_due_day": number or null
  },
  "risk_score": number (0-100),
  "summary": {
    "executive_summary": "string",
    "top_risks": [
      {
        "title": "string",
        "severity": "low|medium|high|critical",
        "why": "string"
      }
    ]
  },
  "preview_mode": true,
  "upgrade_message": "Upgrade to see full clause-by-clause analysis with detailed recommendations",
  "clauses": []
}

DO NOT omit key_terms. Extract property address, dates, and financial terms from the lease text.
Return ONLY valid JSON, no explanatory text.`
      : `You are a lease analysis expert.

CRITICAL: Respond entirely in ${languageName}. All analysis text, findings, summaries, risk descriptions, and recommendations must be written in ${languageName}. JSON keys must remain in English.

CRITICAL REQUIREMENT: Analyze EVERY SINGLE clause in this lease document. You MUST provide detailed analysis for ALL clauses found, including low-risk and standard clauses. Do not skip or selectively analyze clauses based on importance. If the lease contains 25 clauses, you must return 25 clause analyses. If it contains 50 clauses, return 50 analyses. EVERY clause must have analysis, risk assessment, and recommendations.

Return a JSON object with this structure:
{
  "key_terms": {
    "property_address": "string or null",
    "lease_start_date": "YYYY-MM-DD or null", 
    "lease_end_date": "YYYY-MM-DD or null",
    "monthly_rent": number or null,
    "security_deposit": number or null,
    "rent_due_day": number or null
  },
  "risk_score": number (0-100),
  "summary": {
    "executive_summary": "string",
    "top_risks": [{"title": "string", "severity": "low|medium|high|critical", "why": "string"}]
  },
  "clauses": [
    {
      "clause_id": "clause-N",
      "canonical_name": "string",
      "clause_text": "string",
      "risk_level": "low|medium|high|critical",
      "analysis": "string",
      "recommendations": ["string"],
      "page_number": number
    }
  ]
}

REMEMBER: Analyze ALL clauses completely. Return ONLY valid JSON.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this lease document:\n\n${pdfText.substring(0, 50000)}` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      return new Response(JSON.stringify({
        ok: false,
        step: 'OPENAI_API',
        error_code: 'API_ERROR',
        message: `OpenAI API error: ${errorText}`,
        correlationId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const completion = await openaiResponse.json();
    const analysisResult = JSON.parse(completion.choices[0].message.content);

    // CRITICAL FIX: Force fallback extraction for preview mode (OpenAI doesn't return key_terms)
    if (isPreviewMode && (!analysisResult.key_terms || Object.keys(analysisResult.key_terms).length === 0)) {
      console.log('[ANALYZE_LEASE_PREVIEW_FORCE_FALLBACK]', {
        correlationId,
        reason: 'Preview mode - OpenAI omits key_terms'
      });
      
      analysisResult.key_terms = {
        property_address: extractAddressFromText(pdfText) || "Address not found in document",
        lease_start_date: extractDateFromText(pdfText, 'start') || null,
        lease_end_date: extractDateFromText(pdfText, 'end') || null,
        monthly_rent: extractRentFromText(pdfText) || null,
        security_deposit: extractDepositFromText(pdfText) || null,
        rent_due_day: extractRentDayFromText(pdfText) || null
      };
    }

    console.log('[ANALYZE_LEASE_OPENAI_RAW_RESPONSE]', {
      correlationId,
      preview: JSON.stringify(analysisResult).substring(0, 500)
    });

    const returnedClauseCount = analysisResult.clauses?.length || 0;
    
    // WARNING: Check if OpenAI returned fewer clauses than expected
    if (returnedClauseCount < 10 && !isPreviewMode) {
      console.warn('[ANALYZE_LEASE_LOW_CLAUSE_COUNT]', {
        correlationId,
        returnedCount: returnedClauseCount,
        warning: 'OpenAI may have selectively analyzed clauses instead of ALL clauses'
      });
    }

    console.log('[ANALYZE_LEASE_OPENAI_COMPLETE]', {
      correlationId,
      clausesCount: returnedClauseCount,
      riskScore: analysisResult.risk_score,
      hasMissingClauses: !!analysisResult.missingCriticalClauses,
      missingClausesCount: analysisResult.missingCriticalClauses?.length || 0
    });

    // Validate clause numbering
    console.log('[ANALYZE_LEASE_VALIDATE_CLAUSE_NUMBERING]', { correlationId });
    const clauses = analysisResult.clauses || [];
    if (clauses.length > 0) {
      const hasValidIds = clauses.every(c => c.clause_id && /^clause-\d+$/.test(c.clause_id));
      if (!hasValidIds) {
        clauses.forEach((c, idx) => {
          if (!c.clause_id || !/^clause-\d+$/.test(c.clause_id)) {
            c.clause_id = `clause-${idx + 1}`;
          }
        });
      }
      console.log('[ANALYZE_LEASE_CLAUSE_NUMBERING_VALID]', {
        correlationId,
        count: clauses.length,
        range: `1-${clauses.length}`
      });
    }

    // Handle missing clauses
    console.log('[ANALYZE_LEASE_MISSING_CLAUSES_RAW]', {
      correlationId,
      hasMissingClauses: !!analysisResult.missingCriticalClauses,
      rawData: JSON.stringify(analysisResult.missingCriticalClauses),
      count: analysisResult.missingCriticalClauses?.length || 0
    });

    if (!analysisResult.missingCriticalClauses) {
      console.warn('[ANALYZE_LEASE_MISSING_CLAUSES_NOT_RETURNED]', {
        correlationId,
        receivedKeys: Object.keys(analysisResult)
      });
      analysisResult.missingCriticalClauses = [];
    }

    // ═══════════════════════════════════════════════════════════════
    // POST-PROCESSING: Agent Deposit Risk Flag
    // If lease does not explicitly state deposit is held by landlord/owner,
    // inject a HIGH risk flag about deposit holder ambiguity.
    // ═══════════════════════════════════════════════════════════════
    const depositHolderPatterns = [
      /deposit\s+(?:is\s+)?held\s+by\s+(?:the\s+)?(?:landlord|owner|lessor|property\s+owner)/i,
      /landlord\s+(?:shall\s+)?(?:hold|retain|keep)\s+(?:the\s+)?(?:security\s+)?deposit/i,
      /owner\s+(?:shall\s+)?(?:hold|retain|keep)\s+(?:the\s+)?(?:security\s+)?deposit/i,
      /lessor\s+(?:shall\s+)?(?:hold|retain|keep)\s+(?:the\s+)?(?:security\s+)?deposit/i,
      /deposit\s+(?:shall\s+be\s+)?(?:paid|remitted)\s+(?:directly\s+)?to\s+(?:the\s+)?(?:landlord|owner|lessor)/i,
      /เงินประกัน.*(?:ผู้ให้เช่า|เจ้าของ)/i,
      /ผู้ให้เช่า.*(?:รับ|เก็บ|ถือ).*เงินประกัน/i
    ];

    const fullTextForCheck = pdfText.toLowerCase();
    const clauseTexts = (analysisResult.clauses || []).map(c => (c.clause_text || '').toLowerCase()).join(' ');
    const combinedText = fullTextForCheck + ' ' + clauseTexts;

    const depositHolderSpecified = depositHolderPatterns.some(p => p.test(combinedText));

    if (!depositHolderSpecified) {
      const agentDepositFlag = {
        en: {
          title: 'Deposit Holder Not Specified',
          description: 'Your lease does not confirm who holds your deposit. If paid to an agent, there is no guarantee the landlord receives it. Ensure your receipt names the landlord as deposit holder before paying.'
        },
        th: {
          title: 'ไม่ระบุผู้ถือเงินประกัน',
          description: 'สัญญาเช่าของคุณไม่ได้ระบุว่าใครเป็นผู้ถือเงินประกัน หากจ่ายให้ตัวแทน ไม่มีการรับประกันว่าเจ้าของจะได้รับเงิน ตรวจสอบให้ใบเสร็จระบุชื่อเจ้าของเป็นผู้รับเงินประกันก่อนชำระ'
        },
        zh: {
          title: '未指定押金持有人',
          description: '您的租约未确认谁持有您的押金。如果支付给中介，无法保证房东会收到。付款前请确保收据上注明房东为押金持有人。'
        },
        ja: {
          title: '敷金の保管者が未指定',
          description: '賃貸契約書に敷金の保管者が明記されていません。仲介業者に支払った場合、大家に届く保証がありません。支払い前に領収書に大家が敷金保管者として記載されていることを確認してください。'
        },
        ko: {
          title: '보증금 보유자 미지정',
          description: '임대차 계약서에 보증금 보유자가 명시되어 있지 않습니다. 중개인에게 지불한 경우 집주인이 받는다는 보장이 없습니다. 지불 전에 영수증에 집주인이 보증금 보유자로 기재되어 있는지 확인하세요.'
        },
        ru: {
          title: 'Держатель депозита не указан',
          description: 'В вашем договоре аренды не указано, кто хранит ваш депозит. Если оплата произведена агенту, нет гарантии, что арендодатель его получит. Убедитесь, что в квитанции арендодатель указан как держатель депозита перед оплатой.'
        }
      };

      const flagLang = agentDepositFlag[language] || agentDepositFlag['en'];

      // Inject into flags array (used by LeaseScan entity)
      if (!analysisResult.flags) analysisResult.flags = [];
      analysisResult.flags.push({
        severity: 'high',
        category: 'Deposit',
        description: flagLang.description,
        title: flagLang.title
      });

      // Also inject into top_risks in summary so it appears in report
      if (analysisResult.summary?.top_risks) {
        analysisResult.summary.top_risks.push({
          title: flagLang.title,
          severity: 'high',
          why: flagLang.description
        });
      }

      console.log('[ANALYZE_LEASE_AGENT_DEPOSIT_FLAG]', {
        correlationId,
        flagInjected: true,
        language
      });
    } else {
      console.log('[ANALYZE_LEASE_AGENT_DEPOSIT_FLAG]', {
        correlationId,
        flagInjected: false,
        reason: 'Deposit holder explicitly specified in lease'
      });
    }

    // Normalize the scan_full structure
    const scanFull = {
      risk_score: analysisResult.risk_score || 0,
      summary: analysisResult.summary || {
        executive_summary: "Lease analysis complete.",
        top_risks: []
      },
      key_terms: analysisResult.key_terms || {},
      clauses: clauses,
      flags: analysisResult.flags || [],
      missingCriticalClauses: analysisResult.missingCriticalClauses || [],
      missingClauseCount: (analysisResult.missingCriticalClauses || []).length,
      preview_mode: isPreviewMode,
      upgrade_message: isPreviewMode ? analysisResult.upgrade_message : undefined,
      meta: {
        text_length: pdfText.length,
        chunks: 1,
        warnings: []
      }
    };

    console.log('[ANALYZE_LEASE_NORMALIZED]', {
      correlationId,
      clausesCount: scanFull.clauses.length,
      riskScore: scanFull.risk_score
    });

    // Database update
    console.log('[ANALYZE_LEASE_DB_UPDATE_START]', {
      correlationId,
      providedScanId: inputScanId,
      leaseId
    });

    const svc = base44.asServiceRole || base44;
    let targetScanId = inputScanId;

    if (!targetScanId) {
      console.warn('[ANALYZE_LEASE_NO_SCANID_PROVIDED]', { correlationId });
      const newScan = await svc.entities.LeaseScan.create({
        lease_id: leaseId,
        status: 'processing'
      });
      targetScanId = newScan.id;
      console.log('[ANALYZE_LEASE_SCAN_CREATED]', {
        correlationId,
        scanId: targetScanId
      });
    } else {
      console.log('[ANALYZE_LEASE_UPDATING_SPECIFIC_SCAN]', {
        correlationId,
        scanId: targetScanId
      });
    }

    await svc.entities.LeaseScan.update(targetScanId, {
      scan_full: scanFull,
      risk_score: scanFull.risk_score,
      summary: scanFull.summary?.executive_summary || "Lease analysis complete.",
      status: 'completed'
    });

    console.log('[ANALYZE_LEASE_SCAN_UPDATED_SUCCESS]', {
      correlationId,
      scanId: targetScanId,
      clausesCount: scanFull.clauses.length
    });

    console.log('[ANALYZE_LEASE_SUCCESS]', {
      correlationId,
      scanId: targetScanId,
      clausesCount: scanFull.clauses.length
    });

    // DISABLED: Auto-populate moved to populateFromScan.js
    console.log('[AUTO_POPULATE_DISABLED]', {
      correlationId,
      leaseId,
      reason: 'Tracker creation consolidated to populateFromScan.js only'
    });

    return new Response(JSON.stringify({
      ok: true,
      scanId: targetScanId,
      leaseId: leaseId,
      scan_full: scanFull,
      correlationId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ANALYZE_LEASE_ERROR]', {
      correlationId,
      error: String(error),
      stack: error.stack
    });

    return new Response(JSON.stringify({
      ok: false,
      step: 'FUNCTION_CRASH',
      error_code: 'UNHANDLED_EXCEPTION',
      message: String(error?.message || error),
      correlationId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});