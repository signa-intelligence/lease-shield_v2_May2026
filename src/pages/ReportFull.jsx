import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Info,
  AlertCircle,
  FileText,
  ArrowLeft,
  ExternalLink,
  Download,
  Loader2,
  RefreshCw
} from "lucide-react";
import AuthGuard from "../components/shared/AuthGuard";
import { haptic } from "../components/shared/HapticFeedback";
// Removed: ClauseCoverageTable, NegotiationPlan, RecommendationCard - using direct flags rendering

const SEVERITY_CONFIG = {
  none: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'NO RISK', icon: CheckCircle2 },
  low: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Low', icon: Info },
  medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Medium', icon: AlertTriangle },
  high: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'High', icon: AlertTriangle },
  critical: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Critical', icon: AlertCircle }
};

function ReportFullContent() {
        const navigate = useNavigate();
        const [exportingPdf, setExportingPdf] = useState(false);
        const didBackfillRef = useRef(false);

        // CRITICAL: Refs to prevent infinite loops
        const renderCountRef = useRef(0);
        renderCountRef.current += 1;

        // Parse URL params once
        const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
        const scanId = urlParams.get('scanId');
        const leaseId = urlParams.get('leaseId');
        const showDebug = urlParams.get('debug') === '1';

        // Fetch user
        const { data: user, isLoading: userLoading, error: userError } = useQuery({
          queryKey: ['currentUser'],
          queryFn: () => base44.auth.me(),
          retry: false,
          staleTime: 60000
        });

        // Fetch lease
        const { data: leaseData, isLoading: leaseLoading, error: leaseError } = useQuery({
          queryKey: ['lease', leaseId],
          queryFn: async () => {
            const results = await base44.entities.Lease.filter({ id: leaseId });
            return results?.[0] || null;
          },
          enabled: !!leaseId && !!user,
          retry: false,
          staleTime: 60000
        });

        // Fetch scan
        const { data: scanData, isLoading: scanLoading, error: scanError } = useQuery({
          queryKey: ['scan', scanId],
          queryFn: async () => {
            const results = await base44.entities.LeaseScan.filter({ id: scanId });
            return results?.[0] || null;
          },
          enabled: !!scanId && !!user,
          retry: false,
          staleTime: 60000
        });

        const isDarkMode = user?.theme === 'dark';
        const language = user?.language || 'en';

        const colors = isDarkMode ? {
          bg: '#1A1D1F',
          cardBg: '#2A2D30',
          textPrimary: '#ECEFED',
          textSecondary: '#A8ABAD',
          borderColor: '#3A3D40'
        } : {
          bg: '#F8FAFC',
          cardBg: '#FFFFFF',
          textPrimary: '#1A1D1F',
          textSecondary: '#64748b',
          borderColor: '#E5E7EB'
        };

        const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || 
                        user?.access_level === 'admin' || user?.access_level === 'super_admin';
        const userTier = (user?.plan_tier || 'free').toLowerCase();
        const canExportPdf = userTier !== 'free';

        // Error page renderer
        const renderErrorPage = (title, message, showRetry = true) => (
          <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
            <div className="max-w-4xl mx-auto">
              <Card style={{ backgroundColor: colors.cardBg }}>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                  <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>{title}</h2>
                  <p className="mb-6" style={{ color: colors.textSecondary }}>{message}</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {showRetry && (
                      <Button variant="outline" onClick={() => window.location.reload()}>
                        <RefreshCw className="w-4 h-4 mr-2" />Retry
                      </Button>
                    )}
                    <Button onClick={() => navigate('/UploadScan')} style={{ backgroundColor: '#0C3B2E', color: '#fff' }}>
                      <ArrowLeft className="w-4 h-4 mr-2" />Back to Scans
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

        // State checks
        if (!scanId || !leaseId) {
          return renderErrorPage('Missing Parameters', 'This report requires both scanId and leaseId parameters.', false);
        }

        const isLoading = userLoading || leaseLoading || scanLoading;
        if (isLoading) {
          return (
            <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
              <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#0C3B2E' }} />
                <p className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Loading report...</p>
              </div>
            </div>
          );
        }

        if (userError || !user) return renderErrorPage('Authentication Required', 'Please log in to view this report.', false);
        if (leaseError || scanError) return renderErrorPage('Error Loading Report', 'Failed to load report data.', true);
        if (!leaseData || !scanData) return renderErrorPage('Report Not Found', 'The requested lease scan could not be found.', false);

        // === SUCCESS: Build single source of truth ===
        const lease = leaseData;
        const scan = scanData;
        const canonical = scan.scan_full?.canonical_report || null;
        const clauseReview = canonical?.clause_review || [];
        const clauseLedger = canonical?.clause_ledger || [];
        const flags = scan.flags || scan.scan_full?.flags || [];
        const keyTerms = scan.scan_full?.key_terms || {};
        const mappings = canonical?.mappings || [];
        const missingClauses = canonical?.missing_clauses || [];
        const coverageSummary = canonical ? {
          total_clauses: clauseLedger.length,
          clauses_reviewed: clauseReview.length,
          clauses_flagged: clauseReview.filter(r => r.risk_level && r.risk_level !== 'none').length,
          unmapped_clauses: mappings.filter(m => Array.isArray(m.mapped_catalog_ids) && m.mapped_catalog_ids.includes('CAT-UNMAPPED')).length,
          missing_expected_categories: missingClauses.length,
          mapped_count: canonical?.summary?.mapped_count,
          mapped_pct: canonical?.summary?.mapped_pct
        } : null;

        // One-time backfill if clause ledger missing/partial
        useEffect(() => {
          const ledgerLen = clauseLedger?.length || 0;
          if (didBackfillRef.current) return;
          if (ledgerLen < 80) {
            didBackfillRef.current = true;
            const files = (lease?.file_urls && lease.file_urls.length) ? lease.file_urls : (lease?.file_url ? [lease.file_url] : []);
            base44.functions.invoke('syncScanClauseLedger', {
              scanId,
              lease_id: leaseId,
              file_urls: files
            }).then(() => {
              // Simple refresh to load backfilled data; guarded so no loops
              setTimeout(() => window.location.reload(), 800);
            }).catch(err => console.error('[ReportFull] backfill error', err));
          }
        }, [clauseLedger?.length, lease?.file_url, lease?.file_urls, scanId, leaseId]);

        // Unify risks from flags + reviews
        const unifiedIssuesRaw = useMemo(() => {
          const byClause = {};
          clauseReview.forEach(r => {
            if (!r.risk_level || r.risk_level === 'none') return;
            byClause[r.clause_id] = { review: r };
          });
          const fl = Array.isArray(flags) ? flags : [];
          fl.forEach(f => {
            const key = f.clause_id || `flag-${f.pattern_id || f.title || Math.random()}`;
            if (!byClause[key]) byClause[key] = {};
            byClause[key].flag = f;
          });
          const list = Object.entries(byClause).map(([_, pair]) => {
            const r = pair.review;
            const f = pair.flag;
            const clause = clauseLedger.find(c => c.clause_id === (r?.clause_id || f?.clause_id));
            const severity = f?.severity || (r?.risk_level || 'medium');
            const category = f?.category || (r?.mapped_catalog_ids?.[0] ? r.mapped_catalog_ids[0] : undefined);
            const title = f?.title || clause?.heading || (r?.risk_summary?.substring(0, 80) || 'Issue');
            const impact = f?.description || r?.risk_summary || '';
            const explanation = f?.explanation || r?.lawyer_view || r?.tenant_view || '';
            let recs = [];
            if (f?.recommendation) {
              recs = String(f.recommendation).split(/[\n•\-–]/g).map(s => s.trim()).filter(Boolean);
            } else {
              if (r?.recommended_change && r.recommended_change !== 'No change recommended') recs.push(r.recommended_change);
              if (r?.negotiation_tip && r.negotiation_tip !== 'Accept as standard.') recs.push(r.negotiation_tip);
            }
            if (recs.length === 0) recs = ['INCOMPLETE: insufficient clause text to generate specific recommendations'];
            const evidence = (f?.evidence || clause?.full_text || '').substring(0, 240);
            const hasSupport = Boolean(evidence?.length || r?.clause_id || f?.missing_safeguard);
            return {
              status: hasSupport ? 'VALID' : 'INVALID',
              clause_id: r?.clause_id || f?.clause_id,
              category,
              severity,
              title,
              impact,
              explanation,
              recommendations: recs,
              evidence
            };
          }).filter(i => i.status === 'VALID');
          const order = { critical: 0, high: 1, medium: 2, low: 3 };
          list.sort((a,b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));
          return list;
        }, [clauseReview, clauseLedger, flags]);

        // Deduplicate risks (same title + evidence)
        const unifiedIssues = useMemo(() => {
          const seen = new Set();
          return unifiedIssuesRaw.filter(i => {
            const key = `${(i.title||'').trim()}::${(i.evidence||'').trim()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }, [unifiedIssuesRaw]);

        // Index risks by clause for enrichment
        const issuesByClauseId = useMemo(() => {
          const map = new Map();
          unifiedIssues.forEach(i => { if (i.clause_id) map.set(i.clause_id, i); });
          return map;
        }, [unifiedIssues]);

        // Clause-by-clause entries (risk + non-risk)
        const clauseEntries = useMemo(() => {
          return (clauseLedger || []).map(c => {
            const r = clauseReview.find(x => x.clause_id === c.clause_id) || {};
            const riskLevel = r.risk_level || 'none';
            const isRisk = riskLevel !== 'none';
            let recs = [];
            if (isRisk) {
              if (r?.recommended_change && r.recommended_change !== 'No change recommended') recs.push(r.recommended_change);
              if (r?.negotiation_tip && r.negotiation_tip !== 'Accept as standard.') recs.push(r.negotiation_tip);
              if (recs.length === 0) {
                const fromIssue = issuesByClauseId.get(c.clause_id);
                if (fromIssue?.recommendations?.length) recs = fromIssue.recommendations;
              }
            }
            let snippet = (c.full_text || '').slice(0, 240);
            if (!snippet) {
              const fromIssue = issuesByClauseId.get(c.clause_id);
              if (fromIssue?.evidence) snippet = fromIssue.evidence;
            }
            const rationale = r.risk_summary || (isRisk ? '' : (r.tenant_view || 'Accept as standard.'));
            return {
              clause_id: c.clause_id,
              heading: c.heading,
              snippet,
              risk_level: riskLevel,
              category: (r.mapped_catalog_ids?.[0]) || undefined,
              recommendations: recs,
              rationale,
              isRisk
            };
          });
        }, [clauseLedger, clauseReview, issuesByClauseId]);

        // Counts for debug + acceptance
        const totalClauses = clauseEntries.length;
        const risksCount = clauseEntries.filter(e => e.isRisk).length;
        const nonRisksCount = totalClauses - risksCount;
        const pdfEntriesCount = totalClauses;

        // Flatten risks for display
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

        // Single source for UI + PDF
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
          taxonomy_report: scan?.scan_full?.taxonomy_report || [],
          missing_items: scan?.scan_full?.missing_items || []
        };

        // Export PDF handler (uses the same reportData)
        const handleExportPdf = async () => {
          if (!canExportPdf || exportingPdf) return;
          setExportingPdf(true);
          haptic.medium();
          try {
            const response = await base44.functions.invoke('generateLeaseReportPDF', {
              scanData: reportData,
              language
            });
            if (response?.data?.pdf_url) {
              window.open(response.data.pdf_url, '_blank');
            } else {
              alert('PDF generation failed. Please try again.');
            }
          } catch (err) {
            console.error('[ReportFull] PDF export error:', err);
            alert('PDF export failed: ' + (err.message || 'Unknown error'));
          } finally {
            setExportingPdf(false);
          }
        };

        const getRiskLevel = (score) => {
          if (score >= 70) return { level: 'high', label: 'HIGH RISK', color: '#EF4444', bg: '#FEE2E2' };
          if (score >= 40) return { level: 'medium', label: 'MEDIUM RISK', color: '#F59E0B', bg: '#FEF3C7' };
          return { level: 'low', label: 'LOW RISK', color: '#10B981', bg: '#D1FAE5' };
        };
        const riskLevel = getRiskLevel(reportData.risk_score);

        const t = {
          en: {
            fullReport: "Full Lease Analysis Report",
            property: "Property",
            summary: "Summary",
            riskScore: "Risk Score",
            allIssues: "Issues Requiring Attention",
            clauseAnalysis: "Clause-by-Clause Analysis",
            showAllClauses: "Show All Clauses",
            hideOkClauses: "Hide OK Clauses",

            exportPdf: "Export PDF",
            upgradeForPdf: "Upgrade for PDF",
            viewLease: "View Original Lease",
            viewTemplates: "View Letter Templates",
            keyTerms: "Key Lease Terms",
            monthlyRent: "Monthly Rent",
            deposit: "Security Deposit",
            leasePeriod: "Lease Period",
            noIssues: "No issues found in this lease.",
            clauseCoverage: "Clause Coverage",
            coverageSubtitle: "92 standard clause categories"
          },
          th: {
            fullReport: "รายงานวิเคราะห์สัญญาเช่าฉบับเต็ม",
            property: "ทรัพย์สิน",
            summary: "สรุป",
            riskScore: "คะแนนความเสี่ยง",
            allIssues: "ปัญหาที่ต้องให้ความสนใจ",
            clauseAnalysis: "การวิเคราะห์ทีละข้อ",
            showAllClauses: "แสดงข้อกำหนดทั้งหมด",
            hideOkClauses: "ซ่อนข้อกำหนดที่ปลอดภัย",

            exportPdf: "ส่งออก PDF",
            upgradeForPdf: "อัปเกรดเพื่อ PDF",
            viewLease: "ดูสัญญาเช่าต้นฉบับ",
            viewTemplates: "ดูเทมเพลตจดหมาย",
            keyTerms: "ข้อกำหนดสำคัญ",
            monthlyRent: "ค่าเช่ารายเดือน",
            deposit: "เงินมัดจำ",
            leasePeriod: "ระยะเวลาเช่า",
            noIssues: "ไม่พบปัญหาในสัญญานี้",
            clauseCoverage: "ความครอบคลุมข้อกำหนด",
            coverageSubtitle: "หมวดหมู่ข้อกำหนดมาตรฐาน 92 ข้อ"
          }
        };
        const strings = t[language] || t.en;

        return (
          <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg, paddingBottom: '100px' }}>
            <div className="max-w-4xl mx-auto">
              {/* Debug Panel */}
              {showDebug && isAdmin && (
                <Card className="mb-4 border-2 border-emerald-500" style={{ backgroundColor: '#D1FAE5' }}>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-emerald-800 mb-2">🔧 Debug Panel</h3>
                    <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
{`✅ Report loaded
Scan: ${scan.id} | Lease: ${lease.id}
Risk Score: ${reportData.risk_score}
Total Clauses: ${totalClauses}
Risks: ${risksCount}
Non-Risks: ${nonRisksCount}
PDF Entries: ${pdfEntriesCount}`}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Back Button + Export */}
              <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={() => { haptic.light(); navigate(-1); }}>
                  <ArrowLeft className="w-4 h-4 mr-2" />Back
                </Button>
                <Button
                  onClick={canExportPdf ? handleExportPdf : () => navigate('/Account#plans')}
                  disabled={exportingPdf}
                  style={{ backgroundColor: '#0C3B2E', color: '#fff' }}
                >
                  {exportingPdf ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" />{canExportPdf ? strings.exportPdf : strings.upgradeForPdf}</>
                  )}
                </Button>
              </div>

              {/* Header Card with Risk Score */}
              <Card className="border-none shadow-xl mb-6 overflow-hidden" style={{ backgroundColor: colors.cardBg }}>
                <CardHeader style={{ backgroundColor: riskLevel.color }}>
                  <div className="text-white">
                    <CardTitle className="text-2xl font-bold mb-3">{strings.fullReport}</CardTitle>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className="text-2xl px-4 py-2 font-bold" style={{
                        backgroundColor: riskLevel.bg,
                        color: riskLevel.color,
                        border: `2px solid ${riskLevel.color}`
                      }}>
                        {reportData.risk_score || 0}/100
                      </Badge>
                      <Badge className="text-lg px-4 py-2 font-bold" style={{ backgroundColor: '#FFFFFF', color: riskLevel.color }}>
                        {getRiskLevel(reportData.risk_score).label}
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

                  {/* Key Terms */}
                  {(reportData.key_terms?.monthly_rent || reportData.key_terms?.deposit_amount) && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                      {reportData.key_terms?.monthly_rent && (
                        <div>
                          <span className="text-xs" style={{ color: colors.textSecondary }}>{strings.monthlyRent}</span>
                          <p className="font-bold" style={{ color: colors.textPrimary }}>฿{reportData.key_terms.monthly_rent.toLocaleString()}</p>
                        </div>
                      )}
                      {reportData.key_terms?.deposit_amount && (
                        <div>
                          <span className="text-xs" style={{ color: colors.textSecondary }}>{strings.deposit}</span>
                          <p className="font-bold" style={{ color: colors.textPrimary }}>฿{reportData.key_terms.deposit_amount.toLocaleString()}</p>
                        </div>
                      )}
                      {reportData.key_terms?.lease_start_date && reportData.key_terms?.lease_end_date && (
                        <div className="col-span-2">
                          <span className="text-xs" style={{ color: colors.textSecondary }}>{strings.leasePeriod}</span>
                          <p className="font-bold" style={{ color: colors.textPrimary }}>{reportData.key_terms.lease_start_date} → {reportData.key_terms.lease_end_date}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Issues Requiring Attention (deduped, with evidence + specific recs) */}
              <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                    {strings.allIssues} ({reportData.flags.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reportData.flags.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                      <p style={{ color: colors.textSecondary }}>{strings.noIssues}</p>
                    </div>
                  ) : (
                    reportData.flags.map((flag, idx) => {
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
                          {flag.evidence && (
                            <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6' }}>
                              <p className="text-xs font-bold text-gray-600 mb-1">Evidence:</p>
                              <p className="text-sm" style={{ color: colors.textPrimary }}>{flag.evidence}</p>
                            </div>
                          )}
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

              {/* Clause-by-Clause Analysis (ALL clauses, risk + non-risk) */}
              <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-emerald-700" />
                    {strings.clauseAnalysis} ({totalClauses})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {clauseEntries.map((c) => {
                    const sev = c.isRisk ? (SEVERITY_CONFIG[c.risk_level] || SEVERITY_CONFIG.medium) : SEVERITY_CONFIG.none;
                    const Icon = sev.icon;
                    return (
                      <div key={c.clause_id} className="p-4 rounded-xl border" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#FFFFFF', borderColor: colors.borderColor }}>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={`${sev.color} border flex items-center gap-1`}><Icon className="w-3 h-3" />{c.isRisk ? (c.risk_level?.toUpperCase() + ' RISK') : 'NO RISK'}</Badge>
                          {c.category && <Badge variant="outline">{c.category}</Badge>}
                          {c.clause_id && <Badge variant="outline">{c.clause_id}</Badge>}
                        </div>
                        <h4 className="font-bold mb-2" style={{ color: colors.textPrimary }}>{c.heading || c.clause_id}</h4>
                        {c.snippet && (
                          <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6' }}>
                            <p className="text-xs font-bold text-gray-600 mb-1">Snippet:</p>
                            <p className="text-sm" style={{ color: colors.textPrimary }}>{c.snippet}</p>
                          </div>
                        )}
                        <div className="mb-1">
                          <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{c.isRisk ? 'Impact / Rationale' : 'Rationale'}</p>
                          <p className="text-sm" style={{ color: colors.textPrimary }}>{c.rationale || (c.isRisk ? 'See details above.' : 'Accept as standard.')}</p>
                        </div>
                        {c.isRisk && c.recommendations?.length > 0 && (
                          <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#ECFDF5' }}>
                            <p className="text-xs font-bold text-emerald-700 mb-2">Recommendations:</p>
                            <ul className="space-y-1">
                              {c.recommendations.map((line, i) => (
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

              {/* Coverage Metrics */}
              {coverageSummary && (
                <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
                  <CardHeader>
                    <CardTitle>{strings.clauseCoverage} — {strings.coverageSubtitle}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div><span className="font-semibold" style={{ color: colors.textSecondary }}>Total Clauses:</span> <span style={{ color: colors.textPrimary }}>{coverageSummary.total_clauses}</span></div>
                      <div><span className="font-semibold" style={{ color: colors.textSecondary }}>Reviewed:</span> <span style={{ color: colors.textPrimary }}>{coverageSummary.clauses_reviewed}</span></div>
                      <div><span className="font-semibold" style={{ color: colors.textSecondary }}>Flagged:</span> <span style={{ color: colors.textPrimary }}>{coverageSummary.clauses_flagged}</span></div>
                      <div><span className="font-semibold" style={{ color: colors.textSecondary }}>Unmapped:</span> <span style={{ color: colors.textPrimary }}>{coverageSummary.unmapped_clauses}</span></div>
                      <div><span className="font-semibold" style={{ color: colors.textSecondary }}>Missing Categories:</span> <span style={{ color: colors.textPrimary }}>{coverageSummary.missing_expected_categories}</span></div>
                      {typeof coverageSummary.mapped_pct === 'number' && (
                        <div><span className="font-semibold" style={{ color: colors.textSecondary }}>Coverage:</span> <span style={{ color: colors.textPrimary }}>{coverageSummary.mapped_pct}%</span></div>
                      )}
                    </div>
                    {typeof coverageSummary.mapped_pct === 'number' && coverageSummary.mapped_pct !== 100 && (
                      <div className="mt-3 p-3 rounded" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FEF3C7', color: '#92400E' }}>
                        Rescan required – taxonomy coverage incomplete.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {lease.file_url && (
                  <Button variant="outline" onClick={() => window.open(lease.file_url, '_blank')} className="flex-1">
                    <ExternalLink className="w-4 h-4 mr-2" />{strings.viewLease}
                  </Button>
                )}
                <Button onClick={() => { haptic.medium(); navigate('/Templates'); }} style={{ backgroundColor: '#0C3B2E', color: '#fff' }} className="flex-1">
                  <FileText className="w-4 h-4 mr-2" />{strings.viewTemplates}
                </Button>
              </div>
            </div>
          </div>
        );
      }

export default function ReportFull() {
  return (
    <AuthGuard>
      <ReportFullContent />
    </AuthGuard>
  );
}