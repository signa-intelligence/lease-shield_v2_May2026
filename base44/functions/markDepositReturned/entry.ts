import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deposit_tracker_id, return_amount, return_notes } = await req.json();

    if (!deposit_tracker_id) {
      return Response.json({ error: 'deposit_tracker_id is required' }, { status: 400 });
    }

    const deposits = await base44.entities.DepositTracker.filter({ id: deposit_tracker_id });
    const deposit = deposits[0];

    if (!deposit || deposit.owner_email !== user.email) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    if (deposit.status === 'returned') {
      return Response.json({ success: false, error: 'Already marked as returned' });
    }

    const returnedDate = new Date().toISOString().split('T')[0];
    const actualReturn = return_amount !== undefined ? return_amount : deposit.deposit_amount;

    await base44.entities.DepositTracker.update(deposit_tracker_id, {
      status: 'returned',
      returned_date: returnedDate,
      return_amount: actualReturn,
      return_notes: return_notes || '',
    });

    await base44.entities.TimelineEvent.create({
      owner_email: user.email,
      property_address: deposit.property_address || '',
      lease_id: deposit.lease_id || '',
      event_type: 'deposit_return',
      event_date: new Date().toISOString(),
      title: 'Deposit Returned',
      description: `Security deposit of ฿${(actualReturn || 0).toLocaleString()} marked as returned${return_notes ? '. Notes: ' + return_notes : ''}`,
      source: 'manual',
    });

    console.log(`[DEPOSIT_RETURNED] ${user.email} — ฿${actualReturn}`);

    return Response.json({
      success: true,
      deposit: { id: deposit.id, status: 'returned', returned_date: returnedDate, return_amount: actualReturn },
    });
  } catch (error) {
    console.error('[MARK_RETURNED_ERROR]', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});