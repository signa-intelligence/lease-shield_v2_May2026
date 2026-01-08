import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const bodyText = await req.text();
    let payload = {};
    try { payload = JSON.parse(bodyText || '{}'); } catch (_) { payload = {}; }

    const { leaseId = null, fileUrl = null, language = null } = payload;
    const forwardPayload = payload?.debug_test === true ? payload : { leaseId, fileUrl, language };
    if (!leaseId || !fileUrl) {
      return new Response(JSON.stringify({ ok: false, step: 'INPUT_VALIDATION', error_code: 'MISSING_PARAMS', message: 'leaseId and fileUrl are required' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Forward to Cloudflare Worker
    const workerUrl = 'https://lease-scan-worker-01.steve-l.workers.dev';
    console.log('SCAN_CF_V1_STAGE', 'CALL_WORKER');
    const cfRes = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forwardPayload)
    });
    console.log('SCAN_CF_V1_HTTP', { worker_url: workerUrl, status: cfRes.status });

    const raw = await cfRes.text();
    const preview = raw.slice(0, 300);
    console.log('SCAN_CF_V1_BODY_PREVIEW', preview);
    let cfJson = null;
    try { cfJson = JSON.parse(raw); } catch { /* fall-through */ }
    // Hard debug of Cloudflare response structure
    try {
      const cf_ok = cfJson?.ok;
      const typeof_cfRes = typeof cfJson;
      const cf_keys = Object.keys(cfJson || {});
      const scan_full = (cfJson?.scan_full || cfJson) || {};
      const has_scan_full = !!cfJson?.scan_full;
      const typeof_scan_full = typeof scan_full;
      const scan_full_keys = Object.keys(scan_full || {});
      const scan_full_preview = JSON.stringify(scan_full).slice(0, 1500);
      console.log('SCAN_CF_V1_CF_DEBUG', { cf_ok, typeof_cfRes, cf_keys });
      console.log('SCAN_CF_V1_CF_SCANFULL', { has_scan_full, typeof_scan_full, scan_full_keys, scan_full_preview });

      // Self-test logging
      const stagesLen = cfJson?.debugLog?.stages ? cfJson.debugLog.stages.length : (cfJson?.scan_full?.debug?.stages?.length ?? null);
      console.log('SCAN_CF_V1_SELFTEST', { scanFullKeys: scan_full_keys, stagesLen });
    } catch (_) {}

    // Determine or create the LeaseScan record we will persist to
    let scans = await base44.entities.LeaseScan.filter({ lease_id: leaseId }, '-created_date');
    let targetScan = scans?.[0] || null;
    if (!targetScan) {
      targetScan = await base44.entities.LeaseScan.create({ lease_id: leaseId, status: 'initiated' });
    }

    // Persist scan_full EXACTLY as returned by Cloudflare (no enrichment)
    if (cfJson && typeof cfJson === 'object') {
      // Defer persistence until validation passes

      // Metrics logging (never log full text)
      const scanFull = (cfJson.scan_full || cfJson) || {};
      const meta = scanFull.meta || {};
      const clausesArr = Array.isArray(scanFull.clauses) ? scanFull.clauses : [];
      const nonNoneRiskCount = clausesArr.filter(c => (c?.risk_level || 'none') !== 'none').length;
      const topRisksLen = Array.isArray(scanFull.summary?.top_risks) ? scanFull.summary.top_risks.length : 0;
      const riskScore = scanFull.risk_score;
      const warnings = Array.isArray(scanFull.debug?.warnings) ? scanFull.debug.warnings : [];

      console.log('SCAN_CF_V1_METRICS', {
        worker_url: workerUrl,
        status: cfRes.status,
        body_preview: preview,
        leaseId,
        scanId: targetScan.id,
        text_length: meta.text_length ?? null,
        chunks: meta.chunks ?? null,
        clauses: clausesArr.length,
        nonNoneRiskCount,
        top_risks: topRisksLen,
        risk_score: riskScore ?? null,
        warnings
      });

      // REQUIRED MINIMUM validation for a real analysis
      if (cfJson.ok === true) {
        const scanFullForCheck = (cfJson.scan_full || cfJson) || {};
        const textLenOk = typeof scanFullForCheck?.meta?.text_length === 'number' && scanFullForCheck.meta.text_length >= 300;
        const clausesOk = Array.isArray(scanFullForCheck?.clauses) && scanFullForCheck.clauses.length >= 1;
        const riskScoreOk = typeof scanFullForCheck?.risk_score === 'number';
        const topRisksOk = Array.isArray(scanFullForCheck?.summary?.top_risks);
        if (!(textLenOk && clausesOk && riskScoreOk && topRisksOk)) {
          const debugLog = {
            worker_status: cfRes.status,
            worker_url: workerUrl,
            cf_keys: Object.keys(cfJson || {}),
            scan_full_keys: Object.keys(scanFullForCheck || {}),
            scan_full_preview: JSON.stringify(scanFullForCheck).slice(0, 1500)
          };
          console.log('SCAN_CF_V1_EMPTY_ANALYSIS', debugLog);
          return new Response(JSON.stringify({
            ok: false,
            step: 'VALIDATION',
            error_code: 'EMPTY_ANALYSIS',
            message: 'Cloudflare returned ok but analysis payload is empty/invalid',
            retryable: true,
            debugLog,
            scanId: targetScan.id,
            leaseId
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }

      // Return normalized success/failure envelope
    if (cfJson.ok === false) {
            // Destructure debugLog from cfJson
            const { step, error_code, message, debugLog } = cfJson; 
            return new Response(JSON.stringify({ ok: false, scanId: targetScan.id, leaseId, step, error_code, message, debugLog }), {
              status: 200, headers: { 'Content-Type': 'application/json' }
            });
      }

      // Persist only after validation passes
      try {
        await base44.entities.LeaseScan.update(targetScan.id, {
          scan_full: cfJson.scan_full ?? cfJson,
          status: 'ok'
        });
      } catch (persistErr) {
        console.error('SCAN_CF_PERSIST_ERROR', String(persistErr));
      }

      console.log('SCAN_CF_V1_DONE', { scanId: targetScan.id, leaseId });
      return new Response(JSON.stringify({ ok: true, scanId: targetScan.id, leaseId, scan_full: cfJson.scan_full ?? cfJson }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Non-JSON response from worker -> structured failure
    return new Response(JSON.stringify({ ok: false, scanId: targetScan?.id || null, leaseId, step: 'WORKER_RESPONSE', error_code: 'NON_JSON', message: 'Cloudflare returned non-JSON response' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('SCAN_CF_V1_UNHANDLED', String(e));
    return new Response(JSON.stringify({ ok: false, step: 'FUNCTION_CRASH', error_code: 'UNHANDLED_EXCEPTION', message: String(e?.message || e) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // After getting cfRes from worker
if (cfRes.ok && cfRes.scan_full) {
  const { risk_score, top_risks, clauses } = cfRes.scan_full;
  
  // Log what we actually got
  console.log('SCAN_VALIDATION', {
    risk_score,
    top_risks_count: top_risks?.length || 0,
    top_risks_type: typeof top_risks,
    clauses_count: clauses?.length || 0,
    has_risk_score: typeof risk_score === 'number'
  });
  
  // Ensure arrays are properly formed
  if (!Array.isArray(top_risks)) {
    console.error('TOP_RISKS_NOT_ARRAY', { top_risks });
  }
  if (!Array.isArray(clauses)) {
    console.error('CLAUSES_NOT_ARRAY', { clauses });
  }
}
});