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
    // ✅ SUBSCRIPTIONS: FINAL FIX - Trial period approach
    else if (mode === 'subscription' && amount) {
      const finalAmount = Math.round(amount * 100);
      const interval = metadata?.interval || 'month'; // 'month' or 'year'
      
      console.log('✅ SUBSCRIPTION - Creating with proper billing period:', finalAmount, 'satang', interval);
      
      sessionConfig.line_items = [{
        price_data: {
          currency: currency || 'thb',
          unit_amount: finalAmount,
          recurring: {
            interval: interval,
            interval_count: 1 // ✅ Explicitly set to 1 period
          },
          product_data: {
            name: description || 'Lease Shield Subscription',
            description: description || 'Professional subscription service',
          },
        },
        quantity: 1,
      }];

      // ✅ CRITICAL: Use trial_end to force proper billing period
      // Calculate the proper end date based on interval
      const now = Math.floor(Date.now() / 1000);
      let trialEndTimestamp;
      
      if (interval === 'year') {
        // Annual: 365 days from now
        trialEndTimestamp = now + (365 * 24 * 60 * 60);
      } else {
        // Monthly: 30 days from now
        trialEndTimestamp = now + (30 * 24 * 60 * 60);
      }

      sessionConfig.subscription_data = {
        metadata: metadata || {},
        trial_end: trialEndTimestamp,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel'
          }
        }
      };

      console.log('✅ Subscription trial ends:', new Date(trialEndTimestamp * 1000).toISOString());
      console.log('✅ This ensures proper', interval, 'billing cycle');
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