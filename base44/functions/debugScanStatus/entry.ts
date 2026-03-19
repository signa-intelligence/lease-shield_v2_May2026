import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { requireAuth, safeLog } from './authGuards.js';

/**
 * debugScanStatus.js
 * 
 * Enhanced diagnostic function to inspect scan state.
 * Checks multiple paths for pdfPayload and legacy fields.
 */

Deno.serve(async (req) => {
  const body = await req.json();
  const { scanId } = body;
  const requestId = body.requestId || crypto.randomUUID().slice(0, 8);

  const log = (step, data) => {
    console.log(`[debugScanStatus][${requestId}][${scanId}] ${step}:`, JSON.stringify(data));
  };

  try {
    const { user, base44 } = await requireAuth(req);

    if (!scanId) {
      return Response.json({ 
        found: false, 
        hasPdfPayload: false, 
        error: 'MISSING_SCAN_ID',
        requestId 
      });
    }

    log('FETCH_START', {});
    const scans = await base44.entities.LeaseScan.filter({ id: scanId });
    const scan = scans?.[0];

    if (!scan) {
      log('NOT_FOUND', {});
      return Response.json({
        found: false,
        scanId,
        error: 'SCAN_NOT_FOUND',
        requestId
      });
    }

    log('FOUND', { leaseId: scan.lease_id });

    // Inspect all possible payload locations
    const scanFull = scan?.scan_full || null;
    const canonical = scanFull?.canonical_report || null;
    const pdfPayload = canonical?.pdfPayload || null;
    
    // Legacy/alternate locations
    const legacyClauseLedger = scanFull?.clause_ledger || null;
    const legacyClausesExtracted = scanFull?.clauses_extracted || null;
    const topLevelFlags = scan?.flags || null;
    const topLevelRiskScore = scan?.risk_score;
    const topLevelSummary = scan?.summary;

    // Build detailed diagnostics
    const diagnostics = {
      // Primary path
      hasCanonical: !!canonical,
      hasPdfPayload: !!(pdfPayload && typeof pdfPayload === 'object' && Object.keys(pdfPayload).length > 0),
      pdfPayloadValid: !!(pdfPayload && Array.isArray(pdfPayload.clause_ledger) && pdfPayload.clause_ledger.length > 0),
      
      // pdfPayload details
      pdfPayloadClauseCount: pdfPayload?.clause_ledger?.length || 0,
      pdfPayloadFlagsCount: pdfPayload?.flags?.length || 0,
      pdfPayloadRiskScore: pdfPayload?.risk_score,
      pdfPayloadIsFallback: pdfPayload?.fallback || false,
      pdfPayloadFallbackReason: pdfPayload?.fallback_reason || null,
      
      // canonical_report details
      canonicalStatus: canonical?.status || 'unknown',
      canonicalGeneratedAt: canonical?.generatedAt || null,
      canonicalFailedAt: canonical?.failedAt || null,
      canonicalError: canonical?.error || null,
      
      // Legacy paths (fallback data sources)
      hasLegacyClauseLedger: !!(legacyClauseLedger && legacyClauseLedger.length > 0),
      legacyClauseLedgerCount: legacyClauseLedger?.length || 0,
      hasLegacyClausesExtracted: !!(legacyClausesExtracted && legacyClausesExtracted.length > 0),
      legacyClausesExtractedCount: legacyClausesExtracted?.length || 0,
      hasTopLevelFlags: !!(topLevelFlags && topLevelFlags.length > 0),
      topLevelFlagsCount: topLevelFlags?.length || 0,
      topLevelRiskScore: topLevelRiskScore,
      topLevelSummary: topLevelSummary ? topLevelSummary.substring(0, 100) : null,
      
      // Pipeline info
      hasPipeline: !!(scanFull?.pipeline && scanFull.pipeline.length > 0),
      pipelineSteps: scanFull?.pipeline?.length || 0,
      pipelineLastStep: scanFull?.pipeline?.[scanFull.pipeline.length - 1]?.step || null,
      
      // Materialization status
      materializedAt: scanFull?.materialized_at || null,
      materializedStatus: scanFull?.materialized_status || null,
      
      // Can materialize? (has source data)
      canMaterialize: (legacyClauseLedger?.length > 0) || (legacyClausesExtracted?.length > 0),
      
      // Version info
      version: scanFull?.version || 'unknown'
    };

    log('DIAGNOSTICS', diagnostics);

    return Response.json({
      found: true,
      scanId: scan.id,
      leaseId: scan.lease_id,
      requestId,
      
      // Primary status (what ReportFull needs)
      hasPdfPayload: diagnostics.hasPdfPayload && diagnostics.pdfPayloadValid,
      canonicalStatus: diagnostics.canonicalStatus,
      clauseLedgerCount: diagnostics.pdfPayloadClauseCount,
      isFallback: diagnostics.pdfPayloadIsFallback,
      
      // For debugging
      diagnostics,
      
      // Error info if any
      lastError: canonical?.error || null
    });

  } catch (error) {
    log('ERROR', { message: error.message, stack: error.stack?.substring(0, 200) });
    
    if (error.message === 'UNAUTHORIZED') {
      return Response.json({ 
        found: false,
        scanId,
        error: 'UNAUTHORIZED',
        requestId 
      }, { status: 401 });
    }

    return Response.json({ 
      found: false,
      scanId,
      error: 'FUNCTION_ERROR',
      errorMessage: error.message,
      requestId 
    }, { status: 500 });
  }
});