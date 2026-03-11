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

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require super_admin or admin
    const isSuperAdmin = user.role === 'super_admin' || user.role === 'admin' ||
                         user.access_level === 'super_admin' || user.access_level === 'admin';
    if (!isSuperAdmin) {
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { userId, tier } = await req.json();

    if (!userId || !tier) {
      return Response.json({ error: 'Missing userId or tier' }, { status: 400 });
    }

    const validTiers = ['explorer', 'lite', 'protect', 'secure'];
    if (!validTiers.includes(tier)) {
      return Response.json({ error: 'Invalid tier. Valid: explorer, lite, protect, secure' }, { status: 400 });
    }

    // CRITICAL: Provision scan and letter credits when changing tier
    const scanAllocation = { explorer: 1, lite: 6, protect: 12, secure: 50 };
    const letterAllocation = { explorer: 0, lite: 3, protect: 10, secure: 50 };

    console.log('[ADMIN_UPDATE_TIER]', { userId, tier, scans: scanAllocation[tier], letters: letterAllocation[tier] });

    // Update user with tier + credits provisioning
    const updatedUser = await base44.asServiceRole.entities.User.update(userId, { 
      plan_tier: tier,
      available_scans: scanAllocation[tier],
      letter_credits: letterAllocation[tier],
      scans_used_this_month: 0,
      usage_month: null,
      manual_tier_override: true
    });

    console.log('[ADMIN_UPDATE_TIER_SUCCESS]', { userId, tier });

    return Response.json({ 
      success: true,
      message: `User tier updated to ${tier} with ${scanAllocation[tier]} scans and ${letterAllocation[tier]} letter credits`,
      user: updatedUser
    });

  } catch (error) {
    console.error('[ADMIN_UPDATE_TIER_ERROR]', error.message);
    return Response.json({ error: error.message || 'Failed to update user tier' }, { status: 500 });
  }
});