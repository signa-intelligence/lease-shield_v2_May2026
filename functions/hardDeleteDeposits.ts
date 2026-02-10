import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Permanently deletes DepositTracker records for specific users
 * USE WITH CAUTION - This is a hard delete, not soft delete
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { userEmails } = await req.json();

    if (!userEmails || !Array.isArray(userEmails)) {
      return Response.json({ error: 'userEmails array required' }, { status: 400 });
    }

    const svc = base44.asServiceRole || base44;
    let totalDeleted = 0;

    for (const email of userEmails) {
      const deposits = await svc.entities.DepositTracker.filter({ owner_email: email });
      
      for (const deposit of deposits) {
        await svc.entities.DepositTracker.delete(deposit.id);
        totalDeleted++;
      }
    }

    console.log('[HARD_DELETE_DEPOSITS]', { 
      userEmails, 
      totalDeleted,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      deleted: totalDeleted,
      userEmails
    });

  } catch (error) {
    console.error('[HARD_DELETE_DEPOSITS_ERROR]', {
      error: error.message,
      stack: error.stack
    });
    
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});