import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Shield, FileText, Wallet, Scale, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import StatsCard from "../components/dashboard/StatsCard";
import DepositAlert from "../components/dashboard/DepositAlert";
import RecentLeases from "../components/dashboard/RecentLeases";

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }, '-created_date', 10),
    enabled: !!user,
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const activeDeposits = deposits.filter(d => d.status === 'tracking');
  const activeCases = cases.filter(c => !['closed'].includes(c.status));

  const t = {
    en: {
      welcome: "Welcome back",
      subtitle: "Your rental protection dashboard",
      activeLeases: "Active Leases",
      depositsTracked: "Deposits Tracked",
      activeCases: "Active Cases",
      protectionScore: "Protection Score",
      protectRights: "Protect Your Rights",
      uploadCta: "Upload your lease for instant AI-powered analysis and risk assessment",
      uploadLease: "Upload Lease",
      upgradePremium: "Upgrade to Premium",
      upgradeDesc: "Get unlimited lease scans, priority case handling, and expert legal support",
      viewPlans: "View Plans",
      thisMonth: "this month"
    },
    th: {
      welcome: "ยินดีต้อนรับกลับมา",
      subtitle: "แดชบอร์ดการปกป้องสิทธิ์การเช่าของคุณ",
      activeLeases: "สัญญาเช่าที่ใช้งาน",
      depositsTracked: "เงินมัดจำที่ติดตาม",
      activeCases: "คดีที่ดำเนินการ",
      protectionScore: "คะแนนการป้องกัน",
      protectRights: "ปกป้องสิทธิ์ของคุณ",
      uploadCta: "อัปโหลดสัญญาเช่าเพื่อรับการวิเคราะห์และประเมินความเสี่ยงด้วย AI",
      uploadLease: "อัปโหลดสัญญาเช่า",
      upgradePremium: "อัปเกรดเป็นพรีเมียม",
      upgradeDesc: "รับการสแกนสัญญาไม่จำกัด การจัดการคดีแบบเร่งด่วน และการสนับสนุนจากผู้เชี่ยวชาญ",
      viewPlans: "ดูแผน",
      thisMonth: "เดือนนี้"
    }
  };

  const strings = t[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ls-stone via-white to-ls-stone">
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-ls-forest" />
            <h1 className="text-3xl md:text-4xl font-bold text-ls-charcoal">
              {strings.welcome}, {user?.full_name?.split(' ')[0] || 'User'}
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            {strings.subtitle}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title={strings.activeLeases}
            value={leases.length}
            icon={FileText}
            bgGradient="bg-gradient-to-br from-ls-forest to-emerald-800"
            trend={`+2 ${strings.thisMonth}`}
            trendUp={true}
          />
          <StatsCard
            title={strings.depositsTracked}
            value={`฿${activeDeposits.reduce((sum, d) => sum + d.deposit_amount, 0).toLocaleString()}`}
            icon={Wallet}
            bgGradient="bg-gradient-to-br from-ls-gold to-amber-600"
          />
          <StatsCard
            title={strings.activeCases}
            value={activeCases.length}
            icon={Scale}
            bgGradient="bg-gradient-to-br from-ls-charcoal to-slate-700"
          />
          <StatsCard
            title={strings.protectionScore}
            value="85%"
            icon={Shield}
            bgGradient="bg-gradient-to-br from-emerald-600 to-emerald-700"
            trend="+5%"
            trendUp={true}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-ls-forest to-emerald-800 rounded-2xl p-6 md:p-8 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-2">{strings.protectRights}</h2>
              <p className="text-emerald-50 text-sm md:text-base">
                {strings.uploadCta}
              </p>
            </div>
            <Link to={createPageUrl("UploadScan")}>
              <Button size="lg" className="bg-ls-gold hover:bg-amber-600 text-ls-charcoal shadow-lg font-semibold px-8">
                {strings.uploadLease}
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentLeases leases={leases} language={language} />
          </div>
          <div>
            <DepositAlert deposits={deposits} language={language} />
          </div>
        </div>

        {/* Upgrade Banner */}
        {user?.plan_tier === 'free' && (
          <div className="mt-8 bg-gradient-to-r from-ls-gold to-amber-600 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-ls-charcoal">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-6 h-6" />
                  <h3 className="text-xl font-bold">{strings.upgradePremium}</h3>
                </div>
                <p className="text-ls-charcoal/80 text-sm">
                  {strings.upgradeDesc}
                </p>
              </div>
              <Link to={createPageUrl("Account")}>
                <Button size="lg" className="bg-ls-forest hover:bg-emerald-900 text-white shadow-lg font-semibold px-8">
                  {strings.viewPlans}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}