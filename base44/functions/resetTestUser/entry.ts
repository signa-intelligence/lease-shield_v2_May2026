import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (caller?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('RESET TEST USER TO EXPLORER');
    console.log(`User: ${email}`);
    console.log('═══════════════════════════════════════════════════════\n');

    // Find user
    const allUsers = await base44.asServiceRole.entities.User.filter({ email });
    if (!allUsers.length) return Response.json({ error: 'User not found' }, { status: 404 });
    const user = allUsers[0];

    if (!user.stripe_customer_id) {
      return Response.json({ error: 'User has no Stripe customer ID' }, { status: 400 });
    }

    // Get all active subscriptions
    const subs = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'active',
      limit: 50
    });

    console.log(`Found ${subs.data.length} active subscription(s)`);

    // Cancel ALL active subscriptions immediately
    const canceled = [];
    for (const sub of subs.data) {
      const item = sub.items.data[0];
      const amt = item.price.unit_amount / 100;
      console.log(`Canceling ${sub.id} — ฿${amt}/${item.price.recurring.interval}`);
      
      const result = await stripe.subscriptions.cancel(sub.id);
      canceled.push({ id: result.id, status: result.status, amount: `฿${amt}` });
      console.log(`  ✅ Canceled (status: ${result.status})`);
    }

    // Reset user to Explorer
    console.log('\nUpdating user to Explorer tier...');
    await base44.asServiceRole.entities.User.update(user.id, {
      plan_tier: 'explorer',
      subscription_status: 'cancelled',
      stripe_subscription_id: null,
      stripe_price_id: null,
      plan_renews_at: null,
    });
    console.log('✅ User updated to Explorer tier');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('RESET COMPLETE');
    console.log(`Canceled: ${canceled.length} subscription(s)`);
    console.log(`New tier: explorer`);
    console.log('═══════════════════════════════════════════════════════\n');

    return Response.json({
      success: true,
      email: user.email,
      new_tier: 'explorer',
      canceled_subscriptions: canceled,
    });
  } catch (error) {
    console.error('RESET ERROR:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});