import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Generate unique referral code for a user
 * Creates a collision-safe 6-8 char alphanumeric code
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a code
    if (user.referral_code) {
      return Response.json({ 
        code: user.referral_code,
        alreadyExists: true 
      });
    }

    // Generate unique code
    let code;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      // Generate 6-char code using base36 (0-9, A-Z)
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Check uniqueness
      const allUsers = await base44.asServiceRole.entities.User.list();
      const existingUser = allUsers.find(u => u.referral_code === code);
      
      if (!existingUser) {
        break; // Code is unique
      }
      
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.error('[REFERRAL_CODE] Failed to generate unique code after', maxAttempts, 'attempts');
      return Response.json({ error: 'Failed to generate unique code' }, { status: 500 });
    }

    // Save code to user
    await base44.auth.updateMe({ referral_code: code });

    console.log('[REFERRAL_CODE] ✅ Generated code:', code, 'for user:', user.email);

    return Response.json({ 
      code,
      generated: true
    });
  } catch (error) {
    console.error('[REFERRAL_CODE] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});