import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

Deno.serve(async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole || base44;
    
    // Get all users
    const users = await svc.entities.User.list();
    
    console.log('[MIGRATE_START]', { totalUsers: users.length });
    
    const migrated = [];
    const skipped = [];
    
    for (const user of users) {
      // Skip if already has root-level fields
      if (user.tier !== undefined && user.available_scans !== undefined) {
        skipped.push(user.email);
        continue;
      }
      
      // Skip if no data object
      if (!user.data) {
        skipped.push(user.email);
        continue;
      }
      
      console.log('[MIGRATE_USER_BEFORE]', {
        email: user.email,
        root_tier: user.tier,
        nested_tier: user.data.tier,
        root_scans: user.available_scans,
        nested_scans: user.data.available_scans
      });
      
      // Move fields from data.* to root level
      const updateData = {};
      
      if (user.data.tier && !user.tier) {
        updateData.tier = user.data.tier;
      }
      
      if (user.data.available_scans !== undefined && user.available_scans === undefined) {
        updateData.available_scans = user.data.available_scans;
      }
      
      if (user.data.subscription_status && !user.subscription_status) {
        updateData.subscription_status = user.data.subscription_status;
      }
      
      // Only update if we have fields to migrate
      if (Object.keys(updateData).length > 0) {
        const updated = await svc.entities.User.update(user.id, updateData);
        
        console.log('[MIGRATE_USER_AFTER]', {
          email: updated.email,
          tier: updated.tier,
          available_scans: updated.available_scans,
          subscription_status: updated.subscription_status
        });
        
        migrated.push({
          email: user.email,
          migrated: Object.keys(updateData)
        });
      } else {
        skipped.push(user.email);
      }
    }
    
    console.log('[MIGRATE_COMPLETE]', { 
      migrated: migrated.length, 
      skipped: skipped.length 
    });
    
    return new Response(JSON.stringify({
      success: true,
      migrated: migrated,
      skipped: skipped.length
    }), { status: 200, headers });
    
  } catch (e) {
    console.error('[MIGRATE_ERROR]', e);
    return new Response(JSON.stringify({
      error: e.message,
      stack: e.stack
    }), { status: 500, headers });
  }
});