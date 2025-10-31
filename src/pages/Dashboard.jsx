
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Shield, FileText, Wallet, Scale, AlertTriangle, TrendingUp, Bell, Wrench, ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import StatsCard from "../components/dashboard/StatsCard";
import DepositAlert from "../components/dashboard/DepositAlert";
import RecentLeases from "../components/dashboard/RecentLeases";

export default function Dashboard() {
  const [showImprovementDialog, setShowImprovementDialog] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

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
        icon: 'FileText'
      });
    } else if (documents.length > 0 && documents.length < 5) {
      recommendations.push({
        action: language === 'th' ? 'อัปโหลดหลักฐานเพิ่มเติม' : 'Upload more evidence',
        points: 5,
        route: 'DocumentVault',
        icon: 'FileText'
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
        icon: 'FileText'
      });
    } else if (recentDocuments.length > 0 && recentDocuments.length < 3) {
      recommendations.push({
        action: language === 'th' ? 'เพิ่มหลักฐานเป็นประจำ' : 'Add regular evidence',
        points: 5,
        route: 'DocumentVault',
        icon: 'FileText'
      });
    }
    
    return { score, breakdown, recommendations: recommendations.slice(0, 5) }; // Top 5 recommendations
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

  // Calculate additional stats for mini info
  const scannedLeases = leases.filter(l => l.status === 'scanned' || l.status === 'paid');
  const totalDepositValue = activeDeposits.reduce((sum, d) => sum + d.deposit_amount, 0);
  const avgDeposit = activeDeposits.length > 0 ? Math.round(totalDepositValue / activeDeposits.length) : 0;
  const urgentDeposits = activeDeposits.filter(d => {
    const daysRemaining = differenceInDays(new Date(d.expected_return_date), now);
    return daysRemaining <= 30 && daysRemaining > 0;
  }).length;
  const resolvedCases = cases.filter(c => c.status === 'closed').length;

  const handleImproveScoreClick = () => {
    setShowImprovementDialog(true);
  };

  const t = {
    en: {
      welcome: "Welcome back",
      tagline: "Fair. Transparent. Protected.",
      subtitle: "Prevent rental problems before they happen.",
      activeLeases: "Active Leases",
      depositsTracked: "Deposits Tracked",
      activeCases: "Active Cases",
      protectionScore: "Protection Score",
      improveScoreCta: "Improve Score",
      protectRights: "Protect Your Rights",
      uploadCta: "Upload your lease for instant AI-powered analysis and risk assessment",
      uploadLease: "Upload Lease",
      upgradePremium: "Upgrade to Premium",
      upgradeDesc: "Get unlimited lease scans, priority case handling, and expert legal support",
      viewPlans: "View Plans",
      thisMonth: "this month",
      improveScore: "How to Improve Your Score",
      improveScoreDesc: "Complete these actions to strengthen your protection",
      takeAction: "Take Action",
      scanned: "Scanned",
      avgDeposit: "Avg Deposit",
      urgentReturns: "Due Soon",
      resolved: "Resolved",
      viewAll: "View All",
      addDeposit: "Add Deposit",
      openCase: "Open Case"
    },
    th: {
      welcome: "ยินดีต้อนรับกลับมา",
      tagline: "ยุติธรรม โปร่งใส ปลอดภัย",
      subtitle: "ป้องกันปัญหาการเช่าก่อนที่จะเกิดขึ้น",
      activeLeases: "สัญญาเช่าที่ใช้งาน",
      depositsTracked: "เงินมัดจำที่ติดตาม",
      activeCases: "คดีที่ดำเนินการ",
      protectionScore: "คะแนนการป้องกัน",
      improveScoreCta: "เพิ่มคะแนน",
      protectRights: "ปกป้องสิทธิ์ของคุณ",
      uploadCta: "อัปโหลดสัญญาเช่าเพื่อรับการวิเคราะห์และประเมินความเสี่ยงด้วย AI",
      uploadLease: "อัปโหลดสัญญาเช่า",
      upgradePremium: "อัปเกรดเป็นพรีเมียม",
      upgradeDesc: "รับการสแกนสัญญาไม่จำกัด การจัดการคดีแบบเร่งด่วน และการสนับสนุนจากผู้เชี่ยวชาญ",
      viewPlans: "ดูแผน",
      thisMonth: "เดือนนี้",
      improveScore: "วิธีเพิ่มคะแนนของคุณ",
      improveScoreDesc: "ดำเนินการเหล่านี้เพื่อเสริมสร้างการป้องกัน",
      takeAction: "ดำเนินการ",
      scanned: "สแกนแล้ว",
      avgDeposit: "มัดจำเฉลี่ย",
      urgentReturns: "ครบกำหนดเร็วๆ นี้",
      resolved: "แก้ไขแล้ว",
      viewAll: "ดูทั้งหมด",
      addDeposit: "เพิ่มมัดจำ",
      openCase: "เปิดคดี"
    }
  };

  const strings = t[language];

  const iconMap = {
    FileText: FileText,
    Shield: Shield,
    Bell: Bell,
    Wrench: Wrench
  };

  // Dark mode colors
  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40'
  } : {
    bg: '#0C3B2E',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#e2e8f0'
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="px-3 py-1 border rounded-full" style={{
              backgroundColor: isDarkMode ? '#2A2D30' : '#ECEFED',
              borderColor: isDarkMode ? '#3A3D40' : 'rgba(12, 59, 46, 0.2)'
            }}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-ls-forest" />
                <span className="text-sm font-semibold text-ls-forest">{strings.tagline}</span>
              </div>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: colors.textPrimary }}>
            {strings.welcome}, {user?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '18px' }}>
            {strings.subtitle}
          </p>
        </div>

        {/* Stats Grid - Optimized Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Leases with mini stats */}
          <StatsCard
            title={strings.activeLeases}
            value={leases.length}
            icon={FileText}
            bgGradient="bg-gradient-to-br from-ls-forest to-emerald-800"
            trend={thisMonthLeases.length > 0 ? `+${thisMonthLeases.length} ${strings.thisMonth}` : undefined}
            trendUp={thisMonthLeases.length > 0}
            miniStats={[
              { label: strings.scanned, value: scannedLeases.length }
            ]}
            actionButton={{
              label: strings.viewAll,
              link: createPageUrl("Leases")
            }}
          />
          
          {/* Deposits Tracked with mini stats */}
          <StatsCard
            title={strings.depositsTracked}
            value={`฿${totalDepositValue.toLocaleString()}`}
            icon={Wallet}
            bgGradient="bg-gradient-to-br from-ls-gold to-amber-600"
            miniStats={[
              { label: strings.avgDeposit, value: avgDeposit > 0 ? `฿${avgDeposit.toLocaleString()}` : '—' },
              { label: strings.urgentReturns, value: urgentDeposits }
            ]}
            actionButton={{
              label: strings.addDeposit,
              link: createPageUrl("DepositTracker")
            }}
          />
          
          {/* Active Cases with mini stats */}
          <StatsCard
            title={strings.activeCases}
            value={activeCases.length}
            icon={Scale}
            bgGradient="bg-gradient-to-br from-ls-charcoal to-slate-700"
            miniStats={[
              { label: strings.resolved, value: resolvedCases }
            ]}
            actionButton={{
              label: strings.openCase,
              link: createPageUrl("Cases")
            }}
          />
          
          {/* Protection Score with gauge - NO CHANGES TO THIS CARD */}
          <StatsCard
            title={strings.protectionScore}
            value={`${protectionScore}%`}
            icon={Shield}
            scoreColor={protectionScoreColor}
            scoreStatus={protectionScoreStatus}
            showGauge={true}
            scoreValue={protectionScore}
            ctaText={protectionScore < 100 ? strings.improveScoreCta : undefined}
            onCtaClick={protectionScore < 100 ? handleImproveScoreClick : undefined}
          />
        </div>

        {/* Improvement Dialog */}
        <Dialog open={showImprovementDialog} onOpenChange={setShowImprovementDialog}>
          <DialogContent className="sm:max-w-2xl" style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.borderColor
          }}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3" style={{ color: colors.textPrimary }}>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: protectionScoreColor }}
                >
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  {strings.improveScore}
                  <p className="text-sm font-normal mt-1" style={{ color: colors.textSecondary }}>{strings.improveScoreDesc}</p>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {language === 'th' ? 'คะแนนเต็ม! 🎉' : 'Perfect Score! 🎉'}
                  </p>
                  <p style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'คุณทำได้ดีมาก ทุกอย่างพร้อมแล้ว' : 'You\'re all set with maximum protection'}
                  </p>
                </div>
              ) : (
                recommendations.map((rec, index) => {
                  const IconComponent = iconMap[rec.icon] || FileText;
                  return (
                    <Link 
                      key={index} 
                      to={createPageUrl(rec.route)}
                      onClick={() => setShowImprovementDialog(false)}
                    >
                      <div
                        className="p-4 rounded-xl border-2 hover:shadow-md transition-all duration-300 cursor-pointer"
                        style={{
                          backgroundColor: colors.cardBg,
                          borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#C7A338';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = isDarkMode ? '#3A3D40' : '#E5E7EB';
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: '#0C3B2E',
                                boxShadow: '0 2px 4px rgba(12, 59, 46, 0.2)'
                              }}
                            >
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold" style={{ color: colors.textPrimary }}>{rec.action}</span>
                                <Badge className="bg-ls-gold/20 text-ls-gold border border-ls-gold/30">
                                  +{rec.points}%
                                </Badge>
                              </div>
                              <p className="text-sm" style={{ color: colors.textSecondary }}>
                                {language === 'th' 
                                  ? `เพิ่มคะแนนการป้องกันของคุณ ${rec.points} คะแนน` 
                                  : `Increase your protection by ${rec.points} points`}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-ls-gold flex-shrink-0 ml-3" />
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Actions */}
        <div style={{
          background: isDarkMode 
            ? 'linear-gradient(to right, #0C3B2E, #047857)'
            : 'linear-gradient(to right, #0C3B2E, #047857)',
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

        {/* Upgrade Banner */}
        {user?.plan_tier === 'free' && (
          <div style={{
            marginTop: '32px',
            background: isDarkMode
              ? 'linear-gradient(to right, #C7A338, #d97706)'
              : 'linear-gradient(to right, #C7A338, #d97706)',
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
