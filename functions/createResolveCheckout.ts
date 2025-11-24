import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';
import { getMembershipInfo, getResolvePricingForUser } from './getMembershipInfo.js';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2024-06-20',
});

Deno.serve(async (req) => {
  console.log('\n\n═══════════════════════════════════════');
  console.log('🔥 RESOLVE CHECKOUT FUNCTION ENTRY');
  console.log('═══════════════════════════════════════');
  
  const key = Deno.env.get('SK_TEST_secret_key');
  const isLiveMode = key?.startsWith('sk_live_');
  
  console.log('🔐 STRIPE_KEY_DIAGNOSTIC:', {
    exists: !!key,
    prefix: key?.slice(0, 7),
    isLive: isLiveMode,
    isTest: key?.startsWith('sk_test_')
  });
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user authentication
    const user = await base44.auth.me();
    if (!user) {
      console.error('❌ Authentication failed');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    const { userId, userEmail, caseId, priceType, amount } = await req.json();
    console.log('📦 RESOLVE_CHECKOUT_INPUT:', { 
      userId, 
      userEmail, 
      caseId, 
      priceType, 
      amount,
      timestamp: Date.now()
    });

    // Validate required fields
    if (!userId || !userEmail || !caseId) {
      console.error('[CREATE_CHECKOUT] Missing required fields');
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // BUG FIX #2: SERVER-SIDE PRICING VALIDATION using unified membership system
    // Re-calculate pricing on server to prevent tampering
    const membership = getMembershipInfo(user);
    const pricing = getResolvePricingForUser(user);
    
    console.log('[CREATE_CHECKOUT] Unified membership check:', {
      plan: membership.plan,
      membershipDays: membership.membershipDays,
      qualifiesForMemberBenefits: membership.qualifiesForMemberBenefits,
      reason: membership.reason,
      calculatedPriceType: pricing.priceType,
      calculatedAmount: pricing.amount,
      clientSentPriceType: priceType,
      clientSentAmount: amount
    });
    
    // Use SERVER-CALCULATED pricing (don't trust client)
    const finalPriceType = pricing.priceType;
    const finalAmount = pricing.amount;
    
    // Audit trail
    if (finalPriceType !== priceType || finalAmount !== amount) {
      console.warn('[CREATE_CHECKOUT] ⚠️ Client/server pricing mismatch - using server pricing:', {
        client: { priceType, amount },
        server: { finalPriceType, finalAmount }
      });
    }

    console.log('[CREATE_CHECKOUT] Creating Stripe session for case:', caseId);
    console.log('[CREATE_CHECKOUT] Final pricing:', { priceType: finalPriceType, amount: finalAmount });

    // ✅ TEST-TO-LIVE MIGRATION: Use customer_email instead of customer ID to avoid test/live mismatch
    // This forces Stripe to create or use the correct customer in the current mode
    console.log('[CREATE_CHECKOUT] Using customer_email (bypassing saved customer ID for test-to-live safety):', userEmail);

    // Create Stripe checkout session with SERVER-VALIDATED pricing
    let session;
    try {
      session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: `Resolve Case Service - ${finalPriceType === 'member' ? 'Member Rate' : 'Public Rate'}`,
              description: membership.plan === 'secure' 
                ? 'Professional case handling & legal support (Secure - immediate member rate)'
                : membership.qualifiesForMemberBenefits
                  ? `Professional case handling & legal support (${membership.plan.toUpperCase()} - member rate after 30 days)`
                  : 'Professional case handling & legal support (public rate)',
            },
            unit_amount: finalAmount * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'resolve_case',
        userId: userId,
        userEmail: userEmail,
        priceType: finalPriceType,
        amount: finalAmount.toString(),
        caseId: caseId,
        membershipPlan: membership.plan,
        membershipDays: membership.membershipDays.toString(),
        membershipReason: membership.reason
      },
      // ✅ Back to the REAL route your app actually has
      success_url: `${
        Deno.env.get('APP_URL') || 'https://app.leaseshield.asia'
      }/Cases?resolve_success=true&caseId=${caseId}`,
      cancel_url: `${
        Deno.env.get('APP_URL') || 'https://app.leaseshield.asia'
      }/Cases?resolve_cancelled=true&caseId=${caseId}`,
      });
      
      console.log('[CREATE_CHECKOUT] ✅ Stripe session created:', session.id);
    } catch (stripeError) {
      console.error('❌ STRIPE API ERROR IN RESOLVE CHECKOUT:', {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        param: stripeError.param,
        statusCode: stripeError.statusCode
      });
      throw stripeError;
    }

    console.log('═══════════════════════════════════════');
    console.log('✅ RESOLVE CHECKOUT COMPLETED');
    console.log('═══════════════════════════════════════\n\n');
    console.log('[CREATE_CHECKOUT] Success URL:', session.success_url);
    console.log('[CREATE_CHECKOUT] Metadata:', session.metadata);

    return Response.json({
      url: session.url,
      sessionId: session.id,
      caseId: caseId,
    });
  } catch (error) {
    console.error('\n\n❌❌❌ RESOLVE CHECKOUT FAILED ❌❌❌');
    console.error('Error Type:', error.type || 'unknown');
    console.error('Error Code:', error.code || 'unknown');
    console.error('Error Message:', error.message);
    console.error('Error Param:', error.param || 'none');
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════\n\n');
    
    const message =
      (error && typeof error === 'object' && 'message' in error
        ? error.message
        : 'Internal Server Error');
    return Response.json({ 
      error: message,
      type: error.type || 'unknown',
      code: error.code || 'unknown',
      diagnostic: 'Check resolve checkout logs for full details'
    }, { status: 500 });
  }
});