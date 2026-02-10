import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin authentication
    const admin = await base44.auth.me();
    if (!admin) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = admin.role === 'admin' || admin.access_level === 'admin' ||
                    admin.role === 'super_admin' || admin.access_level === 'super_admin';
    
    if (!isAdmin) {
      console.warn('[adminModifyScans] Non-admin attempted access:', admin.email);
      return Response.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { userId, action, amount, reason } = await req.json();

    // Validation
    if (!userId || !action || typeof amount !== 'number') {
      return Response.json({ 
        success: false, 
        error: 'Missing required fields: userId, action, amount' 
      }, { status: 400 });
    }

    if (!['ADD', 'REMOVE', 'SET'].includes(action)) {
      return Response.json({ 
        success: false, 
        error: 'Invalid action. Must be ADD, REMOVE, or SET' 
      }, { status: 400 });
    }

    if (amount < 0) {
      return Response.json({ 
        success: false, 
        error: 'Amount cannot be negative' 
      }, { status: 400 });
    }

    console.log('[adminModifyScans] Request:', {
      userId,
      action,
      amount,
      reason,
      adminEmail: admin.email
    });

    // Get current user data
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (users.length === 0) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    const previousBalance = user.data?.available_scans || 0;
    
    // Calculate new balance
    let newBalance;
    switch (action) {
      case 'ADD':
        newBalance = previousBalance + amount;
        break;
      case 'REMOVE':
        newBalance = Math.max(0, previousBalance - amount);
        break;
      case 'SET':
        newBalance = Math.max(0, amount);
        break;
      default:
        return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    console.log('[adminModifyScans] Balance change:', {
      previous: previousBalance,
      new: newBalance,
      delta: newBalance - previousBalance
    });

    // Update user scan credits (stored in data object)
    const updatedData = { ...(user.data || {}), available_scans: newBalance };
    await base44.asServiceRole.entities.User.update(userId, {
      data: updatedData
    });

    // Record in audit ledger
    await base44.asServiceRole.entities.CreditsLedger.create({
      user_id: userId,
      user_email: user.email,
      type: 'scans',
      delta: newBalance - previousBalance,
      reason: reason || `Manual ${action.toLowerCase()} by admin`,
      source_ref: `admin:${admin.email}`
    });

    console.log('[adminModifyScans] Success:', {
      userId,
      previousBalance,
      newBalance
    });

    return Response.json({
      success: true,
      previousBalance,
      newBalance,
      action,
      amount
    });

  } catch (error) {
    console.error('[adminModifyScans] ERROR:', error.message, error.stack);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});