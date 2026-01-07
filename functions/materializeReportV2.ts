import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { scanId } = body || {};
    const requestId = crypto.randomUUID().slice(0,8);

    if (!scanId) {
      return Response.json({ ok: false, step: 'MATERIALIZE', error: 'MISSING_SCAN_ID', message: 'scanId is required' }, { status: 200 });
    }

    const scans = await base44.entities.LeaseScan.filter({ id: scanId });
    const scan = scans?.[0] || null;
    if (!scan) {
      return Response.json({ ok: false, step: 'MATERIALIZE', error: 'SCAN_NOT_FOUND', message: `No LeaseScan for ${scanId}` }, { status: 200 });
    }

    const scanFull = scan?.scan_full ?? null;
    const keys = scanFull ? Object.keys(scanFull) : [];
    console.log('[MATERIALIZE_V2] scan_full keys:', keys, { requestId, scanId });

    if (!scanFull) {
      return Response.json({ ok: false, step: 'MATERIALIZE', error: 'NO_SOURCE_DATA', message: 'scan_full missing' }, { status: 200 });
    }

    return Response.json({ ok: true, step: 'MATERIALIZE', scanId, scan_full: scanFull }, { status: 200 });
  } catch (e) {
    console.error('[MATERIALIZE_V2] PLATFORM_BUG', String(e));
    return Response.json({ ok: false, step: 'MATERIALIZE', error: 'PLATFORM_BUG', message: String(e?.message || e) }, { status: 200 });
  }
});