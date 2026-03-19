import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin' && 
                  user.access_level !== 'admin' && user.access_level !== 'super_admin')) {
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const excludeEmail = body.excludeEmail || 'shortyroc36@gmail.com';
    const dryRun = body.dryRun === true;

    // Scan and letter allocations per tier
    const scanAllocation = { explorer: 1, lite: 6, protect: 12, secure: 50 };
    const letterAllocation = { explorer: 0, lite: 3, protect: 10, secure: 50 };

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();

    const results = [];
    let resetCount = 0;
    let skippedCount = 0;

    for (const u of allUsers) {
      // Skip excluded email
      if (u.email === excludeEmail) {
        skippedCount++;
        results.push({ email: u.email, action: 'SKIPPED (excluded)' });
        continue;
      }

      const tier = u.plan_tier || 'explorer';
      const expectedScans = scanAllocation[tier] || 1;
      const expectedLetters = letterAllocation[tier] || 0;

      if (dryRun) {
        results.push({
          email: u.email,
          tier,
          current_scans: u.available_scans,
          would_set_scans: expectedScans,
          current_letters: u.letter_credits,
          would_set_letters: expectedLetters,
          action: 'DRY_RUN'
        });
        continue;
      }

      // Reset scans and monthly counter
      await base44.asServiceRole.entities.User.update(u.id, {
        available_scans: expectedScans,
        scans_used_this_month: 0,
        usage_month: null
      });

      resetCount++;
      results.push({
        email: u.email,
        tier,
        previous_scans: u.available_scans,
        new_scans: expectedScans,
        action: 'RESET'
      });
    }

    console.log(`[BULK_RESET_SCANS] Reset ${resetCount} users, skipped ${skippedCount}. Dry run: ${dryRun}`);

    return Response.json({
      success: true,
      dryRun,
      totalUsers: allUsers.length,
      resetCount,
      skippedCount,
      results
    });

  } catch (error) {
    console.error('[BULK_RESET_SCANS_ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});