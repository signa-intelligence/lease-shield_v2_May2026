import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.10.0';
import { requireAuth, safeLog } from './authGuards.js';
import { enforceRateLimit } from './rateLimiter.js';
import { handleCors, ensureAllowedOrigin, err, requireRecentAuth } from './http.js';

/**
 * STRIPE CHECKOUT CREATOR - Standalone, no external dependencies
 * 
 * Required Secrets:
 * - SK_TEST_secret_key: Stripe API key (sk_live_... for production)
 * 
 * CRITICAL: This function must NOT depend on any other functions or deployments
 * to avoid "deploymentNotFound" errors.
 */

Deno.serve(async (req) => {
  const pre = handleCors(req); if (pre) return pre;
  const { allowed, requestId } = ensureAllowedOrigin(req); if (!allowed) return err(req, 'CORS_FORBIDDEN', 'Origin not allowed', 403, requestId);
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

  await safeLog('CREATE_CHECKOUT_START', { 
    mode: stripeKey?.startsWith('sk_live_') ? 'LIVE' : 'TEST',
    timestamp: new Date().toISOString()
  });
  
  try {
    // SECURITY FIX: Authenticate user
    const { user, base44 } = await requireAuth(req);
    
    // SECURITY FIX: Enforce rate limiting
    await enforceRateLimit(user.id, 'createCheckout', base44);

    const { priceId, mode, amount, currency, description, successUrl, cancelUrl, metadata } = await req.json();

    await safeLog('CREATE_CHECKOUT_PARAMS', { 
      userId: user.id,
      mode, 
      amount, 
      currency
    });

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;
    const isLiveMode = stripeKey?.startsWith('sk_live_');
    
    await safeLog('CHECKOUT_CUSTOMER_RESOLUTION', {
      hasCustomerId: !!customerId,
      mode: isLiveMode ? 'LIVE' : 'TEST'
    });
    
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
        metadata: { 
          user_id: user.id,
          referral_code: user.referral_code || '',
          referred_by: user.referred_by || ''
        }
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

    // ========================================
    // PAYMENT: One-time payments (Credits OR One-Time Scan)
    // ========================================
    if (mode === 'payment' && amount) {
      const finalAmount = Math.round(amount * 100);
      const paymentType = metadata?.type || 'credits';
      
      console.log('[CREATE_CHECKOUT] 💰 PAYMENT MODE:', paymentType);
      console.log(`  Amount: ${amount} THB → ${finalAmount} satang`);
      
      if (paymentType === 'one_time_scan') {
        // One-Time Lease Scan product
        console.log('[CREATE_CHECKOUT] 📄 ONE-TIME LEASE SCAN');
        
        sessionConfig.metadata = {
          type: 'one_time_scan',
          userId: user.id,
          email: user.email,
        };

        sessionConfig.line_items = [{
          price_data: {
            currency: currency || 'thb',
            unit_amount: finalAmount,
            product_data: {
              name: description || 'One-Time Lease Scan',
              description: 'AI analysis + human review + risk score + recommendations',
            },
          },
          quantity: 1,
        }];
      } else {
        // Letter Credits
        const creditsCount = metadata?.credits || 1;
        console.log('[CREATE_CHECKOUT] 💌 LETTER CREDITS:', creditsCount);
        
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
      }

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
          referredBy: user.referred_by || null,
          referralCode: user.referral_code || null
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
    if (error.message === 'UNAUTHORIZED') {
      return err(req, 'UNAUTHORIZED', 'Unauthorized', 401);
    }
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      return Response.json({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: error.retryAfter
      }, { status: 429 });
    }
    
    // SECURITY FIX: Don't expose detailed error info to client
    console.error('[CREATE_CHECKOUT_ERROR]', { 
      error: error.message, 
      code: error.code,
      stack: error.stack?.substring(0, 200)
    });
    
    return err(req, 'CHECKOUT_FAILED', 'Checkout creation failed. Please try again.', 500);
  }
});