import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const reqClone = req.clone();
    const base44 = createClientFromRequest(req);

    const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    const headerSecret = req.headers.get('x-internal-secret');
    const body = await reqClone.json().catch(() => ({}));
    const providedSecret = headerSecret || body.internal_secret;
    const serviceAuth = req.headers.get('base44-service-authorization');
    if (!serviceAuth && (!expectedSecret || providedSecret !== expectedSecret)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const svc = base44.asServiceRole || base44;
    const { leaseId } = body;
    
    console.log('[CLEANUP_START]', { leaseId });
    
    // Delete related records
    const deposits = await svc.entities.DepositTracker.filter({ lease_id: leaseId });
    for (const deposit of deposits) {
      await svc.entities.DepositTracker.delete(deposit.id);
    }
    
    const scans = await svc.entities.LeaseScan.filter({ lease_id: leaseId });
    for (const scan of scans) {
      await svc.entities.LeaseScan.delete(scan.id);
    }
    
    const notifications = await svc.entities.NotificationLog.filter({ lease_id: leaseId });
    for (const notification of notifications) {
      await svc.entities.NotificationLog.delete(notification.id);
    }
    
    console.log('[CLEANUP_COMPLETE]', { 
      depositsDeleted: deposits.length,
      scansDeleted: scans.length,
      notificationsDeleted: notifications.length
    });
    
    return Response.json({ ok: true });
  } catch (error) {
    console.error('[CLEANUP_ERROR]', { error: error.message });
    return Response.json({ ok: false, error: error.message });
  }
});