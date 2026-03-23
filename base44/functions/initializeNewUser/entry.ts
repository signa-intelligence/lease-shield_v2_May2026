import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Initialize new user with default tier and credits.
 * If the user previously deleted their account (soft-delete),
 * restore them WITHOUT resetting Explorer benefits.
 */

Deno.serve(async (req) => {
  const correlationId = `init-user-${Date.now()}`;
  
  try {
    const clonedReq = req.clone();
    const base44 = createClientFromRequest(req);
    const payload = await clonedReq.json();
    const { event, data } = payload;
    
    console.log(`[${correlationId}] User automation triggered`, {
      eventType: event?.type,
      entityName: event?.entity_name,
      userId: data?.id,
      email: data?.email
    });
    
    // Only process create events for User entity
    if (event?.type !== 'create' || event?.entity_name !== 'User') {
      console.log(`[${correlationId}] Skipping - not a user creation event`);
      return Response.json({ skipped: true });
    }
    
    const userId = event?.entity_id || data?.id;
    const userEmail = data?.email;
    
    if (!userId) {
      console.error(`[${correlationId}] Missing user ID`);
      return Response.json({ error: 'Missing user ID' }, { status: 400 });
    }
    
    // Check if user already has scans configured (e.g. invited with a specific tier)
    if (data?.plan_tier && data.plan_tier !== 'deleted' && data?.available_scans > 0) {
      console.log(`[${correlationId}] User already configured: plan_tier=${data.plan_tier}, scans=${data.available_scans} - skipping`);
      return Response.json({ skipped: true, reason: 'already_configured' });
    }
    
    const svc = base44.asServiceRole;
    
    // Check if this is a returning soft-deleted user
    if (data?.is_deleted === true) {
      console.log(`[${correlationId}] Returning deleted user detected`, {
        email: userEmail,
        previousTier: data.previous_plan_tier,
        explorerBenefitsUsed: data.explorer_benefits_used,
        availableScans: data.available_scans,
        letterCredits: data.letter_credits
      });
      
      // Reactivate without granting fresh Explorer benefits
      const updateData = {
        is_deleted: false,
        deleted_at: null,
        is_active: true,
        subscription_status: 'active',
        plan_tier: 'explorer'
      };
      
      if (data.explorer_benefits_used) {
        // Benefits already consumed — don't reset
        updateData.available_scans = data.available_scans || 0;
        // Keep existing letter_credits as-is (they're already 0 or whatever they had)
        console.log(`[${correlationId}] Explorer benefits previously used — NOT resetting free allocation`);
      } else {
        // Benefits never used — grant the standard explorer allocation
        updateData.available_scans = 1;
        console.log(`[${correlationId}] Explorer benefits NOT previously used — granting 1 free scan`);
      }
      
      await svc.entities.User.update(userId, updateData);
      
      console.log(`[${correlationId}] ✅ Returning user reactivated`, {
        userId, email: userEmail,
        plan_tier: 'explorer',
        available_scans: updateData.available_scans,
        explorerBenefitsUsed: data.explorer_benefits_used
      });
      
      return Response.json({
        success: true,
        returning: true,
        userId,
        email: userEmail,
        plan_tier: 'explorer',
        available_scans: updateData.available_scans,
        explorer_benefits_used: data.explorer_benefits_used,
        correlationId
      });
    }
    
    // Brand new user — standard initialization
    console.log(`[${correlationId}] Initializing new user with explorer tier + 1 scan`);
    
    await svc.entities.User.update(userId, {
      plan_tier: 'explorer',
      available_scans: 1,
      is_active: true,
      subscription_status: 'active',
      explorer_benefits_used: false
    });
    
    console.log(`[${correlationId}] ✅ User initialized`, {
      userId,
      email: userEmail,
      plan_tier: 'explorer',
      available_scans: 1
    });
    
    // Send welcome email (non-blocking)
    try {
      await svc.integrations.Core.SendEmail({
        to: userEmail,
        subject: 'Welcome to Lease Shield',
        body: `<p>Welcome to Lease Shield! Your account is ready with 1 free lease scan.</p>`
      });
    } catch (emailErr) {
      console.warn(`[${correlationId}] Welcome email failed:`, emailErr.message);
    }
    
    return Response.json({
      success: true,
      returning: false,
      userId,
      email: userEmail,
      plan_tier: 'explorer',
      available_scans: 1,
      correlationId
    });
    
  } catch (error) {
    console.error(`[${correlationId}] Error:`, {
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