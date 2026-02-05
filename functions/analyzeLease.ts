Deno.serve(async (req) => {
  console.error('═══════════════════════════════════════════════════════');
  console.error('🎉 BRAND NEW FUNCTION CREATED 🎉');
  console.error('TIMESTAMP:', new Date().toISOString());
  console.error('═══════════════════════════════════════════════════════');
  
  return new Response(JSON.stringify({
    ok: true,
    message: 'New function works - cache cleared'
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});