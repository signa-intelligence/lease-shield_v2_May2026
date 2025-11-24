/**
 * UNIFIED MEMBERSHIP SYSTEM - Server-side utility
 * 
 * CRITICAL BUSINESS RULES:
 * - Secure: Immediate member benefits (no 30-day wait)
 * - Lite/Protect: Member benefits after 30 days of active membership
 * - Free: No member benefits, ever
 * 
 * This is the SERVER-SIDE version of the membership logic.
 * Must match the client-side version in components/shared/resolvePricing.js
 */

export const RESOLVE_PRICING = {
  PUBLIC_RATE: 3990,
  MEMBER_RATE: 2490,
  SAVINGS: 1500
};

export const LETTER_PRICING = {
  PUBLIC_RATE: 300,
  MEMBER_RATE: 200,
  PACK_PUBLIC_RATE: 900,
  PACK_MEMBER_RATE: 600
};

/**
 * Get comprehensive membership information for a user
 * Returns eligibility for member benefits (Resolve, Letters, Priority)
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
 * Get Resolve pricing for a user
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
 * Get Letter pricing for a user
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
 * Check if user should get priority treatment
 */
export function hasPriorityAccess(user) {
  const membership = getMembershipInfo(user);
  return membership.qualifiesForMemberBenefits;
}