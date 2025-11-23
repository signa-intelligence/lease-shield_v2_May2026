/**
 * Resolve Case Service Pricing Configuration
 * Centralized pricing constants for case submission
 */

export const RESOLVE_PRICING = {
  MEMBER_RATE: 2490,
  PUBLIC_RATE: 3990,
  SAVINGS: 1500
};

/**
 * Check if user has member pricing access
 */
export const hasMemberPricing = (user) => {
  if (!user) return false;
  const planTier = user.plan_tier;
  return planTier && planTier !== 'free';
};

/**
 * Get pricing for user
 */
export const getUserPricing = (user) => {
  return hasMemberPricing(user) ? RESOLVE_PRICING.MEMBER_RATE : RESOLVE_PRICING.PUBLIC_RATE;
};