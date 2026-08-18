import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { getAllowance } from '../../shared/planAllowances.ts';

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

    if (!payload?.event || typeof payload.event.type !== 'string' || payload.event.type.trim() === '') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

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
      
      // Only grant fresh allocation if benefits were never used (matches Layout.jsx)
      if (data.explorer_benefits_used) {
        console.log(`[${correlationId}] Explorer benefits previously used — NOT resetting free allocation`);
      } else {
        const explorer = getAllowance('explorer');
        updateData.available_scans = explorer.scans;
        updateData.letter_credits = explorer.letters;
        console.log(`[${correlationId}] Explorer benefits NOT previously used — granting free allocation`);
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
    
    const explorer = getAllowance('explorer');

    await svc.entities.User.update(userId, {
      plan_tier: 'explorer',
      available_scans: explorer.scans,
      letter_credits: explorer.letters,
      is_active: true,
      subscription_status: 'active',
      explorer_benefits_used: false,
      referral_credits_thb: 0,
      referral_credits_total_thb: 0,
      referral_count: 0
    });
    
    console.log(`[${correlationId}] ✅ User initialized`, {
      userId,
      email: userEmail,
      plan_tier: 'explorer',
      available_scans: explorer.scans,
      letter_credits: explorer.letters
    });
    
    // Welcome email (non-blocking) — same function the client calls
    try {
      await base44.functions.invoke('sendWelcomeEmail');
    } catch (emailErr) {
      console.warn(`[${correlationId}] Welcome email failed:`, emailErr.message);
    }

    // Admin signup notification (non-blocking)
    try {
      await base44.functions.invoke('notifyAdminNewSignup', {
        user_email: userEmail,
        user_name: data?.full_name,
        plan_tier: 'explorer',
        signup_source: 'Server'
      });
    } catch (notifyErr) {
      console.warn(`[${correlationId}] Admin notification failed:`, notifyErr.message);
    }
    
    return Response.json({
      success: true,
      returning: false,
      userId,
      email: userEmail,
      plan_tier: 'explorer',
      available_scans: explorer.scans,
      letter_credits: explorer.letters,
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