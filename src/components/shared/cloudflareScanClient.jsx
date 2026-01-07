// Cloudflare Scan Client
// Raw URL only (no markdown):
export const CLOUDFLARE_URL = 'https://lease-scan-worker-01.steve-l.workers.dev';

/**
 * Call Cloudflare worker with safe parsing.
 * @param {{leaseId:string, fileUrl:string, language?:string}} payload
 * @param {string} [jwt] optional bearer token
 * @returns {{ok:boolean} & Record<string, any>}
 */
export async function callCloudflareScan(payload, jwt) {
  const headers = { 'Content-Type': 'application/json' };
  if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

  const res = await fetch(CLOUDFLARE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  const bodyPreview = text.slice(0, 300);
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return {
      ok: false,
      step: 'WORKER_RESPONSE',
      error_code: 'NON_JSON',
      message: 'Worker returned non-JSON',
      status: res.status,
      bodyPreview
    };
  }
  // Include preview on failures for debugging
  if (json && json.ok === false) {
    json.bodyPreview = bodyPreview;
    json.status = res.status;
  }
  return json;
}