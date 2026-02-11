import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  const svc = base44.asServiceRole;
  
  // Service role: 3 leases found. Now check created_by field
  const leases = await svc.entities.Lease.filter({ owner_email: "pamperme@editionsalon.com" }, '-created_date', 5);
  
  return Response.json({
    caller: user?.email,
    count: leases.length,
    leases_detail: leases.map(l => ({
      id: l.id,
      owner_email: l.owner_email,
      created_by: l.created_by || "FIELD_IS_NULL",
      status: l.status,
      created_date: l.created_date
    }))
  });
});