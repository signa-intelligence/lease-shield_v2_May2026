import { ensureAllowedOrigin, handleCors, corsJson } from './cors.js';

export { ensureAllowedOrigin, handleCors, corsJson };

export function ok(req, data, status = 200) {
  return corsJson(req, { data, requestId: crypto.randomUUID().slice(0, 8) }, status);
}

export function err(req, errorCode, message, status = 400, requestId) {
  const rid = requestId || crypto.randomUUID().slice(0, 8);
  return corsJson(req, { errorCode, message, requestId: rid }, status);
}

export function requireRecentAuth(req, maxAgeSec = 600) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return { ok: false, reason: 'NO_TOKEN' };
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { ok: false, reason: 'INVALID_JWT' };
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const now = Math.floor(Date.now() / 1000);
    const authTime = payload.auth_time || payload.iat || 0;
    if (!authTime) return { ok: false, reason: 'NO_AUTH_TIME' };
    const age = now - authTime;
    if (age > maxAgeSec) return { ok: false, reason: 'STALE_AUTH' };
    return { ok: true };
  } catch (_) {
    return { ok: false, reason: 'PARSE_ERROR' };
  }
}