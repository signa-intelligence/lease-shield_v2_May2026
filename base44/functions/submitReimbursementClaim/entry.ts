import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { maintenance_id, amount, payment_date, receipt_url, receipt_file_name } = await req.json();

    if (!maintenance_id || !amount || amount <= 0) {
      return Response.json({ error: 'maintenance_id and valid amount are required' }, { status: 400 });
    }

    if (!receipt_url) {
      return Response.json({ error: 'receipt_url is required (upload via UploadFile first)' }, { status: 400 });
    }

    const requests = await base44.entities.MaintenanceRequest.filter({ id: maintenance_id });
    const maintenance = requests[0];

    if (!maintenance || maintenance.created_by !== user.email) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const fileName = receipt_file_name || 'receipt';
    const payDate = payment_date || new Date().toISOString().split('T')[0];

    await base44.entities.MaintenanceRequest.update(maintenance_id, {
      payment_responsibility: 'tenant_reimbursable',
      tenant_paid_amount: amount,
      tenant_payment_date: payDate,
      tenant_receipt_url: receipt_url,
      tenant_receipt_file_name: fileName,
      reimbursement_status: 'pending',
      reimbursement_claimed_date: new Date().toISOString(),
    });

    // Save receipt as Document
    try {
      await base44.entities.Document.create({
        type: 'receipt',
        file_url: receipt_url,
        label: `Maintenance receipt — ${maintenance.issue_title} — ฿${amount.toLocaleString()}`,
      });
    } catch (e) {
      console.log('[REIMBURSEMENT] Document creation failed (non-critical):', e.message);
    }

    await base44.entities.TimelineEvent.create({
      owner_email: user.email,
      property_address: maintenance.property_address || '',
      lease_id: maintenance.lease_id || '',
      event_type: 'maintenance_reported',
      event_date: new Date().toISOString(),
      title: 'Reimbursement Claim Submitted',
      description: `Submitted claim for ฿${amount.toLocaleString()} — ${maintenance.issue_title}`,
      source: 'manual',
    });

    console.log(`[REIMBURSEMENT_CLAIMED] ${user.email} — ฿${amount} for ${maintenance.issue_title}`);

    return Response.json({
      success: true,
      claim: { amount, status: 'pending', receipt_url, maintenance_id },
    });
  } catch (error) {
    console.error('[SUBMIT_CLAIM_ERROR]', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});