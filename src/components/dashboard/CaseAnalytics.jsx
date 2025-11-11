import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function CaseAnalytics({ cases, language = 'en' }) {
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  const colors = {
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#A8ABAD' : '#64748b',
    gridColor: isDarkMode ? '#3A3D40' : '#E5E7EB'
  };

  const strings = {
    en: {
      title: "Case Analytics",
      activeCases: "Active Cases",
      resolvedCases: "Resolved Cases",
      totalDisputed: "Total Disputed Amount",
      avgResolutionTime: "Avg Resolution Time",
      days: "days",
      casesByStatus: "Cases by Status",
      intake: "Intake",
      underReview: "Under Review",
      inProgress: "In Progress",
      resolved: "Resolved",
      closed: "Closed"
    },
    th: {
      title: "วิเคราะห์คดี",
      activeCases: "คดีที่ดำเนินการ",
      resolvedCases: "คดีที่แก้ไขแล้ว",
      totalDisputed: "จำนวนเงินพิพาททั้งหมด",
      avgResolutionTime: "เวลาแก้ไขเฉลี่ย",
      days: "วัน",
      casesByStatus: "คดีตามสถานะ",
      intake: "รับเข้า",
      underReview: "กำลังตรวจสอบ",
      inProgress: "กำลังดำเนินการ",
      resolved: "แก้ไขแล้ว",
      closed: "ปิดแล้ว"
    }
  };

  const t = strings[language];

  // Calculate metrics
  const activeCases = cases.filter(c => !['closed', 'resolved'].includes(c.status));
  const resolvedCases = cases.filter(c => ['closed', 'resolved'].includes(c.status));
  const totalDisputed = cases.reduce((sum, c) => sum + (c.dispute_amount || 0), 0);
  
  // Calculate average resolution time
  const resolvedWithDates = resolvedCases.filter(c => c.created_date && c.updated_date);
  const avgResolutionTime = resolvedWithDates.length > 0
    ? Math.round(resolvedWithDates.reduce((sum, c) => {
        const created = new Date(c.created_date);
        const updated = new Date(c.updated_date);
        return sum + (updated - created) / (1000 * 60 * 60 * 24);
      }, 0) / resolvedWithDates.length)
    : 0;

  // Status distribution
  const statusData = [
    { name: t.intake, value: cases.filter(c => c.status === 'intake').length, color: '#64748B' },
    { name: t.underReview, value: cases.filter(c => ['pending_review', 'under_review'].includes(c.status)).length, color: '#3B82F6' },
    { name: t.inProgress, value: cases.filter(c => ['in_progress', 'awaiting_landlord', 'client_review'].includes(c.status)).length, color: '#F59E0B' },
    { name: t.resolved, value: cases.filter(c => c.status === 'resolved').length, color: '#10B981' },
    { name: t.closed, value: cases.filter(c => c.status === 'closed').length, color: '#6B7280' }
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.gridColor}`,
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
            {payload[0].name}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl" style={{
          backgroundColor: colors.cardBg,
          borderLeft: '4px solid #3B82F6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
              {t.activeCases}
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{activeCases.length}</p>
        </div>

        <div className="p-4 rounded-xl" style={{
          backgroundColor: colors.cardBg,
          borderLeft: '4px solid #10B981',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
              {t.resolvedCases}
            </p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{resolvedCases.length}</p>
        </div>

        <div className="p-4 rounded-xl" style={{
          backgroundColor: colors.cardBg,
          borderLeft: '4px solid #C7A338',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-ls-gold" />
            <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
              {t.totalDisputed}
            </p>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#C7A338' }}>
            ฿{(totalDisputed / 1000).toFixed(0)}k
          </p>
        </div>

        <div className="p-4 rounded-xl" style={{
          backgroundColor: colors.cardBg,
          borderLeft: '4px solid #0C3B2E',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-ls-forest" />
            <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
              {t.avgResolutionTime}
            </p>
          </div>
          <p className="text-2xl font-bold text-ls-forest">
            {avgResolutionTime} {t.days}
          </p>
        </div>
      </div>

      {/* Pie Chart */}
      {statusData.length > 0 && (
        <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold" style={{ color: colors.textPrimary }}>
              {t.casesByStatus}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}