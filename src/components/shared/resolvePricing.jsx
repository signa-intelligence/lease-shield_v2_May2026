/**
 * Resolve Case Service Pricing Configuration
 * Centralized pricing constants for case submission
 */

export const RESOLVE_PRICING = {
  MEMBER_RATE: 2490,
  PUBLIC_RATE: 3990,
  SAVINGS: 1500,
  MEMBERSHIP_DAYS_REQUIRED: 30
};

/**
 * Calculate days since FIRST paid membership started
 * Uses member_since field which NEVER resets on plan changes (upgrades/downgrades)
 * Returns 0 if no valid membership start date
 */
const getMembershipDays = (user) => {
  if (!user) return 0;
  
  // Use member_since (stable across plan changes) or fallback to subscription_started_at
  const memberSinceDate = user.member_since || user.subscription_started_at;
  
  if (!memberSinceDate) return 0;
  
  const startDate = new Date(memberSinceDate);
  const now = new Date();
  const diffTime = now - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 ? diffDays : 0;
};

/**
 * Check if user qualifies for member pricing (30-day rule)
 * User must have ACTIVE paid tier AND ≥30 days continuous paid membership
 * Plan changes between paid tiers do NOT reset the clock
 */
export const hasMemberPricing = (user) => {
  if (!user) return false;
  
  const planTier = user.plan_tier;
  const isPaidTier = planTier && planTier !== 'free';
  
  if (!isPaidTier) return false;
  
  // Check subscription is active (not cancelled/expired)
  const subscriptionStatus = user.subscription_status;
  if (subscriptionStatus && subscriptionStatus !== 'active') return false;
  
  // Check 30-day minimum using continuous paid membership (not reset by plan changes)
  const membershipDays = getMembershipDays(user);
  return membershipDays >= RESOLVE_PRICING.MEMBERSHIP_DAYS_REQUIRED;
};

/**
 * Get pricing for user with detailed info
 */
export const getUserPricing = (user) => {
  return hasMemberPricing(user) ? RESOLVE_PRICING.MEMBER_RATE : RESOLVE_PRICING.PUBLIC_RATE;
};

/**
 * Get membership eligibility details for UI display
 */
export const getMembershipEligibility = (user) => {
  if (!user) {
    return {
      isEligible: false,
      membershipDays: 0,
      daysRemaining: RESOLVE_PRICING.MEMBERSHIP_DAYS_REQUIRED,
      isPaidTier: false,
      unlockDate: null
    };
  }
  
  const planTier = user.plan_tier;
  const isPaidTier = planTier && planTier !== 'free';
  const membershipDays = getMembershipDays(user);
  const isEligible = isPaidTier && membershipDays >= RESOLVE_PRICING.MEMBERSHIP_DAYS_REQUIRED;
  
  let unlockDate = null;
  const memberSinceDate = user.member_since || user.subscription_started_at;
  
  if (isPaidTier && !isEligible && memberSinceDate) {
    const startDate = new Date(memberSinceDate);
    unlockDate = new Date(startDate);
    unlockDate.setDate(unlockDate.getDate() + RESOLVE_PRICING.MEMBERSHIP_DAYS_REQUIRED);
  }
  
  return {
    isEligible,
    membershipDays,
    daysRemaining: Math.max(0, RESOLVE_PRICING.MEMBERSHIP_DAYS_REQUIRED - membershipDays),
    isPaidTier,
    unlockDate,
    memberSince: memberSinceDate ? new Date(memberSinceDate) : null
  };
};