import { scanViaCloudflare } from "../components/shared/cloudflareScanClient.js";


Deno.serve(async (req) => {
  try {
    const headers = req.headers || new Headers();
    const auth = headers.get("authorization") || headers.get("Authorization") || "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;


    const body = await req.json().catch(() => ({}));
    const { leaseId = null, fileUrl = null, language = null, jwt: jwtFromBody = null } = body || {};
    const jwt = bearer || jwtFromBody || null;


    console.log("SCANLEASEEXTERNAL_INVOKED", {
      leaseId,
      hasFileUrl: !!fileUrl,
      hasJwt: !!jwt,
    });


    const result = await scanViaCloudflare({ leaseId, fileUrl, language, jwt });


    console.log("SCANLEASEEXTERNAL_RESULT", result);


    return Response.json(result, { status: 200 });
  } catch (e) {
    console.error("SCANLEASEEXTERNAL_FATAL", e);
    return Response.json({
      ok: false,
      step: "FUNCTION_CRASH",
      error_code: "UNHANDLED_EXCEPTION",
      message: String(e?.message || e),
      retryable: false,
    }, { status: 200 });
  }
});