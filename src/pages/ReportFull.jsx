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
  RefreshCw,
  ChevronDown,
  ChevronUp
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

  // Export PDF handler
  const handleExportPdf = async () => {
    if (!canExportPdf || exportingPdf) return;
    
    setExportingPdf(true);
    haptic.medium();
    
    try {
      // Build scanData payload for PDF generator - use flags as PRIMARY source
      const pdfPayload = {
        lease_address: leaseData?.property_address || 'Lease Agreement',
        generated_date: new Date().toISOString(),
        risk_score: scanData?.risk_score || 0,
        summary: scanData?.summary || '',
        key_terms: scanData?.scan_full?.key_terms || {},
        flags: scanData?.flags || scanData?.scan_full?.flags || [], // PRIMARY DATA
        taxonomy_report: scanData?.scan_full?.taxonomy_report || [],
        coverage_summary: scanData?.scan_full?.coverage_summary || {},
        missing_items: scanData?.scan_full?.missing_items || []
      };

      const response = await base44.functions.invoke('generateLeaseReportPDF', {
        scanData: pdfPayload,
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

  // === SUCCESS: Render the full report ===
  const lease = leaseData;
  const scan = scanData;
  
  // Extract data - PRIMARY SOURCE is flags array (the original expert output)
  const flags = scan.flags || scan.scan_full?.flags || [];
  const keyTerms = scan.scan_full?.key_terms || {};

  const getRiskLevel = (score) => {
    if (score >= 70) return { level: 'high', label: 'HIGH RISK', color: '#EF4444', bg: '#FEE2E2' };
    if (score >= 40) return { level: 'medium', label: 'MEDIUM RISK', color: '#F59E0B', bg: '#FEF3C7' };
    return { level: 'low', label: 'LOW RISK', color: '#10B981', bg: '#D1FAE5' };
  };

  const riskLevel = getRiskLevel(scan.risk_score || 0);



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
      safeClauses: "Safe Clauses",
      missingClauses: "Missing Standard Clauses",
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
      safeClauses: "ข้อกำหนดที่ปลอดภัย",
      missingClauses: "ข้อกำหนดมาตรฐานที่ขาดหาย",
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
Risk Score: ${scan.risk_score}
Canonical Data: ${hasCanonicalData ? 'YES' : 'NO (fallback)'}
Clause Reviews: ${clauseReview.length}
Clause Ledger: ${clauseLedger.length}
Mappings: ${mappings.length}
Missing Clauses: ${missingClauses.length}
Flags: ${flags.length}`}
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
                  {scan.risk_score || 0}/100
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
              <p className="mt-1" style={{ color: colors.textPrimary }}>{scan.summary || 'No summary available.'}</p>
            </div>
            
            {/* Key Terms */}
            {(keyTerms.monthly_rent || keyTerms.deposit_amount) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                {keyTerms.monthly_rent && (
                  <div>
                    <span className="text-xs" style={{ color: colors.textSecondary }}>{strings.monthlyRent}</span>
                    <p className="font-bold" style={{ color: colors.textPrimary }}>฿{keyTerms.monthly_rent.toLocaleString()}</p>
                  </div>
                )}
                {keyTerms.deposit_amount && (
                  <div>
                    <span className="text-xs" style={{ color: colors.textSecondary }}>{strings.deposit}</span>
                    <p className="font-bold" style={{ color: colors.textPrimary }}>฿{keyTerms.deposit_amount.toLocaleString()}</p>
                  </div>
                )}
                {keyTerms.lease_start_date && keyTerms.lease_end_date && (
                  <div className="col-span-2">
                    <span className="text-xs" style={{ color: colors.textSecondary }}>{strings.leasePeriod}</span>
                    <p className="font-bold" style={{ color: colors.textPrimary }}>{keyTerms.lease_start_date} → {keyTerms.lease_end_date}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Issues Requiring Attention - PRIMARY SOURCE: flags array */}
        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              {strings.allIssues} ({flags.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {flags.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <p style={{ color: colors.textSecondary }}>{strings.noIssues}</p>
              </div>
            ) : (
              flags.map((flag, idx) => {
                const severityConfig = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.medium;
                const Icon = severityConfig.icon;
                
                // Parse recommendations from string (may have bullets/newlines)
                const recText = String(flag.recommendation || '');
                const recLines = recText.split(/[\n•\-–]/g).map(s => s.trim()).filter(s => s.length > 0);
                
                return (
                  <div key={idx} className="p-4 rounded-xl border-2" style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB'
                  }}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge className={`${severityConfig.color} border flex items-center gap-1`}>
                          <Icon className="w-3 h-3" />
                          {severityConfig.label}
                        </Badge>
                        {flag.category && <Badge variant="outline">{flag.category}</Badge>}
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h4 className="text-base font-bold mb-2" style={{ color: colors.textPrimary }}>
                      {flag.title || flag.description}
                    </h4>
                    
                    {/* Description/Impact */}
                    {flag.description && flag.title && (
                      <p className="text-sm mb-3" style={{ color: colors.textPrimary }}>
                        {flag.description}
                      </p>
                    )}
                    
                    {/* Explanation */}
                    {flag.explanation && (
                      <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FEF3C7' }}>
                        <p className="text-xs font-bold text-amber-700 mb-1">Why this matters:</p>
                        <p className="text-sm" style={{ color: colors.textPrimary }}>{flag.explanation}</p>
                      </div>
                    )}
                    
                    {/* Recommendations */}
                    {recLines.length > 0 && (
                      <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#ECFDF5' }}>
                        <p className="text-xs font-bold text-emerald-700 mb-2">Recommendations:</p>
                        <ul className="space-y-1">
                          {recLines.map((line, i) => (
                            <li key={i} className="text-sm flex items-start gap-2" style={{ color: colors.textPrimary }}>
                              <span className="text-emerald-600">•</span>
                              <span>{line}</span>
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