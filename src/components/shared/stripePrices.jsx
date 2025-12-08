/**
 * Stripe Price IDs Configuration
 * Centralized source of truth for all Stripe price IDs
 * 
 * IMPORTANT: These are LIVE price IDs - do not mix test and live
 */

export const STRIPE_PRICES = {
  lite: {
    monthly: "price_1SbtXQQwoI6NhlUxKMlyoEbs",
    annual: "price_1SbtXQQwoI6NhlUxXqxUROyx",
  },
  protect: {
    monthly: "price_1SbtZ4QwoI6NhlUxxxUML4Un",
    annual: "price_1SbtZ4QwoI6NhlUxUwsvYbkS",
  },
  secure: {
    monthly: "price_1SbtaWQwoI6NhlUxJboFevsu",
    annual: "price_1SbtaWQwoI6NhlUxAfPLTDeE",
  },
  oneTimeScan: "price_1SbtbfQwoI6NhlUx2dHjb5jC",
};

/**
 * Get Stripe price ID for a given plan and interval
 * @param {string} plan - 'lite', 'protect', or 'secure'
 * @param {string} interval - 'monthly' or 'annual'
 * @returns {string|null} Stripe price ID or null if not found
 */
export function getStripePriceId(plan, interval) {
  const normalizedPlan = plan?.toLowerCase();
  const normalizedInterval = (interval === 'year' || interval === 'annual') ? 'annual' : 'monthly';
  
  if (normalizedPlan === 'onetimescan' || normalizedPlan === 'one_time_scan') {
    return STRIPE_PRICES.oneTimeScan;
  }
  
  if (!STRIPE_PRICES[normalizedPlan]) {
    console.warn(`[STRIPE_PRICES] Unknown plan: ${plan}`);
    return null;
  }
  
  return STRIPE_PRICES[normalizedPlan][normalizedInterval] || null;
}