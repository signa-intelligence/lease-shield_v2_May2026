import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const TIER_LETTER_CREDITS = {
      'free': 0,
      'explorer': 0,
      'lite': 3,
      'protect': 10,
      'secure': 999999
    };

    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 200);
    const results = [];

    for (const u of allUsers) {
      const tier = u.plan_tier || 'free';
      const expectedCredits = TIER_LETTER_CREDITS[tier] || 0;
      const currentCredits = u.letter_credits || 0;
      
      // Fix Secure users who have less than unlimited
      if (tier === 'secure' && currentCredits < 999999) {
        await base44.asServiceRole.entities.User.update(u.id, {
          letter_credits: 999999
        });
        results.push({
          email: u.email,
          tier,
          before: currentCredits,
          after: 999999,
          fixed: true
        });
      // Fix Protect users - should be exactly 10 (reset from 999999)
      } else if (tier === 'protect' && currentCredits !== 10) {
        await base44.asServiceRole.entities.User.update(u.id, {
          letter_credits: 10
        });
        results.push({
          email: u.email,
          tier,
          before: currentCredits,
          after: 10,
          fixed: true
        });
      } else {
        results.push({
          email: u.email,
          tier,
          current: currentCredits,
          expected: expectedCredits,
          fixed: false
        });
      }
    }

    return Response.json({
      status: 'complete',
      fixed: results.filter(r => r.fixed),
      all_users: results
    });

  } catch (error) {
    console.error('Fix letter credits error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});