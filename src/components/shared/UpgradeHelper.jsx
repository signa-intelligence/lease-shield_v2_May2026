/**
 * Upgrade Helper Utility
 * Determines the next tier upgrade path for any user
 */

export function getNextTier(currentTier) {
  const tierPath = {
    'free': 'lite',
    'lite': 'protect',
    'protect': 'secure',
    'secure': null // Already at top tier
  };
  
  return tierPath[currentTier?.toLowerCase()] || 'lite';
}

export function getUpgradeRoute(currentTier, language = 'en') {
  const nextTier = getNextTier(currentTier);
  
  if (!nextTier) {
    // Already at top tier
    return null;
  }
  
  return `/account?showPlans=true#plan-selector`;
}

export function isAtTopTier(currentTier) {
  return currentTier?.toLowerCase() === 'secure';
}