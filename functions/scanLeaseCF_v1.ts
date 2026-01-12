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
    
    console.log('SCAN_CF_V1_INPUT', { leaseId, inputScanId, fileUrl: fileUrl?.substring(0, 80) });

    // Find or create scan record FIRST
    let targetScan = null;
    if (inputScanId) {
      const scanArr = await base44.entities.LeaseScan.filter({ id: inputScanId });
      targetScan = scanArr?.[0] || null;
      console.log('SCAN_CF_V1_LOOKUP_BY_INPUT_ID', { inputScanId, found: !!targetScan });
    }
    if (!targetScan) {
      const scans = await base44.entities.LeaseScan.filter({ lease_id: leaseId }, '-created_date');
      targetScan = scans?.[0] || null;
      console.log('SCAN_CF_V1_LOOKUP_BY_LEASE', { leaseId, found: !!targetScan, scanId: targetScan?.id });
    }
    if (!targetScan) {
      targetScan = await base44.entities.LeaseScan.create({ 
        lease_id: leaseId, 
        status: 'initiated' 
      });
      console.log('SCAN_CF_V1_CREATED_NEW', { scanId: targetScan.id });
    }

    console.log('SCAN_CF_V1_CALLING_ANALYZELEASE', { scanId: targetScan.id });

    // Call analyzeLease
    const analyzeResult = await base44.functions.invoke('analyzeLease', {
      fileUrl: fileUrl,
      leaseId: leaseId,
      language: language || 'en'
    });

    const result = analyzeResult?.data;
    
    console.log('SCAN_CF_V1_ANALYZELEASE_RESPONSE', {
      ok: result?.ok,
      has_scan_full: !!result?.scan_full,
      clauses_count: result?.scan_full?.clauses?.length || 0
    });

    if (!result) {
      return new Response(JSON.stringify({
        ok: false,
        scanId: targetScan.id,
        leaseId,
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
        scanId: targetScan.id,
        leaseId: leaseId,
        step: result.step,
        error_code: result.error_code,
        message: result.message
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // SUCCESS - Transform and save the data
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

    console.log('SCAN_CF_V1_BEFORE_UPDATE', { 
      scanId: targetScan.id,
      clausesCount: clausesArray.length,
      clause_ledger_count: scanFull.clause_ledger.length,
      text_length: scanFull.meta.text_length,
      risk_score: scanFull.risk_score
    });

    // UPDATE THE DATABASE WITH TRANSFORMED DATA
    try {
      await base44.entities.LeaseScan.update(targetScan.id, {
        scan_full: scanFull,
        status: 'completed',
        risk_score: scanFull.risk_score || 0,
        clauses_count: clausesArray.length
      });
      
      console.log('SCAN_CF_V1_DATABASE_UPDATED_SUCCESS', { 
        scanId: targetScan.id 
      });
    } catch (updateError) {
      console.error('SCAN_CF_V1_DATABASE_UPDATE_FAILED', {
        scanId: targetScan.id,
        error: String(updateError)
      });
      
      return new Response(JSON.stringify({
        ok: false,
        scanId: targetScan.id,
        leaseId,
        step: 'DATABASE_UPDATE',
        error_code: 'UPDATE_FAILED',
        message: `Failed to update database: ${updateError.message}`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('SCAN_CF_V1_SUCCESS', { 
      scanId: targetScan.id, 
      clausesCount: clausesArray.length,
      clause_ledger_count: scanFull.clause_ledger.length,
      text_length: scanFull.meta.text_length
    });

    // Return the transformed data
    return new Response(JSON.stringify({
      ok: true,
      scanId: targetScan.id,
      leaseId: leaseId,
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