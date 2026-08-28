/**
 * scanLeaseCF_v1 — Orchestrates lease scanning pipeline.
 * 
 * ASYNC MODEL (2026-03-19): Returns immediately with scanId after creating/finding scan record.
 * analyzeLease runs in background. Frontend polls LeaseScan status for completion.
 * This eliminates HTTP timeout issues when OpenAI takes >60s.
 * 
 * Flow: auth → credit check → find/create scan → return scanId → (background) analyzeLease → credit deduct → populate
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[SCAN_START] ${requestId}`);

  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole || base44;

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
    console.log(`[SCAN_AUTH] ${requestId}`, { tier: userTier });

    // Rate limit check (fail-open)
    try {
      const rlRes = await base44.functions.invoke('checkRateLimit', { actionType: 'scan', windowMinutes: 60 });
      const rl = rlRes?.data;
      if (rl && !rl.allowed) {
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
    // Promotional free full scan: a free-tier user who has not yet used their
    // one free scan receives a full-depth analysis, not a preview.
    const hasUnusedFreeScan = isFreeTier
      && user?.free_scan_eligible !== false
      && (user?.free_scans_used ?? 0) < 1;
    const scanMode = (!isFreeTier || hasUnusedFreeScan) ? 'full' : 'preview';
    console.log(`[SCAN_MODE_DECISION] ${requestId}`, { userTier, isFreeTier, hasUnusedFreeScan, scanMode });
    const currentScans = user?.available_scans ?? 0;

    if (currentScans <= 0) {
      return Response.json({
        ok: false, step: 'CREDIT_CHECK', error_code: 'NO_SCAN_CREDITS',
        message: isFreeTier
          ? 'You have used your free scan. Upgrade to continue scanning leases.'
          : 'No scan credits remaining for this year.'
      });
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

    const validTiers = ['free', 'lite', 'protect', 'secure', 'one_time'];
    const scanTier = validTiers.includes(userTier) ? userTier : 'free';

    if (!targetScan) {
      targetScan = await base44.entities.LeaseScan.create({
        lease_id: leaseId,
        owner_email: userEmail,
        created_by: userEmail,
        status: 'initiated',
        scan_tier: scanTier
      });
      console.log(`[SCAN_CREATED] ${requestId} scanId=${targetScan.id}`);
    }

    // Mark scan as processing
    await base44.entities.LeaseScan.update(targetScan.id, { status: 'processing' });

    // ═══════════════════════════════════════════════════════════════
    // CREDIT DEDUCTION — runs synchronously BEFORE dispatch.
    // Previously this sat inside the background task and never executed,
    // so scans were never counted. Refunded below if the analysis fails.
    // ═══════════════════════════════════════════════════════════════
    const consumingFreeScan = isFreeTier && hasUnusedFreeScan;
    const creditUpdate = { available_scans: currentScans - 1 };
    if (consumingFreeScan) {
      creditUpdate.free_scans_used = (userObj?.free_scans_used ?? 0) + 1;
      creditUpdate.free_scan_eligible = false;
    }
    if (userTier === 'secure') {
      const cm = new Date().toISOString().slice(0, 7);
      if (userObj?.usage_month !== cm) {
        creditUpdate.usage_month = cm;
        creditUpdate.letters_used_this_month = 0;
        creditUpdate.fasttrack_used_this_month = 0;
      }
    }

    let creditDeducted = false;
    try {
      await svc.entities.User.update(userObj.id, creditUpdate);
      creditDeducted = true;
    } catch (e1) {
      console.warn(`[SCAN_CREDIT_SVC_FAIL] ${requestId}`, e1.message);
      try {
        await base44.auth.updateMe(creditUpdate);
        creditDeducted = true;
      } catch (e2) {
        console.error(`[SCAN_CREDIT_CRITICAL] ${requestId}`, e2.message);
      }
    }

    if (!creditDeducted) {
      return Response.json({
        ok: false, step: 'CREDIT_DEDUCT', error_code: 'CREDIT_DEDUCT_FAILED',
        message: 'Could not reserve your scan credit. Please try again.'
      });
    }

    console.log(`[SCAN_CREDIT_OK] ${requestId} remaining=${currentScans - 1} freeScanConsumed=${consumingFreeScan} mode=${scanMode}`);

    try {
      await svc.entities.CreditsLedger.create({
        user_id: userObj.id, user_email: userEmail, type: 'scans', delta: -1,
        reason: 'purchase', source_ref: `lease_scan:${leaseId}`
      });
    } catch (e) {
      console.warn(`[SCAN_LEDGER_FAIL] ${requestId}`, e.message);
    }

    const refundScanCredit = async (why) => {
      const undo = { available_scans: currentScans };
      if (consumingFreeScan) {
        undo.free_scans_used = (userObj?.free_scans_used ?? 0);
        undo.free_scan_eligible = true;
      }
      try {
        await svc.entities.User.update(userObj.id, undo);
        await svc.entities.CreditsLedger.create({
          user_id: userObj.id, user_email: userEmail, type: 'scans', delta: 1,
          reason: 'refund', source_ref: `lease_scan_failed:${leaseId}`
        });
        console.log(`[SCAN_CREDIT_REFUNDED] ${requestId} reason=${why}`);
      } catch (e) {
        console.error(`[SCAN_REFUND_FAIL] ${requestId}`, e.message);
      }
    };

    // ═══════════════════════════════════════════════════════════════
    // ASYNC MODEL: Fire off analyzeLease in the background.
    // Return immediately so frontend doesn't timeout.
    // Frontend polls LeaseScan.status for 'completed' or 'failed'.
    // ═══════════════════════════════════════════════════════════════
    console.log(`[SCAN_ASYNC_DISPATCH] ${requestId} scanId=${targetScan.id}`);

    // Background: run analysis, save results, deduct credits, populate
    (async () => {
      try {
        const analyzeResult = await base44.functions.invoke('analyzeLease', {
          fileUrl, leaseId, scanId: targetScan.id, language: language || 'en', scanMode
        });

        const result = analyzeResult?.data;

        if (!result || result.ok === false) {
          console.error(`[SCAN_BG_ANALYZE_FAILED] ${requestId}`, result?.message || 'No data');
          await svc.entities.LeaseScan.update(targetScan.id, { status: 'failed' });
          await refundScanCredit('analyze_failed');
          return;
        }

        const scanFull = result.scan_full || {};
        console.log(`[SCAN_BG_ANALYZE_OK] ${requestId} clauses=${scanFull.clauses?.length || 0}`);

        // Normalize
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

        // Update scan record
        await svc.entities.LeaseScan.update(targetScan.id, {
          scan_full: scanFull,
          risk_score: scanFull.risk_score || 0,
          summary: scanFull.summary?.executive_summary || "Lease analysis complete.",
          status: 'completed'
        });
        console.log(`[SCAN_BG_UPDATED] ${requestId} scanId=${targetScan.id}`);

        // Update Lease with key_terms
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
            console.warn(`[SCAN_BG_LEASE_UPDATE_FAIL] ${requestId}`, e.message);
          }
        }

        // Populate trackers
        try {
          await base44.functions.invoke('populateFromScan', {
            internal_secret: Deno.env.get('INTERNAL_FUNCTION_SECRET'),
            scanId: targetScan.id, leaseId, scan_full: scanFull,
            userEmail, created_by: userEmail, owner_email: userEmail
          });
          console.log(`[SCAN_BG_POPULATE_OK] ${requestId}`);
        } catch (e) {
          console.error(`[SCAN_BG_POPULATE_FAIL] ${requestId}`, e.message);
        }

        console.log(`[SCAN_BG_COMPLETE] ${requestId}`);

      } catch (bgErr) {
        console.error(`[SCAN_BG_CRITICAL_ERROR] ${requestId}`, bgErr.message);
        try {
          await svc.entities.LeaseScan.update(targetScan.id, { status: 'failed' });
        } catch (_) {}
        await refundScanCredit('bg_critical_error');
      }
    })();

    // Return immediately — frontend will poll for results
    console.log(`[SCAN_RETURNED] ${requestId} scanId=${targetScan.id} (async processing started)`);

    return Response.json({
      ok: true,
      async: true,
      scanId: targetScan.id,
      leaseId: leaseId,
      message: 'Scan started. Poll LeaseScan status for completion.'
    });

  } catch (e) {
    console.error(`[SCAN_CRITICAL_ERROR] ${requestId}`, e.message);
    return Response.json({
      ok: false, step: 'FUNCTION_CRASH', error_code: 'UNHANDLED_EXCEPTION',
      message: String(e?.message || e)
    });
  }
});