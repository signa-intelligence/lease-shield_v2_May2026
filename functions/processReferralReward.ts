import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Process Referral Reward
 * 
 * Called by stripeWebhook after first successful subscription payment.
 * 
 * Logic:
 * 1. Check if referred_by_code exists and reward not already granted
 * 2. Find referrer by referral_code
 * 3. Calculate reward = min(referrer_plan_price, referred_plan_price)
 * 4. Add to referrer's reward_credit_balance
 * 5. Create ReferralReward record
 * 6. Mark reward as granted
 */

const PLAN_PRICES = {
  lite: 390,
  protect: 690,
  secure: 1290
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { referredUserId } = await req.json();

    if (!referredUserId) {
      return Response.json({ error: 'Missing referredUserId' }, { status: 400 });
    }

    console.log('[REFERRAL_REWARD] Processing reward for user:', referredUserId);

    // Fetch referred user
    const allUsers = await base44.asServiceRole.entities.User.list();
    const referredUser = allUsers.find(u => u.id === referredUserId);

    if (!referredUser) {
      console.error('[REFERRAL_REWARD] User not found');
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[REFERRAL_REWARD] Referred user:', referredUser.email);
    console.log('[REFERRAL_REWARD] referred_by_code:', referredUser.referred_by_code);
    console.log('[REFERRAL_REWARD] reward_granted:', referredUser.referral_reward_granted);

    // Check eligibility
    if (!referredUser.referred_by_code) {
      console.log('[REFERRAL_REWARD] No referral code - skipping');
      return Response.json({ skipped: 'no_referral_code' }, { status: 200 });
    }

    if (referredUser.referral_reward_granted) {
      console.log('[REFERRAL_REWARD] Reward already granted - skipping');
      return Response.json({ skipped: 'already_granted' }, { status: 200 });
    }

    // Find referrer
    const referrer = allUsers.find(u => u.referral_code === referredUser.referred_by_code);

    if (!referrer) {
      console.error('[REFERRAL_REWARD] Referrer not found for code:', referredUser.referred_by_code);
      return Response.json({ error: 'Referrer not found' }, { status: 404 });
    }

    console.log('[REFERRAL_REWARD] Referrer found:', referrer.email);

    // Calculate reward
    const referrerPlanPrice = PLAN_PRICES[referrer.plan_tier] || 0;
    const referredPlanPrice = PLAN_PRICES[referredUser.plan_tier] || 0;

    if (referredPlanPrice === 0) {
      console.log('[REFERRAL_REWARD] Referred user on free plan - no reward');
      return Response.json({ skipped: 'free_plan' }, { status: 200 });
    }

    const rewardAmount = Math.min(referrerPlanPrice, referredPlanPrice);

    console.log('[REFERRAL_REWARD] Reward calculation:', {
      referrerPlan: referrer.plan_tier,
      referrerPrice: referrerPlanPrice,
      referredPlan: referredUser.plan_tier,
      referredPrice: referredPlanPrice,
      rewardAmount
    });

    // Update referrer's balance
    const currentBalance = referrer.reward_credit_balance || 0;
    const newBalance = currentBalance + rewardAmount;

    await base44.asServiceRole.entities.User.update(referrer.id, {
      reward_credit_balance: newBalance
    });

    console.log('[REFERRAL_REWARD] ✅ Referrer balance updated:', currentBalance, '→', newBalance);

    // Mark reward as granted for referred user
    await base44.asServiceRole.entities.User.update(referredUser.id, {
      referral_reward_granted: true
    });

    console.log('[REFERRAL_REWARD] ✅ Marked reward as granted for referred user');

    // Create ReferralReward record
    await base44.asServiceRole.entities.ReferralReward.create({
      referrer_user_id: referrer.id,
      referred_user_id: referredUser.id,
      reward_amount: rewardAmount,
      referrer_plan: referrer.plan_tier,
      referred_plan: referredUser.plan_tier
    });

    console.log('[REFERRAL_REWARD] ✅ ReferralReward record created');

    return Response.json({
      success: true,
      referrer: referrer.email,
      referred: referredUser.email,
      rewardAmount,
      newBalance
    });

  } catch (error) {
    console.error('[REFERRAL_REWARD] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});