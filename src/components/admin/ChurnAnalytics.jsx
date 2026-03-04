import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Users, DollarSign, Shield, BarChart3 } from "lucide-react";
import { format } from "date-fns";

const PLAN_PRICES = { lite: 190, protect: 390, secure: 990 };

export default function ChurnAnalytics({ colors, language, isDarkMode }) {
  const { data: reasons = [], isLoading } = useQuery({
    queryKey: ['cancellationReasons'],
    queryFn: () => base44.entities.CancellationReason.list('-created_date', 200),
  });

  const isTh = language === 'th';

  // Calculate stats
  const totalAttempts = reasons.length;
  const cancelled = reasons.filter(r => r.outcome === 'cancelled');
  const downgraded = reasons.filter(r => r.outcome?.startsWith('downgraded'));
  const retentionRate = totalAttempts > 0 ? Math.round((downgraded.length / totalAttempts) * 100) : 0;
  const revenueRetained = downgraded.reduce((s, r) => s + (r.revenue_retained || 0), 0);
  const revenueLost = cancelled.reduce((s, r) => s + (r.subscription_value || 0), 0);

  // Reason breakdown
  const reasonCounts = {};
  reasons.forEach(r => {
    reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
  });
  const sortedReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);

  const reasonLabels = {
    too_expensive: isTh ? 'แพงเกินไป' : 'Too expensive',
    dont_need: isTh ? 'ไม่ต้องการอีกแล้ว' : "Don't need anymore",
    missing_features: isTh ? 'ขาดฟีเจอร์' : 'Missing features',
    found_alternative: isTh ? 'พบทางเลือกอื่น' : 'Found alternative',
    technical_issues: isTh ? 'ปัญหาทางเทคนิค' : 'Technical issues',
    poor_support: isTh ? 'บริการไม่ดี' : 'Poor support',
    difficult_to_use: isTh ? 'ใช้งานยาก' : 'Difficult to use',
    low_value: isTh ? 'คุณค่าไม่คุ้ม' : 'Low value',
    no_longer_renting: isTh ? 'ไม่ได้เช่าแล้ว' : 'No longer renting',
    other: isTh ? 'อื่นๆ' : 'Other',
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
        <CardContent className="p-8 text-center">
          <p style={{ color: colors.textSecondary }}>{isTh ? 'กำลังโหลด...' : 'Loading...'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg, borderLeft: '4px solid #EF4444' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{isTh ? 'ยกเลิกทั้งหมด' : 'Total Cancellations'}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{totalAttempts}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg, borderLeft: '4px solid #10B981' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{isTh ? 'อัตราการรักษา' : 'Retention Rate'}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#10B981' }}>{retentionRate}%</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg, borderLeft: '4px solid #C7A338' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{isTh ? 'รายได้ที่รักษาไว้' : 'Revenue Retained'}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#C7A338' }}>฿{revenueRetained.toLocaleString()}/mo</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg, borderLeft: '4px solid #6B7280' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{isTh ? 'รายได้ที่สูญเสีย' : 'Revenue Lost'}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#EF4444' }}>-฿{revenueLost.toLocaleString()}/mo</p>
          </CardContent>
        </Card>
      </div>

      {/* Reasons Breakdown */}
      <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <BarChart3 className="w-5 h-5 text-purple-600" />
            {isTh ? 'เหตุผลการยกเลิก' : 'Cancellation Reasons'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedReasons.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: colors.textSecondary }}>{isTh ? 'ยังไม่มีข้อมูล' : 'No data yet'}</p>
          ) : (
            <div className="space-y-3">
              {sortedReasons.map(([reasonKey, count]) => {
                const pct = totalAttempts > 0 ? Math.round((count / totalAttempts) * 100) : 0;
                return (
                  <div key={reasonKey} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{reasonLabels[reasonKey] || reasonKey}</span>
                        <span className="text-xs font-bold" style={{ color: colors.textSecondary }}>{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' }}>
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: '#0C3B2E', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Users className="w-5 h-5 text-blue-600" />
            {isTh ? 'เหตุการณ์ล่าสุด' : 'Recent Events'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reasons.slice(0, 15).map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{r.user_email}</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    {r.previous_tier?.toUpperCase()} → {r.outcome === 'cancelled' ? (isTh ? 'ยกเลิก' : 'Cancelled') : r.new_tier?.toUpperCase()}
                    {' · '}{reasonLabels[r.reason] || r.reason}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={r.outcome === 'cancelled' ? 'bg-red-100 text-red-700 text-xs' : 'bg-emerald-100 text-emerald-700 text-xs'}>
                    {r.outcome === 'cancelled' ? (isTh ? 'ยกเลิก' : 'Lost') : (isTh ? 'รักษาไว้' : 'Retained')}
                  </Badge>
                  <span className="text-xs" style={{ color: colors.textSecondary }}>
                    {r.created_date ? format(new Date(r.created_date), 'MMM d') : ''}
                  </span>
                </div>
              </div>
            ))}
            {reasons.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: colors.textSecondary }}>{isTh ? 'ยังไม่มีข้อมูล' : 'No cancellation events yet'}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}