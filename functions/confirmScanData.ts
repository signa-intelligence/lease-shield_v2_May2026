import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Confirms and saves reviewed scan data after user confirmation
 * Creates deposit tracker and timeline events
 */
Deno.serve(async (req) => {
  const correlationId = `confirm-scan-${Date.now()}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      depositData, 
      timelineEvents,
      scanId,
      leaseId 
    } = await req.json();
    
    console.log(`[${correlationId}] Confirming scan data`, {
      userId: user.id,
      userEmail: user.email,
      scanId,
      leaseId
    });

    if (!depositData) {
      return Response.json({ 
        error: 'Missing deposit data'
      }, { status: 400 });
    }

    let createdDepositId = null;
    
    try {
      // Add review confirmation metadata
      const depositToSave = {
        ...depositData,
        lease_id: leaseId,
        user_reviewed: true,
        reviewed_at: new Date().toISOString(),
        audit_log: [{
          field: 'initial_review',
          old_value: 'unreviewed',
          new_value: 'reviewed',
          changed_by: user.email,
          timestamp: new Date().toISOString()
        }]
      };

      // Create or update deposit tracker
      if (depositData.existingDepositId) {
        const { existingDepositId, ...dataToUpdate } = depositToSave;
        await base44.entities.DepositTracker.update(
          existingDepositId,
          dataToUpdate
        );
        createdDepositId = existingDepositId;
        console.log(`[${correlationId}] Updated existing deposit tracker`);
      } else {
        const { existingDepositId, ...dataToCreate } = depositToSave;
        const created = await base44.entities.DepositTracker.create(dataToCreate);
        createdDepositId = created.id;
        console.log(`[${correlationId}] Created new deposit tracker`);
      }
    } catch (error) {
      console.error(`[${correlationId}] Deposit save failed:`, error.message);
      throw error;
    }

    // Create timeline events
    let createdEventIds = [];
    
    try {
      if (timelineEvents && timelineEvents.length > 0) {
        const createPromises = timelineEvents.map(event => 
          base44.entities.TimelineEvent.create(event)
        );
        const createdEvents = await Promise.all(createPromises);
        createdEventIds = createdEvents.map(e => e.id);
        console.log(`[${correlationId}] Created ${createdEventIds.length} timeline events`);
      }
    } catch (error) {
      console.error(`[${correlationId}] Timeline events creation failed:`, error.message);
      // Non-critical - don't block
    }

    return Response.json({
      success: true,
      deposit_tracker_id: createdDepositId,
      timeline_events_created: createdEventIds.length,
      correlationId
    });

  } catch (error) {
    console.error(`[${correlationId}] Confirm scan data error:`, {
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