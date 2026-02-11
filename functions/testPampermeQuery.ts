import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const svc = base44.asServiceRole;

    // Service role: find ALL leases for pamperme (bypasses RLS)
    const svcLeases = await svc.entities.Lease.filter({ owner_email: "pamperme@editionsalon.com" });

    return Response.json({
      caller: { email: user?.email, role: user?.role },
      svc_leases_count: svcLeases.length,
      svc_leases: svcLeases.map(l => ({
        id: l.id,
        owner_email: l.owner_email,
        created_by: l.created_by,
        status: l.status,
        file_url: l.file_url ? l.file_url.substring(0, 60) : null
      }))
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});