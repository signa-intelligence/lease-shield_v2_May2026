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
    
    // Clean TimelineEvents (orphaned by lease)
    const timelineEvents = await svc.entities.TimelineEvent.filter({ created_by: user.email });
    for (const event of timelineEvents) {
      if (event.lease_id && !validLeaseIds.has(event.lease_id)) {
        await svc.entities.TimelineEvent.delete(event.id);
        cleaned.timelineEvents++;
        console.log(`[${correlationId}] Deleted orphaned TimelineEvent (bad lease):`, event.id);
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // ENHANCED: Two-pass maintenance timeline cleanup
    // ═══════════════════════════════════════════════════════════════════
    
    console.log(`[${correlationId}] 🔍 Step 1: Finding ALL maintenance timeline events`);
    
    // Re-fetch timeline events (some may have been deleted)
    const remainingEvents = await svc.entities.TimelineEvent.filter({ created_by: user.email });
    
    // Find ALL maintenance-related events (broader matching)
    const allMaintenanceEvents = remainingEvents.filter(e => {
      const eventType = (e.event_type || '').toLowerCase();
      const title = (e.title || '').toLowerCase();
      return eventType.includes('maintenance') || 
             eventType.includes('follow') ||
             title.includes('maintenance') ||
             title.includes('follow up');
    });
    
    console.log(`[${correlationId}] Total maintenance timeline events:`, allMaintenanceEvents.length);
    
    // Get all existing maintenance requests for this user
    const allMaintenanceRequests = await svc.entities.MaintenanceRequest.filter({ created_by: user.email });
    const validMaintenanceIds = new Set(allMaintenanceRequests.map(m => m.id));
    const maintenanceTitles = new Set(allMaintenanceRequests.map(m => m.issue_title?.toLowerCase()));
    
    console.log(`[${correlationId}] Valid maintenance requests:`, validMaintenanceIds.size);
    console.log(`[${correlationId}] Maintenance titles:`, [...maintenanceTitles]);
    
    // ═══════════════════════════════════════════════════════════════════
    // PASS 1: Remove orphaned maintenance events (no matching request)
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[${correlationId}] 🔍 Step 2: Checking for orphaned events`);
    
    const orphanedIds = [];
    for (const event of allMaintenanceEvents) {
      // Check if this event has a matching maintenance request
      const sourceId = event.source_id;
      const eventTitle = (event.title || '').toLowerCase();
      
      // Extract the issue title from event title (e.g., "Maintenance: Rain leaking" → "rain leaking")
      const extractedTitle = eventTitle
        .replace('maintenance:', '')
        .replace('follow up:', '')
        .trim();
      
      const hasMatchingRequest = 
        (sourceId && validMaintenanceIds.has(sourceId)) ||
        maintenanceTitles.has(extractedTitle);
      
      if (!hasMatchingRequest && allMaintenanceRequests.length === 0) {
        // No maintenance requests exist at all - these are orphans
        orphanedIds.push({ id: event.id, title: event.title, date: event.event_date });
      }
    }
    
    console.log(`[${correlationId}] Orphaned event IDs to delete:`, orphanedIds.map(o => o.title));
    
    for (const orphan of orphanedIds) {
      await svc.entities.TimelineEvent.delete(orphan.id);
      cleaned.timelineEvents++;
      console.log(`[${correlationId}] Deleted orphaned maintenance event: "${orphan.title}" on ${orphan.date}`);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // PASS 2: Remove duplicates from remaining events
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[${correlationId}] 🔍 Step 3: Checking remaining for duplicates`);
    
    // Re-fetch again after orphan cleanup
    const postOrphanEvents = await svc.entities.TimelineEvent.filter({ created_by: user.email });
    const remainingMaintenanceEvents = postOrphanEvents.filter(e => {
      const eventType = (e.event_type || '').toLowerCase();
      const title = (e.title || '').toLowerCase();
      return eventType.includes('maintenance') || 
             eventType.includes('follow') ||
             title.includes('maintenance') ||
             title.includes('follow up');
    });
    
    // Group by: title + event_date (ignore lease_id for broader matching)
    const duplicateGroups = {};
    for (const event of remainingMaintenanceEvents) {
      const dateKey = event.event_date ? event.event_date.split('T')[0] : 'no-date';
      const titleKey = (event.title || 'no-title').toLowerCase().trim();
      const key = `${titleKey}|${dateKey}`;
      if (!duplicateGroups[key]) {
        duplicateGroups[key] = [];
      }
      duplicateGroups[key].push(event);
    }
    
    console.log(`[${correlationId}] Duplicate groups found:`, Object.keys(duplicateGroups).length);
    
    // Find and delete duplicates (keep oldest by created_date)
    const duplicateIdsToDelete = [];
    for (const key of Object.keys(duplicateGroups)) {
      const group = duplicateGroups[key];
      if (group.length > 1) {
        console.log(`[${correlationId}] Group "${key}" has ${group.length} events`);
        // Sort by created_date ascending, keep first (oldest)
        group.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        // Delete all except the first one
        for (let i = 1; i < group.length; i++) {
          duplicateIdsToDelete.push({ id: group[i].id, title: group[i].title, date: group[i].event_date });
        }
      }
    }
    
    console.log(`[${correlationId}] Duplicate IDs to delete:`, duplicateIdsToDelete.map(d => d.title));
    
    for (const dup of duplicateIdsToDelete) {
      await svc.entities.TimelineEvent.delete(dup.id);
      cleaned.timelineEvents++;
      console.log(`[${correlationId}] Deleted duplicate event: "${dup.title}" on ${dup.date}`);
    }
    
    const totalMaintenanceDeleted = orphanedIds.length + duplicateIdsToDelete.length;
    console.log(`[${correlationId}] ✅ FINAL: Removed ${totalMaintenanceDeleted} maintenance timeline events`);
    
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