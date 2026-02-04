import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Soft-deletes a lease by moving it and all related records to RecycleBin
 * Allows for potential recovery within 30 days
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

    // Move lease to RecycleBin - use lease owner's email for RLS
    const leaseOwnerEmail = lease.data?.owner_email || lease.owner_email || user.email;
    await base44.entities.RecycleBin.create({
      user_email: leaseOwnerEmail,
      item_type: 'lease',
      original_id: lease.id,
      item_snapshot: lease.data || lease,
      item_label: (lease.data?.property_address || lease.property_address) || `Lease ${lease.id.slice(0, 8)}`,
      deleted_date: new Date().toISOString()
    });

    // Get and soft-delete related deposit trackers (by lease_id AND property_address)
    const depositsByLeaseId = await base44.entities.DepositTracker.filter({ lease_id: leaseId });
    const depositsByAddress = lease.property_address 
      ? await base44.entities.DepositTracker.filter({ property_address: lease.property_address })
      : [];

    // Deduplicate deposits
    const allDeposits = [...depositsByLeaseId, ...depositsByAddress].filter((v, i, a) => 
      a.findIndex(t => t.id === v.id) === i
    );

    for (const deposit of allDeposits) {
      const depositOwnerEmail = deposit.data?.owner_email || deposit.owner_email || user.email;
      await base44.entities.RecycleBin.create({
        user_email: depositOwnerEmail,
        item_type: 'deposit',
        original_id: deposit.id,
        item_snapshot: deposit.data || deposit,
        item_label: `Deposit - ${(deposit.data?.property_address || deposit.property_address) || 'Unknown'}`,
        deleted_date: new Date().toISOString()
      });
      // Soft delete: set is_archived flag
      await svc.entities.DepositTracker.update(deposit.id, {
        is_archived: true,
        archived_at: new Date().toISOString()
      });
    }

    // Get and soft-delete related maintenance requests
    const maintenanceRequests = await base44.entities.MaintenanceRequest.filter({
      lease_id: leaseId
    });

    for (const request of maintenanceRequests) {
      const requestOwnerEmail = request.data?.created_by || request.created_by || user.email;
      await base44.entities.RecycleBin.create({
        user_email: requestOwnerEmail,
        item_type: 'maintenance',
        original_id: request.id,
        item_snapshot: request.data || request,
        item_label: (request.data?.issue_title || request.issue_title) || `Maintenance ${request.id.slice(0, 8)}`,
        deleted_date: new Date().toISOString()
      });
      // Soft delete: set is_archived flag
      await svc.entities.MaintenanceRequest.update(request.id, {
        is_archived: true,
        archived_at: new Date().toISOString()
      });
    }

    // Soft-delete related timeline events (by lease_id AND property_address)
    const timelineByLeaseId = await base44.entities.TimelineEvent.filter({ lease_id: leaseId });
    const timelineByAddress = lease.property_address
      ? await base44.entities.TimelineEvent.filter({ property_address: lease.property_address })
      : [];

    // Deduplicate events
    const allTimelineEvents = [...timelineByLeaseId, ...timelineByAddress].filter((v, i, a) => 
      a.findIndex(t => t.id === v.id) === i
    );

    for (const event of allTimelineEvents) {
      // Soft delete: set is_archived flag
      await svc.entities.TimelineEvent.update(event.id, {
        is_archived: true,
        archived_at: new Date().toISOString()
      });
    }

    // Archive related lease scans (preserve data for reports but hide from UI)
    const leaseScans = await base44.entities.LeaseScan.filter({
      lease_id: leaseId
    });

    for (const scan of leaseScans) {
      await svc.entities.LeaseScan.update(scan.id, {
        status: 'archived',
        is_archived: true,
        archived_at: new Date().toISOString()
      });
    }

    // Soft-delete the lease itself by setting status to "deleted" (use service role here)
    await svc.entities.Lease.update(leaseId, {
      status: 'deleted',
      archived_at: new Date().toISOString(),
      archived_by: user.email
    });

    // NOTE: Credits are NOT refunded on deletion per business rules
    // Credits are permanently consumed when a lease is scanned
    console.log(`[${correlationId}] Lease soft-deleted (credits not refunded per policy)`);

    console.log(`[${correlationId}] Successfully moved lease to RecycleBin`, {
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
    console.error(`[${correlationId}] Delete lease error:`, {
      error: error.message,
      stack: error.stack
    });
    
    return Response.json({
      success: false,
      error: error.message,
      correlationId
    }, { status: 500 });
  }
});