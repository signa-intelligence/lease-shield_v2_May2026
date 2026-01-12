import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { scanId } = body;
    
    if (!scanId) {
      return Response.json({ error: 'scanId required' }, { status: 400 });
    }
    
    // Fetch the scan record
    const scans = await base44.entities.LeaseScan.filter({ id: scanId });
    const scan = scans[0];
    
    if (!scan) {
      return Response.json({ error: 'Scan not found' }, { status: 404 });
    }
    
    // Show us EVERYTHING about this scan
    return Response.json({
      scanId: scan.id,
      leaseId: scan.lease_id,
      status: scan.status,
      created_date: scan.created_date,
      updated_date: scan.updated_date,
      scan_full_type: typeof scan.scan_full,
      scan_full_keys: scan.scan_full ? Object.keys(scan.scan_full) : null,
      scan_full_preview: JSON.stringify(scan.scan_full).substring(0, 500),
      has_clauses: scan.scan_full?.clauses ? true : false,
      clauses_count: scan.scan_full?.clauses?.length || 0,
      has_clause_ledger: scan.scan_full?.clause_ledger ? true : false,
      clause_ledger_count: scan.scan_full?.clause_ledger?.length || 0,
      risk_score: scan.risk_score,
      full_record_keys: Object.keys(scan)
    });
    
  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});