import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify super admin access
    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = 
      currentUser.access_level === 'super_admin' ||
      currentUser.role === 'super_admin';

    if (!isSuperAdmin) {
      return Response.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    // Fetch ALL users using service role
    const allUsers = await base44.asServiceRole.entities.User.list();

    // Create backup snapshot
    const backup = {
      backup_date: new Date().toISOString(),
      backup_by: currentUser.email,
      total_users: allUsers.length,
      users: allUsers.map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        access_level: u.access_level,
        plan_tier: u.plan_tier,
        subscription_status: u.subscription_status,
        letter_credits: u.letter_credits,
        is_active: u.is_active,
        deleted_at: u.deleted_at,
        created_date: u.created_date,
        updated_date: u.updated_date,
        line_messaging_token: u.line_messaging_token ? 'CONNECTED' : null,
        member_since: u.member_since,
        subscription_start_date: u.subscription_start_date,
        onboarding_completed: u.onboarding_completed
      }))
    };

    // Create downloadable JSON file
    const jsonContent = JSON.stringify(backup, null, 2);
    const blob = new TextEncoder().encode(jsonContent);

    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename=users_backup_${new Date().toISOString().split('T')[0]}.json`
      }
    });
  } catch (error) {
    console.error('Export backup failed:', error);
    return Response.json({ 
      success: false,
      error: error.message
    }, { status: 500 });
  }
});