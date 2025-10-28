import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Shield, FileText, Wallet, Scale, AlertTriangle, TrendingUp } from "lucide-react";
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
      tagline: "Fair. Transparent. Protected.",
      subtitle: "Prevent rental problems before they happen.",
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
      tagline: "ยุติธรรม โปร่งใส ปลอดภัย",
      subtitle: "ป้องกันปัญหาการเช่าก่อนที่จะเกิดขึ้น",
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
          <div className="flex items-center gap-3 mb-3">
            <div className="px-3 py-1 bg-ls-stone border border-ls-forest/20 rounded-full">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-ls-forest" />
                <span className="text-sm font-semibold text-ls-forest">{strings.tagline}</span>
              </div>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-ls-charcoal mb-2">
            {strings.welcome}, {user?.full_name?.split(' ')[0] || 'User'}
          </h1>
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

        {/* Quick Actions - FIXED with inline styles */}
        <div style={{
          background: 'linear-gradient(to right, #0C3B2E, #047857)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#FFFFFF',
                marginBottom: '8px'
              }}>
                {strings.protectRights}
              </h2>
              <p style={{
                fontSize: '16px',
                color: '#D1FAE5',
                lineHeight: '1.5'
              }}>
                {strings.uploadCta}
              </p>
            </div>
            <Link to={createPageUrl("UploadScan")}>
              <button
                style={{
                  backgroundColor: '#C7A338',
                  color: '#1A1D1F',
                  padding: '14px 32px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d4af37'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#C7A338'}
              >
                {strings.uploadLease}
              </button>
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

        {/* Upgrade Banner - FIXED with inline styles */}
        {user?.plan_tier === 'free' && (
          <div style={{
            marginTop: '32px',
            background: 'linear-gradient(to right, #C7A338, #d97706)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '24px',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <TrendingUp style={{ width: '24px', height: '24px', color: '#1A1D1F' }} />
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#1A1D1F'
                  }}>
                    {strings.upgradePremium}
                  </h3>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#292524',
                  opacity: 0.8
                }}>
                  {strings.upgradeDesc}
                </p>
              </div>
              <Link to={createPageUrl("Account")}>
                <button
                  style={{
                    backgroundColor: '#0C3B2E',
                    color: '#FFFFFF',
                    padding: '14px 32px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                >
                  {strings.viewPlans}
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}