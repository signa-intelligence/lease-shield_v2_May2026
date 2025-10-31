
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, FileText, ArrowLeft, ExternalLink } from "lucide-react";
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

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: scan } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: async () => {
      const scans = await base44.entities.LeaseScan.list();
      return scans.find(s => s.id === scanId);
    },
    enabled: !!scanId,
  });

  const { data: lease } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: async () => {
      const leases = await base44.entities.Lease.list();
      return leases.find(l => l.id === leaseId);
    },
    enabled: !!leaseId,
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40'
  } : {
    bg: '#0C3B2E',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#e2e8f0'
  };

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
      criticalRisk: "Critical Risk"
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
      criticalRisk: "ความเสี่ยงวิกฤต"
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

  if (!scan || !lease) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-center" style={{ color: colors.textSecondary }}>Loading...</p>
        </div>
      </div>
    );
  }

  const riskColor = getRiskColor(scan.risk_score);
  const riskLabel = getRiskLabel(scan.risk_score);

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl("UploadScan"))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {strings.backToScans}
        </Button>

        <Card className="border-none shadow-xl mb-6">
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
            <h3 className="font-bold text-lg text-ls-charcoal mb-2">{strings.summary}</h3>
            <p className="text-slate-700">{scan.summary}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl mb-6">
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
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`${severityConfig.color} border`}>
                      {severityConfig.label}
                    </Badge>
                    {flag.category && (
                      <Badge variant="outline">{flag.category}</Badge>
                    )}
                  </div>
                  <p className="text-base font-semibold text-ls-charcoal mb-2">{flag.description}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            className="flex-1 bg-ls-forest hover:bg-ls-forest/90"
            onClick={() => navigate(createPageUrl("ReportFull") + `?scanId=${scanId}&leaseId=${leaseId}`)}
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
