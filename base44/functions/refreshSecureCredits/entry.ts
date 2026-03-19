import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * SECURE TIER MONTHLY CREDIT REFRESH
 * 
 * Runs daily via scheduled automation.
 * Adds 50 letter credits to active Secure users every 30 days
 * based on their last_credit_refresh or subscription_started_at date.
 * 
 * Credits ACCUMULATE (add 50, don't replace).
 * Only runs for users with plan_tier='secure' and subscription_status='active'.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Auth check - only admin can trigger manually
    const caller = await base44.auth.me();
    if (caller?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    
    const secureUsers = allUsers.filter(u => 
      u.plan_tier === 'secure' && 
      u.subscription_status === 'active'
    );

    console.log(`[CREDIT_REFRESH] Found ${secureUsers.length} active Secure users`);

    const now = new Date();
    const results = [];

    for (const user of secureUsers) {
      const lastRefreshStr = user.last_credit_refresh || user.subscription_started_at;
      
      if (!lastRefreshStr) {
        // No date tracked yet — set it now, give initial credits
        console.log(`[CREDIT_REFRESH] No refresh date for ${user.email}, initializing`);
        await base44.asServiceRole.entities.User.update(user.id, {
          last_credit_refresh: now.toISOString()
        });
        results.push({ email: user.email, action: 'initialized_date', credits: user.letter_credits || 0 });
        continue;
      }

      const lastRefresh = new Date(lastRefreshStr);
      const daysSinceRefresh = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceRefresh >= 30) {
        const currentCredits = user.letter_credits || 0;
        const newCredits = currentCredits + 50;

        await base44.asServiceRole.entities.User.update(user.id, {
          letter_credits: newCredits,
          last_credit_refresh: now.toISOString()
        });

        console.log(`[CREDIT_REFRESH] ✅ ${user.email}: ${currentCredits} → ${newCredits} (+50)`);
        results.push({ email: user.email, action: 'refreshed', oldCredits: currentCredits, newCredits, daysSince: Math.floor(daysSinceRefresh) });
      } else {
        results.push({ email: user.email, action: 'skipped', daysSince: Math.floor(daysSinceRefresh), nextIn: Math.ceil(30 - daysSinceRefresh) });
      }
    }

    const refreshedCount = results.filter(r => r.action === 'refreshed').length;
    console.log(`[CREDIT_REFRESH] Done. Refreshed: ${refreshedCount}/${secureUsers.length}`);

    return Response.json({
      ok: true,
      totalSecureUsers: secureUsers.length,
      refreshed: refreshedCount,
      results
    });

  } catch (error) {
    console.error('[CREDIT_REFRESH_ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});