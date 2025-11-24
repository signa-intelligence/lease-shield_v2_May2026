import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2024-06-20',
});

Deno.serve(async (req) => {
  console.log('\n\n═══════════════════════════════════════');
  console.log('🔥 CHECKOUT FUNCTION ENTRY - DIAGNOSTICS ENABLED');
  console.log('═══════════════════════════════════════');
  
  const key = Deno.env.get('SK_TEST_secret_key');
  
  console.log('🔐 STRIPE_KEY_DIAGNOSTIC:', {
    exists: !!key,
    prefix: key?.slice(0, 7),
    isLive: key?.startsWith('sk_live_'),
    isTest: key?.startsWith('sk_test_'),
    length: key?.length || 0
  });
  
  if (!key) {
    console.error('❌ CRITICAL: SK_TEST_secret_key is NULL or UNDEFINED');
    return Response.json({ 
      error: 'Stripe secret key not configured',
      diagnostic: 'SK_TEST_secret_key environment variable is missing'
    }, { status: 500 });
  }
  
  console.log('🔑 Key type:', key.startsWith('sk_live_') ? 'LIVE ✅' : key.startsWith('sk_test_') ? 'TEST ⚠️' : 'UNKNOWN ❌');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('❌ Authentication failed - no user');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    const { priceId, mode, amount, currency, description, successUrl, cancelUrl, metadata } = await req.json();

    console.log('📦 CHECKOUT_INPUT:', { 
      priceId, 
      mode, 
      amount, 
      currency, 
      user: user.email,
      metadata,
      timestamp: Date.now()
    });

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

    // ✅ IMPROVED: Redirect logic based on mode
    const finalSuccessUrl = successUrl || (
      mode === 'subscription' 
        ? `https://app.leaseshield.asia/account?subscription=success`
        : `https://app.leaseshield.asia/templates?payment=success`
    );
    const finalCancelUrl = cancelUrl || (
      mode === 'subscription'
        ? `https://app.leaseshield.asia/account?subscription=cancelled`
        : `https://app.leaseshield.asia/templates?payment=cancelled`
    );
    
    console.log('✅ Using URLs:', { finalSuccessUrl, finalCancelUrl });

    const sessionConfig = {
      customer: customerId,
      client_reference_id: user.id,
      mode: mode || 'subscription',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      allow_promotion_codes: true,
    };

    // ========================================
    // CREDITS: One-time payment with PromptPay
    // ========================================
    if (mode === 'payment' && amount) {
      const finalAmount = Math.round(amount * 100);
      console.log('✅ CREDITS - Creating one-time payment:', finalAmount, 'satang');
      
      sessionConfig.metadata = {
        type: 'credits',
        userId: user.id,
        email: user.email,
        credits: metadata?.credits || 1,
      };

      sessionConfig.line_items = [{
        price_data: {
          currency: currency || 'thb',
          unit_amount: finalAmount,
          product_data: {
            name: description || 'Letter Credits',
            description: description || 'Lease Shield Letter Credits',
          },
        },
        quantity: 1,
      }];

      // ✅ ENABLE CARD + PROMPTPAY FOR ONE-TIME PAYMENTS
      sessionConfig.payment_method_types = ['card', 'promptpay'];

      console.log('💰 Credits checkout metadata:', sessionConfig.metadata);
      console.log('💳 Payment methods: card, promptpay');
    } 
    // ========================================
    // SUBSCRIPTIONS: Card only (PromptPay not supported)
    // ========================================
    else if (mode === 'subscription' && amount) {
      const finalAmount = Math.round(amount * 100);
      const planTier = (metadata?.plan || 'lite').toLowerCase();
      const intervalRaw = metadata?.interval || 'monthly';
      const billingInterval = intervalRaw === 'year' || intervalRaw === 'annual' ? 'annual' : 'monthly';
      
      console.log('✅ SUBSCRIPTION - Creating with explicit metadata:', {
        userId: user.id,
        email: user.email,
        plan: planTier,
        interval: billingInterval,
        amount: finalAmount
      });
      
      sessionConfig.metadata = {
        type: 'subscription',
        userId: user.id,
        email: user.email,
        plan: planTier,
        interval: billingInterval,
      };

      sessionConfig.line_items = [{
        price_data: {
          currency: currency || 'thb',
          unit_amount: finalAmount,
          recurring: {
            interval: intervalRaw === 'year' || intervalRaw === 'annual' ? 'year' : 'month',
            interval_count: 1
          },
          product_data: {
            name: description || `Lease Shield ${planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan`,
            description: description || 'Professional subscription service',
          },
        },
        quantity: 1,
      }];

      sessionConfig.subscription_data = {
        metadata: {
          type: 'subscription',
          userId: user.id,
          email: user.email,
          plan: planTier,
          interval: billingInterval,
        }
      };

      // ✅ CARD ONLY FOR SUBSCRIPTIONS (PromptPay doesn't support recurring)
      sessionConfig.payment_method_types = ['card'];

      console.log('✅ Session metadata:', sessionConfig.metadata);
      console.log('✅ Subscription_data metadata:', sessionConfig.subscription_data.metadata);
      console.log('💳 Payment methods: card only');
    } 
    // ========================================
    // Legacy price IDs (deprecated)
    // ========================================
    else if (priceId) {
      console.log('⚠️ Using legacy priceId:', priceId);
      sessionConfig.metadata = {
        userId: user.id,
        email: user.email,
        ...(metadata || {}),
      };
      sessionConfig.line_items = [{ price: priceId, quantity: 1 }];
    } 
    else {
      console.error('❌ Missing required parameters');
      return Response.json({ error: 'Missing priceId or amount' }, { status: 400 });
    }

    console.log('📤 Creating Stripe session...');
    console.log('SessionConfig:', JSON.stringify(sessionConfig, null, 2));

    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionConfig);
      console.log('✅ Stripe session created successfully:', session.id);
      console.log('✅ Checkout URL:', session.url);
    } catch (stripeError) {
      console.error('❌ STRIPE API ERROR:', {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        param: stripeError.param,
        statusCode: stripeError.statusCode,
        raw: stripeError.raw
      });
      throw stripeError;
    }

    console.log('═══════════════════════════════════════');
    console.log('✅ CHECKOUT COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════\n\n');

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('\n\n❌❌❌ CHECKOUT FUNCTION FAILED ❌❌❌');
    console.error('Error Type:', error.type || 'unknown');
    console.error('Error Code:', error.code || 'unknown');
    console.error('Error Message:', error.message);
    console.error('Error Param:', error.param || 'none');
    console.error('Full Error Object:', JSON.stringify(error, null, 2));
    console.error('Stack Trace:', error.stack);
    console.error('═══════════════════════════════════════\n\n');
    
    return Response.json({ 
      error: error.message || 'Checkout creation failed',
      details: error.raw?.message || error.message,
      type: error.type || 'unknown',
      code: error.code || 'unknown',
      param: error.param || 'none',
      diagnostic: 'Check function logs for full details'
    }, { status: 500 });
  }
});