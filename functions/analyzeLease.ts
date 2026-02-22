/******************************************************************************
 * ⚠️ PRODUCTION CODE - FROZEN - DO NOT MODIFY ⚠️
 * 
 * Last Working State: February 22, 2026
 * Status: PRODUCTION READY - LAUNCHING TO CUSTOMERS
 * Version: 1.0.0
 * 
 * Features working:
 * - OpenAI clause analysis (full mode) ✅
 * - Preview mode (top 5 risks summary) ✅
 * - Key terms extraction with fallback ✅
 * - PDF parsing and text extraction ✅
 * - Risk scoring and categorization ✅
 * 
 * CRITICAL: scanMode logic determines tier display (preview vs full)
 * 
 * Change process: See CHANGE_REQUEST_TEMPLATE.md
 * Get approval from: steve.l@signa-consultants.com
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
    console.log('[ANALYZE_LEASE_FILE_DOWNLOADED]', {
      correlationId,
      sizeBytes: pdfBuffer.byteLength,
      contentType: pdfResponse.headers.get('content-type')
    });

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

    // CRITICAL: Different prompts for preview vs full mode
    const systemPrompt = isPreviewMode 
      ? `You are a lease analysis expert. Analyze this lease document and provide a risk assessment with executive summary and top risks.

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

    // Normalize the scan_full structure
    const scanFull = {
      risk_score: analysisResult.risk_score || 0,
      summary: analysisResult.summary || {
        executive_summary: "Lease analysis complete.",
        top_risks: []
      },
      key_terms: analysisResult.key_terms || {},
      clauses: clauses,
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