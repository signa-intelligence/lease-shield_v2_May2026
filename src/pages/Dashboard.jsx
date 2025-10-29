
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Shield, FileText, Wallet, Scale, AlertTriangle, TrendingUp, Bell, Wrench, FolderOpen, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { differenceInDays } from "date-fns";

import StatsCard from "../components/dashboard/StatsCard";
import DepositAlert from "../components/dashboard/DepositAlert";
import RecentLeases from "../components/dashboard/RecentLeases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    if (documents.length >= 5) breakdown.documentation += 5; // Bonus for thorough documentation

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
      const leaseDate = new Date(l.created_date);
      const daysSinceCreated = differenceInDays(now, leaseDate);
      return daysSinceCreated <= 90;
    });
    if (recentLeases.length > 0) breakdown.proactiveActions += 10;

    const recentDeposits = deposits.filter(d => {
      const depositDate = new Date(d.created_date);
      const daysSinceCreated = differenceInDays(now, depositDate);
      return daysSinceCreated <= 90;
    });
    if (recentDeposits.length > 0) breakdown.proactiveActions += 8;

    const recentDocuments = documents.filter(doc => {
      const docDate = new Date(doc.created_date);
      const daysSinceCreated = differenceInDays(now, docDate);
      return daysSinceCreated <= 30;
    });
    if (recentDocuments.length > 0) breakdown.proactiveActions += 7;

    if (recentDocuments.length >= 3) breakdown.proactiveActions += 5; // Bonus for regular updates

    score = breakdown.documentation + breakdown.activeProtections + breakdown.proactiveActions;
    
    // Calculate recommendations based on what's missing
    const recommendations = [];
    
    // Documentation recommendations
    if (scannedLeases.length === 0) {
      recommendations.push({
        action: language === 'th' ? 'สแกนสัญญาเช่า' : 'Scan your lease',
        points: 15,
        route: 'UploadScan',
        icon: 'FileText'
      });
    }
    if (deposits.length === 0) {
      recommendations.push({
        action: language === 'th' ? 'เริ่มติดตามเงินมัดจำ' : 'Start tracking deposit',
        points: 10,
        route: 'DepositTracker',
        icon: 'Shield'
      });
    }
    if (documents.length === 0) {
      recommendations.push({
        action: language === 'th' ? 'อัปโหลดหลักฐาน' : 'Upload evidence files',
        points: 10,
        route: 'DocumentVault',
        icon: 'FolderOpen'
      });
    } else if (documents.length > 0 && documents.length < 5) {
      recommendations.push({
        action: language === 'th' ? 'อัปโหลดหลักฐานเพิ่มเติม' : 'Upload more evidence',
        points: 5,
        route: 'DocumentVault',
        icon: 'FolderOpen'
      });
    }
    
    // Active Protections recommendations
    if (activeDeposits.length === 0 && deposits.length > 0) {
      recommendations.push({
        action: language === 'th' ? 'เปิดใช้งาน Deposit Shield' : 'Enable Deposit Shield',
        points: 10,
        route: 'DepositTracker',
        icon: 'Shield'
      });
    }
    if (!rentAlertsEnabled && deposits.length > 0) {
      recommendations.push({
        action: language === 'th' ? 'เปิดการแจ้งเตือนค่าเช่า' : 'Enable rent alerts',
        points: 7,
        route: 'DepositTracker',
        icon: 'Bell'
      });
    }
    if (maintenanceRequests.length === 0) {
      recommendations.push({
        action: language === 'th' ? 'บันทึกการซ่อมบำรุง' : 'Log maintenance requests',
        points: 6,
        route: 'MaintenanceTracker',
        icon: 'Wrench'
      });
    }
    if (!user?.email_notifications && !user?.line_notifications) {
      recommendations.push({
        action: language === 'th' ? 'เปิดการแจ้งเตือน' : 'Enable notifications',
        points: 7,
        route: 'Account',
        icon: 'Bell'
      });
    }
    
    // Proactive Actions recommendations
    if (recentLeases.length === 0 && leases.length > 0) {
      recommendations.push({
        action: language === 'th' ? 'สแกนสัญญาเช่าใหม่' : 'Scan a recent lease',
        points: 10,
        route: 'UploadScan',
        icon: 'FileText'
      });
    }
    if (recentDocuments.length === 0 && documents.length > 0) {
      recommendations.push({
        action: language === 'th' ? 'อัปเดตหลักฐาน' : 'Update evidence files',
        points: 7,
        route: 'DocumentVault',
        icon: 'FolderOpen'
      });
    } else if (recentDocuments.length > 0 && recentDocuments.length < 3) {
      recommendations.push({
        action: language === 'th' ? 'เพิ่มหลักฐานเป็นประจำ' : 'Add regular evidence',
        points: 5,
        route: 'DocumentVault',
        icon: 'FolderOpen'
      });
    }
    
    return { score, breakdown, recommendations: recommendations.slice(0, 3) }; // Top 3 recommendations
  };

  // Get color and status based on protection score
  const getProtectionScoreColor = (score) => {
    if (score >= 85) return '#10B981'; // Green - Excellent
    if (score >= 70) return '#EAB308'; // Yellow - Good
    if (score >= 50) return '#F59E0B'; // Orange - Fair
    return '#EF4444'; // Red - Needs improvement
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

  const { score: protectionScore, breakdown, recommendations } = calculateProtectionScore();
  const protectionScoreColor = getProtectionScoreColor(protectionScore);
  const protectionScoreStatus = getProtectionScoreStatus(protectionScore);

  const activeDeposits = deposits.filter(d => d.status === 'tracking');
  const activeCases = cases.filter(c => !['closed'].includes(c.status));

  // Calculate trend for this month vs last month
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
      thisMonth: "this month",
      improveScore: "How to Improve Your Score",
      improveScoreDesc: "Complete these actions to strengthen your protection"
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
      thisMonth: "เดือนนี้",
      improveScore: "วิธีเพิ่มคะแนนของคุณ",
      improveScoreDesc: "ดำเนินการเหล่านี้เพื่อเสริมสร้างการป้องกัน"
    }
  };

  const strings = t[language];

  const iconMap = {
    FileText: FileText,
    Shield: Shield,
    FolderOpen: FolderOpen,
    Bell: Bell,
    Wrench: Wrench
  };

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

        {/* How to Improve Score - NEW SECTION */}
        {protectionScore < 100 && recommendations.length > 0 && (
          <div className="mb-8">
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-ls-forest to-emerald-700 text-white pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {strings.improveScore}
                </CardTitle>
                <p className="text-sm text-white/90 mt-1">{strings.improveScoreDesc}</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  {recommendations.map((rec, index) => {
                    const IconComponent = iconMap[rec.icon] || FileText;
                    return (
                      <Link key={index} to={createPageUrl(rec.route)}>
                        <div
                          className="p-4 rounded-xl border-2 border-slate-200 hover:border-ls-gold hover:shadow-md transition-all duration-300 cursor-pointer h-full"
                          style={{
                            background: 'linear-gradient(135deg, #FFFFFF 0%, #ECEFED 100%)'
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: '#0C3B2E',
                                boxShadow: '0 2px 4px rgba(12, 59, 46, 0.2)'
                              }}
                            >
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-bold text-ls-charcoal">{rec.action}</span>
                                <Badge className="bg-ls-gold/20 text-ls-gold border border-ls-gold/30 text-xs">
                                  +{rec.points}%
                                </Badge>
                              </div>
                              <ArrowRight className="w-4 h-4 text-ls-gold mt-2" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
