import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * BLOCK REFERRAL - Admin manually blocks referral as fraud
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { referralId, adminEmail, notes } = await req.json();

    if (!referralId || !adminEmail || !notes) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get referral
    const referral = await base44.asServiceRole.entities.Referral.get(referralId);

    if (!referral) {
      return Response.json({ error: 'Referral not found' }, { status: 404 });
    }

    // Update referral as blocked
    await base44.asServiceRole.entities.Referral.update(referralId, {
      status: 'fraud_blocked',
      flagged_for_review: false,
      reviewed_by_admin: adminEmail,
      review_date: new Date().toISOString(),
      review_notes: notes,
      credit_thb: 0  // Ensure no credit
    });

    console.log('[REFERRAL_BLOCKED]', {
      referralId: referralId,
      referrerEmail: referral.referrer_email,
      referredEmail: referral.referred_email,
      blockedBy: adminEmail,
      reason: notes
    });

    // Optional: Log fraud pattern for future detection improvements
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'referral_fraud_blocked',
        entity_type: 'referral',
        entity_id: referralId,
        user_email: adminEmail,
        details: JSON.stringify({
          referrer: referral.referrer_email,
          referred: referral.referred_email,
          fraud_score: referral.fraud_risk_score,
          patterns: referral.fraud_patterns,
          admin_notes: notes
        })
      });
    } catch (auditError) {
      console.error('[AUDIT_LOG_FAILED]', auditError.message);
      // Don't fail the blocking if audit log fails
    }

    return Response.json({
      ok: true,
      referralId: referralId,
      referrerEmail: referral.referrer_email
    });

  } catch (error) {
    console.error('[BLOCK_REFERRAL_ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});