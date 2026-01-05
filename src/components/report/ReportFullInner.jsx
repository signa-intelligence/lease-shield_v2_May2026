import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, Download, ExternalLink, FileText, Info, Loader2, RefreshCw, Wrench } from "lucide-react";
import ErrorPanel from "./ErrorPanel";

const SEVERITY_CONFIG = {
  none: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'NO RISK', icon: CheckCircle2 },
  low: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Low', icon: Info },
  medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Medium', icon: AlertTriangle },
  high: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'High', icon: AlertTriangle },
  critical: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Critical', icon: AlertCircle }
};

function defaultRecsFor(category) {
  const c = category || 'clause';
  return [
    `Request to narrow or clarify ${c} terms to tenant-favorable language`,
    `Add explicit safeguard for ${c} to prevent overbroad interpretation`
  ];
}

function getRiskLevel(score) {
  if ((score || 0) >= 70) return { level: 'high', label: 'HIGH RISK', color: '#EF4444', bg: '#FEE2E2' };
  if ((score || 0) >= 40) return { level: 'medium', label: 'MEDIUM RISK', color: '#F59E0B', bg: '#FEF3C7' };
  return { level: 'low', label: 'LOW RISK', color: '#10B981', bg: '#D1FAE5' };
}

export default function ReportFullInner({ scanId, leaseId, showDebug, forensicData }) {
  // ALL HOOKS UNCONDITIONAL - ALWAYS RUN
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbValidation, setDbValidation] = useState(null);
  const [loadSteps, setLoadSteps] = useState([]);
  const [user, setUser] = useState(null);
  const [lease, setLease] = useState(null);
  const [scan, setScan] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [materializing, setMaterializing] = useState(false);
  const materializeAttempted = useRef(false);

  // Effect #1: Fetch all data with WATCHDOG (ALWAYS RUNS, ALWAYS TERMINATES)
  useEffect(() => {
    let cancelled = false;
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
    const startTime = Date.now();
    const steps = [];
    
    const logStep = (step, data) => {
      const entry = { step, timestamp: Date.now() - startTime, ...data };
      steps.push(entry);
      console.log(`[${requestId}] ${step}:`, data);
      if (!cancelled) setLoadSteps(prev => [...prev, entry]);
    };

    // WATCHDOG: 15s timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`[${requestId}] WATCHDOG TIMEOUT at ${Date.now() - startTime}ms`);
      abortController.abort();
    }, 15000);
    
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        logStep('INIT', { scanId, leaseId, requestId });

        // STEP 1: Fetch user
        logStep('FETCH_USER_START', {});
        const userRes = await base44.auth.me();
        logStep('FETCH_USER_COMPLETE', { userId: userRes?.id });

        // STEP 2: Fetch lease
        logStep('FETCH_LEASE_START', { leaseId });
        const leaseArr = await base44.entities.Lease.filter({ id: leaseId });
        const leaseData = leaseArr?.[0] || null;
        logStep('FETCH_LEASE_COMPLETE', { found: !!leaseData });

        // STEP 3: Fetch scan
        logStep('FETCH_SCAN_START', { scanId });
        const scanArr = await base44.entities.LeaseScan.filter({ id: scanId });
        let scanData = scanArr?.[0] || null;
        logStep('FETCH_SCAN_COMPLETE', { found: !!scanData });

        // STEP 4: Validate records
        logStep('VALIDATE_RECORDS_START', {});
        
        const validation = {
          scanFound: !!scanData,
          leaseFound: !!leaseData,
          scanId,
          leaseId
        };

        if (!leaseData) {
          const err = new Error(`LEASE_NOT_FOUND: No lease record for ID ${leaseId}`);
          err.code = 'LEASE_NOT_FOUND';
          err.step = 'FETCH_LEASE';
          throw err;
        }

        if (!scanData) {
          const err = new Error(`SCAN_NOT_FOUND: No scan record for ID ${scanId}`);
          err.code = 'SCAN_NOT_FOUND';
          err.step = 'FETCH_SCAN';
          throw err;
        }

        // STEP 5: Validate materialized report (persisted in scan_full.canonical_report.pdfPayload)
        logStep('VALIDATE_REPORT_START', {});
        let canonical = scanData?.scan_full?.canonical_report || null;
        validation.hasCanonical = !!canonical;
        validation.reportStatus = canonical?.status || 'unknown';
        validation.hasClauseLedger = !!(canonical?.clause_ledger);
        validation.clauseLedgerLength = canonical?.clause_ledger?.length || 0;
        validation.hasPdfPayload = !!(canonical?.pdfPayload);
        validation.isFallback = canonical?.pdfPayload?.fallback || false;

        // Check if generator failed but has fallback
        if (canonical?.status === 'failed' && canonical?.pdfPayload) {
          logStep('USING_FALLBACK_PAYLOAD', { 
            reason: canonical.pdfPayload.fallback_reason,
            error: canonical.error 
          });
          // Continue with fallback - don't throw
        } else if (!canonical || !canonical.pdfPayload) {
          // ATTEMPT IDEMPOTENT MATERIALIZATION (ONCE)
          if (!materializeAttempted.current) {
            materializeAttempted.current = true;
            logStep('MATERIALIZE_ATTEMPT', { scanId });
            
            try {
              if (!cancelled) setMaterializing(true);
              
              let materializeResult = null;
              try {
                const response = await base44.functions.invoke('materializeReportV2', {
                  scanId,
                  requestId
                });
                materializeResult = response.data;
              } catch (invokeErr) {
                // Check if 404 deployment missing
                if (invokeErr?.response?.status === 404 || invokeErr?.message?.includes('404')) {
                  logStep('MATERIALIZE_404_DEPLOYMENT_MISSING', { error: invokeErr.message });
                  const deployErr = new Error('Report service not deployed. Please republish functions.');
                  deployErr.code = 'DEPLOYMENT_MISSING';
                  deployErr.step = 'MATERIALIZE';
                  throw deployErr;
                }
                throw invokeErr;
              }
              
              logStep('MATERIALIZE_RESULT', materializeResult);
              
              if (materializeResult?.ok) {
                // Re-fetch scan to get materialized data
                logStep('REFETCH_AFTER_MATERIALIZE', {});
                const refetchedScans = await base44.entities.LeaseScan.filter({ id: scanId });
                const refetchedScan = refetchedScans?.[0];
                
                if (refetchedScan) {
                  // Update scanData and canonical with refetched data
                  scanData = refetchedScan;
                  canonical = refetchedScan?.scan_full?.canonical_report || null;
                  validation.hasCanonical = !!canonical;
                  validation.hasPdfPayload = !!(canonical?.pdfPayload);
                  validation.isFallback = canonical?.pdfPayload?.fallback || materializeResult.fallback;
                  validation.materialized = true;
                  
                  logStep('REFETCH_SUCCESS', { 
                    hasPdfPayload: validation.hasPdfPayload,
                    isFallback: validation.isFallback
                  });
                }
              } else {
                // Materialization failed - throw with details
                const err = new Error(materializeResult?.message || 'Materialization failed');
                err.code = materializeResult?.error || 'MATERIALIZE_FAILED';
                err.step = 'MATERIALIZE';
                err.debugData = materializeResult;
                throw err;
              }
            } catch (matErr) {
              logStep('MATERIALIZE_ERROR', { error: matErr.message });
              const err = new Error(`Report materialization failed: ${matErr.message}`);
              err.code = matErr.code || 'MATERIALIZE_ERROR';
              err.step = 'MATERIALIZE';
              err.debugData = {
                hasCanonical: !!canonical,
                hasPdfPayload: !!(canonical?.pdfPayload),
                materializeError: matErr.message
              };
              throw err;
            } finally {
              if (!cancelled) setMaterializing(false);
            }
          } else {
            // Already attempted materialization, still no payload
            const err = new Error(`REPORT_NOT_MATERIALIZED: No pdfPayload after materialization attempt for scanId ${scanId}`);
            err.code = 'REPORT_NOT_MATERIALIZED';
            err.step = 'VALIDATE_REPORT';
            err.debugData = {
              hasCanonical: !!canonical,
              hasPdfPayload: !!(canonical?.pdfPayload),
              status: canonical?.status,
              error: canonical?.error,
              materializeAttempted: true
            };
            throw err;
          }
        }

        validation.issuesCount = canonical.pdfPayload?.flags?.length || 0;
        validation.clausesTotal = canonical.pdfPayload.clause_ledger?.length || 0;
        validation.clausesReviewed = canonical.clause_review?.length || 0;
        validation.riskScore = canonical.pdfPayload.risk_score || scanData.risk_score || 0;

        logStep('VALIDATE_REPORT_COMPLETE', validation);
        if (!cancelled) setDbValidation(validation);

        // STEP 6: Use pdfPayload directly (materialized at scan time)
        logStep('BUILD_REPORT_START', {});
        const pdfPayload = canonical.pdfPayload;
        const clauseReview = Array.isArray(pdfPayload.clause_review) ? pdfPayload.clause_review : [];
        const clauseLedger = Array.isArray(pdfPayload.clause_ledger) ? pdfPayload.clause_ledger : [];
        const flags = Array.isArray(pdfPayload.flags) ? pdfPayload.flags : [];
        const keyTerms = pdfPayload.key_terms || {};
        const mappings = Array.isArray(pdfPayload.mappings) ? pdfPayload.mappings : [];
        const missingClauses = Array.isArray(pdfPayload.missing_clauses) ? pdfPayload.missing_clauses : [];

        // Build unified issues
        const byClause = {};
        clauseReview.forEach(r => {
          if (!r.risk_level || r.risk_level === 'none') return;
          byClause[r.clause_id] = { review: r };
        });
        flags.forEach(f => {
          const key = f.clause_id || `flag-${f.pattern_id || f.title || Math.random()}`;
          if (!byClause[key]) byClause[key] = {};
          byClause[key].flag = f;
        });

        const unifiedIssuesRaw = Object.entries(byClause).map(([_, pair]) => {
          const r = pair.review;
          const f = pair.flag;
          const clause = clauseLedger.find(c => c.clause_id === (r?.clause_id || f?.clause_id));
          const severity = f?.severity || (r?.risk_level || 'medium');
          const category = f?.category || (r?.mapped_catalog_ids?.[0] ? r.mapped_catalog_ids[0] : 'clause');
          const title = f?.title || clause?.heading || (r?.risk_summary?.substring(0, 80) || 'Issue identified');
          const impact = f?.description || r?.risk_summary || 'Review required';
          const explanation = f?.explanation || r?.lawyer_view || r?.tenant_view || '';
          
          let recs = [];
          if (f?.recommendation) {
            recs = String(f.recommendation).split(/[\n•\-–]/g).map(s => s.trim()).filter(Boolean);
          } else {
            if (r?.recommended_change && r.recommended_change !== 'No change recommended') recs.push(r.recommended_change);
            if (r?.negotiation_tip && r.negotiation_tip !== 'Accept as standard.') recs.push(r.negotiation_tip);
          }
          while (recs.length < 2) {
            defaultRecsFor(category).forEach(x => { if (recs.length < 2) recs.push(x); });
          }
          
          let evidence = (f?.evidence || clause?.full_text || '').substring(0, 240);
          if (!evidence || evidence.length < 10) {
            evidence = `[Evidence not extracted for ${title}]`;
          }
          
          return {
            clause_id: r?.clause_id || f?.clause_id || `unknown-${Math.random().toString(36).slice(2,9)}`,
            category,
            severity,
            title,
            impact,
            explanation,
            recommendations: recs,
            evidence
          };
        });

        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        unifiedIssuesRaw.sort((a,b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));

        const seen = new Set();
        const unifiedIssues = unifiedIssuesRaw.filter(i => {
          const key = `${i.clause_id}::${i.severity}::${i.category}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const flagsForDisplay = unifiedIssues.map(i => ({
          severity: i.severity,
          category: i.category,
          title: i.title,
          description: i.impact,
          explanation: i.explanation,
          recommendation: i.recommendations.join('\n'),
          evidence: i.evidence,
          clause_id: i.clause_id
        }));

        const coverageSummary = canonical ? {
          total_clauses: clauseLedger.length,
          clauses_reviewed: clauseReview.length,
          clauses_flagged: clauseReview.filter(r => r.risk_level && r.risk_level !== 'none').length,
          unmapped_clauses: mappings.filter(m => Array.isArray(m.mapped_catalog_ids) && m.mapped_catalog_ids.includes('CAT-UNMAPPED')).length,
          missing_expected_categories: missingClauses.length,
          mapped_count: canonical?.summary?.mapped_count,
          mapped_pct: canonical?.summary?.mapped_pct
        } : null;

        const normalized = {
          lease_address: pdfPayload.lease_address || leaseData?.property_address || 'Lease Agreement',
          generated_date: pdfPayload.generated_date || new Date().toISOString(),
          risk_score: pdfPayload.risk_score || scanData?.risk_score || 0,
          summary: pdfPayload.summary || scanData?.summary || '',
          key_terms: keyTerms,
          flags: flagsForDisplay,
          clause_review: clauseReview,
          clause_ledger: clauseLedger,
          mappings,
          missing_clauses: missingClauses,
          coverage_summary: pdfPayload.coverage_summary || {},
          coverageSummary,
          isFallback: pdfPayload.fallback || false,
          fallbackReason: pdfPayload.fallback_reason
        };

        logStep('BUILD_REPORT_COMPLETE', {
          issuesCount: flagsForDisplay.length,
          clausesTotal: clauseLedger.length
        });

        if (!cancelled) {
          setUser(userRes);
          setLease(leaseData);
          setScan(scanData);
          setReportData(normalized);
          setLoading(false);
          setMaterializing(false);
          logStep('RENDER_SUCCESS', { totalElapsed: Date.now() - startTime });
        }
      } catch (err) {
        logStep('ERROR_CAUGHT', {
          step: err.step || 'UNKNOWN',
          code: err.code || 'UNKNOWN',
          message: err.message,
          elapsed: Date.now() - startTime
        });

        if (!cancelled) {
          const errorObj = {
            step: err.step || 'UNKNOWN',
            code: err.code || 'UNKNOWN',
            message: err.message || 'Failed to load report',
            stack: err.stack,
            requestId,
            scanId,
            leaseId,
            elapsedMs: Date.now() - startTime,
            debugData: err.debugData || {},
            steps
          };
          
          setError(errorObj);
          setLoading(false);
        }
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) {
          setLoading(false); // Guaranteed termination
        }
      }
    }

    loadData();
    return () => { 
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [scanId, leaseId]);

  // NO BACKFILL - Report is materialized at scan time
  // If report missing, user must re-run scan

  // Compute colors and language (NO HOOKS)
  const isDarkMode = user?.theme === 'dark';
  const language = user?.language || 'en';
  const colors = isDarkMode ? {
    bg: '#1A1D1F', cardBg: '#2A2D30', textPrimary: '#ECEFED', textSecondary: '#A8ABAD', borderColor: '#3A3D40'
  } : {
    bg: '#F8FAFC', cardBg: '#FFFFFF', textPrimary: '#1A1D1F', textSecondary: '#64748b', borderColor: '#E5E7EB'
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.access_level === 'admin' || user?.access_level === 'super_admin';

  // RENDERING (no hooks below)
  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#0C3B2E' }} />
          <p className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            {materializing ? 'Materializing report...' : 'Loading report...'}
          </p>
          {materializing && (
            <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <Wrench className="w-4 h-4" />
              <span>Building report from scan data</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorPanel error={error} colors={colors} />;
  }

  if (!user || !lease || !scan || !reportData) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <Card style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>Error Loading Report</h2>
              <p className="mb-6" style={{ color: colors.textSecondary }}>Failed to load report data.</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const riskLevel = getRiskLevel(reportData.risk_score);
  const totalClauses = (reportData.clause_ledger || []).length;
  const risksCount = (reportData.clause_review || []).filter(r => r.risk_level && r.risk_level !== 'none').length;

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const response = await base44.functions.invoke('generateLeaseReportPDF', {
        scanId,
        language
      });
      if (response?.data?.pdf_url) {
        window.open(response.data.pdf_url, '_blank');
      } else {
        alert('PDF generation failed.');
      }
    } catch (err) {
      alert('PDF export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExportingPdf(false);
    }
  };

  const t = {
    en: { allIssues: "Issues Requiring Attention", clauseAnalysis: "Clause-by-Clause Analysis", noIssues: "No issues found", property: "Property", summary: "Summary", exportPdf: "Export PDF", viewLease: "View Original Lease", clauseCoverage: "Clause Coverage" },
    th: { allIssues: "ปัญหาที่ต้องให้ความสนใจ", clauseAnalysis: "การวิเคราะห์ทีละข้อ", noIssues: "ไม่พบปัญหา", property: "ทรัพย์สิน", summary: "สรุป", exportPdf: "ส่งออก PDF", viewLease: "ดูสัญญาต้นฉบับ", clauseCoverage: "ความครอบคลุม" }
  };
  const strings = t[language] || t.en;

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg, paddingBottom: '100px' }}>
      <div className="max-w-4xl mx-auto">


        {showDebug && (
          <Card className="mb-4 border-2 border-emerald-500" style={{ backgroundColor: '#D1FAE5' }}>
            <CardContent className="p-4">
              <h3 className="font-bold text-emerald-800 mb-2">🔧 Forensic Debug Panel</h3>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs font-bold text-emerald-700 mb-1">URL INFO</div>
                  <div className="bg-white p-2 rounded text-xs font-mono">
                    <div>Path: {forensicData?.pathname || 'N/A'}</div>
                    <div>Search: {forensicData?.search || '(empty)'}</div>
                    <div>Editor: {String(forensicData?.isEditorPreview)}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-700 mb-1">PARAMS RESOLVED</div>
                  <div className="bg-white p-2 rounded text-xs font-mono">
                    <div>scanId: {scanId}</div>
                    <div>leaseId: {leaseId}</div>
                  </div>
                </div>
              </div>
              <div className="text-xs font-bold text-emerald-700 mb-1">DB VALIDATION</div>
              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
{dbValidation ? JSON.stringify(dbValidation, null, 2) : 'Loading...'}
              </pre>
              <div className="text-xs font-bold text-emerald-700 mb-1 mt-3">REPORT DATA</div>
              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
{`Risk Score: ${reportData.risk_score}
Total Clauses: ${totalClauses}
Risks: ${risksCount}
Flags: ${(reportData.flags || []).length}
Has PDF Payload: ${!!(scan?.scan_full?.canonical_report?.pdfPayload)}`}
              </pre>
              <div className="text-xs font-bold text-emerald-700 mb-1 mt-3">LOAD STEPS</div>
              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
{loadSteps.map(s => `[${s.timestamp}ms] ${s.step}`).join('\n')}
              </pre>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
          <Button onClick={handleExportPdf} disabled={exportingPdf} style={{ backgroundColor: '#0C3B2E', color: '#fff' }}>
            {exportingPdf ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>) : (<><Download className="w-4 h-4 mr-2" />{strings.exportPdf}</>)}
          </Button>
        </div>

        <Card className="border-none shadow-xl mb-6 overflow-hidden" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ backgroundColor: riskLevel.color }}>
            <div className="text-white">
              <CardTitle className="text-2xl font-bold mb-3">Full Lease Analysis Report</CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="text-2xl px-4 py-2 font-bold" style={{ backgroundColor: riskLevel.bg, color: riskLevel.color, border: `2px solid ${riskLevel.color}` }}>
                  {reportData.risk_score || 0}/100
                </Badge>
                <Badge className="text-lg px-4 py-2 font-bold" style={{ backgroundColor: '#FFFFFF', color: riskLevel.color }}>
                  {riskLevel.label}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {lease.property_address && (
              <div className="mb-4">
                <span className="text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.property}:</span>
                <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{lease.property_address}</p>
              </div>
            )}
            <div className="mb-4">
              <span className="text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.summary}:</span>
              <p className="mt-1" style={{ color: colors.textPrimary }}>{reportData.summary || 'No summary available.'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              {strings.allIssues} ({(reportData.flags || []).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(reportData.flags || []).length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <p style={{ color: colors.textSecondary }}>{strings.noIssues}</p>
              </div>
            ) : (
              (reportData.flags || []).map((flag, idx) => {
                const severityConfig = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.medium;
                const Icon = severityConfig.icon;
                const recText = String(flag.recommendation || '');
                const recLines = recText.split(/[\n•\-–]/g).map(s => s.trim()).filter(Boolean);
                return (
                  <div key={idx} className="p-4 rounded-xl border-2" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC', borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB' }}>
                    <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge className={`${severityConfig.color} border flex items-center gap-1`}>
                          <Icon className="w-3 h-3" />{severityConfig.label}
                        </Badge>
                        {flag.category && <Badge variant="outline">{flag.category}</Badge>}
                        {flag.clause_id && <Badge variant="outline">{flag.clause_id}</Badge>}
                      </div>
                    </div>
                    <h4 className="text-base font-bold mb-2" style={{ color: colors.textPrimary }}>{flag.title || flag.description}</h4>
                    {flag.description && flag.title && (<p className="text-sm mb-3" style={{ color: colors.textPrimary }}>{flag.description}</p>)}
                    <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6' }}>
                      <p className="text-xs font-bold text-gray-600 mb-1">Evidence:</p>
                      <p className="text-sm" style={{ color: colors.textPrimary }}>{flag.evidence}</p>
                    </div>
                    {flag.explanation && (
                      <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FEF3C7' }}>
                        <p className="text-xs font-bold text-amber-700 mb-1">Why this matters:</p>
                        <p className="text-sm" style={{ color: colors.textPrimary }}>{flag.explanation}</p>
                      </div>
                    )}
                    {recLines.length > 0 && (
                      <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#ECFDF5' }}>
                        <p className="text-xs font-bold text-emerald-700 mb-2">Recommendations:</p>
                        <ul className="space-y-1">
                          {recLines.map((line, i) => (
                            <li key={i} className="text-sm flex items-start gap-2" style={{ color: colors.textPrimary }}>
                              <span className="text-emerald-600">•</span><span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-700" />
              {strings.clauseAnalysis} ({totalClauses})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(reportData.clause_ledger || []).map((c, idx) => {
              const review = (reportData.clause_review || []).find(r => r.clause_id === c.clause_id) || {};
              const isRisk = review.risk_level && review.risk_level !== 'none';
              const sev = isRisk ? (SEVERITY_CONFIG[review.risk_level] || SEVERITY_CONFIG.medium) : SEVERITY_CONFIG.none;
              const Icon = sev.icon;
              
              let snippet = (c.full_text || '').slice(0, 240);
              if (!snippet || snippet.length < 10) snippet = `[Snippet not extracted for ${c.heading || c.clause_id}]`;
              
              const recs = [];
              if (isRisk) {
                if (review?.recommended_change && review.recommended_change !== 'No change recommended') recs.push(review.recommended_change);
                if (review?.negotiation_tip && review.negotiation_tip !== 'Accept as standard.') recs.push(review.negotiation_tip);
                const cat = (Array.isArray(review.mapped_catalog_ids) ? review.mapped_catalog_ids[0] : review.category) || 'clause';
                while (recs.length < 2) defaultRecsFor(cat).forEach(x => { if (recs.length < 2) recs.push(x); });
              }

              return (
                <div key={c.clause_id || idx} className="p-4 rounded-xl border" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#FFFFFF', borderColor: colors.borderColor }}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge className={`${sev.color} border flex items-center gap-1`}>
                      <Icon className="w-3 h-3" />{isRisk ? (review.risk_level?.toUpperCase() + ' RISK') : 'NO RISK'}
                    </Badge>
                    {review?.mapped_catalog_ids?.[0] && <Badge variant="outline">{review.mapped_catalog_ids[0]}</Badge>}
                    {c.clause_id && <Badge variant="outline">{c.clause_id}</Badge>}
                  </div>
                  <h4 className="font-bold mb-2" style={{ color: colors.textPrimary }}>{c.heading || c.clause_id}</h4>
                  <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6' }}>
                    <p className="text-xs font-bold text-gray-600 mb-1">Snippet:</p>
                    <p className="text-sm" style={{ color: colors.textPrimary }}>{snippet}</p>
                  </div>
                  <div className="mb-1">
                    <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{isRisk ? 'Impact' : 'Rationale'}</p>
                    <p className="text-sm" style={{ color: colors.textPrimary }}>{review.risk_summary || (isRisk ? 'Review required' : (review.tenant_view || 'Accept as standard.'))}</p>
                  </div>
                  {isRisk && recs.length > 0 && (
                    <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#ECFDF5' }}>
                      <p className="text-xs font-bold text-emerald-700 mb-2">Recommendations:</p>
                      <ul className="space-y-1">
                        {recs.map((line, i) => (
                          <li key={i} className="text-sm flex items-start gap-2" style={{ color: colors.textPrimary }}>
                            <span className="text-emerald-600">•</span><span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {reportData.coverageSummary && (
          <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader>
              <CardTitle>{strings.clauseCoverage}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div><span className="font-semibold" style={{ color: colors.textSecondary }}>Total:</span> <span style={{ color: colors.textPrimary }}>{reportData.coverageSummary.total_clauses}</span></div>
                <div><span className="font-semibold" style={{ color: colors.textSecondary }}>Reviewed:</span> <span style={{ color: colors.textPrimary }}>{reportData.coverageSummary.clauses_reviewed}</span></div>
                <div><span className="font-semibold" style={{ color: colors.textSecondary }}>Flagged:</span> <span style={{ color: colors.textPrimary }}>{reportData.coverageSummary.clauses_flagged}</span></div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {lease.file_url && (
            <Button variant="outline" onClick={() => window.open(lease.file_url, '_blank')} className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />{strings.viewLease}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}