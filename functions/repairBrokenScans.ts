import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * repairBrokenScans
 * One-time repair tool to fix scans that have NO_SOURCE_DATA (empty canonical_report or missing ledger)
 *
 * Input (JSON):
 *   - scanId?: string (repair a specific scan)
 *   - leaseId?: string (repair all scans for this lease)
 *   - limit?: number (when scanning recent items; default 20)
 *
 * Behavior:
 *   1) Find candidate scans that are "broken" (no clauses_extracted or clause_ledger, or missing canonical_report.pdfPayload)
 *   2) For each candidate, re-run authoritative scanLease in-place (same scanId) using the lease's file_url(s)
 *   3) Verify persistence; if still broken, mark status='failed' and attach error_code
 */
Deno.serve(async (req) => {
  const startedAt = Date.now();
  let body = {};
  try { body = await req.json(); } catch {}

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && (user.access_level !== 'admin' && user.access_level !== 'super_admin' && user.access_level !== 'va'))) {
      return Response.json({ ok: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { scanId, leaseId, limit = 20 } = body || {};

    // Helper to decide if a scan is broken
    const isBroken = (scan) => {
      const sf = scan?.scan_full || {};
      const hasNewKeys = Array.isArray(sf.clauses_extracted) && sf.clauses_extracted.length > 0 &&
                         Array.isArray(sf.clause_ledger) && sf.clause_ledger.length > 0;
      const hasCanonicalPdf = !!(sf?.canonical_report && sf.canonical_report.pdfPayload);
      // Broken if missing either new keys or canonical pdf
      return !(hasNewKeys && hasCanonicalPdf);
    };

    let candidates = [];

    if (scanId) {
      const arr = await base44.asServiceRole.entities.LeaseScan.filter({ id: scanId });
      if (arr?.[0]) candidates = [arr[0]];
    } else if (leaseId) {
      const all = await base44.asServiceRole.entities.LeaseScan.list('-updated_date', 100);
      candidates = all.filter(s => s.lease_id === leaseId).slice(0, limit);
    } else {
      // Heuristic: scan recent scans and pick ones with obvious emptiness (canonical_report is {} or only pipeline present)
      const recent = await base44.asServiceRole.entities.LeaseScan.list('-updated_date', Math.max(50, limit));
      candidates = recent.filter(s => {
        const keys = Object.keys(s?.scan_full || {});
        const canonical = s?.scan_full?.canonical_report;
        const canonicalEmpty = canonical && typeof canonical === 'object' && Object.keys(canonical).length === 0;
        return canonicalEmpty || (keys.length <= 2 && keys.includes('pipeline') && keys.includes('canonical_report'));
      }).slice(0, limit);
    }

    const processed = [];

    for (const scan of candidates) {
      try {
        if (!isBroken(scan)) {
          processed.push({ scanId: scan.id, leaseId: scan.lease_id, action: 'skip_not_broken' });
          continue;
        }

        // Load lease to get file URLs
        const leaseArr = await base44.asServiceRole.entities.Lease.filter({ id: scan.lease_id });
        const lease = leaseArr?.[0];
        if (!lease) {
          processed.push({ scanId: scan.id, leaseId: scan.lease_id, action: 'fail_no_lease' });
          continue;
        }
        const fileUrls = Array.isArray(lease.file_urls) && lease.file_urls.length > 0 ? lease.file_urls : (lease.file_url ? [lease.file_url] : []);
        if (fileUrls.length === 0) {
          processed.push({ scanId: scan.id, leaseId: scan.lease_id, action: 'fail_no_files' });
          continue;
        }

        // Invoke authoritative scan in-place (same scanId)
        const res = await base44.asServiceRole.functions.invoke('scanLease', {
          scanId: scan.id,
          leaseId: lease.id,
          fileUrls
        });

        // Re-fetch and verify
        const afterArr = await base44.asServiceRole.entities.LeaseScan.filter({ id: scan.id });
        const after = afterArr?.[0];
        const sf = after?.scan_full || {};
        const hasNewKeys = Array.isArray(sf.clauses_extracted) && sf.clauses_extracted.length > 0 &&
                           Array.isArray(sf.clause_ledger) && sf.clause_ledger.length > 0;
        const hasCanonicalPdf = !!(sf?.canonical_report && sf.canonical_report.pdfPayload);
        const ok = hasNewKeys && hasCanonicalPdf;

        if (!ok) {
          try {
            await base44.asServiceRole.entities.LeaseScan.update(scan.id, {
              status: 'failed',
              scan_full: {
                ...(sf || {}),
                materialized_status: 'failed_repair',
                repair_note: 'repairBrokenScans could not populate required keys',
              }
            });
          } catch (_) {}
          processed.push({ scanId: scan.id, leaseId: lease.id, action: 'failed_verify', response: res?.data || null });
        } else {
          processed.push({ scanId: scan.id, leaseId: lease.id, action: 'repaired', clauses: sf.clause_ledger.length });
        }
      } catch (err) {
        processed.push({ scanId: scan.id, leaseId: scan.lease_id, action: 'error', error: String(err?.message || err) });
      }
    }

    return Response.json({ ok: true, count: processed.length, processed, elapsedMs: Date.now() - startedAt });
  } catch (error) {
    return Response.json({ ok: false, error: String(error?.message || error), elapsedMs: Date.now() - startedAt }, { status: 500 });
  }
});