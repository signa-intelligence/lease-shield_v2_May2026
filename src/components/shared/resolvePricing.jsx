/**
 * UNIFIED MEMBERSHIP SYSTEM - Single source of truth for ALL member benefits
 * 
 * CRITICAL BUSINESS RULES:
 * - Secure: Immediate member benefits (no 30-day wait)
 * - Lite/Protect: Member benefits after 30 days of active membership
 * - Free: No member benefits, ever
 * 
 * Applies to: Resolve pricing, Letter pricing, Priority features
 */

export const RESOLVE_PRICING = {
  PUBLIC_RATE: 5000,
  MEMBER_RATE: 3500,
  SAVINGS: 1500
};

export const SUBSCRIPTION_PRICING = {
  LITE_MONTHLY: 190,
  LITE_ANNUAL: 1900,
  PROTECT_MONTHLY: 390,
  PROTECT_ANNUAL: 3900,
  SECURE_MONTHLY: 990,
  SECURE_ANNUAL: 9900,
  ONE_TIME_SCAN: 590
};

export const LETTER_PRICING = {
  PUBLIC_RATE: 300,  // per letter
  MEMBER_RATE: 200,  // per letter
  PACK_PUBLIC_RATE: 900,  // 3-pack
  PACK_MEMBER_RATE: 600   // 3-pack
};

/**
 * UNIFIED MEMBERSHIP ELIGIBILITY FUNCTION
 * Returns comprehensive membership information for a user
 * 
 * @param {Object} user - User object with plan_tier and plan_started_at
 * @param {Date} now - Current date (optional, defaults to new Date())
 * @returns {Object} Membership eligibility details
 */
export function getMembershipInfo(user, now = new Date()) {
  if (!user) {
    return {
      plan: 'free',
      membershipDays: 0,
      isPaidPlan: false,
      qualifiesForMemberBenefits: false,
      reason: 'not_logged_in',
      daysUntilMemberBenefits: null
    };
  }

  const plan = user.plan_tier || 'free';
  const isPaidPlan = ['lite', 'protect', 'secure'].includes(plan);

  // Calculate membership duration
  let membershipDays = 0;
  if (user.plan_started_at) {
    const planStartDate = new Date(user.plan_started_at);
    membershipDays = Math.floor((now - planStartDate) / (1000 * 60 * 60 * 24));
  }

  // CRITICAL BUSINESS LOGIC: Determine eligibility
  let qualifiesForMemberBenefits = false;
  let reason = '';
  let daysUntilMemberBenefits = null;

  if (plan === 'secure') {
    // SECURE: Immediate member benefits (no wait)
    qualifiesForMemberBenefits = true;
    reason = 'secure_immediate';
  } else if (plan === 'lite' || plan === 'protect') {
    // LITE/PROTECT: Member benefits after 30 days
    if (membershipDays >= 30) {
      qualifiesForMemberBenefits = true;
      reason = 'qualified_30_days';
    } else {
      qualifiesForMemberBenefits = false;
      reason = 'insufficient_membership_duration';
      daysUntilMemberBenefits = 30 - membershipDays;
    }
  } else {
    // FREE: Never qualifies
    qualifiesForMemberBenefits = false;
    reason = 'not_on_paid_plan';
  }

  return {
    plan,
    membershipDays,
    isPaidPlan,
    qualifiesForMemberBenefits,
    reason,
    daysUntilMemberBenefits
  };
}

/**
 * LEGACY: Wrapper for backward compatibility
 * @deprecated Use getMembershipInfo(user).qualifiesForMemberBenefits instead
 */
export function getMembershipEligibility(user) {
  const info = getMembershipInfo(user);
  return {
    isEligible: info.qualifiesForMemberBenefits,
    reason: info.reason,
    membershipDays: info.membershipDays
  };
}

/**
 * Get Resolve pricing for a specific user
 * Uses unified membership rules
 */
export function getResolvePricingForUser(user) {
  const membership = getMembershipInfo(user);
  
  return {
    priceType: membership.qualifiesForMemberBenefits ? 'member' : 'public',
    amount: membership.qualifiesForMemberBenefits ? RESOLVE_PRICING.MEMBER_RATE : RESOLVE_PRICING.PUBLIC_RATE,
    membershipInfo: membership
  };
}

/**
 * Get Letter pricing for a specific user
 * Uses unified membership rules
 */
export function getLetterPricingForUser(user) {
  const membership = getMembershipInfo(user);
  
  return {
    priceType: membership.qualifiesForMemberBenefits ? 'member' : 'public',
    perLetterRate: membership.qualifiesForMemberBenefits ? LETTER_PRICING.MEMBER_RATE : LETTER_PRICING.PUBLIC_RATE,
    packRate: membership.qualifiesForMemberBenefits ? LETTER_PRICING.PACK_MEMBER_RATE : LETTER_PRICING.PACK_PUBLIC_RATE,
    membershipInfo: membership
  };
}

/**
 * Check if user has priority status
 * Uses unified membership rules
 */
export function hasPriorityAccess(user) {
  const membership = getMembershipInfo(user);
  return membership.qualifiesForMemberBenefits;
}

/**
 * LEGACY: Backward compatibility wrapper
 * @deprecated Use getMembershipInfo(user).qualifiesForMemberBenefits instead
 */
export function hasMemberPricing(user) {
  const membership = getMembershipInfo(user);
  return membership.qualifiesForMemberBenefits;
}