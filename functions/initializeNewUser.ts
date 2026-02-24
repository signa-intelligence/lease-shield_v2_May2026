import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Initialize new user with default tier and credits
 * Triggered automatically via entity automation when User is created
 */

Deno.serve(async (req) => {
  const correlationId = `init-user-${Date.now()}`;
  
  try {
    // Clone the request so we can read the body AND pass it to createClientFromRequest
    const clonedReq = req.clone();
    const base44 = createClientFromRequest(req);
    
    // Get event payload from cloned request
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
    if (data?.plan_tier && data?.available_scans > 0) {
      console.log(`[${correlationId}] User already configured: plan_tier=${data.plan_tier}, scans=${data.available_scans} - skipping`);
      return Response.json({ skipped: true, reason: 'already_configured' });
    }
    
    // Set default free tier with 1 explorer scan
    console.log(`[${correlationId}] Initializing user with free tier + 1 scan`);
    
    const svc = base44.asServiceRole;
    await svc.entities.User.update(userId, {
      plan_tier: 'free',
      available_scans: 1,
      is_active: true,
      subscription_status: 'active'
    });
    
    console.log(`[${correlationId}] ✅ User initialized`, {
      userId,
      email: userEmail,
      plan_tier: 'free',
      available_scans: 1
    });
    
    // Send welcome email (non-blocking)
    try {
      await svc.integrations.Core.SendEmail({
        to: userEmail,
        subject: 'Welcome to Lease Shield',
        body: `<p>Welcome to Lease Shield! Your account is ready with 1 free lease scan.</p>`
      });
      console.log(`[${correlationId}] Welcome email sent`);
    } catch (emailErr) {
      console.warn(`[${correlationId}] Welcome email failed:`, emailErr.message);
    }
    
    return Response.json({
      success: true,
      userId,
      email: userEmail,
      plan_tier: 'free',
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