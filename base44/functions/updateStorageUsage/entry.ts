import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Update user storage usage after file upload/deletion
 * Called after successful upload or deletion
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bytesAdded } = await req.json();
    
    if (bytesAdded === undefined || bytesAdded === null) {
      return Response.json({ error: 'bytesAdded is required' }, { status: 400 });
    }

    const userEmail = user.email;
    const userTier = user.plan_tier || 'free';
    
    // Define tier limits
    const TIER_LIMITS = {
      free: 100 * 1024 * 1024,        // 100MB
      lite: 1024 * 1024 * 1024,        // 1GB
      protect: 5 * 1024 * 1024 * 1024, // 5GB
      secure: 20 * 1024 * 1024 * 1024  // 20GB
    };
    
    const limit = TIER_LIMITS[userTier] || TIER_LIMITS.free;
    
    console.log('[STORAGE_UPDATE]', { 
      userEmail, 
      bytesAdded, 
      tier: userTier 
    });

    const svc = base44.asServiceRole || base44;
    
    // Get or create storage record
    let storageRecords = await svc.entities.UserStorage.filter({
      user_email: userEmail
    });
    
    if (storageRecords.length === 0) {
      // Create new storage record
      const newStorage = await svc.entities.UserStorage.create({
        user_email: userEmail,
        user_id: user.id,
        total_bytes: Math.max(0, bytesAdded),
        tier_limit_bytes: limit,
        files_count: bytesAdded > 0 ? 1 : 0,
        last_updated: new Date().toISOString()
      });
      
      console.log('[STORAGE_RECORD_CREATED]', { 
        storageId: newStorage.id,
        totalBytes: newStorage.total_bytes,
        filesCount: newStorage.files_count
      });
      
      return Response.json({
        ok: true,
        created: true,
        totalBytes: newStorage.total_bytes,
        filesCount: newStorage.files_count,
        usagePercent: Math.round((newStorage.total_bytes / limit) * 100)
      });
    }
    
    // Update existing record
    const storage = storageRecords[0];
    const newTotal = Math.max(0, (storage.total_bytes || 0) + bytesAdded);
    const newCount = Math.max(0, (storage.files_count || 0) + (bytesAdded > 0 ? 1 : -1));
    
    await svc.entities.UserStorage.update(storage.id, {
      total_bytes: newTotal,
      files_count: newCount,
      last_updated: new Date().toISOString()
    });
    
    console.log('[STORAGE_UPDATED]', {
      storageId: storage.id,
      oldTotal: storage.total_bytes,
      newTotal,
      bytesAdded,
      oldCount: storage.files_count,
      newCount
    });
    
    return Response.json({
      ok: true,
      updated: true,
      totalBytes: newTotal,
      filesCount: newCount,
      usagePercent: Math.round((newTotal / limit) * 100)
    });

  } catch (error) {
    console.error('[STORAGE_UPDATE_ERROR]', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});