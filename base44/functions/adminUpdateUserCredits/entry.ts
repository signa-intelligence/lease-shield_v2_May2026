import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const ALLOWED_FIELDS = [
  'manual_tier_override',
  'manual_scan_credits',
  'manual_letter_credits',
  'manual_case_credits',
  'available_scans',
  'letter_credits'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const admin = await base44.auth.me();
    if (!admin) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = admin.role === 'admin' || admin.access_level === 'admin' ||
                    admin.role === 'super_admin' || admin.access_level === 'super_admin';

    if (!isAdmin) {
      console.warn('[adminUpdateUserCredits] Non-admin attempted access:', admin.email);
      return Response.json({ success: false, error: 'Admin access required' }, { status: 401 });
    }

    const { userId, updates } = await req.json();

    if (!userId || !updates || typeof updates !== 'object') {
      return Response.json({ success: false, error: 'Missing required fields: userId, updates' }, { status: 400 });
    }

    const invalidFields = Object.keys(updates).filter(key => !ALLOWED_FIELDS.includes(key));
    if (invalidFields.length > 0) {
      return Response.json({
        success: false,
        error: `Fields not allowed: ${invalidFields.join(', ')}`
      }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(userId, updates);

    console.log('[adminUpdateUserCredits] Updated user credits:', { userId, updates, adminEmail: admin.email });

    return Response.json({ success: true });

  } catch (error) {
    console.error('[adminUpdateUserCredits] ERROR:', error.message, error.stack);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});