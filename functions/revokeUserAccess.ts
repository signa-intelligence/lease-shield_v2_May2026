import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * CRITICAL AUTH ENFORCEMENT ENDPOINT
 * 
 * Validates user status on every authenticated request.
 * Blocks access for suspended/deleted users.
 * 
 * Frontend should call this on app init and on critical actions.
 * 
 * Returns:
 * - { allowed: true, user } if active
 * - { allowed: false, reason } if blocked
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current user
    const me = await base44.auth.me();
    
    if (!me) {
      return Response.json({
        allowed: false,
        reason: 'NOT_AUTHENTICATED',
        message: 'Authentication required'
      }, { status: 401 });
    }
    
    const userStatus = me.status || 'active';
    
    console.log('🔐 [REVOKE_CHECK] Validating access:', {
      email: me.email,
      status: userStatus,
      is_active: me.is_active,
      deleted_at: me.deleted_at,
      suspended_at: me.suspended_at
    });
    
    // ✅ Enforce status check
    if (userStatus === 'deleted') {
      console.warn('🚫 [REVOKE_CHECK] Access denied - user deleted:', me.email);
      return Response.json({
        allowed: false,
        reason: 'ACCOUNT_DELETED',
        message: 'Account deleted. Contact support if this is an error.',
        deleted_at: me.deleted_at,
        deleted_by: me.deleted_by
      }, { status: 403 });
    }
    
    if (userStatus === 'suspended') {
      console.warn('🚫 [REVOKE_CHECK] Access denied - user suspended:', me.email);
      return Response.json({
        allowed: false,
        reason: 'ACCOUNT_SUSPENDED',
        message: me.suspension_reason || 'Account suspended. Contact support for assistance.',
        suspended_at: me.suspended_at,
        suspended_by: me.suspended_by
      }, { status: 403 });
    }
    
    // ✅ Backward compatibility: check is_active flag
    if (me.is_active === false) {
      console.warn('🚫 [REVOKE_CHECK] Access denied - is_active=false:', me.email);
      return Response.json({
        allowed: false,
        reason: 'ACCOUNT_INACTIVE',
        message: 'Account deactivated. Contact support.'
      }, { status: 403 });
    }
    
    // ✅ User is active and allowed
    console.log('✅ [REVOKE_CHECK] Access granted:', me.email);
    return Response.json({
      allowed: true,
      user: {
        id: me.id,
        email: me.email,
        full_name: me.full_name,
        status: userStatus,
        access_level: me.access_level,
        plan_tier: me.plan_tier
      }
    });
    
  } catch (error) {
    console.error('❌ [REVOKE_CHECK] Error:', error);
    return Response.json({
      allowed: false,
      reason: 'SERVER_ERROR',
      message: error.message
    }, { status: 500 });
  }
});