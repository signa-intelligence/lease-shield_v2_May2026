import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    
    const usersToFix = [
      'signaconsultants@gmail.com',
      'dom.sources@gmail.com',
      'signaturehairandnail@gmail.com',
      'jay.p@signa-consultants.com',
      'signa.asset.management@gmail.com',
      'signaintelligence@gmail.com'
    ];

    const results = [];

    for (const email of usersToFix) {
      try {
        // List users and find by email
        const allUsers = await svc.entities.User.filter({ email });
        
        if (!allUsers || allUsers.length === 0) {
          results.push({ email, status: 'NOT_FOUND' });
          continue;
        }

        const targetUser = allUsers[0];
        const beforeScans = targetUser.available_scans;
        const beforeTier = targetUser.plan_tier;

        await svc.entities.User.update(targetUser.id, {
          plan_tier: 'free',
          available_scans: 1,
          is_active: true,
          subscription_status: 'active'
        });

        // Verify
        const updated = await svc.entities.User.get(targetUser.id);

        results.push({
          email,
          status: 'FIXED',
          before: { plan_tier: beforeTier, available_scans: beforeScans },
          after: { plan_tier: updated.plan_tier, available_scans: updated.available_scans }
        });

      } catch (err) {
        results.push({ email, status: 'ERROR', error: err.message });
      }
    }

    const fixedCount = results.filter(r => r.status === 'FIXED').length;

    return Response.json({
      success: true,
      fixed: fixedCount,
      total: usersToFix.length,
      results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});