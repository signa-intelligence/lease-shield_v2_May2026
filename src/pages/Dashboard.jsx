import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Shield, FileText, Wallet, Scale, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";
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

    const scannedLeases = leases.filter(l => l.status === 'scanned' || l.status === 'paid');
    if (scannedLeases.length > 0) breakdown.documentation += 15;
    if (deposits.length > 0) breakdown.documentation += 10;
    if (documents.length > 0) breakdown.documentation += 10;
    if (documents.length >= 5) breakdown.documentation += 5;

    const activeDeposits = deposits.filter(d => d.status === 'tracking');
    if (activeDeposits.length > 0) breakdown.activeProtections += 10;
    
    const rentAlertsEnabled = deposits.some(d => d.rent_alerts_enabled);
    if (rentAlertsEnabled) breakdown.activeProtections += 7;
    
    if (maintenanceRequests.length > 0) breakdown.activeProtections += 6;
    
    if (user?.email_notifications || user?.line_notifications) breakdown.activeProtections += 7;

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
    <div className="min-h-screen relative">
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        {/* Header - REDESIGNED with gold accent */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div style={{
              padding: '8px 20px',
              background: 'rgba(12, 59, 46, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(199, 163, 56, 0.3)',
              borderRadius: '24px',
              boxShadow: '0 4px 12px rgba(12, 59, 46, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
            }}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" style={{ color: '#C7A338' }} />
                <span className="text-sm font-bold" style={{ 
                  background: 'linear-gradient(135deg, #0C3B2E, #C7A338)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {strings.tagline}
                </span>
              </div>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #0C3B2E 0%, #1a5241 50%, #C7A338 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 4px 8px rgba(12, 59, 46, 0.1)'
          }}>
            {strings.welcome}, {user?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-lg" style={{ color: '#1a5241', fontWeight: '500' }}>
            {strings.subtitle}
          </p>
        </div>

        {/* Stats Grid - REDESIGNED with premium cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        {/* Quick Actions - REDESIGNED with gradient and gold accent */}
        <div style={{
          background: 'linear-gradient(135deg, #0C3B2E 0%, #1a5241 80%, #C7A338 100%)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 12px 32px rgba(12, 59, 46, 0.4), inset 0 2px 8px rgba(199, 163, 56, 0.1)',
          border: '2px solid rgba(199, 163, 56, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(199, 163, 56, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(199, 163, 56, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-6 h-6" style={{ color: '#C7A338' }} />
                <h2 style={{
                  fontSize: '26px',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                  {strings.protectRights}
                </h2>
              </div>
              <p style={{
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.95)',
                lineHeight: '1.6',
                textShadow: '0 1px 4px rgba(0,0,0,0.2)'
              }}>
                {strings.uploadCta}
              </p>
            </div>
            <Link to={createPageUrl("UploadScan")}>
              <button
                style={{
                  background: 'linear-gradient(135deg, #C7A338, #FFD700)',
                  color: '#0C3B2E',
                  padding: '16px 36px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: '2px solid rgba(255, 215, 0, 0.4)',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(199, 163, 56, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
                  transition: 'all 0.3s',
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 24px rgba(199, 163, 56, 0.6), inset 0 2px 4px rgba(255,255,255,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 6px 20px rgba(199, 163, 56, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)';
                }}
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

        {/* Upgrade Banner - REDESIGNED */}
        {user?.plan_tier === 'free' && (
          <div style={{
            marginTop: '32px',
            background: 'linear-gradient(135deg, #C7A338 0%, #d97706 60%, #ea580c 100%)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 12px 32px rgba(199, 163, 56, 0.4), inset 0 2px 8px rgba(255,255,255,0.1)',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '50%',
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.1) 1px, transparent 0)`,
              backgroundSize: '24px 24px',
              pointerEvents: 'none'
            }} />
            
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '24px',
              flexWrap: 'wrap',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <TrendingUp style={{ width: '26px', height: '26px', color: '#0C3B2E' }} />
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: '#0C3B2E',
                    textShadow: '0 2px 4px rgba(255,255,255,0.3)'
                  }}>
                    {strings.upgradePremium}
                  </h3>
                </div>
                <p style={{
                  fontSize: '15px',
                  color: '#1a1d1f',
                  opacity: 0.9,
                  textShadow: '0 1px 2px rgba(255,255,255,0.2)'
                }}>
                  {strings.upgradeDesc}
                </p>
              </div>
              <Link to={createPageUrl("Account")}>
                <button
                  style={{
                    backgroundColor: '#0C3B2E',
                    color: '#C7A338',
                    padding: '16px 36px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    border: '2px solid rgba(12, 59, 46, 0.5)',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(12, 59, 46, 0.6), inset 0 2px 4px rgba(199,163,56,0.2)',
                    transition: 'all 0.3s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 24px rgba(12, 59, 46, 0.7), inset 0 2px 4px rgba(199,163,56,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 6px 20px rgba(12, 59, 46, 0.6), inset 0 2px 4px rgba(199,163,56,0.2)';
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