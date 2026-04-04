import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('SUBSCRIPTION MISMATCH INVESTIGATION');
    console.log('User:', email);
    console.log('═══════════════════════════════════════════════════════\n');
    
    // STEP 1: Get user from database
    console.log('STEP 1: Querying User entity...');
    const users = await base44.asServiceRole.entities.User.filter({ email });
    
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found in database' }, { status: 404 });
    }
    
    const dbUser = users[0];
    
    console.log('DATABASE USER DATA:', JSON.stringify({
      email: dbUser.email,
      plan_tier: dbUser.plan_tier,
      subscription_status: dbUser.subscription_status,
      stripe_customer_id: dbUser.stripe_customer_id,
      stripe_subscription_id: dbUser.stripe_subscription_id,
      stripe_price_id: dbUser.stripe_price_id,
      plan_renews_at: dbUser.plan_renews_at,
    }, null, 2));
    
    // STEP 2: Get Stripe customer
    console.log('\nSTEP 2: Querying Stripe customer...');
    
    if (!dbUser.stripe_customer_id) {
      // Try finding by email in Stripe
      console.log('No stripe_customer_id in DB, searching Stripe by email...');
      const customers = await stripe.customers.list({ email, limit: 5 });
      if (customers.data.length === 0) {
        return Response.json({ error: 'No Stripe customer found', database_data: dbUser });
      }
      console.log('Found', customers.data.length, 'Stripe customer(s) by email');
      // Use most recent
      const cust = customers.data[0];
      console.log('Using Stripe customer:', cust.id, cust.email);
      dbUser._stripe_customer_id = cust.id;
    }
    
    const stripeCustomerId = dbUser.stripe_customer_id || dbUser._stripe_customer_id;
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    console.log('STRIPE CUSTOMER:', JSON.stringify({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      created: new Date(customer.created * 1000).toISOString()
    }, null, 2));
    
    // STEP 3: Get subscriptions
    console.log('\nSTEP 3: Querying Stripe subscriptions...');
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      limit: 10
    });
    
    console.log('Found', subscriptions.data.length, 'subscription(s)');
    
    subscriptions.data.forEach(s => {
      console.log('  -', s.id, 'status:', s.status, 'created:', new Date(s.created * 1000).toISOString());
    });
    
    const activeSub = subscriptions.data.find(s => s.status === 'active') || subscriptions.data.find(s => s.status === 'trialing');
    
    if (!activeSub) {
      console.log('❌ NO ACTIVE SUBSCRIPTION IN STRIPE');
      return Response.json({
        error: 'No active subscription in Stripe',
        database_data: { plan_tier: dbUser.plan_tier, subscription_status: dbUser.subscription_status },
        stripe_subscriptions: subscriptions.data.map(s => ({ id: s.id, status: s.status }))
      });
    }
    
    console.log('\nACTIVE SUBSCRIPTION:', JSON.stringify({
      id: activeSub.id,
      status: activeSub.status,
      current_period_start: new Date(activeSub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(activeSub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: activeSub.cancel_at_period_end
    }, null, 2));
    
    // STEP 4: Price details
    console.log('\nSTEP 4: Analyzing price...');
    const subItem = activeSub.items.data[0];
    const priceId = subItem.price.id;
    const amount = subItem.price.unit_amount / 100;
    const currency = subItem.price.currency.toUpperCase();
    const interval = subItem.price.recurring.interval;
    
    console.log('STRIPE PRICE:', JSON.stringify({ price_id: priceId, amount: `${currency} ${amount}`, interval, product_id: subItem.price.product }, null, 2));
    
    // STEP 5: Product
    const product = await stripe.products.retrieve(subItem.price.product);
    console.log('STRIPE PRODUCT:', product.name, '(' + product.id + ')');
    
    // STEP 6: Recent invoices
    console.log('\nSTEP 6: Recent invoices...');
    const invoices = await stripe.invoices.list({ customer: stripeCustomerId, limit: 5 });
    invoices.data.forEach(inv => {
      console.log('  Invoice', inv.number || inv.id, '- ฿' + (inv.amount_paid / 100), inv.status, new Date(inv.created * 1000).toISOString());
    });
    
    // STEP 7: Compare
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('COMPARISON: DATABASE vs STRIPE');
    console.log('═══════════════════════════════════════════════════════');
    
    const comparison = {
      subscription_id: { db: dbUser.stripe_subscription_id, stripe: activeSub.id, match: dbUser.stripe_subscription_id === activeSub.id },
      price_id: { db: dbUser.stripe_price_id, stripe: priceId, match: dbUser.stripe_price_id === priceId },
      tier_vs_amount: { db_tier: dbUser.plan_tier, stripe_product: product.name, stripe_amount: `฿${amount}/${interval}` }
    };
    
    console.log('Sub ID:', comparison.subscription_id.match ? '✅ MATCH' : '❌ MISMATCH', '| DB:', comparison.subscription_id.db, '| Stripe:', comparison.subscription_id.stripe);
    console.log('Price ID:', comparison.price_id.match ? '✅ MATCH' : '❌ MISMATCH', '| DB:', comparison.price_id.db, '| Stripe:', comparison.price_id.stripe);
    console.log('Tier:', comparison.tier_vs_amount.db_tier, '| Stripe:', comparison.tier_vs_amount.stripe_product, '@', comparison.tier_vs_amount.stripe_amount);
    
    // STEP 8: Issues
    const issues = [];
    
    if (amount === 190) {
      issues.push({ severity: 'CRITICAL', issue: 'Old/incorrect price ฿190 does not match any current tier' });
    }
    if (!comparison.subscription_id.match) {
      issues.push({ severity: 'HIGH', issue: 'Subscription ID mismatch between DB and Stripe' });
    }
    if (!comparison.price_id.match) {
      issues.push({ severity: 'HIGH', issue: 'Price ID mismatch between DB and Stripe' });
    }
    if (dbUser.plan_tier === 'protect' && amount !== 325 && amount !== 3900) {
      issues.push({ severity: 'CRITICAL', issue: `Protect tier but charged ฿${amount} — expected ฿325/month or ฿3900/year` });
    }
    if (dbUser.plan_tier === 'lite' && amount !== 158 && amount !== 1896) {
      issues.push({ severity: 'HIGH', issue: `Lite tier but charged ฿${amount} — expected ฿158/month or ฿1896/year` });
    }
    
    console.log('\nISSUES FOUND:', issues.length);
    issues.forEach((iss, i) => console.log(`  ${i+1}. [${iss.severity}] ${iss.issue}`));
    
    if (issues.length === 0) console.log('  ✅ No issues found');
    
    // Recommendations
    if (amount === 190 && dbUser.plan_tier === 'protect') {
      console.log('\n🔧 RECOMMENDED FIX:');
      console.log('  DB says Protect but Stripe charging ฿190 (old Lite price)');
      console.log('  Option A: Downgrade DB tier to "lite" if user only paid for Lite');
      console.log('  Option B: Update Stripe sub to Protect price if user should be Protect');
    }
    
    console.log('\n═══════════════════════════════════════════════════════\n');
    
    return Response.json({
      success: true,
      investigation: {
        database: { email: dbUser.email, plan_tier: dbUser.plan_tier, subscription_status: dbUser.subscription_status, stripe_subscription_id: dbUser.stripe_subscription_id, stripe_price_id: dbUser.stripe_price_id },
        stripe: { customer_id: customer.id, subscription_id: activeSub.id, price_id: priceId, product_name: product.name, amount: `฿${amount}`, interval, status: activeSub.status },
        comparison,
        issues,
        recent_invoices: invoices.data.map(inv => ({ id: inv.id, amount: `฿${inv.amount_paid / 100}`, status: inv.status, date: new Date(inv.created * 1000).toISOString() }))
      }
    });
    
  } catch (error) {
    console.error('❌ INVESTIGATION ERROR:', error.message, error.stack);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});