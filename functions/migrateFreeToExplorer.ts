import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all users via service role
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 200);
    
    const freeUsers = allUsers.filter(u => u.plan_tier === 'free' || (!u.plan_tier && !['lite', 'protect', 'secure'].includes(u.plan_tier)));
    
    console.log('[MIGRATION] Found users with plan_tier=free or missing:', freeUsers.length);
    console.log('[MIGRATION] Emails:', freeUsers.map(u => u.email));

    const results = [];
    
    for (const u of freeUsers) {
      try {
        // Only migrate users that are actually "free" tier (not paid tiers)
        const currentTier = u.plan_tier || '';
        if (currentTier === 'free' || currentTier === '' || currentTier === undefined) {
          await base44.asServiceRole.entities.User.update(u.id, { plan_tier: 'explorer' });
          results.push({ email: u.email, id: u.id, status: 'migrated', from: currentTier, to: 'explorer' });
          console.log('[MIGRATION] ✅', u.email, '→ explorer');
        } else {
          results.push({ email: u.email, id: u.id, status: 'skipped', reason: `already ${currentTier}` });
        }
      } catch (err) {
        results.push({ email: u.email, id: u.id, status: 'failed', error: err.message });
        console.error('[MIGRATION] ❌', u.email, err.message);
      }
    }

    // Verify
    const afterUsers = await base44.asServiceRole.entities.User.list('-created_date', 200);
    const stillFree = afterUsers.filter(u => u.plan_tier === 'free');
    
    return Response.json({
      success: true,
      total_users: allUsers.length,
      free_users_found: freeUsers.length,
      results,
      verification: {
        remaining_free_users: stillFree.length,
        remaining_free_emails: stillFree.map(u => u.email)
      }
    });
  } catch (error) {
    console.error('[MIGRATION_ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});