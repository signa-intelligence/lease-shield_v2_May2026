import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const correlationId = `clear-${Date.now()}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Unauthorized - admin access required' 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const bodyText = await req.text();
    const { email = null } = JSON.parse(bodyText || '{}');

    if (!email) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'email parameter is required' 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const svc = base44.asServiceRole;

    // Delete leases
    const leases = await svc.entities.Lease.filter({ owner_email: email });
    let deletedLeases = 0;
    for (const lease of leases) {
      await svc.entities.Lease.delete(lease.id);
      deletedLeases++;
    }

    // Delete lease scans
    const scans = await svc.entities.LeaseScan.filter({ created_by: email });
    let deletedScans = 0;
    for (const scan of scans) {
      await svc.entities.LeaseScan.delete(scan.id);
      deletedScans++;
    }

    // Delete cases (soft delete via is_deleted flag)
    const cases = await svc.entities.Case.filter({ created_by: email });
    let deletedCases = 0;
    for (const caseRecord of cases) {
      await svc.entities.Case.update(caseRecord.id, { is_deleted: true, deleted_at: new Date().toISOString() });
      deletedCases++;
    }

    // Delete deposits
    const deposits = await svc.entities.DepositTracker.filter({ owner_email: email });
    let deletedDeposits = 0;
    for (const deposit of deposits) {
      await svc.entities.DepositTracker.delete(deposit.id);
      deletedDeposits++;
    }

    // Delete maintenance requests
    const maintenance = await svc.entities.MaintenanceRequest.filter({ created_by: email });
    let deletedMaintenance = 0;
    for (const req of maintenance) {
      await svc.entities.MaintenanceRequest.delete(req.id);
      deletedMaintenance++;
    }

    // Delete timeline events
    const timeline = await svc.entities.TimelineEvent.filter({ owner_email: email });
    let deletedTimeline = 0;
    for (const event of timeline) {
      await svc.entities.TimelineEvent.delete(event.id);
      deletedTimeline++;
    }

    console.log('[CLEAR_USER_DATA_SUCCESS]', {
      correlationId,
      email,
      deletedLeases,
      deletedScans,
      deletedCases,
      deletedDeposits,
      deletedMaintenance,
      deletedTimeline
    });

    return new Response(JSON.stringify({
      ok: true,
      email,
      cleared: {
        leases: deletedLeases,
        scans: deletedScans,
        cases: deletedCases,
        deposits: deletedDeposits,
        maintenance: deletedMaintenance,
        timeline: deletedTimeline
      },
      correlationId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[CLEAR_USER_DATA_ERROR]', { error: String(error) });
    return new Response(JSON.stringify({ 
      ok: false, 
      error: String(error?.message || error) 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});