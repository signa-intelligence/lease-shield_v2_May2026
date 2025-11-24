import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    if (!currentUser) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only super_admin can update roles (check both role and access_level)
    const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.access_level === 'super_admin';
    if (!isSuperAdmin) {
      return Response.json({ 
        success: false, 
        error: 'Forbidden - Super Admin access required',
        autodog_code: 'UR001' 
      }, { status: 403 });
    }

    const { targetUserId, newRole } = await req.json();

    if (!targetUserId || !newRole) {
      return Response.json(
        { success: false, error: 'Missing targetUserId or newRole' },
        { status: 400 }
      );
    }

    // 1. Load all users
    const users = await base44.asServiceRole.entities.User.list();

    // 2. Find the target user
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) {
      return Response.json(
        { success: false, error: 'user_not_found' },
        { status: 404 }
      );
    }

    // 3. CRITICAL FIX: Check access_level (not role) for role management
    const activeUsers = users.filter(u => u.is_active !== false && !u.deleted_at);
    const superAdmins = activeUsers.filter(u => u.access_level === 'super_admin');
    const admins = activeUsers.filter(u => u.access_level === 'admin');
    const vas = activeUsers.filter(u => u.access_level === 'va');

    console.log('🔍 [UPDATE_ROLE] Current role counts:', {
      super_admins: superAdmins.length,
      admins: admins.length,
      vas: vas.length
    });

    const currentRole = targetUser.access_level || 'user';
    
    // 4. ROLE LIMITS CONFIGURATION
    const MINIMUM_SUPER_ADMINS = 2;
    const MAXIMUM_SUPER_ADMINS = 2;
    const MAXIMUM_ADMINS = 6;
    const MAXIMUM_VAS = 10;

    // 5. Validation checks
    const isSelf = currentUser && targetUser.id === currentUser.id;

    // Check minimum Super Admin constraint
    if (currentRole === 'super_admin' && newRole !== 'super_admin') {
      if (superAdmins.length <= MINIMUM_SUPER_ADMINS) {
        console.error('🐕 [AUTO-DOG] ❌ Cannot demote: Would violate minimum Super Admin requirement');
        return Response.json({
          success: false,
          error: 'cannot_demote_below_minimum',
          autodog_code: 'UR101',
          message: `Cannot demote: System requires at least ${MINIMUM_SUPER_ADMINS} Super Admins`,
          current_count: superAdmins.length
        }, { status: 400 });
      }
    }

    // Check maximum role limits
    if (newRole === 'super_admin' && currentRole !== 'super_admin') {
      if (superAdmins.length >= MAXIMUM_SUPER_ADMINS) {
        console.error('🐕 [AUTO-DOG] ❌ Cannot promote: Max Super Admins reached');
        return Response.json({
          success: false,
          error: 'max_super_admins_reached',
          autodog_code: 'UR102',
          message: `Maximum ${MAXIMUM_SUPER_ADMINS} Super Admins allowed`,
          current_count: superAdmins.length
        }, { status: 400 });
      }
    }

    if (newRole === 'admin' && currentRole !== 'admin') {
      if (admins.length >= MAXIMUM_ADMINS) {
        return Response.json({
          success: false,
          error: 'max_admins_reached',
          autodog_code: 'UR103',
          message: `Maximum ${MAXIMUM_ADMINS} Admins allowed`,
          current_count: admins.length
        }, { status: 400 });
      }
    }

    if (newRole === 'va' && currentRole !== 'va') {
      if (vas.length >= MAXIMUM_VAS) {
        return Response.json({
          success: false,
          error: 'max_vas_reached',
          autodog_code: 'UR104',
          message: `Maximum ${MAXIMUM_VAS} VAs allowed`,
          current_count: vas.length
        }, { status: 400 });
      }
    }

    // Self-demotion warning (but allow it)
    if (isSelf && newRole === 'user') {
      console.warn('⚠️ [UPDATE_ROLE] User is demoting themselves to regular user');
    }

    console.log('🐕 [AUTO-DOG] Validation passed - updating role:', {
      user: targetUser.email,
      from: currentRole,
      to: newRole
    });

    // Update the role using access_level (not role)
    await base44.asServiceRole.entities.User.update(targetUserId, {
      access_level: newRole
    });

    // 🐕 AUTO-DOG: Post-update verification
    const updatedUser = (await base44.asServiceRole.entities.User.filter({ id: targetUserId }))[0];
    
    console.log('🐕 [AUTO-DOG] Verifying role update:', {
      userId: targetUserId,
      email: targetUser.email,
      expectedRole: newRole,
      actualRole: updatedUser.access_level,
      success: updatedUser.access_level === newRole
    });

    if (updatedUser.access_level !== newRole) {
      console.error('🐕 [AUTO-DOG] ❌ CRITICAL: Role mismatch after update!');
      return Response.json({
        success: false,
        error: 'role_update_verification_failed',
        autodog_code: 'UR300',
        expected: newRole,
        actual: updatedUser.access_level,
        message: 'Role was not properly persisted'
      }, { status: 500 });
    }

    console.log(`✅ Role updated successfully: ${targetUser.email} → ${newRole}`);

    return Response.json({
      success: true,
      autodog_verified: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        access_level: newRole,
        role: newRole // For backward compatibility
      },
      transition: `${currentRole} → ${newRole}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ updateUserRole error:', error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
});