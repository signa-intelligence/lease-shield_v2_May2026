import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { requireSuperAdmin, safeLog } from './authGuards.js';

Deno.serve(async (req) => {
  try {
    // SECURITY FIX: Role-based auth instead of hard-coded emails
    const { user, base44 } = await requireSuperAdmin(req);

    const { userId, tier } = await req.json();

    if (!userId || !tier) {
      return Response.json({ error: 'Missing userId or tier' }, { status: 400 });
    }

    // Valid tiers
    const validTiers = ['free', 'lite', 'protect', 'secure'];
    if (!validTiers.includes(tier)) {
      return Response.json({ error: 'Invalid tier' }, { status: 400 });
    }

    await safeLog('ADMIN_UPDATE_TIER', { userId, tier });

    // Update user using service role
    const updatedUser = await base44.asServiceRole.entities.User.update(userId, { plan_tier: tier });

    await safeLog('ADMIN_UPDATE_TIER_SUCCESS', { userId, newTier: tier });

    return Response.json({ 
      success: true,
      message: `User tier updated to ${tier}`,
      user: updatedUser
    });

  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return Response.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }
    
    console.error('[ADMIN_UPDATE_TIER_ERROR]', { error: error.message });
    return Response.json({ 
      error: 'Failed to update user tier'
    }, { status: 500 });
  }
});