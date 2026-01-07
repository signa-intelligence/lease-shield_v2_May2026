export const CLOUDFLARE_URL = "https://lease-scan-worker-01.steve-l.workers.dev";


export async function scanViaCloudflare({ leaseId, fileUrl, language, jwt }) {
  try {
    const res = await fetch(CLOUDFLARE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      },
      body: JSON.stringify({
        leaseId: leaseId ?? null,
        fileUrl: fileUrl ?? null,
        language: language ?? null,
      }),
    });


    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return {
        ok: false,
        step: "CLOUDFLARE_BAD_RESPONSE",
        error_code: "NON_JSON_RESPONSE",
        message: "Cloudflare returned non-JSON",
        retryable: true,
        debugLog: { status: res.status, bodyPreview: text.slice(0, 300) },
      };
    }
  } catch (err) {
    return {
      ok: false,
      step: "CLOUDFLARE_UNREACHABLE",
      error_code: "NETWORK_ERROR",
      message: String(err?.message || err),
      retryable: true,
    };
  }
}