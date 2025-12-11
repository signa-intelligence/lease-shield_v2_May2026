import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Admin function: Backfill referral codes for existing users
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    let generated = 0;
    let skipped = 0;

    for (const targetUser of allUsers) {
      if (targetUser.referral_code) {
        skipped++;
        continue;
      }

      // Generate unique code
      let code;
      let attempts = 0;
      
      while (attempts < 10) {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const exists = allUsers.find(u => u.referral_code === code);
        if (!exists) break;
        attempts++;
      }

      if (attempts >= 10) {
        console.error('[BACKFILL] Failed to generate code for:', targetUser.email);
        continue;
      }

      await base44.asServiceRole.entities.User.update(targetUser.id, {
        referral_code: code,
        referral_credits_thb: targetUser.referral_credits_thb || 0,
        referral_credits_total_thb: targetUser.referral_credits_total_thb || 0,
        referral_count: targetUser.referral_count || 0
      });

      generated++;
      console.log('[BACKFILL] Generated code:', code, 'for:', targetUser.email);
    }

    return Response.json({
      success: true,
      generated,
      skipped,
      total: allUsers.length
    });
  } catch (error) {
    console.error('[BACKFILL] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});