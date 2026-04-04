import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rent_payment_id } = await req.json();

    if (!rent_payment_id) {
      return Response.json({ error: 'rent_payment_id is required' }, { status: 400 });
    }

    // Get rent payment record
    const payments = await base44.entities.RentPayment.filter({ id: rent_payment_id });
    const payment = payments[0];

    if (!payment || payment.owner_email !== user.email) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    if (payment.payment_status === 'paid') {
      return Response.json({ success: false, error: 'Already marked as paid' });
    }

    const paidDate = new Date().toISOString().split('T')[0];

    // Update to paid
    await base44.entities.RentPayment.update(rent_payment_id, {
      payment_status: 'paid',
      paid_date: paidDate,
    });

    // Create timeline event
    const dueDate = new Date(payment.due_date);
    const monthLabel = dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Look up deposit tracker for property address context
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
        console.log('[MARK_PAID] Could not fetch deposit tracker:', e.message);
      }
    }

    await base44.entities.TimelineEvent.create({
      owner_email: user.email,
      property_address: propertyAddress,
      lease_id: leaseId,
      event_type: 'rent_due',
      event_date: new Date().toISOString(),
      title: 'Rent Payment Confirmed',
      description: `Rent payment of ฿${(payment.amount || 0).toLocaleString()} marked as paid for ${monthLabel}`,
      source: 'manual',
    });

    console.log(`[RENT_PAID] ${user.email} — ฿${payment.amount} for ${payment.due_date}`);

    return Response.json({
      success: true,
      payment: {
        id: payment.id,
        status: 'paid',
        paid_date: paidDate,
      },
    });
  } catch (error) {
    console.error('[MARK_PAID_ERROR]', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});