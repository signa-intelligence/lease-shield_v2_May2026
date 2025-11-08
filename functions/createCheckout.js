import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  const key = Deno.env.get('SK_TEST_secret_key');
  console.log('🔑 Using Stripe key:', key?.substring(0, 15));
  console.log('🔑 Key type:', key?.startsWith('sk_test_') ? 'TEST ✅' : 'LIVE ❌');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, mode, amount, currency, description, successUrl, cancelUrl, metadata } = await req.json();

    console.log('🔍 RAW PAYLOAD:', { priceId, mode, amount, currency, metadata });
    console.log('🔍 AMOUNT RECEIVED:', amount, 'TYPE:', typeof amount);
    console.log('🔍 WILL MULTIPLY:', amount, '* 100 =', Math.round(amount * 100));

    console.log('Creating checkout with:', { priceId, mode, amount, currency, user: user.email });

    let customerId = user.stripe_customer_id;
    
    if (!customerId) {
      console.log('Creating new Stripe customer for:', user.email);
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
      console.log('Created customer:', customerId);
      await base44.auth.updateMe({ stripe_customer_id: customerId });
    }

    const origin = new URL(req.url).origin.replace('/api/functions/createCheckout', '');
    
    // ✅ USE STATIC HTML PAGE FOR CREDITS
    const defaultSuccessUrl = metadata?.type === 'credits' 
      ? `${origin}/payment-success.html`
      : `${origin}/account?success=true`;
    const defaultCancelUrl = `${origin}/account?canceled=true`;

    const sessionConfig = {
      customer: customerId,
      mode: mode || 'subscription',
      success_url: successUrl || defaultSuccessUrl,
      cancel_url: cancelUrl || defaultCancelUrl,
      metadata: metadata || {},
      allow_promotion_codes: true,
    };

    if (mode === 'payment' && amount) {
      const finalAmount = Math.round(amount * 100);
      console.log('✅ FINAL AMOUNT TO STRIPE:', finalAmount, 'satang');
      
      sessionConfig.line_items = [{
        price_data: {
          currency: currency || 'thb',
          unit_amount: finalAmount,
          product_data: {
            name: description || 'Lease Shield Service',
            description: description || 'Professional service',
          },
        },
        quantity: 1,
      }];
    } else if (priceId) {
      console.log('Creating subscription session for price:', priceId);
      sessionConfig.line_items = [{ price: priceId, quantity: 1 }];
    } else {
      console.error('Missing priceId or amount');
      return Response.json({ error: 'Missing priceId or amount' }, { status: 400 });
    }

    console.log('Session config:', JSON.stringify(sessionConfig, null, 2));

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ Checkout session created:', session.id);

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('❌ Checkout creation error:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param
    });
    return Response.json({ 
      error: error.message,
      details: error.raw?.message || error.message,
      type: error.type || 'unknown',
      code: error.code || 'unknown'
    }, { status: 500 });
  }
});