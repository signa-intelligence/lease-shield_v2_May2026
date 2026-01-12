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

    // Pass the scanId so analyzeLease updates the RIGHT record
    console.log('SCAN_CF_V1_CALLING_ANALYZELEASE', { 
      scanId: targetScan.id,
      leaseId, 
      fileUrl: fileUrl?.substring(0, 80) 
    });
    
    const analyzeResult = await base44.functions.invoke('analyzeLease', {
      fileUrl: fileUrl,
      leaseId: leaseId,
      scanId: targetScan.id,
      language: language || 'en'
    });

    console.log('SCAN_CF_V1_ANALYZELEASE_RETURNED', {
      ok: analyzeResult?.data?.ok,
      scanId: analyzeResult?.data?.scanId
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

    // SUCCESS - Transform data
    const scanFull = result.scan_full || {};
    const clausesArray = Array.isArray(scanFull.clauses) ? scanFull.clauses : [];
    
    scanFull.meta = scanFull.meta || {};
    scanFull.meta.text_length = clausesArray.reduce((sum, c) => sum + (c.clause_text?.length || 0), 0);
    scanFull.meta.chunks = 1;
    scanFull.meta.warnings = scanFull.meta.warnings || [];
    
    scanFull.summary = scanFull.summary || {};
    scanFull.summary.executive_summary = scanFull.summary.executive_summary || "Lease analysis complete.";
    scanFull.summary.top_risks = scanFull.summary.top_risks || [];
    
    if (!Array.isArray(scanFull.clause_ledger) || scanFull.clause_ledger.length === 0) {
      scanFull.clause_ledger = clausesArray.map((c, idx) => ({
        clause_id: c.clause_id || `clause-${idx + 1}`,
        title: c.canonical_name || `Clause ${idx + 1}`,
        full_text: c.clause_text || '',
        page_number: c.page_number || 1,
        risk_tags: c.risk_level ? [c.risk_level] : []
      }));
    }
    
    scanFull.key_terms = scanFull.key_terms || {};

    console.log('SCAN_CF_V1_BEFORE_UPDATE', { 
      scanId: targetScan.id,
      clausesCount: clausesArray.length,
      clause_ledger_count: scanFull.clause_ledger.length,
      text_length: scanFull.meta.text_length,
      risk_score: scanFull.risk_score
    });

    // NUCLEAR OPTION: Delete and recreate the scan record
    const svc = base44.asServiceRole || base44;
    
    try {
      console.log('SCAN_CF_V1_DELETING_OLD_SCAN', { scanId: targetScan.id });
      
      // Delete the old scan record
      await svc.entities.LeaseScan.delete(targetScan.id);
      
      console.log('SCAN_CF_V1_OLD_SCAN_DELETED');
      
      // Create a brand new scan with the correct data
      const newScan = await svc.entities.LeaseScan.create({
        id: targetScan.id,  // Keep the same ID so frontend URLs still work
        lease_id: leaseId,
        scan_full: scanFull,
        risk_score: scanFull.risk_score || 0,
        status: 'completed'
      });
      
      console.log('SCAN_CF_V1_NEW_SCAN_CREATED', { 
        scanId: newScan.id,
        clausesCount: scanFull.clauses?.length || 0
      });
      
      // Verify the new scan
      const verifyScans = await svc.entities.LeaseScan.filter({ id: targetScan.id });
      const verifyData = verifyScans[0]?.scan_full;
      
      console.log('SCAN_CF_V1_VERIFY_NEW_SCAN', {
        scanId: targetScan.id,
        found: verifyScans.length > 0,
        verify_has_clauses: !!verifyData?.clauses,
        verify_clauses_count: verifyData?.clauses?.length || 0,
        verify_keys: verifyData ? Object.keys(verifyData) : []
      });
      
    } catch (dbError) {
      console.error('SCAN_CF_V1_DATABASE_ERROR', {
        scanId: targetScan.id,
        error: String(dbError),
        stack: dbError.stack
      });
      
      return new Response(JSON.stringify({
        ok: false,
        step: 'DATABASE',
        error_code: 'DB_ERROR',
        message: `Database operation failed: ${dbError.message}`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('SCAN_CF_V1_SUCCESS', { 
      scanId: targetScan.id,
      clausesCount: clausesArray.length
    });

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