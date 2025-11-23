import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2024-06-20',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🛡️ Creating Resolve checkout for user:', user.email);

    // Determine pricing (member vs public)
    const planTier = user.plan_tier;
    const isPaidTier = planTier && planTier !== 'free';
    const memberSinceDate = user.member_since || user.subscription_started_at;
    
    let membershipDays = 0;
    if (memberSinceDate) {
      const diffTime = new Date() - new Date(memberSinceDate);
      membershipDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
    
    const isMemberPricing = isPaidTier && 
                            membershipDays >= 30 && 
                            (!user.subscription_status || user.subscription_status === 'active');
    
    const price = isMemberPricing ? 2490 : 3990;
    const priceType = isMemberPricing ? 'member' : 'public';

    console.log('💰 Pricing:', { price, priceType, isPaidTier, membershipDays });

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
      await base44.auth.updateMe({ stripe_customer_id: customerId });
      console.log('✅ Created customer:', customerId);
    }

    // Create a provisional case record to link payment
    const provisionalCase = await base44.asServiceRole.entities.Case.create({
      user_email: user.email,
      status: 'awaiting_payment',
      case_price: price,
      pricing_type: priceType,
      is_member_at_creation: isMemberPricing,
      timeline: [{
        timestamp: new Date().toISOString(),
        event: 'Payment initiated',
        actor: 'system'
      }]
    });

    console.log('📋 Created provisional case:', provisionalCase.id);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id,
      mode: 'payment',
      payment_method_types: ['card', 'promptpay'],
      line_items: [{
        price_data: {
          currency: 'thb',
          unit_amount: price * 100,
          product_data: {
            name: 'Resolve Case Service',
            description: `Professional dispute resolution - ${priceType} rate`,
          },
        },
        quantity: 1,
      }],
      success_url: `https://app.leaseshield.asia/ResolveCase?session_id={CHECKOUT_SESSION_ID}&case_id=${provisionalCase.id}`,
      cancel_url: 'https://app.leaseshield.asia/Dashboard',
      metadata: {
        type: 'resolve_case',
        user_id: user.id,
        user_email: user.email,
        case_id: provisionalCase.id,
        price_type: priceType,
        amount: price
      }
    });

    console.log('✅ Checkout session created:', session.id);
    return Response.json({ url: session.url, caseId: provisionalCase.id });

  } catch (error) {
    console.error('❌ Error creating Resolve checkout:', error);
    return Response.json({ 
      error: error.message,
      details: error.raw?.message || error.message
    }, { status: 500 });
  }
});