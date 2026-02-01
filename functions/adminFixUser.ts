import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

Deno.serve(async (req) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  };
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Auth check - only admins
    const user = await base44.auth.me();
    if (user.role !== 'admin') {
      return new Response(JSON.stringify({
        error: 'UNAUTHORIZED',
        message: 'Admin access required'
      }), { status: 403, headers });
    }
    
    // Get user ID from request
    const body = await req.json();
    const userId = body.userId || '69784c97afc28263172af25b';
    
    console.log('[ADMIN_FIX_USER_START]', { userId });
    
    // Update user with proper tier and credits
    const svc = base44.asServiceRole || base44;
    const result = await svc.entities.User.update(userId, {
      tier: 'explorer',
      available_scans: 1,
      subscription_status: 'active'
    });
    
    console.log('[ADMIN_FIX_USER_SUCCESS]', { userId, result });
    
    return new Response(JSON.stringify({
      success: true,
      userId: userId,
      updated: {
        tier: 'explorer',
        available_scans: 1,
        subscription_status: 'active'
      }
    }), { status: 200, headers });
    
  } catch (e) {
    console.error('[ADMIN_FIX_USER_ERROR]', { error: e.message, stack: e.stack });
    
    return new Response(JSON.stringify({
      error: 'FUNCTION_ERROR',
      message: e.message
    }), { status: 500, headers });
  }
});