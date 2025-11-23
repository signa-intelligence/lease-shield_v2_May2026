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

    // Fetch ALL users using service role (bypasses RLS)
    const allUsers = await base44.asServiceRole.entities.User.list();

    console.log('📊 Total users in database:', allUsers.length);

    // Analyze user data
    const analysis = {
      total_users: allUsers.length,
      current_user: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        access_level: currentUser.access_level
      },
      users_by_role: {},
      users_by_access_level: {},
      users_by_status: {
        active: 0,
        disabled: 0,
        deleted: 0,
        no_status_flag: 0
      },
      users_detail: allUsers.map(u => ({
        id: u.id.slice(0, 8),
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        access_level: u.access_level,
        plan_tier: u.plan_tier,
        is_active: u.is_active,
        deleted_at: u.deleted_at,
        created_date: u.created_date,
        subscription_status: u.subscription_status
      }))
    };

    // Count by role
    allUsers.forEach(u => {
      const role = u.role || 'no_role';
      analysis.users_by_role[role] = (analysis.users_by_role[role] || 0) + 1;
    });

    // Count by access_level
    allUsers.forEach(u => {
      const level = u.access_level || 'no_access_level';
      analysis.users_by_access_level[level] = (analysis.users_by_access_level[level] || 0) + 1;
    });

    // Count by status
    allUsers.forEach(u => {
      if (u.deleted_at) {
        analysis.users_by_status.deleted++;
      } else if (u.is_active === false) {
        analysis.users_by_status.disabled++;
      } else if (u.is_active === true) {
        analysis.users_by_status.active++;
      } else {
        analysis.users_by_status.no_status_flag++;
      }
    });

    return Response.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Debug users failed:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});