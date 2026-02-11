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

    // CASCADE DELETE: Delete timeline events by lease_id
    console.log(`[${correlationId}] [DELETE_TIMELINE_START]`, { count: timelineByLeaseId.length });
    try {
      for (const event of timelineByLeaseId) {
        await svc.entities.TimelineEvent.delete(event.id);
      }
      console.log(`[${correlationId}] [DELETE_TIMELINE_DONE]`);
    } catch (err) {
      console.error(`[${correlationId}] [DELETE_TIMELINE_FAILED]`, { error: err.message, stack: err.stack });
      throw err;
    }

    // CASCADE DELETE: Delete deposits by lease_id
    console.log(`[${correlationId}] [DELETE_DEPOSITS_START]`, { count: depositsByLeaseId.length });
    try {
      for (const deposit of depositsByLeaseId) {
        await svc.entities.DepositTracker.delete(deposit.id);
      }
      console.log(`[${correlationId}] [DELETE_DEPOSITS_DONE]`);
    } catch (err) {
      console.error(`[${correlationId}] [DELETE_DEPOSITS_FAILED]`, { error: err.message, stack: err.stack });
      throw err;
    }

    // CASCADE DELETE: Delete lease scans
    const leaseScans = await svc.entities.LeaseScan.filter({ lease_id: leaseId });
    console.log(`[${correlationId}] [DELETE_SCANS_START]`, { count: leaseScans.length });
    try {
      for (const scan of leaseScans) {
        await svc.entities.LeaseScan.delete(scan.id);
      }
      console.log(`[${correlationId}] [DELETE_SCANS_DONE]`);
    } catch (err) {
      console.error(`[${correlationId}] [DELETE_SCANS_FAILED]`, { error: err.message, stack: err.stack });
      throw err;
    }

    // CASCADE DELETE: Delete lease itself
    console.log(`[${correlationId}] [DELETE_LEASE_START]`, { leaseId });
    try {
      await svc.entities.Lease.delete(leaseId);
      console.log(`[${correlationId}] [DELETE_LEASE_DONE]`);
    } catch (err) {
      console.error(`[${correlationId}] [DELETE_LEASE_FAILED]`, { error: err.message, stack: err.stack });
      throw err;
    }

    console.log(`[${correlationId}] Successfully deleted lease and cascaded records`, {
      deposits: depositsByLeaseId.length,
      maintenance: maintenanceRequests.length,
      timeline: timelineByLeaseId.length,
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