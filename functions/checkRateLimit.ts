import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, action, limit = 5, windowMs = 60000 } = await req.json();

    const effectiveUserId = userId || user.id;
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    // Try to get existing rate limit record
    const existingRecords = await base44.asServiceRole.entities.RateLimit.filter({
      user_id: effectiveUserId,
      action: action
    });

    let rateLimitRecord = existingRecords.length > 0 ? existingRecords[0] : null;

    if (rateLimitRecord) {
      // Parse existing requests
      let requests = [];
      try {
        requests = JSON.parse(rateLimitRecord.requests || '[]');
      } catch (e) {
        requests = [];
      }

      // Filter out requests outside the current window (sliding window)
      requests = requests
        .map(ts => new Date(ts))
        .filter(timestamp => timestamp > windowStart)
        .sort((a, b) => a - b);

      // Check if limit exceeded
      if (requests.length >= limit) {
        const oldestRequest = requests[0];
        const resetAt = new Date(oldestRequest.getTime() + windowMs);
        const retryAfterSeconds = Math.ceil((resetAt - now) / 1000);

        return Response.json({
          error: 'Rate limit exceeded',
          allowed: false,
          remaining: 0,
          reset_at: resetAt.toISOString(),
          retry_after_seconds: retryAfterSeconds
        }, { status: 429 });
      }

      // Add current request
      requests.push(now);

      // Update record
      await base44.asServiceRole.entities.RateLimit.update(rateLimitRecord.id, {
        requests: JSON.stringify(requests.map(r => r.toISOString())),
        last_request: now.toISOString(),
        expires_at: new Date(now.getTime() + windowMs).toISOString()
      });

      return Response.json({
        allowed: true,
        remaining: limit - requests.length,
        reset_at: new Date(requests[0].getTime() + windowMs).toISOString()
      });

    } else {
      // Create new rate limit record
      const requests = [now];
      await base44.asServiceRole.entities.RateLimit.create({
        user_id: effectiveUserId,
        action: action,
        requests: JSON.stringify(requests.map(r => r.toISOString())),
        last_request: now.toISOString(),
        expires_at: new Date(now.getTime() + windowMs).toISOString()
      });

      return Response.json({
        allowed: true,
        remaining: limit - 1,
        reset_at: new Date(now.getTime() + windowMs).toISOString()
      });
    }

  } catch (error) {
    console.error('Rate limit check error:', error);
    return Response.json({ 
      error: error.message,
      allowed: false
    }, { status: 500 });
  }
});