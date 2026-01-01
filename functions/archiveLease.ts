import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Archives a lease and cascades to all related records
 * Sets status to 'archived' for lease, deposits, maintenance, and timeline
 */
Deno.serve(async (req) => {
  const correlationId = `archive-lease-${Date.now()}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leaseId } = await req.json();
    
    console.log(`[${correlationId}] Archiving lease`, {
      leaseId,
      userEmail: user.email
    });

    if (!leaseId) {
      return Response.json({ 
        error: 'Missing leaseId'
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Archive the lease
    await base44.entities.Lease.update(leaseId, {
      status: 'archived',
      archived_at: now,
      archived_by: user.email
    });

    // Archive related deposit trackers
    const deposits = await base44.entities.DepositTracker.filter({
      lease_id: leaseId
    });
    
    for (const deposit of deposits) {
      await base44.entities.DepositTracker.update(deposit.id, {
        status: 'archived',
        is_archived: true,
        archived_at: now
      });
    }

    // Archive related maintenance requests
    const maintenanceRequests = await base44.entities.MaintenanceRequest.filter({
      lease_id: leaseId
    });
    
    for (const request of maintenanceRequests) {
      await base44.entities.MaintenanceRequest.update(request.id, {
        status: 'archived',
        is_archived: true,
        archived_at: now
      });
    }

    // Archive related timeline events
    const timelineEvents = await base44.entities.TimelineEvent.filter({
      lease_id: leaseId
    });
    
    for (const event of timelineEvents) {
      await base44.entities.TimelineEvent.update(event.id, {
        is_archived: true,
        archived_at: now
      });
    }

    console.log(`[${correlationId}] Successfully archived lease and related records`, {
      deposits: deposits.length,
      maintenance: maintenanceRequests.length,
      timeline: timelineEvents.length
    });

    return Response.json({
      success: true,
      archived: {
        deposits: deposits.length,
        maintenance: maintenanceRequests.length,
        timeline: timelineEvents.length
      },
      correlationId
    });

  } catch (error) {
    console.error(`[${correlationId}] Archive lease error:`, {
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