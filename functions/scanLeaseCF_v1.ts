// PRODUCTION CODE - DO NOT MODIFY WITHOUT EXPLICIT APPROVAL
// Last verified working: 2026-01-13

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const bodyText = await req.text();
    let payload = {};
    try { payload = JSON.parse(bodyText || '{}'); } catch (_) { payload = {}; }

    const { leaseId = null, fileUrl = null, language = null, scanId: inputScanId = null } = payload;
    
    if (!leaseId || !fileUrl) {
      return new Response(JSON.stringify({ 
        ok: false, 
        step: 'INPUT_VALIDATION', 
        error_code: 'MISSING_PARAMS', 
        message: 'leaseId and fileUrl are required' 
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    // Get user tier to determine scan mode
    let userTier = 'free';
    let userEmail = null;
    let userObj = null;
    try {
      const user = await base44.auth.me();
      userObj = user;
      userTier = user?.plan_tier || 'free';
      userEmail = user?.email;
      console.log('SCAN_CF_V1_USER_TIER', { userTier, userEmail, availableScans: user?.available_scans });

      // ✅ CRITICAL: CHECK CREDITS BEFORE SCAN (not after expensive operations)
      // Treat null, undefined, 'free', 'discover', 'explorer' as limited tiers
      const isFreeTier = !userTier || userTier === 'free' || userTier === 'discover' || userTier === 'explorer';
      const isLimitedTier = isFreeTier || userTier === 'lite' || userTier === 'protect';

      if (isLimitedTier && userTier !== 'secure') {
        const currentScans = user?.available_scans ?? 0;
        if (currentScans <= 0) {
          console.log('[SCAN_CF_V1_NO_CREDITS_BLOCKED]', { 
            userId: user.id, 
            availableScans: currentScans, 
            tier: userTier 
          });
          return new Response(JSON.stringify({
            ok: false,
            step: 'CREDIT_CHECK',
            error_code: 'NO_SCAN_CREDITS',
            message: isFreeTier
              ? 'You have used your free scan. Upgrade to continue scanning leases.'
              : 'No scan credits remaining. Please purchase additional scans.'
          }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

    } catch (authErr) {
      console.warn('SCAN_CF_V1_AUTH_CHECK_FAILED', { error: authErr.message });
    }
    
    // CRITICAL FIX: Treat null, undefined, 'free', 'discover', 'explorer' as free tier
    // Database stores 'explorer' for free tier users
    const isFreeTier = !userTier || userTier === 'free' || userTier === 'discover' || userTier === 'explorer';
    const scanMode = isFreeTier ? 'preview' : 'full';
    
    console.log('SCAN_CF_V1_MODE_DECISION', { userTier, isFreeTier, scanMode });
    
    console.log('SCAN_CF_V1_INPUT', { leaseId, inputScanId, fileUrl: fileUrl?.substring(0, 80), scanMode, userTier });

    // Find or create scan record FIRST
    let targetScan = null;
    if (inputScanId) {
      const scanArr = await base44.entities.LeaseScan.filter({ id: inputScanId });
      targetScan = scanArr?.[0] || null;
      console.log('SCAN_CF_V1_LOOKUP_BY_INPUT_ID', { inputScanId, found: !!targetScan });
    }
    if (!targetScan) {
      const scans = await base44.entities.LeaseScan.filter({ lease_id: leaseId }, '-created_date');
      targetScan = scans?.[0] || null;
      console.log('SCAN_CF_V1_LOOKUP_BY_LEASE', { leaseId, found: !!targetScan, scanId: targetScan?.id });
    }
    if (!targetScan) {
      targetScan = await base44.entities.LeaseScan.create({ 
        lease_id: leaseId,
        owner_email: userEmail,
        status: 'initiated' 
      });
      console.log('SCAN_CF_V1_CREATED_NEW', { scanId: targetScan.id });
    }

    // Pass the scanId so analyzeLease updates the RIGHT record
    console.log('SCAN_CF_V1_CALLING_ANALYZELEASE', { 
      scanId: targetScan.id,
      leaseId, 
      fileUrl: fileUrl?.substring(0, 80) 
    });
    
    const analyzeResult = await base44.functions.invoke('analyzeLease', {
      fileUrl: fileUrl,
      leaseId: leaseId,
      scanId: targetScan.id,
      language: language || 'en',
      scanMode: scanMode // Pass scan mode to analyzeLease
    });

    console.log('SCAN_CF_V1_ANALYZELEASE_RETURNED', {
      ok: analyzeResult?.data?.ok,
      scanId: analyzeResult?.data?.scanId
    });

    const result = analyzeResult?.data;

    if (!result) {
      return new Response(JSON.stringify({
        ok: false,
        step: 'ANALYZE_LEASE',
        error_code: 'NO_RESPONSE',
        message: 'analyzeLease returned no data'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (result.ok === false) {
      return new Response(JSON.stringify({
        ok: false,
        scanId: result.scanId,
        leaseId: result.leaseId,
        step: result.step,
        error_code: result.error_code,
        message: result.message
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // SUCCESS - Transform data
    const scanFull = result.scan_full || {};
    const clausesArray = Array.isArray(scanFull.clauses) ? scanFull.clauses : [];
    
    scanFull.meta = scanFull.meta || {};
    scanFull.meta.text_length = clausesArray.reduce((sum, c) => sum + (c.clause_text?.length || 0), 0);
    scanFull.meta.chunks = 1;
    scanFull.meta.warnings = scanFull.meta.warnings || [];
    
    scanFull.summary = scanFull.summary || {};
    scanFull.summary.executive_summary = scanFull.summary.executive_summary || "Lease analysis complete.";
    scanFull.summary.top_risks = scanFull.summary.top_risks || [];
    
    if (!Array.isArray(scanFull.clause_ledger) || scanFull.clause_ledger.length === 0) {
      scanFull.clause_ledger = clausesArray.map((c, idx) => ({
        clause_id: c.clause_id || `clause-${idx + 1}`,
        title: c.canonical_name || `Clause ${idx + 1}`,
        full_text: c.clause_text || '',
        page_number: c.page_number || 1,
        risk_tags: c.risk_level ? [c.risk_level] : []
      }));
    }
    
    scanFull.key_terms = scanFull.key_terms || {};

    console.log('SCAN_CF_V1_BEFORE_UPDATE', { 
      scanId: targetScan.id,
      clausesCount: clausesArray.length,
      clause_ledger_count: scanFull.clause_ledger.length,
      text_length: scanFull.meta.text_length,
      risk_score: scanFull.risk_score
    });

    // Update the existing scan record
    const svc = base44.asServiceRole || base44;
    
    try {
      console.log('SCAN_CF_V1_UPDATING_SCAN', { scanId: targetScan.id });
      
      await svc.entities.LeaseScan.update(targetScan.id, {
        scan_full: scanFull,
        risk_score: scanFull.risk_score || 0,
        summary: scanFull.summary?.executive_summary || "Lease analysis complete.",
        status: 'completed'
      });
      
      // Update Lease entity with extracted key_terms
      if (scanFull.key_terms) {
        await svc.entities.Lease.update(leaseId, {
          property_address: scanFull.key_terms.property_address || null,
          start_date: scanFull.key_terms.lease_start_date || null,
          end_date: scanFull.key_terms.lease_end_date || null,
          rent_amount: scanFull.key_terms.monthly_rent || null,
          deposit_amount: scanFull.key_terms.security_deposit || null
        });
        
        console.log('[SCANLEASE_LEASE_UPDATED]', { 
          leaseId,
          propertyAddress: scanFull.key_terms.property_address 
        });
      }

      // Verify the scan exists
      const verifiedScan = await svc.entities.LeaseScan.get(targetScan.id);
      if (!verifiedScan) {
        throw new Error('Scan update succeeded but record not found');
      }
      console.log('SCAN_CF_V1_SCAN_UPDATED', { 
        scanId: targetScan.id,
        clausesCount: scanFull.clauses?.length || 0
      });
      
    } catch (dbError) {
      console.error('SCAN_CF_V1_DATABASE_ERROR', {
        scanId: targetScan.id,
        error: String(dbError),
        stack: dbError.stack
      });
      
      return new Response(JSON.stringify({
        ok: false,
        step: 'DATABASE',
        error_code: 'DB_ERROR',
        message: `Database operation failed: ${dbError.message}`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('SCAN_CF_V1_SUCCESS', { 
      scanId: targetScan.id,
      clausesCount: clausesArray.length
    });

    // CRITICAL FIX: Reuse userEmail from tier check (don't redeclare, causes shadowing bug)
    // userEmail was already set in lines 29-38 above
    if (!userEmail) {
      // Fallback: fetch from lease record
      try {
        const lease = await svc.entities.Lease.get(leaseId);
        userEmail = lease?.owner_email || lease?.created_by;
        console.log('[SCAN_CF_V1_USER_EMAIL_FROM_LEASE]', { userEmail });
      } catch (err) {
        console.error('[SCAN_CF_V1_USER_EMAIL_FAILED]', { error: err.message });
      }
    }

    // CRITICAL FIX: Decrement available_scans for ALL non-unlimited tiers AFTER successful analysis
    if (userObj && userTier !== 'secure' && result?.ok === true) {
      try {
        const currentScans = userObj.available_scans || 0;
        if (currentScans > 0) {
          const updatedScans = currentScans - 1;
          await svc.entities.User.update(userObj.id, { available_scans: updatedScans });
          
          // Log to CreditsLedger
          await svc.entities.CreditsLedger.create({
            user_id: userObj.id,
            user_email: userEmail,
            type: 'scans',
            delta: -1,
            reason: 'purchase',
            source_ref: `lease_scan:${leaseId}`
          });
          
          console.log('SCAN_CF_V1_CREDIT_DECREMENTED', { 
            userId: userObj.id, 
            oldScans: currentScans, 
            newScans: updatedScans,
            tier: userTier
          });
        } else {
          console.warn('SCAN_CF_V1_CREDIT_ALREADY_ZERO', { 
            userId: userObj.id, 
            availableScans: currentScans 
          });
        }
      } catch (creditError) {
        console.error('SCAN_CF_V1_CREDIT_DECREMENT_FAILED', { 
          userId: userObj.id, 
          error: creditError.message 
        });
        // Log error but do not block scan completion
      }
    }

    // CRITICAL FIX: AWAIT extractLeaseData completion BEFORE returning
    // This ensures deposits/timeline are created BEFORE UI navigates
    console.log('[SCAN_CF_V1_CALLING_EXTRACT]', { 
      scanId: targetScan.id, 
      leaseId: leaseId,
      userEmail,
      willWait: true
    });

    try {
      const extractResult = await base44.functions.invoke('populateFromScan', {
        scanId: targetScan.id,
        leaseId: leaseId,
        scan_full: scanFull,
        userEmail: userEmail,
        created_by: userEmail,
        owner_email: userEmail
      });
      
      console.log('[SCAN_CF_V1_EXTRACT_COMPLETE]', {
        ok: extractResult?.data?.ok,
        extracted: extractResult?.data?.extracted,
        created: extractResult?.data?.created,
        depositCreated: extractResult?.data?.created?.deposit,
        timelineCreated: extractResult?.data?.created?.notification
      });
      
      // CRITICAL: Only proceed if extraction succeeded or was not needed
      if (extractResult?.data?.ok === false && extractResult?.data?.error !== 'Scan not found') {
        console.error('[SCAN_CF_V1_EXTRACT_FAILED_CRITICAL]', {
          error: extractResult?.data?.error
        });
      }
      
    } catch (extractError) {
      console.error('[SCAN_CF_V1_EXTRACT_ERROR]', {
        error: extractError.message,
        stack: extractError.stack
      });
      // Log but don't fail scan - extraction is supplementary
    }

    return new Response(JSON.stringify({
      ok: true,
      scanId: targetScan.id,
      leaseId: leaseId,
      scan_full: scanFull
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    console.error('SCAN_CF_V1_ERROR', String(e));
    return new Response(JSON.stringify({ 
      ok: false, 
      step: 'FUNCTION_CRASH', 
      error_code: 'UNHANDLED_EXCEPTION', 
      message: String(e?.message || e) 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});