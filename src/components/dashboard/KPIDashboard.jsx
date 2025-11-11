import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Target, AlertCircle, CheckCircle2 } from "lucide-react";

export default function KPIDashboard({ 
  leases = [], 
  deposits = [], 
  cases = [], 
  documents = [],
  language = 'en' 
}) {
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  const colors = {
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#A8ABAD' : '#64748b',
    kpiCardBg: isDarkMode ? '#1A1D1F' : '#F8FAFC',
    positiveColor: '#10B981',
    negativeColor: '#EF4444',
    neutralColor: '#F59E0B'
  };

  const strings = {
    en: {
      title: "Key Performance Indicators",
      subtitle: "Your protection metrics at a glance",
      documentationRate: "Documentation Rate",
      activeProtections: "Active Protections",
      responseTime: "Avg Response Time",
      resolutionRate: "Resolution Rate",
      leasesCovered: "Leases Covered",
      evidenceFiles: "Evidence Files",
      depositValue: "Deposits Protected",
      openCases: "Open Cases",
      excellent: "Excellent",
      good: "Good",
      needsImprovement: "Needs Work",
      hours: "hours",
      days: "days"
    },
    th: {
      title: "ตัวชี้วัดประสิทธิภาพหลัก",
      subtitle: "เมตริกการป้องกันของคุณแบบรวดเร็ว",
      documentationRate: "อัตราการจัดเก็บเอกสาร",
      activeProtections: "การป้องกันที่ใช้งาน",
      responseTime: "เวลาตอบสนองเฉลี่ย",
      resolutionRate: "อัตราการแก้ไข",
      leasesCovered: "สัญญาเช่าที่ครอบคลุม",
      evidenceFiles: "ไฟล์หลักฐาน",
      depositValue: "เงินมัดจำที่ปกป้อง",
      openCases: "คดีที่เปิดอยู่",
      excellent: "ยอดเยี่ยม",
      good: "ดี",
      needsImprovement: "ต้องปรับปรุง",
      hours: "ชั่วโมง",
      days: "วัน"
    }
  };

  const t = strings[language];

  // Calculate KPIs
  const scannedLeases = leases.filter(l => l.status === 'scanned' || l.status === 'paid');
  const documentationRate = leases.length > 0 
    ? Math.round((scannedLeases.length / leases.length) * 100)
    : 0;

  const activeProtectionsCount = deposits.filter(d => d.status === 'tracking').length +
                                  leases.filter(l => l.notice_alerts_enabled).length;

  const resolvedCases = cases.filter(c => ['resolved', 'closed'].includes(c.status));
  const resolutionRate = cases.length > 0
    ? Math.round((resolvedCases.length / cases.length) * 100)
    : 0;

  const totalDepositValue = deposits.reduce((sum, d) => sum + (d.deposit_amount || 0), 0);
  const openCasesCount = cases.filter(c => !['resolved', 'closed'].includes(c.status)).length;

  // Mock response time (in reality, calculate from case timeline)
  const avgResponseTime = 24;

  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.excellent) return colors.positiveColor;
    if (value >= thresholds.good) return colors.neutralColor;
    return colors.negativeColor;
  };

  const getStatusLabel = (value, thresholds) => {
    if (value >= thresholds.excellent) return t.excellent;
    if (value >= thresholds.good) return t.good;
    return t.needsImprovement;
  };

  const kpis = [
    {
      label: t.documentationRate,
      value: `${documentationRate}%`,
      trend: documentationRate >= 75 ? 'up' : 'down',
      status: getStatusLabel(documentationRate, { excellent: 80, good: 60 }),
      color: getStatusColor(documentationRate, { excellent: 80, good: 60 }),
      icon: Activity
    },
    {
      label: t.activeProtections,
      value: activeProtectionsCount,
      trend: activeProtectionsCount > 0 ? 'up' : 'neutral',
      status: activeProtectionsCount > 0 ? t.good : t.needsImprovement,
      color: activeProtectionsCount > 0 ? colors.positiveColor : colors.negativeColor,
      icon: CheckCircle2
    },
    {
      label: t.resolutionRate,
      value: `${resolutionRate}%`,
      trend: resolutionRate >= 70 ? 'up' : 'down',
      status: getStatusLabel(resolutionRate, { excellent: 80, good: 60 }),
      color: getStatusColor(resolutionRate, { excellent: 80, good: 60 }),
      icon: Target
    },
    {
      label: t.responseTime,
      value: `${avgResponseTime}h`,
      trend: avgResponseTime <= 24 ? 'up' : 'down',
      status: avgResponseTime <= 24 ? t.excellent : t.good,
      color: avgResponseTime <= 24 ? colors.positiveColor : colors.neutralColor,
      icon: Activity
    }
  ];

  const stats = [
    { label: t.leasesCovered, value: scannedLeases.length, total: leases.length },
    { label: t.evidenceFiles, value: documents.length, total: null },
    { label: t.depositValue, value: `฿${(totalDepositValue / 1000).toFixed(0)}k`, total: null },
    { label: t.openCases, value: openCasesCount, total: cases.length }
  ];

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader className="pb-4" style={{ borderBottom: `1px solid ${colors.textSecondary}20` }}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold mb-1" style={{ color: colors.textPrimary }}>
              {t.title}
            </CardTitle>
            <p className="text-sm" style={{ color: colors.textSecondary }}>{t.subtitle}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Main KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div
                key={index}
                className="p-4 rounded-xl transition-all hover:scale-105"
                style={{
                  backgroundColor: colors.kpiCardBg,
                  border: `2px solid ${kpi.color}20`
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" style={{ color: colors.positiveColor }} />
                  ) : kpi.trend === 'down' ? (
                    <TrendingDown className="w-4 h-4" style={{ color: colors.negativeColor }} />
                  ) : (
                    <AlertCircle className="w-4 h-4" style={{ color: colors.neutralColor }} />
                  )}
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color: kpi.color }}>
                  {kpi.value}
                </p>
                <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                  {kpi.label}
                </p>
                <Badge
                  className="text-xs"
                  style={{
                    backgroundColor: `${kpi.color}20`,
                    color: kpi.color,
                    border: `1px solid ${kpi.color}40`
                  }}
                >
                  {kpi.status}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-3 rounded-lg"
              style={{
                backgroundColor: colors.kpiCardBg,
                border: `1px solid ${colors.textSecondary}20`
              }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                {stat.label}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  {stat.value}
                </p>
                {stat.total !== null && (
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    / {stat.total}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}