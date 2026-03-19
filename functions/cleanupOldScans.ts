import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
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