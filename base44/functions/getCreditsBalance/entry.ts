import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

import { getAllowance } from '../../shared/planAllowances.ts';

/**
 * Get Credits Balance for a User
 * Returns: { letters: { allowance, purchased, used, remaining }, scans: { ... } }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    if (!currentUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();
    // SECURITY: only admins may query another user's balance; everyone else is forced to self
    const role = (currentUser.role || currentUser.access_level || '').toLowerCase();
    const isAdmin = ['admin', 'super_admin'].includes(role);
    const targetUserId = (isAdmin && userId) ? userId : currentUser.id;

    // Fetch user
    const targetUser = await base44.asServiceRole.entities.User.filter({ id: targetUserId });
    if (!targetUser || targetUser.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = targetUser[0];
    const planTier = user.plan_tier || 'free';

    // Get plan allowance
    const allowance = getAllowance(planTier);

    // Get purchased credits from ledger
    const ledger = await base44.asServiceRole.entities.CreditsLedger.filter({ user_id: targetUserId });
    
    const purchasedLetters = ledger
      .filter(l => l.type === 'letters' && l.delta > 0)
      .reduce((sum, l) => sum + l.delta, 0);
    
    const purchasedScans = ledger
      .filter(l => l.type === 'scans' && l.delta > 0)
      .reduce((sum, l) => sum + l.delta, 0);

    // Live remaining balances live on the User record (set by stripeWebhook, decremented on use)
    const remainingLetters = user.letter_credits || 0;
    const remainingScans = user.available_scans || 0;

    return Response.json({
      success: true,
      credits: {
        letters: {
          allowance: allowance.letters,
          purchased: purchasedLetters,
          used: Math.max(0, allowance.letters - remainingLetters),
          remaining: remainingLetters
        },
        scans: {
          allowance: allowance.scans,
          purchased: purchasedScans,
          used: Math.max(0, allowance.scans - remainingScans),
          remaining: remainingScans
        }
      },
      plan_tier: planTier,
      credits_reset_at: user.credits_reset_at || null
    });

  } catch (error) {
    console.error('Get credits balance error:', error);
    return Response.json({
      error: error.message || 'Failed to get credits balance'
    }, { status: 500 });
  }
});