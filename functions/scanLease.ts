import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { requireAuth, safeLog } from './authGuards.js';
import { enforceRateLimit } from './rateLimiter.js';
import { validateFileUrl } from './sanitizer.js';
import { err } from './http.js';

// MAIN SCAN FUNCTION - DETERMINISTIC PIPELINE
Deno.serve(async (req) => {
  const body = await req.json();
  const requestId = body.requestId || crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();
  const scanId = body.scanId || crypto.randomUUID();
  const stages = [];
  
  const logStage = (stage, data) => {
    const entry = {
      stage,
      timestamp: new Date().toISOString(),
      elapsed: Date.now() - startTime,
      ...data
    };
    stages.push(entry);
    console.log(`[SCAN:${scanId}][REQ:${requestId}] ${stage}:`, entry);
  };

  try {
    logStage('ENGINE_START', { version: 'v4.0-materialized-guaranteed' });

    // AUTH & SECURITY
    const { user, base44 } = await requireAuth(req);
    const rateLimitResult = await enforceRateLimit(user.id, 'scanLease', base44);
    await safeLog('SCAN_RATE_LIMIT', { remaining: rateLimitResult.remaining });

    const userTier = user.plan_tier || 'free';

    // VALIDATE SCAN QUOTA
    if (userTier === 'free') {
      await safeLog('SCAN_PREMIUM_GATE', { userId: user.id });
      return Response.json({ 
        success: false,
        error: 'Upgrade required to scan',
        diagnostic: { requestId, errorCategory: 'PREMIUM_REQUIRED' }
      }, { status: 403 });
    }

    const scanLimits = {
      free: { limit: 1, period: 'lifetime' },
      lite: { limit: 6, period: 'year' },
      protect: { limit: 12, period: 'year' },
      secure: { limit: 999999, period: 'year' }
    };
    
    const tierLimit = scanLimits[userTier] || scanLimits.free;
    const leases = await base44.entities.Lease.filter({ created_by: user.email });
    
    let scannedCount = 0;
    if (tierLimit.period === 'lifetime') {
      scannedCount = leases.filter(l => l.status === 'scanned' || l.status === 'paid').length;
    } else if (tierLimit.period === 'year') {
      const thisYear = new Date().getFullYear();
      scannedCount = leases.filter(l => {
        if (!l.created_date) return false;
        const leaseYear = new Date(l.created_date).getFullYear();
        return leaseYear === thisYear && (l.status === 'scanned' || l.status === 'paid');
      }).length;
    }
    
    if (scannedCount >= tierLimit.limit) {
      await safeLog('SCAN_QUOTA_EXCEEDED', { userId: user.id, scannedCount, limit: tierLimit.limit });
      return err(req, 'QUOTA_EXCEEDED', 'Scan quota exceeded for your plan tier', 403, requestId);
    }

    const { fileUrls, leaseId } = body;
    
    if (!fileUrls || fileUrls.length === 0) {
      logStage('VALIDATION_FAILED', { reason: 'no_files' });
      return err(req, 'VALIDATION_ERROR', 'No file URLs provided', 400, requestId);
    }

    // VALIDATE FILE URLS
    const urlArray = Array.isArray(fileUrls) ? fileUrls : [fileUrls];
    for (const url of urlArray) {
      const validation = validateFileUrl(url);
      if (!validation.valid) {
        await safeLog('SCAN_INVALID_FILE_URL', { error: validation.error });
        return err(req, 'INVALID_FILE_URL', validation.error, 400, requestId);
      }

      try {
        const headRes = await fetch(url, { method: 'HEAD' });
        const sizeHeader = headRes.headers.get('content-length');
        if (sizeHeader && parseInt(sizeHeader, 10) > 10 * 1024 * 1024) {
          await safeLog('SCAN_FILE_TOO_LARGE', { size: parseInt(sizeHeader, 10) });
          return err(req, 'FILE_TOO_LARGE', 'File too large. Maximum size: 10MB', 400, requestId);
        }
      } catch (e) {
        // If HEAD fails, continue
      }
    }

    // STEP 1: EXTRACT CLAUSES & KEY TERMS
    logStage('CLAUSE_EXTRACTION_START', { fileCount: urlArray.length });
    
    const extractionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract ALL clauses from this residential lease document.

FOR EACH CLAUSE provide:
- clause_id: identifier (e.g., "3.2", "Section 5") or generate "CLAUSE-nnn"
- title: heading/title (empty if none)
- raw_text: complete clause text (max 600 chars)
- page_number: estimated page (1 if unsure)
- language: "th", "en", or "mixed"

ALSO EXTRACT:
- property_address (string, empty if not found)
- start_date (YYYY-MM-DD, empty if not found)
- end_date (YYYY-MM-DD, empty if not found)
- rent_amount (number, 0 if not found)
- deposit_amount (number, 0 if not found)
- notice_period_days (integer, 0 if not found)
- language_detected ("en", "th", or "mixed")
- rent_due_day (integer 1-31, 0 if not found)
- deposit_due_date (YYYY-MM-DD, empty if not found)
- deposit_return_days (integer days after lease end, 0 if not found)

Be thorough.`,
      file_urls: fileUrls,
      response_json_schema: {
        type: "object",
        properties: {
          clauses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                clause_id: { type: "string" },
                title: { type: "string" },
                raw_text: { type: "string" },
                page_number: { type: "integer" },
                language: { type: "string", enum: ["en", "th", "mixed"] }
              },
              required: ["clause_id", "raw_text"]
            }
          },
          property_address: { type: "string" },
          start_date: { type: "string" },
          end_date: { type: "string" },
          rent_amount: { type: "number" },
          deposit_amount: { type: "number" },
          language_detected: { type: "string", enum: ["en", "th", "mixed"] },
          notice_period_days: { type: "integer" },
          rent_due_day: { type: "integer" },
          deposit_due_date: { type: "string" },
          deposit_return_days: { type: "integer" }
        },
        required: ["clauses"]
      }
    });

    const clauses = extractionResult.clauses || [];
    const keyTerms = {
      property_address: extractionResult.property_address || '',
      start_date: extractionResult.start_date || '',
      end_date: extractionResult.end_date || '',
      rent_amount: extractionResult.rent_amount || 0,
      deposit_amount: extractionResult.deposit_amount || 0,
      language_detected: extractionResult.language_detected || 'en',
      notice_period_days: extractionResult.notice_period_days || 0,
      rent_due_day: extractionResult.rent_due_day || 0,
      deposit_due_date: extractionResult.deposit_due_date || '',
      deposit_return_days: extractionResult.deposit_return_days || 0
    };

    logStage('CLAUSES_EXTRACTED', { count: clauses.length, language: keyTerms.language_detected });

    // STEP 2: BUILD SIMPLE ISSUES LIST FOR FALLBACK
    const clauses_extracted = clauses.map((c, idx) => ({
      clause_id: String(c.clause_id || `CLAUSE-${idx + 1}`),
      heading: c.title || null,
      full_text: c.raw_text || '',
      page: c.page_number || null
    }));

    const simpleIssues = [];
    const userLang = user.language || 'en';

    // Simple pattern-based risk detection for fallback
    clauses.forEach(clause => {
      const text = clause.raw_text || '';
      
      // High-risk patterns
      if (/disconnect.*utility|cut.*water|ตัด.*น้ำ|ตัด.*ไฟ/i.test(text)) {
        simpleIssues.push({
          severity: 'critical',
          category: 'Legal Rights',
          title: userLang === 'th' ? 'การตัดสาธารณูปโภค' : 'Utility Disconnection',
          summary: userLang === 'th' ? 'พบข้อกำหนดการตัดสาธารณูปโภค' : 'Utility disconnection clause detected',
          why_it_matters: userLang === 'th' ? 'อาจผิดกฎหมาย' : 'May be illegal',
          recommendations: [userLang === 'th' ? 'ขอให้ลบข้อกำหนดนี้' : 'Request removal of this clause'],
          clause_refs: [{ clause_id: clause.clause_id, page: clause.page_number || 1, snippet: text.substring(0, 200) }]
        });
      }

      if (/forfeit.*deposit|ริบ.*มัดจำ/i.test(text)) {
        simpleIssues.push({
          severity: 'high',
          category: 'Financial Risk',
          title: userLang === 'th' ? 'การริบเงินมัดจำ' : 'Deposit Forfeiture',
          summary: userLang === 'th' ? 'พบข้อกำหนดการริบเงินมัดจำ' : 'Deposit forfeiture clause detected',
          why_it_matters: userLang === 'th' ? 'ความเสี่ยงการสูญเสียเงินมัดจำ' : 'Risk of losing deposit',
          recommendations: [userLang === 'th' ? 'เจรจาให้มีเงื่อนไขที่ชัดเจน' : 'Negotiate for clear conditions'],
          clause_refs: [{ clause_id: clause.clause_id, page: clause.page_number || 1, snippet: text.substring(0, 200) }]
        });
      }
    });

    const simpleRiskScore = Math.min(100, simpleIssues.length * 15);

    // STEP 3: CALL CANONICAL GENERATOR (MANDATORY)
    logStage('CANONICAL_GENERATOR_START', {});
    let canonicalReport = null;
    let canonicalError = null;
    const canonicalStartTime = Date.now();
    
    try {
      const canonicalResult = await base44.asServiceRole.functions.invoke('clauseLedgerScan', {
        fileUrls: urlArray,
        leaseId,
        scanId
      });
      
      const canonicalDuration = Date.now() - canonicalStartTime;
      logStage('CANONICAL_GENERATOR_COMPLETE', { 
        duration: canonicalDuration,
        success: canonicalResult.data?.success 
      });
      
      if (canonicalResult.data?.success) {
        canonicalReport = canonicalResult.data.result;
      } else {
        throw new Error(canonicalResult.data?.error || 'Canonical scan returned non-success');
      }
    } catch (err) {
      const canonicalDuration = Date.now() - canonicalStartTime;
      canonicalError = {
        code: 'CANONICAL_GENERATOR_FAILED',
        message: err.message || String(err),
        stack: err.stack?.substring(0, 500),
        duration: canonicalDuration
      };
      
      logStage('CANONICAL_GENERATOR_FAILED', canonicalError);
      console.error('[CANONICAL_GENERATOR_ERROR]', canonicalError);
    }

    // STEP 4: BUILD FINAL REPORT (ALWAYS HAS pdfPayload)
    logStage('PERSISTENCE_START', {});
    
    let finalPdfPayload = null;
    let finalStatus = 'ok';
    let finalReport = null;
    
    if (canonicalReport && canonicalReport.pdfPayload) {
      // SUCCESS: Use canonical payload
      finalPdfPayload = canonicalReport.pdfPayload;
      finalStatus = 'ok';
      finalReport = canonicalReport;
      
      logStage('USING_CANONICAL_PAYLOAD', {
        clausesCount: finalPdfPayload.clause_ledger?.length || 0,
        issuesCount: finalPdfPayload.flags?.length || 0
      });
    } else {
      // FALLBACK: Build minimal payload
      logStage('BUILDING_FALLBACK_PAYLOAD', { 
        reason: canonicalError ? 'generator_failed' : 'missing_payload' 
      });
      
      const fallbackFlags = simpleIssues.map((issue, idx) => ({
        clause_id: issue.clause_refs?.[0]?.clause_id || `ISSUE-${idx}`,
        severity: issue.severity || 'medium',
        category: issue.category || 'Other Risks',
        title: issue.title || 'Issue detected',
        description: issue.summary || issue.why_it_matters || 'Review required',
        explanation: issue.why_it_matters || '',
        recommendation: issue.recommendations?.join('\n') || 'Review with legal counsel',
        evidence: issue.clause_refs?.[0]?.snippet || 'Evidence not available'
      }));
      
      const fallbackClauseLedger = clauses_extracted.map(c => ({
        clause_id: c.clause_id,
        heading: c.heading,
        full_text: c.full_text,
        page: c.page,
        risk_level: 'unknown'
      }));

      finalPdfPayload = {
        lease_address: keyTerms.property_address || 'Lease Agreement',
        generated_date: new Date().toISOString(),
        risk_score: simpleRiskScore,
        summary: `${simpleIssues.length} issues detected (fallback mode)`,
        key_terms: keyTerms,
        flags: fallbackFlags,
        clause_review: [],
        clause_ledger: fallbackClauseLedger,
        mappings: [],
        missing_clauses: [],
        coverage_summary: {},
        fallback: true,
        fallback_reason: canonicalError ? `Generator failed: ${canonicalError.message}` : 'Canonical payload missing'
      };
      
      finalStatus = canonicalError ? 'failed' : 'ok';
      
      finalReport = {
        pdfPayload: finalPdfPayload,
        clause_ledger: fallbackClauseLedger,
        clause_review: [],
        issues: fallbackFlags,
        status: finalStatus,
        generatedAt: new Date().toISOString(),
        failedAt: canonicalError ? new Date().toISOString() : null,
        error: canonicalError
      };
      
      logStage('FALLBACK_PAYLOAD_BUILT', {
        clausesCount: fallbackClauseLedger.length,
        issuesCount: fallbackFlags.length
      });
    }
    
    // CRITICAL VALIDATION
    if (!finalPdfPayload || !Array.isArray(finalPdfPayload.clause_ledger)) {
      logStage('PAYLOAD_VALIDATION_FAILED', {
        hasPdfPayload: !!finalPdfPayload,
        hasClauseLedger: Array.isArray(finalPdfPayload?.clause_ledger)
      });
      
      throw new Error('PAYLOAD_BUILD_FAILED: Required pdfPayload structure missing');
    }
    
    // Build pipeline log
    const pipeline = stages.map(s => ({
      step: s.stage,
      at: s.timestamp,
      ok: !s.error,
      ms: s.elapsed || 0,
      meta: s
    }));
    
    // STEP 5: PERSIST (NON-OPTIONAL)
    try {
      await base44.asServiceRole.entities.LeaseScan.update(scanId, {
        lease_id: leaseId,
        risk_score: finalPdfPayload.risk_score,
        flags: finalPdfPayload.flags || [],
        summary: finalPdfPayload.summary,
        scan_full: {
          clauses_extracted,
          clause_ledger: finalPdfPayload.clause_ledger,
          key_terms: keyTerms,
          language_detected: keyTerms.language_detected,
          canonical_report: finalReport,
          pipeline,
          version: 'v4.0-materialized'
        }
      });
      
      logStage('PERSISTENCE_COMPLETE', {
        pdfPayloadSize: JSON.stringify(finalPdfPayload).length,
        clausesCount: finalPdfPayload.clause_ledger.length,
        issuesCount: finalPdfPayload.flags.length,
        status: finalStatus
      });
    } catch (persistErr) {
      logStage('PERSISTENCE_FAILED', { error: persistErr.message });
      throw new Error(`PERSISTENCE_FAILED: ${persistErr.message}`);
    }

    // STEP 6: SELF-CHECK (VERIFY PERSISTENCE)
    logStage('SELF_CHECK_START', {});
    const verifyScans = await base44.asServiceRole.entities.LeaseScan.filter({ id: scanId });
    const verifyScan = verifyScans?.[0];
    const verifyPayload = verifyScan?.scan_full?.canonical_report?.pdfPayload;
    
    if (!verifyPayload || !Array.isArray(verifyPayload.clause_ledger) || verifyPayload.clause_ledger.length === 0) {
      logStage('SELF_CHECK_FAILED', {
        hasPayload: !!verifyPayload,
        hasLedger: Array.isArray(verifyPayload?.clause_ledger),
        ledgerLength: verifyPayload?.clause_ledger?.length || 0
      });
      
      throw new Error('SELF_CHECK_FAILED: pdfPayload not persisted correctly');
    }
    
    logStage('SELF_CHECK_PASSED', {
      clausesTotal: verifyPayload.clause_ledger.length,
      issuesCount: verifyPayload.flags?.length || 0,
      hasFallback: verifyPayload.fallback || false
    });

    return Response.json({
      success: true,
      result: {
        risk_score: finalPdfPayload.risk_score,
        summary: finalPdfPayload.summary,
        clauses_extracted,
        clause_ledger: finalPdfPayload.clause_ledger,
        issues_validated: finalPdfPayload.flags || [],
        property_address: keyTerms.property_address,
        start_date: keyTerms.start_date,
        end_date: keyTerms.end_date,
        rent_amount: keyTerms.rent_amount,
        deposit_amount: keyTerms.deposit_amount,
        language_detected: keyTerms.language_detected,
        canonical_status: finalStatus,
        has_pdf_payload: true
      },
      diagnostic: { 
        scanId, 
        requestId,
        totalDuration: Date.now() - startTime,
        pipelineSteps: pipeline.length,
        canonicalStatus: finalStatus
      }
    });

  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return err(req, 'UNAUTHORIZED', 'Unauthorized', 401, requestId);
    }
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      return Response.json({ 
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: error.retryAfter
      }, { status: 429 });
    }
    
    console.error('[SCAN_ERROR]', { error: error.message, stack: error.stack?.substring(0, 200) });
    
    return Response.json({ 
      success: false,
      error: 'Scan failed. Please try again.',
      details: error.message,
      diagnostic: {
        scanId,
        requestId,
        errorCategory: 'ANALYSIS_ERROR',
        duration: Date.now() - startTime
      }
    }, { status: 500 });
  }
});