import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Scale, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS = {
  intake: '#64748B',
  pending_review: '#F59E0B',
  under_review: '#3B82F6',
  ready_drafts: '#8B5CF6',
  client_review: '#EC4899',
  awaiting_landlord: '#10B981',
  in_progress: '#0EA5E9',
  resolved: '#10B981',
  closed: '#059669'
};

export default function CaseBreakdown({ cases = [], colors, language }) {
  const strings = {
    en: {
      caseBreakdown: "Case Status Breakdown",
      totalCases: "Total Cases",
      activeRate: "Active Rate",
      resolutionRate: "Resolution Rate",
      status: "Status",
      count: "Count"
    },
    th: {
      caseBreakdown: "สถิติสถานะคดี",
      totalCases: "คดีทั้งหมด",
      activeRate: "อัตราดำเนินการ",
      resolutionRate: "อัตราแก้ไข",
      status: "สถานะ",
      count: "จำนวน"
    },
    zh: {
      caseBreakdown: "案件状态分布",
      totalCases: "总案件数",
      activeRate: "活跃率",
      resolutionRate: "解决率",
      status: "状态",
      count: "数量"
    },
    ja: {
      caseBreakdown: "ケースステータス内訳",
      totalCases: "総ケース数",
      activeRate: "アクティブ率",
      resolutionRate: "解決率",
      status: "ステータス",
      count: "件数"
    },
    ko: {
      caseBreakdown: "사례 상태 분석",
      totalCases: "총 사례 수",
      activeRate: "활성 비율",
      resolutionRate: "해결 비율",
      status: "상태",
      count: "건수"
    }
  };

  const t = strings[language] || strings.en;

  const statusCounts = cases.reduce((acc, caseItem) => {
    const status = caseItem.status || 'intake';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
    color: STATUS_COLORS[status] || '#94A3B8'
  }));

  const totalCases = cases.length;
  const activeCases = cases.filter(c => !['closed', 'resolved'].includes(c.status)).length;
  const resolvedCases = cases.filter(c => c.status === 'closed' || c.status === 'resolved').length;
  const activeRate = totalCases > 0 ? Math.round((activeCases / totalCases) * 100) : 0;
  const resolutionRate = totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="p-3 rounded-lg shadow-lg border"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.borderColor
          }}
        >
          <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
            {payload[0].name}
          </p>
          <p className="text-sm" style={{ color: payload[0].payload.color }}>
            {t.count}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const casesText = {
    en: 'cases',
    th: 'คดี',
    zh: '案件',
    ja: 'ケース',
    ko: '사례'
  };

  const noDataText = {
    en: 'No data',
    th: 'ไม่มีข้อมูล',
    zh: '无数据',
    ja: 'データなし',
    ko: '데이터 없음'
  };

  return (
    <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg" style={{ color: colors.textPrimary }}>
          <Scale className="w-5 h-5 text-ls-forest" />
          {t.caseBreakdown}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 overflow-x-hidden">
        <div className="grid grid-cols-1 gap-6">
          <div className="w-full overflow-hidden flex justify-center">
            {chartData.length > 0 ? (
              <div style={{ width: '100%', maxWidth: '350px', height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p style={{ color: colors.textSecondary }}>{noDataText[language] || noDataText.en}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              className="p-4 rounded-xl"
              style={{
                backgroundColor: colors.bg === '#1A1D1F' ? '#353A3D' : '#F8FAFC',
                border: `2px solid ${colors.borderColor}`
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold truncate" style={{ color: colors.textSecondary }}>
                  {t.totalCases}
                </span>
                <Scale className="w-4 h-4 text-ls-forest flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                {totalCases}
              </p>
            </div>

            <div
              className="p-4 rounded-xl"
              style={{
                backgroundColor: colors.bg === '#1A1D1F' ? '#1E3A5F' : '#EFF6FF',
                border: `2px solid #3B82F6`
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold truncate" style={{ color: colors.textSecondary }}>
                  {t.activeRate}
                </span>
                <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                {activeRate}%
              </p>
              <p className="text-xs mt-1 truncate" style={{ color: colors.textSecondary }}>
                {activeCases} {casesText[language] || casesText.en}
              </p>
            </div>

            <div
              className="p-4 rounded-xl"
              style={{
                backgroundColor: colors.bg === '#1A1D1F' ? '#1A2E27' : '#F0FDF4',
                border: `2px solid #10B981`
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold truncate" style={{ color: colors.textSecondary }}>
                  {t.resolutionRate}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                {resolutionRate}%
              </p>
              <p className="text-xs mt-1 truncate" style={{ color: colors.textSecondary }}>
                {resolvedCases} {casesText[language] || casesText.en}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${colors.borderColor}` }}>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Badge
                key={status}
                className="text-xs whitespace-nowrap"
                style={{
                  backgroundColor: `${STATUS_COLORS[status]}20`,
                  color: STATUS_COLORS[status],
                  border: `1px solid ${STATUS_COLORS[status]}40`
                }}
              >
                {status.replace(/_/g, ' ')}: {count}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}