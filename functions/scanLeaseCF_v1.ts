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

    // Success - return the result
    console.log('SCAN_CF_V1_SUCCESS', { 
      scanId: result.scanId, 
      clausesCount: result.scan_full?.clauses?.length 
    });

    return new Response(JSON.stringify({
      ok: true,
      scanId: result.scanId,
      leaseId: result.leaseId,
      scan_full: result.scan_full
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