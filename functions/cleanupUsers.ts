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

    console.log('🧹 Starting user cleanup...');

    // Fetch ALL users
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log(`📊 Found ${allUsers.length} total users`);

    // Keep only the two super admins active
    const keepActiveEmails = superAdmins.map(e => e.toLowerCase());
    
    let deletedCount = 0;
    const deletionLog = [];

    for (const user of allUsers) {
      const userEmail = user.email.toLowerCase();
      
      // Skip the two super admins
      if (keepActiveEmails.includes(userEmail)) {
        console.log(`✅ Keeping active: ${user.email}`);
        continue;
      }

      // Delete all other users
      if (user.status !== 'deleted') {
        await base44.asServiceRole.entities.User.update(user.id, {
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          is_active: false
        });

        deletionLog.push({
          email: user.email,
          old_status: user.status,
          deleted_at: new Date().toISOString()
        });
        deletedCount++;
      }
    }

    console.log(`✅ Cleanup complete. Deleted ${deletedCount} users.`);

    return Response.json({
      success: true,
      message: `Cleaned up ${deletedCount} users`,
      total_users: allUsers.length,
      deleted_count: deletedCount,
      active_remaining: keepActiveEmails.length,
      log: deletionLog
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return Response.json({
      error: error.message || 'Cleanup failed'
    }, { status: 500 });
  }
});