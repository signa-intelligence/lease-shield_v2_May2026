import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";
import OpenAI from "npm:openai@4.28.0";

/**
 * Analyze lease document (PDF or Image) using OpenAI GPT-4
 * Replaces Cloudflare worker + canonical ledger with single intelligent analysis
 * 
 * @param {Object} body - { fileUrl, leaseId, language }
 * @returns Comprehensive lease analysis with 15-25 clauses
 */

const ALLOWED_ORIGINS = [
  "https://app.leaseshield.asia",
  "https://leaseshield.asia",
  "http://localhost:5173",
  "http://localhost:3000",
];

function corsHeaders(req) {
  const origin = req.headers.get("origin") || "";
  const allowed =
    !origin ||
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith(".leaseshield.asia") ||
    origin.endsWith(".lovable.app") ||
    origin.endsWith(".base44.com");
  
  const allowOrigin = allowed ? (origin || "*") : "";
  
  return {
    allowed,
    headers: {
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    }
  };
}

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

Deno.serve(async (req) => {
  const { allowed, headers } = corsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  
  if (!allowed) {
    return json(403, { error: "CORS_FORBIDDEN", message: "Origin not allowed" }, headers);
  }
  
  if (req.method !== "POST") {
    return json(405, { error: "METHOD_NOT_ALLOWED" }, headers);
  }
  
  const correlationId = `analyze-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  console.log('[ANALYZE_LEASE_START]', { correlationId, timestamp: new Date().toISOString() });
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Auth check
    let user;
    try {
      user = await base44.auth.me();
    } catch (e) {
      console.error('[ANALYZE_LEASE_AUTH_FAILED]', { correlationId, error: e.message });
      return json(401, { error: "UNAUTHORIZED" }, headers);
    }
    
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { fileUrl, leaseId, language = "en" } = body || {};
    
    console.log('[ANALYZE_LEASE_PARAMS]', { correlationId, leaseId, language, hasFileUrl: !!fileUrl });
    
    if (!fileUrl) {
      return json(400, {
        ok: false,
        step: 'VALIDATION',
        error_code: 'MISSING_FILE_URL',
        message: 'fileUrl is required',
        correlationId
      }, headers);
    }
    
    if (!leaseId) {
      return json(400, {
        ok: false,
        step: 'VALIDATION',
        error_code: 'MISSING_LEASE_ID',
        message: 'leaseId is required',
        correlationId
      }, headers);
    }
    
    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('[ANALYZE_LEASE_NO_API_KEY]', { correlationId });
      return json(500, {
        ok: false,
        step: 'CONFIG',
        error_code: 'MISSING_OPENAI_API_KEY',
        message: 'OPENAI_API_KEY not configured',
        correlationId
      }, headers);
    }
    
    // Download file
    console.log('[ANALYZE_LEASE_DOWNLOAD_START]', { correlationId, fileUrl });
    
    let fileResponse;
    try {
      fileResponse = await fetch(fileUrl, {
        signal: AbortSignal.timeout(30000)
      });
    } catch (e) {
      console.error('[ANALYZE_LEASE_DOWNLOAD_FAILED]', { correlationId, error: e.message });
      return json(400, {
        ok: false,
        step: 'FILE_DOWNLOAD',
        error_code: 'DOWNLOAD_FAILED',
        message: `Failed to download file: ${e.message}`,
        correlationId
      }, headers);
    }
    
    if (!fileResponse.ok) {
      console.error('[ANALYZE_LEASE_DOWNLOAD_HTTP_ERROR]', { 
        correlationId, 
        status: fileResponse.status 
      });
      return json(400, {
        ok: false,
        step: 'FILE_DOWNLOAD',
        error_code: 'DOWNLOAD_HTTP_ERROR',
        message: `Failed to download file: HTTP ${fileResponse.status}`,
        correlationId
      }, headers);
    }
    
    const fileBlob = await fileResponse.blob();
    const fileBuffer = await fileBlob.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);
    
    console.log('[ANALYZE_LEASE_FILE_DOWNLOADED]', { 
      correlationId, 
      sizeBytes: fileBytes.length,
      contentType: fileResponse.headers.get('content-type')
    });
    
    // Determine file type
    const fileUrlLower = fileUrl.toLowerCase();
    const isPdf = fileUrlLower.endsWith('.pdf');
    const isImage = ['.jpg', '.jpeg', '.png'].some(ext => fileUrlLower.endsWith(ext));
    
    if (!isPdf && !isImage) {
      return json(400, {
        ok: false,
        step: 'VALIDATION',
        error_code: 'UNSUPPORTED_FILE_TYPE',
        message: 'Only PDF and image files (JPG, PNG) are supported',
        correlationId
      }, headers);
    }
    
    // System prompt for comprehensive analysis
    const systemPrompt = `You are an expert legal analyst specializing in residential lease agreements in Thailand and Southeast Asia. Your task is to extract and analyze EVERY clause in the lease document.

CRITICAL INSTRUCTIONS:
1. Extract 15-25 clauses minimum (more if the document has them)
2. Analyze ALL clauses, not just risky ones
3. Include standard clauses with risk_level "none" 
4. Be thorough - don't skip numbered sections or paragraphs
5. Provide actionable recommendations for each clause

For EACH clause, return:
{
  "clause_id": "clause-1",
  "canonical_name": "Brief category name (e.g., 'Rent Payment Terms')",
  "clause_text": "Exact text from document (max 200 chars)",
  "risk_level": "none|low|medium|high|critical",
  "explanation": "What this means for the tenant in simple language",
  "recommended_action": "Specific action tenant should take"
}

Return comprehensive JSON:
{
  "risk_score": 0-100,
  "summary": {
    "executive_summary": "2-3 sentences overall assessment",
    "top_risks": [
      {"title": "Risk name", "severity": "high", "why": "Brief explanation"}
    ]
  },
  "clauses": [... 15-25 clauses ...],
  "meta": {
    "text_length": 5000,
    "chunks": 1,
    "warnings": []
  }
}`;
    
    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey: openaiApiKey });
    
    let analysisResult;
    
    if (isPdf) {
      // For PDF: Extract text first, then analyze
      console.log('[ANALYZE_LEASE_PDF_EXTRACTION_START]', { correlationId });
      
      // Use pdf-parse for text extraction
      const pdfParse = (await import("npm:pdf-parse@1.1.1")).default;
      let pdfText = "";
      
      try {
        const pdfData = await pdfParse(fileBytes);
        pdfText = pdfData.text;
        
        console.log('[ANALYZE_LEASE_PDF_EXTRACTED]', { 
          correlationId, 
          textLength: pdfText.length,
          pages: pdfData.numpages
        });
        
        if (!pdfText.trim()) {
          return json(400, {
            ok: false,
            step: 'PDF_EXTRACTION',
            error_code: 'NO_TEXT_EXTRACTED',
            message: 'Could not extract text from PDF. It may be an image-based PDF.',
            correlationId
          }, headers);
        }
      } catch (e) {
        console.error('[ANALYZE_LEASE_PDF_EXTRACTION_FAILED]', { 
          correlationId, 
          error: e.message 
        });
        return json(400, {
          ok: false,
          step: 'PDF_PROCESSING',
          error_code: 'PDF_ERROR',
          message: `PDF processing failed: ${e.message}`,
          correlationId
        }, headers);
      }
      
      // Analyze with OpenAI
      console.log('[ANALYZE_LEASE_OPENAI_START]', { correlationId, inputLength: pdfText.length });
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { 
              role: "user", 
              content: `Analyze this lease document (language: ${language}). Extract ALL clauses (15-25 minimum):\n\n${pdfText.slice(0, 15000)}`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 4000,
          temperature: 0.2
        });
        
        analysisResult = JSON.parse(completion.choices[0].message.content);
        
        console.log('[ANALYZE_LEASE_OPENAI_COMPLETE]', { 
          correlationId, 
          clausesCount: analysisResult.clauses?.length || 0,
          riskScore: analysisResult.risk_score
        });
      } catch (e) {
        console.error('[ANALYZE_LEASE_OPENAI_FAILED]', { correlationId, error: e.message });
        return json(500, {
          ok: false,
          step: 'OPENAI_ANALYSIS',
          error_code: 'OPENAI_ERROR',
          message: `OpenAI analysis failed: ${e.message}`,
          correlationId
        }, headers);
      }
      
    } else if (isImage) {
      // For Image: Use vision API
      console.log('[ANALYZE_LEASE_IMAGE_VISION_START]', { correlationId });
      
      // Convert to base64
      const base64Image = btoa(String.fromCharCode(...fileBytes));
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { 
              role: "user", 
              content: [
                {
                  type: "text",
                  text: `Analyze this lease document image (language: ${language}). Extract ALL clauses (15-25 minimum). Read carefully and provide comprehensive analysis.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: "high"
                  }
                }
              ]
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 4000,
          temperature: 0.2
        });
        
        analysisResult = JSON.parse(completion.choices[0].message.content);
        
        console.log('[ANALYZE_LEASE_VISION_COMPLETE]', { 
          correlationId, 
          clausesCount: analysisResult.clauses?.length || 0,
          riskScore: analysisResult.risk_score
        });
      } catch (e) {
        console.error('[ANALYZE_LEASE_VISION_FAILED]', { correlationId, error: e.message });
        return json(500, {
          ok: false,
          step: 'IMAGE_PROCESSING',
          error_code: 'IMAGE_ERROR',
          message: `Image processing failed: ${e.message}`,
          correlationId
        }, headers);
      }
    }
    
    // Validate and normalize result
    if (!analysisResult || typeof analysisResult !== 'object') {
      analysisResult = {};
    }
    
    if (typeof analysisResult.risk_score !== 'number') {
      analysisResult.risk_score = 50;
    }
    
    if (!analysisResult.summary || typeof analysisResult.summary !== 'object') {
      analysisResult.summary = {};
    }
    
    if (!analysisResult.summary.executive_summary) {
      analysisResult.summary.executive_summary = "Lease analysis complete.";
    }
    
    if (!Array.isArray(analysisResult.summary.top_risks)) {
      analysisResult.summary.top_risks = [];
    }
    
    if (!Array.isArray(analysisResult.clauses)) {
      analysisResult.clauses = [];
    }
    
    // Normalize clauses
    const normalizedClauses = [];
    for (let idx = 0; idx < analysisResult.clauses.length; idx++) {
      const clause = analysisResult.clauses[idx];
      if (!clause || typeof clause !== 'object') continue;
      
      const normalized = {
        clause_id: clause.clause_id || `clause-${idx + 1}`,
        canonical_name: clause.canonical_name || `Clause ${idx + 1}`,
        clause_text: String(clause.clause_text || '').slice(0, 200),
        risk_level: String(clause.risk_level || 'none').toLowerCase(),
        explanation: clause.explanation || 'Review required',
        recommended_action: clause.recommended_action || 'Consult with landlord'
      };
      
      // Validate risk_level
      if (!['none', 'low', 'medium', 'high', 'critical'].includes(normalized.risk_level)) {
        normalized.risk_level = 'none';
      }
      
      normalizedClauses.push(normalized);
    }
    
    analysisResult.clauses = normalizedClauses;
    
    // Check minimum clauses
    if (analysisResult.clauses.length < 3) {
      console.warn('[ANALYZE_LEASE_INSUFFICIENT_CLAUSES]', { 
        correlationId, 
        count: analysisResult.clauses.length 
      });
      return json(400, {
        ok: false,
        step: 'VALIDATION',
        error_code: 'INSUFFICIENT_CLAUSES',
        message: `Only extracted ${analysisResult.clauses.length} clauses. Expected at least 15. The document may not be a complete lease agreement.`,
        retryable: true,
        correlationId
      }, headers);
    }
    
    // Add metadata
    if (!analysisResult.meta || typeof analysisResult.meta !== 'object') {
      analysisResult.meta = {};
    }
    
    analysisResult.meta.text_length = analysisResult.clauses.reduce(
      (sum, c) => sum + (c.clause_text?.length || 0), 
      0
    );
    analysisResult.meta.chunks = 1;
    analysisResult.meta.warnings = analysisResult.meta.warnings || [];
    
    console.log('[ANALYZE_LEASE_NORMALIZED]', { 
      correlationId, 
      clausesCount: analysisResult.clauses.length,
      riskScore: analysisResult.risk_score
    });
    
    // Create or update scan record
    const svc = base44.asServiceRole || base44;
    
    let scan;
    try {
      // Check if scan already exists for this lease
      const existingScans = await svc.entities.LeaseScan.filter({ lease_id: leaseId });
      
      if (existingScans.length > 0) {
        // Update existing scan
        scan = await svc.entities.LeaseScan.update(existingScans[0].id, {
          scan_full: analysisResult,
          risk_score: analysisResult.risk_score
        });
        
        console.log('[ANALYZE_LEASE_SCAN_UPDATED]', { 
          correlationId, 
          scanId: scan.id 
        });
      } else {
        // Create new scan
        scan = await svc.entities.LeaseScan.create({
          lease_id: leaseId,
          scan_full: analysisResult,
          risk_score: analysisResult.risk_score
        });
        
        console.log('[ANALYZE_LEASE_SCAN_CREATED]', { 
          correlationId, 
          scanId: scan.id 
        });
      }
    } catch (e) {
      console.error('[ANALYZE_LEASE_DB_ERROR]', { 
        correlationId, 
        error: e.message 
      });
      return json(500, {
        ok: false,
        step: 'DATABASE',
        error_code: 'DB_ERROR',
        message: `Failed to save scan: ${e.message}`,
        correlationId
      }, headers);
    }
    
    console.log('[ANALYZE_LEASE_SUCCESS]', { 
      correlationId, 
      scanId: scan.id,
      clausesCount: analysisResult.clauses.length
    });
    
    return json(200, {
      ok: true,
      scanId: scan.id,
      leaseId: leaseId,
      scan_full: analysisResult,
      correlationId
    }, headers);
    
  } catch (e) {
    console.error('[ANALYZE_LEASE_UNEXPECTED_ERROR]', { 
      correlationId, 
      error: e.message,
      stack: e.stack
    });
    
    return json(500, {
      ok: false,
      step: 'UNEXPECTED_ERROR',
      error_code: 'SERVER_ERROR',
      message: `Unexpected error: ${e.message}`,
      correlationId
    }, headers);
  }
});