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

    console.log('🔄 Starting user status migration...');

    // Fetch ALL users (including deleted)
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log(`📊 Found ${allUsers.length} total users`);

    let updated = 0;
    const updateLog = [];

    for (const user of allUsers) {
      let newStatus;
      let newIsActive;

      // Determine canonical status
      if (user.deleted_at) {
        newStatus = 'deleted';
        newIsActive = false;
      } else if (user.is_active === false) {
        newStatus = 'disabled';
        newIsActive = false;
      } else {
        newStatus = 'active';
        newIsActive = true;
      }

      // Only update if status is missing or incorrect
      if (user.status !== newStatus || user.is_active !== newIsActive) {
        await base44.asServiceRole.entities.User.update(user.id, {
          status: newStatus,
          is_active: newIsActive
        });

        updateLog.push({
          email: user.email,
          old: { status: user.status, is_active: user.is_active, deleted_at: user.deleted_at },
          new: { status: newStatus, is_active: newIsActive }
        });
        updated++;
      }
    }

    console.log(`✅ Migration complete. Updated ${updated} users.`);

    return Response.json({
      success: true,
      message: `Migrated ${updated} users`,
      total_users: allUsers.length,
      updated_count: updated,
      log: updateLog
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return Response.json({
      error: error.message || 'Migration failed'
    }, { status: 500 });
  }
});