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
    
    // Clean TimelineEvents (orphans)
    const timelineEvents = await svc.entities.TimelineEvent.filter({ created_by: user.email });
    for (const event of timelineEvents) {
      if (event.lease_id && !validLeaseIds.has(event.lease_id)) {
        await svc.entities.TimelineEvent.delete(event.id);
        cleaned.timelineEvents++;
        console.log(`[${correlationId}] Deleted orphaned TimelineEvent:`, event.id);
      }
    }
    
    // Clean duplicate maintenance timeline events
    console.log(`[${correlationId}] 🔍 Checking maintenance timeline duplicates...`);
    const maintenanceEvents = timelineEvents.filter(e => 
      e.event_type && (
        e.event_type.includes('maintenance') || 
        e.event_type === 'maintenance_reported' ||
        e.event_type === 'maintenance_followup_due' ||
        e.event_type === 'maintenance_closed'
      )
    );
    
    // Group by: lease_id + title + event_date (date part only)
    const duplicateGroups = {};
    for (const event of maintenanceEvents) {
      const dateKey = event.event_date ? event.event_date.split('T')[0] : 'no-date';
      const key = `${event.lease_id || 'no-lease'}|${event.title || 'no-title'}|${dateKey}`;
      if (!duplicateGroups[key]) {
        duplicateGroups[key] = [];
      }
      duplicateGroups[key].push(event);
    }
    
    console.log(`[${correlationId}] Found groups:`, Object.keys(duplicateGroups).length);
    
    // Find and delete duplicates (keep oldest by created_date)
    const idsToDelete = [];
    for (const key of Object.keys(duplicateGroups)) {
      const group = duplicateGroups[key];
      if (group.length > 1) {
        // Sort by created_date ascending, keep first (oldest)
        group.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        // Delete all except the first one
        for (let i = 1; i < group.length; i++) {
          idsToDelete.push(group[i].id);
        }
      }
    }
    
    console.log(`[${correlationId}] Deleting duplicate IDs:`, idsToDelete);
    
    for (const id of idsToDelete) {
      await svc.entities.TimelineEvent.delete(id);
      cleaned.timelineEvents++;
      console.log(`[${correlationId}] Deleted duplicate maintenance TimelineEvent:`, id);
    }
    
    console.log(`[${correlationId}] ✅ Removed ${idsToDelete.length} duplicate maintenance events`);
    
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