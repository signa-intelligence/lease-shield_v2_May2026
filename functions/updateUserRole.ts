import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    if (!currentUser) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only super_admin can update roles
    if (currentUser.role !== 'super_admin') {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
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

    // 3. Count current super admins
    const superAdmins = users.filter(u => u.role === 'super_admin');

    // 4. Detect last super admin and self-demotion
    const isLastSuperAdmin = targetUser.role === 'super_admin' && superAdmins.length === 1;
    const isSelf = currentUser && targetUser.id === currentUser.id;

    // 5. Safety guards
    if (isLastSuperAdmin && newRole !== 'super_admin') {
      return Response.json(
        { success: false, error: 'cannot_remove_last_super_admin' },
        { status: 400 }
      );
    }

    if (isSelf && targetUser.role === 'super_admin' && newRole !== 'super_admin') {
      return Response.json(
        { success: false, error: 'cannot_demote_self' },
        { status: 400 }
      );
    }

    // Update the role
    await base44.asServiceRole.entities.User.update(targetUserId, {
      role: newRole
    });

    console.log(`✅ Role updated: ${targetUser.email} → ${newRole}`);

    return Response.json({
      success: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: newRole
      }
    });

  } catch (error) {
    console.error('❌ updateUserRole error:', error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
});