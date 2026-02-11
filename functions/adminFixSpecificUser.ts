import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * EMERGENCY FIX: Manually configure user who missed initializeNewUser automation
 * Usage: invoke with { email: "user@example.com", tier: "explorer", available_scans: 1, subscription_status: "active" }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin check
    const currentUser = await base44.auth.me();
    if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role?.toLowerCase()) && !['admin', 'super_admin'].includes(currentUser.access_level?.toLowerCase())) {
      return Response.json({ error: 'Unauthorized - admin access required' }, { status: 403 });
    }
    
    const svc = base44.asServiceRole || base44;
    
    // Get parameters from request body
    const { email, tier, available_scans, subscription_status } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get user by email
    const users = await svc.entities.User.filter({ email: email });
    
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = users[0];
    
    console.log('[ADMIN_FIX_USER] Current state:', {
      email: user.email,
      root_tier: user.tier,
      nested_tier: user.data?.tier,
      root_scans: user.available_scans,
      nested_scans: user.data?.available_scans
    });
    
    // Parse updates from request body (supports arbitrary fields)
    const body = { email, tier, available_scans, subscription_status };
    // Also accept a generic "updates" object
    let rawBody;
    try { rawBody = JSON.parse(await req.clone().text()); } catch(e) { rawBody = {}; }
    const updates = rawBody.updates || {};

    // Build update payload from explicit params + updates object
    const updateData = { ...updates };
    if (tier !== undefined) updateData.tier = tier;
    if (available_scans !== undefined) updateData.available_scans = available_scans;
    if (subscription_status !== undefined) updateData.subscription_status = subscription_status;

    // If nothing explicit, apply defaults
    if (Object.keys(updateData).length === 0) {
      updateData.tier = user.tier || user.data?.tier || 'explorer';
      updateData.available_scans = user.available_scans ?? user.data?.available_scans ?? 1;
      updateData.subscription_status = user.subscription_status || user.data?.subscription_status || 'active';
    }
    
    console.log('[ADMIN_FIX_USER] Applying update:', updateData);
    
    // CRITICAL: User entity stores custom fields inside a `data` envelope.
    // svc.entities.User.update() wraps into data.X automatically.
    // So we use it directly — the SDK handles the nesting.
    await svc.entities.User.update(user.id, updateData);
    
    console.log('[ADMIN_FIX_USER] ✅ User fixed successfully');
    
    // Verify the update
    const verifyUser = await svc.entities.User.get(user.id);
    
    console.log('[ADMIN_FIX_USER] After update:', {
      email: verifyUser.email,
      tier: verifyUser.tier,
      available_scans: verifyUser.available_scans,
      subscription_status: verifyUser.subscription_status
    });
    
    return Response.json({
      success: true,
      userId: user.id,
      email: user.email,
      before: {
        tier: user.tier,
        available_scans: user.available_scans
      },
      after: {
        tier: verifyUser.tier,
        available_scans: verifyUser.available_scans,
        subscription_status: verifyUser.subscription_status
      }
    });
    
  } catch (error) {
    console.error('[ADMIN_FIX_USER] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});