import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Shield, FileText, Wallet, Scale, AlertTriangle, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { differenceInDays } from "date-fns";

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

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: maintenanceRequests = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => base44.entities.MaintenanceRequest.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  // Calculate Protection Score
  const calculateProtectionScore = () => {
    let score = 0;
    let breakdown = {
      documentation: 0,
      activeProtections: 0,
      proactiveActions: 0
    };

    // 1. Documentation Completeness (40 points max)
    const scannedLeases = leases.filter(l => l.status === 'scanned' || l.status === 'paid');
    if (scannedLeases.length > 0) breakdown.documentation += 15;
    if (deposits.length > 0) breakdown.documentation += 10;
    if (documents.length > 0) breakdown.documentation += 10;
    if (documents.length >= 5) breakdown.documentation += 5;

    // 2. Active Protections (30 points max)
    const activeDeposits = deposits.filter(d => d.status === 'tracking');
    if (activeDeposits.length > 0) breakdown.activeProtections += 10;
    
    const rentAlertsEnabled = deposits.some(d => d.rent_alerts_enabled);
    if (rentAlertsEnabled) breakdown.activeProtections += 7;
    
    if (maintenanceRequests.length > 0) breakdown.activeProtections += 6;
    
    if (user?.email_notifications || user?.line_notifications) breakdown.activeProtections += 7;

    // 3. Proactive Actions (30 points max)
    const now = new Date();
    const recentLeases = leases.filter(l => {
      const daysSinceCreated = differenceInDays(now, new Date(l.created_date));
      return daysSinceCreated <= 90;
    });
    if (recentLeases.length > 0) breakdown.proactiveActions += 10;

    const recentDeposits = deposits.filter(d => {
      const daysSinceCreated = differenceInDays(now, new Date(d.created_date));
      return daysSinceCreated <= 90;
    });
    if (recentDeposits.length > 0) breakdown.proactiveActions += 8;

    const recentDocuments = documents.filter(doc => {
      const daysSinceCreated = differenceInDays(now, new Date(doc.created_date));
      return daysSinceCreated <= 30;
    });
    if (recentDocuments.length > 0) breakdown.proactiveActions += 7;

    if (recentDocuments.length >= 3) breakdown.proactiveActions += 5;

    score = breakdown.documentation + breakdown.activeProtections + breakdown.proactiveActions;
    
    return { score, breakdown };
  };

  // Get color and status based on protection score
  const getProtectionScoreColor = (score) => {
    if (score >= 85) return '#10B981';
    if (score >= 70) return '#EAB308';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getProtectionScoreStatus = (score) => {
    const statuses = {
      en: {
        excellent: 'Excellent Protection',
        good: 'Good Protection',
        fair: 'Needs Improvement',
        poor: 'Attention Required'
      },
      th: {
        excellent: 'การป้องกันที่ยอดเยี่ยม',
        good: 'การป้องกันที่ดี',
        fair: 'ต้องการปรับปรุง',
        poor: 'ต้องการความสนใจ'
      }
    };

    const lang = statuses[language] || statuses.en;

    if (score >= 85) return lang.excellent;
    if (score >= 70) return lang.good;
    if (score >= 50) return lang.fair;
    return lang.poor;
  };

  const { score: protectionScore, breakdown } = calculateProtectionScore();
  const protectionScoreColor = getProtectionScoreColor(protectionScore);
  const protectionScoreStatus = getProtectionScoreStatus(protectionScore);

  const activeDeposits = deposits.filter(d => d.status === 'tracking');
  const activeCases = cases.filter(c => !['closed'].includes(c.status));

  const now = new Date();
  const thisMonthLeases = leases.filter(l => {
    const leaseDate = new Date(l.created_date);
    return leaseDate.getMonth() === now.getMonth() && leaseDate.getFullYear() === now.getFullYear();
  });

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
    <div className="min-h-screen p-4 md:p-6" style={{
      background: 'linear-gradient(to bottom, rgba(236, 239, 237, 0.3) 0%, rgba(236, 239, 237, 0.6) 100%)'
    }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="px-4 py-2 rounded-full" style={{
              background: 'linear-gradient(to right, #C7A338, #d4af37)',
              border: '1px solid rgba(199, 163, 56, 0.3)'
            }}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-ls-forest" />
                <span className="text-sm font-semibold text-ls-forest">{strings.tagline}</span>
              </div>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{
            color: '#0C3B2E'
          }}>
            {strings.welcome}, {user?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-base" style={{ color: '#065f46' }}>
            {strings.subtitle}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title={strings.activeLeases}
            value={leases.length}
            icon={FileText}
            bgGradient="bg-gradient-to-br from-ls-forest to-emerald-800"
            trend={thisMonthLeases.length > 0 ? `+${thisMonthLeases.length} ${strings.thisMonth}` : undefined}
            trendUp={thisMonthLeases.length > 0}
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
            value={`${protectionScore}%`}
            icon={Shield}
            scoreColor={protectionScoreColor}
            scoreStatus={protectionScoreStatus}
            trend={protectionScore >= 70 ? "+5%" : undefined}
            trendUp={protectionScore >= 70}
          />
        </div>

        {/* Quick Actions - Premium Gold Card */}
        <div style={{
          background: 'linear-gradient(135deg, #C7A338 0%, #d4af37 100%)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 8px 16px rgba(199, 163, 56, 0.3)',
          border: '1px solid rgba(199, 163, 56, 0.4)'
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
                fontSize: '22px',
                fontWeight: 'bold',
                color: '#0C3B2E',
                marginBottom: '8px'
              }}>
                {strings.protectRights}
              </h2>
              <p style={{
                fontSize: '15px',
                color: '#065f46',
                lineHeight: '1.5',
                opacity: 0.9
              }}>
                {strings.uploadCta}
              </p>
            </div>
            <Link to={createPageUrl("UploadScan")}>
              <button
                style={{
                  backgroundColor: '#0C3B2E',
                  color: '#FFFFFF',
                  padding: '14px 32px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(12, 59, 46, 0.4)',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#0a2f25';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(12, 59, 46, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#0C3B2E';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(12, 59, 46, 0.4)';
                }}
              >
                {strings.uploadLease}
              </button>
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RecentLeases leases={leases} language={language} />
          </div>
          <div>
            <DepositAlert deposits={deposits} language={language} />
          </div>
        </div>

        {/* Upgrade Banner - Premium Dark Style */}
        {user?.plan_tier === 'free' && (
          <div style={{
            marginTop: '24px',
            background: 'linear-gradient(135deg, #0C3B2E 0%, #065f46 100%)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 8px 16px rgba(12, 59, 46, 0.3)',
            border: '1px solid rgba(199, 163, 56, 0.3)'
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
                  <TrendingUp style={{ width: '24px', height: '24px', color: '#C7A338' }} />
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#FFFFFF'
                  }}>
                    {strings.upgradePremium}
                  </h3>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#ECEFED',
                  opacity: 0.9
                }}>
                  {strings.upgradeDesc}
                </p>
              </div>
              <Link to={createPageUrl("Account")}>
                <button
                  style={{
                    backgroundColor: '#C7A338',
                    color: '#0C3B2E',
                    padding: '14px 32px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(199, 163, 56, 0.4)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#d4af37';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(199, 163, 56, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#C7A338';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(199, 163, 56, 0.4)';
                  }}
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