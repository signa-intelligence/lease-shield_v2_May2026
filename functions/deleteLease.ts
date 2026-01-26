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

    const svc = base44.asServiceRole || base44;

    // Get the lease first
    const leaseArr = await base44.entities.Lease.filter({ id: leaseId });
    const lease = leaseArr?.[0];
    
    if (!lease) {
      return Response.json({ error: 'Lease not found' }, { status: 404 });
    }

    // Move lease to RecycleBin
    const recycleLease = await svc.entities.RecycleBin.create({
      user_email: user.email,
      item_type: 'lease',
      original_id: lease.id,
      item_snapshot: lease,
      item_label: lease.original_filename || lease.property_address || `Lease ${lease.id.slice(0, 8)}`,
      deleted_date: new Date().toISOString()
    });
    console.log(`[${correlationId}] Lease moved to RecycleBin: ${recycleLease.id}`);

    // Get and move related deposit trackers (by lease_id AND property_address)
    const depositsByLeaseId = await base44.entities.DepositTracker.filter({ lease_id: leaseId });
    const depositsByAddress = lease.property_address 
      ? await base44.entities.DepositTracker.filter({ property_address: lease.property_address })
      : [];
    
    // Deduplicate deposits
    const allDeposits = [...depositsByLeaseId, ...depositsByAddress].filter((v, i, a) => 
      a.findIndex(t => t.id === v.id) === i
    );
    
    for (const deposit of allDeposits) {
      const recycleDeposit = await svc.entities.RecycleBin.create({
        user_email: user.email,
        item_type: 'deposit',
        original_id: deposit.id,
        item_snapshot: deposit,
        item_label: `Deposit - ${deposit.property_address || 'Unknown'}`,
        deleted_date: new Date().toISOString()
      });
      console.log(`[${correlationId}] DepositTracker moved to RecycleBin: ${recycleDeposit.id}`);
      await svc.entities.DepositTracker.delete(deposit.id);
    }

    // Get and move related maintenance requests
    const maintenanceRequests = await base44.entities.MaintenanceRequest.filter({
      lease_id: leaseId
    });
    
    for (const request of maintenanceRequests) {
      const recycleMaintenance = await svc.entities.RecycleBin.create({
        user_email: user.email,
        item_type: 'maintenance',
        original_id: request.id,
        item_snapshot: request,
        item_label: request.issue_title || `Maintenance ${request.id.slice(0, 8)}`,
        deleted_date: new Date().toISOString()
      });
      console.log(`[${correlationId}] MaintenanceRequest moved to RecycleBin: ${recycleMaintenance.id}`);
      await svc.entities.MaintenanceRequest.delete(request.id);
    }

    // Delete related timeline events (by lease_id AND property_address)
    const timelineByLeaseId = await base44.entities.TimelineEvent.filter({ lease_id: leaseId });
    const timelineByAddress = lease.property_address
      ? await base44.entities.TimelineEvent.filter({ property_address: lease.property_address })
      : [];
    
    // Deduplicate events
    const allTimelineEvents = [...timelineByLeaseId, ...timelineByAddress].filter((v, i, a) => 
      a.findIndex(t => t.id === v.id) === i
    );
    
    for (const event of allTimelineEvents) {
      await svc.entities.TimelineEvent.delete(event.id);
    }

    // Delete related lease scans (no need to save to RecycleBin - auto-generated)
    const leaseScans = await base44.entities.LeaseScan.filter({
      lease_id: leaseId
    });
    
    for (const scan of leaseScans) {
      await svc.entities.LeaseScan.delete(scan.id);
    }

    // Finally, delete the lease itself
    await svc.entities.Lease.delete(leaseId);

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