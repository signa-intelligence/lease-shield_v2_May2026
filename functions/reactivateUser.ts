import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Admin-only: Reactivate a deactivated user account
 * Fixes the bug where deleted users can't re-signup because is_active=false
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const adminUser = await base44.auth.me();

    if (!adminUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (adminUser.role !== 'admin' && adminUser.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { targetEmail, listOnly } = await req.json();
    const svc = base44.asServiceRole;

    // If listOnly, find all deactivated users
    if (listOnly) {
      const allUsers = await svc.entities.User.list('-created_date', 200);
      const deactivated = allUsers.filter(u => 
        u.is_active === false || 
        u.plan_tier === 'deleted' || 
        u.data_deleted_at
      );

      return Response.json({
        ok: true,
        total_users: allUsers.length,
        deactivated_count: deactivated.length,
        deactivated_users: deactivated.map(u => ({
          id: u.id,
          email: u.email,
          full_name: u.full_name,
          is_active: u.is_active,
          plan_tier: u.plan_tier,
          data_deleted_at: u.data_deleted_at
        }))
      });
    }

    // Reactivate a specific user
    if (targetEmail) {
      const users = await svc.entities.User.filter({ email: targetEmail });
      
      if (users.length === 0) {
        return Response.json({
          ok: false,
          error: 'USER_NOT_FOUND',
          message: `No user found with email ${targetEmail}`
        }, { status: 404 });
      }

      const targetUser = users[0];
      
      console.log('[REACTIVATE_USER]', {
        email: targetEmail,
        id: targetUser.id,
        current_is_active: targetUser.is_active,
        current_plan_tier: targetUser.plan_tier,
        data_deleted_at: targetUser.data_deleted_at
      });

      // Reactivate: clear deactivation flags, reset to free tier
      await svc.entities.User.update(targetUser.id, {
        is_active: true,
        plan_tier: 'free',
        data_deleted_at: null,
        display_name: targetUser.display_name === '[DELETED]' ? null : targetUser.display_name
      });

      console.log('[REACTIVATE_USER_SUCCESS]', { email: targetEmail });

      return Response.json({
        ok: true,
        message: `User ${targetEmail} has been reactivated`,
        user: {
          id: targetUser.id,
          email: targetEmail,
          previous_is_active: targetUser.is_active,
          previous_plan_tier: targetUser.plan_tier,
          new_is_active: true,
          new_plan_tier: 'free'
        }
      });
    }

    // Reactivate ALL deactivated users
    const allUsers = await svc.entities.User.list('-created_date', 200);
    const deactivated = allUsers.filter(u => 
      u.is_active === false || 
      u.plan_tier === 'deleted' || 
      u.data_deleted_at
    );

    const results = [];
    for (const user of deactivated) {
      try {
        await svc.entities.User.update(user.id, {
          is_active: true,
          plan_tier: 'free',
          data_deleted_at: null,
          display_name: user.display_name === '[DELETED]' ? null : user.display_name
        });
        results.push({ email: user.email, status: 'reactivated' });
        console.log(`[REACTIVATED] ${user.email}`);
      } catch (err) {
        results.push({ email: user.email, status: 'failed', error: err.message });
        console.error(`[REACTIVATE_FAILED] ${user.email}:`, err.message);
      }
    }

    return Response.json({
      ok: true,
      message: `Reactivated ${results.filter(r => r.status === 'reactivated').length} of ${deactivated.length} deactivated users`,
      results
    });

  } catch (error) {
    console.error('[REACTIVATE_USER_ERROR]', error);
    return Response.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
});