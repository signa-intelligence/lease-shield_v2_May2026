import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const svc = base44.asServiceRole;
  
  // Fix: Backfill created_by on pamperme's leases and scans
  const leases = await svc.entities.Lease.filter({ owner_email: "pamperme@editionsalon.com" });
  const fixedLeases = [];
  
  for (const lease of leases) {
    if (!lease.created_by || lease.created_by === '') {
      await svc.entities.Lease.update(lease.id, { created_by: "pamperme@editionsalon.com" });
      fixedLeases.push(lease.id);
    }
    
    // Also fix scans for this lease
    const scans = await svc.entities.LeaseScan.filter({ lease_id: lease.id });
    for (const scan of scans) {
      if (!scan.created_by || scan.created_by === '') {
        await svc.entities.LeaseScan.update(scan.id, { created_by: "pamperme@editionsalon.com" });
        fixedLeases.push(`scan:${scan.id}`);
      }
    }
  }
  
  // Verify fix
  const verifyLeases = await svc.entities.Lease.filter({ owner_email: "pamperme@editionsalon.com" });
  
  return Response.json({
    fixed: fixedLeases,
    verify: verifyLeases.map(l => ({ 
      id: l.id, 
      owner_email: l.owner_email, 
      created_by: l.created_by || "STILL_NULL",
      status: l.status 
    }))
  });
});