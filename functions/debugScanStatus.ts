import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { scanId } = body;

    if (!scanId) {
      return Response.json({ 
        error: 'Missing scanId parameter' 
      }, { status: 400 });
    }

    // Query the SAME entity/table used by ReportFull
    const scans = await base44.entities.LeaseScan.filter({ id: scanId });
    const scan = scans?.[0];

    if (!scan) {
      return Response.json({
        scanId,
        found: false,
        entityNameUsed: 'LeaseScan',
        error: 'Scan not found'
      });
    }

    const canonical = scan?.scan_full?.canonical_report || null;
    const pdfPayload = canonical?.pdfPayload || null;

    return Response.json({
      scanId,
      found: true,
      entityNameUsed: 'LeaseScan',
      hasCanonical: !!canonical,
      hasPdfPayload: !!pdfPayload,
      canonicalStatus: canonical?.status || 'unknown',
      generatedAt: canonical?.generatedAt || null,
      failedAt: canonical?.failedAt || null,
      error: canonical?.error || null,
      clauseLedgerLength: pdfPayload?.clause_ledger?.length || 0,
      issuesCount: pdfPayload?.flags?.length || 0,
      pdfPayloadKeys: pdfPayload ? Object.keys(pdfPayload) : [],
      isFallback: pdfPayload?.fallback || false,
      fallbackReason: pdfPayload?.fallback_reason || null,
      pipelineSteps: scan?.scan_full?.pipeline?.length || 0,
      version: scan?.scan_full?.version || 'unknown'
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack?.substring(0, 500)
    }, { status: 500 });
  }
});