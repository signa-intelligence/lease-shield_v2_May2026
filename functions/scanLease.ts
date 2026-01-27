import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Wrapper function that calls analyzeLease.
 * This maintains backward compatibility while using the new PDF-capable analyzer.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Auth check
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fileUrls, leaseId, language } = body;
    
    if (!fileUrls || fileUrls.length === 0) {
      return Response.json({ error: 'No file URLs provided' }, { status: 400 });
    }

    console.log('[SCAN_LEASE_WRAPPER] Redirecting to analyzeLease', {
      userId: user.email,
      fileCount: fileUrls.length,
      leaseId
    });

    // Call analyzeLease function with the first file URL
    const analyzeResponse = await base44.functions.invoke('analyzeLease', {
      fileUrl: fileUrls[0],
      leaseId: leaseId,
      language: language || 'en'
    });

    const analyzeResult = analyzeResponse?.data;

    if (!analyzeResult?.ok) {
      console.error('[SCAN_LEASE_WRAPPER] analyzeLease failed', analyzeResult);
      return Response.json({
        success: false,
        error: analyzeResult?.message || 'Analysis failed',
        details: analyzeResult
      }, { status: 500 });
    }

    console.log('[SCAN_LEASE_WRAPPER] Analysis complete', {
      scanId: analyzeResult.scanId,
      clausesCount: analyzeResult.scan_full?.clauses?.length || 0,
      riskScore: analyzeResult.scan_full?.risk_score
    });

    // ✅ CRITICAL FIX: Populate Property Tracker from scan results
    console.log('[SCAN_LEASE_WRAPPER] Invoking populateFromScan...');
    try {
      const populateResponse = await base44.functions.invoke('populateFromScan', {
        scanId: analyzeResult.scanId,
        leaseId: leaseId,
        scan_full: analyzeResult.scan_full,
        userEmail: user.email
      });
      console.log('[SCAN_LEASE_WRAPPER] populateFromScan complete:', populateResponse?.data);
    } catch (populateErr) {
      console.error('[SCAN_LEASE_WRAPPER] populateFromScan failed:', populateErr);
      // Don't fail the entire scan - populate errors are non-critical
    }

    // Transform to legacy format for backward compatibility
    return Response.json({
      success: true,
      result: {
        risk_score: analyzeResult.scan_full?.risk_score || 0,
        summary: analyzeResult.scan_full?.summary?.executive_summary || '',
        flags: (analyzeResult.scan_full?.clauses || [])
          .filter(c => c.risk_level !== 'none')
          .map(c => ({
            title: c.canonical_name,
            severity: c.risk_level,
            category: c.canonical_name,
            description: c.explanation,
            evidence: c.clause_text,
            explanation: c.explanation,
            recommendation: c.recommended_action
          })),
        property_address: analyzeResult.scan_full?.key_terms?.property_address || '',
        start_date: analyzeResult.scan_full?.key_terms?.start_date || '',
        end_date: analyzeResult.scan_full?.key_terms?.end_date || '',
        rent_amount: analyzeResult.scan_full?.key_terms?.rent_amount || 0,
        deposit_amount: analyzeResult.scan_full?.key_terms?.deposit_amount || 0,
        language_detected: language || 'en',
        notice_period_days: analyzeResult.scan_full?.key_terms?.notice_period_days || 0
      }
    });

  } catch (error) {
    console.error('[SCAN_LEASE_WRAPPER] Error:', error);
    
    return Response.json({ 
      success: false,
      error: 'Failed to analyze lease',
      details: error.message 
    }, { status: 500 });
  }
});