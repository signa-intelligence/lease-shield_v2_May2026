import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const reqClone = req.clone();
    const base44 = createClientFromRequest(reqClone);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[REACTIVATE] Request from:', user.email);

    if (!user.stripe_customer_id) {
      return Response.json({ error: 'No Stripe customer found.' }, { status: 400 });
    }

    // Find the subscription that's scheduled for cancellation
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'active',
      limit: 5
    });

    const cancelingSub = subscriptions.data.find(s => s.cancel_at_period_end === true);
    if (!cancelingSub) {
      return Response.json({ error: 'No pending cancellation found.' }, { status: 400 });
    }

    // Remove cancel_at_period_end
    const updatedSub = await stripe.subscriptions.update(cancelingSub.id, {
      cancel_at_period_end: false
    });

    console.log('[REACTIVATE] ✅ Subscription reactivated:', updatedSub.id);

    // Update user record
    await base44.auth.updateMe({
      subscription_status: 'active',
      cancellation_reason: null,
      cancellation_feedback: null,
      cancellation_date: null
    });

    return Response.json({
      success: true,
      subscription_id: updatedSub.id,
      plan_renews_at: new Date(updatedSub.current_period_end * 1000).toISOString()
    });
  } catch (error) {
    console.error('[REACTIVATE] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});