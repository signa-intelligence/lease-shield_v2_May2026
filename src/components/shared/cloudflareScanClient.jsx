// Cloudflare Scan Client (usable from frontend and backend)
// CORS note: If calling from the browser, your Cloudflare Worker must set appropriate CORS headers.

const CLOUDFLARE_BASE = 'https://<YOUR_CLOUDFLARE_DOMAIN>';
const SCAN_URL = `${CLOUDFLARE_BASE}/scan`;

const DEFAULT_TIMEOUT_MS = 20000; // 20s

async function safeParseJson(resp) {
  try {
    return await resp.json();
  } catch (_) {
    try {
      const text = await resp.text();
      return { ok: false, step: 'PARSE', message: 'Non-JSON response', raw: text };
    } catch (e) {
      return { ok: false, step: 'PARSE', message: String(e?.message || e) };
    }
  }
}

export async function scanViaCloudflare({ leaseId, fileUrl, language, jwt, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(SCAN_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(jwt ? { 'authorization': `Bearer ${jwt}` } : {}),
      },
      body: JSON.stringify({ leaseId, fileUrl, language }),
      signal: controller.signal,
    });

    clearTimeout(to);

    const data = await safeParseJson(resp);

    if (resp.ok && (data?.ok === true || (data?.scanId && (data?.scan_full || data?.scan)))) {
      return {
        ok: true,
        scanId: data?.scanId ?? data?.id ?? null,
        leaseId: data?.leaseId ?? leaseId ?? null,
        scan_full: data?.scan_full ?? data?.scan ?? data ?? null,
      };
    }

    return {
      ok: false,
      step: data?.step || 'CLOUDFLARE_CALL',
      message: data?.message || data?.error || 'Cloudflare scan failed',
      error_code: data?.error_code || `HTTP_${resp.status}`,
      retryable: typeof data?.retryable === 'boolean' ? data.retryable : true,
      debugLog: {
        status: resp.status,
        url: SCAN_URL,
        bodySent: { leaseId, hasFileUrl: !!fileUrl, language: language || null },
        raw: data,
      },
    };
  } catch (e) {
    clearTimeout(to);
    return {
      ok: false,
      step: 'CLOUDFLARE_CALL',
      error_code: 'CLOUDFLARE_UNREACHABLE',
      message: 'Cloudflare scan failed',
      retryable: true,
      debugLog: {
        url: SCAN_URL,
        error: String(e?.message || e),
        aborted: e?.name === 'AbortError',
        timeoutMs,
        bodySent: { leaseId, hasFileUrl: !!fileUrl, language: language || null },
      },
    };
  }
}