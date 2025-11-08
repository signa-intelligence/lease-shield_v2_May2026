import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

// === FORCED REDEPLOY - DECEMBER 2024 - USING TEST KEY ===
const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  // Log the key being used (first 15 chars for debugging)
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

    console.log('Creating checkout with:', { priceId, mode, amount, currency, user: user.email });

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;
    
    if (!customerId) {
      console.log('Creating new Stripe customer for:', user.email);
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          user_id: user.id
        }
      });
      customerId = customer.id;
      console.log('Created customer:', customerId);
      
      await base44.auth.updateMe({ stripe_customer_id: customerId });
    }

    // Get origin from request for fallback URLs
    const origin = new URL(req.url).origin.replace('/api/functions/createCheckout', '');
    const defaultSuccessUrl = `${origin}/account?success=true`;
    const defaultCancelUrl = `${origin}/account?canceled=true`;

    // Build session config based on mode
    const sessionConfig = {
      customer: customerId,
      mode: mode || 'subscription',
      success_url: successUrl || defaultSuccessUrl,
      cancel_url: cancelUrl || defaultCancelUrl,
      metadata: metadata || {},
      allow_promotion_codes: true,
    };

    // Handle subscription vs one-time payment
    if (mode === 'payment' && amount) {
      console.log('Creating one-time payment session for amount:', amount);
      sessionConfig.line_items = [
        {
          price_data: {
            currency: currency || 'thb',
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: description || 'Lease Shield Resolve Service',
              description: description || 'Professional dispute resolution service',
            },
          },
          quantity: 1,
        },
      ];
    } else if (priceId) {
      console.log('Creating subscription session for price:', priceId);
      sessionConfig.line_items = [
        {
          price: priceId,
          quantity: 1,
        },
      ];
    } else {
      console.error('Missing priceId or amount');
      return Response.json({ error: 'Missing priceId or amount' }, { status: 400 });
    }

    console.log('Session config:', JSON.stringify(sessionConfig, null, 2));

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('Checkout session created:', session.id, 'URL:', session.url);

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout creation error:', error);
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