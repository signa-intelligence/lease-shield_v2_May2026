import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { requireSuperAdmin, safeLog } from './authGuards.js';
import { handleCors, ensureAllowedOrigin, err, requireRecentAuth } from './http.js';

Deno.serve(async (req) => {
  const pre = handleCors(req); if (pre) return pre;
  const { allowed, requestId } = ensureAllowedOrigin(req); if (!allowed) return err(req, 'CORS_FORBIDDEN', 'Origin not allowed', 403, requestId);
  try {
    // SECURITY FIX: Role-based auth instead of hard-coded emails
    const { user, base44 } = await requireSuperAdmin(req);

    const { userId, role } = await req.json();

    if (!userId || !role) {
      return Response.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    // Valid roles
    const validRoles = ['user', 'admin', 'va', 'super_admin'];
    if (!validRoles.includes(role)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 });
    }

    await safeLog('ADMIN_UPDATE_ROLE', { userId, role });

    // Update user using service role (access_level, not role)
    const updatedUser = await base44.asServiceRole.entities.User.update(userId, { access_level: role });

    await safeLog('ADMIN_UPDATE_ROLE_SUCCESS', { userId, newRole: role });

    return Response.json({ 
      success: true,
      message: `User role updated to ${role}`,
      user: updatedUser
    });

  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return err(req, 'UNAUTHORIZED', 'Unauthorized', 401);
    }
    if (error.message === 'FORBIDDEN') {
      return Response.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }
    
    console.error('[ADMIN_UPDATE_ROLE_ERROR]', { error: error.message });
    return Response.json({ 
      error: 'Failed to update user role'
    }, { status: 500 });
  }
});