import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Download, Search, FileText, Scale, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { subDays, isAfter, format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const BUCKETS = [
  { label: "0–10", min: 0, max: 10, color: "#10B981" },
  { label: "11–25", min: 11, max: 25, color: "#3B82F6" },
  { label: "26–50", min: 26, max: 50, color: "#8B5CF6" },
  { label: "51–100", min: 51, max: 100, color: "#F59E0B" },
  { label: "101–200", min: 101, max: 200, color: "#F97316" },
  { label: "200+", min: 201, max: Infinity, color: "#EF4444" },
];

function computeMedian(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export default function ScanUsageAnalytics({ users, leases, colors, language, isDarkMode }) {
  const [rangeDays, setRangeDays] = useState(30);

  const analytics = useMemo(() => {
    const cutoff = subDays(new Date(), rangeDays);

    // Leases in range (each lease = 1 scan)
    const recentLeases = leases.filter(l => isAfter(new Date(l.created_date), cutoff));

    // Build per-user scan counts
    const userScanMap = {};
    recentLeases.forEach(l => {
      const email = l.owner_email || l.created_by;
      if (email) userScanMap[email] = (userScanMap[email] || 0) + 1;
    });

    // Identify secure users
    const secureUsers = users.filter(u => u.plan_tier === 'secure');
    const secureEmails = new Set(secureUsers.map(u => u.email));

    const secureScanCounts = secureUsers.map(u => userScanMap[u.email] || 0);
    const totalSecureScans = secureScanCounts.reduce((s, v) => s + v, 0);
    const avgSecure = secureUsers.length > 0 ? Math.round(totalSecureScans / secureUsers.length * 10) / 10 : 0;
    const medianSecure = computeMedian(secureScanCounts);

    // Distribution buckets (secure only)
    const distribution = BUCKETS.map(b => ({
      ...b,
      count: secureScanCounts.filter(v => v >= b.min && v <= b.max).length,
    }));

    const under50 = secureScanCounts.filter(v => v <= 50).length;
    const pctUnder50 = secureUsers.length > 0 ? Math.round((under50 / secureUsers.length) * 100) : 0;

    // High usage users (all tiers, sorted desc)
    const highUsage = Object.entries(userScanMap)
      .filter(([, count]) => count > 20)
      .map(([email, count]) => {
        const u = users.find(usr => usr.email === email);
        // Compute monthly averages for abuse detection
        const now = new Date();
        const m1Start = startOfMonth(subMonths(now, 0));
        const m2Start = startOfMonth(subMonths(now, 1));
        const m2End = endOfMonth(subMonths(now, 1));
        const m3Start = startOfMonth(subMonths(now, 2));
        const m3End = endOfMonth(subMonths(now, 2));

        const userLeases = leases.filter(l => (l.owner_email || l.created_by) === email);
        const thisMonth = userLeases.filter(l => isAfter(new Date(l.created_date), m1Start)).length;
        const lastMonth = userLeases.filter(l => {
          const d = new Date(l.created_date);
          return d >= m2Start && d <= m2End;
        }).length;
        const twoMonthsAgo = userLeases.filter(l => {
          const d = new Date(l.created_date);
          return d >= m3Start && d <= m3End;
        }).length;
        const avgMonthly = Math.round((thisMonth + lastMonth + twoMonthsAgo) / 3);

        // Abuse flags
        const flags = [];
        if (count > 500) flags.push({ type: 'extreme_usage', severity: 'high', message: '500+ scans in period' });
        else if (count > 200) flags.push({ type: 'very_high', severity: 'high', message: '200+ scans in period' });
        if (thisMonth > avgMonthly * 5 && avgMonthly > 0) flags.push({ type: 'usage_spike', severity: 'medium', message: '5× average spike' });
        if (count > 200 && u?.subscription_status === 'cancelled') flags.push({ type: 'dump_and_cancel', severity: 'high', message: 'High usage + cancelled' });

        return {
          email,
          full_name: u?.full_name || email,
          plan_tier: u?.plan_tier || 'unknown',
          subscription_status: u?.subscription_status || 'unknown',
          scans: count,
          thisMonth,
          lastMonth,
          twoMonthsAgo,
          flags,
        };
      })
      .sort((a, b) => b.scans - a.scans);

    return {
      totalScans: recentLeases.length,
      totalSecureScans,
      avgSecure,
      medianSecure,
      secureUserCount: secureUsers.length,
      distribution,
      pctUnder50,
      highUsage,
    };
  }, [users, leases, rangeDays]);

  const handleExportCSV = () => {
    const rows = [["Email", "Name", "Tier", "Status", `Scans (${rangeDays}d)`, "This Month", "Last Month", "2Mo Ago", "Flags"]];
    analytics.highUsage.forEach(u => {
      rows.push([
        u.email, u.full_name, u.plan_tier, u.subscription_status,
        u.scans, u.thisMonth, u.lastMonth, u.twoMonthsAgo,
        u.flags.map(f => f.message).join('; ')
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan_usage_${rangeDays}d_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const t = language === 'th' ? {
    title: "วิเคราะห์การใช้งานสแกน",
    totalScans: "สแกนทั้งหมด",
    secureScans: "สแกน Secure",
    avgSecure: "เฉลี่ยต่อ Secure",
    medianSecure: "มัธยฐาน Secure",
    allTiers: "ทุกแพ็กเกจ",
    unlimitedTier: "แพ็กเกจ Unlimited",
    perPeriod: "ต่อช่วง",
    distribution: "การกระจายการสแกน (Secure)",
    highUsage: "ผู้ใช้งานสูง",
    days: "วัน",
    users: "ผู้ใช้",
    export: "ส่งออก CSV",
    insight: "ของผู้ใช้ Secure ใช้น้อยกว่า 50 สแกน/เดือน",
    noHighUsage: "ไม่มีผู้ใช้งานสูงในช่วงนี้",
  } : {
    title: "Scan Usage Analytics",
    totalScans: "Total Scans",
    secureScans: "Secure Tier Scans",
    avgSecure: "Avg per Secure User",
    medianSecure: "Median Secure User",
    allTiers: "All tiers",
    unlimitedTier: "Unlimited tier",
    perPeriod: "per period",
    distribution: "Scan Distribution (Secure Tier)",
    highUsage: "High Usage Users",
    days: "Days",
    users: "users",
    export: "Export CSV",
    insight: "of Secure users use under 50 scans/month",
    noHighUsage: "No high usage users in this period",
  };

  return (
    <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg, borderLeft: '6px solid #0EA5E9' }}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Search className="w-5 h-5 text-sky-600" />
            {t.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {[30, 60, 90].map(d => (
              <Button
                key={d}
                size="sm"
                variant={rangeDays === d ? "default" : "outline"}
                onClick={() => setRangeDays(d)}
                className={rangeDays === d ? "bg-sky-600 hover:bg-sky-700 text-white" : ""}
                style={rangeDays !== d ? { borderColor: colors.borderColor } : {}}
              >
                {d} {t.days}
              </Button>
            ))}
            <Button size="sm" variant="outline" onClick={handleExportCSV} className="gap-1" style={{ borderColor: colors.borderColor }}>
              <Download className="w-3.5 h-3.5" /> {t.export}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: t.totalScans, value: analytics.totalScans, sub: t.allTiers, icon: Shield, color: '#0EA5E9', bg: '#F0F9FF' },
            { label: t.secureScans, value: analytics.totalSecureScans, sub: `${analytics.secureUserCount} ${t.users}`, icon: Scale, color: '#8B5CF6', bg: '#F5F3FF' },
            { label: t.avgSecure, value: analytics.avgSecure, sub: t.perPeriod, icon: TrendingUp, color: '#F59E0B', bg: '#FFFBEB' },
            { label: t.medianSecure, value: analytics.medianSecure, sub: t.perPeriod, icon: Users, color: '#10B981', bg: '#F0FDF4' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="p-3 rounded-xl" style={{
                backgroundColor: isDarkMode ? '#2A2D30' : s.bg,
                border: `1px solid ${isDarkMode ? colors.borderColor : 'transparent'}`
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                  <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{s.label}</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{s.value}</p>
                <p className="text-[11px]" style={{ color: colors.textSecondary }}>{s.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Distribution Chart */}
        {analytics.secureUserCount > 0 && (
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>{t.distribution}</p>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.distribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#3A3D40' : '#E5E7EB'} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.textSecondary }} />
                  <YAxis tick={{ fontSize: 11, fill: colors.textSecondary }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor, borderRadius: 8, fontSize: 12 }}
                    formatter={(value) => [`${value} users`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {analytics.distribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs mt-2 text-center" style={{ color: colors.textSecondary }}>
              <strong style={{ color: '#10B981' }}>{analytics.pctUnder50}%</strong> {t.insight}
            </p>
          </div>
        )}

        {/* High Usage Table */}
        <div>
          <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            {t.highUsage} ({rangeDays}d)
          </p>
          {analytics.highUsage.length === 0 ? (
            <p className="text-sm p-4 rounded-lg text-center" style={{ color: colors.textSecondary, backgroundColor: isDarkMode ? '#2A2D30' : '#F8FAFC' }}>
              {t.noHighUsage}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: colors.borderColor }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                    <th className="text-left p-2.5 text-xs font-semibold" style={{ color: colors.textSecondary }}>User</th>
                    <th className="text-center p-2.5 text-xs font-semibold" style={{ color: colors.textSecondary }}>Tier</th>
                    <th className="text-center p-2.5 text-xs font-semibold" style={{ color: colors.textSecondary }}>Scans</th>
                    <th className="text-center p-2.5 text-xs font-semibold hidden sm:table-cell" style={{ color: colors.textSecondary }}>Mo / Mo-1 / Mo-2</th>
                    <th className="text-center p-2.5 text-xs font-semibold" style={{ color: colors.textSecondary }}>Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.highUsage.slice(0, 15).map((u, idx) => (
                    <tr key={u.email} style={{
                      borderTop: `1px solid ${colors.borderColor}`,
                      backgroundColor: idx % 2 === 0 ? colors.cardBg : (isDarkMode ? '#2A2D30' : '#FAFAFA')
                    }}>
                      <td className="p-2.5">
                        <p className="font-medium text-xs truncate max-w-[160px]" style={{ color: colors.textPrimary }}>{u.full_name}</p>
                        <p className="text-[10px] truncate max-w-[160px]" style={{ color: colors.textSecondary }}>{u.email}</p>
                      </td>
                      <td className="p-2.5 text-center">
                        <Badge className={
                          u.plan_tier === 'secure' ? 'bg-purple-100 text-purple-700' :
                          u.plan_tier === 'protect' ? 'bg-blue-100 text-blue-700' :
                          u.plan_tier === 'lite' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {u.plan_tier}
                        </Badge>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`font-bold text-sm ${
                          u.scans > 500 ? 'text-red-600' : u.scans > 200 ? 'text-orange-500' : u.scans > 100 ? 'text-amber-600' : ''
                        }`} style={u.scans <= 100 ? { color: colors.textPrimary } : {}}>
                          {u.scans}
                        </span>
                        {u.scans > 500 && <Badge className="ml-1 bg-red-100 text-red-700 text-[9px]">EXTREME</Badge>}
                        {u.scans > 200 && u.scans <= 500 && <Badge className="ml-1 bg-orange-100 text-orange-700 text-[9px]">HIGH</Badge>}
                      </td>
                      <td className="p-2.5 text-center hidden sm:table-cell">
                        <span className="font-mono text-xs" style={{ color: colors.textSecondary }}>
                          {u.thisMonth} / {u.lastMonth} / {u.twoMonthsAgo}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        {u.flags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {u.flags.map((f, fi) => (
                              <Badge key={fi} className={`text-[9px] ${
                                f.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {f.message}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px]" style={{ color: colors.textSecondary }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}