import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin' && currentUser.access_level !== 'super_admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, role, access_level, is_super_admin } = await req.json();

    if (!userId || !role) {
      return Response.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    // Fetch the user being updated
    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find(u => u.id === userId);

    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // SAFEGUARD: Prevent last super admin from removing their own super admin status
    const isSelfUpdate = currentUser.id === userId;
    const isRemovingSuperAdmin = 
      (targetUser.role === 'super_admin' || targetUser.is_super_admin === true || targetUser.access_level === 'super_admin') &&
      (role !== 'super_admin' || is_super_admin === false || access_level !== 'super_admin');

    if (isSelfUpdate && isRemovingSuperAdmin) {
      // Count total super admins
      const superAdmins = allUsers.filter(u => 
        u.role === 'super_admin' || 
        u.is_super_admin === true || 
        u.access_level === 'super_admin'
      );

      if (superAdmins.length <= 1) {
        return Response.json({ 
          error: 'Cannot remove super admin status. You are the only super admin. Please promote another user first.',
          code: 'LAST_SUPER_ADMIN'
        }, { status: 400 });
      }
    }

    // Update the user
    const updateData = {
      role,
      access_level: access_level || role,
      is_super_admin: is_super_admin !== undefined ? is_super_admin : (role === 'super_admin')
    };

    await base44.asServiceRole.entities.User.update(userId, updateData);

    console.log('✅ User role updated:', {
      userId,
      email: targetUser.email,
      oldRole: targetUser.role,
      newRole: role,
      updatedBy: currentUser.email
    });

    return Response.json({ 
      success: true,
      user: {
        id: userId,
        email: targetUser.email,
        role,
        access_level: updateData.access_level,
        is_super_admin: updateData.is_super_admin
      }
    });
  } catch (error) {
    console.error('❌ Update user role error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});