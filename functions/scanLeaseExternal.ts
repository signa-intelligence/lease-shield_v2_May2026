import { scanViaCloudflare } from '../components/shared/cloudflareScanClient.js';

Deno.serve(async (req) => {
  try {
    const headers = req.headers || new Headers();
    const auth = headers.get('authorization') || headers.get('Authorization') || '';
    const bearer = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;

    const body = await req.json().catch(() => ({}));
    const { leaseId = null, fileUrl = null, language = null, jwt: jwtFromBody = null } = body || {};

    const jwt = bearer || jwtFromBody || null;

    const result = await scanViaCloudflare({ leaseId, fileUrl, language, jwt });

    return Response.json(result, { status: 200 });
  } catch (e) {
    return Response.json({
      ok: false,
      step: 'CLOUDFLARE_CALL',
      error_code: 'CLOUDFLARE_UNREACHABLE',
      message: 'Cloudflare scan failed',
      retryable: true,
      debugLog: {
        error: String(e?.message || e),
        stack: e?.stack || null,
      }
    }, { status: 200 });
  }
});