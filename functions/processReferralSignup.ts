import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Process referral signup - called after new user authenticates
 * Checks for ref query param and creates pending referral
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { referralCode } = await req.json();

    if (!referralCode) {
      return Response.json({ 
        processed: false,
        reason: 'no_referral_code' 
      });
    }

    console.log('[REFERRAL_SIGNUP] Processing referral for user:', user.email);
    console.log('[REFERRAL_SIGNUP] Referral code:', referralCode);

    // Find referrer by code
    const allUsers = await base44.asServiceRole.entities.User.list();
    const referrer = allUsers.find(u => u.referral_code === referralCode);

    if (!referrer) {
      console.warn('[REFERRAL_SIGNUP] ⚠️ Invalid referral code:', referralCode);
      return Response.json({ 
        processed: false,
        reason: 'invalid_code' 
      });
    }

    // Prevent self-referral
    if (referrer.id === user.id || referrer.email === user.email) {
      console.warn('[REFERRAL_SIGNUP] ⚠️ Self-referral blocked:', user.email);
      return Response.json({ 
        processed: false,
        reason: 'self_referral' 
      });
    }

    // Check if user already referred
    if (user.referred_by) {
      console.warn('[REFERRAL_SIGNUP] ⚠️ User already has referrer:', user.email);
      return Response.json({ 
        processed: false,
        reason: 'already_referred' 
      });
    }

    // Update user with referrer
    await base44.auth.updateMe({ referred_by: referrer.id });

    // Create pending referral record
    await base44.asServiceRole.entities.Referral.create({
      referrer_user_id: referrer.id,
      referrer_email: referrer.email,
      referred_user_id: user.id,
      referred_email: user.email,
      referral_code: referralCode,
      status: 'pending_first_payment',
      stripe_customer_id: user.stripe_customer_id || null,
      stripe_subscription_id: null, // Will be set when subscription created
      months_paid: 0
    });

    console.log('[REFERRAL_SIGNUP] ✅ Referral created');
    console.log('[REFERRAL_SIGNUP] Referrer:', referrer.email);
    console.log('[REFERRAL_SIGNUP] Referred:', user.email);

    return Response.json({ 
      processed: true,
      referrer: referrer.email
    });
  } catch (error) {
    console.error('[REFERRAL_SIGNUP] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});