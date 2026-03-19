import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Rate Limiting System
 * Prevents abuse and DOS attacks by limiting actions per time window
 * 
 * Tier-based limits:
 * - Free/Lite: 5 scans/hour, 20 uploads/hour
 * - Protect: 10 scans/hour, 50 uploads/hour
 * - Secure: 100 scans/hour (soft limit), unlimited uploads
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { actionType, windowMinutes = 60 } = await req.json();
    
    if (!actionType) {
      return Response.json({ error: 'actionType is required' }, { status: 400 });
    }

    const userEmail = user.email;
    const userTier = user.plan_tier || 'free';
    
    // Define tier-based limits
    const LIMITS = {
      scan: {
        free: 5,
        lite: 5,
        protect: 10,
        secure: 100
      },
      upload: {
        free: 20,
        lite: 20,
        protect: 50,
        secure: 200
      },
      api_call: {
        free: 100,
        lite: 100,
        protect: 200,
        secure: 500
      }
    };
    
    const maxRequests = LIMITS[actionType]?.[userTier] || LIMITS[actionType]?.free || 10;
    
    console.log('[RATE_LIMIT_CHECK]', { 
      userEmail, 
      userTier, 
      actionType, 
      maxRequests, 
      windowMinutes 
    });

    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);
    const expiresAt = new Date(now.getTime() + windowMinutes * 60 * 1000);
    
    // Use service role to manage rate limit records
    const svc = base44.asServiceRole || base44;
    
    // Find existing rate limit record in current window
    const existing = await svc.entities.RateLimit.filter({
      user_id: user.id,
      action: actionType,
      expires_at: { $gte: now.toISOString() }
    });
    
    if (existing.length > 0) {
      const record = existing[0];
      
      // Parse requests array from JSON string
      let requests = [];
      try {
        requests = JSON.parse(record.requests || '[]');
      } catch {
        requests = [];
      }
      
      // Filter requests within current window
      const recentRequests = requests.filter(timestamp => 
        new Date(timestamp) >= windowStart
      );
      
      console.log('[RATE_LIMIT_EXISTING]', { 
        recordId: record.id,
        totalRequests: requests.length,
        recentRequests: recentRequests.length,
        maxRequests 
      });
      
      // Check if limit exceeded
      if (recentRequests.length >= maxRequests) {
        const oldestRequest = new Date(Math.min(...recentRequests.map(r => new Date(r).getTime())));
        const retryAfterMs = windowMinutes * 60 * 1000 - (now.getTime() - oldestRequest.getTime());
        const retryAfterMinutes = Math.ceil(retryAfterMs / 60000);
        
        console.log('[RATE_LIMIT_EXCEEDED]', { 
          userEmail, 
          actionType, 
          count: recentRequests.length,
          maxRequests,
          retryAfterMinutes
        });
        
        return Response.json({
          allowed: false,
          exceeded: true,
          count: recentRequests.length,
          limit: maxRequests,
          retryAfter: Math.ceil(retryAfterMs / 1000),
          retryAfterMinutes,
          message: `Rate limit exceeded. Max ${maxRequests} ${actionType}s per ${windowMinutes} minutes. Try again in ${retryAfterMinutes} minute${retryAfterMinutes !== 1 ? 's' : ''}.`
        });
      }
      
      // Add current request
      recentRequests.push(now.toISOString());
      
      // Update record
      await svc.entities.RateLimit.update(record.id, {
        requests: JSON.stringify(recentRequests),
        last_request: now.toISOString()
      });
      
      console.log('[RATE_LIMIT_INCREMENTED]', { 
        count: recentRequests.length,
        remaining: maxRequests - recentRequests.length 
      });
      
      return Response.json({
        allowed: true,
        exceeded: false,
        count: recentRequests.length,
        limit: maxRequests,
        remaining: maxRequests - recentRequests.length
      });
    }
    
    // Create new rate limit record
    const newRecord = await svc.entities.RateLimit.create({
      user_id: user.id,
      action: actionType,
      requests: JSON.stringify([now.toISOString()]),
      last_request: now.toISOString(),
      expires_at: expiresAt.toISOString()
    });
    
    console.log('[RATE_LIMIT_CREATED]', { 
      recordId: newRecord.id,
      count: 1,
      remaining: maxRequests - 1 
    });
    
    return Response.json({
      allowed: true,
      exceeded: false,
      count: 1,
      limit: maxRequests,
      remaining: maxRequests - 1
    });

  } catch (error) {
    console.error('[RATE_LIMIT_ERROR]', error);
    
    // On error, allow the request (fail open to prevent blocking legitimate users)
    return Response.json({
      allowed: true,
      exceeded: false,
      error: error.message,
      failOpen: true
    });
  }
});