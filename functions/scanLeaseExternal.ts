import { scanViaCloudflare, CLOUDFLARE_URL } from '../components/shared/cloudflareScanClient.js';

Deno.serve(async (req) => {
  const headers = req.headers || new Headers();
  const auth = headers.get('authorization') || headers.get('Authorization') || '';
  const bearer = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;

  console.log("SCANLEASEEXTERNAL_REQ", {
    method: req.method,
    hasAuth: !!auth,
    origin: headers.get('origin')
  });

  const body = await req.json().catch(() => ({}));
  console.log("SCANLEASEEXTERNAL_BODY_KEYS", { bodyKeys: Object.keys(body || {}) });
  const { leaseId = null, fileUrl = null, language = null, jwt: jwtFromBody = null } = body || {};

  const jwt = bearer || jwtFromBody || null;

  try {
    console.log("SCANLEASEEXTERNAL_CALLED", { leaseId, hasFileUrl: !!fileUrl, hasJwt: !!jwt, cloudflareUrl: CLOUDFLARE_URL });
    const cfRes = await scanViaCloudflare({ leaseId, fileUrl, language, jwt });
    console.log("SCANLEASEEXTERNAL_CF_RESPONSE", {
      ok: cfRes.ok,
      step: cfRes.step,
      error_code: cfRes.error_code,
      message: cfRes.message,
      debugLogStatus: cfRes.debugLog?.status,
      debugLogBodyPreview: cfRes.debugLog?.bodyPreview?.slice(0, 100)
    });
    return Response.json(cfRes, { status: 200 });
  } catch (e) {
    console.error("SCANLEASEEXTERNAL_HANDLER_ERROR", e);
    return Response.json({
      ok: false,
      step: "FUNCTION_HANDLER_CRASH",
      error_code: "INTERNAL_SERVER_ERROR",
      message: e.message || "An unexpected error occurred in scanLeaseExternal handler",
      debugLog: { error: String(e) }
    }, { status: 500 });
  }
});