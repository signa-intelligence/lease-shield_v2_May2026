import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { riskTheme, LEGAL_DISCLAIMER } from "../components/shared/riskTheme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Shield, FileText, AlertTriangle, Info, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { FeatureGate } from "../components/shared/FeatureGate";
import AuthGuard from "../components/shared/AuthGuard";
import { haptic } from "../components/shared/HapticFeedback";
import { ToastProvider, useToast } from "../components/shared/Toast";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import SkeletonLoader from "../components/shared/SkeletonLoader";

function ReportFullContent() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [expandedClauses, setExpandedClauses] = useState({});
  const [showAllClauses, setShowAllClauses] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const scanId = urlParams.get('scanId');
  const leaseId = urlParams.get('leaseId');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: scan, isLoading: scanLoading, error: scanError } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: async () => {
      const scans = await base44.entities.LeaseScan.list();
      return scans.find(s => s.id === scanId);
    },
    enabled: !!scanId && !!user,
    retry: 1
  });

  const { data: lease, isLoading: leaseLoading } = useQuery({
    queryKey: ['lease', scan?.lease_id || leaseId],
    queryFn: async () => {
      const leases = await base44.entities.Lease.list();
      return leases.find(l => l.id === (scan?.lease_id || leaseId));
    },
    enabled: !!(scan?.lease_id || leaseId) && !!user,
    retry: 1
  });

  const isLoading = scanLoading || leaseLoading;
  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

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

  // Extract canonical report from scan
  const canonicalReport = scan?.scan_full?.canonical_report;
  const hasCanonicalReport = !!canonicalReport && 
    Array.isArray(canonicalReport.clause_ledger) && 
    Array.isArray(canonicalReport.clause_review);

  const toggleClause = (clauseId) => {
    setExpandedClauses(prev => ({
      ...prev,
      [clauseId]: !prev[clauseId]
    }));
  };

  const handleDownloadPDF = async () => {
    if (!scan || !canonicalReport) return;
    setDownloadingPDF(true);
    haptic.medium();

    try {
      const response = await base44.functions.invoke('generateLeaseReportPDF', {
        scanData: {
          lease_address: lease?.property_address || 'Lease Agreement',
          risk_score: canonicalReport.risk_score,
          summary: canonicalReport.summary,
          clause_ledger: canonicalReport.clause_ledger,
          clause_review: canonicalReport.clause_review,
          missing_clauses: canonicalReport.missing_clauses,
          key_terms: canonicalReport.key_terms,
          generated_date: new Date().toISOString()
        },
        language
      });

      if (response.data?.success && response.data?.pdf_url) {
        window.location.href = response.data.pdf_url;
        toast.success(language === 'th' ? 'กำลังดาวน์โหลด PDF' : 'Downloading PDF');
        haptic.success();
      } else {
        throw new Error(response.data?.error || 'PDF generation failed');
      }
    } catch (error) {
      console.error('[PDF_ERROR]', error.message);
      toast.error(language === 'th' ? 'การดาวน์โหลด PDF ล้มเหลว' : 'PDF download failed');
      haptic.error();
    } finally {
      setDownloadingPDF(false);
    }
  };

  const strings = {
    en: {
      fullLeaseReport: "Full Lease Report",
      downloadPDF: "Download PDF",
      riskAssessment: "Risk Assessment",
      score: "Score",
      keyLeaseTerms: "Key Lease Terms",
      clauseReview: "Clause-by-Clause Review",
      missingClauses: "Missing Clauses",
      tenantView: "Tenant Impact",
      landlordView: "Landlord Benefit",
      lawyerView: "Thai Law Context",
      recommendedChange: "Recommended Change",
      negotiationTip: "Negotiation Tip",
      noRiskDetected: "No risk detected",
      lowRisk: "Low Risk",
      mediumRisk: "Medium Risk",
      highRisk: "High Risk",
      suggestedAddition: "Suggested Addition",
      whyItMatters: "Why It Matters",
      priority: "Priority",
      showAllClauses: "Show All Clauses",
      hideNoRiskClauses: "Hide No-Risk Clauses"
    },
    th: {
      fullLeaseReport: "รายงานสัญญาเช่าฉบับเต็ม",
      downloadPDF: "ดาวน์โหลด PDF",
      riskAssessment: "การประเมินความเสี่ยง",
      score: "คะแนน",
      keyLeaseTerms: "ข้อกำหนดสำคัญ",
      clauseReview: "การตรวจสอบทีละข้อ",
      missingClauses: "ข้อที่ขาดหายไป",
      tenantView: "ผลกระทบต่อผู้เช่า",
      landlordView: "ประโยชน์ของเจ้าของ",
      lawyerView: "บริบทกฎหมายไทย",
      recommendedChange: "การเปลี่ยนแปลงที่แนะนำ",
      negotiationTip: "เคล็ดลับการเจรจา",
      noRiskDetected: "ไม่พบความเสี่ยง",
      lowRisk: "ความเสี่ยงต่ำ",
      mediumRisk: "ความเสี่ยงปานกลาง",
      highRisk: "ความเสี่ยงสูง",
      suggestedAddition: "ข้อความที่แนะนำให้เพิ่ม",
      whyItMatters: "ทำไมจึงสำคัญ",
      priority: "ลำดับความสำคัญ",
      showAllClauses: "แสดงข้อทั้งหมด",
      hideNoRiskClauses: "ซ่อนข้อที่ไม่มีความเสี่ยง"
    }
  };

  const t = strings[language] || strings.en;

  const getRiskBadge = (riskLevel) => {
    const config = {
      none: { label: t.noRiskDetected, bg: '#D1FAE5', color: '#065F46', icon: CheckCircle2 },
      low: { label: t.lowRisk, bg: '#DBEAFE', color: '#1E40AF', icon: Info },
      medium: { label: t.mediumRisk, bg: '#FEF3C7', color: '#92400E', icon: AlertTriangle },
      high: { label: t.highRisk, bg: '#FEE2E2', color: '#991B1B', icon: AlertTriangle }
    };
    return config[riskLevel] || config.none;
  };

  const getPriorityColor = (priority) => {
    const config = {
      high: { bg: '#FEE2E2', color: '#991B1B' },
      medium: { bg: '#FEF3C7', color: '#92400E' },
      low: { bg: '#DBEAFE', color: '#1E40AF' }
    };
    return config[priority] || config.low;
  };

  // Error and loading states
  if (!scanId) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <Card style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                Invalid Report Link
              </h2>
              <Button onClick={() => navigate(createPageUrl("UploadScan"))}>
                Upload a Lease
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <SkeletonLoader variant="card" count={3} isDarkMode={isDarkMode} />
        </div>
      </div>
    );
  }

  if (!scan || !hasCanonicalReport) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <Card style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-8 text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-amber-500" />
              <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'กำลังประมวลผลการสแกน...' : 'Processing Scan...'}
              </h2>
              <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                {language === 'th' 
                  ? 'ระบบกำลังวิเคราะห์สัญญาเช่าของคุณ กรุณารอสักครู่'
                  : 'Analyzing your lease document. Please wait...'}
              </p>
              <Button onClick={() => window.location.reload()}>
                {language === 'th' ? 'รีเฟรช' : 'Refresh'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { clause_ledger, clause_review, missing_clauses, summary, key_terms } = canonicalReport;
  const riskScore = canonicalReport.risk_score || 0;

  // Filter clauses based on toggle
  const riskyReviews = clause_review.filter(r => r.risk_level !== 'none');
  const noRiskReviews = clause_review.filter(r => r.risk_level === 'none');
  const displayReviews = showAllClauses ? clause_review : riskyReviews;

  const theme = riskTheme(riskScore);

  return (
    <FeatureGate feature="full_report">
      <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title={t.fullLeaseReport}
            subtitle={lease?.property_address || 'Lease Agreement'}
            icon={FileText}
            iconColor="#0C3B2E"
            showBack={true}
            backRoute={createPageUrl("UploadScan")}
            isDarkMode={isDarkMode}
            actions={
              <Button 
                style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
              >
                {downloadingPDF ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" />{t.downloadPDF}</>
                )}
              </Button>
            }
          />

          {/* Risk Score Summary */}
          <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader style={{ backgroundColor: theme?.color || '#0C3B2E', color: '#FFFFFF' }}>
              <CardTitle className="flex items-center justify-between">
                <span>{t.riskAssessment}</span>
                <Badge className="text-lg px-4 py-2" style={{
                  backgroundColor: theme?.bg || '#fff',
                  color: theme?.color || '#1F2937'
                }}>
                  {t.score}: {riskScore}/100
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p style={{ color: colors.textPrimary }}>{summary?.total_extracted || clause_ledger.length} clauses extracted, {riskyReviews.length} with risks, {missing_clauses?.length || 0} standard clauses missing.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="p-3 rounded-lg border" style={{ borderColor: colors.borderColor }}>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>Total Clauses</div>
                  <div className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{clause_ledger.length}</div>
                </div>
                <div className="p-3 rounded-lg border" style={{ borderColor: '#EF4444' }}>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>High Risk</div>
                  <div className="text-2xl font-bold text-red-600">{clause_review.filter(r => r.risk_level === 'high').length}</div>
                </div>
                <div className="p-3 rounded-lg border" style={{ borderColor: '#F59E0B' }}>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>Medium Risk</div>
                  <div className="text-2xl font-bold text-amber-600">{clause_review.filter(r => r.risk_level === 'medium').length}</div>
                </div>
                <div className="p-3 rounded-lg border" style={{ borderColor: '#10B981' }}>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>No Risk</div>
                  <div className="text-2xl font-bold text-emerald-600">{noRiskReviews.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Terms */}
          {key_terms && Object.keys(key_terms).length > 0 && (
            <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
              <CardHeader className="border-b" style={{ borderColor: colors.borderColor }}>
                <CardTitle style={{ color: colors.textPrimary }}>{t.keyLeaseTerms}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {key_terms.property_address && (
                    <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                      <div className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Property Address</div>
                      <div className="font-medium" style={{ color: colors.textPrimary }}>{key_terms.property_address}</div>
                    </div>
                  )}
                  {key_terms.monthly_rent > 0 && (
                    <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                      <div className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Monthly Rent</div>
                      <div className="font-medium" style={{ color: colors.textPrimary }}>฿{key_terms.monthly_rent?.toLocaleString()}</div>
                    </div>
                  )}
                  {key_terms.deposit_amount > 0 && (
                    <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                      <div className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Security Deposit</div>
                      <div className="font-medium" style={{ color: colors.textPrimary }}>฿{key_terms.deposit_amount?.toLocaleString()}</div>
                    </div>
                  )}
                  {key_terms.lease_start_date && (
                    <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                      <div className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Lease Period</div>
                      <div className="font-medium" style={{ color: colors.textPrimary }}>
                        {key_terms.lease_start_date} to {key_terms.lease_end_date || 'TBD'}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clause-by-Clause Review */}
          <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader className="border-b" style={{ borderColor: colors.borderColor }}>
              <CardTitle className="flex items-center justify-between" style={{ color: colors.textPrimary }}>
                <span>{t.clauseReview} ({displayReviews.length})</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAllClauses(!showAllClauses)}
                >
                  {showAllClauses ? t.hideNoRiskClauses : t.showAllClauses}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {displayReviews.map((review, idx) => {
                  const ledgerItem = clause_ledger.find(c => c.clause_id === review.clause_id);
                  const riskBadge = getRiskBadge(review.risk_level);
                  const RiskIcon = riskBadge.icon;
                  const isExpanded = expandedClauses[review.clause_id];

                  return (
                    <div 
                      key={review.clause_id || idx} 
                      className="rounded-xl border-2 overflow-hidden"
                      style={{ borderColor: riskBadge.color }}
                    >
                      {/* Header - always visible */}
                      <div 
                        className="p-4 cursor-pointer"
                        style={{ backgroundColor: riskBadge.bg }}
                        onClick={() => toggleClause(review.clause_id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <RiskIcon className="w-5 h-5 mt-0.5" style={{ color: riskBadge.color }} />
                            <div>
                              <div className="font-bold" style={{ color: riskBadge.color }}>
                                {ledgerItem?.heading || `Clause ${review.clause_id}`}
                              </div>
                              <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                                {review.risk_summary}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge style={{ backgroundColor: riskBadge.bg, color: riskBadge.color, border: `1px solid ${riskBadge.color}` }}>
                              {riskBadge.label}
                            </Badge>
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="p-4 border-t" style={{ borderColor: colors.borderColor, backgroundColor: colors.cardBg }}>
                          {/* Original clause text */}
                          {ledgerItem?.full_text && (
                            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F1F5F9' }}>
                              <div className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>Original Clause Text</div>
                              <div className="text-sm" style={{ color: colors.textPrimary }}>{ledgerItem.full_text}</div>
                            </div>
                          )}

                          {/* Three perspectives */}
                          <div className="space-y-3">
                            <div className="p-3 rounded-lg border-l-4" style={{ borderLeftColor: '#3B82F6', backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF' }}>
                              <div className="text-xs font-semibold mb-1" style={{ color: '#3B82F6' }}>{t.tenantView}</div>
                              <div className="text-sm" style={{ color: colors.textPrimary }}>{review.tenant_view}</div>
                            </div>

                            <div className="p-3 rounded-lg border-l-4" style={{ borderLeftColor: '#8B5CF6', backgroundColor: isDarkMode ? '#2D2B55' : '#F5F3FF' }}>
                              <div className="text-xs font-semibold mb-1" style={{ color: '#8B5CF6' }}>{t.landlordView}</div>
                              <div className="text-sm" style={{ color: colors.textPrimary }}>{review.landlord_view}</div>
                            </div>

                            <div className="p-3 rounded-lg border-l-4" style={{ borderLeftColor: '#0C3B2E', backgroundColor: isDarkMode ? '#1E3A2E' : '#ECFDF5' }}>
                              <div className="text-xs font-semibold mb-1" style={{ color: '#0C3B2E' }}>{t.lawyerView}</div>
                              <div className="text-sm" style={{ color: colors.textPrimary }}>{review.lawyer_view}</div>
                            </div>
                          </div>

                          {/* Recommended change & negotiation tip */}
                          {review.recommended_change && review.recommended_change !== 'No change recommended' && (
                            <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#2A2D30' : '#FEF3C7' }}>
                              <div className="text-xs font-semibold mb-1" style={{ color: '#92400E' }}>{t.recommendedChange}</div>
                              <div className="text-sm" style={{ color: colors.textPrimary }}>{review.recommended_change}</div>
                            </div>
                          )}

                          {review.negotiation_tip && (
                            <div className="mt-3 p-3 rounded-lg border" style={{ borderColor: colors.borderColor }}>
                              <div className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{t.negotiationTip}</div>
                              <div className="text-sm italic" style={{ color: colors.textPrimary }}>{review.negotiation_tip}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Missing Clauses */}
          {missing_clauses && missing_clauses.length > 0 && (
            <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
              <CardHeader className="border-b" style={{ borderColor: colors.borderColor }}>
                <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  {t.missingClauses} ({missing_clauses.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {missing_clauses.filter(m => m.priority === 'high').concat(
                    missing_clauses.filter(m => m.priority === 'medium'),
                    missing_clauses.filter(m => m.priority === 'low')
                  ).map((missing, idx) => {
                    const priorityStyle = getPriorityColor(missing.priority);
                    return (
                      <div key={idx} className="p-4 rounded-lg border" style={{ borderColor: priorityStyle.color }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold" style={{ color: colors.textPrimary }}>{missing.canonical_name}</div>
                            <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>{missing.why_it_matters}</div>
                            {missing.suggested_addition_text && (
                              <div className="mt-2 p-2 rounded text-sm" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                                <span className="font-semibold" style={{ color: colors.textSecondary }}>{t.suggestedAddition}: </span>
                                <span style={{ color: colors.textPrimary }}>{missing.suggested_addition_text}</span>
                              </div>
                            )}
                          </div>
                          <Badge style={{ backgroundColor: priorityStyle.bg, color: priorityStyle.color }}>
                            {missing.priority.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'ขั้นตอนต่อไป' : 'Suggested Next Steps'}
              </h3>
              
              <div className="grid md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => navigate(createPageUrl("Templates"))}
                  style={isDarkMode ? { backgroundColor: colors.cardBg, borderColor: colors.borderColor, color: colors.textPrimary } : {}}
                >
                  <FileText className="w-5 h-5 mr-3 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold">{language === 'th' ? 'ดูเทมเพลตเอกสาร' : 'View Document Templates'}</div>
                    <div className="text-xs" style={{ color: colors.textSecondary }}>{language === 'th' ? 'สร้างจดหมายเพื่อเจรจา' : 'Generate negotiation letters'}</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => navigate(createPageUrl("DepositTracker"))}
                  style={isDarkMode ? { backgroundColor: colors.cardBg, borderColor: colors.borderColor, color: colors.textPrimary } : {}}
                >
                  <Shield className="w-5 h-5 mr-3 text-emerald-600" />
                  <div className="text-left">
                    <div className="font-semibold">{language === 'th' ? 'ติดตามเงินมัดจำ' : 'Track Your Deposit'}</div>
                    <div className="text-xs" style={{ color: colors.textSecondary }}>{language === 'th' ? 'เปิดใช้งาน Deposit Shield' : 'Enable Deposit Shield'}</div>
                  </div>
                </Button>
              </div>

              <div className="mt-6 text-xs italic" style={{ color: colors.textSecondary }}>
                {LEGAL_DISCLAIMER}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FeatureGate>
  );
}

export default function ReportFull() {
  return (
    <AuthGuard>
      <ToastProvider>
        <ReportFullContent />
      </ToastProvider>
    </AuthGuard>
  );
}