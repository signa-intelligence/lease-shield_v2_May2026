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

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('SUBSCRIPTION AUDIT - ALL USERS');
    console.log('═══════════════════════════════════════════════════════\n');

    // Get all users with stripe_customer_id
    const allUsers = await base44.asServiceRole.entities.User.filter({});
    const stripeUsers = allUsers.filter(u => u.stripe_customer_id);

    console.log(`Total users: ${allUsers.length}`);
    console.log(`Users with Stripe customer ID: ${stripeUsers.length}`);

    const critical = [];
    const high = [];
    const medium = [];
    const errors = [];
    const healthy = [];

    for (let i = 0; i < stripeUsers.length; i++) {
      const user = stripeUsers[i];
      if ((i + 1) % 10 === 0) console.log(`Processing ${i + 1}/${stripeUsers.length}...`);

      try {
        const subs = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'all',
          limit: 50
        });

        const activeSubs = subs.data.filter(s => s.status === 'active' || s.status === 'trialing');

        if (activeSubs.length > 1) {
          const details = activeSubs.map(s => {
            const item = s.items.data[0];
            const amt = item.price.unit_amount / 100;
            const interval = item.price.recurring.interval;
            return {
              id: s.id,
              price: `฿${amt}/${interval}`,
              amount: amt,
              interval,
              status: s.status,
              cancel_at_period_end: s.cancel_at_period_end,
              created: new Date(s.created * 1000).toISOString(),
              canceled_at: s.canceled_at ? new Date(s.canceled_at * 1000).toISOString() : null,
            };
          });

          const totalMonthly = activeSubs.reduce((sum, s) => {
            const amt = s.items.data[0].price.unit_amount / 100;
            const interval = s.items.data[0].price.recurring.interval;
            return sum + (interval === 'year' ? amt / 12 : amt);
          }, 0);

          critical.push({
            email: user.email,
            plan_tier: user.plan_tier,
            db_subscription_id: user.stripe_subscription_id,
            active_count: activeSubs.length,
            total_monthly: `฿${totalMonthly.toFixed(0)}`,
            subscriptions: details,
          });
        } else if (activeSubs.length === 0) {
          if (user.subscription_status === 'active' || user.plan_tier === 'protect' || user.plan_tier === 'secure' || user.plan_tier === 'lite') {
            high.push({
              email: user.email,
              plan_tier: user.plan_tier,
              db_status: user.subscription_status,
              db_subscription_id: user.stripe_subscription_id,
              all_subs: subs.data.map(s => ({ id: s.id, status: s.status })),
            });
          }
        } else {
          // 1 active sub - check ID match
          const sub = activeSubs[0];
          if (user.stripe_subscription_id && user.stripe_subscription_id !== sub.id) {
            medium.push({
              email: user.email,
              plan_tier: user.plan_tier,
              db_sub_id: user.stripe_subscription_id,
              stripe_sub_id: sub.id,
            });
          } else {
            healthy.push({ email: user.email, plan_tier: user.plan_tier });
          }
        }

        // Rate limit: 100ms between Stripe calls
        await new Promise(r => setTimeout(r, 100));
      } catch (err) {
        errors.push({ email: user.email, error: err.message });
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('AUDIT COMPLETE');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Processed: ${stripeUsers.length}`);
    console.log(`🚨 CRITICAL (multiple active subs): ${critical.length}`);
    console.log(`⚠️  HIGH (no active sub but DB says active): ${high.length}`);
    console.log(`⚡ MEDIUM (ID mismatch): ${medium.length}`);
    console.log(`❌ ERRORS: ${errors.length}`);
    console.log(`✅ HEALTHY: ${healthy.length}`);

    critical.forEach((c, i) => {
      console.log(`\n🚨 ${i + 1}. ${c.email} (DB tier: ${c.plan_tier})`);
      console.log(`   Total monthly: ${c.total_monthly}`);
      c.subscriptions.forEach(s => {
        console.log(`   - ${s.id}: ${s.price} | cancel_at_end: ${s.cancel_at_period_end} | created: ${s.created}`);
      });
    });

    return Response.json({
      success: true,
      summary: {
        total_stripe_users: stripeUsers.length,
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        errors: errors.length,
        healthy: healthy.length,
      },
      critical_issues: critical,
      high_issues: high,
      medium_issues: medium,
      errors,
    });
  } catch (error) {
    console.error('AUDIT ERROR:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});