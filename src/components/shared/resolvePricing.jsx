/**
 * ⚡ Resolve Pricing - Single Source of Truth
 * 
 * Defines pricing and eligibility logic for the Resolve case service.
 * Used across Dashboard, Cases, ResolveCase pages and Stripe webhooks.
 */

export const RESOLVE_PRICING = {
  PUBLIC_RATE: 3990,  // THB - Public price
  MEMBER_RATE: 2490,  // THB - Member price
  SAVINGS: 1500       // THB - Amount saved as member vs public
};

/**
 * Determines if user qualifies for member pricing
 * 
 * Member pricing applies if:
 * - User has an active paid plan (Lite/Protect/Secure), OR
 * - User has been a paying member for at least 30 days total
 * 
 * @param {Object} user - User object with plan_tier and member_since
 * @returns {Object} Eligibility details
 */
export function getMembershipEligibility(user) {
  if (!user) {
    return {
      isEligible: false,
      reason: 'no_user',
      daysAsMember: 0
    };
  }

  // Check 1: Active paid plan
  const hasActivePaidPlan = user.plan_tier && 
    ['lite', 'protect', 'secure'].includes(user.plan_tier.toLowerCase());

  if (hasActivePaidPlan) {
    return {
      isEligible: true,
      reason: 'active_paid_plan',
      plan: user.plan_tier,
      daysAsMember: user.member_since ? 
        Math.floor((Date.now() - new Date(user.member_since).getTime()) / (1000 * 60 * 60 * 24)) : 
        0
    };
  }

  // Check 2: 30+ days of paid membership history
  if (user.member_since) {
    const memberSinceDate = new Date(user.member_since);
    const daysSinceMember = Math.floor(
      (Date.now() - memberSinceDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceMember >= 30) {
      return {
        isEligible: true,
        reason: '30_day_member',
        daysAsMember: daysSinceMember
      };
    }

    return {
      isEligible: false,
      reason: 'insufficient_membership_duration',
      daysAsMember: daysSinceMember,
      daysRemaining: 30 - daysSinceMember
    };
  }

  return {
    isEligible: false,
    reason: 'never_been_member',
    daysAsMember: 0
  };
}

/**
 * Get pricing details for a specific user
 * 
 * @param {Object} user - User object
 * @returns {Object} Pricing details
 */
export function getResolvePricingForUser(user) {
  const eligibility = getMembershipEligibility(user);
  
  return {
    publicPrice: RESOLVE_PRICING.PUBLIC_RATE,
    memberPrice: RESOLVE_PRICING.MEMBER_RATE,
    savings: RESOLVE_PRICING.SAVINGS,
    isMember: eligibility.isEligible,
    effectivePrice: eligibility.isEligible ? RESOLVE_PRICING.MEMBER_RATE : RESOLVE_PRICING.PUBLIC_RATE,
    priceType: eligibility.isEligible ? 'member' : 'public',
    eligibility: eligibility
  };
}

/**
 * Legacy helper - kept for backward compatibility
 * @deprecated Use getMembershipEligibility instead
 */
export function hasMemberPricing(user) {
  return getMembershipEligibility(user).isEligible;
}