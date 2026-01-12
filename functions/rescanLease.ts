import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Auth check
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { leaseId } = body;
    
    if (!leaseId) {
      return Response.json({ error: 'leaseId required' }, { status: 400 });
    }

    console.log('[RESCAN] Starting rescan for lease:', leaseId);

    // Get the lease to find the file URL
    const leases = await base44.entities.Lease.filter({ id: leaseId });
    const lease = leases[0];
    
    if (!lease) {
      return Response.json({ error: 'Lease not found' }, { status: 404 });
    }

    // Get file URL from lease record
    const fileUrl = lease.document_url || lease.file_url || lease.lease_document_url;
    
    if (!fileUrl) {
      return Response.json({ 
        error: 'No file URL found on lease record',
        lease_fields: Object.keys(lease)
      }, { status: 400 });
    }

    console.log('[RESCAN] Found file URL:', fileUrl.substring(0, 80));

    // Call scanLeaseCF_v1 to trigger new scan
    const scanResult = await base44.functions.invoke('scanLeaseCF_v1', {
      fileUrl: fileUrl,
      leaseId: leaseId,
      language: 'en'
    });

    const result = scanResult?.data;

    if (!result?.ok) {
      return Response.json({
        success: false,
        error: 'Scan failed',
        details: result
      }, { status: 500 });
    }

    console.log('[RESCAN] Success!', {
      scanId: result.scanId,
      clausesCount: result.scan_full?.clauses?.length
    });

    return Response.json({
      success: true,
      message: 'Lease rescanned successfully',
      scanId: result.scanId,
      clausesCount: result.scan_full?.clauses?.length || 0
    });

  } catch (error) {
    console.error('[RESCAN] Error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});