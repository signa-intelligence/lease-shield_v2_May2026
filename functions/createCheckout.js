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
      mode: mode || 'subscription',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: metadata || {},
      allow_promotion_codes: true,
    };

    // ✅ CREDITS: Dynamic one-time payment (already working)
    if (mode === 'payment' && amount) {
      const finalAmount = Math.round(amount * 100);
      console.log('✅ CREDITS - Creating dynamic one-time payment:', finalAmount, 'satang');
      
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
    // ✅ SUBSCRIPTIONS: Dynamic recurring price - FIXED!
    else if (mode === 'subscription' && amount) {
      const finalAmount = Math.round(amount * 100);
      const interval = metadata?.interval || 'month'; // 'month' or 'year'
      
      console.log('✅ SUBSCRIPTION - Creating dynamic recurring price:', finalAmount, 'satang', interval);
      
      sessionConfig.line_items = [{
        price_data: {
          currency: currency || 'thb',
          unit_amount: finalAmount,
          recurring: {
            interval: interval // 'month' or 'year'
          },
          product_data: {
            name: description || 'Lease Shield Subscription',
            description: description || 'Professional subscription service',
          },
        },
        quantity: 1,
      }];

      // ✅ CRITICAL FIX: Remove billing_cycle_anchor!
      // Let Stripe handle the billing cycle naturally based on the interval
      // The subscription will start immediately and renew based on interval
      sessionConfig.subscription_data = {
        metadata: metadata || {}
        // NO billing_cycle_anchor or proration_behavior
        // Stripe will automatically set current_period_end based on interval
      };

      console.log('✅ Subscription will start now and auto-calculate', interval, 'billing cycle');
    } 
    // ❌ OLD WAY: Pre-created price IDs (deprecated)
    else if (priceId) {
      console.log('⚠️ Using legacy priceId:', priceId);
      sessionConfig.line_items = [{ price: priceId, quantity: 1 }];
    } 
    else {
      console.error('❌ Missing required parameters');
      return Response.json({ error: 'Missing priceId or amount' }, { status: 400 });
    }

    console.log('Session config:', JSON.stringify(sessionConfig, null, 2));

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ Checkout session created:', session.id);
    console.log('✅ Checkout URL:', session.url);

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