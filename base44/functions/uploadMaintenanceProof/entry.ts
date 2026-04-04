import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { maintenance_id, proof_urls, proof_type } = await req.json();
    // proof_type: 'completion' | 'tenant_receipt' | 'landlord_receipt'

    if (!maintenance_id) {
      return Response.json({ error: 'maintenance_id is required' }, { status: 400 });
    }
    if (!proof_urls || !Array.isArray(proof_urls) || proof_urls.length === 0) {
      return Response.json({ error: 'proof_urls array is required (upload files first via UploadFile integration)' }, { status: 400 });
    }

    const requests = await base44.entities.MaintenanceRequest.filter({ id: maintenance_id });
    const maintenance = requests[0];

    if (!maintenance) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const type = proof_type || 'completion';
    const updateData = {};
    let timelineTitle = '';
    let docLabel = '';

    if (type === 'completion') {
      const existing = maintenance.completion_photo_urls || [];
      updateData.completion_photo_urls = [...existing, ...proof_urls];
      timelineTitle = 'Maintenance Completion Photos Uploaded';
      docLabel = `Completion photo — ${maintenance.issue_title}`;
    } else if (type === 'tenant_receipt') {
      updateData.tenant_receipt_url = proof_urls[0];
      updateData.tenant_receipt_file_name = proof_urls[0].split('/').pop();
      timelineTitle = 'Tenant Payment Receipt Uploaded';
      docLabel = `Tenant receipt — ${maintenance.issue_title}`;
    } else if (type === 'landlord_receipt') {
      updateData.landlord_receipt_url = proof_urls[0];
      updateData.landlord_receipt_file_name = proof_urls[0].split('/').pop();
      timelineTitle = 'Landlord Payment Receipt Uploaded';
      docLabel = `Landlord receipt — ${maintenance.issue_title}`;
    }

    await base44.entities.MaintenanceRequest.update(maintenance_id, updateData);

    // Save each as Document
    for (const url of proof_urls) {
      base44.entities.Document.create({
        type: type === 'completion' ? 'photo' : 'receipt',
        file_url: url,
        label: docLabel,
      }).catch(() => {});
    }

    // Timeline event
    await base44.entities.TimelineEvent.create({
      owner_email: user.email,
      property_address: maintenance.property_address || '',
      lease_id: maintenance.lease_id || '',
      event_type: 'maintenance_closed',
      event_date: new Date().toISOString(),
      title: timelineTitle,
      description: `Uploaded ${proof_urls.length} file(s) for ${maintenance.issue_title}`,
      source: 'manual',
      source_id: maintenance_id,
    });

    console.log(`[MAINTENANCE_PROOF] ${user.email} — ${type} — ${proof_urls.length} files`);

    return Response.json({
      success: true,
      type,
      files_count: proof_urls.length,
    });
  } catch (error) {
    console.error('[UPLOAD_MAINTENANCE_PROOF_ERROR]', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});