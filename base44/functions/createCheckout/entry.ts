import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.10.0';

/**
 * STRIPE CHECKOUT CREATOR - Truly standalone, zero local imports
 * 
 * FIX (2026-03-04): Removed all local file imports (authGuards, rateLimiter, http, cors)
 * that caused "deploymentNotFound" 404 errors. All helpers are now inlined.
 * 
 * Required Secrets:
 * - SK_TEST_secret_key: Stripe API key
 */

// ════════════════════════════════════════
// INLINED: CORS helpers (from cors.js)
// ════════════════════════════════════════
const ALLOWED_ORIGINS = [
  'https://app.leaseshield.asia',
  'http://localhost:5173',
  'http://localhost:3000'
];

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.hostname.endsWith('.base44.app')) return true;
  } catch (_) {}
  return false;
}

function buildCorsHeaders(origin) {
  const headers = new Headers();
  headers.set('Vary', 'Origin');
  if (origin && isAllowedOrigin(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Recent-Auth');
  headers.set('Access-Control-Max-Age', '600');
  return headers;
}

function handleCors(req) {
  const origin = req.headers.get('origin') || '';
  const method = req.method.toUpperCase();
  const headers = buildCorsHeaders(origin);
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  return null;
}

function corsJson(req, payload, status = 200) {
  const origin = req.headers.get('origin') || '';
  const headers = buildCorsHeaders(origin);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(payload), { status, headers });
}

function err(req, errorCode, message, status = 400, requestId) {
  const rid = requestId || crypto.randomUUID().slice(0, 8);
  return corsJson(req, { errorCode, message, requestId: rid }, status);
}

// ════════════════════════════════════════
// INLINED: Auth helper (from authGuards.js)
// ════════════════════════════════════════
async function requireAuth(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return { user, base44 };
}

// ════════════════════════════════════════
// MAIN HANDLER
// ════════════════════════════════════════
Deno.serve(async (req) => {
  const pre = handleCors(req);
  if (pre) return pre;

  const origin = req.headers.get('origin') || '';
  // Only enforce CORS for browser requests (with Origin header)
  // Server-to-server calls (webhooks, test tool) won't have Origin
  if (origin && !isAllowedOrigin(origin)) {
    return err(req, 'CORS_FORBIDDEN', 'Origin not allowed', 403);
  }

  const stripeKey = Deno.env.get('SK_TEST_secret_key');
  
  if (!stripeKey) {
    console.error('[CREATE_CHECKOUT] ❌ CRITICAL: SK_TEST_secret_key not configured');
    return corsJson(req, { error: 'Stripe not configured', code: 'stripe_key_missing' }, 500);
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-06-20',
  });

  const isLiveMode = stripeKey?.startsWith('sk_live_');
  console.log('[CREATE_CHECKOUT_START]', { mode: isLiveMode ? 'LIVE' : 'TEST' });
  
  try {
    const { user, base44 } = await requireAuth(req);

    const { priceId, mode, amount, currency, description, successUrl, cancelUrl, metadata } = await req.json();

    console.log('[CREATE_CHECKOUT_PARAMS]', { 
      userId: user.id,
      mode, 
      amount, 
      currency,
      plan: metadata?.plan
    });

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;
    
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
      
      if (paymentType === 'one_time_scan') {
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
        const creditsCount = metadata?.credits || 1;
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

      sessionConfig.payment_method_types = ['card'];
    } 
    // ========================================
    // SUBSCRIPTIONS: Card only (PromptPay not supported)
    // ========================================
    else if (mode === 'subscription' && amount) {
      const finalAmount = Math.round(amount * 100);
      const planTier = (metadata?.plan || 'lite').toLowerCase();
      const intervalRaw = metadata?.interval || 'monthly';
      const billingInterval = intervalRaw === 'year' || intervalRaw === 'annual' ? 'annual' : 'monthly';
      
      console.log('✅ SUBSCRIPTION:', { plan: planTier, interval: billingInterval, amount: finalAmount });
      
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

      sessionConfig.payment_method_types = ['card'];
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
      return corsJson(req, { error: 'Missing priceId or amount' }, 400);
    }

    console.log('[CREATE_CHECKOUT] 🚀 Creating Stripe Checkout Session...');

    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionConfig);
      console.log('[CREATE_CHECKOUT] ✅ SUCCESS - Session:', session.id);
      console.log('[CREATE_CHECKOUT] URL:', session.url);
    } catch (stripeError) {
      console.error('[CREATE_CHECKOUT] ❌ STRIPE ERROR:', stripeError.type, stripeError.code, stripeError.message);
      throw stripeError;
    }

    return corsJson(req, { url: session.url });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return err(req, 'UNAUTHORIZED', 'Unauthorized', 401);
    }
    
    console.error('[CREATE_CHECKOUT_ERROR]', { 
      error: error.message, 
      code: error.code,
      type: error.type
    });
    
    return err(req, 'CHECKOUT_FAILED', 'Checkout creation failed. Please try again.', 500);
  }
});