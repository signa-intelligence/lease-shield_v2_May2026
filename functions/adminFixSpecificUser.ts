import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * EMERGENCY FIX: Manually configure user who missed initializeNewUser automation
 * Usage: invoke with { userId: "697f11d79cdf02fe55cc19a1" }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin check
    const currentUser = await base44.auth.me();
    if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role?.toLowerCase()) && !['admin', 'super_admin'].includes(currentUser.access_level?.toLowerCase())) {
      return Response.json({ error: 'Unauthorized - admin access required' }, { status: 403 });
    }
    
    const { userId } = await req.json();
    
    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 });
    }
    
    console.log('[ADMIN_FIX_USER] Fixing user:', userId);
    
    const svc = base44.asServiceRole || base44;
    
    // Get user first
    const user = await svc.entities.User.get(userId);
    
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('[ADMIN_FIX_USER] Current state:', {
      email: user.email,
      tier: user.tier,
      available_scans: user.available_scans,
      subscription_status: user.subscription_status
    });
    
    // Fix user configuration
    await svc.entities.User.update(userId, {
      tier: 'explorer',
      available_scans: 1,
      subscription_status: 'active'
    });
    
    console.log('[ADMIN_FIX_USER] ✅ User fixed successfully');
    
    return Response.json({
      success: true,
      userId,
      email: user.email,
      applied: {
        tier: 'explorer',
        available_scans: 1,
        subscription_status: 'active'
      }
    });
    
  } catch (error) {
    console.error('[ADMIN_FIX_USER] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});