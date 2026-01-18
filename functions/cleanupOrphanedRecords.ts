import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Cleans up orphaned records that reference deleted leases
 * Removes: TimelineEvents, DepositTrackers, MaintenanceRequests, LeaseScans
 */
Deno.serve(async (req) => {
  const correlationId = `cleanup-${Date.now()}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use service role for cleanup operations
    const svc = base44.asServiceRole || base44;
    
    console.log(`[${correlationId}] Starting orphan cleanup for user:`, user.email);
    
    // Get all valid lease IDs for this user
    const allLeases = await svc.entities.Lease.filter({ created_by: user.email });
    const validLeaseIds = new Set(allLeases.map(l => l.id));
    
    console.log(`[${correlationId}] Found ${validLeaseIds.size} valid leases`);
    
    let cleaned = {
      timelineEvents: 0,
      depositTrackers: 0,
      maintenanceRequests: 0,
      leaseScans: 0
    };
    
    // Clean TimelineEvents
    const timelineEvents = await svc.entities.TimelineEvent.filter({ created_by: user.email });
    for (const event of timelineEvents) {
      if (event.lease_id && !validLeaseIds.has(event.lease_id)) {
        await svc.entities.TimelineEvent.delete(event.id);
        cleaned.timelineEvents++;
        console.log(`[${correlationId}] Deleted orphaned TimelineEvent:`, event.id);
      }
    }
    
    // Clean DepositTrackers
    const deposits = await svc.entities.DepositTracker.filter({ created_by: user.email });
    for (const deposit of deposits) {
      if (deposit.lease_id && !validLeaseIds.has(deposit.lease_id)) {
        await svc.entities.DepositTracker.delete(deposit.id);
        cleaned.depositTrackers++;
        console.log(`[${correlationId}] Deleted orphaned DepositTracker:`, deposit.id);
      }
    }
    
    // Clean MaintenanceRequests
    const maintenance = await svc.entities.MaintenanceRequest.filter({ created_by: user.email });
    for (const request of maintenance) {
      if (request.lease_id && !validLeaseIds.has(request.lease_id)) {
        await svc.entities.MaintenanceRequest.delete(request.id);
        cleaned.maintenanceRequests++;
        console.log(`[${correlationId}] Deleted orphaned MaintenanceRequest:`, request.id);
      }
    }
    
    // Clean LeaseScans
    const scans = await svc.entities.LeaseScan.filter({ created_by: user.email });
    for (const scan of scans) {
      if (scan.lease_id && !validLeaseIds.has(scan.lease_id)) {
        await svc.entities.LeaseScan.delete(scan.id);
        cleaned.leaseScans++;
        console.log(`[${correlationId}] Deleted orphaned LeaseScan:`, scan.id);
      }
    }
    
    const totalCleaned = cleaned.timelineEvents + cleaned.depositTrackers + 
                         cleaned.maintenanceRequests + cleaned.leaseScans;
    
    console.log(`[${correlationId}] Cleanup complete:`, cleaned);
    
    return Response.json({ 
      success: true,
      cleaned,
      totalCleaned,
      correlationId
    });
    
  } catch (error) {
    console.error(`[${correlationId}] Cleanup error:`, error.message, error.stack);
    return Response.json({ 
      success: false, 
      error: error.message,
      correlationId
    }, { status: 500 });
  }
});