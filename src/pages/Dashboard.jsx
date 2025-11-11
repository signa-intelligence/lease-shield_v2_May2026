import React, { useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, FileText, Wallet, Scale, AlertTriangle, TrendingUp, Bell, Wrench, ArrowRight, X, ChevronDown, ChevronUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { differenceInDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import StatsCard from "../components/dashboard/StatsCard";
import DepositAlert from "../components/dashboard/DepositAlert";
import RecentLeases from "../components/dashboard/RecentLeases";
import ProtectionScoreEnhanced from "../components/dashboard/ProtectionScoreEnhanced";
import EmptyState from "../components/shared/EmptyState";
import SkeletonLoader from "../components/shared/SkeletonLoader";
import PullToRefresh from "../components/shared/PullToRefresh";
import { ToastProvider, useToast } from "../components/shared/Toast";
import { spacing, borderRadius, shadows, transitions, brandColors } from "@/utils/designSystem";

function DashboardContent() {
  const [showImprovementDialog, setShowImprovementDialog] = React.useState(false);
  const [focusMode, setFocusMode] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState({
    stats: true,
    quickActions: true,
    content: true,
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Regular user queries
  const { data: leases = [], isLoading: leasesLoading } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }, '-created_date', 10),
    enabled: !!user,
  });

  const { data: deposits = [], isLoading: depositsLoading } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.filter({ user_email: user?.email }),
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

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
    toast.success(language === 'th' ? 'รีเฟรชสำเร็จ' : 'Refreshed successfully');
  };

  // Auto-refresh logic
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subscriptionStatus = urlParams.get('subscription');
    
    if (subscriptionStatus === 'success' && user) {
      window.history.replaceState({}, '', window.location.pathname);
      toast.success(language === 'th' ? 'การสมัครสมาชิกสำเร็จ!' : 'Subscription successful!');
      
      let pollCount = 0;
      const maxPolls = 12;
      
      const pollInterval = setInterval(() => {
        pollCount++;
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
        }
      }, 5000);
      
      return () => clearInterval(pollInterval);
    }
  }, [queryClient, user, toast]);

  React.useEffect(() => {
    let intervalId;
    
    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      let count = 0;
      intervalId = setInterval(() => {
        count++;
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        
        if (count >= 6) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 5000);
    };
    
    const handleBlur = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [queryClient]);

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40'
  } : {
    bg: '#ECEFED',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  // Calculate protection score
  const calculateProtectionScore = () => {
    let score = 0;
    let breakdown = {
      documentation: 0,
      activeProtections: 0,
      proactiveActions: 0
    };

    const hasDepositShield = user?.plan_tier === 'protect' || user?.plan_tier === 'secure';
    const hasLineNotify = user?.plan_tier === 'protect' || user?.plan_tier === 'secure';

    const scannedLeases = leases.filter(l => l.status === 'scanned' || l.status === 'paid');
    if (scannedLeases.length > 0) breakdown.documentation += 15;
    if (deposits.length > 0) breakdown.documentation += 10;
    if (documents.length > 0) breakdown.documentation += 10;
    if (documents.length >= 5) breakdown.documentation += 5;

    const activeDepositsForProtectionScore = deposits.filter(d => d.status === 'tracking');
    if (activeDepositsForProtectionScore.length > 0) breakdown.activeProtections += 10;
    
    const rentAlertsEnabled = deposits.some(d => d.rent_alerts_enabled);
    if (rentAlertsEnabled) breakdown.activeProtections += 7;
    
    if (maintenanceRequests.length > 0) breakdown.activeProtections += 6;
    
    if (user?.email_notifications || user?.line_notifications) breakdown.activeProtections += 7;

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

    if (recentDocuments.length >= 3) breakdown.proactiveActions += 5;

    score = breakdown.documentation + breakdown.activeProtections + breakdown.proactiveActions;
    
    const recommendations = [];
    
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
    
    return { score, breakdown, recommendations: recommendations.slice(0, 5) };
  };

  const protectionData = calculateProtectionScore();
  const { score: protectionScore, breakdown, recommendations } = protectionData;

  const activeDeposits = deposits.filter(d => d.status === 'tracking' || d.status === 'dispute');
  const activeCases = cases.filter(c => !['closed'].includes(c.status));

  const scannedLeases = leases.filter(l => l.status === 'scanned' || l.status === 'paid');
  const totalDepositValue = activeDeposits.reduce((sum, d) => sum + (d.deposit_amount || 0), 0);
  const avgDeposit = activeDeposits.length > 0 ? Math.round(totalDepositValue / activeDeposits.length) : 0;
  const now = new Date();
  const urgentDeposits = activeDeposits.filter(d => {
    if (!d.expected_return_date) return false;
    const daysRemaining = differenceInDays(new Date(d.expected_return_date), now);
    return daysRemaining <= 30 && daysRemaining > 0;
  }).length;
  const resolvedCases = cases.filter(c => c.status === 'closed').length;

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
      uploadCta: "Upload your lease for instant automated analysis and risk assessment",
      uploadLease: "Upload Lease",
      upgradePremium: "Upgrade to Premium",
      upgradeDesc: "Get unlimited lease scans, priority case handling, and expert legal support",
      viewPlans: "View Plans",
      focusMode: "Focus Mode",
      normalView: "Normal View",
      scanned: "Scanned",
      avgDeposit: "Avg Deposit",
      urgentReturns: "Due Soon",
      resolved: "Resolved",
      addDeposit: "Add Deposit",
      openCase: "Open Case",
      manageLeases: "Manage Leases",
      uploadFirstLease: "Upload First Lease",
      noDataYet: "No Data Yet",
      getStartedDesc: "Start protecting your rental rights by uploading your lease agreement",
      startNow: "Get Started"
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
      uploadCta: "อัปโหลดสัญญาเช่าเพื่อรับการวิเคราะห์และประเมินความเสี่ยงอัตโนมัติทันที",
      uploadLease: "อัปโหลดสัญญาเช่า",
      upgradePremium: "อัปเกรดเป็นพรีเมียม",
      upgradeDesc: "รับการสแกนสัญญาไม่จำกัด การจัดการคดีแบบเร่งด่วน และการสนับสนุนจากผู้เชี่ยวชาญ",
      viewPlans: "ดูแผน",
      focusMode: "โหมดโฟกัส",
      normalView: "มุมมองปกติ",
      scanned: "สแกนแล้ว",
      avgDeposit: "มัดจำเฉลี่ย",
      urgentReturns: "ครบกำหนดเร็วๆ นี้",
      resolved: "แก้ไขแล้ว",
      addDeposit: "เพิ่มมัดจำ",
      openCase: "เปิดคดี",
      manageLeases: "จัดการสัญญา",
      uploadFirstLease: "อัปโหลดสัญญาแรก",
      noDataYet: "ยังไม่มีข้อมูล",
      getStartedDesc: "เริ่มปกป้องสิทธิ์การเช่าของคุณโดยการอัปโหลดสัญญาเช่า",
      startNow: "เริ่มเลย"
    }
  };

  const strings = t[language];

  const iconMap = {
    FileText: FileText,
    Shield: Shield,
    Bell: Bell,
    Wrench: Wrench
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isLoading = leasesLoading || depositsLoading;

  // Check if user has any data
  const hasAnyData = leases.length > 0 || deposits.length > 0 || cases.length > 0 || documents.length > 0;

  // Show empty state for completely new users
  if (!isLoading && !hasAnyData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <EmptyState
          icon={Shield}
          title={strings.noDataYet}
          description={strings.getStartedDesc}
          illustration="leases"
          actionLabel={strings.uploadLease}
          onAction={() => navigate(createPageUrl("UploadScan"))}
          secondaryActionLabel={language === 'th' ? 'ดูแผนการป้องกัน' : 'View Protection Plans'}
          onSecondaryAction={() => navigate(createPageUrl("Account"))}
        />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} colors={colors}>
      <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
          {/* Header with Focus Mode Toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{
                background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
                boxShadow: shadows.lg,
              }}>
                <div className="w-5 h-5 flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                    <path d="M12 2L4 5V11C4 16 7 20.5 12 22C17 20.5 20 16 20 11V5L12 2Z" fill="#0C3B2E" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="9" y="11" width="6" height="5" rx="1" fill="#C7A338"/>
                    <path d="M10 11V9.5C10 8.67 10.67 8 11.5 8H12.5C13.33 8 14 8.67 14 9.5V11" stroke="#C7A338" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex items-center gap-2 text-sm sm:text-base font-semibold">
                  <span style={{ color: '#FFFFFF' }}>Fair.</span>
                  <span style={{ color: '#ECEFED' }}>Transparent.</span>
                  <span style={{ color: '#C7A338' }}>Protected.</span>
                </div>
              </div>

              {/* Focus Mode Toggle */}
              <button
                onClick={() => setFocusMode(!focusMode)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: focusMode ? brandColors.gold : colors.cardBg,
                  color: focusMode ? '#FFFFFF' : colors.textPrimary,
                  border: `2px solid ${focusMode ? brandColors.gold : colors.borderColor}`,
                  borderRadius: borderRadius.lg,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: transitions.base,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
                onMouseEnter={(e) => {
                  if (!focusMode) {
                    e.target.style.backgroundColor = colors.borderColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!focusMode) {
                    e.target.style.backgroundColor = colors.cardBg;
                  }
                }}
              >
                <Target className="w-4 h-4" />
                {focusMode ? strings.normalView : strings.focusMode}
              </button>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2" style={{ 
              color: colors.textPrimary,
              letterSpacing: '-0.02em'
            }}>
              {strings.welcome}, {user?.full_name?.split(' ')[0] || 'User'}
            </h1>
            <p style={{ 
              color: colors.textSecondary, 
              fontSize: typography.base, 
              lineHeight: '1.6',
              fontWeight: '500'
            }}>
              {strings.subtitle}
            </p>
          </div>

          {/* Stats Grid - Collapsible */}
          {(!focusMode || urgentDeposits > 0 || activeCases.length > 0) && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('stats')}
                className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg hover:bg-opacity-80 transition-all"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                  {language === 'th' ? 'ภาพรวม' : 'Overview'}
                </h2>
                {expandedSections.stats ? (
                  <ChevronUp className="w-5 h-5" style={{ color: colors.textSecondary }} />
                ) : (
                  <ChevronDown className="w-5 h-5" style={{ color: colors.textSecondary }} />
                )}
              </button>

              {expandedSections.stats && (
                <div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
                  style={{
                    animation: 'slideDown 0.3s ease-out',
                  }}
                >
                  <style>
                    {`
                      @keyframes slideDown {
                        from {
                          opacity: 0;
                          transform: translateY(-10px);
                        }
                        to {
                          opacity: 1;
                          transform: translateY(0);
                        }
                      }
                    `}
                  </style>
                  
                  {isLoading ? (
                    <>
                      <SkeletonLoader variant="stat" colors={colors} />
                      <SkeletonLoader variant="stat" colors={colors} />
                      <SkeletonLoader variant="stat" colors={colors} />
                      <SkeletonLoader variant="stat" colors={colors} />
                    </>
                  ) : (
                    <>
                      <StatsCard
                        title={strings.activeLeases}
                        value={leases.length.toString()}
                        icon={FileText}
                        scoreColor="#3B82F6"
                        miniStats={leases.length > 0 ? [
                          {
                            label: language === 'th' ? 'สัญญาที่สแกนแล้ว' : 'Scanned',
                            value: scannedLeases.length
                          },
                          {
                            label: language === 'th' ? 'การแจ้งเตือนเปิดอยู่' : 'Alerts Enabled',
                            value: leases.filter(l => l.notice_alerts_enabled).length
                          }
                        ] : undefined}
                        actionButton={leases.length > 0 ? {
                          label: language === 'th' ? 'จัดการสัญญา' : 'Manage Leases',
                          link: createPageUrl("UploadScan")
                        } : undefined}
                        ctaText={leases.length === 0 ? strings.uploadFirstLease : undefined}
                        onCtaClick={leases.length === 0 ? () => navigate(createPageUrl("UploadScan")) : undefined}
                      />
                      
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
                      
                      {/* Enhanced Protection Score Card */}
                      <div className="sm:col-span-2 lg:col-span-1">
                        <ProtectionScoreEnhanced
                          score={protectionScore}
                          breakdown={breakdown}
                          recommendations={recommendations}
                          language={language}
                          colors={colors}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Actions - Priority in Focus Mode */}
          {expandedSections.quickActions && (
            <div style={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)'
                : 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
              borderRadius: borderRadius['2xl'],
              padding: spacing.xl,
              marginBottom: spacing.xl,
              boxShadow: shadows.xl,
              animation: 'scaleIn 0.3s ease-out',
            }}>
              <style>
                {`
                  @keyframes scaleIn {
                    from {
                      opacity: 0;
                      transform: scale(0.95);
                    }
                    to {
                      opacity: 1;
                      transform: scale(1);
                    }
                  }
                `}
              </style>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: spacing.lg,
              }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    fontSize: typography['2xl'],
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    marginBottom: spacing.md,
                    letterSpacing: '-0.01em'
                  }}>
                    {strings.protectRights}
                  </h2>
                  <p style={{
                    fontSize: typography.base,
                    color: '#D1FAE5',
                    lineHeight: '1.6'
                  }}>
                    {strings.uploadCta}
                  </p>
                </div>
                <Link to={createPageUrl("UploadScan")} className="w-full">
                  <button
                    style={{
                      width: '100%',
                      backgroundColor: brandColors.gold,
                      color: brandColors.charcoal,
                      padding: `${spacing.md} ${spacing.xl}`,
                      borderRadius: borderRadius.lg,
                      fontWeight: 'bold',
                      fontSize: typography.base,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: shadows.lg,
                      transition: transitions.slow,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: spacing.sm,
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = brandColors.goldLight;
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = shadows.xl;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = brandColors.gold;
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = shadows.lg;
                    }}
                  >
                    <Shield className="w-5 h-5" />
                    {strings.uploadLease}
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Main Content Grid - Collapsible in Focus Mode */}
          {(!focusMode || expandedSections.content) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                {isLoading ? (
                  <SkeletonLoader variant="card" count={3} colors={colors} />
                ) : (
                  <RecentLeases leases={leases} language={language} />
                )}
              </div>
              <div>
                {isLoading ? (
                  <SkeletonLoader variant="card" colors={colors} />
                ) : (
                  <DepositAlert deposits={deposits} language={language} />
                )}
              </div>
            </div>
          )}

          {/* Upgrade Banner */}
          {user?.plan_tier === 'free' && !focusMode && (
            <div style={{
              marginTop: spacing.xl,
              background: isDarkMode
                ? 'linear-gradient(135deg, #C7A338 0%, #d97706 100%)'
                : 'linear-gradient(135deg, #C7A338 0%, #d97706 100%)',
              borderRadius: borderRadius['2xl'],
              padding: spacing.xl,
              boxShadow: shadows.xl,
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: spacing.lg,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
                    <TrendingUp style={{ width: '24px', height: '24px', color: '#1A1D1F' }} />
                    <h3 style={{
                      fontSize: typography.xl,
                      fontWeight: 'bold',
                      color: '#1A1D1F',
                      letterSpacing: '-0.01em'
                    }}>
                      {strings.upgradePremium}
                    </h3>
                  </div>
                  <p style={{
                    fontSize: typography.sm,
                    color: '#292524',
                    opacity: 0.9,
                    lineHeight: '1.5'
                  }}>
                    {strings.upgradeDesc}
                  </p>
                </div>
                <Link to={createPageUrl("Account")} className="w-full">
                  <button
                    style={{
                      width: '100%',
                      backgroundColor: brandColors.forest,
                      color: '#FFFFFF',
                      padding: `${spacing.md} ${spacing.xl}`,
                      borderRadius: borderRadius.lg,
                      fontWeight: 'bold',
                      fontSize: typography.base,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: shadows.lg,
                      transition: transitions.slow,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: spacing.sm,
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#0a2f25';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = shadows.xl;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = brandColors.forest;
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = shadows.lg;
                    }}
                  >
                    <ArrowRight className="w-5 h-5" />
                    {strings.viewPlans}
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}

export default function Dashboard() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}