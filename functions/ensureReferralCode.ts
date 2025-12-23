import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Auto-generate referral code for new users
 * Call this on user signup/first login
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Check if user already has a referral code
    if (user.referral_code) {
      return Response.json({
        success: true,
        message: 'User already has referral code',
        referral_code: user.referral_code,
        already_exists: true
      });
    }

    // Generate unique 8-character code
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let referralCode = generateCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const existing = await base44.asServiceRole.entities.User.filter({ 
        referral_code: referralCode 
      });
      
      if (existing.length === 0) {
        break;
      }
      
      referralCode = generateCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique referral code');
    }

    // Save to user profile
    await base44.auth.updateMe({ referral_code: referralCode });

    console.log(`✅ [REFERRAL] Generated code for ${user.email}: ${referralCode}`);

    return Response.json({
      success: true,
      referral_code: referralCode,
      message: 'Referral code generated successfully'
    });

  } catch (error) {
    console.error('❌ [REFERRAL] Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});