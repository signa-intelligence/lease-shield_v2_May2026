import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Soft-deletes a lease by archiving it and all related records
 * Sets status to 'deleted' and is_archived flags
 */
Deno.serve(async (req) => {
  const correlationId = `delete-lease-${Date.now()}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leaseId } = await req.json();
    
    console.log('[DELETE_LEASE_START]', { 
      leaseId,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    });
    
    console.log(`[${correlationId}] Soft-deleting lease and moving to RecycleBin`, {
      leaseId,
      userEmail: user.email
    });

    if (!leaseId) {
      return Response.json({ 
        error: 'Missing leaseId'
      }, { status: 400 });
    }

    // CRITICAL: Use service role for updates but user context for RecycleBin (RLS)
    const svc = base44.asServiceRole || base44;

    // Get the lease first
    const leaseArr = await base44.entities.Lease.filter({ id: leaseId });
    const lease = leaseArr?.[0];
    
    if (!lease) {
      return Response.json({ error: 'Lease not found' }, { status: 404 });
    }

    // Get and archive related deposit trackers (by lease_id AND property_address)
    const depositsByLeaseId = await svc.entities.DepositTracker.filter({ lease_id: leaseId });
    const depositsByAddress = lease.property_address 
      ? await svc.entities.DepositTracker.filter({ property_address: lease.property_address })
      : [];

    // Deduplicate deposits
    const allDeposits = [...depositsByLeaseId, ...depositsByAddress].filter((v, i, a) => 
      a.findIndex(t => t.id === v.id) === i
    );

    for (const deposit of allDeposits) {
      await svc.entities.DepositTracker.update(deposit.id, {
        is_archived: true,
        archived_at: new Date().toISOString()
      });
    }

    // Get and archive related maintenance requests
    const maintenanceRequests = await svc.entities.MaintenanceRequest.filter({
      lease_id: leaseId
    });

    for (const request of maintenanceRequests) {
      await svc.entities.MaintenanceRequest.update(request.id, {
        is_archived: true,
        archived_at: new Date().toISOString()
      });
    }

    // Archive related timeline events (by lease_id AND property_address)
    const timelineByLeaseId = await svc.entities.TimelineEvent.filter({ lease_id: leaseId });
    const timelineByAddress = lease.property_address
      ? await svc.entities.TimelineEvent.filter({ property_address: lease.property_address })
      : [];

    // Deduplicate events
    const allTimelineEvents = [...timelineByLeaseId, ...timelineByAddress].filter((v, i, a) => 
      a.findIndex(t => t.id === v.id) === i
    );

    for (const event of allTimelineEvents) {
      await svc.entities.TimelineEvent.update(event.id, {
        is_archived: true,
        archived_at: new Date().toISOString()
      });
    }

    // Archive related lease scans (preserve data for reports but hide from UI)
    const leaseScans = await svc.entities.LeaseScan.filter({
      lease_id: leaseId
    });

    for (const scan of leaseScans) {
      await svc.entities.LeaseScan.update(scan.id, {
        status: 'archived',
        is_archived: true,
        archived_at: new Date().toISOString()
      });
    }

    // Soft-delete the lease itself by setting status to "deleted"
    await svc.entities.Lease.update(leaseId, {
      status: 'deleted',
      archived_at: new Date().toISOString(),
      archived_by: user.email
    });

    // NOTE: Credits are NOT refunded on deletion per business rules
    // Credits are permanently consumed when a lease is scanned
    console.log(`[${correlationId}] Lease soft-deleted (credits not refunded per policy)`);

    console.log(`[${correlationId}] Successfully archived lease and related records`, {
      deposits: allDeposits.length,
      maintenance: maintenanceRequests.length,
      timeline: allTimelineEvents.length,
      scans: leaseScans.length
    });

    return Response.json({
      success: true,
      deleted: {
        lease: 1,
        deposits: allDeposits.length,
        maintenance: maintenanceRequests.length,
        timeline: allTimelineEvents.length,
        scans: leaseScans.length
      },
      correlationId
    });

  } catch (error) {
    console.error('[DELETE_LEASE_ERROR_DETAILED]', {
      correlationId,
      errorMessage: error.message,
      errorStack: error.stack,
      errorCode: error.code,
      errorName: error.name,
      fullError: String(error)
    });
    
    return Response.json({
      success: false,
      error: error.message,
      errorCode: error.code,
      errorName: error.name,
      correlationId
    }, { status: 500 });
  }
});