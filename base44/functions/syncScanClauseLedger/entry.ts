import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { scanId, lease_id, file_urls } = await req.json();
    if (!scanId || !lease_id) {
      return Response.json({ error: 'scanId and lease_id required' }, { status: 400 });
    }

    const scans = await base44.entities.LeaseScan.filter({ id: scanId });
    const scan = scans?.[0];
    if (!scan) return Response.json({ error: 'Scan not found' }, { status: 404 });

    const canonical = scan.scan_full?.canonical_report;
    const hasLedger = Array.isArray(canonical?.clause_ledger) && canonical.clause_ledger.length >= 80;
    if (hasLedger) {
      return Response.json({ status: 'ok', updated: false, reason: 'ledger_complete' });
    }

    const files = (file_urls && file_urls.length) ? file_urls : [];
    const res = await base44.functions.invoke('clauseLedgerScan', {
      scanId,
      leaseId,
      fileUrls: files
    });

    const updated = !!(res?.data?.result);
    return Response.json({ status: 'ok', updated });
  } catch (err) {
    const msg = err?.response?.data?.error || err?.message || String(err);
    const code = err?.response?.data?.code || err?.code || '';
    const isDeploy = msg.includes('deploymentNotFound') || code === 'deploymentNotFound';
    if (isDeploy) {
      return Response.json({ 
        status: 'error', 
        code: 'deploymentNotFound', 
        error: 'Ledger generator not deployed. Publish backend functions and retry.', 
        function: 'clauseLedgerScan' 
      }, { status: 503 });
    }
    return Response.json({ status: 'error', error: msg }, { status: 500 });
  }
});