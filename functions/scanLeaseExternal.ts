Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { leaseId = null, fileUrl = null, language = null } = body || {};

    // Scaffold only – no external calls or DB writes
    return Response.json(
      {
        ok: false,
        step: "STUB",
        message: "Cloudflare scanner not connected",
        leaseId,
        fileUrl,
        language,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        step: "STUB",
        message: error?.message || String(error),
      },
      { status: 200 }
    );
  }
});