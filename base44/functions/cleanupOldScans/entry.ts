import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // INTERNAL-ONLY: cron/maintenance endpoint. Require shared secret OR admin.
    const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    const providedSecret = req.headers.get('x-internal-secret');
    const base44 = createClientFromRequest(req);

    if (!expectedSecret || providedSecret !== expectedSecret) {
      // Not an internal call — fall back to requiring an authenticated admin
      const user = await base44.auth.me().catch(() => null);
      const role = (user?.role || user?.access_level || '').toLowerCase();
      if (!user || !['admin', 'super_admin'].includes(role)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const svc = base44.asServiceRole || base44;
    
    // Get ALL scans
    const allScans = await svc.entities.LeaseScan.filter({});
    
    console.log('CLEANUP_TOTAL_SCANS', { count: allScans.length });
    
    let deletedCount = 0;
    let keptCount = 0;
    
    for (const scan of allScans) {
      const scanFull = scan.scan_full;
      
      // Check if it has the OLD format (canonical_report/pipeline)
      const hasOldFormat = scanFull && 
        (scanFull.canonical_report !== undefined || scanFull.pipeline !== undefined) &&
        !scanFull.clauses;
      
      if (hasOldFormat) {
        // Delete this old scan
        await svc.entities.LeaseScan.delete(scan.id);
        deletedCount++;
        console.log('CLEANUP_DELETED', { scanId: scan.id });
      } else {
        keptCount++;
      }
    }
    
    console.log('CLEANUP_COMPLETE', { 
      total: allScans.length,
      deleted: deletedCount,
      kept: keptCount
    });
    
    return Response.json({
      success: true,
      total: allScans.length,
      deleted: deletedCount,
      kept: keptCount
    });
    
  } catch (error) {
    console.error('CLEANUP_ERROR', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});