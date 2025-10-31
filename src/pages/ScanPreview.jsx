import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, FileText, ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

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

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg, paddingBottom: '120px' }}>
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
              {strings.topIssues}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scan.flags && scan.flags.map((flag, idx) => {
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
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <Button
            className="flex-1 bg-ls-forest hover:bg-ls-forest/90"
            onClick={() => navigate(createPageUrl("ReportFull") + `?scanId=${scan.id}&leaseId=${lease.id}`)}
          >
            <FileText className="w-5 h-5 mr-2" />
            {strings.viewFullReport}
          </Button>
          {lease.file_url && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(lease.file_url, '_blank')}
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              {strings.viewLease}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}