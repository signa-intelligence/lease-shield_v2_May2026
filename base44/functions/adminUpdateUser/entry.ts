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