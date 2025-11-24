import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';
import { getMembershipInfo, getResolvePricingForUser } from './getMembershipInfo.js';

/**
 * STRIPE RESOLVE CASE CHECKOUT CREATOR
 * 
 * Required Secrets:
 * - SK_TEST_secret_key: Stripe API key (sk_live_... for production)
 */

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), { // ⚠️ Name is misleading - should contain LIVE key for production
  apiVersion: '2024-06-20',
});

Deno.serve(async (req) => {
  console.log('[RESOLVE_CHECKOUT] Entry');
  
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

    if (!userId || !userEmail || !caseId) {
      console.error('[RESOLVE_CHECKOUT] Missing required fields');
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const membership = getMembershipInfo(user);
    const pricing = getResolvePricingForUser(user);
    const finalPriceType = pricing.priceType;
    const finalAmount = pricing.amount;
    
    if (finalPriceType !== priceType || finalAmount !== amount) {
      console.warn('[RESOLVE_CHECKOUT] Pricing mismatch - using server-calculated:', { 
        server: finalAmount, client: amount 
      });
    }

    console.log('[RESOLVE_CHECKOUT] Creating session for case:', caseId, '| Amount:', finalAmount);

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
      
      console.log('[RESOLVE_CHECKOUT] ✅ Session created:', session.id);
    } catch (stripeError) {
      console.error('[RESOLVE_CHECKOUT] Stripe error:', stripeError.message);
      throw stripeError;
    }

    return Response.json({
      url: session.url,
      sessionId: session.id,
      caseId: caseId,
    });
  } catch (error) {
    console.error('[RESOLVE_CHECKOUT] Failed:', error.message);
    return Response.json({ 
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
});