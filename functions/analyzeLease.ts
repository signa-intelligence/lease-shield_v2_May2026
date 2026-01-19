// PRODUCTION CODE - DO NOT MODIFY WITHOUT EXPLICIT APPROVAL
// Last verified working: 2026-01-13

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
    const systemPrompt = `You are LeaseShield's AI analyst specializing in residential lease agreements in Thailand and Southeast Asia. Your task is to extract and analyze EVERY SINGLE CLAUSE in the lease document with NO LIMIT.

═══════════════════════════════════════════════════════════════════════════
CRITICAL INSTRUCTION - CLAUSE NUMBERING (HIGHEST PRIORITY):
═══════════════════════════════════════════════════════════════════════════

You MUST analyze the lease clause-by-clause in SEQUENTIAL ORDER as they 
appear in the document. DO NOT re-arrange by risk level.

PROCESS:
1. Read clause #1 from the lease
2. Extract: original_clause_number="1", original_clause_title="PARTIES", risk_level, analysis
3. Read clause #2 from the lease
4. Extract: original_clause_number="2", original_clause_title="LEASED PROPERTY", risk_level, analysis
5. Continue for ALL clauses in document order
6. Return clauses array in the SAME order you read them

EXAMPLE OUTPUT FORMAT:
{
  "clauses": [
    {
      "original_clause_number": "1",
      "original_clause_title": "PARTIES",
      "risk_level": "none",
      "explanation": "Identifies landlord and tenant..."
    },
    {
      "original_clause_number": "2",
      "original_clause_title": "LEASED PROPERTY",
      "risk_level": "none",
      "explanation": "Describes the unit being leased..."
    },
    {
      "original_clause_number": "3",
      "original_clause_title": "TERM OF LEASE",
      "risk_level": "medium",
      "explanation": "12-month term with automatic renewal..."
    }
  ]
}

VALIDATION RULES:
✅ Clause numbers MUST be sequential: 1, 2, 3, 4, 5, 6...
✅ Clause titles MUST match the lease document EXACTLY (in ALL CAPS if that's how they appear)
✅ Array order MUST match document reading order
❌ DO NOT skip clause numbers
❌ DO NOT sort by risk_level
❌ DO NOT group similar clauses together

═══════════════════════════════════════════════════════════════════════════

ADDITIONAL INSTRUCTIONS:
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

For EACH clause found, return (IN DOCUMENT ORDER - clauses[0] = first clause in document):
{
  "original_clause_number": "1" (EXACT number from lease - must be sequential: 1, 2, 3, 4...),
  "original_clause_title": "PARTIES" (EXACT title from lease document in original casing),
  "clause_text": "The actual text from the document (up to 200 chars, extract the key part)",
  "risk_level": "none|low|medium|high|critical",
  "explanation": "What this means for the tenant in simple, clear language",
  "recommended_action": "Specific action the tenant should take"
}

RECOMMENDATION GUIDELINES - CRITICAL:
- NEVER suggest "seek legal advice", "consult a lawyer", or "legal consultation"
- ALWAYS direct users to Lease Shield's Letter Templates for negotiation
- For CRITICAL/HIGH risks: "Use Lease Shield's negotiation letter templates to address this clause"
- For actionable steps: "Draft a negotiation request using our Letter Templates"
- Focus on negotiation strategies, documentation, and using Lease Shield tools
- Only mention lawyers in the context of escalation if negotiation completely fails

UTILITY RATE ANALYSIS (THAILAND-SPECIFIC):
When analyzing utility/service charges, compare against standard Thailand rates:

ELECTRICITY:
- Government rate (MEA/PEA): 4-6 THB/unit (2026 standard)
- If lease charges >7 THB/unit → FLAG as HIGH RISK (overcharging)
- If lease charges >10 THB/unit → FLAG as CRITICAL RISK (excessive overcharging)
- Include actual rate and benchmark in explanation

WATER:
- Government rate (PWA): 8-15 THB/unit (2026 standard)
- If lease charges >20 THB/unit → FLAG as HIGH RISK (overcharging)
- If lease charges >40 THB/unit → FLAG as CRITICAL RISK (excessive overcharging)

INTERNET/CABLE:
- Market rate: 500-800 THB/month
- If lease charges >1,000 THB/month → FLAG as MEDIUM RISK

For ANY utility overcharging detected:
- risk_level: "high" or "critical"
- explanation: "Landlord charges [X] THB/unit for electricity, which is [Y]x higher than government rate ([Z] THB/unit). This is excessive markup."
- recommended_action: "Use Lease Shield's negotiation letter templates to request utility rates match government/building standard rates"

RISK LEVEL GUIDELINES:
- "critical": Clause is severely one-sided, potentially illegal, or could cause major financial harm (includes utility overcharging >50% above market)
- "high": Clause significantly favors landlord or creates substantial risk for tenant (includes utility overcharging 20-50% above market)
- "medium": Clause is somewhat unfavorable but negotiable
- "low": Clause is slightly unfavorable but standard practice
- "none": Clause is balanced and fair to both parties

Return comprehensive JSON with ALL extracted data:
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
  },
  "key_terms": {
    "lease_start_date": "YYYY-MM-DD (e.g., 2025-03-01)",
    "lease_end_date": "YYYY-MM-DD (e.g., 2026-02-28)",
    "property_address": "Full property address from Leased Property clause",
    "monthly_rent": 38000,
    "security_deposit": 114000,
    "rent_due_day": 1,
    "notice_period_days": 30
  }
}
CRITICAL: 
- Extract lease_start_date and lease_end_date from clauses like "Commencement Date:" and "Expiry Date:" or "Expiration Date:". Format as YYYY-MM-DD.
- Extract property_address from "Leased Property" or similar clause containing the full unit address.

IMPORTANT: Extract EVERY clause you find. A typical lease has 30-60 clauses. If you only find 15, you're missing clauses. Keep reading until you've covered the entire document.

═══════════════════════════════════════════════════════════════════════════
CRITICAL REQUIREMENT: Missing Critical Clauses Detection (MANDATORY)
═══════════════════════════════════════════════════════════════════════════

You MUST analyze these 15 clauses and include missingCriticalClauses array in your JSON response with EXACTLY 15 objects.

For each clause ID below, determine if it's PRESENT or MISSING:

CAT-023 (Deposit Holding):
Where/how is the deposit held? Look for: bank account, escrow, holding terms

CAT-027 (Deposit Forfeiture Conditions):
What specific conditions allow forfeiture? Look for: damage list, breach terms

CAT-028 (Wear and Tear Definition):
Is normal wear distinguished from damage? Look for: "normal wear", "ordinary use"

CAT-037 (Repair Request Procedure):
How does tenant report repairs? Look for: process, timeline, contact method

CAT-033 (Utility Disconnection Rights):
Can landlord cut utilities? Look for: disconnection rights, service suspension

CAT-010 (Early Termination by Tenant):
Does the lease allow tenant to terminate early (break clause)? Look for: early termination rights, break clause, tenant exit option

CAT-127 (Early Termination Penalty Formula):
What's the specific penalty/fee for breaking the lease early? Look for: penalty calculation, exit fee, months of rent forfeiture

CAT-025 (Deposit Return Timeline):
When must landlord return the deposit after move-out? Look for: "within X days", deposit return deadline, timeline

CAT-121 (Grace Period Definition):
How many days after rent due date before late fees apply? Look for: grace period, late payment buffer, days before penalty

CAT-039 (Emergency Repairs):
How are urgent/emergency repairs handled? Look for: emergency repair process, urgent maintenance, immediate issues

CAT-122 (Rent Suspension Conditions):
Can tenant stop/reduce rent if unit becomes uninhabitable? Look for: rent abatement, suspension, habitability clause

CAT-125 (Quiet Enjoyment Covenant):
Does lease guarantee tenant's peaceful possession without interference? Look for: "quiet enjoyment", peaceful possession, non-interference

CAT-041 (Restoration at End of Lease):
What condition must the property be in at move-out? Look for: move-out condition, restoration requirements, return state

CAT-124 (Wear and Tear Safe Harbour):
Does lease explicitly exclude normal wear/tear from deposit deductions? Look for: "normal wear excluded", fair wear, depreciation allowance

CAT-080 (Move-Out Procedure):
What are the specific steps/requirements when vacating? Look for: move-out procedure, handover process, exit requirements

For EACH of the 15 clauses above, you MUST return:
{
  "id": "CAT-XXX" (use exact IDs: CAT-023, CAT-027, CAT-028, CAT-037, CAT-033, CAT-010, CAT-127, CAT-025, CAT-121, CAT-039, CAT-122, CAT-125, CAT-041, CAT-124, CAT-080),
  "name": "Descriptive Clause Name",
  "status": "PRESENT" or "MISSING",
  "confidence": "HIGH" or "LOW",
  "evidence": "Quote from lease" OR "Not mentioned in lease"
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
              content: `Analyze this complete lease document (language: ${language}). Extract EVERY SINGLE CLAUSE - do not stop at 15 or 25. A typical lease has 30-60 clauses. Read the entire document thoroughly:\n\n${pdfText.slice(0, 15000)}`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 4000,
          temperature: 0.2
        });
        
        const rawContent = completion.choices[0].message.content;
        console.log('[ANALYZE_LEASE_OPENAI_RAW_RESPONSE]', { 
          correlationId, 
          preview: rawContent?.slice(0, 500) 
        });
        
        analysisResult = JSON.parse(rawContent);
        
        console.log('[ANALYZE_LEASE_OPENAI_COMPLETE]', { 
          correlationId, 
          clausesCount: analysisResult.clauses?.length || 0,
          riskScore: analysisResult.risk_score,
          hasMissingClauses: !!analysisResult.missingCriticalClauses,
          missingClausesCount: analysisResult.missingCriticalClauses?.length || 0
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
        
        const rawContentVision = completion.choices[0].message.content;
        console.log('[ANALYZE_LEASE_VISION_RAW_RESPONSE]', { 
          correlationId, 
          preview: rawContentVision?.slice(0, 500) 
        });
        
        analysisResult = JSON.parse(rawContentVision);
        
        console.log('[ANALYZE_LEASE_VISION_COMPLETE]', { 
          correlationId, 
          clausesCount: analysisResult.clauses?.length || 0,
          riskScore: analysisResult.risk_score,
          hasMissingClauses: !!analysisResult.missingCriticalClauses,
          missingClausesCount: analysisResult.missingCriticalClauses?.length || 0
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
        original_clause_number: clause.original_clause_number || clause.clause_number || String(idx + 1),
        original_clause_title: clause.original_clause_title || clause.original_title || clause.canonical_name || `Clause ${idx + 1}`,
        canonical_name: clause.canonical_name || clause.original_clause_title || `Clause ${idx + 1}`,
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
    
    // Validate clause numbering is sequential
    console.log('[ANALYZE_LEASE_VALIDATE_CLAUSE_NUMBERING]', { correlationId });
    
    const clauseNumbers = normalizedClauses.map(c => c.original_clause_number);
    const isSequential = normalizedClauses.every((clause, index) => {
      const expectedNumber = String(index + 1);
      const actualNumber = String(clause.original_clause_number);
      return actualNumber === expectedNumber;
    });
    
    if (!isSequential) {
      console.warn('[ANALYZE_LEASE_CLAUSE_NUMBERING_NOT_SEQUENTIAL]', {
        correlationId,
        expected: normalizedClauses.map((_, i) => String(i + 1)),
        actual: clauseNumbers,
        message: 'Clause numbering was not sequential - using fallback numbering'
      });
      
      // Fix numbering to be sequential if AI didn't follow instructions
      normalizedClauses.forEach((clause, index) => {
        clause.original_clause_number = String(index + 1);
      });
    } else {
      console.log('[ANALYZE_LEASE_CLAUSE_NUMBERING_VALID]', { 
        correlationId, 
        count: normalizedClauses.length,
        range: `1-${normalizedClauses.length}`
      });
    }
    
    // Normalize missingCriticalClauses (PHASE 1 - additive, failure-safe)
    console.log('[ANALYZE_LEASE_MISSING_CLAUSES_RAW]', { 
      correlationId, 
      hasMissingClauses: !!analysisResult.missingCriticalClauses,
      rawData: JSON.stringify(analysisResult.missingCriticalClauses || null),
      count: analysisResult.missingCriticalClauses?.length || 0
    });
    
    if (Array.isArray(analysisResult.missingCriticalClauses)) {
      const normalizedMissing = [];
      const validIds = ['CAT-023', 'CAT-027', 'CAT-028', 'CAT-037', 'CAT-033', 'CAT-010', 'CAT-127', 'CAT-025', 'CAT-121', 'CAT-039', 'CAT-122', 'CAT-125', 'CAT-041', 'CAT-124', 'CAT-080'];
      
      for (const mc of analysisResult.missingCriticalClauses) {
        if (!mc || typeof mc !== 'object') continue;
        
        const normalizedMC = {
          id: String(mc.id || '').toUpperCase(),
          name: String(mc.name || 'Unknown'),
          status: String(mc.status || 'MISSING').toUpperCase(),
          confidence: String(mc.confidence || 'LOW').toUpperCase(),
          evidence: String(mc.evidence || 'Not found in lease').slice(0, 300)
        };
        
        // Validate status
        if (!['PRESENT', 'MISSING'].includes(normalizedMC.status)) {
          normalizedMC.status = 'MISSING';
        }
        
        // Validate confidence
        if (!['HIGH', 'LOW'].includes(normalizedMC.confidence)) {
          normalizedMC.confidence = 'LOW';
        }
        
        normalizedMissing.push(normalizedMC);
      }
      
      analysisResult.missingCriticalClauses = normalizedMissing;
      
      // Calculate missing count (HIGH confidence only)
      const missingCount = normalizedMissing.filter(
        mc => mc.status === 'MISSING' && mc.confidence === 'HIGH'
      ).length;
      
      analysisResult.missingClauseCount = missingCount;
      
      console.log('[ANALYZE_LEASE_MISSING_CLAUSES_NORMALIZED]', { 
        correlationId, 
        count: normalizedMissing.length,
        missingHighConfidence: missingCount,
        details: normalizedMissing
      });
    } else {
      // If OpenAI didn't return missingCriticalClauses, set empty defaults
      // This ensures scan still succeeds even if this new feature fails
      console.warn('[ANALYZE_LEASE_MISSING_CLAUSES_NOT_RETURNED]', { 
        correlationId,
        receivedKeys: Object.keys(analysisResult || {})
      });
      analysisResult.missingCriticalClauses = [];
      analysisResult.missingClauseCount = 0;
    }
    
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
    
    // AUTO-POPULATION: Create trackers from extracted data (with duplicate prevention)
    console.log('[AUTO_POPULATE_START]', { correlationId });
    
    const monthlyRent = analysisResult.key_terms?.monthly_rent || analysisResult.key_terms?.monthlyRent;
    const securityDeposit = analysisResult.key_terms?.security_deposit || analysisResult.key_terms?.securityDeposit;
    const leaseStartDate = analysisResult.key_terms?.lease_start_date || analysisResult.key_terms?.leaseStartDate;
    const leaseEndDate = analysisResult.key_terms?.lease_end_date || analysisResult.key_terms?.leaseEndDate;
    const propertyAddress = analysisResult.key_terms?.property_address || analysisResult.key_terms?.propertyAddress;
    const rentDueDay = analysisResult.key_terms?.rent_due_day || analysisResult.key_terms?.rentDueDay || 1;
    
    console.log('[AUTO_POPULATE_EXTRACTED_DATA]', {
      correlationId,
      monthlyRent,
      securityDeposit,
      leaseStartDate,
      leaseEndDate,
      propertyAddress,
      rentDueDay
    });
    
    // Validate extracted data
    const isValidRent = monthlyRent && monthlyRent > 0 && monthlyRent < 1000000;
    const isValidDeposit = securityDeposit && securityDeposit > 0 && securityDeposit < 10000000;
    const isValidDates = leaseStartDate && leaseEndDate && new Date(leaseStartDate) < new Date(leaseEndDate);
    
    console.log('[AUTO_POPULATE_VALIDATION]', {
      correlationId,
      isValidRent,
      isValidDeposit,
      isValidDates
    });
    
    // CHECK FOR EXISTING DEPOSIT TRACKER - PREVENT DUPLICATES
    if (isValidDeposit && isValidDates) {
      try {
        console.log('[AUTO_POPULATE_DEPOSIT_CHECK_EXISTING]', { correlationId, leaseId });
        
        const existingDeposits = await svc.entities.DepositTracker.filter({ lease_id: leaseId });
        
        if (existingDeposits && existingDeposits.length > 0) {
          console.log('[AUTO_POPULATE_DEPOSIT_TRACKER_EXISTS]', { 
            correlationId,
            existingCount: existingDeposits.length,
            message: 'Skipping creation - tracker already exists for this lease'
          });
        } else {
          console.log('[AUTO_POPULATE_DEPOSIT_TRACKER_CREATE]', { correlationId });
          
          const depositDueDate = new Date(leaseStartDate);
          const expectedReturnDate = new Date(leaseEndDate);
          expectedReturnDate.setDate(expectedReturnDate.getDate() + 30);
          
          await svc.entities.DepositTracker.create({
            lease_id: leaseId,
            deposit_amount: securityDeposit,
            property_address: propertyAddress || 'Not specified',
            rent_amount: monthlyRent || 0,
            rent_due_day: rentDueDay,
            deposit_paid_date: leaseStartDate,
            deposit_due_date: depositDueDate.toISOString().split('T')[0],
            expected_return_date: expectedReturnDate.toISOString().split('T')[0],
            lease_start_date: leaseStartDate,
            lease_end_date: leaseEndDate,
            status: 'tracking',
            auto_populated: true,
            source_scan_id: scan.id,
            deposit_due_date_is_estimated: true,
            expected_return_date_is_estimated: true
          });
          
          console.log('[AUTO_POPULATE_DEPOSIT_TRACKER_SUCCESS]', { 
            correlationId,
            amount: securityDeposit,
            returnDate: expectedReturnDate.toISOString().split('T')[0]
          });
        }
      } catch (depositErr) {
        console.error('[AUTO_POPULATE_DEPOSIT_TRACKER_FAILED]', {
          correlationId,
          error: depositErr.message
        });
      }
    } else {
      console.warn('[AUTO_POPULATE_DEPOSIT_TRACKER_SKIPPED]', {
        correlationId,
        reason: !isValidDeposit ? 'Invalid deposit' : 'Invalid dates'
      });
    }
    
    console.log('[AUTO_POPULATE_COMPLETE]', { correlationId });
    
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