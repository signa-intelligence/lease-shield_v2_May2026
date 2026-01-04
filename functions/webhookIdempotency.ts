/**
 * Webhook idempotency helper
 * Prevents duplicate processing of webhook events
 */

const processedEvents = new Map();
const EVENT_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if webhook event has already been processed
 * @param {string} eventId - Stripe event ID
 * @returns {boolean} - true if already processed
 */
export function isEventProcessed(eventId) {
  if (!eventId) return false;
  
  const record = processedEvents.get(eventId);
  if (!record) return false;
  
  // Check if record expired
  if (Date.now() - record.timestamp > EVENT_TTL) {
    processedEvents.delete(eventId);
    return false;
  }
  
  return true;
}

/**
 * Mark event as processed
 */
export function markEventProcessed(eventId) {
  if (!eventId) return;
  
  processedEvents.set(eventId, {
    timestamp: Date.now(),
    processedAt: new Date().toISOString()
  });
  
  // Cleanup old events (keep map size manageable)
  if (processedEvents.size > 10000) {
    const now = Date.now();
    for (const [key, value] of processedEvents.entries()) {
      if (now - value.timestamp > EVENT_TTL) {
        processedEvents.delete(key);
      }
    }
  }
}

/**
 * Clear expired events (run periodically)
 */
export function cleanupExpiredEvents() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of processedEvents.entries()) {
    if (now - value.timestamp > EVENT_TTL) {
      processedEvents.delete(key);
      cleaned++;
    }
  }
  
  return cleaned;
}