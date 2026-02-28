import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    let resetCount = 0;
    const resetDetails = [];

    for (const u of allUsers) {
      if (u.plan_tier === 'secure' && u.letter_credits > 50) {
        const oldCredits = u.letter_credits;
        await base44.asServiceRole.entities.User.update(u.id, {
          letter_credits: 50
        });
        resetCount++;
        resetDetails.push({
          email: u.email,
          old_credits: oldCredits,
          new_credits: 50
        });
        console.log(`[RESET] ${u.email}: ${oldCredits} → 50 credits`);
      }
    }

    console.log(`[RESET] Complete: ${resetCount} Secure tier users reset to 50 credits`);

    return Response.json({
      success: true,
      reset_count: resetCount,
      details: resetDetails,
      message: `Reset ${resetCount} Secure tier users from 999999 to 50 letter credits`
    });
  } catch (error) {
    console.error('[RESET_ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});