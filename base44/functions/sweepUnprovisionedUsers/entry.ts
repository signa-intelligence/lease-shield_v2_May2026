import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try {
      body = await req.json();
    } catch (_e) {
      body = {};
    }

    const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    const hasServiceHeader = !!req.headers.get('base44-service-authorization');
    const hasValidSecret = !!internalSecret && body?.internal_secret === internalSecret;

    if (!hasServiceHeader && !hasValidSecret) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const candidates = await base44.asServiceRole.entities.User.filter(
      {
        $or: [
          { plan_tier: null },
          { plan_tier: { $exists: false } },
          { available_scans: null },
          { available_scans: { $exists: false } }
        ]
      },
      '-created_date',
      50
    );

    let provisioned = 0;
    let failed = 0;

    for (const candidate of candidates) {
      try {
        await base44.asServiceRole.functions.invoke('initializeNewUser', {
          user_id: candidate.id,
          internal_secret: internalSecret
        });
        provisioned++;
        console.log('[SWEEP] Provisioned user:', candidate.id, candidate.email);
      } catch (err) {
        failed++;
        console.error('[SWEEP] Failed to provision user:', candidate.id, err?.message || err);
      }
    }

    console.log(`[SWEEP] Summary — checked: ${candidates.length}, provisioned: ${provisioned}, failed: ${failed}`);

    return Response.json({
      success: true,
      checked: candidates.length,
      provisioned,
      failed
    });
  } catch (error) {
    console.error('[SWEEP] Fatal error:', error?.message || error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}