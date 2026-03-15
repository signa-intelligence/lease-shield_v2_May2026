import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = user.role === 'super_admin' || user.access_level === 'super_admin';
    if (!isSuperAdmin) {
      return Response.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }

    const { userId, role } = await req.json();

    if (!userId || !role) {
      return Response.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    const validRoles = ['user', 'admin', 'va', 'super_admin'];
    if (!validRoles.includes(role)) {
      return Response.json({ error: `Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}` }, { status: 400 });
    }

    // Prevent changing own role
    if (userId === user.id) {
      return Response.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    console.log('[ADMIN_UPDATE_ROLE]', { targetUserId: userId, newRole: role, by: user.email });

    const updatedUser = await base44.asServiceRole.entities.User.update(userId, { access_level: role });

    console.log('[ADMIN_UPDATE_ROLE_SUCCESS]', { targetUserId: userId, newRole: role });

    return Response.json({ 
      success: true,
      message: `User role updated to ${role}`,
      user: updatedUser
    });

  } catch (error) {
    console.error('[ADMIN_UPDATE_ROLE_ERROR]', error.message);
    return Response.json({ error: error.message || 'Failed to update user role' }, { status: 500 });
  }
});