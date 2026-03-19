/**
 * scanLeaseCF_v1 — Orchestrates lease scanning pipeline.
 * 
 * Flow: auth → credit check → find/create scan → analyzeLease → credit deduct → populateFromScan
 * 
 * PERF FIX (2026-03-19): Stripped excessive logging, made post-scan work non-blocking
 * to stay within Deno Deploy CPU time limits.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[SCAN_START] ${requestId}`);

  try {
    const base44 = createClientFromRequest(req);

    const bodyText = await req.text();
    let payload = {};
    try { payload = JSON.parse(bodyText || '{}'); } catch (_) { payload = {}; }

    const { leaseId = null, fileUrl = null, language = null, scanId: inputScanId = null } = payload;

    if (!leaseId || !fileUrl) {
      return Response.json({
        ok: false, step: 'INPUT_VALIDATION', error_code: 'MISSING_PARAMS',
        message: 'leaseId and fileUrl are required'
      });
    }

    // Auth + tier check
    let userTier = 'free';
    let userEmail = null;
    let userObj = null;

    const user = await base44.auth.me();
    userObj = user;
    userTier = user?.plan_tier || 'free';
    userEmail = user?.email;
    console.log(`[SCAN_AUTH] ${requestId}`, { tier: userTier, email: userEmail });

    // Rate limit check (fail-open)
    try {
      const rlRes = await base44.functions.invoke('checkRateLimit', { actionType: 'scan', windowMinutes: 60 });
      const rl = rlRes?.data;
      if (rl && !rl.allowed) {
        console.log(`[SCAN_RATE_LIMITED] ${requestId}`);
        return Response.json({
          ok: false, step: 'RATE_LIMIT', error_code: 'RATE_LIMIT_EXCEEDED',
          message: rl.message || 'Too many scan requests. Please try again later.',
          retryAfter: rl.retryAfter
        });
      }
    } catch (e) {
      console.warn(`[SCAN_RATE_LIMIT_FAIL_OPEN] ${requestId}`, e.message);
    }

    // Credit check
    const isFreeTier = !userTier || userTier === 'free' || userTier === 'discover' || userTier === 'explorer';
    const scanMode = isFreeTier ? 'preview' : 'full';
    const currentScans = user?.available_scans ?? 0;

    if (currentScans <= 0) {
      return Response.json({
        ok: false, step: 'CREDIT_CHECK', error_code: 'NO_SCAN_CREDITS',
        message: isFreeTier
          ? 'You have used your free scan. Upgrade to continue scanning leases.'
          : 'No scan credits remaining for this year.'
      });
    }

    // Monthly cap for Secure tier
    if (userTier === 'secure') {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyUsed = (user.usage_month === currentMonth) ? (user.scans_used_this_month || 0) : 0;
      if (monthlyUsed >= 10) {
        return Response.json({
          ok: false, step: 'MONTHLY_CAP', error_code: 'MONTHLY_SCAN_LIMIT',
          message: `Monthly scan limit reached (${monthlyUsed}/10). Resets next month.`
        });
      }
    }

    // Find or create scan record
    let targetScan = null;

    if (inputScanId) {
      try {
        const scanArr = await base44.entities.LeaseScan.filter({ id: inputScanId });
        targetScan = scanArr?.[0] || null;
      } catch (_) {}
    }

    if (!targetScan) {
      try {
        const scans = await base44.entities.LeaseScan.filter({ lease_id: leaseId }, '-created_date');
        targetScan = scans?.[0] || null;
      } catch (_) {}
    }

    if (!targetScan) {
      targetScan = await base44.entities.LeaseScan.create({
        lease_id: leaseId,
        owner_email: userEmail,
        created_by: userEmail,
        status: 'initiated'
      });
      console.log(`[SCAN_CREATED] ${requestId} scanId=${targetScan.id}`);
    }

    // Call analyzeLease — this is the heavy operation (PDF + OpenAI)
    console.log(`[SCAN_ANALYZE_START] ${requestId} scanId=${targetScan.id}`);
    let analyzeResult;
    try {
      analyzeResult = await base44.functions.invoke('analyzeLease', {
        fileUrl, leaseId, scanId: targetScan.id, language: language || 'en', scanMode
      });
    } catch (analyzeErr) {
      console.error(`[SCAN_ANALYZE_FAILED] ${requestId}`, analyzeErr.message);
      throw analyzeErr;
    }

    const result = analyzeResult?.data;

    if (!result) {
      return Response.json({
        ok: false, step: 'ANALYZE_LEASE', error_code: 'NO_RESPONSE',
        message: 'analyzeLease returned no data'
      });
    }

    if (result.ok === false) {
      return Response.json({
        ok: false, scanId: result.scanId, leaseId: result.leaseId,
        step: result.step, error_code: result.error_code, message: result.message
      });
    }

    // SUCCESS — get scan_full from analyze result
    const scanFull = result.scan_full || {};
    console.log(`[SCAN_ANALYZE_OK] ${requestId} clauses=${scanFull.clauses?.length || 0} risk=${scanFull.risk_score}`);

    // Normalize scan_full structure (minimal)
    scanFull.meta = scanFull.meta || {};
    scanFull.summary = scanFull.summary || { executive_summary: "Lease analysis complete.", top_risks: [] };
    scanFull.key_terms = scanFull.key_terms || {};

    if (!Array.isArray(scanFull.clause_ledger) || scanFull.clause_ledger.length === 0) {
      const clausesArray = Array.isArray(scanFull.clauses) ? scanFull.clauses : [];
      scanFull.clause_ledger = clausesArray.map((c, idx) => ({
        clause_id: c.clause_id || `clause-${idx + 1}`,
        title: c.canonical_name || `Clause ${idx + 1}`,
        full_text: c.clause_text || '',
        page_number: c.page_number || 1,
        risk_tags: c.risk_level ? [c.risk_level] : []
      }));
    }

    // Update scan record with results
    const svc = base44;
    try {
      await svc.entities.LeaseScan.update(targetScan.id, {
        scan_full: scanFull,
        risk_score: scanFull.risk_score || 0,
        summary: scanFull.summary?.executive_summary || "Lease analysis complete.",
        status: 'completed'
      });
      console.log(`[SCAN_UPDATED] ${requestId} scanId=${targetScan.id}`);
    } catch (dbErr) {
      console.error(`[SCAN_DB_ERROR] ${requestId}`, dbErr.message);
      return Response.json({
        ok: false, step: 'DATABASE', error_code: 'DB_ERROR',
        message: `Database operation failed: ${dbErr.message}`, scanId: targetScan.id
      });
    }

    // Update Lease with extracted key_terms
    if (scanFull.key_terms) {
      try {
        await svc.entities.Lease.update(leaseId, {
          property_address: scanFull.key_terms.property_address || null,
          start_date: scanFull.key_terms.lease_start_date || null,
          end_date: scanFull.key_terms.lease_end_date || null,
          rent_amount: scanFull.key_terms.monthly_rent || null,
          deposit_amount: scanFull.key_terms.security_deposit || null
        });
      } catch (e) {
        console.warn(`[SCAN_LEASE_UPDATE_FAILED] ${requestId}`, e.message);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // NON-BLOCKING: Credit deduction + populate (fire-and-forget)
    // These must not block the response or contribute to CPU timeout
    // ═══════════════════════════════════════════════════════════════

    // Credit deduction (non-blocking)
    if (userObj && result?.ok === true) {
      (async () => {
        try {
          const cs = userObj.available_scans || 0;
          if (cs > 0) {
            const updateData = { available_scans: cs - 1 };
            if (userTier === 'secure') {
              const cm = new Date().toISOString().slice(0, 7);
              if (userObj.usage_month === cm) {
                updateData.scans_used_this_month = (userObj.scans_used_this_month || 0) + 1;
              } else {
                updateData.usage_month = cm;
                updateData.scans_used_this_month = 1;
                updateData.letters_used_this_month = 0;
                updateData.fasttrack_used_this_month = 0;
              }
            }
            await svc.entities.User.update(userObj.id, updateData);
            await svc.entities.CreditsLedger.create({
              user_id: userObj.id, user_email: userEmail, type: 'scans', delta: -1,
              reason: 'purchase', source_ref: `lease_scan:${leaseId}`
            });
            console.log(`[SCAN_CREDIT_OK] ${requestId} scans=${cs - 1}`);
          }
        } catch (e) {
          console.error(`[SCAN_CREDIT_FAIL] ${requestId}`, e.message);
        }
      })();
    }

    // Populate trackers from scan (non-blocking)
    (async () => {
      try {
        await base44.functions.invoke('populateFromScan', {
          scanId: targetScan.id, leaseId, scan_full: scanFull,
          userEmail, created_by: userEmail, owner_email: userEmail
        });
        console.log(`[SCAN_POPULATE_OK] ${requestId}`);
      } catch (e) {
        console.error(`[SCAN_POPULATE_FAIL] ${requestId}`, e.message);
      }
    })();

    console.log(`[SCAN_DONE] ${requestId} scanId=${targetScan.id}`);

    return Response.json({
      ok: true,
      scanId: targetScan.id,
      leaseId: leaseId,
      scan_full: scanFull
    });

  } catch (e) {
    console.error(`[SCAN_CRITICAL_ERROR] ${requestId}`, e.message, e.stack);
    return Response.json({
      ok: false, step: 'FUNCTION_CRASH', error_code: 'UNHANDLED_EXCEPTION',
      message: String(e?.message || e)
    });
  }
});