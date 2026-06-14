import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Loader2, ShieldAlert } from "lucide-react";
import AuthGuard from "../components/shared/AuthGuard";
import PageHeader from "../components/shared/PageHeader";
import { createPageUrl } from "@/utils";

function riskBucket(score) {
  if (score <= 30) return "low";
  if (score <= 60) return "medium";
  return "high";
}

function ScanAnalyticsContent() {
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = currentUser && (
    ['admin', 'super_admin', 'va'].includes(currentUser.role) ||
    ['admin', 'super_admin', 'va'].includes(currentUser.access_level)
  );

  const { data: scans = [], isLoading } = useQuery({
    queryKey: ["scanAnalytics"],
    queryFn: () => base44.entities.LeaseScan.list("-created_date", 1000),
    enabled: !!isAdmin,
  });

  const stats = useMemo(() => {
    const total = scans.length;
    const scored = scans.filter((s) => typeof s.risk_score === "number");
    const avg = scored.length
      ? Math.round(scored.reduce((sum, s) => sum + s.risk_score, 0) / scored.length)
      : 0;
    const buckets = { low: 0, medium: 0, high: 0 };
    scored.forEach((s) => { buckets[riskBucket(s.risk_score)] += 1; });
    const pct = (n) => (scored.length ? Math.round((n / scored.length) * 100) : 0);
    return { total, avg, buckets, pct };
  }, [scans]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Admin access required</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Scans", value: stats.total, color: "text-gray-900" },
    { label: "Avg Risk Score", value: stats.avg, color: "text-blue-600" },
    { label: "Low (0-30)", value: `${stats.buckets.low} · ${stats.pct(stats.buckets.low)}%`, color: "text-emerald-600" },
    { label: "Medium (31-60)", value: `${stats.buckets.medium} · ${stats.pct(stats.buckets.medium)}%`, color: "text-amber-600" },
    { label: "High (61-100)", value: `${stats.buckets.high} · ${stats.pct(stats.buckets.high)}%`, color: "text-red-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Scan Analytics"
          subtitle={`${stats.total} scans analyzed`}
          icon={BarChart3}
          iconColor="#0C3B2E"
          showBack
          backRoute={createPageUrl("AdminConsole")}
        />

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {statCards.map((c) => (
            <Card key={c.label} className="border-none shadow-md">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Scans table */}
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              Scan Records ({scans.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/80">
                      <th className="text-left p-3 font-semibold">Created</th>
                      <th className="text-center p-3 font-semibold">Risk Score</th>
                      <th className="text-center p-3 font-semibold">Flags</th>
                      <th className="text-left p-3 font-semibold">Summary</th>
                      <th className="text-left p-3 font-semibold">Lease ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scans.map((s) => (
                      <tr key={s.id} className="border-b hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 text-xs text-gray-600 whitespace-nowrap">
                          {s.created_date ? new Date(s.created_date).toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          {typeof s.risk_score === "number" ? s.risk_score : '—'}
                        </td>
                        <td className="p-3 text-center">{s.scan_full?.flags?.length ?? 0}</td>
                        <td className="p-3 text-xs text-gray-600 max-w-[320px]">
                          {s.summary ? `${s.summary.slice(0, 100)}${s.summary.length > 100 ? '…' : ''}` : '—'}
                        </td>
                        <td className="p-3 text-xs font-mono text-gray-500 truncate max-w-[160px]">
                          {s.lease_id || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {scans.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">No scans found</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ScanAnalytics() {
  return (
    <AuthGuard>
      <ScanAnalyticsContent />
    </AuthGuard>
  );
}