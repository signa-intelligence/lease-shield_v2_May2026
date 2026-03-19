import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email, updates } = await req.json();

    if (!email || !updates) {
      return Response.json({ error: 'Missing email or updates' }, { status: 400 });
    }

    // Find the target user
    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find(u => u.email === email);

    if (!targetUser) {
      return Response.json({ error: 'User not found', email }, { status: 404 });
    }

    // Apply updates
    await base44.asServiceRole.entities.User.update(targetUser.id, updates);

    // Verify
    const updatedUser = await base44.asServiceRole.entities.User.get(targetUser.id);

    return Response.json({
      ok: true,
      email: updatedUser.email,
      plan_tier: updatedUser.plan_tier,
      subscription_status: updatedUser.subscription_status,
      available_scans: updatedUser.available_scans,
      letter_credits: updatedUser.letter_credits
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});