import { base44 } from "@/api/base44Client";

/**
 * Check if a scan actually completed in DB despite a function timeout/error.
 * Returns { recovered: true, scan } if scan completed, or { recovered: false }.
 */
export async function checkScanRecovery(scanId) {
  if (!scanId) return { recovered: false };
  try {
    console.log('[SCAN_RECOVERY_CHECK]', { scanId });
    const scans = await base44.entities.LeaseScan.filter({ id: scanId });
    const rs = scans?.[0];
    if (rs && (rs.status === 'completed' || rs.status === 'ok') && rs.scan_full) {
      console.log('[SCAN_RECOVERY_SUCCESS]', { scanId, status: rs.status, riskScore: rs.risk_score });
      return { recovered: true, scan: rs };
    }
  } catch (e) {
    console.warn('[SCAN_RECOVERY_FAILED]', e.message);
  }
  return { recovered: false };
}