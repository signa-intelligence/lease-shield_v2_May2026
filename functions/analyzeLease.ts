// PRODUCTION CODE - DO NOT MODIFY WITHOUT EXPLICIT APPROVAL
// Last verified working: 2026-01-13

import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";
import OpenAI from "npm:openai@4.28.0";

/**
 * Analyze lease document (PDF or Image) using OpenAI GPT-4
 * Provides comprehensive lease analysis with clause extraction and risk assessment
 * 
 * @param {Object} body - { fileUrl, leaseId, language }
 * @returns Comprehensive lease analysis with all clauses found in document
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

    // Validate user has tier configured
    if (!user.tier || user.available_scans === undefined) {
      console.error('[ANALYZE_LEASE_USER_MISCONFIGURED]', { 
        correlationId,
        userId: user.id, 
        email: user.email,
        hasTier: !!user.tier,
        hasScans: user.available_scans !== undefined
      });
      return json(400, {
        ok: false,
        step: 'VALIDATION',
        error_code: 'USER_NOT_CONFIGURED',
        message: 'User account not properly configured. Please contact support.',
        correlationId
      }, headers);
    }
    
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { fileUrl, leaseId, scanId, language = "en", scanMode = "full" } = body || {};
    
    // scanMode: "preview" = free tier (risk score + 5 top risks only)
    //           "full" = paid tier (complete clause analysis)
    const isPreviewMode = scanMode === 'preview';
    
    console.log('[ANALYZE_LEASE_PARAMS]', { correlationId, leaseId, language, hasFileUrl: !!fileUrl, scanMode, isPreviewMode });
    
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
    
    // System prompt - varies based on scan mode
    const systemPrompt = isPreviewMode 
      ? `You are Lease Shield's AI analyst specializing in residential lease agreements in Thailand and Southeast Asia. 

PREVIEW MODE: Provide a quick risk assessment with the 5 most important risks.

═══════════════════════════════════════════════════════════════════════════
MANDATORY OUTPUT STRUCTURE - YOU MUST RETURN ALL THESE FIELDS:
═══════════════════════════════════════════════════════════════════════════

{
  "risk_score": <number 0-100>,
  "summary": {
    "executive_summary": "<string>",
    "top_risks": [<5 risk objects>]
  },
  "key_terms": {
    "property_address": "<REQUIRED - full address string or null>",
    "lease_start_date": "<REQUIRED - YYYY-MM-DD or null>",
    "lease_end_date": "<REQUIRED - YYYY-MM-DD or null>",
    "monthly_rent": <REQUIRED - number or null>,
    "security_deposit": <REQUIRED - number or null>,
    "rent_due_day": <REQUIRED - number 1-31 or null>
  },
  "preview_mode": true,
  "upgrade_message": "Upgrade to see full clause-by-clause analysis with detailed recommendations"
}

═══════════════════════════════════════════════════════════════════════════
CRITICAL: KEY_TERMS EXTRACTION IS MANDATORY (HIGHEST PRIORITY)
═══════════════════════════════════════════════════════════════════════════

The key_terms object MUST be included in your response and MUST contain all 6 fields.
Even if you cannot find a value, include the field with null.
DO NOT return an empty key_terms object {}.
DO NOT omit the key_terms field entirely.

SEARCH STRATEGIES FOR EACH FIELD:

1. property_address (MOST IMPORTANT):
   - Look for "LEASED PROPERTY", "RENTAL PROPERTY", "PREMISES", "Property Address"
   - Thai: "ทรัพย์สินที่เช่า", "สถานที่เช่า", "ที่ตั้งทรัพย์สิน"
   - Near words: "Unit", "Room", "Apartment", "Condo", "Suite", "Floor", "Building"
   - Extract FULL address: unit + building + street + district + city + postal code
   - Example: "Unit 1806, Tower C, Emerald Bay Condo, 299/45 Pattaya Second Road, Nong Prue, Bang Lamung, Chonburi 20150"

2. lease_start_date / lease_end_date:
   - Look for "LEASE TERM", "Term of Lease", "Commencement Date", "Expiry Date"
   - Thai: "ระยะเวลาการเช่า", "วันเริ่มสัญญา", "วันสิ้นสุดสัญญา"
   - Format as YYYY-MM-DD (e.g., "2026-03-01")

3. monthly_rent:
   - Look for "RENTAL PAYMENT", "Monthly Rent", "Rent Amount"
   - Thai: "ค่าเช่ารายเดือน", "การชำระค่าเช่า"
   - Return as NUMBER only (42000, not "42,000 THB")

4. security_deposit:
   - Look for "SECURITY DEPOSIT", "Deposit", "Guarantee"
   - Thai: "เงินประกัน", "เงินมัดจำ"
   - Return as NUMBER only (84000, not "84,000 baht")

5. rent_due_day:
   - Look for "due on the [X]th day", "payable by the [X]"
   - Thai: "ชำระภายในวันที่"
   - Return as NUMBER 1-31 (typically 1, 5, or first of month)

═══════════════════════════════════════════════════════════════════════════
RISK ASSESSMENT GUIDELINES
═══════════════════════════════════════════════════════════════════════════

Include EXACTLY 5 top_risks objects with:
- title: Short risk name
- severity: "critical", "high", or "medium"
- why: Brief explanation (1-2 sentences)

Focus on: deposit issues, unfair termination terms, utility overcharging, excessive penalties, missing protections.

risk_score guidelines:
- 0-25: Low risk, balanced lease
- 26-50: Medium risk, some concerns
- 51-75: High risk, significant issues
- 76-100: Critical risk, heavily landlord-favored

REMEMBER: key_terms MUST be populated. This is critical for the app to function properly.
`
      : `You are Lease Shield's AI analyst specializing in residential lease agreements in Thailand and Southeast Asia. Your task is to extract and analyze EVERY SINGLE CLAUSE in the lease document with NO LIMIT.

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
- NEVER suggest "seek legal advice", "consult a lawyer", "consult an attorney", "legal consultation", or any similar lawyer references
- ALWAYS direct users to Lease Shield's tools and services
- For CRITICAL/HIGH risks: "Use Lease Shield's negotiation letter templates to address this clause"
- For actionable steps: "Draft a negotiation request using Lease Shield's Letter Templates"
- For escalation: "Contact Lease Shield for expert negotiation support" (NOT "consult a lawyer")
- Focus on: negotiation strategies, documentation, Lease Shield templates, Lease Shield support
- Lease Shield IS the expert advisor - we don't refer users elsewhere

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

IMPORTANT: Extract EVERY clause you find. A typical lease has 30-60 clauses. If you only find 15, you're missing clauses. Keep reading until you've covered the entire document.`
      : `You are Lease Shield's AI analyst specializing in residential lease agreements in Thailand and Southeast Asia. 

FULL ANALYSIS MODE: Extract and analyze EVERY SINGLE CLAUSE in the lease document with NO LIMIT.

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

VALIDATION RULES:
✅ Clause numbers MUST be sequential: 1, 2, 3, 4, 5, 6...
✅ Clause titles MUST match the lease document EXACTLY (in ALL CAPS if that's how they appear)
✅ Array order MUST match document reading order
❌ DO NOT skip clause numbers
❌ DO NOT sort by risk_level
❌ DO NOT group similar clauses together

═══════════════════════════════════════════════════════════════════════════

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
    let rawLeaseText = ''; // Store raw text for fallback extraction
    
    if (isPdf) {
      // For PDF: Extract text first, then analyze
      console.log('[ANALYZE_LEASE_PDF_EXTRACTION_START]', { correlationId, isPreviewMode });
      
      // Use pdf-parse for text extraction
      const pdfParse = (await import("npm:pdf-parse@1.1.1")).default;
      let pdfText = "";
      
      try {
        const pdfData = await pdfParse(fileBytes);
        pdfText = pdfData.text;
        rawLeaseText = pdfText; // Store for fallback extraction
        
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
      
      // Analyze with Claude for preview, OpenAI for full
      if (isPreviewMode) {
        console.log('[ANALYZE_LEASE_CLAUDE_START]', { correlationId, inputLength: pdfText.length });
        
        const claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY');
        if (!claudeApiKey) {
          throw new Error('ANTHROPIC_API_KEY not configured');
        }
        
        const userPrompt = `You are Lease Shield's AI analyst. Analyze this lease for the top 5 risks (language: ${language}):\n\n${pdfText.slice(0, 8000)}`;
        
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            thinking: {
              type: 'enabled',
              budget_tokens: 1000
            },
            messages: [{
              role: 'user',
              content: systemPrompt + '\n\n' + userPrompt
            }]
          })
        });
        
        if (!claudeResponse.ok) {
          const error = await claudeResponse.text();
          throw new Error(`Claude API error: ${error}`);
        }
        
        const claudeData = await claudeResponse.json();
        const rawContent = claudeData.content[0].type === 'text' ? claudeData.content[0].text : claudeData.content.find(c => c.type === 'text')?.text;
        
        console.log('[ANALYZE_LEASE_CLAUDE_RESPONSE]', { correlationId, preview: rawContent?.slice(0, 500) });
        
        analysisResult = JSON.parse(rawContent);
        
        console.log('[ANALYZE_LEASE_CLAUDE_COMPLETE]', { 
          correlationId,
          hasKeyTerms: !!analysisResult.key_terms,
          hasPropertyAddress: !!analysisResult.key_terms?.property_address,
          riskScore: analysisResult.risk_score
        });
        
      } else {
        // Use OpenAI for full mode
        console.log('[ANALYZE_LEASE_OPENAI_START]', { correlationId, inputLength: pdfText.length, isPreviewMode: false });
        
        const userPrompt = `Analyze this complete lease document (language: ${language}). Extract EVERY SINGLE CLAUSE - do not stop at 15 or 25. A typical lease has 30-60 clauses. Read the entire document thoroughly:\n\n${pdfText.slice(0, 15000)}`;
        
        console.log('[ANALYZE_LEASE_MODEL_SELECTED]', { correlationId, model: 'gpt-4o' });
        
        try {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            max_tokens: 4000,
            temperature: 0.1
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
            hasKeyTerms: !!analysisResult.key_terms,
            propertyAddress: analysisResult.key_terms?.property_address || 'NOT_FOUND'
          });
          
          // Store raw text for fallback extraction
          rawLeaseText = pdfText;
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
      }
      
    } else if (isImage) {
      // For Image: Use vision API
      console.log('[ANALYZE_LEASE_IMAGE_VISION_START]', { correlationId, isPreviewMode });
      
      // Convert to base64
      const base64Image = btoa(String.fromCharCode(...fileBytes));
      
      // Use different prompts based on scan mode
      const imagePrompt = isPreviewMode
        ? `Quickly assess this lease document image for the top 5 risks (language: ${language}).`
        : `Analyze this complete lease document image (language: ${language}). Extract EVERY SINGLE CLAUSE - do not stop at 15 or 25. A typical lease has 30-60 clauses. Read carefully and provide comprehensive analysis.`;
      
      const maxTokensImage = isPreviewMode ? 1500 : 4000;
      
      // Use gpt-4o-mini for preview mode images too
      const imageModelToUse = isPreviewMode ? "gpt-4o-mini" : "gpt-4o";
      
      console.log('[ANALYZE_LEASE_IMAGE_MODEL_SELECTED]', { correlationId, model: imageModelToUse, isPreviewMode });
      
      try {
        const completion = await openai.chat.completions.create({
          model: imageModelToUse,
          messages: [
            { role: "system", content: systemPrompt },
            { 
              role: "user", 
              content: [
                {
                  type: "text",
                  text: imagePrompt
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
          max_tokens: maxTokensImage,
          temperature: 0.1
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
          missingClausesCount: analysisResult.missingCriticalClauses?.length || 0,
          hasKeyTerms: !!analysisResult.key_terms,
          keyTermsKeys: Object.keys(analysisResult.key_terms || {}),
          propertyAddress: analysisResult.key_terms?.property_address || 'NOT_FOUND'
        });
        
        // FORCE property address extraction for preview mode images if OpenAI didn't return it
        // Note: For images we don't have rawLeaseText, so fallback won't work
        // But we log it for visibility
        if (isPreviewMode && !analysisResult.key_terms?.property_address) {
          console.warn('[ANALYZE_LEASE_PREVIEW_IMAGE_NO_ADDRESS]', {
            correlationId,
            message: 'Preview mode image scan did not extract property address - OCR limitation'
          });
        }
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
    
    // ═══════════════════════════════════════════════════════════════════════════
    // FALLBACK: Extract key_terms from raw lease text if OpenAI failed
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Extract property address from lease text using regex patterns
     * Supports both Thai and English address formats
     */
    function extractAddressFromText(text) {
      if (!text || typeof text !== 'string') return null;
      
      const patterns = [
        // English patterns - explicit labels
        /(?:Property\s*Address|Leased\s*Property|Rental\s*Property|Premises|Location)[:\s]*([^\n\r]{20,150})/i,
        /(?:Unit|Room|Apartment|Suite|Condo|Condominium|Flat)[:\s#.]*(\d+[A-Z]?)[,\s]+([^\n\r]{15,120})/i,
        /(?:Building|Tower|Block)[:\s]*([A-Z]|\d+)[,\s]+([^\n\r]{15,100})/i,
        
        // Thai patterns
        /(?:ทรัพย์สินที่เช่า|สถานที่เช่า|ที่ตั้งทรัพย์สิน|ห้องเลขที่)[:\s]*([^\n\r]{20,150})/i,
        /(?:ห้องเลขที่|ยูนิต|ชั้น)[:\s]*(\d+[A-Z]?\/?\d*)[,\s]*([^\n\r]{15,120})/i,
        
        // Combined Unit + Building + Address pattern
        /(?:Unit|Room|ห้อง)\s*(?:No\.?|#)?\s*(\d+[A-Z]?)[,\s]+(?:Floor|ชั้น)\s*(\d+)[,\s]+([^\n\r]{20,100})/i,
        
        // Address with postal code (Thailand)
        /(\d+\/?\d*\s+(?:Soi|ซอย|Moo|หมู่)?[^\n\r]{10,80}\s*\d{5})/i,
        
        // Condo/Building name followed by address
        /([\w\s]+(?:Condo|Condominium|Residence|Place|Court|Tower|Building))[,\s]+(\d+\/?\d*[^\n\r]{10,80})/i,
        
        // Thai district patterns
        /(\d+\/?\d*\s+[^\n\r]{5,50}(?:แขวง|เขต|อำเภอ|จังหวัด|ตำบล)[^\n\r]{5,60}\s*\d{5})/i,
        
        // Fallback: Any line starting with numbers that looks like an address
        /^(\d+\/?\d*\s+[A-Za-z\s]+(?:Road|Street|Avenue|Lane|Soi|Way|Drive)[^\n\r]{5,80})/im
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          // Clean up the extracted address
          let address = match.slice(1).filter(Boolean).join(', ').trim();
          
          // Remove excessive whitespace and clean up
          address = address.replace(/\s+/g, ' ').trim();
          
          // Remove common prefixes if they got included
          address = address.replace(/^(?:at|located at|situated at|being)[:\s]*/i, '').trim();
          
          // Ensure minimum length for a valid address
          if (address.length >= 15) {
            return address;
          }
        }
      }
      
      return null;
    }
    
    /**
     * Extract dates from lease text
     */
    function extractDatesFromText(text) {
      if (!text || typeof text !== 'string') return { start: null, end: null };
      
      const result = { start: null, end: null };
      
      // Pattern for dates near keywords
      const startPatterns = [
        /(?:Commencement|Start|Begin(?:ning)?|Effective)\s*(?:Date)?[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
        /(?:from|starting)\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
        /(?:วันเริ่มสัญญา|เริ่มต้น)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i
      ];
      
      const endPatterns = [
        /(?:Expir(?:y|ation)|End|Terminat(?:e|ion))\s*(?:Date)?[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
        /(?:to|until|ending)\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
        /(?:วันสิ้นสุดสัญญา|สิ้นสุด)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i
      ];
      
      for (const pattern of startPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          result.start = normalizeDate(match[1]);
          break;
        }
      }
      
      for (const pattern of endPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          result.end = normalizeDate(match[1]);
          break;
        }
      }
      
      return result;
    }
    
    /**
     * Normalize date string to YYYY-MM-DD format
     */
    function normalizeDate(dateStr) {
      if (!dateStr) return null;
      
      // Try parsing various formats
      const parts = dateStr.split(/[-\/]/);
      if (parts.length !== 3) return null;
      
      let year, month, day;
      
      // YYYY-MM-DD format
      if (parts[0].length === 4) {
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
        day = parseInt(parts[2]);
      }
      // DD-MM-YYYY or MM-DD-YYYY (assume DD-MM-YYYY for Thai documents)
      else if (parts[2].length === 4) {
        year = parseInt(parts[2]);
        // Assume day-month-year for Thai leases
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
      }
      // DD-MM-YY or MM-DD-YY
      else {
        let yr = parseInt(parts[2]);
        year = yr < 50 ? 2000 + yr : (yr < 100 ? 1900 + yr : yr);
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
      }
      
      // Validate
      if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
      }
      
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    
    /**
     * Extract monetary amounts from lease text
     */
    function extractAmountsFromText(text) {
      if (!text || typeof text !== 'string') return { rent: null, deposit: null };
      
      const result = { rent: null, deposit: null };
      
      // Rent patterns
      const rentPatterns = [
        /(?:Monthly\s*Rent|Rental\s*(?:Amount|Payment|Fee)|Rent)[:\s]*(?:THB|฿|Baht)?\s*([\d,]+)(?:\s*(?:THB|Baht|บาท))?(?:\s*(?:per|\/)\s*month)?/i,
        /(?:ค่าเช่ารายเดือน|ค่าเช่า)[:\s]*([\d,]+)(?:\s*บาท)?/i,
        /([\d,]+)\s*(?:THB|Baht|บาท)\s*(?:per|\/)\s*month/i
      ];
      
      // Deposit patterns
      const depositPatterns = [
        /(?:Security\s*Deposit|Deposit|Guarantee)[:\s]*(?:THB|฿|Baht)?\s*([\d,]+)(?:\s*(?:THB|Baht|บาท))?/i,
        /(?:เงินประกัน|เงินมัดจำ)[:\s]*([\d,]+)(?:\s*บาท)?/i,
        /deposit\s*(?:of|:)?\s*(?:THB|฿|Baht)?\s*([\d,]+)/i
      ];
      
      for (const pattern of rentPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const amount = parseInt(match[1].replace(/,/g, ''));
          // Sanity check: rent should be reasonable (1,000 - 1,000,000 THB)
          if (amount >= 1000 && amount <= 1000000) {
            result.rent = amount;
            break;
          }
        }
      }
      
      for (const pattern of depositPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const amount = parseInt(match[1].replace(/,/g, ''));
          // Sanity check: deposit should be reasonable (1,000 - 5,000,000 THB)
          if (amount >= 1000 && amount <= 5000000) {
            result.deposit = amount;
            break;
          }
        }
      }
      
      return result;
    }
    
    /**
     * Extract rent due day from lease text
     */
    function extractRentDueDayFromText(text) {
      if (!text || typeof text !== 'string') return null;
      
      const patterns = [
        /(?:due|payable|paid)\s*(?:on|by)\s*(?:the)?\s*(\d{1,2})(?:st|nd|rd|th)?\s*(?:day)?(?:\s*of\s*(?:each|every)\s*month)?/i,
        /(?:on|by)\s*(?:the)?\s*(\d{1,2})(?:st|nd|rd|th)?\s*(?:day)?\s*of\s*(?:each|every)\s*month/i,
        /(?:ชำระภายในวันที่|วันที่ชำระ)[:\s]*(\d{1,2})/i,
        /day\s*(\d{1,2})\s*of\s*(?:each|every)\s*month/i
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const day = parseInt(match[1]);
          if (day >= 1 && day <= 31) {
            return day;
          }
        }
      }
      
      return null;
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
    
    // CRITICAL: Ensure key_terms object exists with all required fields
    if (!analysisResult.key_terms || typeof analysisResult.key_terms !== 'object') {
      console.warn('[ANALYZE_LEASE_KEY_TERMS_MISSING]', { 
        correlationId,
        message: 'AI did not return key_terms - initializing empty object'
      });
      analysisResult.key_terms = {};
    }
    
    // Ensure all key_terms fields exist (even if null)
    const requiredKeyTerms = ['property_address', 'lease_start_date', 'lease_end_date', 'monthly_rent', 'security_deposit', 'rent_due_day'];
    for (const field of requiredKeyTerms) {
      if (analysisResult.key_terms[field] === undefined) {
        analysisResult.key_terms[field] = null;
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // FALLBACK EXTRACTION: If OpenAI didn't return key_terms, extract from raw text
    // ═══════════════════════════════════════════════════════════════════════════
    
    const keyTermsBefore = { ...analysisResult.key_terms };
    let fallbackUsed = false;
    
    // Fallback for property_address (MOST CRITICAL)
    console.log('[FALLBACK_EXTRACTION_TRIGGERED]', { correlationId, hasRawText: !!rawLeaseText, hasPropertyAddress: !!analysisResult.key_terms.property_address, propertyAddressValue: analysisResult.key_terms.property_address });
    // Extract if null, undefined, or falsy
    if ((analysisResult.key_terms.property_address === null || analysisResult.key_terms.property_address === undefined || !analysisResult.key_terms.property_address) && rawLeaseText) {
     console.log('[ANALYZE_LEASE_FALLBACK_ADDRESS_START]', { correlationId, currentValue: analysisResult.key_terms.property_address });
     const fallbackAddress = extractAddressFromText(rawLeaseText);
     if (fallbackAddress) {
       analysisResult.key_terms.property_address = fallbackAddress;
       fallbackUsed = true;
       console.log('[ANALYZE_LEASE_FALLBACK_ADDRESS_SUCCESS]', { 
         correlationId, 
         extractedAddress: fallbackAddress,
         source: 'fallback_extraction'
       });
     } else {
       console.warn('[ANALYZE_LEASE_FALLBACK_ADDRESS_FAILED]', { 
         correlationId,
         message: 'Could not extract address from raw text - fallback failed',
         textPreview: rawLeaseText.slice(0, 500),
         searchedPatterns: 'address extraction patterns'
       });
     }
    }
    
    // Fallback for dates
    if ((!analysisResult.key_terms.lease_start_date || !analysisResult.key_terms.lease_end_date) && rawLeaseText) {
      const fallbackDates = extractDatesFromText(rawLeaseText);
      if (fallbackDates.start && !analysisResult.key_terms.lease_start_date) {
        analysisResult.key_terms.lease_start_date = fallbackDates.start;
        fallbackUsed = true;
        console.log('[ANALYZE_LEASE_FALLBACK_START_DATE_SUCCESS]', { correlationId, date: fallbackDates.start });
      }
      if (fallbackDates.end && !analysisResult.key_terms.lease_end_date) {
        analysisResult.key_terms.lease_end_date = fallbackDates.end;
        fallbackUsed = true;
        console.log('[ANALYZE_LEASE_FALLBACK_END_DATE_SUCCESS]', { correlationId, date: fallbackDates.end });
      }
    }
    
    // Fallback for amounts
    if ((!analysisResult.key_terms.monthly_rent || !analysisResult.key_terms.security_deposit) && rawLeaseText) {
      const fallbackAmounts = extractAmountsFromText(rawLeaseText);
      if (fallbackAmounts.rent && !analysisResult.key_terms.monthly_rent) {
        analysisResult.key_terms.monthly_rent = fallbackAmounts.rent;
        fallbackUsed = true;
        console.log('[ANALYZE_LEASE_FALLBACK_RENT_SUCCESS]', { correlationId, rent: fallbackAmounts.rent });
      }
      if (fallbackAmounts.deposit && !analysisResult.key_terms.security_deposit) {
        analysisResult.key_terms.security_deposit = fallbackAmounts.deposit;
        fallbackUsed = true;
        console.log('[ANALYZE_LEASE_FALLBACK_DEPOSIT_SUCCESS]', { correlationId, deposit: fallbackAmounts.deposit });
      }
    }
    
    // Fallback for rent due day
    if (!analysisResult.key_terms.rent_due_day && rawLeaseText) {
      const fallbackDueDay = extractRentDueDayFromText(rawLeaseText);
      if (fallbackDueDay) {
        analysisResult.key_terms.rent_due_day = fallbackDueDay;
        fallbackUsed = true;
        console.log('[ANALYZE_LEASE_FALLBACK_DUE_DAY_SUCCESS]', { correlationId, dueDay: fallbackDueDay });
      }
    }
    
    console.log('[ANALYZE_LEASE_KEY_TERMS_NORMALIZED]', {
      correlationId,
      key_terms: analysisResult.key_terms,
      hasPropertyAddress: !!analysisResult.key_terms.property_address,
      fallbackUsed,
      beforeFallback: keyTermsBefore,
      afterFallback: analysisResult.key_terms
    });
    
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
    
    // Check minimum clauses - skip for preview mode (which has no clauses)
    if (!isPreviewMode && analysisResult.clauses.length < 5) {
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
    
    // For preview mode, FORCE empty clauses array
    if (isPreviewMode) {
      console.log('[ANALYZE_LEASE_FORCING_PREVIEW_MODE]', { 
        correlationId,
        originalClausesCount: analysisResult.clauses?.length || 0
      });
      
      analysisResult.preview_mode = true;
      analysisResult.upgrade_message = "Upgrade to see full clause-by-clause analysis with detailed recommendations";
      
      // CRITICAL: Force empty clauses array for free tier
      analysisResult.clauses = [];
      
      // Ensure top_risks is limited to 5
      if (Array.isArray(analysisResult.summary?.top_risks)) {
        analysisResult.summary.top_risks = analysisResult.summary.top_risks.slice(0, 5);
      }
      
      console.log('[ANALYZE_LEASE_PREVIEW_MODE_ENFORCED]', {
        correlationId,
        clausesCount: 0,
        topRisksCount: analysisResult.summary?.top_risks?.length || 0,
        hasKeyTerms: !!analysisResult.key_terms
      });
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

        // Extract property address from key_terms - CRITICAL for UI display
        const extractedAddress = analysisResult.key_terms?.property_address || null;
        
        console.log('[ANALYZE_LEASE_KEY_TERMS_FINAL]', {
          correlationId,
          extractedAddress,
          allKeyTerms: analysisResult.key_terms
        });
        
        console.log('[ANALYZE_LEASE_EXTRACTED_ADDRESS]', { 
          correlationId, 
          extractedAddress,
          hasKeyTerms: !!analysisResult.key_terms,
          keyTermsKeys: Object.keys(analysisResult.key_terms || {})
        });

        // Populate scan_preview for UI display - CRITICAL: This must be saved to database
        const scan_preview = {
          property_address: extractedAddress,
          risk_score: analysisResult.risk_score,
          risk_level: analysisResult.risk_score >= 75 ? 'critical' : analysisResult.risk_score >= 50 ? 'high' : analysisResult.risk_score >= 25 ? 'medium' : 'low',
          total_clauses: analysisResult.clauses?.length || 0,
          critical_count: analysisResult.clauses?.filter(c => c.risk_level === 'critical').length || 0,
          high_count: analysisResult.clauses?.filter(c => c.risk_level === 'high').length || 0,
          // Include all key_terms in scan_preview for easy access
          lease_start_date: analysisResult.key_terms?.lease_start_date || null,
          lease_end_date: analysisResult.key_terms?.lease_end_date || null,
          monthly_rent: analysisResult.key_terms?.monthly_rent || null,
          security_deposit: analysisResult.key_terms?.security_deposit || null,
          rent_due_day: analysisResult.key_terms?.rent_due_day || null
        };
        
        console.log('[ANALYZE_LEASE_SCAN_PREVIEW_CONSTRUCTED]', {
          correlationId,
          scan_preview_object: JSON.stringify(scan_preview),
          extractedAddress_value: extractedAddress
        });
        
        console.log('[ANALYZE_LEASE_SCAN_PREVIEW_BUILT]', {
          correlationId,
          scan_preview,
          extractedAddress,
          keyTerms: analysisResult.key_terms
        });

        // Store key_terms in scan_full for UI to access
        analysisResult.key_terms = analysisResult.key_terms || {};
        
        // Store key_terms in scan_full so it's persisted
        analysisResult.key_terms = analysisResult.key_terms || {};
        
        // Split into two updates to avoid MongoDB timeout on large payloads
        // First: Save lightweight scan_preview + metadata (fast)
        console.log('[ANALYZE_LEASE_DB_UPDATE_STEP1_START]', {
          correlationId,
          scan_preview_size: JSON.stringify(scan_preview).length
        });

        // Update LeaseScan with all extracted data
        // Ensure scan_full ALWAYS contains key_terms for UI display
        const scanFullWithKeyTerms = {
          ...analysisResult,
          key_terms: analysisResult.key_terms || {}
        };

        const updatePayload = {
          scan_preview: scan_preview,
          scan_full: scanFullWithKeyTerms,
          risk_score: analysisResult.risk_score,
          property_address: extractedAddress,
          status: 'completed'
        };
        
        console.log('[ANALYZE_LEASE_DB_UPDATE_FIELDS]', {
          correlationId,
          fields_being_updated: Object.keys(updatePayload),
          property_address_value: extractedAddress,
          scan_preview_property_address: scan_preview?.property_address
        });

        // Use service role to ensure fields persist
        scan = await svc.entities.LeaseScan.update(providedScanId, updatePayload);

        console.log('[ANALYZE_LEASE_DB_WRITE_COMPLETE]', { 
          correlationId,
          returned_scan_id: scan?.id,
          returned_status: scan?.status
        });

        // Verify the update went through
        const verifyUpdate = await svc.entities.LeaseScan.get(providedScanId);
        console.log('[ANALYZE_LEASE_VERIFY_UPDATE]', {
          correlationId,
          scan_preview_in_db: !!verifyUpdate?.scan_preview,
          property_address_in_db: verifyUpdate?.property_address,
          property_address_value: verifyUpdate?.property_address,
          scan_preview_property_address: verifyUpdate?.scan_preview?.property_address
        });
        
        console.log('[ANALYZE_LEASE_DB_UPDATE_COMPLETE]', {
          correlationId,
          scanId: providedScanId,
          scan_preview_saved: !!scan_preview,
          property_address_in_preview: scan_preview?.property_address,
          key_terms_in_full: analysisResult.key_terms,
          scan_result_preview: scan?.scan_preview
        });
        
        // Verify the scan was updated correctly
        if (!scan?.scan_preview) {
          console.error('[ANALYZE_LEASE_SCAN_PREVIEW_NOT_SAVED]', {
            correlationId,
            expected_preview: scan_preview,
            actual_scan: scan
          });
        }
        
        // Also update the Lease entity with extracted key_terms
        if (extractedAddress || analysisResult.key_terms?.monthly_rent || analysisResult.key_terms?.security_deposit) {
          const leaseUpdate = {};
          if (extractedAddress) leaseUpdate.property_address = extractedAddress;
          if (analysisResult.key_terms?.monthly_rent) leaseUpdate.rent_amount = analysisResult.key_terms.monthly_rent;
          if (analysisResult.key_terms?.security_deposit) leaseUpdate.deposit_amount = analysisResult.key_terms.security_deposit;
          if (analysisResult.key_terms?.lease_start_date) leaseUpdate.start_date = analysisResult.key_terms.lease_start_date;
          if (analysisResult.key_terms?.lease_end_date) leaseUpdate.end_date = analysisResult.key_terms.lease_end_date;
          if (analysisResult.key_terms?.notice_period_days) leaseUpdate.notice_period_days = analysisResult.key_terms.notice_period_days;
          
          if (Object.keys(leaseUpdate).length > 0) {
            console.log('[ANALYZE_LEASE_UPDATING_LEASE_ENTITY]', { correlationId, leaseId, leaseUpdate });
            await svc.entities.Lease.update(leaseId, leaseUpdate);
          }
        }

        console.log('[ANALYZE_LEASE_SCAN_UPDATED_SUCCESS]', { 
          correlationId, 
          scanId: scan.id,
          clausesCount: analysisResult.clauses.length
        });

      } else {
        // No scanId provided - this shouldn't happen, but handle it
        console.warn('[ANALYZE_LEASE_NO_SCANID_PROVIDED]', { correlationId });

        // Extract property address from key_terms
        const extractedAddressNew = analysisResult.key_terms?.property_address || null;

        // Populate scan_preview for UI display
        const scan_preview = {
          property_address: extractedAddressNew,
          risk_score: analysisResult.risk_score,
          risk_level: analysisResult.risk_score >= 75 ? 'critical' : analysisResult.risk_score >= 50 ? 'high' : analysisResult.risk_score >= 25 ? 'medium' : 'low',
          total_clauses: analysisResult.clauses?.length || 0,
          critical_count: analysisResult.clauses?.filter(c => c.risk_level === 'critical').length || 0,
          high_count: analysisResult.clauses?.filter(c => c.risk_level === 'high').length || 0
        };

        // Create new scan
        scan = await svc.entities.LeaseScan.create({
          lease_id: leaseId,
          scan_preview: scan_preview,
          scan_full: analysisResult,
          risk_score: analysisResult.risk_score,
          status: 'completed'
        });
        
        // Also update the Lease entity with extracted key_terms
        if (extractedAddressNew || analysisResult.key_terms?.monthly_rent || analysisResult.key_terms?.security_deposit) {
          const leaseUpdateNew = {};
          if (extractedAddressNew) leaseUpdateNew.property_address = extractedAddressNew;
          if (analysisResult.key_terms?.monthly_rent) leaseUpdateNew.rent_amount = analysisResult.key_terms.monthly_rent;
          if (analysisResult.key_terms?.security_deposit) leaseUpdateNew.deposit_amount = analysisResult.key_terms.security_deposit;
          if (analysisResult.key_terms?.lease_start_date) leaseUpdateNew.start_date = analysisResult.key_terms.lease_start_date;
          if (analysisResult.key_terms?.lease_end_date) leaseUpdateNew.end_date = analysisResult.key_terms.lease_end_date;
          if (analysisResult.key_terms?.notice_period_days) leaseUpdateNew.notice_period_days = analysisResult.key_terms.notice_period_days;
          
          if (Object.keys(leaseUpdateNew).length > 0) {
            console.log('[ANALYZE_LEASE_UPDATING_LEASE_ENTITY_NEW]', { correlationId, leaseId, leaseUpdateNew });
            await svc.entities.Lease.update(leaseId, leaseUpdateNew);
          }
        }

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
    
    // ═══════════════════════════════════════════════════════════════════════
    // AUTO-POPULATION DISABLED IN analyzeLease.js
    // Tracker creation is handled ONLY by populateFromScan.js to prevent duplicates
    // ═══════════════════════════════════════════════════════════════════════
    console.log('[AUTO_POPULATE_DISABLED]', { 
      correlationId,
      leaseId,
      reason: 'Tracker creation consolidated to populateFromScan.js only'
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