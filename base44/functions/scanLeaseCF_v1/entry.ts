/**
 * scanLeaseCF_v1 — Orchestrates lease scanning pipeline.
 * 
 * ASYNC MODEL (2026-03-19): Returns immediately with scanId after dispatching
 * analyzeLease. Frontend polls LeaseScan record for completion.
 * This prevents HTTP timeout when OpenAI takes >60s to respond.
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
    }

    // Mark scan as processing
    await base44.entities.LeaseScan.update(targetScan.id, { status: 'processing' });

    // ═══════════════════════════════════════════════════════════════
    // ASYNC DISPATCH: Fire analyzeLease WITHOUT awaiting the result
    // This prevents the frontend HTTP timeout (OpenAI takes 60-120s)
    // The frontend will poll the LeaseScan record for completion
    // ═══════════════════════════════════════════════════════════════
    console.log(`[SCAN_DISPATCH_ASYNC] ${requestId} scanId=${targetScan.id}`);

    // Fire and forget — analyzeLease + post-processing run in background
    (async () => {
      try {
        const analyzeResult = await base44.functions.invoke('analyzeLease', {
          fileUrl, leaseId, scanId: targetScan.id, language: language || 'en', scanMode
        });

        const result = analyzeResult?.data;

        if (!result || result.ok === false) {
          console.error(`[SCAN_ANALYZE_FAILED_BG] ${requestId}`, result?.message || 'No result');
          await base44.entities.LeaseScan.update(targetScan.id, { status: 'failed' });
          await base44.entities.Lease.update(leaseId, { status: 'failed' });
          return;
        }

        const scanFull = result.scan_full || {};
        console.log(`[SCAN_ANALYZE_OK_BG] ${requestId} clauses=${scanFull.clauses?.length || 0}`);

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

        // Update scan record — status 'completed' signals frontend to stop polling
        await base44.entities.LeaseScan.update(targetScan.id, {
          scan_full: scanFull,
          risk_score: scanFull.risk_score || 0,
          summary: scanFull.summary?.executive_summary || "Lease analysis complete.",
          status: 'completed'
        });

        // Update Lease with extracted key_terms
        if (scanFull.key_terms) {
          try {
            await base44.entities.Lease.update(leaseId, {
              property_address: scanFull.key_terms.property_address || null,
              start_date: scanFull.key_terms.lease_start_date || null,
              end_date: scanFull.key_terms.lease_end_date || null,
              rent_amount: scanFull.key_terms.monthly_rent || null,
              deposit_amount: scanFull.key_terms.security_deposit || null
            });
          } catch (e) {
            console.warn(`[SCAN_LEASE_UPDATE_FAIL_BG] ${requestId}`, e.message);
          }
        }

        // Credit deduction
        if (userObj) {
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
              await base44.entities.User.update(userObj.id, updateData);
              await base44.entities.CreditsLedger.create({
                user_id: userObj.id, user_email: userEmail, type: 'scans', delta: -1,
                reason: 'purchase', source_ref: `lease_scan:${leaseId}`
              });
            }
          } catch (e) {
            console.error(`[SCAN_CREDIT_FAIL_BG] ${requestId}`, e.message);
          }
        }

        // Populate trackers
        try {
          await base44.functions.invoke('populateFromScan', {
            scanId: targetScan.id, leaseId, scan_full: scanFull,
            userEmail, created_by: userEmail, owner_email: userEmail
          });
        } catch (e) {
          console.error(`[SCAN_POPULATE_FAIL_BG] ${requestId}`, e.message);
        }

        console.log(`[SCAN_COMPLETE_BG] ${requestId} scanId=${targetScan.id}`);
      } catch (e) {
        console.error(`[SCAN_BG_CRASH] ${requestId}`, e.message);
        try {
          await base44.entities.LeaseScan.update(targetScan.id, { status: 'failed' });
          await base44.entities.Lease.update(leaseId, { status: 'failed' });
        } catch (_) {}
      }
    })();

    // ═══════════════════════════════════════════════════════════════
    // RETURN IMMEDIATELY — frontend will poll for completion
    // ═══════════════════════════════════════════════════════════════
    console.log(`[SCAN_RETURNED_ASYNC] ${requestId} scanId=${targetScan.id}`);

    return Response.json({
      ok: true,
      async: true,
      scanId: targetScan.id,
      leaseId: leaseId,
      message: 'Scan dispatched. Poll LeaseScan record for status=completed.'
    });

  } catch (e) {
    console.error(`[SCAN_CRITICAL_ERROR] ${requestId}`, e.message);
    return Response.json({
      ok: false, step: 'FUNCTION_CRASH', error_code: 'UNHANDLED_EXCEPTION',
      message: String(e?.message || e)
    });
  }
});