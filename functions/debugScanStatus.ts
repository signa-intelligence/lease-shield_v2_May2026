import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { requireAuth, safeLog } from './authGuards.js';

Deno.serve(async (req) => {
  const body = await req.json();
  const { scanId } = body;
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    const { user, base44 } = await requireAuth(req);

    if (!scanId) {
      return Response.json({ error: 'Missing scanId parameter' }, { status: 400 });
    }

    const scans = await base44.entities.LeaseScan.filter({ id: scanId });
    const scan = scans?.[0];

    if (!scan) {
      return Response.json({
        found: false,
        scanId,
        error: 'SCAN_NOT_FOUND'
      });
    }

    const canonical = scan?.scan_full?.canonical_report || null;
    const pdfPayload = canonical?.pdfPayload || null;

    return Response.json({
      found: true,
      scanId: scan.id,
      hasPdfPayload: !!pdfPayload,
      canonicalStatus: canonical?.status || 'unknown',
      clauseLedgerCount: pdfPayload?.clause_ledger?.length || 0,
      lastError: canonical?.error || null,
    });

  } catch (error) {
    console.error(`[debugScanStatus Error]`, { error: error.message, stack: error.stack });
    return Response.json({ 
      found: false,
      scanId,
      error: 'FUNCTION_ERROR',
      errorMessage: error.message 
    }, { status: 500 });
  }
});