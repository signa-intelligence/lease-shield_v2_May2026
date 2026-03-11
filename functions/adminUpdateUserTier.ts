import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { requireSuperAdmin, safeLog } from './authGuards.js';
import { handleCors, ensureAllowedOrigin, err, requireRecentAuth } from './http.js';

Deno.serve(async (req) => {
  const pre = handleCors(req); if (pre) return pre;
  const { allowed, requestId } = ensureAllowedOrigin(req); if (!allowed) return err(req, 'CORS_FORBIDDEN', 'Origin not allowed', 403, requestId);
  try {
    // SECURITY FIX: Role-based auth instead of hard-coded emails
    const { user, base44 } = await requireSuperAdmin(req);
    // Session recent-auth check (10 minutes)
    const recent = requireRecentAuth(req, 600);
    if (!recent.ok) return err(req, 'REAUTH_REQUIRED', 'Please reauthenticate to proceed', 401);

    const { userId, tier } = await req.json();

    if (!userId || !tier) {
      return Response.json({ error: 'Missing userId or tier' }, { status: 400 });
    }

    // Valid tiers
    const validTiers = ['explorer', 'lite', 'protect', 'secure'];
    if (!validTiers.includes(tier)) {
      return Response.json({ error: 'Invalid tier. Valid: explorer, lite, protect, secure' }, { status: 400 });
    }

    // CRITICAL: Provision scan and letter credits when changing tier
    const scanAllocation = { explorer: 1, lite: 6, protect: 12, secure: 50 };
    const letterAllocation = { explorer: 0, lite: 3, protect: 10, secure: 50 };

    await safeLog('ADMIN_UPDATE_TIER', { userId, tier, scans: scanAllocation[tier], letters: letterAllocation[tier] });

    // Update user using service role - include credit provisioning
    const updatedUser = await base44.asServiceRole.entities.User.update(userId, { 
      plan_tier: tier,
      available_scans: scanAllocation[tier],
      letter_credits: letterAllocation[tier],
      scans_used_this_month: 0,
      usage_month: null,
      manual_tier_override: true
    });

    await safeLog('ADMIN_UPDATE_TIER_SUCCESS', { userId, newTier: tier, scans: scanAllocation[tier], letters: letterAllocation[tier] });

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