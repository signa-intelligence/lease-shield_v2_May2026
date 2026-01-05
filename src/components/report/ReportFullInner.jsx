import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, Download, ExternalLink, FileText, Info, Loader2, RefreshCw } from "lucide-react";

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

export default function ReportFullInner({ scanId, leaseId }) {
  // Unconditional hooks
  const [state, setState] = React.useState({
    user: null,
    lease: null,
    scan: null,
    loading: true,
    error: null,
    reportData: null,
  });
  const [exportingPdf, setExportingPdf] = React.useState(false);
  const [backfillError, setBackfillError] = React.useState(null);
  const backfillAttemptedRef = React.useRef(new Set());
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Effect #1: fetch + normalize
  React.useEffect(() => {
    let isCancelled = false;
    async function fetchAll() {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const user = await base44.auth.me();
        const leaseArr = await base44.entities.Lease.filter({ id: leaseId });
        const scanArr = await base44.entities.LeaseScan.filter({ id: scanId });
        const lease = leaseArr?.[0] || null;
        const scan = scanArr?.[0] || null;

        // Build normalized reportData
        const canonical = scan?.scan_full?.canonical_report || null;
        const clauseReview = canonical?.clause_review || [];
        const clauseLedger = canonical?.clause_ledger || [];
        const flags = scan?.flags || scan?.scan_full?.flags || [];
        const keyTerms = scan?.scan_full?.key_terms || {};
        const mappings = canonical?.mappings || [];
        const missingClauses = canonical?.missing_clauses || [];

        // Unify risks
        const unifiedIssuesRaw = (() => {
          const byClause = {};
          const reviews = Array.isArray(clauseReview) ? clauseReview : [];
          const ledger = Array.isArray(clauseLedger) ? clauseLedger : [];
          const fl = Array.isArray(flags) ? flags : [];

          reviews.forEach(r => {
            if (!r.risk_level || r.risk_level === 'none') return;
            byClause[r.clause_id] = { review: r };
          });
          fl.forEach(f => {
            const key = f.clause_id || `flag-${f.pattern_id || f.title || Math.random()}`;
            if (!byClause[key]) byClause[key] = {};
            byClause[key].flag = f;
          });

          const list = Object.entries(byClause).map(([_, pair]) => {
            const r = pair.review;
            const f = pair.flag;
            const clause = ledger.find(c => c.clause_id === (r?.clause_id || f?.clause_id));
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
            if (!evidence || evidence.length < 10) evidence = `[Evidence not extracted for ${title}]`;
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
          list.sort((a,b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));
          return list;
        })();
        const seen = new Set();
        const unifiedIssues = unifiedIssuesRaw.filter(i => {
          const key = `${i.clause_id}::${i.severity}::${i.category}`;
          if (seen.has(key)) return false; seen.add(key); return true;
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
          unmapped_clauses: (canonical?.mappings || []).filter(m => Array.isArray(m.mapped_catalog_ids) && m.mapped_catalog_ids.includes('CAT-UNMAPPED')).length,
          missing_expected_categories: (canonical?.missing_clauses || []).length,
          mapped_count: canonical?.summary?.mapped_count,
          mapped_pct: canonical?.summary?.mapped_pct
        } : null;

        const reportData = {
          lease_address: lease?.property_address || 'Lease Agreement',
          generated_date: new Date().toISOString(),
          risk_score: scan?.risk_score || canonical?.risk_score || 0,
          summary: scan?.summary || '',
          key_terms: keyTerms,
          flags: flagsForDisplay,
          clause_review: clauseReview,
          clause_ledger: clauseLedger,
          mappings,
          missing_clauses: missingClauses,
          coverage_summary: canonical?.summary || scan?.scan_full?.coverage_summary || {},
        };

        if (!isCancelled) {
          setState({ user, lease, scan, loading: false, error: null, reportData, coverageSummary });
        }
      } catch (err) {
        if (!isCancelled) setState(prev => ({ ...prev, loading: false, error: err?.message || 'Failed to load data' }));
      }
    }
    fetchAll();
    return () => { isCancelled = true; };
  }, [scanId, leaseId, refreshKey]);

  // Effect #2: one-shot backfill only if ledger empty
  React.useEffect(() => {
    const key = `${scanId}:${leaseId}`;
    const clauseLedger = state?.reportData?.clause_ledger || [];
    if (!clauseLedger || clauseLedger.length > 0) return;
    if (backfillAttemptedRef.current.has(key)) return;
    backfillAttemptedRef.current.add(key);
    const files = (Array.isArray(state.lease?.file_urls) && state.lease.file_urls.length) ? state.lease.file_urls : (state.lease?.file_url ? [state.lease.file_url] : []);
    base44.functions.invoke('syncScanClauseLedger', { scanId, leaseId, fileUrls: files })
      .then((res) => {
        if (res?.data?.status === 'ok') {
          // re-fetch data instead of reloading
          setRefreshKey(v => v + 1);
        } else if (res?.data?.status === 'error' && res?.data?.code === 'deploymentNotFound') {
          setBackfillError('Ledger generator not deployed. Publish backend functions (clauseLedgerScan) and retry.');
        }
      })
      .catch(err => {
        const msg = err?.response?.data?.error || err?.message || String(err);
        const code = err?.response?.data?.code || '';
        if (msg.includes('deploymentNotFound') || code === 'deploymentNotFound') {
          setBackfillError('Ledger generator not deployed. Publish backend functions (clauseLedgerScan) and retry.');
        } else {
          setBackfillError('Failed to generate ledger. Please try again later.');
        }
      });
  }, [scanId, leaseId, state?.reportData?.clause_ledger, state.lease]);

  const isDarkMode = state.user?.theme === 'dark';
  const colors = isDarkMode ? {
    bg: '#1A1D1F', cardBg: '#2A2D30', textPrimary: '#ECEFED', textSecondary: '#A8ABAD', borderColor: '#3A3D40'
  } : {
    bg: '#F8FAFC', cardBg: '#FFFFFF', textPrimary: '#1A1D1F', textSecondary: '#64748b', borderColor: '#E5E7EB'
  };

  // Rendering (no hooks below)
  if (state.loading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#0C3B2E' }} />
          <p className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Loading report...</p>
        </div>
      </div>
    );
  }

  if (state.error || !state.user || !state.lease || !state.scan) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <Card style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>Error Loading Report</h2>
              <p className="mb-6" style={{ color: colors.textSecondary }}>{state.error || 'Failed to load report data.'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const lease = state.lease; const reportData = state.reportData || {};
  const riskLevel = getRiskLevel(reportData.risk_score);
  const totalClauses = (reportData.clause_ledger || []).length;
  const risksCount = (reportData.clause_review || []).filter(r => r.risk_level && r.risk_level !== 'none').length;

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const response = await base44.functions.invoke('generateLeaseReportPDF', {
        scanData: reportData,
        language: state.user?.language || 'en'
      });
      if (response?.data?.pdf_url) {
        window.open(response.data.pdf_url, '_blank');
      } else {
        alert('PDF generation failed. Please try again.');
      }
    } catch (err) {
      alert('PDF export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg, paddingBottom: '100px' }}>
      <div className="max-w-4xl mx-auto">
        {backfillError && (
          <Card className="mb-4 border-2 border-red-500" style={{ backgroundColor: '#FEE2E2' }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-800 mb-1">Ledger Generation Failed</h3>
                  <p className="text-sm text-red-700 mb-3">{backfillError}</p>
                  <Button variant="outline" size="sm" onClick={() => { setBackfillError(null); setRefreshKey(v => v + 1); }}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Retry Backfill
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button onClick={handleExportPdf} disabled={exportingPdf} style={{ backgroundColor: '#0C3B2E', color: '#fff' }}>
            {exportingPdf ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>) : (<><Download className="w-4 h-4 mr-2" />Export PDF</>)}
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
                <span className="text-sm font-semibold" style={{ color: colors.textSecondary }}>Property:</span>
                <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{lease.property_address}</p>
              </div>
            )}
            <div className="mb-4">
              <span className="text-sm font-semibold" style={{ color: colors.textSecondary }}>Summary:</span>
              <p className="mt-1" style={{ color: colors.textPrimary }}>{reportData.summary || 'No summary available.'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              Issues Requiring Attention ({(reportData.flags || []).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(reportData.flags || []).length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <p style={{ color: colors.textSecondary }}>No issues found in this lease.</p>
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
                      <p className="text-sm" style={{ color: colors.textPrimary }}>{flag.evidence || `[Evidence not extracted for ${flag.title || 'issue'}]`}</p>
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
              Clause-by-Clause Analysis ({totalClauses})
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
                    <Badge className={`${sev.color} border flex items-center gap-1`}><Icon className="w-3 h-3" />{isRisk ? (review.risk_level?.toUpperCase() + ' RISK') : 'NO RISK'}</Badge>
                    {review?.mapped_catalog_ids?.[0] && <Badge variant="outline">{review.mapped_catalog_ids[0]}</Badge>}
                    {c.clause_id && <Badge variant="outline">{c.clause_id}</Badge>}
                  </div>
                  <h4 className="font-bold mb-2" style={{ color: colors.textPrimary }}>{c.heading || c.clause_id}</h4>
                  <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6' }}>
                    <p className="text-xs font-bold text-gray-600 mb-1">Snippet:</p>
                    <p className="text-sm" style={{ color: colors.textPrimary }}>{snippet}</p>
                  </div>
                  <div className="mb-1">
                    <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{isRisk ? 'Impact / Rationale' : 'Rationale'}</p>
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

        {state.coverageSummary && (
          <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader>
              <CardTitle>Clause Coverage — 92 standard clause categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div><span className="font-semibold" style={{ color: colors.textSecondary }}>Total Clauses:</span> <span style={{ color: colors.textPrimary }}>{state.coverageSummary.total_clauses}</span></div>
                <div><span className="font-semibold" style={{ color: colors.textSecondary }}>Reviewed:</span> <span style={{ color: colors.textPrimary }}>{state.coverageSummary.clauses_reviewed}</span></div>
                <div><span className="font-semibold" style={{ color: colors.textSecondary }}>Flagged:</span> <span style={{ color: colors.textPrimary }}>{state.coverageSummary.clauses_flagged}</span></div>
                <div><span className="font-semibold" style={{ color: colors.textSecondary }}>Unmapped:</span> <span style={{ color: colors.textPrimary }}>{state.coverageSummary.unmapped_clauses}</span></div>
                <div><span className="font-semibold" style={{ color: colors.textSecondary }}>Missing Categories:</span> <span style={{ color: colors.textPrimary }}>{state.coverageSummary.missing_expected_categories}</span></div>
                {typeof state.coverageSummary.mapped_pct === 'number' && (
                  <div><span className="font-semibold" style={{ color: colors.textSecondary }}>Coverage:</span> <span style={{ color: colors.textPrimary }}>{state.coverageSummary.mapped_pct}%</span></div>
                )}
              </div>
              {typeof state.coverageSummary.mapped_pct === 'number' && state.coverageSummary.mapped_pct !== 100 && (
                <div className="mt-3 p-3 rounded" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FEF3C7', color: '#92400E' }}>
                  Rescan required – taxonomy coverage incomplete.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {lease.file_url && (
            <Button variant="outline" onClick={() => window.open(lease.file_url, '_blank')} className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />View Original Lease
            </Button>
          )}
          <Button onClick={handleExportPdf} style={{ backgroundColor: '#0C3B2E', color: '#fff' }} className="flex-1">
            <FileText className="w-4 h-4 mr-2" />Export PDF
          </Button>
        </div>
      </div>
    </div>
  );
}