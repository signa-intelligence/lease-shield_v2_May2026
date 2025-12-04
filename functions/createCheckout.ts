import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

/**
 * STRIPE CHECKOUT CREATOR - Standalone, no external dependencies
 * 
 * Required Secrets:
 * - SK_TEST_secret_key: Stripe API key (sk_live_... for production)
 * 
 * CRITICAL: This function must NOT depend on any other functions or deployments
 * to avoid "deploymentNotFound" errors.
 */

// Helper: Create one-time coupon for reward credits
async function createRewardCoupon(stripe, amountOffCents) {
  const coupon = await stripe.coupons.create({
    amount_off: amountOffCents,
    currency: 'thb',
    duration: 'once',
    name: 'Referral Reward Credit',
  });
  return coupon.id;
}

Deno.serve(async (req) => {
  const stripeKey = Deno.env.get('SK_TEST_secret_key');
  
  if (!stripeKey) {
    console.error('[CREATE_CHECKOUT] ❌ CRITICAL: SK_TEST_secret_key not configured');
    return Response.json({ 
      error: 'Stripe not configured',
      code: 'stripe_key_missing'
    }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-06-20',
  });

  console.log('\n\n═══════════════════════════════════════');
  console.log('🔥 CREATE_CHECKOUT - Entry');
  console.log('═══════════════════════════════════════');
  console.log('[CREATE_CHECKOUT] Timestamp:', new Date().toISOString());
  console.log('[CREATE_CHECKOUT] Stripe mode:', stripeKey?.startsWith('sk_live_') ? '🟢 LIVE' : stripeKey?.startsWith('sk_test_') ? '🟡 TEST' : '❌ INVALID');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('[CREATE_CHECKOUT] ❌ No authenticated user');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CREATE_CHECKOUT] ✅ User:', user.email, '| ID:', user.id);

    const { priceId, mode, amount, currency, description, successUrl, cancelUrl, metadata } = await req.json();

    console.log('[CREATE_CHECKOUT] 📦 Request payload:', JSON.stringify({ 
      priceId, 
      mode, 
      amount, 
      currency, 
      description,
      metadata
    }, null, 2));

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;
    const isLiveMode = stripeKey?.startsWith('sk_live_');
    
    console.log('[CREATE_CHECKOUT] Customer resolution:', {
      savedCustomerId: customerId?.substring(0, 20) || 'none',
      mode: isLiveMode ? 'LIVE' : 'TEST'
    });

    // Apply reward credits to subscription/payment if available
    let appliedCredit = 0;
    if (user.reward_credit_balance && user.reward_credit_balance > 0 && amount) {
      const invoiceAmount = Math.round(amount * 100); // Convert to cents
      const availableCredit = Math.round(user.reward_credit_balance * 100);
      appliedCredit = Math.min(availableCredit, invoiceAmount);
      
      console.log('[CREATE_CHECKOUT] 💰 Applying reward credits:', {
        availableBalance: user.reward_credit_balance,
        invoiceAmount: amount,
        creditToApply: appliedCredit / 100
      });
    }
    
    // Validate customer exists in current mode
    if (customerId && isLiveMode) {
      try {
        await stripe.customers.retrieve(customerId);
        console.log('[CREATE_CHECKOUT] ✅ Customer validated:', customerId.substring(0, 20));
      } catch (customerError) {
        if (customerError.code === 'resource_missing') {
          console.warn('[CREATE_CHECKOUT] ⚠️ Customer not found in LIVE - creating new');
          customerId = null;
        } else {
          throw customerError;
        }
      }
    }
    
    if (!customerId) {
      console.log('[CREATE_CHECKOUT] Creating new Stripe customer...');
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
      console.log('[CREATE_CHECKOUT] ✅ Customer created:', customerId);
      await base44.auth.updateMe({ stripe_customer_id: customerId });
    }

    // Success/Cancel URLs
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
    
    console.log('[CREATE_CHECKOUT] URLs configured:', {
      success: finalSuccessUrl,
      cancel: finalCancelUrl
    });

    const sessionConfig = {
      customer: customerId,
      client_reference_id: user.id,
      mode: mode || 'subscription',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      allow_promotion_codes: true,
    };

    // Apply discounts from reward credits if available
    if (appliedCredit > 0) {
      sessionConfig.discounts = [{
        coupon: await createRewardCoupon(stripe, appliedCredit)
      }];
      
      // Deduct applied credit from user's balance
      const newRewardBalance = user.reward_credit_balance - (appliedCredit / 100);
      await base44.auth.updateMe({ reward_credit_balance: newRewardBalance });
      
      console.log('[CREATE_CHECKOUT] ✅ Applied ฿' + (appliedCredit / 100) + ' credit');
      console.log('[CREATE_CHECKOUT] New reward balance:', newRewardBalance);
    }

    // ========================================
    // CREDITS: One-time payment
    // ========================================
    if (mode === 'payment' && amount) {
      const finalAmount = Math.round(amount * 100);
      const creditsCount = metadata?.credits || 1;
      
      console.log('[CREATE_CHECKOUT] 💰 CREDITS MODE:');
      console.log(`  Amount: ${amount} THB → ${finalAmount} satang`);
      console.log(`  Credits: ${creditsCount}`);
      
      sessionConfig.metadata = {
        type: 'credits',
        userId: user.id,
        email: user.email,
        credits: creditsCount.toString(),
      };

      sessionConfig.line_items = [{
        price_data: {
          currency: currency || 'thb',
          unit_amount: finalAmount,
          product_data: {
            name: description || `${creditsCount} Letter Credit${creditsCount > 1 ? 's' : ''}`,
            description: 'Lease Shield Letter Credits',
          },
        },
        quantity: 1,
      }];

      sessionConfig.payment_method_types = ['card', 'promptpay'];

      console.log('[CREATE_CHECKOUT] Session metadata:', JSON.stringify(sessionConfig.metadata, null, 2));
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

    console.log('[CREATE_CHECKOUT] 🚀 Creating Stripe Checkout Session...');
    console.log('[CREATE_CHECKOUT] Full config:', JSON.stringify(sessionConfig, null, 2));

    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionConfig);
      console.log('[CREATE_CHECKOUT] ✅✅✅ SUCCESS ✅✅✅');
      console.log('[CREATE_CHECKOUT] Session ID:', session.id);
      console.log('[CREATE_CHECKOUT] Checkout URL:', session.url);
      console.log('[CREATE_CHECKOUT] Mode:', session.mode);
      console.log('[CREATE_CHECKOUT] Metadata:', JSON.stringify(session.metadata, null, 2));
    } catch (stripeError) {
      console.error('[CREATE_CHECKOUT] ❌❌❌ STRIPE ERROR ❌❌❌');
      console.error('[CREATE_CHECKOUT] Type:', stripeError.type);
      console.error('[CREATE_CHECKOUT] Code:', stripeError.code);
      console.error('[CREATE_CHECKOUT] Message:', stripeError.message);
      console.error('[CREATE_CHECKOUT] Param:', stripeError.param);
      console.error('[CREATE_CHECKOUT] Full error:', JSON.stringify(stripeError, null, 2));
      throw stripeError;
    }

    console.log('[CREATE_CHECKOUT] ═══════════════════════════════════════\n');

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('\n[CREATE_CHECKOUT] ❌❌❌ FATAL ERROR ❌❌❌');
    console.error('[CREATE_CHECKOUT] Type:', error.type || typeof error);
    console.error('[CREATE_CHECKOUT] Code:', error.code || 'none');
    console.error('[CREATE_CHECKOUT] Message:', error.message);
    console.error('[CREATE_CHECKOUT] Stack:', error.stack);
    console.error('[CREATE_CHECKOUT] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('[CREATE_CHECKOUT] ═══════════════════════════════════════\n');
    
    return Response.json({ 
      error: error.message || 'Checkout creation failed',
      code: error.code || 'unknown_error',
      type: error.type || 'internal_error',
      details: error.raw?.message || error.message,
      diagnostic: 'See createCheckout logs for full error trace'
    }, { status: 500 });
  }
});