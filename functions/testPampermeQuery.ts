import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  // Test 1: Service role - bypasses RLS
  const svc = base44.asServiceRole;
  const svcLeases = await svc.entities.Lease.filter({ owner_email: "pamperme@editionsalon.com" }, '-created_date', 5);
  
  // Test 2: User-scoped (uses RLS) - this is what the frontend does
  // caller is steve (admin), so RLS admin condition should pass
  const userLeases = await base44.entities.Lease.filter({ owner_email: "pamperme@editionsalon.com" }, '-created_date', 5);
  
  // Test 3: Also check LeaseScan RLS  
  const svcScans = await svc.entities.LeaseScan.filter({ lease_id: svcLeases[0]?.id });
  
  return Response.json({
    caller: { email: user?.email, role: user?.role },
    svc_count: svcLeases.length,
    svc_created_by: svcLeases.map(l => ({ id: l.id, created_by: l.created_by || "NULL", owner_email: l.owner_email })),
    user_scoped_count: userLeases.length,
    user_scoped_ids: userLeases.map(l => l.id),
    scans: svcScans.map(s => ({ id: s.id, lease_id: s.lease_id, created_by: s.created_by || "NULL", status: s.status }))
  });
});