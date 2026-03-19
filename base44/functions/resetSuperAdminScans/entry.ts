import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin' && user?.data?.access_level !== 'super_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const users = await svc.entities.User.filter({ email: 'steve.d.lockhart@gmail.com' });
    
    if (!users || users.length === 0) {
      return Response.json({ ok: false, error: 'User not found' });
    }

    const targetUser = users[0];
    
    await svc.entities.User.update(targetUser.id, {
      available_scans: 999,
      scans_used: 0,
      scan_limit_exempt: true
    });

    return Response.json({ 
      ok: true, 
      message: 'Scan credits reset and exemption flag set',
      userId: targetUser.id
    });
  } catch (e) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
});