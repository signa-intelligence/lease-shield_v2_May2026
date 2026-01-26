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
    await svc.entities.RecycleBin.create({
      user_email: user.email,
      item_type: 'lease',
      original_id: lease.id,
      item_snapshot: lease,
      item_label: lease.property_address || `Lease ${lease.id.slice(0, 8)}`,
      deleted_date: new Date().toISOString()
    });

    // Get and move related deposit trackers
    const deposits = await base44.entities.DepositTracker.filter({
      lease_id: leaseId
    });
    
    for (const deposit of deposits) {
      await svc.entities.RecycleBin.create({
        user_email: user.email,
        item_type: 'deposit',
        original_id: deposit.id,
        item_snapshot: deposit,
        item_label: `Deposit - ${deposit.property_address || 'Unknown'}`,
        deleted_date: new Date().toISOString()
      });
      await svc.entities.DepositTracker.delete(deposit.id);
    }

    // Get and move related maintenance requests
    const maintenanceRequests = await base44.entities.MaintenanceRequest.filter({
      lease_id: leaseId
    });
    
    for (const request of maintenanceRequests) {
      await svc.entities.RecycleBin.create({
        user_email: user.email,
        item_type: 'maintenance',
        original_id: request.id,
        item_snapshot: request,
        item_label: request.issue_title || `Maintenance ${request.id.slice(0, 8)}`,
        deleted_date: new Date().toISOString()
      });
      await svc.entities.MaintenanceRequest.delete(request.id);
    }

    // Delete related timeline events (no need to save to RecycleBin - auto-generated)
    const timelineEvents = await base44.entities.TimelineEvent.filter({
      lease_id: leaseId
    });
    
    for (const event of timelineEvents) {
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
      deposits: deposits.length,
      maintenance: maintenanceRequests.length,
      timeline: timelineEvents.length,
      scans: leaseScans.length
    });

    return Response.json({
      success: true,
      deleted: {
        lease: 1,
        deposits: deposits.length,
        maintenance: maintenanceRequests.length,
        timeline: timelineEvents.length,
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