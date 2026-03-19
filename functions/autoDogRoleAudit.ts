import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * 🐕 AUTO-DOG: SuperAdmin Role Diagnostic & Self-Check System
 * 
 * Automatically validates role changes and system integrity.
 * Triggers on every role update to ensure consistency.
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
    
    // Authenticate
    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ 
        error: 'Not authenticated',
        autodog_code: 'AD001' 
      }, { status: 401 });
    }

    const { userId, targetRole, operation } = await req.json();

    console.log('🐕 [AUTO-DOG] Starting role audit:', {
      operation,
      userId,
      targetRole,
      triggeredBy: currentUser.email,
      timestamp: new Date().toISOString()
    });

    // Fetch all users for context
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    // Count current roles
    const activeUsers = allUsers.filter(u => u.is_active !== false && !u.deleted_at);
    const superAdminCount = activeUsers.filter(u => u.access_level === 'super_admin').length;
    const adminCount = activeUsers.filter(u => u.access_level === 'admin').length;
    const vaCount = activeUsers.filter(u => u.access_level === 'va').length;

    // Fetch target user
    const targetUser = allUsers.find(u => u.id === userId);
    if (!targetUser) {
      return Response.json({
        error: 'User not found',
        autodog_code: 'AD002',
        diagnostics: { userId }
      }, { status: 404 });
    }

    const currentRole = targetUser.access_level || 'user';

    console.log('🐕 [AUTO-DOG] Current state:', {
      targetUser: targetUser.email,
      currentRole,
      targetRole,
      roleCounts: {
        super_admins: superAdminCount,
        admins: adminCount,
        vas: vaCount
      }
    });

    // ────────────────────────────────────────
    // VALIDATION LAYER
    // ────────────────────────────────────────
    
    const validationErrors = [];
    const warnings = [];

    // 1. Validate target role is valid
    if (!VALID_ROLES.includes(targetRole)) {
      validationErrors.push({
        code: 'AD100',
        message: `Invalid role: ${targetRole}`,
        field: 'targetRole',
        hint: `Must be one of: ${VALID_ROLES.join(', ')}`
      });
    }

    // 2. Check if trying to demote below minimum
    if (currentRole === 'super_admin' && targetRole !== 'super_admin') {
      if (superAdminCount <= ROLE_LIMITS.MINIMUM_SUPER_ADMINS) {
        validationErrors.push({
          code: 'AD101',
          message: `Cannot demote: Would leave only ${superAdminCount - 1} Super Admin(s), minimum is ${ROLE_LIMITS.MINIMUM_SUPER_ADMINS}`,
          field: 'superAdminCount',
          hint: 'Promote another user to Super Admin first'
        });
      }
    }

    // 3. Check if promoting beyond maximum
    if (targetRole === 'super_admin' && currentRole !== 'super_admin') {
      if (superAdminCount >= ROLE_LIMITS.MAXIMUM_SUPER_ADMINS) {
        validationErrors.push({
          code: 'AD102',
          message: `Cannot promote: Already have ${superAdminCount} Super Admin(s), maximum is ${ROLE_LIMITS.MAXIMUM_SUPER_ADMINS}`,
          field: 'superAdminCount',
          hint: 'Demote an existing Super Admin first'
        });
      }
    }

    if (targetRole === 'admin' && currentRole !== 'admin') {
      if (adminCount >= ROLE_LIMITS.MAXIMUM_ADMINS) {
        validationErrors.push({
          code: 'AD103',
          message: `Cannot promote: Already have ${adminCount} Admin(s), maximum is ${ROLE_LIMITS.MAXIMUM_ADMINS}`,
          field: 'adminCount',
          hint: 'Demote an existing Admin first'
        });
      }
    }

    if (targetRole === 'va' && currentRole !== 'va') {
      if (vaCount >= ROLE_LIMITS.MAXIMUM_VAS) {
        validationErrors.push({
          code: 'AD104',
          message: `Cannot promote: Already have ${vaCount} VA(s), maximum is ${ROLE_LIMITS.MAXIMUM_VAS}`,
          field: 'vaCount',
          hint: 'Demote an existing VA first'
        });
      }
    }

    // 4. Check self-modification
    if (userId === currentUser.id && targetRole === 'user') {
      warnings.push({
        code: 'AD200',
        message: 'User is demoting themselves - they may lose admin access',
        severity: 'high'
      });
    }

    // ────────────────────────────────────────
    // RETURN VALIDATION RESULT
    // ────────────────────────────────────────

    if (validationErrors.length > 0) {
      console.error('🐕 [AUTO-DOG] ❌ Validation failed:', validationErrors);
      return Response.json({
        success: false,
        autodog_code: validationErrors[0].code,
        errors: validationErrors,
        warnings,
        diagnostics: {
          currentRole,
          targetRole,
          userId,
          roleCounts: {
            super_admins: superAdminCount,
            admins: adminCount,
            vas: vaCount
          },
          limits: ROLE_LIMITS
        }
      }, { status: 400 });
    }

    // ────────────────────────────────────────
    // PERFORM UPDATE
    // ────────────────────────────────────────

    console.log('🐕 [AUTO-DOG] ✅ Validation passed - proceeding with role update');

    const updateResult = await base44.asServiceRole.entities.User.update(userId, {
      access_level: targetRole
    });

    console.log('🐕 [AUTO-DOG] ✅ Role updated in database:', {
      userId: updateResult.id,
      email: updateResult.email,
      oldRole: currentRole,
      newRole: updateResult.access_level,
      timestamp: new Date().toISOString()
    });

    // ────────────────────────────────────────
    // POST-UPDATE VERIFICATION
    // ────────────────────────────────────────

    const verificationErrors = [];

    // 1. Verify role was actually updated
    if (updateResult.access_level !== targetRole) {
      verificationErrors.push({
        code: 'AD300',
        message: 'Database update succeeded but role value mismatch',
        expected: targetRole,
        actual: updateResult.access_level,
        severity: 'critical'
      });
    }

    // 2. Re-fetch user to confirm persistence
    const refetchedUser = (await base44.asServiceRole.entities.User.filter({ id: userId }))[0];
    if (!refetchedUser || refetchedUser.access_level !== targetRole) {
      verificationErrors.push({
        code: 'AD301',
        message: 'Role update did not persist - refetch shows different value',
        expected: targetRole,
        actual: refetchedUser?.access_level,
        severity: 'critical'
      });
    }

    // 3. Verify counts still valid
    const updatedUsers = await base44.asServiceRole.entities.User.list();
    const updatedActiveUsers = updatedUsers.filter(u => u.is_active !== false && !u.deleted_at);
    const newSuperAdminCount = updatedActiveUsers.filter(u => u.access_level === 'super_admin').length;

    if (newSuperAdminCount < ROLE_LIMITS.MINIMUM_SUPER_ADMINS) {
      verificationErrors.push({
        code: 'AD302',
        message: `CRITICAL: Super Admin count dropped below minimum (${newSuperAdminCount} < ${ROLE_LIMITS.MINIMUM_SUPER_ADMINS})`,
        severity: 'critical',
        hint: 'System integrity compromised - immediate action required'
      });
    }

    // ────────────────────────────────────────
    // AUTODOG SUMMARY REPORT
    // ────────────────────────────────────────

    const report = {
      success: verificationErrors.length === 0,
      autodog_version: '1.0.0',
      timestamp: new Date().toISOString(),
      operation: {
        type: operation || 'role_update',
        userId,
        email: targetUser.email,
        transition: `${currentRole} → ${targetRole}`,
        triggeredBy: currentUser.email
      },
      validation: {
        passed: true,
        warnings: warnings.length > 0 ? warnings : null
      },
      update: {
        success: true,
        persisted: verificationErrors.length === 0
      },
      verification: {
        errors: verificationErrors.length > 0 ? verificationErrors : null,
        roleCounts: {
          super_admins: newSuperAdminCount,
          admins: updatedActiveUsers.filter(u => u.access_level === 'admin').length,
          vas: updatedActiveUsers.filter(u => u.access_level === 'va').length
        },
        limits: ROLE_LIMITS,
        within_limits: 
          newSuperAdminCount >= ROLE_LIMITS.MINIMUM_SUPER_ADMINS &&
          newSuperAdminCount <= ROLE_LIMITS.MAXIMUM_SUPER_ADMINS
      },
      diagnostics: {
        database_consistent: verificationErrors.length === 0,
        role_enum_valid: VALID_ROLES.includes(targetRole),
        system_healthy: verificationErrors.length === 0 && warnings.length === 0
      }
    };

    console.log('🐕 [AUTO-DOG] Final report:', JSON.stringify(report, null, 2));

    if (verificationErrors.length > 0) {
      console.error('🐕 [AUTO-DOG] ❌ POST-UPDATE VERIFICATION FAILED:', verificationErrors);
      return Response.json({
        ...report,
        error: 'Role update verification failed - see diagnostics',
        help: 'Check AutoDog logs for detailed breakdown'
      }, { status: 500 });
    }

    console.log('🐕 [AUTO-DOG] ✅ All checks passed - role update successful');

    return Response.json(report, { status: 200 });

  } catch (error) {
    console.error('🐕 [AUTO-DOG] ❌ CRITICAL ERROR:', error);
    return Response.json({
      success: false,
      autodog_code: 'AD999',
      error: error.message,
      stack: error.stack,
      help: 'AutoDog encountered an unexpected error - check logs',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});