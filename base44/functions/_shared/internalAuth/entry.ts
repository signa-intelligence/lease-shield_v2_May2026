// Reserved. Internal-secret guard is inlined in each function (no cross-file imports allowed).
Deno.serve(async (_req) => {
  return Response.json({ ok: true, note: 'reserved' });
});