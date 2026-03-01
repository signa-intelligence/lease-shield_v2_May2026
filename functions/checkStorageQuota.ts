import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Check if user has enough storage quota for a file
 * Tier-based limits:
 * - Free/Lite: 1GB
 * - Protect: 5GB
 * - Secure: 20GB
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileSize } = await req.json();
    
    if (!fileSize || fileSize <= 0) {
      return Response.json({ error: 'Invalid file size' }, { status: 400 });
    }

    const userEmail = user.email;
    const userTier = user.plan_tier || 'free';
    
    // Define tier-based storage limits
    const TIER_LIMITS = {
      free: 100 * 1024 * 1024,        // 100MB for free tier
      lite: 1024 * 1024 * 1024,        // 1GB
      protect: 5 * 1024 * 1024 * 1024, // 5GB
      secure: 20 * 1024 * 1024 * 1024  // 20GB
    };
    
    const limit = TIER_LIMITS[userTier] || TIER_LIMITS.free;
    
    console.log('[STORAGE_QUOTA_CHECK]', { 
      userEmail, 
      userTier, 
      fileSize, 
      limit 
    });

    const svc = base44.asServiceRole || base44;
    
    // Get or create storage record
    let storageRecords = await svc.entities.UserStorage.filter({
      user_email: userEmail
    });
    
    let storage;
    
    if (storageRecords.length === 0) {
      // Create new storage record
      storage = await svc.entities.UserStorage.create({
        user_email: userEmail,
        user_id: user.id,
        total_bytes: 0,
        tier_limit_bytes: limit,
        files_count: 0,
        last_updated: new Date().toISOString()
      });
      console.log('[STORAGE_RECORD_CREATED]', { storageId: storage.id, userEmail });
    } else {
      storage = storageRecords[0];
      
      // Update tier limit if changed
      if (storage.tier_limit_bytes !== limit) {
        await svc.entities.UserStorage.update(storage.id, {
          tier_limit_bytes: limit
        });
        storage.tier_limit_bytes = limit;
        console.log('[STORAGE_LIMIT_UPDATED]', { newLimit: limit, tier: userTier });
      }
    }
    
    const currentUsage = storage.total_bytes || 0;
    const newTotal = currentUsage + fileSize;
    
    // Check if exceeds limit
    if (newTotal > limit) {
      const remainingBytes = Math.max(0, limit - currentUsage);
      const remainingMB = remainingBytes / (1024 * 1024);
      const fileSizeMB = fileSize / (1024 * 1024);
      const limitMB = limit / (1024 * 1024);
      const usedMB = currentUsage / (1024 * 1024);
      
      console.log('[STORAGE_QUOTA_EXCEEDED]', {
        currentUsage,
        fileSize,
        newTotal,
        limit,
        remainingMB,
        usagePercent: Math.round((currentUsage / limit) * 100)
      });
      
      // Determine next tier info for upgrade prompts
      const NEXT_TIER = {
        free: { next: 'lite', nextLimit: 1024 * 1024 * 1024, nextPrice: 190 },
        lite: { next: 'protect', nextLimit: 5 * 1024 * 1024 * 1024, nextPrice: 390 },
        protect: { next: 'secure', nextLimit: 20 * 1024 * 1024 * 1024, nextPrice: 990 },
        secure: { next: null, nextLimit: null, nextPrice: null },
      };
      const tierInfo = NEXT_TIER[userTier] || NEXT_TIER.free;

      return Response.json({
        allowed: false,
        exceeded: true,
        reason: 'storage_limit_reached',
        currentUsage,
        limit,
        fileSize,
        remainingBytes,
        remainingMB: parseFloat(remainingMB.toFixed(2)),
        fileSizeMB: parseFloat(fileSizeMB.toFixed(2)),
        usedMB: parseFloat(usedMB.toFixed(2)),
        limitMB: parseFloat(limitMB.toFixed(2)),
        usagePercent: Math.round((currentUsage / limit) * 100),
        currentTier: userTier,
        nextTier: tierInfo.next,
        nextTierLimit: tierInfo.nextLimit,
        nextTierPrice: tierInfo.nextPrice,
        message: `Storage limit exceeded. You have ${remainingMB.toFixed(1)}MB remaining but need ${fileSizeMB.toFixed(1)}MB. Upgrade for more storage.`
      });
    }
    
    // Within quota
    const usagePercent = Math.round((currentUsage / limit) * 100);
    const remainingBytes = limit - currentUsage;
    
    console.log('[STORAGE_QUOTA_OK]', {
      currentUsage,
      limit,
      usagePercent,
      remainingMB: (remainingBytes / (1024 * 1024)).toFixed(2)
    });
    
    return Response.json({
      allowed: true,
      exceeded: false,
      currentUsage,
      limit,
      usagePercent,
      remainingBytes,
      remainingMB: parseFloat((remainingBytes / (1024 * 1024)).toFixed(2))
    });

  } catch (error) {
    console.error('[STORAGE_QUOTA_ERROR]', error);
    
    // Fail open - allow upload on error to prevent blocking legitimate users
    return Response.json({
      allowed: true,
      exceeded: false,
      error: error.message,
      failOpen: true
    });
  }
});