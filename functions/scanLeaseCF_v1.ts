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
    // Self-test logging
    try {
      const scanFullKeys = cfJson?.scan_full ? Object.keys(cfJson.scan_full) : [];
      const stagesLen = cfJson?.debugLog?.stages ? cfJson.debugLog.stages.length : (cfJson?.scan_full?.debug?.stages?.length ?? null);
      console.log('SCAN_CF_V1_SELFTEST', { scanFullKeys, stagesLen });
    } catch (_) {}

    // Determine or create the LeaseScan record we will persist to
    let scans = await base44.entities.LeaseScan.filter({ lease_id: leaseId }, '-created_date');
    let targetScan = scans?.[0] || null;
    if (!targetScan) {
      targetScan = await base44.entities.LeaseScan.create({ lease_id: leaseId, status: 'initiated' });
    }

    // Persist scan_full EXACTLY as returned by Cloudflare (no enrichment)
    if (cfJson && typeof cfJson === 'object') {
      try {
        await base44.entities.LeaseScan.update(targetScan.id, {
          scan_full: cfJson.scan_full ?? cfJson, // prefer cfJson.scan_full if Worker wraps; else store entire cfJson
          status: cfJson.ok === false ? 'failed' : 'ok'
        });
      } catch (persistErr) {
        console.error('SCAN_CF_PERSIST_ERROR', String(persistErr));
      }

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

      // Validation: worker ok:true but empty analysis
      if (cfJson.ok === true) {
        if ((clausesArr.length === 0) || (topRisksLen === 0) || (nonNoneRiskCount === 0) || !(meta.text_length > 0)) {
          const debugLog = {
            worker_url: workerUrl,
            worker_body_preview: preview,
            metrics: {
              status: cfRes.status,
              leaseId,
              scanId: targetScan.id,
              text_length: meta.text_length ?? null,
              chunks: meta.chunks ?? null,
              clauses: clausesArr.length,
              nonNoneRiskCount,
              top_risks: topRisksLen,
              risk_score: riskScore ?? null,
              warnings
            }
          };
          return new Response(JSON.stringify({
            ok: false,
            scanId: targetScan.id,
            leaseId,
            step: 'VALIDATION',
            error_code: 'EMPTY_ANALYSIS',
            message: 'Worker returned ok but no meaningful analysis',
            debugLog,
            retryable: true
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }

      // Return normalized success/failure envelope
      if (cfJson.ok === false) {
        const { step, error_code, message } = cfJson;
        return new Response(JSON.stringify({ ok: false, scanId: targetScan.id, leaseId, step, error_code, message }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        });
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
});