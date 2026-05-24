import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

/**
 * STRIPE RESOLVE CASE CHECKOUT CREATOR
 * 
 * Required Secrets:
 * - STRIPE_SECRET_KEY: Stripe live API key (sk_live_...)
 */

// Inlined membership logic (no local imports allowed in Deno functions)
const RESOLVE_PRICING = {
  PUBLIC_RATE: 3990,
  MEMBER_RATE: 2490,
};

function getMembershipInfo(user, now = new Date()) {
  if (!user) {
    return { plan: 'free', membershipDays: 0, isPaidPlan: false, qualifiesForMemberBenefits: false, reason: 'not_logged_in', daysUntilMemberBenefits: null };
  }
  const plan = user.plan_tier || 'free';
  const isPaidPlan = ['lite', 'protect', 'secure'].includes(plan);
  let membershipDays = 0;
  if (user.plan_started_at) {
    membershipDays = Math.floor((now - new Date(user.plan_started_at)) / (1000 * 60 * 60 * 24));
  }
  let qualifiesForMemberBenefits = false;
  let reason = '';
  let daysUntilMemberBenefits = null;
  if (plan === 'secure') {
    qualifiesForMemberBenefits = true;
    reason = 'secure_immediate';
  } else if (plan === 'lite' || plan === 'protect') {
    if (membershipDays >= 30) {
      qualifiesForMemberBenefits = true;
      reason = 'qualified_30_days';
    } else {
      reason = 'insufficient_membership_duration';
      daysUntilMemberBenefits = 30 - membershipDays;
    }
  } else {
    reason = 'not_on_paid_plan';
  }
  return { plan, membershipDays, isPaidPlan, qualifiesForMemberBenefits, reason, daysUntilMemberBenefits };
}

function getResolvePricingForUser(user) {
  const membership = getMembershipInfo(user);
  return {
    priceType: membership.qualifiesForMemberBenefits ? 'member' : 'public',
    amount: membership.qualifiesForMemberBenefits ? RESOLVE_PRICING.MEMBER_RATE : RESOLVE_PRICING.PUBLIC_RATE,
    membershipInfo: membership
  };
}

Deno.serve(async (req) => {
  console.log('[createResolveCheckout] Function hit. Body:', JSON.stringify(await req.clone().json().catch(() => 'parse error')));
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

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20',
    });

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
        success_url: `${Deno.env.get('APP_URL') || 'https://app.leaseshield.asia'}/Cases?resolve_success=true&caseId=${caseId}`,
        cancel_url: `${Deno.env.get('APP_URL') || 'https://app.leaseshield.asia'}/Cases?resolve_cancelled=true&caseId=${caseId}`,
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