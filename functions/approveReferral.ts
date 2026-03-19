import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * APPROVE REFERRAL - Admin manually approves flagged referral and issues credit
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

    // Get referrer user
    const referrer = await base44.asServiceRole.entities.User.get(referral.referrer_user_id);
    
    if (!referrer) {
      return Response.json({ error: 'Referrer not found' }, { status: 404 });
    }

    const creditAmount = referral.credit_thb || 0;

    // Issue credit to referrer
    await base44.asServiceRole.entities.User.update(referrer.id, {
      referral_credits_thb: (referrer.referral_credits_thb || 0) + creditAmount,
      referral_credits_total_thb: (referrer.referral_credits_total_thb || 0) + creditAmount,
      referral_count: (referrer.referral_count || 0) + 1
    });

    // Update referral as approved
    await base44.asServiceRole.entities.Referral.update(referralId, {
      status: 'converted',
      flagged_for_review: false,
      reviewed_by_admin: adminEmail,
      review_date: new Date().toISOString(),
      review_notes: notes
    });

    // Send notification to referrer
    try {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      
      if (RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Lease Shield <no-reply@leaseshield.asia>',
            to: [referrer.email],
            subject: '🎉 Referral Credit Approved',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(to right, #10B981, #059669); padding: 20px; border-radius: 8px 8px 0 0;">
                  <h2 style="color: white; margin: 0;">🎉 Great News!</h2>
                </div>
                <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
                  <p>Your referral has been approved! We've added <strong>฿${creditAmount}</strong> credit to your account.</p>
                  <p>This credit will be automatically applied to your next subscription invoice.</p>
                  <p>Thank you for spreading the word about Lease Shield!</p>
                  <p style="margin-top: 24px; color: #666; font-size: 12px;">
                    — Lease Shield Team
                  </p>
                </div>
              </div>
            `
          })
        });
      }
    } catch (emailError) {
      console.error('[APPROVE_REFERRAL] Email notification failed:', emailError.message);
      // Don't fail the approval if email fails
    }

    console.log('[REFERRAL_APPROVED]', {
      referralId: referralId,
      referrerEmail: referrer.email,
      creditIssued: creditAmount,
      approvedBy: adminEmail
    });

    return Response.json({
      ok: true,
      creditIssued: creditAmount,
      referrerEmail: referrer.email
    });

  } catch (error) {
    console.error('[APPROVE_REFERRAL_ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});