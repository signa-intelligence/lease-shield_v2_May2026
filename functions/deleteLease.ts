import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Permanently deletes a lease and all related records
 * Hard delete - removes everything from database
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
    
    console.log(`[${correlationId}] Permanently deleting lease`, {
      leaseId,
      userEmail: user.email
    });

    if (!leaseId) {
      return Response.json({ 
        error: 'Missing leaseId'
      }, { status: 400 });
    }

    // Delete related deposit trackers
    const deposits = await base44.entities.DepositTracker.filter({
      lease_id: leaseId
    });
    
    for (const deposit of deposits) {
      await base44.entities.DepositTracker.delete(deposit.id);
    }

    // Delete related maintenance requests
    const maintenanceRequests = await base44.entities.MaintenanceRequest.filter({
      lease_id: leaseId
    });
    
    for (const request of maintenanceRequests) {
      await base44.entities.MaintenanceRequest.delete(request.id);
    }

    // Delete related timeline events
    const timelineEvents = await base44.entities.TimelineEvent.filter({
      lease_id: leaseId
    });
    
    for (const event of timelineEvents) {
      await base44.entities.TimelineEvent.delete(event.id);
    }

    // Delete related lease scans
    const leaseScans = await base44.entities.LeaseScan.filter({
      lease_id: leaseId
    });
    
    for (const scan of leaseScans) {
      await base44.entities.LeaseScan.delete(scan.id);
    }

    // Finally, delete the lease itself
    await base44.entities.Lease.delete(leaseId);

    console.log(`[${correlationId}] Successfully deleted lease and related records`, {
      deposits: deposits.length,
      maintenance: maintenanceRequests.length,
      timeline: timelineEvents.length,
      scans: leaseScans.length
    });

    return Response.json({
      success: true,
      deleted: {
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