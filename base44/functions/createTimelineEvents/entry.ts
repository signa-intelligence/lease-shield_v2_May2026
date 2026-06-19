import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Creates timeline events for Cases and Maintenance Requests
 * Handles creation event + follow-up reminder
 */
Deno.serve(async (req) => {
  const correlationId = `timeline-${Date.now()}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${correlationId}] Unauthorized`);
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      entityType, 
      entityId, 
      entityData,
      followupDays 
    } = await req.json();
    
    console.log(`[${correlationId}] Creating timeline events`, {
      entityType,
      entityId,
      userEmail: user.email,
      followupDays
    });

    if (!entityType || !entityId || !entityData) {
      return Response.json({ 
        error: 'Missing required parameters',
        details: 'entityType, entityId, and entityData are required'
      }, { status: 400 });
    }

    // OWNERSHIP CHECK: caller must own the source Case/MaintenanceRequest (or be admin)
    const role = (user.role || user.access_level || '').toLowerCase();
    const isAdminLike = ['admin', 'super_admin', 'va'].includes(role);
    if (!isAdminLike) {
      if (entityType === 'case') {
        const c = (await base44.asServiceRole.entities.Case.filter({ id: entityId }))?.[0];
        if (c && c.user_email !== user.email && c.created_by !== user.email) {
          return Response.json({ error: 'Forbidden: not your case' }, { status: 403 });
        }
      } else if (entityType === 'maintenance') {
        const m = (await base44.asServiceRole.entities.MaintenanceRequest.filter({ id: entityId }))?.[0];
        if (m && m.created_by !== user.email) {
          return Response.json({ error: 'Forbidden: not your request' }, { status: 403 });
        }
      }
    }

    // Check if timeline events already exist (idempotency)
    const existingEvents = await base44.entities.TimelineEvent.filter({
      source_id: entityId
    });
    
    if (existingEvents.length > 0) {
      console.log(`[${correlationId}] Timeline events already exist for ${entityId}`);
      return Response.json({
        success: true,
        message: 'Events already exist',
        created: false
      });
    }

    // Calculate follow-up date based on priority
    const getFollowupDays = () => {
      if (followupDays !== undefined && followupDays !== null) {
        return followupDays;
      }
      
      const priority = entityData.priority || 'medium';
      switch (priority) {
        case 'urgent': return 1;
        case 'high': return 3;
        case 'medium': return 7;
        case 'low': return 14;
        default: return 7;
      }
    };

    const followupOffset = getFollowupDays();
    const now = new Date();
    const followupDate = new Date(now);
    followupDate.setDate(followupDate.getDate() + followupOffset);

    // Prepare event data
    const title = entityData.issue_title || entityData.summary || entityData.case_number || 'Record';
    const propertyAddress = entityData.property_address || '';
    const propertyId = entityData.property_id || null;
    
    let createdEvent = null;
    let followupEvent = null;

    // Create CREATION event
    if (entityType === 'case') {
      createdEvent = await base44.entities.TimelineEvent.create({
        event_type: 'case_created',
        event_date: now.toISOString(),
        title: `Case opened: ${title}`,
        description: propertyAddress,
        property_address: propertyAddress,
        property_id: propertyId,
        source: 'case',
        source_id: entityId,
        needs_review: false,
        is_estimated: false
      });
    } else if (entityType === 'maintenance') {
      createdEvent = await base44.entities.TimelineEvent.create({
        event_type: 'maintenance_reported',
        event_date: now.toISOString(),
        title: `Maintenance: ${title}`,
        description: propertyAddress,
        property_address: propertyAddress,
        property_id: propertyId,
        source: 'maintenance',
        source_id: entityId,
        needs_review: false,
        is_estimated: false
      });
    }

    // Create FOLLOW-UP reminder event
    if (entityType === 'case') {
      followupEvent = await base44.entities.TimelineEvent.create({
        event_type: 'case_followup_due',
        event_date: followupDate.toISOString(),
        title: `Follow up: ${title}`,
        description: `Check case status`,
        property_address: propertyAddress,
        property_id: propertyId,
        source: 'case',
        source_id: entityId,
        reminder_for_event_id: createdEvent.id,
        needs_review: false,
        is_estimated: false
      });
    } else if (entityType === 'maintenance') {
      followupEvent = await base44.entities.TimelineEvent.create({
        event_type: 'maintenance_followup_due',
        event_date: followupDate.toISOString(),
        title: `Follow up: ${title}`,
        description: `Check repair status`,
        property_address: propertyAddress,
        property_id: propertyId,
        source: 'maintenance',
        source_id: entityId,
        reminder_for_event_id: createdEvent.id,
        needs_review: false,
        is_estimated: false
      });
    }

    // Update source entity with timeline event IDs
    if (entityType === 'case') {
      await base44.asServiceRole.entities.Case.update(entityId, {
        timeline_event_created_id: createdEvent.id,
        timeline_event_followup_id: followupEvent.id,
        next_action_date: followupDate.toISOString()
      });
    } else if (entityType === 'maintenance') {
      await base44.asServiceRole.entities.MaintenanceRequest.update(entityId, {
        timeline_event_created_id: createdEvent.id,
        timeline_event_followup_id: followupEvent.id,
        next_action_date: followupDate.toISOString()
      });
    }

    console.log(`[${correlationId}] Timeline events created successfully`, {
      createdEventId: createdEvent.id,
      followupEventId: followupEvent.id,
      followupDaysUsed: followupOffset
    });

    return Response.json({
      success: true,
      created: true,
      events: {
        created: createdEvent.id,
        followup: followupEvent.id
      },
      followup_date: followupDate.toISOString(),
      correlationId
    });

  } catch (error) {
    console.error(`[${correlationId}] Timeline events creation error:`, {
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