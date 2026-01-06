// Analysis Runtime Helpers (JS only)
// No throws from these helpers; always return values or rejected promises already handled by callers.

export function nowMs() { return Date.now(); }

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withTimeout(promise, ms, label) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`TIMEOUT_${label || 'op'}_${ms}`)), ms);
  });
  try {
    const res = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return res;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

export async function retry(fn, options) {
  const {
    retries = 2,
    baseDelayMs = 400,
    maxDelayMs = 2000,
    jitter = true,
  } = options || {};

  let attempt = 0;
  let lastError;
  while (attempt <= retries) {
    try {
      return await fn(attempt);
    } catch (e) {
      lastError = e;
      if (attempt === retries) break;
      const backoff = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      const wait = jitter ? Math.floor(backoff * (0.5 + Math.random() * 0.5)) : backoff;
      await sleep(wait);
      attempt += 1;
    }
  }
  throw lastError;
}

export function safeJsonParse(s) {
  try { return { ok: true, data: JSON.parse(s) }; }
  catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

export function redactSecrets(obj) {
  try {
    const json = JSON.stringify(obj, (k, v) => {
      if (typeof v === 'string' && /(key|secret|token|password)/i.test(k)) {
        return '***redacted***';
      }
      return v;
    });
    return JSON.parse(json);
  } catch { return null; }
}

export function classifyError(err) {
  const msg = String(err?.message || err || 'Unknown error');
  if (/timeout/i.test(msg)) return { kind: 'TIMEOUT', message: msg };
  if (/network/i.test(msg)) return { kind: 'NETWORK', message: msg };
  if (/http/i.test(msg)) return { kind: 'HTTP', message: msg };
  if (/llm|model|token/i.test(msg)) return { kind: 'LLM', message: msg };
  if (/pdf|font|jspdf/i.test(msg)) return { kind: 'PDF', message: msg };
  return { kind: 'UNKNOWN', message: msg };
}

export function stageLogPush(log, stage, extra) {
  try {
    const entry = { t: new Date().toISOString(), stage, ...(extra || {}) };
    (log || []).push(entry);
  } catch (_) {}
}

export function finalizeOk(payload, log) {
  return { ok: true, ...(payload || {}), debugLog: Array.isArray(log) ? log : [] };
}

export function finalizeFail(payload, log) {
  return { ok: false, ...(payload || {}), debugLog: Array.isArray(log) ? log : [] };
}