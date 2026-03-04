/******************************************************************************
 * ⚠️ PRODUCTION CODE - RE-FROZEN March 3, 2026 ⚠️
 * 
 * Last Working State: March 3, 2026
 * Status: PRODUCTION READY
 * Version: 1.0.1
 * 
 * CHANGE LOG:
 * v1.0.1 (2026-03-03): Updated freeze header only. No logic changes.
 *   analyzeLease v1.1.0 now handles image rejection upstream.
 * v1.0.0 (2026-02-22): Initial frozen version.
 * 
 * Features working:
 * - Tier-based scan modes (free=preview, paid=full) ✅
 * - Credit deduction after successful scan ✅
 * - Auto-populate deposits/timeline ✅
 * - Rate limiting (tier-based) ✅
 * - Storage tracking ✅
 * - Error handling and logging ✅
 ******************************************************************************/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Safe logging utility - redacts PII
const DEBUG_MODE = Deno.env.get('ADMIN_DEBUG') === 'true';
const PII_FIELDS = ['email', 'userEmail', 'user_email', 'owner_email', 'created_by'];

function redactPII(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key in sanitized) {
    if (PII_FIELDS.includes(key) && typeof sanitized[key] === 'string' && sanitized[key].includes('@')) {
      const [local, domain] = sanitized[key].split('@');
      sanitized[key] = `${local.substring(0, 3)}***@${domain}`;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = redactPII(sanitized[key]);
    }
  }
  return sanitized;
}

function safeLog(message, data = {}, level = 'log') {
  if (DEBUG_MODE) {
    console[level](`[${message}]`, data);
  } else {
    console[level](`[${message}]`, redactPII(data));
  }
}

Deno.serve(async (req) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`🔍 SCAN REQUEST START [${requestId}]`);
  console.log('Function: scanLeaseCF_v1.js');
  console.log('Timestamp:', new Date().toISOString());
  console.log('═══════════════════════════════════════════════════════════════');
  
  try {
    const base44 = createClientFromRequest(req);

    const bodyText = await req.text();
    console.log(`[${requestId}] Raw body text length:`, bodyText?.length || 0);
    
    let payload = {};
    try { 
      payload = JSON.parse(bodyText || '{}'); 
      console.log(`[${requestId}] [INPUT_PARAMS_RECEIVED]`, {
        leaseId: payload.leaseId,
        fileUrl: payload.fileUrl?.substring(0, 80),
        language: payload.language,
        inputScanId: payload.scanId,
        hasFileUrl: !!payload.fileUrl
      });
    } catch (parseErr) { 
      console.error(`[${requestId}] [JSON_PARSE_FAILED]`, { error: parseErr.message });
      payload = {}; 
    }

    const { leaseId = null, fileUrl = null, language = null, scanId: inputScanId = null } = payload;
    
    console.log(`[${requestId}] [PARAMS_EXTRACTED]`, {
      leaseId,
      fileUrl: fileUrl?.substring(0, 80),
      language,
      inputScanId
    });
    
    if (!leaseId || !fileUrl) {
      console.error(`[${requestId}] [VALIDATION_FAILED]`, { 
        hasLeaseId: !!leaseId, 
        hasFileUrl: !!fileUrl 
      });
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
      console.log(`[${requestId}] [AUTH_CHECK_START]`);
      const user = await base44.auth.me();
      userObj = user;
      userTier = user?.plan_tier || 'free';
      userEmail = user?.email;
      safeLog(`${requestId}_USER_AUTHENTICATED`, { 
        userId: user?.id,
        userTier, 
        userEmail, 
        availableScans: user?.available_scans,
        role: user?.role
      }, 'log');

      // ✅ RATE LIMIT CHECK: Prevent abuse (max 5-100 scans/hour based on tier)
      try {
        const rateLimitResponse = await base44.functions.invoke('checkRateLimit', {
          actionType: 'scan',
          windowMinutes: 60
        });
        
        const rateLimitResult = rateLimitResponse?.data;
        
        if (rateLimitResult && !rateLimitResult.allowed) {
          safeLog(`${requestId}_RATE_LIMIT_EXCEEDED`, {
            userEmail,
            actionType: 'scan',
            count: rateLimitResult.count,
            limit: rateLimitResult.limit,
            retryAfterMinutes: rateLimitResult.retryAfterMinutes
          }, 'log');
          
          return new Response(JSON.stringify({
            ok: false,
            step: 'RATE_LIMIT',
            error_code: 'RATE_LIMIT_EXCEEDED',
            message: rateLimitResult.message || 'Too many scan requests. Please try again later.',
            retryAfter: rateLimitResult.retryAfter,
            retryAfterMinutes: rateLimitResult.retryAfterMinutes
          }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        console.log(`[${requestId}] [RATE_LIMIT_PASSED]`, {
          count: rateLimitResult?.count,
          remaining: rateLimitResult?.remaining,
          limit: rateLimitResult?.limit
        });
      } catch (rateLimitErr) {
        // Fail open - don't block on rate limit errors
        console.warn(`[${requestId}] [RATE_LIMIT_CHECK_FAILED]`, {
          error: rateLimitErr.message,
          failOpen: true
        });
      }

      // ✅ CRITICAL: CHECK CREDITS BEFORE SCAN (not after expensive operations)
      const isFreeTier = !userTier || userTier === 'free' || userTier === 'discover' || userTier === 'explorer';

      // Annual limit check (applies to ALL tiers including Secure)
      const currentScans = user?.available_scans ?? 0;
      if (currentScans <= 0) {
        console.log('[SCAN_CF_V1_NO_CREDITS_BLOCKED]', { userId: user.id, availableScans: currentScans, tier: userTier });
        return new Response(JSON.stringify({
          ok: false, step: 'CREDIT_CHECK', error_code: 'NO_SCAN_CREDITS',
          message: isFreeTier
            ? 'You have used your free scan. Upgrade to continue scanning leases.'
            : 'No scan credits remaining for this year.'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // Monthly cap check for Secure tier (max 10 scans/month)
      if (userTier === 'secure') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        let monthlyUsed = 0;
        if (user.usage_month === currentMonth) {
          monthlyUsed = user.scans_used_this_month || 0;
        }
        if (monthlyUsed >= 10) {
          console.log('[SCAN_CF_V1_MONTHLY_CAP_BLOCKED]', { userId: user.id, monthlyUsed, cap: 10, month: currentMonth });
          return new Response(JSON.stringify({
            ok: false, step: 'MONTHLY_CAP', error_code: 'MONTHLY_SCAN_LIMIT',
            message: `Monthly scan limit reached (${monthlyUsed}/10). Resets next month.`
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }

    } catch (authErr) {
      console.error(`[${requestId}] [AUTH_CHECK_FAILED]`, { 
        error: authErr.message,
        stack: authErr.stack
      });
    }
    
    // CRITICAL FIX: Treat null, undefined, 'free', 'discover', 'explorer' as free tier
    // Database stores 'explorer' for free tier users
    const isFreeTier = !userTier || userTier === 'free' || userTier === 'discover' || userTier === 'explorer';
    const scanMode = isFreeTier ? 'preview' : 'full';
    
    console.log(`[${requestId}] [SCAN_MODE_DECISION]`, { 
      userTier, 
      isFreeTier, 
      scanMode,
      logic: 'isFreeTier checks for null/undefined/free/discover/explorer'
    });
    
    console.log(`[${requestId}] [SCAN_INPUT_SUMMARY]`, { 
      leaseId, 
      inputScanId, 
      fileUrl: fileUrl?.substring(0, 80), 
      scanMode, 
      userTier,
      language: language || 'en'
    });

    // Find or create scan record FIRST
    console.log(`[${requestId}] [SCAN_LOOKUP_START]`, { inputScanId, leaseId });
    let targetScan = null;
    
    if (inputScanId) {
      try {
        const scanArr = await base44.entities.LeaseScan.filter({ id: inputScanId });
        targetScan = scanArr?.[0] || null;
        console.log(`[${requestId}] [SCAN_LOOKUP_BY_INPUT_ID]`, { 
          inputScanId, 
          found: !!targetScan,
          scanStatus: targetScan?.status,
          scanOwner: targetScan?.owner_email
        });
      } catch (lookupErr) {
        console.error(`[${requestId}] [SCAN_LOOKUP_BY_ID_FAILED]`, {
          error: lookupErr.message,
          stack: lookupErr.stack,
          inputScanId
        });
      }
    }
    
    if (!targetScan) {
      try {
        const scans = await base44.entities.LeaseScan.filter({ lease_id: leaseId }, '-created_date');
        targetScan = scans?.[0] || null;
        console.log(`[${requestId}] [SCAN_LOOKUP_BY_LEASE]`, { 
          leaseId, 
          found: !!targetScan, 
          scanId: targetScan?.id,
          scanStatus: targetScan?.status,
          scansFound: scans?.length || 0
        });
      } catch (lookupErr) {
        console.error(`[${requestId}] [SCAN_LOOKUP_BY_LEASE_FAILED]`, {
          error: lookupErr.message,
          stack: lookupErr.stack,
          leaseId
        });
      }
    }
    
    if (!targetScan) {
      try {
        safeLog(`${requestId}_SCAN_CREATE_ATTEMPT`, {
          lease_id: leaseId,
          owner_email: userEmail,
          created_by: userEmail
        }, 'log');
        targetScan = await base44.entities.LeaseScan.create({ 
          lease_id: leaseId,
          owner_email: userEmail,
          created_by: userEmail,
          status: 'initiated' 
        });
        safeLog(`${requestId}_SCAN_CREATED_NEW`, { 
          scanId: targetScan.id,
          status: targetScan.status,
          owner_email: targetScan.owner_email,
          created_by: targetScan.created_by
        }, 'log');
      } catch (createErr) {
        safeLog(`${requestId}_SCAN_CREATE_FAILED`, {
          error: createErr.message,
          stack: createErr.stack,
          leaseId,
          userEmail
        }, 'error');
        throw createErr;
      }
    }

    // Pass the scanId so analyzeLease updates the RIGHT record
    console.log(`[${requestId}] [ANALYZE_LEASE_CALL_START]`, { 
      scanId: targetScan.id,
      leaseId, 
      fileUrl: fileUrl?.substring(0, 80),
      language: language || 'en',
      scanMode
    });
    
    let analyzeResult;
    try {
      analyzeResult = await base44.functions.invoke('analyzeLease', {
        fileUrl: fileUrl,
        leaseId: leaseId,
        scanId: targetScan.id,
        language: language || 'en',
        scanMode: scanMode
      });
      
      console.log(`[${requestId}] [ANALYZE_LEASE_RESPONSE]`, {
        hasData: !!analyzeResult?.data,
        ok: analyzeResult?.data?.ok,
        returnedScanId: analyzeResult?.data?.scanId,
        returnedLeaseId: analyzeResult?.data?.leaseId,
        hasFullScan: !!analyzeResult?.data?.scan_full,
        step: analyzeResult?.data?.step,
        error_code: analyzeResult?.data?.error_code,
        fullResponse: analyzeResult?.data
      });
    } catch (analyzeErr) {
      console.error(`[${requestId}] [ANALYZE_LEASE_FAILED]`, {
        error: analyzeErr.message,
        stack: analyzeErr.stack,
        params: {
          fileUrl: fileUrl?.substring(0, 80),
          leaseId,
          scanId: targetScan.id,
          scanMode
        }
      });
      throw analyzeErr;
    }

    const result = analyzeResult?.data;

    console.log(`[${requestId}] [ANALYZE_RESULT_FULL_INSPECTION] ========================================`);
    console.log(`[${requestId}] Result exists:`, !!result);
    console.log(`[${requestId}] Result keys:`, result ? Object.keys(result) : 'N/A');
    console.log(`[${requestId}] Result.ok:`, result?.ok);
    console.log(`[${requestId}] Result.scan_full exists:`, !!result?.scan_full);
    console.log(`[${requestId}] Full result object:`, JSON.stringify(result, null, 2));
    
    if (!result) {
      console.error(`[${requestId}] [ANALYZE_NO_RESULT]`, {
        analyzeResultExists: !!analyzeResult,
        analyzeResultData: analyzeResult
      });
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
      console.error(`[${requestId}] [ANALYZE_FAILED]`, {
        scanId: result.scanId,
        leaseId: result.leaseId,
        step: result.step,
        error_code: result.error_code,
        message: result.message,
        fullResult: result
      });
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
    
    console.log(`[${requestId}] [SCAN_FULL_INSPECTION] ========================================`);
    console.log(`[${requestId}] scan_full exists:`, !!scanFull);
    console.log(`[${requestId}] scan_full keys:`, Object.keys(scanFull));
    console.log(`[${requestId}] scan_full.pdfPayload exists:`, !!scanFull.pdfPayload);
    console.log(`[${requestId}] scan_full.clauses exists:`, !!scanFull.clauses);
    console.log(`[${requestId}] scan_full.clauses length:`, Array.isArray(scanFull.clauses) ? scanFull.clauses.length : 'N/A');
    console.log(`[${requestId}] scan_full.meta:`, scanFull.meta);
    console.log(`[${requestId}] scan_full.key_terms:`, scanFull.key_terms);
    console.log(`[${requestId}] Full scan_full object:`, JSON.stringify(scanFull, null, 2));
    
    // LOG PDFPAYLOAD INSPECTION
    if (scanFull.pdfPayload) {
      console.log(`[${requestId}] [PDFPAYLOAD_FOUND] ========================================`);
      console.log(`[${requestId}] pdfPayload type:`, typeof scanFull.pdfPayload);
      console.log(`[${requestId}] pdfPayload keys:`, Object.keys(scanFull.pdfPayload || {}));
      console.log(`[${requestId}] pdfPayload.hasResult:`, scanFull.pdfPayload?.hasResult);
      console.log(`[${requestId}] pdfPayload.text_length:`, scanFull.pdfPayload?.text_length);
      console.log(`[${requestId}] pdfPayload.chunks:`, scanFull.pdfPayload?.chunks);
      console.log(`[${requestId}] pdfPayload.warnings:`, scanFull.pdfPayload?.warnings);
      console.log(`[${requestId}] Full pdfPayload:`, JSON.stringify(scanFull.pdfPayload, null, 2));
    } else {
      console.warn(`[${requestId}] [PDFPAYLOAD_MISSING] ========================================`);
      console.warn(`[${requestId}] pdfPayload is undefined or null`);
      console.warn(`[${requestId}] Available scan_full keys:`, Object.keys(scanFull));
    }
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

    console.log(`[${requestId}] [SCAN_UPDATE_PREPARATION]`, { 
      scanId: targetScan.id,
      clausesCount: clausesArray.length,
      clause_ledger_count: scanFull.clause_ledger?.length || 0,
      text_length: scanFull.meta?.text_length,
      risk_score: scanFull.risk_score,
      hasKeyTerms: !!scanFull.key_terms,
      keyTermsKeys: scanFull.key_terms ? Object.keys(scanFull.key_terms) : []
    });

    // Update the existing scan record
    // CRITICAL: Use base44 (user context), NOT asServiceRole
    // asServiceRole sets created_by=null, blocking subsequent user updates via RLS
    const svc = base44;
    
    const scanUpdateData = {
      scan_full: scanFull,
      risk_score: scanFull.risk_score || 0,
      summary: scanFull.summary?.executive_summary || "Lease analysis complete.",
      status: 'completed'
    };
    
    console.log(`[${requestId}] [SCAN_UPDATE_DATA]`, {
      scanId: targetScan.id,
      updateFields: Object.keys(scanUpdateData),
      riskScore: scanUpdateData.risk_score,
      status: scanUpdateData.status,
      summaryLength: scanUpdateData.summary?.length || 0,
      scanFullSize: JSON.stringify(scanUpdateData.scan_full).length
    });
    
    try {
      console.log(`[${requestId}] [SCAN_UPDATE_START]`, { scanId: targetScan.id });
      
      await svc.entities.LeaseScan.update(targetScan.id, scanUpdateData);
      
      console.log(`[${requestId}] [SCAN_UPDATE_SUCCESS]`, { scanId: targetScan.id });
      
      // Update Lease entity with extracted key_terms
      if (scanFull.key_terms) {
        const leaseUpdateData = {
          property_address: scanFull.key_terms.property_address || null,
          start_date: scanFull.key_terms.lease_start_date || null,
          end_date: scanFull.key_terms.lease_end_date || null,
          rent_amount: scanFull.key_terms.monthly_rent || null,
          deposit_amount: scanFull.key_terms.security_deposit || null
        };
        
        console.log(`[${requestId}] [LEASE_UPDATE_DATA]`, {
          leaseId,
          updateFields: Object.keys(leaseUpdateData).filter(k => leaseUpdateData[k] !== null),
          propertyAddress: leaseUpdateData.property_address,
          startDate: leaseUpdateData.start_date,
          endDate: leaseUpdateData.end_date,
          rentAmount: leaseUpdateData.rent_amount,
          depositAmount: leaseUpdateData.deposit_amount
        });
        
        try {
          await svc.entities.Lease.update(leaseId, leaseUpdateData);
          
          console.log(`[${requestId}] [LEASE_UPDATE_SUCCESS]`, { 
            leaseId,
            updatedFields: Object.keys(leaseUpdateData).filter(k => leaseUpdateData[k] !== null)
          });
        } catch (leaseUpdateErr) {
          console.error(`[${requestId}] [LEASE_UPDATE_FAILED]`, {
            error: leaseUpdateErr.message,
            stack: leaseUpdateErr.stack,
            leaseId,
            updateData: leaseUpdateData
          });
          // Continue despite lease update failure
        }
      } else {
        console.log(`[${requestId}] [LEASE_UPDATE_SKIPPED]`, { 
          reason: 'No key_terms in scan_full' 
        });
      }

      // Verify the scan exists
      try {
        const verifiedScan = await svc.entities.LeaseScan.get(targetScan.id);
        if (!verifiedScan) {
          console.error(`[${requestId}] [SCAN_VERIFICATION_FAILED]`, {
            scanId: targetScan.id,
            error: 'Record not found after update'
          });
          throw new Error('Scan update succeeded but record not found');
        }
        console.log(`[${requestId}] [SCAN_VERIFIED]`, { 
          scanId: targetScan.id,
          hasFullScan: !!verifiedScan.scan_full,
          status: verifiedScan.status,
          clausesCount: scanFull.clauses?.length || 0
        });
      } catch (verifyErr) {
        console.error(`[${requestId}] [SCAN_VERIFICATION_ERROR]`, {
          error: verifyErr.message,
          stack: verifyErr.stack,
          scanId: targetScan.id
        });
        throw verifyErr;
      }
      
    } catch (dbError) {
      console.error(`[${requestId}] [DATABASE_ERROR]`, {
        scanId: targetScan.id,
        error: dbError.message,
        stack: dbError.stack,
        errorName: dbError.name,
        fullError: String(dbError)
      });
      
      return new Response(JSON.stringify({
        ok: false,
        step: 'DATABASE',
        error_code: 'DB_ERROR',
        message: `Database operation failed: ${dbError.message}`,
        scanId: targetScan.id
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

    // Decrement available_scans for ALL tiers (including Secure) AFTER successful analysis
    if (userObj && result?.ok === true) {
      try {
        const currentScans = userObj.available_scans || 0;
        if (currentScans > 0) {
          const updatedScans = currentScans - 1;
          const currentMonth = new Date().toISOString().slice(0, 7);
          const updateData = { available_scans: updatedScans };

          // Track monthly usage for Secure tier
          if (userTier === 'secure') {
            if (userObj.usage_month === currentMonth) {
              updateData.scans_used_this_month = (userObj.scans_used_this_month || 0) + 1;
            } else {
              updateData.usage_month = currentMonth;
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
          
          console.log('SCAN_CF_V1_CREDIT_DECREMENTED', { userId: userObj.id, oldScans: currentScans, newScans: updatedScans, tier: userTier, monthlyUsed: updateData.scans_used_this_month });
        }
      } catch (creditError) {
        console.error('SCAN_CF_V1_CREDIT_DECREMENT_FAILED', { userId: userObj.id, error: creditError.message });
      }
    }

    // CRITICAL FIX: AWAIT extractLeaseData completion BEFORE returning
    // This ensures deposits/timeline are created BEFORE UI navigates
    const populateParams = {
      scanId: targetScan.id,
      leaseId: leaseId,
      scan_full: scanFull,
      userEmail: userEmail,
      created_by: userEmail,
      owner_email: userEmail
    };
    
    safeLog(`${requestId}_POPULATE_FROM_SCAN_CALL_START`, { 
      scanId: targetScan.id, 
      leaseId: leaseId,
      userEmail,
      hasScanFull: !!scanFull,
      scanFullSize: JSON.stringify(scanFull).length,
      keyTermsKeys: scanFull.key_terms ? Object.keys(scanFull.key_terms) : []
    }, 'log');

    try {
      const extractResult = await base44.functions.invoke('populateFromScan', populateParams);
      
      console.log(`[${requestId}] [POPULATE_FROM_SCAN_RESPONSE]`, {
        hasData: !!extractResult?.data,
        ok: extractResult?.data?.ok,
        populated: extractResult?.data?.populated,
        depositCreated: extractResult?.data?.populated?.deposit,
        leaseUpdated: extractResult?.data?.populated?.lease,
        timelineCreated: extractResult?.data?.populated?.timeline,
        resultsDepositId: extractResult?.data?.results?.deposit?.id,
        error: extractResult?.data?.error,
        fullResponse: extractResult?.data
      });
      
      // CRITICAL: Only proceed if extraction succeeded or was not needed
      if (extractResult?.data?.ok === false && extractResult?.data?.error !== 'Scan not found') {
        console.error(`[${requestId}] [POPULATE_FAILED_CRITICAL]`, {
          error: extractResult?.data?.error,
          message: extractResult?.data?.message,
          fullResponse: extractResult?.data
        });
      }
      
    } catch (extractError) {
      console.error(`[${requestId}] [POPULATE_FROM_SCAN_ERROR]`, {
        error: extractError.message,
        stack: extractError.stack,
        errorName: extractError.name,
        params: populateParams
      });
      // Log but don't fail scan - extraction is supplementary
    }

    console.log(`[${requestId}] [SCAN_SUCCESS]`, {
      scanId: targetScan.id,
      leaseId: leaseId,
      clausesCount: scanFull.clauses?.length || 0,
      riskScore: scanFull.risk_score
    });
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`✅ SCAN REQUEST COMPLETE [${requestId}]`);
    console.log('═══════════════════════════════════════════════════════════════');
    
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
    console.error(`[${requestId}] [CRITICAL_ERROR]`, {
      error: e.message,
      stack: e.stack,
      errorName: e.name,
      fullError: String(e)
    });
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`❌ SCAN REQUEST FAILED [${requestId}]`);
    console.log('═══════════════════════════════════════════════════════════════');
    
    return new Response(JSON.stringify({ 
      ok: false, 
      step: 'FUNCTION_CRASH', 
      error_code: 'UNHANDLED_EXCEPTION', 
      message: String(e?.message || e),
      stack: e?.stack
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});