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
    const { fileUrl, leaseId, scanId, language = "en" } = body || {};
    
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
    const systemPrompt = `You are an expert legal analyst specializing in residential lease agreements in Thailand and Southeast Asia. Your task is to extract and analyze EVERY SINGLE CLAUSE in the lease document with NO LIMIT.

CRITICAL INSTRUCTIONS:
1. Extract ALL clauses - if the document has 50 clauses, extract all 50
2. Analyze EVERY clause, not just risky ones
3. Include standard clauses with risk_level "none" 
4. Be thorough - analyze every numbered section, paragraph, and provision
5. Provide actionable recommendations for each clause
6. Do not skip or summarize - extract the complete text for each clause

COVERAGE CHECKLIST - Make sure to find and analyze:
✓ Rent & Payment Terms (amount, due date, late fees, payment methods, increases)
✓ Security Deposit (amount, conditions, return timeline, deductions)
✓ Lease Duration (start date, end date, renewal terms, notice periods)
✓ Property Use (permitted uses, prohibited activities, business restrictions)
✓ Guests & Occupancy (guest policies, subletting, assignment)
✓ Maintenance & Repairs (landlord responsibilities, tenant responsibilities, procedures)
✓ Utilities & Services (which utilities each party pays)
✓ Property Condition (move-in inspection, alterations, cleaning requirements)
✓ Pets & Animals (pet policy, deposits, restrictions, service animals)
✓ Access & Privacy (landlord entry rights, notice requirements)
✓ Insurance & Liability (renter's insurance, liability for damages)
✓ Termination & Eviction (notice requirements, grounds, procedures)
✓ Parking & Storage (spaces, restrictions, fees)
✓ Common Areas (usage rules, maintenance)
✓ Noise & Conduct (quiet hours, disturbances)
✓ Hazardous Activities (prohibited items/activities)
✓ Legal & Jurisdiction (applicable laws, dispute resolution)
✓ Default & Remedies (what happens if either party breaches)
✓ Special Provisions (any unique terms specific to this lease)

For EACH clause found, return:
{
  "clause_id": "clause-X",
  "canonical_name": "Brief category name (e.g., 'Late Payment Penalties')",
  "clause_text": "The actual text from the document (up to 200 chars, extract the key part)",
  "risk_level": "none|low|medium|high|critical",
  "explanation": "What this means for the tenant in simple, clear language",
  "recommended_action": "Specific action the tenant should take"
}

RISK LEVEL GUIDELINES:
- "critical": Clause is severely one-sided, potentially illegal, or could cause major financial harm
- "high": Clause significantly favors landlord or creates substantial risk for tenant
- "medium": Clause is somewhat unfavorable but negotiable
- "low": Clause is slightly unfavorable but standard practice
- "none": Clause is balanced and fair to both parties

Return comprehensive JSON (extract ALL clauses, not just 15-25):
{
  "risk_score": 0-100,
  "summary": {
    "executive_summary": "2-3 sentences overall assessment of the lease",
    "top_risks": [
      {"title": "Risk name", "severity": "high|critical", "why": "Brief explanation"}
    ]
  },
  "clauses": [... ALL clauses found in document ...],
  "meta": {
    "text_length": 5000,
    "chunks": 1,
    "warnings": []
  }
}

IMPORTANT: Extract EVERY clause you find. A typical lease has 30-60 clauses. If you only find 15, you're missing clauses. Keep reading until you've covered the entire document.`;
    
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
              content: `Analyze this complete lease document (language: ${language}). Extract EVERY SINGLE CLAUSE - do not stop at 15 or 25. A typical lease has 30-60 clauses. Read the entire document thoroughly:\n\n${pdfText.slice(0, 15000)}`
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
                  text: `Analyze this complete lease document image (language: ${language}). Extract EVERY SINGLE CLAUSE - do not stop at 15 or 25. A typical lease has 30-60 clauses. Read carefully and provide comprehensive analysis.`
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
    
    // Check minimum clauses (lowered to 5 to catch genuinely short documents)
    if (analysisResult.clauses.length < 5) {
      console.warn('[ANALYZE_LEASE_INSUFFICIENT_CLAUSES]', { 
        correlationId, 
        count: analysisResult.clauses.length 
      });
      return json(400, {
        ok: false,
        step: 'VALIDATION',
        error_code: 'INSUFFICIENT_CLAUSES',
        message: `Only extracted ${analysisResult.clauses.length} clauses. This seems too few for a complete lease document. The document may be incomplete or unreadable.`,
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
    
    // Create or update scan record - FIXED to use provided scanId
    const svc = base44.asServiceRole || base44;

    // Get scanId from request body if provided
    const providedScanId = body.scanId || null;

    console.log('[ANALYZE_LEASE_DB_UPDATE_START]', { 
      correlationId, 
      providedScanId,
      leaseId
    });

    let scan;
    try {
      if (providedScanId) {
        // Update the specific scan that was provided
        console.log('[ANALYZE_LEASE_UPDATING_SPECIFIC_SCAN]', { 
          correlationId, 
          scanId: providedScanId 
        });

        scan = await svc.entities.LeaseScan.update(providedScanId, {
          scan_full: analysisResult,
          risk_score: analysisResult.risk_score,
          status: 'completed'
        });

        console.log('[ANALYZE_LEASE_SCAN_UPDATED_SUCCESS]', { 
          correlationId, 
          scanId: scan.id,
          clausesCount: analysisResult.clauses.length
        });

      } else {
        // No scanId provided - this shouldn't happen, but handle it
        console.warn('[ANALYZE_LEASE_NO_SCANID_PROVIDED]', { correlationId });

        // Create new scan
        scan = await svc.entities.LeaseScan.create({
          lease_id: leaseId,
          scan_full: analysisResult,
          risk_score: analysisResult.risk_score,
          status: 'completed'
        });

        console.log('[ANALYZE_LEASE_SCAN_CREATED]', { 
          correlationId, 
          scanId: scan.id 
        });
      }
    } catch (e) {
      console.error('[ANALYZE_LEASE_DB_ERROR]', { 
        correlationId,
        scanId: providedScanId,
        error: e.message,
        stack: e.stack
      });

      return json(500, {
        ok: false,
        step: 'DATABASE',
        error_code: 'DB_UPDATE_FAILED',
        message: `Failed to update scan: ${e.message}`,
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