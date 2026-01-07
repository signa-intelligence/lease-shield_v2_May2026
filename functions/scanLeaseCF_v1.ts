import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const bodyText = await req.text();
    let payload = {};
    try { payload = JSON.parse(bodyText || '{}'); } catch (_) { payload = {}; }

    const { leaseId = null, fileUrl = null, language = null } = payload;
    if (!leaseId || !fileUrl) {
      return new Response(JSON.stringify({ ok: false, step: 'INPUT_VALIDATION', error_code: 'MISSING_PARAMS', message: 'leaseId and fileUrl are required' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Forward to Cloudflare Worker
    const cfRes = await fetch('https://lease-scan-worker-01.steve-l.workers.dev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaseId, fileUrl, language })
    });

    const raw = await cfRes.text();
    let cfJson = null;
    try { cfJson = JSON.parse(raw); } catch { /* fall-through */ }

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
      const meta = (cfJson.scan_full || cfJson)?.meta || {};
      const clausesLen = ((cfJson.scan_full || cfJson)?.clauses || []).length;
      const riskScore = (cfJson.scan_full || cfJson)?.risk_score;
      console.log('SCAN_CF_V1_METRICS', {
        leaseId,
        scanId: targetScan.id,
        text_length: meta.text_length ?? null,
        chunks: meta.chunks ?? null,
        clauses: clausesLen,
        risk_score: riskScore ?? null
      });

      // Return normalized success/failure envelope
      if (cfJson.ok === false) {
        const { step, error_code, message } = cfJson;
        return new Response(JSON.stringify({ ok: false, scanId: targetScan.id, leaseId, step, error_code, message }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        });
      }

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