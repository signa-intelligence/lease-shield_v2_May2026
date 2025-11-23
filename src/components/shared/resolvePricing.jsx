/**
 * Resolve Case Service Pricing Configuration
 * Centralized pricing constants for case submission
 */

export const RESOLVE_PRICING = {
  MEMBER_RATE: 2490,
  PUBLIC_RATE: 3990,
  SAVINGS: 1500,
  MINIMUM_MEMBERSHIP_DAYS: 30
};

/**
 * Calculate days since membership started
 * Returns 0 if no valid membership start date
 */
export const getMembershipAgeDays = (user) => {
  if (!user) return 0;
  
  // Check for subscription_started_at first (most accurate)
  const startDate = user.subscription_started_at || user.plan_started_at || user.membership_started_at;
  
  if (!startDate) return 0;
  
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = now - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 ? diffDays : 0;
};

/**
 * Check if user qualifies for member case pricing
 * Requires: paid tier (Lite/Protect/Secure) AND membership active ≥30 days
 */
export const hasMemberPricing = (user) => {
  if (!user) return false;
  
  const planTier = user.plan_tier;
  const isPaidTier = planTier && planTier !== 'free';
  
  if (!isPaidTier) return false;
  
  // Check subscription is active (not cancelled/expired)
  const subscriptionStatus = user.subscription_status;
  if (subscriptionStatus && subscriptionStatus !== 'active') return false;
  
  // Check 30-day minimum
  const membershipDays = getMembershipAgeDays(user);
  return membershipDays >= RESOLVE_PRICING.MINIMUM_MEMBERSHIP_DAYS;
};

/**
 * Get pricing for user's next case
 */
export const getUserPricing = (user) => {
  return hasMemberPricing(user) ? RESOLVE_PRICING.MEMBER_RATE : RESOLVE_PRICING.PUBLIC_RATE;
};

/**
 * Get membership unlock date (when member pricing becomes available)
 * Returns null if already unlocked or not on paid tier
 */
export const getMemberPricingUnlockDate = (user) => {
  if (!user) return null;
  
  const planTier = user.plan_tier;
  const isPaidTier = planTier && planTier !== 'free';
  
  if (!isPaidTier) return null;
  
  const membershipDays = getMembershipAgeDays(user);
  if (membershipDays >= RESOLVE_PRICING.MINIMUM_MEMBERSHIP_DAYS) return null; // Already unlocked
  
  const startDate = user.subscription_started_at || user.plan_started_at || user.membership_started_at;
  if (!startDate) return null;
  
  const start = new Date(startDate);
  const unlockDate = new Date(start);
  unlockDate.setDate(unlockDate.getDate() + RESOLVE_PRICING.MINIMUM_MEMBERSHIP_DAYS);
  
  return unlockDate;
};