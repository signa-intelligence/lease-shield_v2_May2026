import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * 🧪 TEST ROLE PROMOTION - Manual diagnostic tool
 * 
 * Use this to manually test role changes and see full diagnostics.
 * 
 * Usage from browser console:
 * const result = await base44.functions.invoke('testRolePromotion', {
 *   targetUserEmail: 'user@example.com',
 *   newRole: 'super_admin'
 * });
 */

const ROLE_LIMITS = {
  MINIMUM_SUPER_ADMINS: 2,
  MAXIMUM_SUPER_ADMINS: 2,
  MAXIMUM_ADMINS: 6,
  MAXIMUM_VAS: 10
};

const VALID_ROLES = ['user', 'va', 'admin', 'super_admin'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    console.log('🧪 [TEST_ROLE] Request received');

    if (!currentUser) {
      return Response.json({ 
        error: 'Not authenticated',
        test_code: 'TR001' 
      }, { status: 401 });
    }

    const isSuperAdmin = currentUser.access_level === 'super_admin' || currentUser.role === 'super_admin';
    if (!isSuperAdmin) {
      return Response.json({
        error: 'Only Super Admins can change roles',
        test_code: 'TR002',
        your_role: currentUser.access_level || currentUser.role
      }, { status: 403 });
    }

    const { targetUserEmail, newRole } = await req.json();

    if (!targetUserEmail || !newRole) {
      return Response.json({
        error: 'Missing targetUserEmail or newRole',
        test_code: 'TR003'
      }, { status: 400 });
    }

    console.log('🧪 [TEST_ROLE] Parameters:', { targetUserEmail, newRole });

    // Fetch all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const activeUsers = allUsers.filter(u => u.is_active !== false && !u.deleted_at);
    
    // Find target user
    const targetUser = allUsers.find(u => u.email === targetUserEmail);
    if (!targetUser) {
      return Response.json({
        error: 'User not found',
        test_code: 'TR004',
        searched_email: targetUserEmail,
        available_users: allUsers.map(u => u.email)
      }, { status: 404 });
    }

    const currentRole = targetUser.access_level || 'user';

    // Count roles
    const superAdminCount = activeUsers.filter(u => u.access_level === 'super_admin').length;
    const adminCount = activeUsers.filter(u => u.access_level === 'admin').length;
    const vaCount = activeUsers.filter(u => u.access_level === 'va').length;

    console.log('🧪 [TEST_ROLE] Current state:', {
      targetUser: targetUser.email,
      currentRole,
      requestedRole: newRole,
      roleCounts: {
        super_admins: superAdminCount,
        admins: adminCount,
        vas: vaCount
      }
    });

    // Validate role
    if (!VALID_ROLES.includes(newRole)) {
      return Response.json({
        error: 'Invalid role',
        test_code: 'TR100',
        provided: newRole,
        valid_roles: VALID_ROLES
      }, { status: 400 });
    }

    // Check limits
    const checks = [];

    if (newRole === 'super_admin' && currentRole !== 'super_admin') {
      const canPromote = superAdminCount < ROLE_LIMITS.MAXIMUM_SUPER_ADMINS;
      checks.push({
        check: 'super_admin_limit',
        passed: canPromote,
        current: superAdminCount,
        maximum: ROLE_LIMITS.MAXIMUM_SUPER_ADMINS,
        message: canPromote ? 'OK to promote' : 'Max Super Admins reached'
      });

      if (!canPromote) {
        return Response.json({
          error: 'Maximum Super Admins reached',
          test_code: 'TR101',
          checks,
          current_super_admins: superAdmins.map(u => u.email)
        }, { status: 400 });
      }
    }

    if (currentRole === 'super_admin' && newRole !== 'super_admin') {
      const canDemote = superAdminCount > ROLE_LIMITS.MINIMUM_SUPER_ADMINS;
      checks.push({
        check: 'super_admin_minimum',
        passed: canDemote,
        current: superAdminCount,
        minimum: ROLE_LIMITS.MINIMUM_SUPER_ADMINS,
        message: canDemote ? 'OK to demote' : 'Would violate minimum'
      });

      if (!canDemote) {
        return Response.json({
          error: 'Cannot demote: Would violate minimum Super Admin requirement',
          test_code: 'TR102',
          checks
        }, { status: 400 });
      }
    }

    console.log('✅ [TEST_ROLE] All validation checks passed:', checks);

    // Perform update
    console.log('📝 [TEST_ROLE] Updating database...');
    const updated = await base44.asServiceRole.entities.User.update(targetUser.id, {
      access_level: newRole
    });

    console.log('✅ [TEST_ROLE] Database updated');

    // Verify
    const verified = await base44.asServiceRole.entities.User.filter({ id: targetUser.id });
    const verifiedUser = verified[0];

    console.log('🔍 [TEST_ROLE] Verification:', {
      expected: newRole,
      actual: verifiedUser.access_level,
      match: verifiedUser.access_level === newRole
    });

    const success = verifiedUser.access_level === newRole;

    return Response.json({
      success,
      test_code: success ? 'TR200' : 'TR500',
      transition: `${currentRole} → ${newRole}`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        old_role: currentRole,
        new_role: verifiedUser.access_level
      },
      checks,
      verification: {
        database_updated: updated.access_level === newRole,
        refetch_confirmed: verifiedUser.access_level === newRole,
        fully_verified: success
      },
      new_counts: {
        super_admins: await base44.asServiceRole.entities.User.filter({ access_level: 'super_admin', is_active: { $ne: false }, deleted_at: null }).then(r => r.length),
        admins: await base44.asServiceRole.entities.User.filter({ access_level: 'admin', is_active: { $ne: false }, deleted_at: null }).then(r => r.length),
        vas: await base44.asServiceRole.entities.User.filter({ access_level: 'va', is_active: { $ne: false }, deleted_at: null }).then(r => r.length)
      },
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('🧪 [TEST_ROLE] ❌ EXCEPTION:', error);
    return Response.json({
      success: false,
      test_code: 'TR999',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});