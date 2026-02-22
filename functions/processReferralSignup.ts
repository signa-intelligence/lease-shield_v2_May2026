import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Process referral signup - called after new user authenticates
 * Checks for ref query param and creates pending referral
 * 
 * FRAUD PREVENTION:
 * - Disposable email blocking
 * - Plus addressing normalization (gmail+tag@gmail.com)
 * - Tier-based referral limits
 * - Self-referral prevention
 * - Duplicate referral prevention
 */

// Common disposable email domains
const DISPOSABLE_DOMAINS = [
  'temp-mail.org', 'tempmail.com', 'guerrillamail.com', 'mailinator.com',
  '10minutemail.com', 'throwaway.email', 'trashmail.com', 'getnada.com',
  'maildrop.cc', 'sharklasers.com', 'guerrillamail.info', 'grr.la',
  'guerrillamail.biz', 'spam4.me', 'yopmail.com', 'mohmal.com',
  'tempmail.net', 'fakeinbox.com', 'emailondeck.com', 'mintemail.com'
];

function isDisposableEmail(email) {
  if (!email) return false;
  
  const emailLower = email.toLowerCase().trim();
  const domain = emailLower.split('@')[1];
  
  if (!domain) return false;
  
  // Check blacklist
  if (DISPOSABLE_DOMAINS.includes(domain)) return true;
  
  // Check suspicious patterns
  const suspiciousPatterns = [
    /\d{5,}@/,           // 5+ numbers before @
    /temp.*mail/i,
    /fake.*mail/i,
    /trash.*mail/i,
    /disposable/i,
    /throwaway/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(emailLower));
}

function normalizeEmail(email) {
  if (!email) return email;
  
  const emailLower = email.toLowerCase().trim();
  const parts = emailLower.split('@');
  
  if (parts.length !== 2) return emailLower;
  
  const [localPart, domain] = parts;
  
  // Remove plus addressing for Gmail/Outlook/Yahoo
  const plusAddressingDomains = [
    'gmail.com', 'googlemail.com',
    'outlook.com', 'hotmail.com', 'live.com',
    'yahoo.com', 'ymail.com'
  ];
  
  if (plusAddressingDomains.includes(domain)) {
    const normalizedLocal = localPart.split('+')[0];
    
    // Gmail ignores dots in local part
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      const withoutDots = normalizedLocal.replace(/\./g, '');
      return `${withoutDots}@${domain}`;
    }
    
    return `${normalizedLocal}@${domain}`;
  }
  
  return emailLower;
}

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

    // DISPOSABLE EMAIL CHECK - Block temporary email services
    if (isDisposableEmail(user.email)) {
      console.warn('[REFERRAL_SIGNUP] ⚠️ Disposable email blocked:', user.email);
      return Response.json({
        processed: false,
        reason: 'disposable_email_blocked',
        message: 'Disposable email addresses are not eligible for the referral program.'
      });
    }

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

    // Check referrer's email isn't disposable (data integrity)
    if (isDisposableEmail(referrer.email)) {
      console.warn('[REFERRAL_SIGNUP] ⚠️ Referrer has disposable email:', referrer.email);
      return Response.json({
        processed: false,
        reason: 'referrer_email_invalid',
        message: 'This referral code is no longer valid.'
      });
    }

    // EMAIL NORMALIZATION - Prevent plus addressing abuse
    const normalizedUserEmail = normalizeEmail(user.email);
    const normalizedReferrerEmail = normalizeEmail(referrer.email);

    console.log('[EMAIL_NORMALIZATION]', {
      original: user.email,
      normalized: normalizedUserEmail,
      referrerNormalized: normalizedReferrerEmail
    });

    // Prevent self-referral via plus addressing
    if (normalizedUserEmail === normalizedReferrerEmail) {
      console.warn('[REFERRAL_SIGNUP] ⚠️ Self-referral via email alias blocked:', user.email);
      return Response.json({
        processed: false,
        reason: 'self_referral_alias',
        message: 'You cannot refer yourself using email aliases.'
      });
    }

    // Prevent self-referral by ID/email
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

    // Check if normalized email already used in ANY referral
    const existingReferralByNormalizedEmail = await base44.asServiceRole.entities.Referral.filter({
      referred_email: normalizedUserEmail
    });

    if (existingReferralByNormalizedEmail.length > 0) {
      console.warn('[REFERRAL_SIGNUP] ⚠️ Normalized email already referred:', normalizedUserEmail);
      return Response.json({
        processed: false,
        reason: 'email_already_referred',
        message: 'This email address has already been referred (including email aliases like user+tag@gmail.com).'
      });
    }

    // TIER-BASED REFERRAL LIMITS - Prevent unlimited exploitation
    const REFERRAL_LIMITS = {
      'free': 3,
      'lite': 10,
      'protect': 25,
      'secure': 999  // Effectively unlimited
    };

    const referrerTier = referrer.plan_tier || 'free';
    const tierLimit = referrer.referral_limit_override || REFERRAL_LIMITS[referrerTier] || REFERRAL_LIMITS.free;

    // Count active referrals (exclude refunded/chargeback)
    const existingReferrals = await base44.asServiceRole.entities.Referral.filter({
      referrer_user_id: referrer.id,
      status: {
        $in: ['pending_first_payment', 'pending_refund_window', 'converted', 'cancelled']
      }
    });

    const currentReferralCount = existingReferrals.length;

    console.log('[REFERRAL_LIMIT_CHECK]', {
      referrerEmail: referrer.email,
      referrerTier: referrerTier,
      currentCount: currentReferralCount,
      tierLimit: tierLimit,
      allowed: currentReferralCount < tierLimit
    });

    if (currentReferralCount >= tierLimit) {
      console.warn('[REFERRAL_SIGNUP] ⚠️ Referral limit exceeded');
      return Response.json({ 
        processed: false,
        reason: 'referral_limit_exceeded',
        message: `Referrer has reached their ${referrerTier} tier limit (${tierLimit} referrals). They need to upgrade to refer more friends.`,
        currentCount: currentReferralCount,
        tierLimit: tierLimit,
        referrerTier: referrerTier
      });
    }

    // FRAUD PATTERN DETECTION - Check for suspicious activity
    let fraudCheck = { riskScore: 0, riskLevel: 'low', patterns: [], suspicious: false };
    
    try {
      const fraudResponse = await base44.asServiceRole.functions.invoke('checkReferralFraudPatterns', {
        referrerUserId: referrer.id,
        referredUserEmail: user.email
      });
      
      fraudCheck = fraudResponse.data || fraudCheck;
      
      if (fraudCheck.riskLevel === 'critical' || fraudCheck.riskLevel === 'high') {
        console.log('[FRAUD_ALERT] ⚠️ High-risk referral detected:', {
          referrerEmail: referrer.email,
          referredEmail: user.email,
          riskLevel: fraudCheck.riskLevel,
          riskScore: fraudCheck.riskScore,
          patterns: fraudCheck.patterns.length
        });
      }
    } catch (fraudError) {
      console.error('[FRAUD_CHECK] ⚠️ Fraud check failed (non-critical):', fraudError.message);
      // Continue with referral creation even if fraud check fails
    }

    // Update user with referrer
    await base44.auth.updateMe({ referred_by: referrer.id });

    // Create pending referral record (store normalized email + fraud metadata)
    const referralStatus = fraudCheck.riskLevel === 'critical' ? 'pending_review' : 'pending_first_payment';
    
    await base44.asServiceRole.entities.Referral.create({
      referrer_user_id: referrer.id,
      referrer_email: referrer.email,
      referred_user_id: user.id,
      referred_email: normalizedUserEmail, // Use normalized email
      referral_code: referralCode,
      status: referralStatus,
      stripe_customer_id: user.stripe_customer_id || null,
      stripe_subscription_id: null, // Will be set when subscription created
      months_paid: 0,
      fraud_risk_score: fraudCheck.riskScore,
      fraud_patterns: JSON.stringify(fraudCheck.patterns),
      flagged_for_review: fraudCheck.riskLevel === 'critical'
    });

    // Send admin alert if critical risk
    if (fraudCheck.riskLevel === 'critical') {
      try {
        await base44.asServiceRole.functions.invoke('notifyAdminFraudAlert', {
          referralId: referrer.id, // Will be created ID
          referrerEmail: referrer.email,
          riskScore: fraudCheck.riskScore,
          patterns: JSON.stringify(fraudCheck.patterns)
        });
        
        console.log('[FRAUD_ALERT] ✅ Admin notified of critical fraud pattern');
      } catch (alertError) {
        console.error('[FRAUD_ALERT] ⚠️ Failed to send admin alert:', alertError.message);
      }
    }

    console.log('[REFERRAL_SIGNUP] ✅ Referral created');
    console.log('[REFERRAL_SIGNUP] Referrer:', referrer.email);
    console.log('[REFERRAL_SIGNUP] Referred:', user.email);
    console.log('[REFERRAL_SIGNUP] Normalized email stored:', normalizedUserEmail);

    return Response.json({ 
      processed: true,
      referrer: referrer.email
    });
  } catch (error) {
    console.error('[REFERRAL_SIGNUP] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});