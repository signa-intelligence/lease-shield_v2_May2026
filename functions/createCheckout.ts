import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-06-20',
});

Deno.serve(async (req) => {
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  console.log('🔑 Using Stripe key:', key?.substring(0, 15));
  console.log('🔑 Key type:', key?.startsWith('sk_live_') ? 'LIVE ✅' : 'TEST ❌');
  
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