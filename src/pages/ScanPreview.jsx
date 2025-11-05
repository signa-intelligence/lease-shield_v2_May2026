
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, FileText, ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useFeatureAccess } from "../components/shared/FeatureGate";

const SEVERITY_CONFIG = {
  low: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Low' },
  medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'High' },
  critical: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Critical' }
};

export default function ScanPreview() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const scanId = urlParams.get('scanId');
  const leaseId = urlParams.get('leaseId');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: leases = [], isLoading: leasesLoading } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: allScans = [], isLoading: scansLoading } = useQuery({
    queryKey: ['allScans'],
    queryFn: () => base44.entities.LeaseScan.list(),
    enabled: !!user && leases.length > 0,
  });

  // Check if user has access to full report
  const { hasAccess: hasFullReportAccess } = useFeatureAccess('full_report');

  // Find the specific scan and lease
  const scan = allScans.find(s => {
    if (scanId) return s.id === scanId;
    if (leaseId) return s.lease_id === leaseId;
    return false;
  });

  const lease = leases.find(l => {
    if (leaseId) return l.id === leaseId;
    if (scan) return l.id === scan.lease_id;
    return false;
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const t = {
    en: {
      backToScans: "Back to Scans",
      riskScore: "Risk Score",
      summary: "Summary",
      topIssues: "Top Issues Found",
      allIssues: "All Issues Found",
      viewFullReport: "View Full Report",
      viewLease: "View Lease",
      lowRisk: "Low Risk",
      moderateRisk: "Moderate Risk",
      highRisk: "High Risk",
      criticalRisk: "Critical Risk",
      loading: "Loading scan results...",
      noScanFound: "Scan not found",
      noScanDesc: "The scan you're looking for could not be found."
    },
    th: {
      backToScans: "กลับไปที่การสแกน",
      riskScore: "คะแนนความเสี่ยง",
      summary: "สรุป",
      topIssues: "ปัญหาสำคัญที่พบ",
      allIssues: "ปัญหาทั้งหมดที่พบ",
      viewFullReport: "ดูรายงานฉบับเต็ม",
      viewLease: "ดูสัญญาเช่า",
      lowRisk: "ความเสี่ยงต่ำ",
      moderateRisk: "ความเสี่ยงปานกลาง",
      highRisk: "ความเสี่ยงสูง",
      criticalRisk: "ความเสี่ยงวิกฤต",
      loading: "กำลังโหลดผลการสแกน...",
      noScanFound: "ไม่พบการสแกน",
      noScanDesc: "ไม่พบการสแกนที่คุณกำลังมองหา"
    }
  };

  const strings = t[language];

  const getRiskColor = (score) => {
    if (score <= 30) return '#10B981';
    if (score <= 60) return '#F59E0B';
    if (score <= 80) return '#EF4444';
    return '#DC2626';
  };

  const getRiskLabel = (score) => {
    if (score <= 30) return strings.lowRisk;
    if (score <= 60) return strings.moderateRisk;
    if (score <= 80) return strings.highRisk;
    return strings.criticalRisk;
  };

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b'
  };

  // Loading state
  if (userLoading || leasesLoading || scansLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p style={{ color: colors.textSecondary }}>{strings.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!scan || !lease) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("UploadScan"))}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {strings.backToScans}
          </Button>
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {strings.noScanFound}
              </h3>
              <p style={{ color: colors.textSecondary }}>{strings.noScanDesc}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const riskColor = getRiskColor(scan.risk_score);
  const riskLabel = getRiskLabel(scan.risk_score);

  // Show preview (4 issues) or all issues based on plan
  const displayFlags = hasFullReportAccess 
    ? (scan.flags || [])
    : (scan.flags || []).slice(0, 4);
  
  const hasMoreIssues = !hasFullReportAccess && scan.flags && scan.flags.length > 4;

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg, paddingBottom: '180px' }}>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl("UploadScan"))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {strings.backToScans}
        </Button>

        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader className="border-b" style={{ backgroundColor: riskColor }}>
            <div className="text-white">
              <CardTitle className="text-2xl font-bold mb-2">{strings.riskScore}</CardTitle>
              <div className="flex items-center gap-4">
                <div className="text-6xl font-bold">{scan.risk_score}%</div>
                <div className="text-xl">{riskLabel}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-2" style={{ color: colors.textPrimary }}>{strings.summary}</h3>
            <p style={{ color: colors.textSecondary }}>{scan.summary}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              {hasFullReportAccess ? strings.allIssues : strings.topIssues} ({displayFlags.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayFlags.map((flag, idx) => {
              const severityConfig = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.medium;
              return (
                <div key={idx} className="p-4 rounded-xl border-2" style={{
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB'
                }}>
                  <div className="flex items-start justify-between mb-2 gap-2 flex-wrap">
                    <Badge className={`${severityConfig.color} border`}>
                      {severityConfig.label}
                    </Badge>
                    {flag.category && (
                      <Badge variant="outline">{flag.category}</Badge>
                    )}
                  </div>
                  <p className="text-base font-semibold" style={{ 
                    color: colors.textPrimary,
                    wordBreak: 'break-word'
                  }}>{flag.description}</p>
                </div>
              );
            })}

            {hasMoreIssues && (
              <div className="p-6 rounded-xl border-2 border-dashed" style={{
                backgroundColor: isDarkMode ? '#2A2D30' : '#FEF9C3',
                borderColor: isDarkMode ? '#C7A338' : '#EAB308'
              }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-ls-gold rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold" style={{ color: colors.textPrimary }}>
                      {language === 'th' ? `เหลืออีก ${scan.flags.length - 4} ปัญหา` : `${scan.flags.length - 4} More Issues Found`}
                    </h4>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {language === 'th' ? 'อัปเกรดเพื่อดูรายงานฉบับเต็มพร้อมคำแนะนำโดยละเอียด' : 'Upgrade to view full report with detailed recommendations'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(createPageUrl("Account"))}
                  style={{
                    width: '100%',
                    backgroundColor: '#0C3B2E',
                    color: '#FFFFFF',
                    padding: '14px 24px',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px rgba(12, 59, 46, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#0a2f25';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 10px rgba(12, 59, 46, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#0C3B2E';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px rgba(12, 59, 46, 0.3)';
                  }}
                >
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    {language === 'th' ? 'อัปเกรดเพื่อปลดล็อค' : 'Upgrade to Unlock'}
                  </span>
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fixed Action Bar - Enhanced Visibility */}
        <div className="fixed bottom-0 left-0 right-0 z-30" style={{
          backgroundColor: isDarkMode ? '#1A1D1F' : '#FFFFFF',
          borderTop: `2px solid ${isDarkMode ? '#3A3D40' : '#E5E7EB'}`,
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
          paddingBottom: 'calc(76px + env(safe-area-inset-bottom, 0px))'
        }}>
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate(createPageUrl("ReportFull") + `?scanId=${scan.id}&leaseId=${lease.id}`)}
                style={{
                  flex: 1,
                  backgroundColor: '#0C3B2E',
                  color: '#FFFFFF',
                  padding: '16px 24px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(12, 59, 46, 0.3), 0 2px 4px -1px rgba(12, 59, 46, 0.2)',
                  minHeight: '56px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#0a2f25';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 10px -1px rgba(12, 59, 46, 0.4), 0 4px 6px -1px rgba(12, 59, 46, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#0C3B2E';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(12, 59, 46, 0.3), 0 2px 4px -1px rgba(12, 59, 46, 0.2)';
                }}
              >
                <FileText className="w-5 h-5" />
                <span style={{ fontSize: '16px', fontWeight: '700' }}>{strings.viewFullReport}</span>
              </button>
              {lease.file_url && (
                <button
                  onClick={() => window.open(lease.file_url, '_blank')}
                  style={{
                    flex: 1,
                    backgroundColor: isDarkMode ? '#2A2D30' : '#FFFFFF',
                    color: '#0C3B2E',
                    padding: '16px 24px',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    border: '3px solid #0C3B2E',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    minHeight: '56px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#0C3B2E';
                    e.target.style.color = '#FFFFFF';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(12, 59, 46, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = isDarkMode ? '#2A2D30' : '#FFFFFF';
                    e.target.style.color = '#0C3B2E';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  <ExternalLink className="w-5 h-5" />
                  <span style={{ fontSize: '16px', fontWeight: '700' }}>{strings.viewLease}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
