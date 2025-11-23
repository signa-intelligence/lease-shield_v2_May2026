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
 * Calculate days since membership started
 */
const getMembershipDays = (user) => {
  if (!user || !user.subscription_started_at) return 0;
  
  const startDate = new Date(user.subscription_started_at);
  const now = new Date();
  const diffTime = Math.abs(now - startDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Check if user qualifies for member pricing (30-day rule)
 * User must be on paid tier AND have been a member for ≥30 days
 */
export const hasMemberPricing = (user) => {
  if (!user) return false;
  
  const planTier = user.plan_tier;
  const isPaidTier = planTier && planTier !== 'free';
  
  if (!isPaidTier) return false;
  
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
  if (isPaidTier && !isEligible && user.subscription_started_at) {
    const startDate = new Date(user.subscription_started_at);
    unlockDate = new Date(startDate);
    unlockDate.setDate(unlockDate.getDate() + RESOLVE_PRICING.MEMBERSHIP_DAYS_REQUIRED);
  }
  
  return {
    isEligible,
    membershipDays,
    daysRemaining: Math.max(0, RESOLVE_PRICING.MEMBERSHIP_DAYS_REQUIRED - membershipDays),
    isPaidTier,
    unlockDate,
    memberSince: user.subscription_started_at ? new Date(user.subscription_started_at) : null
  };
};