import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Whitelist of super admin emails
const SUPER_ADMIN_EMAILS = [
  'signaconsultants@gmail.com',
  'steve@signaintelligence.com'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    if (!admin || !SUPER_ADMIN_EMAILS.includes(admin.email)) {
      return Response.json({ error: 'Unauthorized - Super admin only' }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 });
    }

    console.log('🔄 [ADMIN_RESET_RESOLVE] Resetting free Resolve for user:', userId);

    // Reset entitlement tracking
    await base44.asServiceRole.entities.User.update(userId, {
      resolve_entitlement_used_at: null,
      resolve_entitlement_used_case_id: null
    });

    console.log('✅ [ADMIN_RESET_RESOLVE] Free Resolve entitlement reset');

    return Response.json({
      success: true,
      message: 'Free Resolve entitlement reset successfully'
    });

  } catch (error) {
    console.error('❌ [ADMIN_RESET_RESOLVE] Error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});