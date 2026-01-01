import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Dismisses or completes a follow-up reminder in the timeline
 * Called when a Case or Maintenance Request is closed
 */
Deno.serve(async (req) => {
  const correlationId = `dismiss-${Date.now()}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entityType, entityId, createClosureEvent = true } = await req.json();
    
    console.log(`[${correlationId}] Dismissing timeline reminder`, {
      entityType,
      entityId,
      userEmail: user.email
    });

    if (!entityType || !entityId) {
      return Response.json({ 
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    // Find and dismiss/delete the follow-up reminder
    const followupType = entityType === 'case' ? 'case_followup_due' : 'maintenance_followup_due';
    const followupEvents = await base44.entities.TimelineEvent.filter({
      source_id: entityId,
      event_type: followupType
    });

    if (followupEvents.length > 0) {
      // Delete the reminder (or you could update status to 'dismissed')
      for (const event of followupEvents) {
        await base44.entities.TimelineEvent.delete(event.id);
        console.log(`[${correlationId}] Deleted follow-up reminder ${event.id}`);
      }
    }

    // Optionally create a closure event
    if (createClosureEvent) {
      let entityData = null;
      
      if (entityType === 'case') {
        const cases = await base44.entities.Case.filter({ id: entityId });
        entityData = cases[0];
      } else if (entityType === 'maintenance') {
        const requests = await base44.entities.MaintenanceRequest.filter({ id: entityId });
        entityData = requests[0];
      }

      if (entityData) {
        const closureType = entityType === 'case' ? 'case_closed' : 'maintenance_closed';
        const title = entityData.issue_title || entityData.summary || entityData.case_number || 'Record';
        
        await base44.entities.TimelineEvent.create({
          event_type: closureType,
          event_date: new Date().toISOString(),
          title: `${entityType === 'case' ? 'Case closed' : 'Maintenance completed'}: ${title}`,
          description: entityData.property_address || '',
          property_address: entityData.property_address,
          property_id: entityData.property_id,
          source: entityType,
          source_id: entityId,
          needs_review: false,
          is_estimated: false
        });
        
        console.log(`[${correlationId}] Created closure event`);
      }
    }

    return Response.json({
      success: true,
      dismissed: followupEvents.length,
      correlationId
    });

  } catch (error) {
    console.error(`[${correlationId}] Dismiss timeline reminder error:`, {
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