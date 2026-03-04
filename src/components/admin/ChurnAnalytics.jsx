import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TrendingDown, TrendingUp, Users, DollarSign, BarChart3, Loader2 } from "lucide-react";

const REASON_LABELS = {
  too_expensive: "Too expensive",
  dont_need: "Don't need it anymore",
  missing_features: "Missing features",
  found_alternative: "Found alternative",
  technical_issues: "Technical issues",
  poor_support: "Poor support",
  difficult_to_use: "Difficult to use",
  low_value: "Low value for price",
  no_longer_renting: "No longer renting",
  other: "Other",
};

export default function ChurnAnalytics({ colors, language }) {
  const { data: reasons = [], isLoading } = useQuery({
    queryKey: ["cancellationReasons"],
    queryFn: () => base44.entities.CancellationReason.list("-created_date", 200),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.textSecondary }} />
        </CardContent>
      </Card>
    );
  }

  // Compute stats
  const now = new Date();
  const thisMonth = reasons.filter(r => {
    const d = new Date(r.created_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const total = thisMonth.length;
  const cancelled = thisMonth.filter(r => r.outcome === "cancelled").length;
  const retained = thisMonth.filter(r => r.outcome !== "cancelled").length;
  const retentionRate = total > 0 ? Math.round((retained / total) * 100) : 0;

  const revenueLost = thisMonth.filter(r => r.outcome === "cancelled").reduce((sum, r) => sum + (r.subscription_value_lost || 0), 0);
  const revenueRetained = thisMonth.filter(r => r.outcome !== "cancelled").reduce((sum, r) => sum + (r.subscription_value_retained || 0), 0);

  // Reason breakdown
  const reasonCounts = {};
  thisMonth.forEach(r => { reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1; });
  const sortedReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);

  // Retention offer performance
  const offerStats = {};
  thisMonth.filter(r => r.outcome !== "cancelled").forEach(r => {
    const key = `${r.previous_tier} → ${r.new_tier || "explorer"}`;
    offerStats[key] = (offerStats[key] || 0) + 1;
  });

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Cancellation Attempts", value: total, icon: Users, color: "#EF4444" },
          { label: "Retention Rate", value: `${retentionRate}%`, icon: TrendingUp, color: "#10B981" },
          { label: "Revenue Lost", value: `฿${revenueLost.toLocaleString()}/mo`, icon: TrendingDown, color: "#EF4444" },
          { label: "Revenue Retained", value: `฿${revenueRetained.toLocaleString()}/mo`, icon: DollarSign, color: "#10B981" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className="border-none shadow-md" style={{ backgroundColor: colors.cardBg, borderLeft: `4px solid ${kpi.color}` }}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                  <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{kpi.label}</span>
                </div>
                <p className="text-xl font-bold" style={{ color: colors.textPrimary }}>{kpi.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reason breakdown */}
      <Card className="border-none shadow-md" style={{ backgroundColor: colors.cardBg }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <BarChart3 className="w-4 h-4" /> Top Cancellation Reasons (This Month)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedReasons.length === 0 ? (
            <p className="text-sm" style={{ color: colors.textSecondary }}>No data yet this month</p>
          ) : (
            <div className="space-y-2">
              {sortedReasons.map(([key, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>{REASON_LABELS[key] || key}</span>
                        <span className="text-xs font-bold" style={{ color: colors.textSecondary }}>{pct}% ({count})</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ backgroundColor: colors.borderColor }}>
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: "#EF4444", transition: "width 0.3s" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Retention offer performance */}
      {Object.keys(offerStats).length > 0 && (
        <Card className="border-none shadow-md" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Retention Offer Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(offerStats).map(([key, count]) => (
                <div key={key} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: colors.fieldBg || (colors.bg === '#111827' ? '#1F2937' : '#F8FAFC') }}>
                  <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{key}</span>
                  <Badge className="bg-emerald-100 text-emerald-700">{count} retained</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue impact summary */}
      <Card className="border-none shadow-md" style={{ backgroundColor: colors.cardBg, borderLeft: "4px solid #C7A338" }}>
        <CardContent className="p-4">
          <p className="text-sm font-bold mb-2" style={{ color: colors.textPrimary }}>Revenue Impact (This Month)</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-red-500">-฿{revenueLost.toLocaleString()}</p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>Lost</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600">+฿{revenueRetained.toLocaleString()}</p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>Retained</p>
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: (revenueLost - revenueRetained) > 0 ? "#EF4444" : "#10B981" }}>
                {(revenueLost - revenueRetained) > 0 ? "-" : "+"}฿{Math.abs(revenueLost - revenueRetained).toLocaleString()}
              </p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>Net</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}