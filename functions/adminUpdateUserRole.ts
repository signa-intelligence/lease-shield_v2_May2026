import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    if (!currentUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins allowed
    const superAdmins = ['steve.l@signa-consultants.com', 'steve.d.lockhart@gmail.com'];
    if (!superAdmins.includes(currentUser.email.toLowerCase())) {
      return Response.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }

    const { userId, role } = await req.json();

    if (!userId || !role) {
      return Response.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    // Valid roles
    const validRoles = ['user', 'admin', 'va', 'super_admin'];
    if (!validRoles.includes(role)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 });
    }

    console.log('🔄 Updating user role:', { userId, role });

    // Update user using service role (access_level, not role)
    const updatedUser = await base44.asServiceRole.entities.User.update(userId, { access_level: role });

    console.log('✅ Role update complete:', updatedUser);

    return Response.json({ 
      success: true,
      message: `User role updated to ${role}`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Admin update role error:', error);
    return Response.json({ 
      error: error.message || 'Failed to update user role'
    }, { status: 500 });
  }
});