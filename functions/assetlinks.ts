/**
 * Digital Asset Links for Android TWA verification
 * MUST be reachable at: https://YOUR_DOMAIN/.well-known/assetlinks.json
 *
 * Goals:
 * - 200 OK
 * - Content-Type: application/json (not text/html)
 * - No redirects
 * - Correct JSON body
 * - No caching issues
 */

const ASSETLINKS_PATH = "/.well-known/assetlinks.json";

const ASSETLINKS_BODY = [
  {
    relation: [
      "delegate_permission/common.handle_all_urls",
      "delegate_permission/common.get_login_creds",
    ],
    target: {
      namespace: "android_app",
      package_name: "asia.leaseshield.app",
      sha256_cert_fingerprints: [
        "EC:1B:40:B9:09:33:0C:C4:AC:A4:67:1C:45:87:BD:B6:9F:5A:05:81:F0:E9:13:2C:1F:D1:97:1C:B2:69:CC:A6",
      ],
    },
  },
];

const JSON_STRING = JSON.stringify(ASSETLINKS_BODY, null, 2) + "\n";

function baseHeaders() {
  return new Headers({
    // MUST be JSON:
    "Content-Type": "application/json; charset=utf-8",

    // Avoid caching while testing:
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",

    // CORS is not required for Google, but harmless:
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",

    // Helps some proxies not to sniff:
    "X-Content-Type-Options": "nosniff",
  });
}

Deno.serve((req) => {
  const url = new URL(req.url);
  const headers = baseHeaders();

  // Serve ONLY the correct path. Everything else 404.
  if (url.pathname !== ASSETLINKS_PATH) {
    return new Response(
      JSON.stringify(
        {
          error: "Not Found",
          expected_path: ASSETLINKS_PATH,
          got_path: url.pathname,
        },
        null,
        2,
      ) + "\n",
      { status: 404, headers },
    );
  }

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  // Allow only GET (Google uses GET)
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify(
        { error: "Method Not Allowed", allowed: ["GET", "OPTIONS"] },
        null,
        2,
      ) + "\n",
      { status: 405, headers },
    );
  }

  // Success
  return new Response(JSON_STRING, { status: 200, headers });
});
