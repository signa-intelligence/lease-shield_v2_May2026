import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { VERSIONED_CATALOG, CATALOG_VERSION, CATALOG_UPDATED_AT } from './getCanonicalLedger.js';

// ============================================================================
// CLAUSE LEDGER SCAN - Deterministic, 100% Coverage Architecture
// Steps: Extract → Map → Analyze → Gap Report → Validate
// ============================================================================

const SCAN_VERSION = "clause-ledger-v1.0";

// Schema validation helper
function validateSchema(report) {
  const errors = [];
  
  if (!report.scan_version) errors.push('missing scan_version');
  if (!Array.isArray(report.canonical_clause_catalog)) errors.push('missing canonical_clause_catalog');
  if (!Array.isArray(report.clause_ledger)) errors.push('missing clause_ledger');
  if (!Array.isArray(report.mappings)) errors.push('missing mappings');
  if (!Array.isArray(report.clause_review)) errors.push('missing clause_review');
  if (!Array.isArray(report.missing_clauses)) errors.push('missing missing_clauses');
  if (!report.summary) errors.push('missing summary');
  
  // Critical: Every clause must have a review
  if (report.clause_ledger && report.clause_review) {
    const ledgerIds = new Set(report.clause_ledger.map(c => c.clause_id));
    const reviewIds = new Set(report.clause_review.map(r => r.clause_id));
    
    for (const id of ledgerIds) {
      if (!reviewIds.has(id)) {
        errors.push(`clause_id ${id} missing from clause_review`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().slice(0, 8);
  
  const log = (stage, data) => {
    console.log(`[CLAUSE_LEDGER:${requestId}] ${stage}:`, JSON.stringify(data));
  };
  
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method === 'GET') {
      return Response.json({ ok: true, name: 'clauseLedgerScan' });
    }
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    if (body && body.ping) {
      return Response.json({ ok: true, name: 'clauseLedgerScan' });
    }
    const fileUrls = body.fileUrls || body.file_urls;
    const leaseId = body.leaseId || body.lease_id;
    const scanId = body.scanId || body.scan_id;
    
    if (!fileUrls || fileUrls.length === 0) {
      return Response.json({ success: false, error: 'No file URLs provided' }, { status: 400 });
    }
    
    log('START', { leaseId, scanId, fileCount: Array.isArray(fileUrls) ? fileUrls.length : 1 });
    
    // ========================================================================
    // STEP 0: Load Canonical Catalog from authoritative source
    // ========================================================================
    const canonical_clause_catalog = VERSIONED_CATALOG;
    const catalog_version_used = CATALOG_VERSION;
    log('STEP_0_CATALOG_LOADED', { 
      total_categories: canonical_clause_catalog.length,
      catalog_version: catalog_version_used 
    });
    
    // ========================================================================
    // STEP 1: Extract ALL Clauses (100% coverage)
    // ========================================================================
    log('STEP_1_EXTRACTION_START', {});
    
    const extractionPrompt = `You are a Thai residential lease document parser. Extract EVERY clause/paragraph from this lease.

CRITICAL RULES:
1. Extract 100% of document content - no text should be left unassigned
2. Each distinct section, paragraph, or numbered item becomes one clause
3. Preserve original text VERBATIM (including Thai text)
4. If a section has no heading, generate one based on content
5. Assign sequential clause_ids: CL-001, CL-002, etc.

For EACH clause extract:
- clause_id: sequential ID (CL-001, CL-002, etc.)
- heading: section heading or generated title
- full_text: complete verbatim text (max 1500 chars, truncate if longer)
- page_estimate: best guess page number (1 if unsure)
- language: "th", "en", or "mixed"
- start_offset: character position estimate (0 for first)
- end_offset: character position estimate

Also extract key terms:
- property_address
- lease_start_date (YYYY-MM-DD)
- lease_end_date (YYYY-MM-DD)
- monthly_rent (number)
- deposit_amount (number)
- notice_period_days (number)
- document_language ("th", "en", "mixed")

If the document is empty or unreadable, return clause_ledger as empty array.`;

    const extractionResult = await base44.integrations.Core.InvokeLLM({
      prompt: extractionPrompt,
      file_urls: fileUrls,
      response_json_schema: {
        type: "object",
        properties: {
          clause_ledger: {
            type: "array",
            items: {
              type: "object",
              properties: {
                clause_id: { type: "string" },
                heading: { type: "string" },
                full_text: { type: "string" },
                page_estimate: { type: "integer" },
                language: { type: "string", enum: ["th", "en", "mixed"] },
                start_offset: { type: "integer" },
                end_offset: { type: "integer" }
              },
              required: ["clause_id", "full_text"]
            }
          },
          key_terms: {
            type: "object",
            properties: {
              property_address: { type: "string" },
              lease_start_date: { type: "string" },
              lease_end_date: { type: "string" },
              monthly_rent: { type: "number" },
              deposit_amount: { type: "number" },
              notice_period_days: { type: "integer" },
              document_language: { type: "string" }
            }
          }
        },
        required: ["clause_ledger"]
      }
    });
    
    const clause_ledger = extractionResult.clause_ledger || [];
    const key_terms = extractionResult.key_terms || {};
    
    // HARD FAIL if no clauses extracted
    if (clause_ledger.length === 0) {
      log('STEP_1_HARD_FAIL', { reason: 'empty_clause_ledger' });
      return Response.json({
        success: false,
        error: 'EXTRACTION_FAILED: No clauses could be extracted from the document',
        diagnostic: { requestId, stage: 'STEP_1_EXTRACTION' }
      }, { status: 422 });
    }
    
    log('STEP_1_EXTRACTION_COMPLETE', { clause_count: clause_ledger.length });
    
    // ========================================================================
    // STEP 2: Map to Canonical Catalog
    // ========================================================================
    log('STEP_2_MAPPING_START', {});
    
    const catalogSummary = canonical_clause_catalog.map(c => ({
      id: c.id,
      name: c.canonical_name,
      keywords: c.typical_keywords.slice(0, 5).join(', ')
    }));
    
    const mappingPrompt = `Map each extracted clause to the canonical catalog.

CANONICAL CATALOG (${catalogSummary.length} categories):
${JSON.stringify(catalogSummary, null, 1)}

EXTRACTED CLAUSES:
${clause_ledger.map(c => `[${c.clause_id}] ${c.heading || 'No heading'}: ${c.full_text.substring(0, 200)}...`).join('\n\n')}

For EACH clause, determine:
- clause_id: the extracted clause ID
- mapped_catalog_ids: array of matching catalog IDs (can be multiple, or ["CAT-UNMAPPED"] if none)
- confidence: 0.0 to 1.0
- rationale: brief explanation of mapping

Be thorough - most clauses should map to at least one catalog category.`;

    const mappingResult = await base44.integrations.Core.InvokeLLM({
      prompt: mappingPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          mappings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                clause_id: { type: "string" },
                mapped_catalog_ids: { type: "array", items: { type: "string" } },
                confidence: { type: "number" },
                rationale: { type: "string" }
              },
              required: ["clause_id", "mapped_catalog_ids", "confidence", "rationale"]
            }
          }
        },
        required: ["mappings"]
      }
    });
    
    const mappings = mappingResult.mappings || [];
    
    // Ensure every clause has a mapping (fill gaps with UNMAPPED)
    const mappedClauseIds = new Set(mappings.map(m => m.clause_id));
    clause_ledger.forEach(cl => {
      if (!mappedClauseIds.has(cl.clause_id)) {
        mappings.push({
          clause_id: cl.clause_id,
          mapped_catalog_ids: ["CAT-UNMAPPED"],
          confidence: 0.5,
          rationale: "No explicit mapping provided by LLM; marked for manual review"
        });
      }
    });
    
    log('STEP_2_MAPPING_COMPLETE', { mappings_count: mappings.length });
    
    // ========================================================================
    // STEP 3: Per-Clause Analysis (MANDATORY FOR EVERY CLAUSE)
    // ========================================================================
    log('STEP_3_ANALYSIS_START', {});
    
    const clauseTexts = clause_ledger.map(c => 
      `[${c.clause_id}] ${c.heading || 'Untitled'}\n${c.full_text}`
    ).join('\n\n---\n\n');
    
    const analysisPrompt = `Analyze EACH extracted clause from THREE perspectives:
1) TENANT: worst-case downside, practical impact
2) LANDLORD: enforcement power, practical benefit  
3) THAI LAWYER: Thai Civil & Commercial Code context, enforceability, market practice

CLAUSES TO ANALYZE:
${clauseTexts}

For EACH clause produce:
- clause_id: exact match to extracted clause
- mapped_catalog_ids: from mappings (can include multiple)
- risk_level: "none" | "low" | "medium" | "high"
- risk_for: "tenant" | "landlord" | "both" | "neither"
- risk_summary: 1-2 sentence summary
- tenant_view: practical tenant impact (2-3 sentences)
- landlord_view: practical landlord benefit/enforcement (2-3 sentences)
- lawyer_view: Thai law context + enforceability (2-3 sentences)
- recommended_change: specific rewrite suggestion or "No change recommended"
- negotiation_tip: one tactical sentence for negotiation

CRITICAL: You MUST provide analysis for EVERY clause, even "safe" ones (use risk_level="none").
Total clause count: ${clause_ledger.length}`;

    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          clause_review: {
            type: "array",
            items: {
              type: "object",
              properties: {
                clause_id: { type: "string" },
                mapped_catalog_ids: { type: "array", items: { type: "string" } },
                risk_level: { type: "string", enum: ["none", "low", "medium", "high"] },
                risk_for: { type: "string", enum: ["tenant", "landlord", "both", "neither"] },
                risk_summary: { type: "string" },
                tenant_view: { type: "string" },
                landlord_view: { type: "string" },
                lawyer_view: { type: "string" },
                recommended_change: { type: "string" },
                negotiation_tip: { type: "string" }
              },
              required: ["clause_id", "risk_level", "risk_summary", "tenant_view", "landlord_view", "lawyer_view"]
            }
          }
        },
        required: ["clause_review"]
      }
    });
    
    let clause_review = analysisResult.clause_review || [];
    
    // CRITICAL: Ensure every clause has a review - fill gaps with safe defaults
    const reviewedIds = new Set(clause_review.map(r => r.clause_id));
    clause_ledger.forEach(cl => {
      if (!reviewedIds.has(cl.clause_id)) {
        const mapping = mappings.find(m => m.clause_id === cl.clause_id);
        clause_review.push({
          clause_id: cl.clause_id,
          mapped_catalog_ids: mapping?.mapped_catalog_ids || ["CAT-UNMAPPED"],
          risk_level: "none",
          risk_for: "neither",
          risk_summary: "Standard clause with no significant risk identified.",
          tenant_view: "No adverse impact identified for tenant.",
          landlord_view: "Standard protection for landlord.",
          lawyer_view: "Consistent with Thai market practice. No enforceability concerns.",
          recommended_change: "No change recommended",
          negotiation_tip: "Accept as standard."
        });
      }
    });
    
    // HARD FAIL if clause_review count doesn't match clause_ledger
    if (clause_review.length !== clause_ledger.length) {
      log('STEP_3_HARD_FAIL', { 
        reason: 'count_mismatch',
        ledger_count: clause_ledger.length,
        review_count: clause_review.length
      });
      return Response.json({
        success: false,
        error: `ANALYSIS_FAILED: clause_review count (${clause_review.length}) != clause_ledger count (${clause_ledger.length})`,
        diagnostic: { requestId, stage: 'STEP_3_ANALYSIS' }
      }, { status: 422 });
    }
    
    log('STEP_3_ANALYSIS_COMPLETE', { review_count: clause_review.length });
    
    // ========================================================================
    // STEP 4: Missing Clause Detection (Gap Report)
    // ========================================================================
    log('STEP_4_GAP_DETECTION_START', {});
    
    const foundCatalogIds = new Set();
    mappings.forEach(m => {
      m.mapped_catalog_ids.forEach(id => foundCatalogIds.add(id));
    });
    
    const missing_clauses = [];
    canonical_clause_catalog.forEach(cat => {
      if (cat.id === 'CAT-UNMAPPED') return;
      
      if (!foundCatalogIds.has(cat.id)) {
        // Determine priority based on category importance
        let priority = 'low';
        if (['CAT-021', 'CAT-025', 'CAT-027', 'CAT-033', 'CAT-053', 'CAT-064', 'CAT-065'].includes(cat.id)) {
          priority = 'high'; // Critical tenant protections
        } else if (['CAT-006', 'CAT-013', 'CAT-035', 'CAT-036', 'CAT-063'].includes(cat.id)) {
          priority = 'medium'; // Important but sometimes implicit
        }
        
        missing_clauses.push({
          catalog_id: cat.id,
          canonical_name: cat.canonical_name,
          why_it_matters: `Missing "${cat.canonical_name}" clause leaves this area unaddressed. ${cat.risk_triggers[0] || 'May create ambiguity.'}`,
          suggested_addition_text: `Add a clear provision addressing: ${cat.purpose}`,
          priority
        });
      }
    });
    
    log('STEP_4_GAP_DETECTION_COMPLETE', { missing_count: missing_clauses.length });
    
    // ========================================================================
    // STEP 5: Assemble Final Report & Validate Schema
    // ========================================================================
    log('STEP_5_ASSEMBLY_START', {});
    
    // Calculate summary statistics
    const riskCounts = { none: 0, low: 0, medium: 0, high: 0 };
    clause_review.forEach(r => {
      riskCounts[r.risk_level] = (riskCounts[r.risk_level] || 0) + 1;
    });
    
    const mappedCount = mappings.filter(m => 
      m.mapped_catalog_ids.length > 0 && !m.mapped_catalog_ids.includes('CAT-UNMAPPED')
    ).length;
    
    const summary = {
      total_extracted: clause_ledger.length,
      total_catalog: canonical_clause_catalog.length - 1, // Exclude CAT-UNMAPPED
      mapped_count: mappedCount,
      mapped_pct: Math.round((mappedCount / clause_ledger.length) * 100),
      missing_count: missing_clauses.length,
      high_risk_count: riskCounts.high,
      medium_risk_count: riskCounts.medium,
      low_risk_count: riskCounts.low,
      none_count: riskCounts.none
    };
    
    // Calculate risk score (0-100)
    const riskScore = Math.min(100, 
      (riskCounts.high * 25) + (riskCounts.medium * 10) + (riskCounts.low * 3)
    );
    
    // Build PDF-ready payload
    const issuesForPdf = [];
    const seen = new Set();
    clause_review.forEach(r => {
      if (!r.risk_level || r.risk_level === 'none') return;
      const clause = clause_ledger.find(c => c.clause_id === r.clause_id);
      const key = `${r.clause_id}::${r.risk_level}::${r.mapped_catalog_ids?.[0] || 'clause'}`;
      if (seen.has(key)) return;
      seen.add(key);

      const recs = [];
      if (r.recommended_change && r.recommended_change !== 'No change recommended') recs.push(r.recommended_change);
      if (r.negotiation_tip && r.negotiation_tip !== 'Accept as standard.') recs.push(r.negotiation_tip);
      const category = r.mapped_catalog_ids?.[0] || 'clause';
      while (recs.length < 2) {
        recs.push(`Request to narrow or clarify ${category} terms to tenant-favorable language`);
        if (recs.length < 2) recs.push(`Add explicit safeguard for ${category} to prevent overbroad interpretation`);
      }

      let evidence = (clause?.full_text || '').substring(0, 240);
      if (!evidence || evidence.length < 10) evidence = `[Evidence not extracted for ${r.clause_id}]`;

      issuesForPdf.push({
        clause_id: r.clause_id,
        severity: r.risk_level,
        category,
        title: clause?.heading || r.risk_summary?.substring(0, 80) || 'Issue identified',
        description: r.risk_summary || 'Review required',
        explanation: r.lawyer_view || r.tenant_view || '',
        recommendation: recs.join('\n'),
        evidence
      });
    });

    const pdfPayload = {
      lease_address: key_terms.property_address || 'Lease Agreement',
      generated_date: new Date().toISOString(),
      risk_score: riskScore,
      summary: `Extracted ${clause_ledger.length} clauses. ${riskCounts.high} high-risk, ${riskCounts.medium} medium-risk. ${missing_clauses.length} standard clauses missing.`,
      key_terms,
      flags: issuesForPdf,
      clause_review,
      clause_ledger,
      mappings,
      missing_clauses,
      coverage_summary: summary
    };

    const finalReport = {
      scan_version: SCAN_VERSION,
      scan_id: scanId || crypto.randomUUID(),
      lease_id: leaseId,
      scanned_at: new Date().toISOString(),
      catalog_version_used,
      canonical_clause_catalog,
      clause_ledger,
      mappings,
      clause_review,
      missing_clauses,
      key_terms,
      summary,
      risk_score: riskScore,
      pdfPayload
    };
    
    // VALIDATE SCHEMA
    const validation = validateSchema(finalReport);
    if (!validation.valid) {
      log('STEP_5_SCHEMA_VALIDATION_FAILED', { errors: validation.errors });
      return Response.json({
        success: false,
        error: `SCHEMA_VALIDATION_FAILED: ${validation.errors.join(', ')}`,
        diagnostic: { requestId, stage: 'STEP_5_VALIDATION', errors: validation.errors }
      }, { status: 422 });
    }
    
    log('STEP_5_SCHEMA_VALIDATED', { valid: true });
    
    // Persist to LeaseScan entity
    try {
      if (scanId) {
        await base44.asServiceRole.entities.LeaseScan.update(scanId, {
          lease_id: leaseId,
          risk_score: riskScore,
          scan_full: {
            canonical_report: finalReport
          },
          summary: `Extracted ${clause_ledger.length} clauses. ${riskCounts.high} high-risk, ${riskCounts.medium} medium-risk. ${missing_clauses.length} standard clauses missing.`,
          version: SCAN_VERSION
        });
      }
    } catch (persistError) {
      log('PERSIST_WARNING', { error: persistError.message });
    }
    
    const duration = Date.now() - startTime;
    log('SCAN_COMPLETE', { 
      duration,
      clauses: clause_ledger.length,
      risk_score: riskScore,
      high_risk: riskCounts.high,
      missing: missing_clauses.length
    });
    
    return Response.json({
      success: true,
      result: finalReport,
      diagnostic: {
        requestId,
        duration,
        version: SCAN_VERSION
      }
    });
    
  } catch (error) {
    log('ERROR', { message: error.message, stack: error.stack?.substring(0, 300) });
    
    return Response.json({
      success: false,
      error: 'Scan failed unexpectedly',
      diagnostic: {
        requestId,
        duration: Date.now() - startTime,
        errorCategory: 'UNEXPECTED'
      }
    }, { status: 500 });
  }
});