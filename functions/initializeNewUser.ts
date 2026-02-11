import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Initialize new user with default tier and credits
 * Triggered automatically when User entity is created
 */

Deno.serve(async (req) => {
  const correlationId = `init-user-${Date.now()}`;
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Get event payload
    const { event, data } = await req.json();
    
    console.log(`[${correlationId}] New user registration detected`, {
      event,
      userId: data?.id,
      email: data?.email
    });
    
    // Only process create events
    if (event?.type !== 'create' || event?.entity_name !== 'User') {
      console.log(`[${correlationId}] Skipping - not a user creation event`);
      return Response.json({ skipped: true });
    }
    
    const userId = data?.id;
    const userEmail = data?.email;
    
    if (!userId || !userEmail) {
      console.error(`[${correlationId}] Missing user ID or email`);
      return Response.json({ error: 'Missing user data' }, { status: 400 });
    }
    
    // Check if user already has tier configured
    if (data.tier && data.available_scans !== undefined) {
      console.log(`[${correlationId}] User already has tier configured - skipping`);
      return Response.json({ 
        skipped: true, 
        reason: 'already_configured' 
      });
    }
    
    // Set default tier and credits
    console.log(`[${correlationId}] Initializing user with default tier`);
    
    const svc = base44.asServiceRole || base44;
    await svc.entities.User.update(userId, {
      tier: 'explorer',
      available_scans: 1,
      subscription_status: 'active'
    });
    
    console.log(`[${correlationId}] ✅ User initialized successfully`, {
      userId,
      email: userEmail,
      tier: 'explorer',
      available_scans: 1
    });
    
    // Send welcome email (if function exists)
    try {
      await base44.functions.invoke('sendWelcomeEmail', {});
      console.log(`[${correlationId}] Welcome email triggered`);
    } catch (emailErr) {
      console.warn(`[${correlationId}] Failed to send welcome email:`, emailErr.message);
      // Don't fail the whole process if email fails
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