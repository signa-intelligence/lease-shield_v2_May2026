import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'admin only' }, { status: 403 });
  
  const svc = base44.asServiceRole;
  
  // Backfill owner_email on ALL LeaseScan records that are missing it
  const allLeases = await svc.entities.Lease.list('-created_date', 100);
  let fixed = 0;
  
  for (const lease of allLeases) {
    if (!lease.owner_email) continue;
    const scans = await svc.entities.LeaseScan.filter({ lease_id: lease.id });
    for (const scan of scans) {
      if (!scan.owner_email) {
        await svc.entities.LeaseScan.update(scan.id, { owner_email: lease.owner_email });
        fixed++;
      }
    }
  }
  
  // Verify pamperme specifically
  const pampermeLeases = await svc.entities.Lease.filter({ owner_email: "pamperme@editionsalon.com" });
  const pampermeScans = [];
  for (const l of pampermeLeases) {
    const scans = await svc.entities.LeaseScan.filter({ lease_id: l.id });
    pampermeScans.push(...scans.map(s => ({ id: s.id, owner_email: s.owner_email, created_by: s.created_by, status: s.status })));
  }
  
  return Response.json({
    total_scans_fixed: fixed,
    pamperme_leases: pampermeLeases.length,
    pamperme_scans: pampermeScans
  });
});