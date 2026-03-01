import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const admin = await base44.auth.me();
    if (!admin || !['admin', 'super_admin'].includes(admin.role?.toLowerCase()) && !['admin', 'super_admin'].includes(admin.access_level?.toLowerCase())) {
      return Response.json({ error: 'Unauthorized - admin access required' }, { status: 403 });
    }

    const { email, manual_tier_override, manual_letter_credits, manual_scan_credits, manual_case_credits, plan_tier, resolve_entitlement_used_at, resolve_entitlement_used_case_id } = await req.json();

    if (!email) {
      return Response.json({ error: 'email is required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const users = await svc.entities.User.filter({ email });
    
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    const updateData = {};

    if (manual_tier_override !== undefined) updateData.manual_tier_override = manual_tier_override;
    if (manual_letter_credits !== undefined) updateData.manual_letter_credits = manual_letter_credits;
    if (manual_scan_credits !== undefined) updateData.manual_scan_credits = manual_scan_credits;
    if (manual_case_credits !== undefined) updateData.manual_case_credits = manual_case_credits;
    if (plan_tier !== undefined) updateData.plan_tier = plan_tier;
    if (resolve_entitlement_used_at !== undefined) updateData.resolve_entitlement_used_at = resolve_entitlement_used_at;
    if (resolve_entitlement_used_case_id !== undefined) updateData.resolve_entitlement_used_case_id = resolve_entitlement_used_case_id;

    console.log('[adminSetManualOverride] Updating user:', email, 'with:', updateData);

    await svc.entities.User.update(user.id, updateData);

    const updated = await svc.entities.User.filter({ id: user.id });
    const u = updated[0];

    return Response.json({
      success: true,
      email: u.email,
      manual_tier_override: u.manual_tier_override,
      manual_letter_credits: u.manual_letter_credits,
      manual_scan_credits: u.manual_scan_credits,
      manual_case_credits: u.manual_case_credits,
      plan_tier: u.plan_tier
    });

  } catch (error) {
    console.error('[adminSetManualOverride] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});