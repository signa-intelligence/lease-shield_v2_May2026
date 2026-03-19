// DEPRECATED - Templates now use client-side copy/PDF generation
// This function is disabled to prevent any storage-based downloads

Deno.serve(async (req) => {
  return Response.json({
    error: true,
    code: 'DEPRECATED',
    message: 'Template downloads have been moved to client-side. Use the Templates page to view, copy, or generate PDF.'
  }, { 
    status: 410,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
});