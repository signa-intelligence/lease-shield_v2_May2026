import { scanViaCloudflare } from '../components/shared/cloudflareScanClient.js';

Deno.serve(async (req) => {
  const headers = req.headers || new Headers();
  const auth = headers.get('authorization') || headers.get('Authorization') || '';
  const bearer = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;

  const body = await req.json().catch(() => ({}));
  const { leaseId = null, fileUrl = null, language = null, jwt: jwtFromBody = null } = body || {};

  const jwt = bearer || jwtFromBody || null;

  try {
    console.log("SCANLEASEEXTERNAL_CALLED", { leaseId, hasFileUrl: !!fileUrl, hasJwt: !!jwt });
    const cfRes = await scanViaCloudflare({ leaseId, fileUrl, language, jwt });
    return Response.json(cfRes, { status: 200 });
  } catch (e) {
    return Response.json(e, { status: 200 });
  }
});