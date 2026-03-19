// Simple ping function to verify deployment is working
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  return Response.json({
    ok: true,
    function_name: 'pingV1',
    timestamp: new Date().toISOString(),
    message: 'Deployment verified - function is live'
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
});