import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  const svc = base44.asServiceRole;
  const leases = await svc.entities.Lease.filter({ owner_email: "pamperme@editionsalon.com" }, '-created_date', 5);
  return Response.json({
    caller: user?.email,
    count: leases.length,
    leases: leases.map(l => ({ id: l.id, owner_email: l.owner_email, created_by: l.created_by, status: l.status }))
  });
});