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

    // Fetch active and disabled users (exclude deleted)
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date');
    const users = allUsers.filter(u => u.status !== 'deleted');

    return Response.json({ 
      success: true,
      users,
      counts: {
        active: allUsers.filter(u => u.status === 'active').length,
        disabled: allUsers.filter(u => u.status === 'disabled').length,
        deleted: allUsers.filter(u => u.status === 'deleted').length
      }
    });

  } catch (error) {
    console.error('Admin list users error:', error);
    return Response.json({ 
      error: error.message || 'Failed to fetch users'
    }, { status: 500 });
  }
});