import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const bodyText = await req.text();
    let payload = {};
    try { payload = JSON.parse(bodyText || '{}'); } catch (_) { payload = {}; }

    const { leaseId = null, fileUrl = null, language = null, scanId: inputScanId = null } = payload;
    
    if (!leaseId || !fileUrl) {
      return new Response(JSON.stringify({ 
        ok: false, 
        step: 'INPUT_VALIDATION', 
        error_code: 'MISSING_PARAMS', 
        message: 'leaseId and fileUrl are required' 
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    console.log('SCAN_CF_V1_REDIRECT_TO_ANALYZELEASE', { leaseId, fileUrl: fileUrl?.substring(0, 80) });

    // Call the new analyzeLease function instead of Cloudflare worker
    const analyzeResult = await base44.functions.invoke('analyzeLease', {
      fileUrl: fileUrl,
      leaseId: leaseId,
      language: language || 'en'
    });

    const result = analyzeResult?.data;

    if (!result) {
      return new Response(JSON.stringify({
        ok: false,
        step: 'ANALYZE_LEASE',
        error_code: 'NO_RESPONSE',
        message: 'analyzeLease returned no data'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If analyzeLease returned an error, pass it through
    if (result.ok === false) {
      return new Response(JSON.stringify({
        ok: false,
        scanId: result.scanId,
        leaseId: result.leaseId,
        step: result.step,
        error_code: result.error_code,
        message: result.message
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Success - transform data to expected format
    const scanFull = result.scan_full || {};
    
    // Ensure all required fields exist
    if (!scanFull.meta) {
      scanFull.meta = {};
    }
    
    // Add text_length and chunks from clauses data
    const clausesArray = Array.isArray(scanFull.clauses) ? scanFull.clauses : [];
    scanFull.meta.text_length = clausesArray.reduce((sum, c) => sum + (c.clause_text?.length || 0), 0);
    scanFull.meta.chunks = 1;
    scanFull.meta.warnings = scanFull.meta.warnings || [];
    
    // Ensure summary structure
    if (!scanFull.summary) {
      scanFull.summary = {};
    }
    if (!scanFull.summary.executive_summary) {
      scanFull.summary.executive_summary = "Lease analysis complete.";
    }
    if (!Array.isArray(scanFull.summary.top_risks)) {
      scanFull.summary.top_risks = [];
    }
    
    // Build clause_ledger from clauses for backward compatibility
    if (!Array.isArray(scanFull.clause_ledger) || scanFull.clause_ledger.length === 0) {
      scanFull.clause_ledger = clausesArray.map((c, idx) => ({
        clause_id: c.clause_id || `clause-${idx + 1}`,
        title: c.canonical_name || `Clause ${idx + 1}`,
        full_text: c.clause_text || '',
        page_number: c.page_number || 1,
        risk_tags: c.risk_level ? [c.risk_level] : []
      }));
    }
    
    // Add key_terms if missing
    if (!scanFull.key_terms) {
      scanFull.key_terms = {};
    }

    console.log('SCAN_CF_V1_SUCCESS', { 
      scanId: result.scanId, 
      clausesCount: clausesArray.length,
      clause_ledger_count: scanFull.clause_ledger.length,
      text_length: scanFull.meta.text_length
    });

    return new Response(JSON.stringify({
      ok: true,
      scanId: result.scanId,
      leaseId: result.leaseId,
      scan_full: scanFull
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    console.error('SCAN_CF_V1_ERROR', String(e));
    return new Response(JSON.stringify({ 
      ok: false, 
      step: 'FUNCTION_CRASH', 
      error_code: 'UNHANDLED_EXCEPTION', 
      message: String(e?.message || e) 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});