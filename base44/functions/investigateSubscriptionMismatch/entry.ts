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
    const invoices = await stripe.invoices.list({ customer: stripeCustomerId, limit: 10 });
    invoices.data.forEach(inv => {
      console.log('  Invoice', inv.number || inv.id, '- ฿' + (inv.amount_paid / 100), inv.status, new Date(inv.created * 1000).toISOString());
    });

    // STEP 6.5: Detailed April invoice breakdown
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('STEP 6.5: APRIL INVOICE DETAILED BREAKDOWN');
    console.log('═══════════════════════════════════════════════════════');

    const aprilInvoice = invoices.data.find(inv => {
      const d = new Date(inv.created * 1000);
      return d.getMonth() === 3 && d.getFullYear() === 2026;
    });

    if (aprilInvoice) {
      // Fetch full invoice with expanded line items
      const fullInvoice = await stripe.invoices.retrieve(aprilInvoice.id, { expand: ['lines.data', 'discount', 'discounts'] });

      console.log('INVOICE HEADER:', JSON.stringify({
        id: fullInvoice.id,
        number: fullInvoice.number,
        status: fullInvoice.status,
        total: `฿${fullInvoice.total / 100}`,
        subtotal: `฿${fullInvoice.subtotal / 100}`,
        amount_due: `฿${fullInvoice.amount_due / 100}`,
        amount_paid: `฿${fullInvoice.amount_paid / 100}`,
        starting_balance: `฿${fullInvoice.starting_balance / 100}`,
        ending_balance: `฿${fullInvoice.ending_balance / 100}`,
        created: new Date(fullInvoice.created * 1000).toISOString(),
        billing_reason: fullInvoice.billing_reason,
      }, null, 2));

      console.log('\nLINE ITEMS:');
      fullInvoice.lines.data.forEach((line, i) => {
        console.log(`  ${i + 1}. ${line.description}`);
        console.log(`     Amount: ฿${line.amount / 100} | Qty: ${line.quantity} | Proration: ${line.proration}`);
        console.log(`     Price ID: ${line.price?.id}`);
        if (line.period) {
          console.log(`     Period: ${new Date(line.period.start * 1000).toISOString()} → ${new Date(line.period.end * 1000).toISOString()}`);
        }
        if (line.discount_amounts && line.discount_amounts.length > 0) {
          line.discount_amounts.forEach(da => console.log(`     Discount on line: ฿${da.amount / 100}`));
        }
      });

      console.log('\nDISCOUNT/COUPON:');
      if (fullInvoice.discount) {
        const d = fullInvoice.discount;
        console.log('⚠️ DISCOUNT FOUND:', JSON.stringify({
          coupon_id: d.coupon?.id,
          coupon_name: d.coupon?.name,
          percent_off: d.coupon?.percent_off,
          amount_off: d.coupon?.amount_off ? `฿${d.coupon.amount_off / 100}` : null,
          duration: d.coupon?.duration,
          start: d.start ? new Date(d.start * 1000).toISOString() : null,
          end: d.end ? new Date(d.end * 1000).toISOString() : null,
        }, null, 2));
      } else {
        console.log('No discount object on invoice');
      }

      if (fullInvoice.total_discount_amounts && fullInvoice.total_discount_amounts.length > 0) {
        console.log('TOTAL DISCOUNT AMOUNTS:');
        fullInvoice.total_discount_amounts.forEach(da => {
          console.log(`  ฿${da.amount / 100} from discount ${da.discount}`);
        });
      }

      console.log('\nBALANCE:');
      console.log(`  Starting: ฿${fullInvoice.starting_balance / 100}`);
      console.log(`  Ending: ฿${fullInvoice.ending_balance / 100}`);
      if (fullInvoice.starting_balance < 0) {
        console.log(`  ⚠️ Customer had ฿${Math.abs(fullInvoice.starting_balance / 100)} CREDIT applied`);
      }

      console.log('\nEXPECTED vs ACTUAL:');
      console.log(`  Expected (Protect monthly): ฿390`);
      console.log(`  Subtotal: ฿${fullInvoice.subtotal / 100}`);
      console.log(`  Total: ฿${fullInvoice.total / 100}`);
      console.log(`  Amount paid: ฿${fullInvoice.amount_paid / 100}`);
      console.log(`  Difference: ฿${390 - (fullInvoice.amount_paid / 100)}`);
    } else {
      console.log('❌ No April 2026 invoice found');
    }

    // STEP 6.6: March double charge investigation
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('STEP 6.6: MARCH DOUBLE CHARGE INVESTIGATION');
    console.log('═══════════════════════════════════════════════════════');

    const marchInvoices = invoices.data.filter(inv => {
      const d = new Date(inv.created * 1000);
      return d.getMonth() === 2 && d.getFullYear() === 2026;
    });

    console.log(`Found ${marchInvoices.length} March invoice(s)`);

    for (const inv of marchInvoices) {
      const fullMarch = await stripe.invoices.retrieve(inv.id, { expand: ['lines.data', 'discount'] });
      console.log(`\nMarch Invoice: ${fullMarch.id}`);
      console.log(`  Amount: ฿${fullMarch.amount_paid / 100} | Status: ${fullMarch.status}`);
      console.log(`  Created: ${new Date(fullMarch.created * 1000).toISOString()}`);
      console.log(`  Billing reason: ${fullMarch.billing_reason}`);
      console.log(`  Subscription: ${fullMarch.subscription}`);
      fullMarch.lines.data.forEach((line, i) => {
        console.log(`  Line ${i + 1}: ${line.description}`);
        console.log(`    Amount: ฿${line.amount / 100} | Proration: ${line.proration}`);
        console.log(`    Price: ${line.price?.id}`);
        if (line.period) {
          console.log(`    Period: ${new Date(line.period.start * 1000).toISOString()} → ${new Date(line.period.end * 1000).toISOString()}`);
        }
      });
      if (fullMarch.discount) {
        console.log(`  ⚠️ Discount: ${fullMarch.discount.coupon?.id} (${fullMarch.discount.coupon?.percent_off || fullMarch.discount.coupon?.amount_off})`);
      }
    }

    // STEP 6.7: Check subscription-level coupon
    console.log('\nSUBSCRIPTION COUPON CHECK:');
    if (activeSub.discount) {
      console.log('⚠️ COUPON ON SUBSCRIPTION:', JSON.stringify({
        coupon_id: activeSub.discount.coupon?.id,
        coupon_name: activeSub.discount.coupon?.name,
        percent_off: activeSub.discount.coupon?.percent_off,
        amount_off: activeSub.discount.coupon?.amount_off ? `฿${activeSub.discount.coupon.amount_off / 100}` : null,
        duration: activeSub.discount.coupon?.duration,
      }, null, 2));
    } else {
      console.log('No coupon on subscription');
    }

    // STEP 6.8: Check customer-level balance & coupon
    console.log('\nCUSTOMER BALANCE:', `฿${customer.balance / 100}`);
    if (customer.discount) {
      console.log('⚠️ COUPON ON CUSTOMER:', JSON.stringify({
        coupon_id: customer.discount.coupon?.id,
        percent_off: customer.discount.coupon?.percent_off,
        amount_off: customer.discount.coupon?.amount_off,
      }, null, 2));
    } else {
      console.log('No coupon on customer');
    }

    // STEP 6.9: Check all subscriptions (detect if there were two)
    console.log('\nALL SUBSCRIPTIONS (including cancelled):');
    subscriptions.data.forEach(s => {
      const item = s.items?.data?.[0];
      console.log(`  ${s.id} | Status: ${s.status} | Created: ${new Date(s.created * 1000).toISOString()} | Price: ${item?.price?.id} | Amount: ฿${(item?.price?.unit_amount || 0) / 100}/${item?.price?.recurring?.interval || '?'}`);
      if (s.canceled_at) console.log(`    Canceled at: ${new Date(s.canceled_at * 1000).toISOString()}`);
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
    
    // Build detailed invoice data for response
    const detailedInvoices = [];
    for (const inv of invoices.data.slice(0, 5)) {
      const full = await stripe.invoices.retrieve(inv.id, { expand: ['lines.data', 'discount'] });
      detailedInvoices.push({
        id: full.id,
        number: full.number,
        amount_paid: `฿${full.amount_paid / 100}`,
        subtotal: `฿${full.subtotal / 100}`,
        total: `฿${full.total / 100}`,
        starting_balance: `฿${full.starting_balance / 100}`,
        ending_balance: `฿${full.ending_balance / 100}`,
        billing_reason: full.billing_reason,
        subscription: full.subscription,
        created: new Date(full.created * 1000).toISOString(),
        discount: full.discount ? {
          coupon_id: full.discount.coupon?.id,
          coupon_name: full.discount.coupon?.name,
          percent_off: full.discount.coupon?.percent_off,
          amount_off: full.discount.coupon?.amount_off ? `฿${full.discount.coupon.amount_off / 100}` : null,
          duration: full.discount.coupon?.duration,
        } : null,
        line_items: full.lines.data.map(line => ({
          description: line.description,
          amount: `฿${line.amount / 100}`,
          proration: line.proration,
          price_id: line.price?.id,
          period_start: line.period ? new Date(line.period.start * 1000).toISOString() : null,
          period_end: line.period ? new Date(line.period.end * 1000).toISOString() : null,
        })),
      });
    }

    const allSubs = subscriptions.data.map(s => {
      const item = s.items?.data?.[0];
      return {
        id: s.id,
        status: s.status,
        created: new Date(s.created * 1000).toISOString(),
        canceled_at: s.canceled_at ? new Date(s.canceled_at * 1000).toISOString() : null,
        cancel_at_period_end: s.cancel_at_period_end,
        price_id: item?.price?.id,
        amount: `฿${(item?.price?.unit_amount || 0) / 100}/${item?.price?.recurring?.interval || '?'}`,
        product: item?.price?.product,
        discount: s.discount ? {
          coupon_id: s.discount.coupon?.id,
          percent_off: s.discount.coupon?.percent_off,
          amount_off: s.discount.coupon?.amount_off ? `฿${s.discount.coupon.amount_off / 100}` : null,
        } : null,
      };
    });

    return Response.json({
      success: true,
      investigation: {
        database: { email: dbUser.email, plan_tier: dbUser.plan_tier, subscription_status: dbUser.subscription_status, stripe_subscription_id: dbUser.stripe_subscription_id, stripe_price_id: dbUser.stripe_price_id },
        stripe: { customer_id: customer.id, subscription_id: activeSub.id, price_id: priceId, product_name: product.name, amount: `฿${amount}`, interval, status: activeSub.status },
        customer_balance: `฿${customer.balance / 100}`,
        customer_discount: customer.discount ? { coupon_id: customer.discount.coupon?.id, percent_off: customer.discount.coupon?.percent_off } : null,
        subscription_discount: activeSub.discount ? { coupon_id: activeSub.discount.coupon?.id, percent_off: activeSub.discount.coupon?.percent_off, amount_off: activeSub.discount.coupon?.amount_off } : null,
        all_subscriptions: allSubs,
        detailed_invoices: detailedInvoices,
        comparison,
        issues,
      }
    });
    
  } catch (error) {
    console.error('❌ INVESTIGATION ERROR:', error.message, error.stack);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});