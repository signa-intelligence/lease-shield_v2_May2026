import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, FileText, Scale, Crown, DollarSign, Clock, AlertTriangle } from "lucide-react";

export default function AdminDashboardStats({ stats, language, colors }) {
  const strings = {
    en: {
      totalUsers: "Total Users",
      activeSubscribers: "Active Subscribers",
      totalRevenue: "Monthly Revenue",
      totalLeases: "Total Leases",
      totalCases: "Total Cases",
      activeCases: "Active Cases",
      avgResolutionTime: "Avg Resolution Time",
      urgentCases: "Urgent Cases",
      vsLastMonth: "vs last month",
      days: "days"
    },
    th: {
      totalUsers: "ผู้ใช้ทั้งหมด",
      activeSubscribers: "สมาชิกที่ใช้งาน",
      totalRevenue: "รายได้รายเดือน",
      totalLeases: "สัญญาเช่าทั้งหมด",
      totalCases: "คดีทั้งหมด",
      activeCases: "คดีที่ดำเนินการ",
      avgResolutionTime: "เวลาเฉลี่ยการแก้ปัญหา",
      urgentCases: "คดีเร่งด่วน",
      vsLastMonth: "เทียบเดือนก่อน",
      days: "วัน"
    },
    zh: {
      totalUsers: "总用户数",
      activeSubscribers: "活跃订阅者",
      totalRevenue: "月收入",
      totalLeases: "总租约数",
      totalCases: "总案件数",
      activeCases: "活跃案件",
      avgResolutionTime: "平均解决时间",
      urgentCases: "紧急案件",
      vsLastMonth: "与上月相比",
      days: "天"
    },
    ja: {
      totalUsers: "総ユーザー数",
      activeSubscribers: "アクティブサブスクライバー",
      totalRevenue: "月間収益",
      totalLeases: "総賃貸契約数",
      totalCases: "総ケース数",
      activeCases: "アクティブケース",
      avgResolutionTime: "平均解決時間",
      urgentCases: "緊急ケース",
      vsLastMonth: "先月比",
      days: "日"
    },
    ko: {
      totalUsers: "총 사용자 수",
      activeSubscribers: "활성 구독자",
      totalRevenue: "월간 수익",
      totalLeases: "총 임대 계약 수",
      totalCases: "총 사례 수",
      activeCases: "활성 사례",
      avgResolutionTime: "평균 해결 시간",
      urgentCases: "긴급 사례",
      vsLastMonth: "지난 달 대비",
      days: "일"
    }
  };

  const t = strings[language] || strings.en;

  const kpis = [
    {
      label: t.totalUsers,
      value: stats.totalUsers || 0,
      trend: stats.userTrend || 0,
      icon: Users,
      color: '#3B82F6',
      bgLight: '#EFF6FF',
      bgDark: '#1E3A5F'
    },
    {
      label: t.activeSubscribers,
      value: stats.activeSubscribers || 0,
      trend: stats.subscriberTrend || 0,
      icon: Crown,
      color: '#C7A338',
      bgLight: '#FFFBEB',
      bgDark: '#2D2520'
    },
    {
      label: t.totalRevenue,
      value: `฿${(stats.monthlyRevenue || 0).toLocaleString()}`,
      trend: stats.revenueTrend || 0,
      icon: DollarSign,
      color: '#10B981',
      bgLight: '#F0FDF4',
      bgDark: '#1A2E27'
    },
    {
      label: t.totalLeases,
      value: stats.totalLeases || 0,
      trend: stats.leaseTrend || 0,
      icon: FileText,
      color: '#8B5CF6',
      bgLight: '#F5F3FF',
      bgDark: '#2E2352'
    },
    {
      label: t.totalCases,
      value: stats.totalCases || 0,
      trend: stats.caseTrend || 0,
      icon: Scale,
      color: '#0C3B2E',
      bgLight: '#F0FDF4',
      bgDark: '#1A2E27'
    },
    {
      label: t.activeCases,
      value: stats.activeCases || 0,
      trend: stats.activeCaseTrend || 0,
      icon: Clock,
      color: '#F59E0B',
      bgLight: '#FFFBEB',
      bgDark: '#2D2520'
    },
    {
      label: t.avgResolutionTime,
      value: `${stats.avgResolutionDays || 0} ${t.days}`,
      trend: -(stats.resolutionTrend || 0),
      icon: Clock,
      color: '#6366F1',
      bgLight: '#EEF2FF',
      bgDark: '#1E293B'
    },
    {
      label: t.urgentCases,
      value: stats.urgentCases || 0,
      trend: stats.urgentTrend || 0,
      icon: AlertTriangle,
      color: '#EF4444',
      bgLight: '#FEF2F2',
      bgDark: '#3A2626'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        const isDark = colors.bg === '#1A1D1F';
        
        return (
          <Card
            key={index}
            className="border-none shadow-lg hover:shadow-xl transition-all duration-300"
            style={{
              backgroundColor: colors.cardBg,
              borderLeft: `4px solid ${kpi.color}`
            }}
          >
            <CardContent className="p-3 md:p-4">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isDark ? kpi.bgDark : kpi.bgLight
                  }}
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: kpi.color }} />
                </div>
                {kpi.trend !== 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                    kpi.trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {kpi.trend > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(kpi.trend)}%
                  </div>
                )}
              </div>
              <p className="text-xs font-semibold mb-1 truncate" style={{ color: colors.textSecondary }}>
                {kpi.label}
              </p>
              <p className="text-xl md:text-2xl font-bold truncate" style={{ color: colors.textPrimary }}>
                {kpi.value}
              </p>
              {kpi.trend !== 0 && (
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  {t.vsLastMonth}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}