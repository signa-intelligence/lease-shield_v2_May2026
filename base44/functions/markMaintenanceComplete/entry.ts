import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { maintenance_id, completion_notes, completion_photo_urls } = await req.json();

    if (!maintenance_id) {
      return Response.json({ error: 'maintenance_id is required' }, { status: 400 });
    }

    const requests = await base44.entities.MaintenanceRequest.filter({ id: maintenance_id });
    const maintenance = requests[0];

    if (!maintenance || maintenance.created_by !== user.email) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    if (maintenance.status === 'completed') {
      return Response.json({ success: false, error: 'Already marked as completed' });
    }

    const resolvedDate = new Date().toISOString().split('T')[0];

    const updateData = {
      status: 'completed',
      resolved_date: resolvedDate,
      completion_notes: completion_notes || '',
    };

    if (completion_photo_urls && completion_photo_urls.length > 0) {
      updateData.completion_photo_urls = [
        ...(maintenance.completion_photo_urls || []),
        ...completion_photo_urls,
      ];
    }

    // Add to communication log
    const logEntry = {
      timestamp: new Date().toISOString(),
      message: `Maintenance marked as completed${completion_notes ? ': ' + completion_notes : ''}`,
      sender: 'tenant',
      sender_name: user.full_name || user.email,
      sender_email: user.email,
      action_type: 'completed',
    };
    updateData.communication_log = [...(maintenance.communication_log || []), logEntry];

    await base44.entities.MaintenanceRequest.update(maintenance_id, updateData);

    await base44.entities.TimelineEvent.create({
      owner_email: user.email,
      property_address: maintenance.property_address || '',
      lease_id: maintenance.lease_id || '',
      event_type: 'maintenance_closed',
      event_date: new Date().toISOString(),
      title: 'Maintenance Completed',
      description: `${maintenance.issue_title} — Marked as completed${completion_notes ? '. ' + completion_notes : ''}`,
      source: 'manual',
    });

    // Dismiss timeline follow-up reminder
    try {
      await base44.functions.invoke('dismissTimelineReminder', {
        entityType: 'maintenance',
        entityId: maintenance_id,
        createClosureEvent: true,
      });
    } catch (e) {
      console.log('[DISMISS_REMINDER] Non-critical:', e.message);
    }

    console.log(`[MAINTENANCE_COMPLETED] ${user.email} — ${maintenance.issue_title}`);

    return Response.json({
      success: true,
      maintenance: { id: maintenance.id, status: 'completed', resolved_date: resolvedDate },
    });
  } catch (error) {
    console.error('[MARK_COMPLETE_ERROR]', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});