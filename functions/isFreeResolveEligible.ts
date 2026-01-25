import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// HARDCODED SECURE PRICE IDs - SOURCE OF TRUTH
const STRIPE_PRICE_SECURE_ANNUAL = 'price_1SbtaWQwol6NhlUxAfPLTDeE';
const STRIPE_PRICE_SECURE_MONTHLY = 'price_1RG7oMQwol6NhlUxtV2nkGmL';

// GRACE PERIOD - ANTI-ABUSE MEASURE
const FREE_RESOLVE_GRACE_PERIOD_DAYS = 7;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();
    const targetUserId = userId || user.id;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 [FREE_RESOLVE_CHECK] Starting eligibility check');
    console.log('User ID:', targetUserId);

    // Step 1: Sync latest Stripe data
    console.log('📡 [FREE_RESOLVE_CHECK] Syncing Stripe subscription...');
    const syncResponse = await base44.functions.invoke('syncStripeSubscription', { userId: targetUserId });
    
    if (!syncResponse.data?.success) {
      console.log('⚠️ [FREE_RESOLVE_CHECK] Stripe sync failed or no subscription');
      return Response.json({
        eligible: false,
        reason: 'no_subscription',
        message: 'No active subscription found'
      });
    }

    // Step 2: Fetch updated user data
    const targetUser = await base44.asServiceRole.entities.User.filter({ id: targetUserId });
    if (!targetUser || targetUser.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = targetUser[0];

    console.log('📊 [FREE_RESOLVE_CHECK] User subscription data:', {
      stripe_status: userData.stripe_status,
      stripe_price_id: userData.stripe_price_id,
      cancel_at_period_end: userData.cancel_at_period_end,
      current_period_start: userData.current_period_start,
      current_period_end: userData.current_period_end,
      resolve_entitlement_used_at: userData.resolve_entitlement_used_at
    });

    // Step 3: Check eligibility conditions
    // Condition 1: Stripe status must be "active"
    if (userData.stripe_status !== 'active') {
      console.log('❌ [FREE_RESOLVE_CHECK] Not eligible: stripe_status =', userData.stripe_status);
      return Response.json({
        eligible: false,
        reason: 'subscription_not_active',
        message: `Subscription status: ${userData.stripe_status}. Must be "active".`
      });
    }

    // Condition 2: Price ID must match ANNUAL SECURE (monthly Secure does NOT get free case)
    if (userData.stripe_price_id !== STRIPE_PRICE_SECURE_ANNUAL) {
      console.log('❌ [FREE_RESOLVE_CHECK] Not eligible: wrong price_id');
      console.log('Expected:', STRIPE_PRICE_SECURE_ANNUAL);
      console.log('Actual:', userData.stripe_price_id);
      
      // Special case: Monthly Secure users should see they need to upgrade to Annual for free case
      if (userData.stripe_price_id === STRIPE_PRICE_SECURE_MONTHLY) {
        return Response.json({
          eligible: false,
          reason: 'monthly_secure',
          message: 'Free Resolve case is only included with Annual Secure. You have Monthly Secure which qualifies for member rate (฿3,500).'
        });
      }
      
      return Response.json({
        eligible: false,
        reason: 'not_annual_secure',
        message: 'Free Resolve is only included with Annual Secure subscription.'
      });
    }

    // Condition 3: Not scheduled for cancellation
    if (userData.cancel_at_period_end === true) {
      console.log('❌ [FREE_RESOLVE_CHECK] Not eligible: scheduled for cancellation');
      return Response.json({
        eligible: false,
        reason: 'scheduled_cancellation',
        message: 'Subscription is scheduled to cancel. Free benefits unavailable.'
      });
    }

    // Condition 4: 7-day grace period (anti-abuse)
    if (userData.current_period_start) {
      const periodStart = new Date(userData.current_period_start);
      const gracePeriodEnd = new Date(periodStart);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + FREE_RESOLVE_GRACE_PERIOD_DAYS);
      const now = new Date();
      
      if (now < gracePeriodEnd) {
        const daysRemaining = Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60 * 24));
        console.log('❌ [FREE_RESOLVE_CHECK] Not eligible: grace period active');
        console.log('Period start:', periodStart);
        console.log('Grace period ends:', gracePeriodEnd);
        console.log('Days remaining:', daysRemaining);
        return Response.json({
          eligible: false,
          reason: 'grace_period',
          message: 'Free Resolve unlocks after 7 days of active Annual Secure membership.',
          days_remaining: daysRemaining,
          unlocks_at: gracePeriodEnd.toISOString(),
          period_start: userData.current_period_start
        });
      }
    }

    // Condition 5: Not already used in current period
    if (userData.resolve_entitlement_used_at) {
      const usedAt = new Date(userData.resolve_entitlement_used_at);
      const periodStart = new Date(userData.current_period_start);
      
      if (usedAt >= periodStart) {
        console.log('❌ [FREE_RESOLVE_CHECK] Not eligible: already used in current period');
        console.log('Used at:', usedAt);
        console.log('Period start:', periodStart);
        return Response.json({
          eligible: false,
          reason: 'already_used',
          message: 'Free Resolve already used this membership period.',
          used_at: userData.resolve_entitlement_used_at,
          used_case_id: userData.resolve_entitlement_used_case_id,
          period_end: userData.current_period_end
        });
      }
    }

    // All checks passed
    console.log('✅ [FREE_RESOLVE_CHECK] ELIGIBLE for free Resolve case');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return Response.json({
      eligible: true,
      reason: 'annual_secure_active',
      message: 'User qualifies for 1 free Resolve case (Annual Secure subscription)',
      period_end: userData.current_period_end
    });

  } catch (error) {
    console.error('❌ [FREE_RESOLVE_CHECK] Error:', error);
    return Response.json({ 
      eligible: false,
      reason: 'error',
      error: error.message 
    }, { status: 500 });
  }
});