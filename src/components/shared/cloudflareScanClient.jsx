// Cloudflare Scan Client
// Calls the real Worker endpoint and safely returns its JSON response.

const CLOUDFLARE_URL = "https://lease-scan-worker-01.steve-l.workers.dev";

export async function scanViaCloudflare({ leaseId, fileUrl, language, jwt }) {
  try {
    const resp = await fetch(CLOUDFLARE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(jwt ? { "Authorization": `Bearer ${jwt}` } : {})
      },
      body: JSON.stringify({
        leaseId: leaseId ?? null,
        fileUrl: fileUrl ?? null,
        language: language ?? null
      })
    });

    // Try JSON; if this fails, treat as unreachable/non-JSON per contract
    try {
      return await resp.json();
    } catch (e) {
      return {
        ok: false,
        step: "CLOUDFLARE_CALL",
        error_code: "CLOUDFLARE_UNREACHABLE",
        message: "Cloudflare scan failed",
        retryable: true,
        debugLog: { cause: String(e?.message || e) }
      };
    }
  } catch (err) {
    return {
      ok: false,
      step: "CLOUDFLARE_CALL",
      error_code: "CLOUDFLARE_UNREACHABLE",
      message: "Cloudflare scan failed",
      retryable: true,
      debugLog: { cause: String(err?.message || err) }
    };
  }
}