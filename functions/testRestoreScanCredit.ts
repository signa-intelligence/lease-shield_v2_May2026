import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin authentication
    const admin = await base44.auth.me();
    if (!admin || !['admin', 'super_admin', 'va'].includes(admin.role || admin.access_level)) {
      return Response.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { userEmail, scans } = await req.json();

    if (!userEmail || typeof scans !== 'number') {
      return Response.json({ 
        success: false, 
        error: 'Missing required fields: userEmail, scans' 
      }, { status: 400 });
    }

    console.log('[testRestoreScanCredit] Request:', { userEmail, scans });

    // Get user
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    if (users.length === 0) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    const previousScans = user.available_scans || 0;

    // Update scan credits
    await base44.asServiceRole.entities.User.update(user.id, {
      available_scans: scans
    });

    console.log('[testRestoreScanCredit] Success:', {
      userEmail,
      previousScans,
      newScans: scans
    });

    return Response.json({
      success: true,
      userEmail,
      previousScans,
      newScans: scans
    });

  } catch (error) {
    console.error('[testRestoreScanCredit] ERROR:', error.message);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});