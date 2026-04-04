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

    console.log('[DAILY_CHECK] Scanning for double subscriptions...');

    const allUsers = await base44.asServiceRole.entities.User.filter({});
    const stripeUsers = allUsers.filter(u => u.stripe_customer_id);

    const issues = [];

    for (const user of stripeUsers) {
      try {
        const subs = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'active',
          limit: 50
        });

        if (subs.data.length > 1) {
          issues.push({
            email: user.email,
            plan_tier: user.plan_tier,
            active_count: subs.data.length,
            subscriptions: subs.data.map(s => ({
              id: s.id,
              amount: `฿${s.items.data[0].price.unit_amount / 100}`,
              created: new Date(s.created * 1000).toISOString(),
            })),
          });
          console.warn(`⚠️ DOUBLE SUB: ${user.email} has ${subs.data.length} active subs`);
        }
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        console.error(`Error checking ${user.email}:`, e.message);
      }
    }

    if (issues.length > 0) {
      console.error(`🚨 ALERT: ${issues.length} user(s) with multiple active subscriptions`);
      // Send alert email
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: Deno.env.get('ADMIN_ALERT_EMAIL') || 'steve.l@signa-consultants.com',
          subject: `🚨 Double Subscription Alert — ${issues.length} user(s) affected`,
          body: `<h2>Double Subscription Detection</h2>
            <p>${issues.length} user(s) have multiple active Stripe subscriptions:</p>
            <ul>${issues.map(i => `<li><b>${i.email}</b> — ${i.active_count} active subs (tier: ${i.plan_tier})</li>`).join('')}</ul>
            <p>Please review in Admin Console or run the audit function.</p>`,
        });
        console.log('[DAILY_CHECK] ✅ Alert email sent');
      } catch (emailErr) {
        console.error('[DAILY_CHECK] Email failed:', emailErr.message);
      }
    } else {
      console.log('✅ No double subscriptions detected');
    }

    return Response.json({
      success: true,
      checked: stripeUsers.length,
      issues_found: issues.length,
      issues,
    });
  } catch (error) {
    console.error('[DAILY_CHECK] Error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});