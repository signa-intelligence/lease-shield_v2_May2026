import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deposit_tracker_id, proof_url, proof_file_name } = await req.json();

    if (!deposit_tracker_id || !proof_url) {
      return Response.json({ error: 'deposit_tracker_id and proof_url are required' }, { status: 400 });
    }

    const deposits = await base44.entities.DepositTracker.filter({ id: deposit_tracker_id });
    const deposit = deposits[0];

    if (!deposit || deposit.owner_email !== user.email) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const fileName = proof_file_name || 'deposit_return_proof';

    await base44.entities.DepositTracker.update(deposit_tracker_id, {
      return_proof_url: proof_url,
      return_proof_file_name: fileName,
    });

    // Save as Document in evidence vault
    let documentId = null;
    try {
      const doc = await base44.entities.Document.create({
        type: 'receipt',
        file_url: proof_url,
        label: `Deposit return proof — ฿${(deposit.deposit_amount || 0).toLocaleString()}`,
      });
      documentId = doc.id;
    } catch (e) {
      console.log('[DEPOSIT_PROOF] Document creation failed (non-critical):', e.message);
    }

    await base44.entities.TimelineEvent.create({
      owner_email: user.email,
      property_address: deposit.property_address || '',
      lease_id: deposit.lease_id || '',
      event_type: 'deposit_return',
      event_date: new Date().toISOString(),
      title: 'Deposit Return Proof Uploaded',
      description: `Uploaded proof of deposit return (${fileName})`,
      source: 'manual',
    });

    console.log(`[DEPOSIT_PROOF_UPLOADED] ${user.email} — ${fileName}`);

    return Response.json({
      success: true,
      proof_url,
      file_name: fileName,
      document_id: documentId,
    });
  } catch (error) {
    console.error('[UPLOAD_DEPOSIT_PROOF_ERROR]', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});