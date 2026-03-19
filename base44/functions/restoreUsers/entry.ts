import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = 
      currentUser.role === 'admin' || 
      currentUser.role === 'super_admin' ||
      currentUser.role === 'va' ||
      currentUser.access_level === 'admin' || 
      currentUser.access_level === 'super_admin' ||
      currentUser.access_level === 'va';

    if (!isAdmin) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch ALL users using service role
    const allUsers = await base44.asServiceRole.entities.User.list();

    // Find users that are soft-deleted or disabled
    const deletedUsers = allUsers.filter(u => u.deleted_at);
    const disabledUsers = allUsers.filter(u => u.is_active === false && !u.deleted_at);

    console.log('🔍 Found deleted users:', deletedUsers.length);
    console.log('🔍 Found disabled users:', disabledUsers.length);

    const restored = [];

    // Restore deleted users (remove deleted_at flag)
    for (const u of deletedUsers) {
      await base44.asServiceRole.entities.User.update(u.id, {
        deleted_at: null
      });
      restored.push({
        email: u.email,
        action: 'undeleted',
        was_deleted_at: u.deleted_at
      });
    }

    // Optionally restore disabled users
    for (const u of disabledUsers) {
      await base44.asServiceRole.entities.User.update(u.id, {
        is_active: true
      });
      restored.push({
        email: u.email,
        action: 'enabled'
      });
    }

    return Response.json({
      success: true,
      restored_count: restored.length,
      restored_users: restored,
      total_users_now: allUsers.length
    });
  } catch (error) {
    console.error('Restore users failed:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});