import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2024-06-20',
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

    console.log('🔍 RAW PAYLOAD:', { priceId, mode, amount, currency, successUrl, cancelUrl, metadata });

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

    const finalSuccessUrl = successUrl || `https://app.leaseshield.asia/account?${mode === 'subscription' ? 'subscription=success' : 'payment=success'}`;
    const finalCancelUrl = cancelUrl || `https://app.leaseshield.asia/account?${mode === 'subscription' ? 'subscription=cancelled' : 'payment=cancelled'}`;
    
    console.log('✅ Using URLs:', { finalSuccessUrl, finalCancelUrl });

    const sessionConfig = {
      customer: customerId,
      client_reference_id: user.id,
      mode: mode || 'subscription',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      allow_promotion_codes: true,
    };

    // ✅ CREDITS: Dynamic one-time payment
    if (mode === 'payment' && amount) {
      const finalAmount = Math.round(amount * 100);
      console.log('✅ CREDITS - Creating one-time payment:', finalAmount, 'satang');
      
      sessionConfig.metadata = {
        ...(metadata || {}),
        userId: user.id,
        type: 'credits',
      };

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
    } 
    // ✅ SUBSCRIPTIONS: Pass explicit metadata
    else if (mode === 'subscription' && amount) {
      const finalAmount = Math.round(amount * 100);
      const planTier = (metadata?.plan || '').toLowerCase() || 'lite';
      const billingInterval = metadata?.interval === 'year' ? 'year' : 'month';
      
      console.log('✅ SUBSCRIPTION - Creating with metadata:', {
        userId: user.id,
        plan: planTier,
        interval: billingInterval,
        amount: finalAmount
      });
      
      sessionConfig.metadata = {
        userId: user.id,
        type: 'subscription',
        plan: planTier,
        interval: billingInterval,
      };

      sessionConfig.line_items = [{
        price_data: {
          currency: currency || 'thb',
          unit_amount: finalAmount,
          recurring: {
            interval: billingInterval,
            interval_count: 1
          },
          product_data: {
            name: description || 'Lease Shield Subscription',
            description: description || 'Professional subscription service',
          },
        },
        quantity: 1,
      }];

      sessionConfig.subscription_data = {
        metadata: {
          userId: user.id,
          plan: planTier,
          interval: billingInterval,
        }
      };

      console.log('✅ Subscription metadata set:', sessionConfig.metadata);
    } 
    // ❌ Legacy price IDs (deprecated)
    else if (priceId) {
      console.log('⚠️ Using legacy priceId:', priceId);
      sessionConfig.metadata = metadata || {};
      sessionConfig.line_items = [{ price: priceId, quantity: 1 }];
    } 
    else {
      console.error('❌ Missing required parameters');
      return Response.json({ error: 'Missing priceId or amount' }, { status: 400 });
    }

    console.log('📤 Creating session with config:', JSON.stringify(sessionConfig, null, 2));

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ Checkout session created:', session.id);
    console.log('✅ URL:', session.url);

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