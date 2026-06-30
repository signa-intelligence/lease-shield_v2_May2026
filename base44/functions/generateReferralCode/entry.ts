import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || !user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 1 per day
    let rateLimitCheck;
    try {
      rateLimitCheck = await base44.functions.invoke('checkRateLimit', {
        userId: user.id,
        actionType: 'referral_generate',
        limit: 1,
        windowMinutes: 1440 // 24 hours
      });
    } catch (rateLimitError) {
      // If the rate-limit check itself errors, fail open and continue (do not 500)
      console.error('[RATE_LIMIT] checkRateLimit invoke failed, failing open:', rateLimitError);
      rateLimitCheck = { data: { allowed: true } };
    }

    if (rateLimitCheck?.data?.allowed === false) {
      return Response.json({
        error: 'Rate limit exceeded. You can only generate a referral code once per day.',
        retryAfterMinutes: rateLimitCheck.data.retryAfterMinutes,
        retry_after_seconds: rateLimitCheck.data.retryAfter
      }, { status: 429 });
    }

    // MINIMUM ACCOUNT AGE REQUIREMENT - Prevent immediate farming
    const MINIMUM_ACCOUNT_AGE_DAYS = 7;
    const accountCreatedAt = new Date(user.created_date);
    const accountAgeMs = Date.now() - accountCreatedAt.getTime();
    const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);

    if (accountAgeDays < MINIMUM_ACCOUNT_AGE_DAYS) {
      const daysRemaining = Math.ceil(MINIMUM_ACCOUNT_AGE_DAYS - accountAgeDays);
      
      console.log('[ACCOUNT_AGE_CHECK] ⚠️ Account too new:', {
        email: user.email,
        accountAgeDays: Math.floor(accountAgeDays),
        required: MINIMUM_ACCOUNT_AGE_DAYS,
        daysRemaining
      });

      return Response.json({
        error: 'ACCOUNT_TOO_NEW',
        message: `Your account must be ${MINIMUM_ACCOUNT_AGE_DAYS} days old to generate a referral code. Please wait ${daysRemaining} more day(s).`,
        accountAgeDays: Math.floor(accountAgeDays),
        requiredAgeDays: MINIMUM_ACCOUNT_AGE_DAYS,
        daysRemaining: daysRemaining
      }, { status: 403 });
    }

    console.log('[ACCOUNT_AGE_CHECK] ✅ Account age sufficient:', {
      accountAgeDays: Math.floor(accountAgeDays),
      required: MINIMUM_ACCOUNT_AGE_DAYS
    });

    // Check if user already has a referral code
    if (user.referral_code) {
      return Response.json({
        success: true,
        code: user.referral_code,
        message: 'Using existing referral code'
      });
    }

    // Generate crypto-secure 8-char hex code
    let referralCode = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      // Generate 4 random bytes = 8 hex characters
      const buffer = new Uint8Array(4);
      crypto.getRandomValues(buffer);
      referralCode = Array.from(buffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();

      // Check for duplicates
      const existingUsers = await base44.asServiceRole.entities.User.filter({
        referral_code: referralCode
      });

      if (existingUsers.length === 0) {
        break; // No duplicates, we're good
      }

      attempts++;
      referralCode = null;
    }

    if (!referralCode) {
      return Response.json({
        error: 'Failed to generate unique referral code. Please try again later.'
      }, { status: 500 });
    }

    // Update user with referral code
    await base44.auth.updateMe({
      referral_code: referralCode,
      referral_generated_at: new Date().toISOString()
    });

    // Log audit event
    await base44.functions.invoke('logAuditEvent', {
      action: 'referral_code_generated',
      entity_type: 'user',
      entity_id: user.id,
      changes: {
        referral_code: {
          old: null,
          new: referralCode
        }
      },
      status: 'success'
    });

    return Response.json({
      success: true,
      code: referralCode,
      message: 'Referral code generated successfully'
    });

  } catch (error) {
    console.error('Generate referral code error:', error);
    return Response.json({ 
      error: 'An error occurred while generating your referral code. Please try again.'
    }, { status: 500 });
  }
});