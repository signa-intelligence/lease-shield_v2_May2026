
import React, { useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, FileText, Wallet, Scale, AlertTriangle, TrendingUp, Bell, Wrench, ArrowRight, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { differenceInDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import StatsCard from "../components/dashboard/StatsCard";
import DepositAlert from "../components/dashboard/DepositAlert";
import RecentLeases from "../components/dashboard/RecentLeases";
import AdminDashboardStats from "../components/admin/AdminDashboardStats";
import TrendChart from "../components/admin/TrendChart";
import CaseBreakdown from "../components/admin/CaseBreakdown";
import ActivityTimeline from "../components/admin/ActivityTimeline";

export default function Dashboard() {
  const [showImprovementDialog, setShowImprovementDialog] = React.useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Check if user has admin/VA access
  const isAdminUser = user && ['admin', 'super_admin', 'va'].includes(user.access_level);

  // Admin queries - fetch ALL data
  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdminUser,
  });

  const { data: allLeases = [] } = useQuery({
    queryKey: ['allLeases'],
    queryFn: () => base44.entities.Lease.list('-created_date'),
    enabled: isAdminUser,
  });

  const { data: allCases = [] } = useQuery({
    queryKey: ['allCases'],
    queryFn: () => base44.entities.Case.list('-created_date'),
    enabled: isAdminUser,
  });

  const { data: allDeposits = [] } = useQuery({
    queryKey: ['allDeposits'],
    queryFn: () => base44.entities.DepositTracker.list('-created_date'),
    enabled: isAdminUser,
  });

  // Regular user queries
  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }, '-created_date', 10),
    enabled: !!user && !isAdminUser,
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user && !isAdminUser,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.filter({ user_email: user?.email }),
    enabled: !!user && !isAdminUser,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.filter({ created_by: user?.email }),
    enabled: !!user && !isAdminUser,
  });

  const { data: maintenanceRequests = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => base44.entities.MaintenanceRequest.filter({ created_by: user?.email }),
    enabled: !!user && !isAdminUser,
  });

  // Auto-refresh logic
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subscriptionStatus = urlParams.get('subscription');
    
    if (subscriptionStatus === 'success') {
      console.log('💳 Subscription success detected - starting refresh...');
      window.history.replaceState({}, '', window.location.pathname);
      
      let pollCount = 0;
      const maxPolls = 12;
      
      const pollInterval = setInterval(() => {
        pollCount++;
        console.log(`🔄 Polling for user data update (${pollCount}/${maxPolls})...`);
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          console.log('✅ User data refresh polling complete');
        }
      }, 5000);
      
      return () => clearInterval(pollInterval);
    }
  }, [queryClient]);

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

  // Calculate admin statistics
  const calculateAdminStats = () => {
    if (!isAdminUser) return {};

    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const startOfLastMonth = startOfMonth(lastMonth);
    const endOfLastMonth = endOfMonth(lastMonth);
    const startOfCurrentMonth = startOfMonth(now);

    // Current month data
    const currentMonthUsers = allUsers.filter(u => new Date(u.created_date) >= startOfCurrentMonth).length;
    const lastMonthUsers = allUsers.filter(u => {
      const date = new Date(u.created_date);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    }).length;

    const currentMonthLeases = allLeases.filter(l => new Date(l.created_date) >= startOfCurrentMonth).length;
    const lastMonthLeases = allLeases.filter(l => {
      const date = new Date(l.created_date);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    }).length;

    const currentMonthCases = allCases.filter(c => new Date(c.created_date) >= startOfCurrentMonth).length;
    const lastMonthCases = allCases.filter(c => {
      const date = new Date(c.created_date);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    }).length;

    // Calculate trends
    const userTrend = lastMonthUsers > 0 ? Math.round(((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100) : 0;
    const leaseTrend = lastMonthLeases > 0 ? Math.round(((currentMonthLeases - lastMonthLeases) / lastMonthLeases) * 100) : 0;
    const caseTrend = lastMonthCases > 0 ? Math.round(((currentMonthCases - lastMonthCases) / lastMonthCases) * 100) : 0;

    const activeSubscribers = allUsers.filter(u => 
      u.subscription_status === 'active' && u.plan_tier && u.plan_tier !== 'free'
    ).length;

    const lastMonthSubscribers = allUsers.filter(u => {
      const subDate = u.subscription_start_date ? new Date(u.subscription_start_date) : null;
      return subDate && subDate >= startOfLastMonth && subDate <= endOfLastMonth;
    }).length;

    const subscriberTrend = lastMonthSubscribers > 0 ? Math.round(((activeSubscribers - lastMonthSubscribers) / lastMonthSubscribers) * 100) : 0;

    // Revenue calculation
    const monthlyRevenue = allUsers.reduce((sum, u) => {
      if (u.subscription_status === 'active' && u.plan_tier !== 'free') {
        const planPrices = { lite: 390, protect: 690, secure: 1290 };
        return sum + (planPrices[u.plan_tier] || 0);
      }
      return sum;
    }, 0);

    // Case metrics
    const activeCases = allCases.filter(c => !['closed', 'resolved'].includes(c.status)).length;
    const urgentCases = allCases.filter(c => c.flags?.urgent || c.fast_track).length;
    
    // Calculate average resolution time
    const resolvedCases = allCases.filter(c => c.status === 'closed' && c.timeline?.length > 0);
    const avgResolutionDays = resolvedCases.length > 0
      ? Math.round(
          resolvedCases.reduce((sum, c) => {
            const opened = new Date(c.created_date);
            const closed = c.timeline.find(t => t.event.includes('closed'))?.timestamp;
            if (closed) {
              return sum + differenceInDays(new Date(closed), opened);
            }
            return sum;
          }, 0) / resolvedCases.length
        )
      : 0;

    return {
      totalUsers: allUsers.length,
      userTrend,
      activeSubscribers,
      subscriberTrend,
      monthlyRevenue,
      revenueTrend: 0, // Could calculate based on historical data
      totalLeases: allLeases.length,
      leaseTrend,
      totalCases: allCases.length,
      caseTrend,
      activeCases,
      activeCaseTrend: 0,
      avgResolutionDays,
      resolutionTrend: 0,
      urgentCases,
      urgentTrend: 0
    };
  };

  // Generate trend data for charts
  const generateTrendData = () => {
    if (!isAdminUser) return { leaseTrend: [], depositTrend: [] };

    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    const leaseTrend = last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const count = allLeases.filter(l => {
        const date = new Date(l.created_date);
        return date >= monthStart && date <= monthEnd;
      }).length;

      return {
        name: format(month, 'MMM'),
        value: count
      };
    });

    const depositTrend = last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const count = allDeposits.filter(d => {
        const date = new Date(d.created_date);
        return date >= monthStart && date <= monthEnd;
      }).length;

      return {
        name: format(month, 'MMM'),
        value: count
      };
    });

    return { leaseTrend, depositTrend };
  };

  // Generate recent activities
  const generateRecentActivities = () => {
    if (!isAdminUser) return [];

    const activities = [];

    // Recent users
    allUsers.slice(0, 3).forEach(u => {
      activities.push({
        type: 'user_registered',
        description: u.email,
        timestamp: u.created_date
      });
    });

    // Recent leases
    allLeases.slice(0, 3).forEach(l => {
      activities.push({
        type: 'lease_uploaded',
        description: l.property_address || l.created_by,
        timestamp: l.created_date
      });
    });

    // Recent cases
    allCases.slice(0, 3).forEach(c => {
      if (c.status === 'closed' || c.status === 'resolved') {
        activities.push({
          type: 'case_resolved',
          description: c.case_number || `Case #${c.id.slice(0, 8)}`,
          timestamp: c.updated_date || c.created_date
        });
      } else {
        activities.push({
          type: 'case_opened',
          description: c.case_number || `Case #${c.id.slice(0, 8)}`,
          timestamp: c.created_date
        });
      }
    });

    // Sort by timestamp and take top 10
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  };

  const adminStats = isAdminUser ? calculateAdminStats() : {};
  const { leaseTrend, depositTrend } = isAdminUser ? generateTrendData() : { leaseTrend: [], depositTrend: [] };
  const recentActivities = isAdminUser ? generateRecentActivities() : [];

  // Regular user protection score calculation
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

  // Only calculate for regular users
  const protectionData = !isAdminUser ? calculateProtectionScore() : { score: 0, recommendations: [] };
  const { score: protectionScore, recommendations } = protectionData;

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

  const protectionScoreColor = getProtectionScoreColor(protectionScore);
  const protectionScoreStatus = getProtectionScoreStatus(protectionScore);

  const activeDeposits = !isAdminUser ? deposits.filter(d => d.status === 'tracking' || d.status === 'dispute') : [];
  const activeCases = !isAdminUser ? cases.filter(c => !['closed'].includes(c.status)) : [];

  const scannedLeases = !isAdminUser ? leases.filter(l => l.status === 'scanned' || l.status === 'paid') : [];
  const totalDepositValue = !isAdminUser ? activeDeposits.reduce((sum, d) => sum + (d.deposit_amount || 0), 0) : 0;
  const avgDeposit = !isAdminUser && activeDeposits.length > 0 ? Math.round(totalDepositValue / activeDeposits.length) : 0;
  const now = new Date();
  const urgentDeposits = !isAdminUser ? activeDeposits.filter(d => {
    if (!d.expected_return_date) return false;
    const daysRemaining = differenceInDays(new Date(d.expected_return_date), now);
    return daysRemaining <= 30 && daysRemaining > 0;
  }).length : 0;
  const resolvedCases = !isAdminUser ? cases.filter(c => c.status === 'closed').length : 0;

  const handleImproveScoreClick = () => {
    setShowImprovementDialog(true);
  };

  const t = {
    en: {
      welcome: "Welcome back",
      adminDashboard: "Admin Dashboard",
      adminSubtitle: "Monitor system performance and user activity",
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
      openCase: "Open Case",
      manageLeases: "Manage Leases",
      alertsEnabled: "Alerts Enabled",
      uploadFirstLease: "Upload First Lease",
      scannedLeases: "Scanned",
      leaseTrends: "Lease Upload Trends",
      depositTrends: "Deposit Tracking Trends"
    },
    th: {
      welcome: "ยินดีต้อนรับกลับมา",
      adminDashboard: "แดชบอร์ดผู้ดูแล",
      adminSubtitle: "ติดตามประสิทธิภาพระบบและกิจกรรมผู้ใช้",
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
      openCase: "เปิดคดี",
      manageLeases: "จัดการสัญญา",
      alertsEnabled: "การแจ้งเตือนเปิดอยู่",
      uploadFirstLease: "อัปโหลดสัญญาแรก",
      scannedLeases: "สัญญาที่สแกนแล้ว",
      leaseTrends: "แนวโน้มการอัปโหลดสัญญา",
      depositTrends: "แนวโน้มการติดตามเงินมัดจำ"
    }
  };

  const strings = t[language];

  const iconMap = {
    FileText: FileText,
    Shield: Shield,
    Bell: Bell,
    Wrench: Wrench
  };

  // ADMIN VIEW
  if (isAdminUser) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
          {/* Admin Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3" style={{
              background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
              boxShadow: '0 8px 16px rgba(12, 59, 46, 0.25)'
            }}>
              <Shield className="w-5 h-5 text-white" />
              <span className="text-sm font-semibold text-white">
                {user?.access_level?.toUpperCase() || 'ADMIN'}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2" style={{ 
              color: colors.textPrimary,
              letterSpacing: '-0.02em'
            }}>
              {strings.adminDashboard}
            </h1>
            <p style={{ 
              color: colors.textSecondary, 
              fontSize: '16px', 
              lineHeight: '1.6',
              fontWeight: '500'
            }}>
              {strings.adminSubtitle}
            </p>
          </div>

          {/* KPI Stats */}
          <AdminDashboardStats stats={adminStats} language={language} colors={colors} />

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <TrendChart
              title={strings.leaseTrends}
              data={leaseTrend}
              dataKey="value"
              chartType="bar"
              color="#8B5CF6"
              colors={colors}
              language={language}
            />
            <TrendChart
              title={strings.depositTrends}
              data={depositTrend}
              dataKey="value"
              chartType="line"
              color="#C7A338"
              colors={colors}
              language={language}
            />
          </div>

          {/* Case Breakdown & Activity */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CaseBreakdown cases={allCases} colors={colors} language={language} />
            </div>
            <div>
              <ActivityTimeline activities={recentActivities} colors={colors} language={language} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // REGULAR USER VIEW
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3" style={{
            background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
            boxShadow: '0 8px 16px rgba(12, 59, 46, 0.25)'
          }}>
            <div className="w-5 h-5 flex-shrink-0" style={{ position: 'relative', display: 'inline-block' }}>
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
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2" style={{ 
            color: colors.textPrimary,
            letterSpacing: '-0.02em'
          }}>
            {strings.welcome}, {user?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p style={{ 
            color: colors.textSecondary, 
            fontSize: '16px', 
            lineHeight: '1.6',
            fontWeight: '500'
          }}>
            {strings.subtitle}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatsCard
            title={strings.activeLeases}
            value={leases.length.toString()}
            icon={FileText}
            scoreColor="#3B82F6"
            miniStats={leases.length > 0 ? [
              {
                label: language === 'th' ? 'สัญญาที่สแกนแล้ว' : 'Scanned',
                value: leases.filter(l => l.status === 'scanned' || l.status === 'paid').length
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
            ctaText={leases.length === 0 ? (language === 'th' ? 'อัปโหลดสัญญาแรก' : 'Upload First Lease') : undefined}
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
            ? 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)'
            : 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: '20px'
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#FFFFFF',
                marginBottom: '12px',
                letterSpacing: '-0.01em'
              }}>
                {strings.protectRights}
              </h2>
              <p style={{
                fontSize: '15px',
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
                  backgroundColor: '#C7A338',
                  color: '#1A1D1F',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#d4af37';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 20px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#C7A338';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
                }}
              >
                <Shield className="w-5 h-5" />
                {strings.uploadLease}
              </button>
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
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
              ? 'linear-gradient(135deg, #C7A338 0%, #d97706 100%)'
              : 'linear-gradient(135deg, #C7A338 0%, #d97706 100%)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: '20px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <TrendingUp style={{ width: '24px', height: '24px', color: '#1A1D1F' }} />
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: '#1A1D1F',
                    letterSpacing: '-0.01em'
                  }}>
                    {strings.upgradePremium}
                  </h3>
                </div>
                <p style={{
                  fontSize: '14px',
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
                    backgroundColor: '#0C3B2E',
                    color: '#FFFFFF',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 12px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#0a2f25';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 20px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#0C3B2E';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
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
  );
}
