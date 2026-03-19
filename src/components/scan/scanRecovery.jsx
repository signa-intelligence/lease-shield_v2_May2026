import { base44 } from "@/api/base44Client";

/**
 * Check if a scan actually completed in DB despite a function timeout/error.
 * Returns { recovered: true, scan } if scan completed, or { recovered: false }.
 * 
 * Checks scan_full presence (not just status) because the backend may timeout
 * AFTER saving scan_full but BEFORE updating status to 'ok'.
 */
export async function checkScanRecovery(scanId, leaseId) {
  if (!scanId && !leaseId) return { recovered: false };
  
  // Wait for DB to sync after a timeout
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    let rs = null;

    // Method 1: Look up by scan ID
    if (scanId) {
      console.log('[SCAN_RECOVERY] Checking by scanId:', scanId);
      const scans = await base44.entities.LeaseScan.filter({ id: scanId });
      rs = scans?.[0];
    }

    // Method 2: Fall back to lease_id if scan ID lookup fails
    if (!rs && leaseId) {
      console.log('[SCAN_RECOVERY] Checking by leaseId:', leaseId);
      const scans = await base44.entities.LeaseScan.filter({ lease_id: leaseId });
      rs = scans?.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))?.[0];
    }

    // Recovery condition: scan_full must exist (proves analysis completed)
    // Don't rely on status field — backend may timeout before setting it
    if (rs && rs.scan_full) {
      console.log('[SCAN_RECOVERY_SUCCESS]', { 
        scanId: rs.id, 
        status: rs.status, 
        riskScore: rs.risk_score,
        hasScanFull: true 
      });
      return { recovered: true, scan: rs };
    }

    console.log('[SCAN_RECOVERY_NOT_FOUND]', { scanId, leaseId, foundScan: !!rs, status: rs?.status, hasScanFull: !!rs?.scan_full });
  } catch (e) {
    console.warn('[SCAN_RECOVERY_FAILED]', e.message);
  }
  return { recovered: false };
}