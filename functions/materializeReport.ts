import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { requireAuth, safeLog } from './authGuards.js';

/**
 * materializeReport.js
 * 
 * IDEMPOTENT server-side materializer for pdfPayload.
 * 
 * Input: { scanId, requestId? }
 * 
 * Behavior:
 * 1. Fetch LeaseScan by scanId
 * 2. If scan_full.canonical_report.pdfPayload exists and non-empty → return { ok:true, already:true }
 * 3. Else build a fallback pdfPayload from whatever scan result exists
 * 4. Persist to LeaseScan.scan_full.canonical_report
 * 5. Return { ok:true, scanId, hasPdfPayload:true, fallback:true|false }
 * 
 * MUST be safe to call multiple times (idempotent).
 */

Deno.serve(async (req) => {
  // Handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  // Parse body safely
  let body = {};
  try {
    body = await req.json();
  } catch (e) {
    return Response.json({
      ok: false,
      error: 'INVALID_JSON',
      message: 'Request body must be valid JSON'
    }, { status: 400 });
  }

  const { scanId } = body;
  const requestId = body.requestId || crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();

  const log = (step, data) => {
    console.log(`[materializeReport][${requestId}][${scanId}] ${step}:`, JSON.stringify(data));
  };

  try {
    log('START', { scanId });

    if (!scanId) {
      return Response.json({
        ok: false,
        error: 'MISSING_SCAN_ID',
        message: 'scanId is required',
        requestId
      }, { status: 400 });
    }

    const { user, base44 } = await requireAuth(req);
    log('AUTH_OK', { userId: user.id });

    // STEP 1: Fetch LeaseScan
    log('FETCH_SCAN_START', {});
    const scans = await base44.entities.LeaseScan.filter({ id: scanId });
    const scan = scans?.[0];

    if (!scan) {
      log('SCAN_NOT_FOUND', { scanId });
      return Response.json({
        ok: false,
        error: 'SCAN_NOT_FOUND',
        message: `No LeaseScan found for scanId: ${scanId}`,
        requestId,
        scanId
      }, { status: 404 });
    }

    log('SCAN_FOUND', { leaseId: scan.lease_id });

    // STEP 2: Check if pdfPayload already exists
    const existingCanonical = scan?.scan_full?.canonical_report || null;
    const existingPdfPayload = existingCanonical?.pdfPayload || null;

    if (existingPdfPayload && 
        typeof existingPdfPayload === 'object' && 
        Object.keys(existingPdfPayload).length > 0 &&
        Array.isArray(existingPdfPayload.clause_ledger)) {
      log('ALREADY_MATERIALIZED', { 
        clauseCount: existingPdfPayload.clause_ledger?.length || 0,
        flagsCount: existingPdfPayload.flags?.length || 0,
        isFallback: existingPdfPayload.fallback || false
      });
      
      return Response.json({
        ok: true,
        already: true,
        scanId,
        hasPdfPayload: true,
        fallback: existingPdfPayload.fallback || false,
        clauseCount: existingPdfPayload.clause_ledger?.length || 0,
        requestId,
        elapsedMs: Date.now() - startTime
      });
    }

    // STEP 3: Build fallback pdfPayload from available data
    log('BUILD_FALLBACK_START', {});

    // Try to extract data from various possible locations
    const scanFull = scan.scan_full || {};
    const clausesExtracted = scanFull.clauses_extracted || [];
    const keyTerms = scanFull.key_terms || {};
    const existingClauseLedger = scanFull.clause_ledger || existingCanonical?.clause_ledger || [];
    const existingIssues = existingCanonical?.issues || scan.flags || [];
    const existingRiskScore = existingCanonical?.risk_score || scan.risk_score || 0;
    const existingSummary = existingCanonical?.summary || scan.summary || '';

    // Check if we have ANY source data to work with
    const hasClauseData = (clausesExtracted.length > 0) || (existingClauseLedger.length > 0);
    
    if (!hasClauseData) {
      // No source data at all - cannot materialize
      log('NO_SOURCE_DATA', { 
        clausesExtracted: clausesExtracted.length,
        existingClauseLedger: existingClauseLedger.length
      });
      
      // Still persist a minimal failed payload so we don't retry infinitely
      const failedPayload = {
        status: 'failed',
        failedAt: new Date().toISOString(),
        error: {
          code: 'NO_SOURCE_DATA',
          message: 'No clause data available to materialize report'
        },
        pdfPayload: null
      };

      await base44.entities.LeaseScan.update(scanId, {
        scan_full: {
          ...scanFull,
          canonical_report: failedPayload,
          materialized_at: new Date().toISOString(),
          materialized_status: 'failed_no_data'
        }
      });

      return Response.json({
        ok: false,
        error: 'NO_SOURCE_DATA',
        message: 'No clause data available to materialize report. Please re-scan the lease.',
        requestId,
        scanId,
        elapsedMs: Date.now() - startTime
      }, { status: 422 });
    }

    // Build clause ledger from best available source
    let finalClauseLedger = [];
    if (existingClauseLedger.length > 0) {
      finalClauseLedger = existingClauseLedger.map(c => ({
        clause_id: c.clause_id || `CLAUSE-${Math.random().toString(36).slice(2,8)}`,
        heading: c.heading || c.title || null,
        full_text: c.full_text || c.raw_text || '',
        page: c.page || c.page_number || null,
        risk_level: c.risk_level || 'unknown'
      }));
    } else if (clausesExtracted.length > 0) {
      finalClauseLedger = clausesExtracted.map((c, idx) => ({
        clause_id: c.clause_id || `CLAUSE-${idx + 1}`,
        heading: c.heading || c.title || null,
        full_text: c.full_text || c.raw_text || '',
        page: c.page || c.page_number || null,
        risk_level: 'unknown'
      }));
    }

    // Build flags from existing issues
    const finalFlags = (existingIssues || []).map((issue, idx) => ({
      clause_id: issue.clause_id || issue.clause_refs?.[0]?.clause_id || `ISSUE-${idx}`,
      severity: issue.severity || 'medium',
      category: issue.category || 'Other Risks',
      title: issue.title || 'Issue detected',
      description: issue.summary || issue.description || issue.why_it_matters || 'Review required',
      explanation: issue.why_it_matters || issue.explanation || '',
      recommendation: Array.isArray(issue.recommendations) 
        ? issue.recommendations.join('\n') 
        : (issue.recommendation || 'Review with legal counsel'),
      evidence: issue.clause_refs?.[0]?.snippet || issue.evidence || 'Evidence not available'
    }));

    // Build the fallback pdfPayload
    const fallbackPdfPayload = {
      lease_address: keyTerms.property_address || scan.lease_id || 'Lease Agreement',
      generated_date: new Date().toISOString(),
      risk_score: existingRiskScore,
      summary: existingSummary || `${finalFlags.length} issues detected (materialized fallback)`,
      key_terms: keyTerms,
      flags: finalFlags,
      clause_review: [], // No detailed review available
      clause_ledger: finalClauseLedger,
      mappings: [],
      missing_clauses: [],
      coverage_summary: {
        total_clauses: finalClauseLedger.length,
        clauses_reviewed: 0,
        clauses_flagged: finalFlags.length
      },
      fallback: true,
      fallback_reason: 'materializeReport',
      materialized_at: new Date().toISOString()
    };

    log('FALLBACK_BUILT', {
      clauseCount: finalClauseLedger.length,
      flagsCount: finalFlags.length,
      riskScore: existingRiskScore
    });

    // STEP 4: Persist to LeaseScan
    const canonicalReport = {
      status: 'ok',
      generatedAt: new Date().toISOString(),
      pdfPayload: fallbackPdfPayload,
      clause_ledger: finalClauseLedger,
      clause_review: [],
      issues: finalFlags,
      fallback: true,
      fallback_reason: 'materializeReport'
    };

    // Build pipeline entry
    const pipelineEntry = {
      step: 'MATERIALIZE_REPORT',
      at: new Date().toISOString(),
      ok: true,
      ms: Date.now() - startTime,
      meta: { requestId, fallback: true }
    };

    const existingPipeline = scanFull.pipeline || [];

    await base44.entities.LeaseScan.update(scanId, {
      risk_score: existingRiskScore,
      flags: finalFlags,
      summary: fallbackPdfPayload.summary,
      scan_full: {
        ...scanFull,
        canonical_report: canonicalReport,
        pipeline: [...existingPipeline, pipelineEntry],
        materialized_at: new Date().toISOString(),
        materialized_status: 'ok'
      }
    });

    log('PERSIST_COMPLETE', { elapsedMs: Date.now() - startTime });

    // STEP 5: Verify persistence
    const verifyScan = (await base44.entities.LeaseScan.filter({ id: scanId }))?.[0];
    const verifyPayload = verifyScan?.scan_full?.canonical_report?.pdfPayload;
    
    if (!verifyPayload || !Array.isArray(verifyPayload.clause_ledger)) {
      log('VERIFY_FAILED', { hasPayload: !!verifyPayload });
      return Response.json({
        ok: false,
        error: 'PERSISTENCE_VERIFY_FAILED',
        message: 'Failed to verify persisted pdfPayload',
        requestId,
        scanId,
        elapsedMs: Date.now() - startTime
      }, { status: 500 });
    }

    log('VERIFY_PASSED', { clauseCount: verifyPayload.clause_ledger.length });

    return Response.json({
      ok: true,
      already: false,
      scanId,
      hasPdfPayload: true,
      fallback: true,
      clauseCount: finalClauseLedger.length,
      flagsCount: finalFlags.length,
      requestId,
      elapsedMs: Date.now() - startTime
    });

  } catch (error) {
    log('ERROR', { 
      message: error.message, 
      stack: error.stack?.substring(0, 300),
      elapsedMs: Date.now() - startTime
    });

    if (error.message === 'UNAUTHORIZED') {
      return Response.json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
        requestId
      }, { status: 401 });
    }

    return Response.json({
      ok: false,
      error: 'MATERIALIZE_ERROR',
      message: error.message || 'Failed to materialize report',
      requestId,
      scanId,
      elapsedMs: Date.now() - startTime
    }, { status: 500 });
  }
});