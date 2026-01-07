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

    const text = await res.text().catch(() => "");
    try {
      return JSON.parse(text);
    } catch {
      return {
        ok: false,
        step: "CLOUDFLARE_CALL",
        error_code: "CLOUDFLARE_BAD_RESPONSE",
        message: `Cloudflare returned non-JSON (HTTP ${res.status})`,
        retryable: res.status >= 500 || res.status === 429,
        debugLog: { status: res.status, bodyPreview: text.slice(0, 500) },
      };
    }
  } catch (err) {
    return {
      ok: false,
      step: "CLOUDFLARE_CALL",
      error_code: "CLOUDFLARE_UNREACHABLE",
      message: "Cloudflare scan failed",
      retryable: true,
      debugLog: { cause: String(err?.message || err) },
    };
  }
}

