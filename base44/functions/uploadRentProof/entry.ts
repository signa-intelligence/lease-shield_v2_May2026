import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rent_payment_id, proof_url, proof_file_name } = await req.json();

    if (!rent_payment_id) {
      return Response.json({ error: 'rent_payment_id is required' }, { status: 400 });
    }

    if (!proof_url) {
      return Response.json({ error: 'proof_url is required (upload file first via UploadFile integration)' }, { status: 400 });
    }

    // Get rent payment record
    const payments = await base44.entities.RentPayment.filter({ id: rent_payment_id });
    const payment = payments[0];

    if (!payment || payment.owner_email !== user.email) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const dueDate = new Date(payment.due_date);
    const monthLabel = dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const fileName = proof_file_name || 'payment_proof';

    // Update rent payment with proof info
    await base44.entities.RentPayment.update(rent_payment_id, {
      proof_url: proof_url,
      proof_file_name: fileName,
    });

    // Save as Document in evidence vault
    let documentId = null;
    try {
      const doc = await base44.entities.Document.create({
        type: 'receipt',
        file_url: proof_url,
        label: `Rent proof — ${monthLabel}`,
      });
      documentId = doc.id;
    } catch (e) {
      console.log('[UPLOAD_PROOF] Document creation failed (non-critical):', e.message);
    }

    // Create timeline event
    let propertyAddress = '';
    let leaseId = '';
    if (payment.deposit_tracker_id) {
      try {
        const deposits = await base44.entities.DepositTracker.filter({ id: payment.deposit_tracker_id });
        if (deposits[0]) {
          propertyAddress = deposits[0].property_address || '';
          leaseId = deposits[0].lease_id || '';
        }
      } catch (e) {
        console.log('[UPLOAD_PROOF] Could not fetch deposit tracker:', e.message);
      }
    }

    await base44.entities.TimelineEvent.create({
      owner_email: user.email,
      property_address: propertyAddress,
      lease_id: leaseId,
      event_type: 'rent_due',
      event_date: new Date().toISOString(),
      title: 'Rent Payment Proof Uploaded',
      description: `Uploaded proof of payment for ${monthLabel} rent (${fileName})`,
      source: 'manual',
    });

    console.log(`[RENT_PROOF_UPLOADED] ${user.email} — ${fileName} for ${payment.due_date}`);

    return Response.json({
      success: true,
      proof_url: proof_url,
      file_name: fileName,
      document_id: documentId,
    });
  } catch (error) {
    console.error('[UPLOAD_PROOF_ERROR]', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});