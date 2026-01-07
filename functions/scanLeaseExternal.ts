import { scanViaCloudflare } from '../components/shared/cloudflareScanClient.js';

function generateScanId() {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `scan-${Date.now()}-${rnd}`;
}

Deno.serve(async (req) => {
  try {
    const headers = req.headers || new Headers();
    const auth = headers.get('authorization') || headers.get('Authorization') || '';
    const bearer = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;

    const body = await req.json().catch(() => ({}));
    const { leaseId = null, fileUrl = null, language = null, jwt: jwtFromBody = null } = body || {};

    const jwt = bearer || jwtFromBody || null;

    const cfRes = await scanViaCloudflare({ leaseId, fileUrl, language, jwt });

    const resolvedLeaseId = cfRes?.leaseId ?? leaseId ?? null;
    const resolvedScanId = cfRes?.scanId ?? cfRes?.id ?? generateScanId();

    if (cfRes && cfRes.ok === true) {
      const scan_full = cfRes.scan_full ?? cfRes.scan ?? cfRes;
      return Response.json({
        ok: true,
        scanId: resolvedScanId,
        leaseId: resolvedLeaseId,
        scan_full
      }, { status: 200 });
    }

    // Normalize failure shape
    return Response.json({
      ok: false,
      step: cfRes?.step || 'CLOUDFLARE_CALL',
      error_code: cfRes?.error_code || 'UNKNOWN',
      message: cfRes?.message || cfRes?.error || 'Cloudflare scan failed',
      retryable: typeof cfRes?.retryable === 'boolean' ? cfRes.retryable : true,
      debugLog: cfRes?.debugLog || null,
      scanId: resolvedScanId,
      leaseId: resolvedLeaseId
    }, { status: 200 });
  } catch (e) {
    // Unexpected crash: still return 200 with normalized failure
    return Response.json({
      ok: false,
      step: 'CLOUDFLARE_CALL',
      error_code: 'CLOUDFLARE_UNREACHABLE',
      message: 'Cloudflare scan failed',
      retryable: true,
      debugLog: { cause: String(e?.message || e), stack: e?.stack || null },
      scanId: generateScanId(),
      leaseId: null
    }, { status: 200 });
  }
});