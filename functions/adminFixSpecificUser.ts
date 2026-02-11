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
    
    // Build update payload - also accept "scans" shorthand
    const updateData = {};
    if (tier !== undefined) updateData.tier = tier;
    if (available_scans !== undefined) updateData.available_scans = available_scans;
    if (subscription_status !== undefined) updateData.subscription_status = subscription_status;
    
    // Support "scans" shorthand from caller
    if (rawBody?.scans !== undefined) updateData.available_scans = rawBody.scans;
    
    // If nothing explicit, apply defaults
    if (Object.keys(updateData).length === 0) {
      updateData.available_scans = 1;
    }
    
    console.log('[ADMIN_FIX_USER] Applying update:', updateData);
    
    // CRITICAL FIX: The User entity nests custom fields inside `data`.
    // svc.entities.User.update() auto-wraps into data.X.
    // But if `data.data` exists from prior bugs, we must also clean it.
    // First, do the normal update:
    await svc.entities.User.update(user.id, updateData);
    
    // Then clean up any nested data.data pollution
    if (user.data?.data) {
      console.log('[ADMIN_FIX_USER] Cleaning nested data.data pollution');
      // Flatten data.data fields into data level
      const nestedData = user.data.data;
      const cleanUpdate = {};
      for (const [key, val] of Object.entries(nestedData)) {
        // Only promote if the root level doesn't already have it set correctly
        if (updateData[key] !== undefined) {
          cleanUpdate[key] = updateData[key]; // Use the new value
        }
      }
      if (Object.keys(cleanUpdate).length > 0) {
        await svc.entities.User.update(user.id, cleanUpdate);
      }
    }
    
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