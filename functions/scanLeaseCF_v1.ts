import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const bodyText = await req.text();
    let payload = {};
    try { payload = JSON.parse(bodyText || '{}'); } catch (_) { payload = {}; }
    const { leaseId = null, fileUrl = null, language = null } = payload;

    console.log('SCAN_CF_V1_CALLED', { leaseId, fileUrl, language });

    const cfRes = await fetch('https://lease-scan-worker-01.steve-l.workers.dev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaseId, fileUrl, language })
    });

    const text = await cfRes.text();
    let cfJson;
    try { cfJson = JSON.parse(text); } catch { cfJson = null; }

    // Persist scan_full exactly as returned by Cloudflare (if JSON)
    try {
      const base44 = createClientFromRequest(req);
      if (leaseId && cfJson && typeof cfJson === 'object') {
        // Get latest LeaseScan for this lease
        let scans = await base44.entities.LeaseScan.filter({ lease_id: leaseId }, '-created_date', 1);
        const existing = scans?.[0] || null;
        if (existing) {
          await base44.entities.LeaseScan.update(existing.id, {
            scan_full: cfJson,
            status: 'ok'
          });
        } else {
          await base44.entities.LeaseScan.create({
            lease_id: leaseId,
            scan_full: cfJson,
            status: 'ok'
          });
        }
      }
    } catch (persistErr) {
      console.error('SCAN_CF_V1_PERSIST_ERROR', String(persistErr));
    }

    // Return Cloudflare response verbatim (JSON if possible, else raw text)
    if (cfJson) {
      return new Response(JSON.stringify(cfJson), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(text, { status: 200, headers: { 'Content-Type': cfRes.headers.get('content-type') || 'text/plain' } });
  } catch (e) {
    // Always 200 per contract
    return new Response(JSON.stringify({ ok: false, step: 'FUNCTION_CRASH', error_code: 'UNHANDLED_EXCEPTION', message: String(e?.message || e) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});