// CORS utilities - strict allowlist

const ALLOWED_ORIGINS = [
  'https://app.leaseshield.asia',
  'http://localhost:5173',
  'http://localhost:3000'
];

function isAllowedOrigin(origin) {
  if (!origin) return true; // Non-browser (e.g., Stripe) calls
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow Base44 preview subdomains
  try {
    const url = new URL(origin);
    if (url.hostname.endsWith('.base44.app')) return true;
  } catch (_) {}
  return false;
}

function buildCorsHeaders(origin) {
  const headers = new Headers();
  headers.set('Vary', 'Origin');
  if (origin && isAllowedOrigin(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Recent-Auth');
  headers.set('Access-Control-Max-Age', '600');
  return headers;
}

export function handleCors(req) {
  const origin = req.headers.get('origin') || '';
  const method = req.method.toUpperCase();
  const headers = buildCorsHeaders(origin);

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  return null;
}

export function ensureAllowedOrigin(req) {
  const origin = req.headers.get('origin') || '';
  const allowed = isAllowedOrigin(origin);
  const requestId = crypto.randomUUID().slice(0, 8);
  return { allowed, origin, requestId };
}

export function corsJson(req, payload, status = 200) {
  const origin = req.headers.get('origin') || '';
  const headers = buildCorsHeaders(origin);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(payload), { status, headers });
}