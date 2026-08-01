import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();

    if (!caller || caller.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userEmail, updates } = await req.json();
    if (!userEmail || !updates) {
      return Response.json({ error: 'Missing userEmail or updates' }, { status: 400 });
    }

    // Restrict updates to fields the admin panel is actually allowed to edit
    const ALLOWED_FIELDS = [
      'full_name',
      'phone',
      'plan_tier',
      'role',
      'access_level',
      'manual_tier_override',
      'manual_scan_credits',
      'manual_letter_credits',
      'manual_case_credits',
      'available_scans',
      'letter_credits'
    ];

    const invalidFields = Object.keys(updates).filter(f => !ALLOWED_FIELDS.includes(f));
    if (invalidFields.length > 0) {
      return Response.json({
        error: `Field(s) not allowed: ${invalidFields.join(', ')}`
      }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const users = await svc.entities.User.filter({ email: userEmail });
    if (!users?.length) {
      return Response.json({ error: `User not found: ${userEmail}` }, { status: 404 });
    }

    const targetUser = users[0];
    await svc.entities.User.update(targetUser.id, updates);

    return Response.json({ success: true, userId: targetUser.id, applied: updates });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});