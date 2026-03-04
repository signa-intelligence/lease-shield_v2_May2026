import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, DollarSign, Users, BarChart3, CheckCircle2, XCircle } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";

const TIER_PRICES = { secure: 990, protect: 390, lite: 190, free: 0 };

const REASON_LABELS = {
  too_expensive: { en: 'Too expensive', th: 'แพงเกินไป' },
  dont_need: { en: "Don't need anymore", th: 'ไม่ต้องการแล้ว' },
  missing_features: { en: 'Missing features', th: 'ขาดฟีเจอร์' },
  found_alternative: { en: 'Found alternative', th: 'พบทางเลือก' },
  technical_issues: { en: 'Technical issues', th: 'ปัญหาเทคนิค' },
  poor_support: { en: 'Poor support', th: 'บริการไม่ดี' },
  difficult_to_use: { en: 'Difficult to use', th: 'ใช้งานยาก' },
  low_value: { en: 'Low value', th: 'ไม่คุ้มค่า' },
  no_longer_renting: { en: 'No longer renting', th: 'ไม่ได้เช่าแล้ว' },
  other: { en: 'Other', th: 'อื่นๆ' }
};

export default function ChurnAnalytics({ colors, language, isDarkMode }) {
  const isTh = language === 'th';

  const { data: reasons = [] } = useQuery({
    queryKey: ['cancellationReasons'],
    queryFn: () => base44.entities.CancellationReason.list('-created_date', 200),
    staleTime: 60000
  });

  const thisMonth = startOfMonth(new Date());
  const lastMonth = startOfMonth(subMonths(new Date(), 1));

  const thisMonthReasons = reasons.filter(r => new Date(r.created_date) >= thisMonth);
  const lastMonthReasons = reasons.filter(r => { const d = new Date(r.created_date); return d >= lastMonth && d < thisMonth; });

  const total = thisMonthReasons.length;
  const cancelled = thisMonthReasons.filter(r => r.outcome === 'cancelled').length;
  const retained = total - cancelled;
  const retentionRate = total > 0 ? Math.round((retained / total) * 100) : 0;

  const revenueLost = thisMonthReasons.filter(r => r.outcome === 'cancelled').reduce((sum, r) => sum + (r.subscription_value || 0), 0);
  const revenueRetained = thisMonthReasons.filter(r => r.outcome !== 'cancelled').reduce((sum, r) => sum + (r.revenue_retained || 0), 0);

  // Reason breakdown
  const reasonCounts = {};
  thisMonthReasons.forEach(r => { reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1; });
  const sortedReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);

  // Retention by path
  const downgradePaths = {};
  thisMonthReasons.filter(r => r.outcome !== 'cancelled').forEach(r => {
    const key = `${r.previous_tier} → ${r.new_tier || 'explorer'}`;
    downgradePaths[key] = (downgradePaths[key] || 0) + 1;
  });

  const cardStyle = { backgroundColor: colors?.cardBg || '#fff', border: 'none' };

  return (
    <Card className="mb-6 shadow-lg" style={cardStyle}>
      <CardHeader style={{ borderBottom: `1px solid ${colors?.borderColor}` }}>
        <CardTitle className="flex items-center gap-2" style={{ color: colors?.textPrimary }}>
          <TrendingDown className="w-5 h-5 text-red-500" />
          {isTh ? 'วิเคราะห์การยกเลิก' : 'Cancellation Analytics'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {total === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: colors?.textSecondary }}>
            {isTh ? 'ยังไม่มีข้อมูลการยกเลิกเดือนนี้' : 'No cancellation data this month'}
          </p>
        ) : (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC', border: `1px solid ${colors?.borderColor}` }}>
                <p className="text-xs mb-1" style={{ color: colors?.textSecondary }}>{isTh ? 'ยกเลิกเดือนนี้' : 'This Month'}</p>
                <p className="text-2xl font-bold" style={{ color: colors?.textPrimary }}>{total}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#ECFDF5', border: '1px solid #86EFAC' }}>
                <p className="text-xs mb-1" style={{ color: '#166534' }}>{isTh ? 'อัตราการรักษา' : 'Retention Rate'}</p>
                <p className="text-2xl font-bold" style={{ color: '#059669' }}>{retentionRate}%</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FEF2F2', border: '1px solid #FECACA' }}>
                <p className="text-xs mb-1" style={{ color: '#991B1B' }}>{isTh ? 'รายได้ที่เสีย' : 'Revenue Lost'}</p>
                <p className="text-2xl font-bold" style={{ color: '#EF4444' }}>฿{revenueLost.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F0FDF4', border: '1px solid #86EFAC' }}>
                <p className="text-xs mb-1" style={{ color: '#166534' }}>{isTh ? 'รายได้ที่รักษา' : 'Revenue Retained'}</p>
                <p className="text-2xl font-bold" style={{ color: '#10B981' }}>฿{revenueRetained.toLocaleString()}</p>
              </div>
            </div>

            {/* Reason breakdown */}
            <div>
              <h4 className="text-sm font-bold mb-3" style={{ color: colors?.textPrimary }}>
                {isTh ? 'เหตุผลการยกเลิก' : 'Top Cancellation Reasons'}
              </h4>
              <div className="space-y-2">
                {sortedReasons.map(([key, count]) => {
                  const pct = Math.round((count / total) * 100);
                  const label = REASON_LABELS[key]?.[language] || REASON_LABELS[key]?.en || key;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm" style={{ color: colors?.textPrimary }}>{label}</span>
                          <span className="text-xs font-bold" style={{ color: colors?.textSecondary }}>{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' }}>
                          <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: '#EF4444', transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Retention paths */}
            {Object.keys(downgradePaths).length > 0 && (
              <div>
                <h4 className="text-sm font-bold mb-3" style={{ color: colors?.textPrimary }}>
                  {isTh ? 'เส้นทางการรักษา' : 'Retention Offer Performance'}
                </h4>
                <div className="space-y-2">
                  {Object.entries(downgradePaths).map(([path, count]) => (
                    <div key={path} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F0FDF4' }}>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium" style={{ color: colors?.textPrimary }}>{path}</span>
                      </div>
                      <Badge style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>{count} {isTh ? 'คน' : 'users'}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Net impact */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFBEB', border: '2px solid #FDE68A' }}>
              <h4 className="text-sm font-bold mb-2" style={{ color: colors?.textPrimary }}>
                {isTh ? 'ผลกระทบสุทธิ' : 'Net Revenue Impact'}
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs" style={{ color: colors?.textSecondary }}>{isTh ? 'ยกเลิก' : 'Cancellations'}</p>
                  <p className="font-bold text-red-500">-฿{revenueLost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: colors?.textSecondary }}>{isTh ? 'รักษาไว้' : 'Retained'}</p>
                  <p className="font-bold text-emerald-500">+฿{revenueRetained.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: colors?.textSecondary }}>{isTh ? 'สุทธิ' : 'Net Churn'}</p>
                  <p className="font-bold" style={{ color: '#C7A338' }}>-฿{(revenueLost - revenueRetained).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}