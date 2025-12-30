/**
 * Digital Asset Links file for Android Trusted Web Activity (TWA)
 * Serves /.well-known/assetlinks.json for app verification
 */

Deno.serve(async (req) => {
  // CORS headers for cross-origin requests
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  };

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Digital Asset Links JSON
  const assetlinks = [
    {
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "asia.leaseshield.app",
        "sha256_cert_fingerprints": [
          "EC:1B:40:B9:09:33:0C:C4:AC:A4:67:1C:45:87:BD:B6:9F:5A:05:81:F0:E9:13:2C:1F:D1:97:1C:B2:69:CC:A6"
        ]
      }
    }
  ];

  return new Response(JSON.stringify(assetlinks, null, 2), {
    status: 200,
    headers
  });
});