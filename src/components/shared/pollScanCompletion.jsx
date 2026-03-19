/**
 * Polls a LeaseScan record until it reaches a terminal status (completed/failed).
 * Used after scanLeaseCF_v1 returns async=true.
 * 
 * @param {string} scanId - The LeaseScan record ID
 * @param {object} base44 - The base44 SDK client
 * @param {object} options - { maxWaitMs, intervalMs, onProgress }
 * @returns {Promise<object>} - The completed scan record with scan_full data
 */
export async function pollScanCompletion(scanId, base44, options = {}) {
  const {
    maxWaitMs = 180000,  // 3 minutes max
    intervalMs = 3000,   // Poll every 3 seconds
    onProgress = null,   // optional callback(elapsedMs)
  } = options;

  const startTime = Date.now();

  while (true) {
    const elapsed = Date.now() - startTime;

    if (elapsed > maxWaitMs) {
      throw new Error('SCAN_TIMEOUT: Analysis is taking longer than expected. Check your lease list — it may still complete.');
    }

    if (onProgress) {
      onProgress(elapsed);
    }

    // Fetch the scan record
    const scans = await base44.entities.LeaseScan.filter({ id: scanId });
    const scan = scans?.[0];

    if (!scan) {
      throw new Error('SCAN_NOT_FOUND: Scan record disappeared');
    }

    console.log(`[POLL] scanId=${scanId} status=${scan.status} elapsed=${Math.round(elapsed / 1000)}s`);

    if (scan.status === 'completed' || scan.status === 'ok') {
      return scan;
    }

    if (scan.status === 'failed') {
      throw new Error('SCAN_FAILED: Analysis failed on the server. Please try again.');
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
}