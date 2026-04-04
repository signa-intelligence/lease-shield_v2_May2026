import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { maintenance_id, action, approved_amount, notes } = await req.json();

    if (!maintenance_id || !action) {
      return Response.json({ error: 'maintenance_id and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject', 'mark_paid'].includes(action)) {
      return Response.json({ error: 'action must be approve, reject, or mark_paid' }, { status: 400 });
    }

    const requests = await base44.asServiceRole.entities.MaintenanceRequest.filter({ id: maintenance_id });
    const maintenance = requests[0];

    if (!maintenance) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    // For approve/reject, check user is admin or not the tenant
    if ((action === 'approve' || action === 'reject') && maintenance.created_by === user.email && user.role !== 'admin') {
      return Response.json({ error: 'Cannot approve/reject your own claim' }, { status: 403 });
    }

    if (action === 'approve') {
      if (maintenance.reimbursement_status !== 'pending') {
        return Response.json({ error: 'No pending claim to approve' }, { status: 400 });
      }

      const amt = approved_amount || maintenance.tenant_paid_amount;

      await base44.asServiceRole.entities.MaintenanceRequest.update(maintenance_id, {
        reimbursement_status: 'approved',
        reimbursement_amount: amt,
        reimbursement_approved_date: new Date().toISOString(),
        reimbursement_notes: notes || '',
      });

      await base44.asServiceRole.entities.TimelineEvent.create({
        owner_email: maintenance.created_by,
        property_address: maintenance.property_address || '',
        lease_id: maintenance.lease_id || '',
        event_type: 'maintenance_reported',
        event_date: new Date().toISOString(),
        title: 'Reimbursement Approved',
        description: `฿${(amt || 0).toLocaleString()} reimbursement approved for ${maintenance.issue_title}${notes ? '. ' + notes : ''}`,
        source: 'system',
      });

      console.log(`[REIMBURSEMENT_APPROVED] ${maintenance.created_by} — ฿${amt}`);
      return Response.json({ success: true, status: 'approved', amount: amt });
    }

    if (action === 'reject') {
      if (maintenance.reimbursement_status !== 'pending') {
        return Response.json({ error: 'No pending claim to reject' }, { status: 400 });
      }

      await base44.asServiceRole.entities.MaintenanceRequest.update(maintenance_id, {
        reimbursement_status: 'rejected',
        reimbursement_notes: notes || '',
      });

      await base44.asServiceRole.entities.TimelineEvent.create({
        owner_email: maintenance.created_by,
        property_address: maintenance.property_address || '',
        lease_id: maintenance.lease_id || '',
        event_type: 'maintenance_reported',
        event_date: new Date().toISOString(),
        title: 'Reimbursement Rejected',
        description: `Reimbursement claim rejected for ${maintenance.issue_title}${notes ? '. Reason: ' + notes : ''}`,
        source: 'system',
      });

      console.log(`[REIMBURSEMENT_REJECTED] ${maintenance.created_by}`);
      return Response.json({ success: true, status: 'rejected' });
    }

    if (action === 'mark_paid') {
      if (maintenance.reimbursement_status !== 'approved') {
        return Response.json({ error: 'Claim must be approved before marking as paid' }, { status: 400 });
      }

      await base44.asServiceRole.entities.MaintenanceRequest.update(maintenance_id, {
        reimbursement_status: 'paid',
        reimbursement_paid_date: new Date().toISOString(),
      });

      await base44.asServiceRole.entities.TimelineEvent.create({
        owner_email: maintenance.created_by,
        property_address: maintenance.property_address || '',
        lease_id: maintenance.lease_id || '',
        event_type: 'maintenance_reported',
        event_date: new Date().toISOString(),
        title: 'Reimbursement Paid',
        description: `฿${(maintenance.reimbursement_amount || 0).toLocaleString()} reimbursement received for ${maintenance.issue_title}`,
        source: 'system',
      });

      console.log(`[REIMBURSEMENT_PAID] ${maintenance.created_by} — ฿${maintenance.reimbursement_amount}`);
      return Response.json({ success: true, status: 'paid' });
    }
  } catch (error) {
    console.error('[PROCESS_REIMBURSEMENT_ERROR]', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});