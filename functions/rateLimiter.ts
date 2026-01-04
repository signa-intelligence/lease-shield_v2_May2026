import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Rate limiter using RateLimit entity
 * Implements sliding window algorithm
 */

const RATE_LIMITS = {
  scanLease: { window: 3600, maxRequests: 10 }, // 10 scans per hour
  createCheckout: { window: 600, maxRequests: 5 }, // 5 checkouts per 10 min
  exportUserData: { window: 3600, maxRequests: 3 }, // 3 exports per hour
  downloadTemplate: { window: 60, maxRequests: 10 }, // 10 downloads per minute
  generatePhase1Letter: { window: 300, maxRequests: 5 }, // 5 letters per 5 min
  stripeWebhook: { window: 60, maxRequests: 100 }, // 100 webhooks per minute
};

/**
 * Check and enforce rate limit for an action
 * @param {string} userId - User ID
 * @param {string} action - Action name (e.g., 'scanLease')
 * @param {object} base44 - Base44 client
 * @returns {Promise<{allowed: boolean, remaining: number}>}
 */
export async function checkRateLimit(userId, action, base44) {
  const limit = RATE_LIMITS[action];
  if (!limit) {
    // No rate limit defined for this action
    return { allowed: true, remaining: 999 };
  }

  const now = Date.now();
  const windowStart = now - (limit.window * 1000);

  try {
    // Fetch existing rate limit record
    const records = await base44.asServiceRole.entities.RateLimit.filter({
      user_id: userId,
      action: action
    });

    let record = records.length > 0 ? records[0] : null;

    // Parse existing requests
    let requests = [];
    if (record && record.requests) {
      try {
        requests = JSON.parse(record.requests);
      } catch (e) {
        requests = [];
      }
    }

    // Filter requests within window
    requests = requests.filter(ts => ts > windowStart);

    // Check if limit exceeded
    if (requests.length >= limit.maxRequests) {
      return { 
        allowed: false, 
        remaining: 0,
        retryAfter: Math.ceil((requests[0] + (limit.window * 1000) - now) / 1000)
      };
    }

    // Add current request
    requests.push(now);

    // Update or create record
    const expiresAt = new Date(now + (limit.window * 1000)).toISOString();
    
    if (record) {
      await base44.asServiceRole.entities.RateLimit.update(record.id, {
        requests: JSON.stringify(requests),
        last_request: new Date(now).toISOString(),
        expires_at: expiresAt
      });
    } else {
      await base44.asServiceRole.entities.RateLimit.create({
        user_id: userId,
        action: action,
        requests: JSON.stringify(requests),
        last_request: new Date(now).toISOString(),
        expires_at: expiresAt
      });
    }

    return { 
      allowed: true, 
      remaining: limit.maxRequests - requests.length 
    };
  } catch (error) {
    console.error('[RATE_LIMIT_ERROR]', { action, error: error.message });
    // Fail open on errors (don't block users due to rate limiter bugs)
    return { allowed: true, remaining: 999 };
  }
}

/**
 * Enforce rate limit - throws error if exceeded
 */
export async function enforceRateLimit(userId, action, base44) {
  const result = await checkRateLimit(userId, action, base44);
  
  if (!result.allowed) {
    const error = new Error('RATE_LIMIT_EXCEEDED');
    error.retryAfter = result.retryAfter;
    throw error;
  }
  
  return result;
}