import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Initialize new user with default tier and credits
 * Triggered automatically when User entity is created
 */

Deno.serve(async (req) => {
  const correlationId = `init-user-${Date.now()}`;
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Get event payload from entity automation
    const body = await req.json();
    const event = body?.event;
    const data = body?.data;
    
    console.log(`[${correlationId}] initializeNewUser triggered`, {
      event,
      userId: data?.id,
      email: data?.email,
      bodyKeys: Object.keys(body || {})
    });
    
    // Only process create events
    if (event?.type !== 'create') {
      console.log(`[${correlationId}] Skipping - not a create event, type=${event?.type}`);
      return Response.json({ skipped: true, reason: 'not_create_event' });
    }
    
    const userId = event?.entity_id || data?.id;
    const userEmail = data?.email;
    
    if (!userId) {
      console.error(`[${correlationId}] Missing user ID`);
      return Response.json({ error: 'Missing user ID' }, { status: 400 });
    }
    
    // Check if user already has tier configured (handles re-runs)
    const existingTier = data?.tier || data?.data?.tier;
    const existingScans = data?.available_scans ?? data?.data?.available_scans;
    if (existingTier && existingScans !== undefined && existingScans !== null) {
      console.log(`[${correlationId}] User already has tier configured - skipping`, { existingTier, existingScans });
      return Response.json({ 
        skipped: true, 
        reason: 'already_configured' 
      });
    }
    
    // Set default tier and credits using service role
    console.log(`[${correlationId}] Initializing user with default tier`, { userId, email: userEmail });
    
    const svc = base44.asServiceRole;
    
    // Retry update up to 3 times (user record may still be propagating)
    let updateSuccess = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await svc.entities.User.update(userId, {
          tier: 'explorer',
          available_scans: 1,
          subscription_status: 'active',
          plan_tier: 'free'
        });
        updateSuccess = true;
        console.log(`[${correlationId}] ✅ User initialized on attempt ${attempt}`, {
          userId,
          email: userEmail,
          tier: 'explorer',
          available_scans: 1
        });
        break;
      } catch (updateErr) {
        console.warn(`[${correlationId}] Update attempt ${attempt} failed:`, updateErr.message);
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, attempt * 1000));
        }
      }
    }
    
    if (!updateSuccess) {
      console.error(`[${correlationId}] ❌ All 3 update attempts failed for user ${userId}`);
      return Response.json({ success: false, error: 'Failed to update user after 3 attempts', correlationId }, { status: 500 });
    }
    
    // Verify the update actually took
    try {
      const verifyUser = await svc.entities.User.get(userId);
      console.log(`[${correlationId}] Verification:`, {
        available_scans: verifyUser?.available_scans,
        tier: verifyUser?.tier
      });
    } catch (verifyErr) {
      console.warn(`[${correlationId}] Verify failed (non-fatal):`, verifyErr.message);
    }
    
    // Send welcome email (non-blocking)
    try {
      await svc.integrations.Core.SendEmail({
        to: userEmail,
        subject: 'Welcome to Lease Shield',
        body: `Hi ${data?.full_name || 'there'},\n\nWelcome to Lease Shield! Your account is ready with 1 free lease scan.\n\nGet started by uploading your lease agreement.\n\nBest,\nLease Shield Team`
      });
      console.log(`[${correlationId}] Welcome email sent`);
    } catch (emailErr) {
      console.warn(`[${correlationId}] Welcome email failed (non-fatal):`, emailErr.message);
    }
    
    return Response.json({
      success: true,
      userId,
      email: userEmail,
      tier: 'explorer',
      available_scans: 1,
      correlationId
    });
    
  } catch (error) {
    console.error(`[${correlationId}] Error initializing user:`, {
      error: error.message,
      stack: error.stack
    });
    
    return Response.json({
      success: false,
      error: error.message,
      correlationId
    }, { status: 500 });
  }
});