Deno.serve(async (req) => {
  try {
    const headers = req.headers || new Headers();
    const region =
      headers.get("x-forwarded-region") ||
      headers.get("fly-region") ||
      headers.get("x-edge-region") ||
      headers.get("x-region") ||
      headers.get("cf-ray") ||
      headers.get("x-vercel-id") ||
      null;

    return Response.json(
      {
        ok: true,
        ts: new Date().toISOString(),
        region,
        version: "ping-v1",
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error?.message || String(error),
        version: "ping-v1",
      },
      { status: 200 }
    );
  }
});