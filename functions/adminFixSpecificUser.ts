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
    
    // FORCE update with values from parameters or data.* if root is null
    const updateData = {
      tier: tier || user.tier || user.data?.tier || 'explorer',
      available_scans: available_scans !== null && available_scans !== undefined ? available_scans : (user.available_scans !== null && user.available_scans !== undefined ? user.available_scans : (user.data?.available_scans ?? 1)),
      subscription_status: subscription_status || user.subscription_status || user.data?.subscription_status || 'active'
    };
    
    console.log('[ADMIN_FIX_USER] Applying update:', updateData);
    
    // Fix user configuration
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