import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    
    if (caller?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { email, available_scans, clear_nested_data } = body;

    if (!email) {
      return Response.json({ error: 'email is required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    
    // Find user
    const users = await svc.entities.User.filter({ email });
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found', email }, { status: 404 });
    }
    
    const user = users[0];
    
    console.log('[FORCE_FIX] BEFORE:', {
      userId: user.id,
      email: user.email,
      topLevel_available_scans: user.available_scans,
      data_available_scans: user.data?.available_scans,
      nested_data_data: user.data?.data,
      full_data: user.data
    });

    // Build update payload - flat, top-level fields only
    // This is the format that WORKED before my change broke it
    const updatePayload = {};
    
    if (available_scans !== undefined) {
      updatePayload.available_scans = available_scans;
    }
    
    // If clear_nested_data is true, remove the broken nested data.data object
    // by setting it to null
    if (clear_nested_data && user.data?.data) {
      updatePayload.data = null;
    }

    console.log('[FORCE_FIX] Updating with payload:', updatePayload);
    
    const result = await svc.entities.User.update(user.id, updatePayload);
    
    console.log('[FORCE_FIX] AFTER update result:', {
      result_available_scans: result?.available_scans,
      result_data: result?.data
    });

    // Verify
    const verified = await svc.entities.User.filter({ email });
    const verifiedUser = verified?.[0];
    
    console.log('[FORCE_FIX] VERIFIED:', {
      available_scans: verifiedUser?.available_scans,
      data_available_scans: verifiedUser?.data?.available_scans,
      nested_data_data: verifiedUser?.data?.data,
      full_data: verifiedUser?.data
    });

    return Response.json({
      success: true,
      before: {
        available_scans: user.available_scans,
        data_available_scans: user.data?.available_scans,
        nested_data_data: user.data?.data
      },
      after: {
        available_scans: verifiedUser?.available_scans,
        data_available_scans: verifiedUser?.data?.available_scans,
        nested_data_data: verifiedUser?.data?.data
      }
    });

  } catch (e) {
    console.error('[FORCE_FIX_ERROR]', e.message, e.stack);
    return Response.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
});