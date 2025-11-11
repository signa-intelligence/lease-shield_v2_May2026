import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Shield, Database, TestTube, Send, Loader2, Settings, Trash2, Ban, CheckCircle, Crown, Coins, Lock, Unlock } from "lucide-react";
import { format, differenceInDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import AdminDashboardStats from "../components/admin/AdminDashboardStats";
import TrendChart from "../components/admin/TrendChart";
import CaseBreakdown from "../components/admin/CaseBreakdown";
import ActivityTimeline from "../components/admin/ActivityTimeline";
import TestNotifications from "../components/admin/TestNotifications";

export default function AdminConsole() {
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [sortField, setSortField] = useState('created_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editCreditsDialog, setEditCreditsDialog] = useState(false);
  const [selectedUserForCredits, setSelectedUserForCredits] = useState(null);
  const [newCreditAmount, setNewCreditAmount] = useState('');
  const [permissionsDialog, setPermissionsDialog] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
  const [permissionsFormData, setPermissionsFormData] = useState({});

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user && ['admin', 'super_admin'].includes(user.access_level),
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['allLeases'],
    queryFn: () => base44.entities.Lease.list('-created_date'),
    enabled: !!user && ['admin', 'super_admin'].includes(user.access_level),
  });

  const { data: allCases = [] } = useQuery({
    queryKey: ['allCases'],
    queryFn: () => base44.entities.Case.list('-created_date'),
    enabled: !!user && ['admin', 'super_admin'].includes(user.access_level),
  });

  const { data: allDeposits = [] } = useQuery({
    queryKey: ['allDeposits'],
    queryFn: () => base44.entities.DepositTracker.list('-created_date'),
    enabled: !!user && ['admin', 'super_admin'].includes(user.access_level),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['allDocuments'],
    queryFn: () => base44.entities.Document.list(),
    enabled: !!user && ['admin', 'super_admin'].includes(user.access_level),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: async (updatedUser, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      
      const targetUser = users.find(u => u.id === variables.userId);
      if (targetUser?.line_messaging_token) {
        try {
          let message = '';
          const lang = targetUser.language || 'en';
          
          if (variables.data.letter_credits !== undefined) {
            const oldCredits = targetUser.letter_credits || 0;
            const newCredits = variables.data.letter_credits;
            const diff = newCredits - oldCredits;
            
            message = lang === 'th'
              ? `🔔 อัปเดตบัญชี Lease Shield\n\nเครดิตจดหมายของคุณถูกอัปเดตโดยแอดมิน\n\n• ยอดเดิม: ${oldCredits}\n• ยอดใหม่: ${newCredits}\n• เปลี่ยนแปลง: ${diff > 0 ? '+' : ''}${diff}\n\nตรวจสอบบัญชีของคุณ: app.leaseshield.asia/account`
              : `🔔 Lease Shield Account Update\n\nYour letter credits were updated by admin\n\n• Previous: ${oldCredits}\n• New Balance: ${newCredits}\n• Change: ${diff > 0 ? '+' : ''}${diff}\n\nCheck your account: app.leaseshield.asia/account`;
          } else if (variables.data.plan_tier) {
            const oldTier = targetUser.plan_tier || 'free';
            const newTier = variables.data.plan_tier;
            
            message = lang === 'th'
              ? `🔔 อัปเดตบัญชี Lease Shield\n\nแผนของคุณถูกเปลี่ยนโดยแอดมิน\n\n• จาก: ${oldTier.toUpperCase()}\n• เป็น: ${newTier.toUpperCase()}\n\nตรวจสอบบัญชีของคุณ: app.leaseshield.asia/account`
              : `🔔 Lease Shield Account Update\n\nYour plan tier was changed by admin\n\n• From: ${oldTier.toUpperCase()}\n• To: ${newTier.toUpperCase()}\n\nCheck your account: app.leaseshield.asia/account`;
          } else if (variables.data.access_level) {
            const oldLevel = targetUser.access_level || 'user';
            const newLevel = variables.data.access_level;
            
            message = lang === 'th'
              ? `🔔 อัปเดตบัญชี Lease Shield\n\nระดับการเข้าถึงของคุณถูกเปลี่ยนโดยแอดมิน\n\n• จาก: ${oldLevel.toUpperCase()}\n• เป็น: ${newLevel.toUpperCase()}\n\nตรวจสอบบัญชีของคุณ: app.leaseshield.asia/account`
              : `🔔 Lease Shield Account Update\n\nYour access level was changed by admin\n\n• From: ${oldLevel.toUpperCase()}\n• To: ${newLevel.toUpperCase()}\n\nCheck your account: app.leaseshield.asia/account`;
          }
          
          if (message) {
            await base44.functions.invoke('sendLineMessage', {
              userId: targetUser.line_messaging_token,
              message: message
            });
            console.log('✅ LINE notification sent to user:', targetUser.email);
          }
        } catch (error) {
          console.error('Failed to send LINE notification:', error);
        }
      }
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const isSuperAdmin = user?.access_level === 'super_admin';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
  };

  const calculateAdminStats = () => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const startOfLastMonth = startOfMonth(lastMonth);
    const endOfLastMonth = endOfMonth(lastMonth);
    const startOfCurrentMonth = startOfMonth(now);

    const currentMonthUsers = users.filter(u => new Date(u.created_date) >= startOfCurrentMonth).length;
    const lastMonthUsers = users.filter(u => {
      const date = new Date(u.created_date);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    }).length;

    const currentMonthLeases = leases.filter(l => new Date(l.created_date) >= startOfCurrentMonth).length;
    const lastMonthLeases = leases.filter(l => {
      const date = new Date(l.created_date);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    }).length;

    const currentMonthCases = allCases.filter(c => new Date(c.created_date) >= startOfCurrentMonth).length;
    const lastMonthCases = allCases.filter(c => {
      const date = new Date(c.created_date);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    }).length;

    const activeSubscribers = users.filter(u => 
      u.subscription_status === 'active' && u.plan_tier && u.plan_tier !== 'free'
    ).length;

    const lastMonthSubscribers = users.filter(u => {
      const subDate = u.subscription_start_date ? new Date(u.subscription_start_date) : null;
      return subDate && subDate >= startOfLastMonth && subDate <= endOfLastMonth;
    }).length;

    const userTrend = lastMonthUsers > 0 ? Math.round(((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100) : 0;
    const leaseTrend = lastMonthLeases > 0 ? Math.round(((currentMonthLeases - lastMonthLeases) / lastMonthLeases) * 100) : 0;
    const caseTrend = lastMonthCases > 0 ? Math.round(((currentMonthCases - lastMonthCases) / lastMonthCases) * 100) : 0;
    const subscriberTrend = lastMonthSubscribers > 0 ? Math.round(((activeSubscribers - lastMonthSubscribers) / lastMonthSubscribers) * 100) : 0;

    const monthlyRevenue = users.reduce((sum, u) => {
      if (u.subscription_status === 'active' && u.plan_tier !== 'free') {
        const planPrices = { lite: 390, protect: 690, secure: 1290 };
        return sum + (planPrices[u.plan_tier] || 0);
      }
      return sum;
    }, 0);

    const activeCases = allCases.filter(c => !['closed', 'resolved'].includes(c.status)).length;
    const urgentCases = allCases.filter(c => c.flags?.urgent || c.fast_track).length;
    
    const resolvedCases = allCases.filter(c => c.status === 'closed' && c.timeline?.length > 0);
    const avgResolutionDays = resolvedCases.length > 0
      ? Math.round(
          resolvedCases.reduce((sum, c) => {
            const opened = new Date(c.created_date);
            const closedEntry = c.timeline.find(t_item => t_item.event === 'Case closed' || t_item.event === 'Case resolved');
            if (closedEntry) {
              const closed = new Date(closedEntry.timestamp);
              return sum + differenceInDays(closed, opened);
            }
            return sum;
          }, 0) / resolvedCases.length
        )
      : 0;

    return {
      totalUsers: users.length,
      userTrend,
      activeSubscribers,
      subscriberTrend: subscriberTrend,
      monthlyRevenue,
      revenueTrend: 0,
      totalLeases: leases.length,
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

  const generateTrendData = () => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    const leaseTrend = last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const count = leases.filter(l => {
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

  const generateRecentActivities = () => {
    const activities = [];

    users.slice(0, 3).forEach(u => {
      activities.push({
        type: 'user_registered',
        description: u.email,
        timestamp: u.created_date
      });
    });

    leases.slice(0, 3).forEach(l => {
      activities.push({
        type: 'lease_uploaded',
        description: l.property_address || l.created_by,
        timestamp: l.created_date
      });
    });

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

    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  };

  const adminStats = calculateAdminStats();
  const { leaseTrend, depositTrend } = generateTrendData();
  const recentActivities = generateRecentActivities();

  const t = {
    en: {
      adminConsole: "Admin Console",
      adminDashboard: "Admin Dashboard",
      adminSubtitle: "Monitor system performance and user activity",
      systemOverview: "System Overview & Management",
      totalUsers: "Total Users",
      activeSubscribers: "Active Subscribers",
      totalLeases: "Total Leases",
      totalDocuments: "Total Documents",
      demoDataSeeder: "Demo Data Seeder",
      demoDataDesc: "Generate sample data for testing",
      seedDemo: "Seed Demo Data",
      seeding: "Seeding...",
      userManagement: "User Management",
      user: "User",
      email: "Email",
      plan: "Plan",
      accessLevel: "Access Level",
      status: "Status",
      actions: "Actions",
      active: "Active",
      suspended: "Suspended",
      suspend: "Suspend",
      unsuspend: "Unsuspend",
      delete: "Delete",
      changeRole: "Change Role",
      changeTier: "Change Tier",
      recentLeases: "Recent Leases",
      property: "Property",
      uploadedBy: "Uploaded By",
      uploadedOn: "Uploaded On",
      opsConsole: "Operations Console",
      opsConsoleDesc: "Manage cases and operations",
      goToOps: "Go to Ops Console",
      editCredits: "Edit Credits",
      letterCredits: "Letter Credits",
      currentBalance: "Current Balance",
      newBalance: "New Balance",
      updateCredits: "Update Credits",
      cancel: "Cancel",
      updating: "Updating...",
      managePermissions: "Manage Permissions",
      featurePermissions: "Feature Permissions",
      featurePermissionsDesc: "Configure feature access for Admin and VA roles",
      permissions: "Permissions",
      savePermissions: "Save Permissions",
      manageUsers: "Manage Users",
      manageCases: "Manage Cases",
      viewAnalytics: "View Analytics",
      manageSubscriptions: "Manage Subscriptions",
      manageCredits: "Manage Credits",
      sendNotifications: "Send Notifications",
      manageTemplates: "Manage Templates",
      deleteData: "Delete Data",
      accessOpsConsole: "Access Ops Console",
      leaseTrends: "Lease Upload Trends",
      depositTrends: "Deposit Tracking Trends"
    },
    th: {
      adminConsole: "คอนโซลผู้ดูแล",
      adminDashboard: "แดชบอร์ดผู้ดูแล",
      adminSubtitle: "ติดตามประสิทธิภาพระบบและกิจกรรมผู้ใช้",
      systemOverview: "ภาพรวมระบบและการจัดการ",
      totalUsers: "ผู้ใช้ทั้งหมด",
      activeSubscribers: "สมาชิกที่ใช้งาน",
      totalLeases: "สัญญาเช่าทั้งหมด",
      totalDocuments: "เอกสารทั้งหมด",
      demoDataSeeder: "สร้างข้อมูลทดสอบ",
      demoDataDesc: "สร้างข้อมูลตัวอย่างสำหรับการทดสอบ",
      seedDemo: "สร้างข้อมูลทดสอบ",
      seeding: "กำลังสร้าง...",
      userManagement: "การจัดการผู้ใช้",
      user: "ผู้ใช้",
      email: "อีเมล",
      plan: "แผน",
      accessLevel: "ระดับการเข้าถึง",
      status: "สถานะ",
      actions: "การดำเนินการ",
      active: "ใช้งาน",
      suspended: "ระงับ",
      suspend: "ระงับ",
      unsuspend: "ยกเลิกการระงับ",
      delete: "ลบ",
      changeRole: "เปลี่ยนบทบาท",
      changeTier: "เปลี่ยนแผน",
      recentLeases: "สัญญาเช่าล่าสุด",
      property: "ทรัพย์สิน",
      uploadedBy: "อัปโหลดโดย",
      uploadedOn: "อัปโหลดเมื่อ",
      opsConsole: "คอนโซลปฏิบัติการ",
      opsConsoleDesc: "จัดการคดีและการดำเนินงาน",
      goToOps: "ไปที่คอนโซลปฏิบัติการ",
      editCredits: "แก้ไขเครดิต",
      letterCredits: "เครดิตจดหมาย",
      currentBalance: "ยอดคงเหลือปัจจุบัน",
      newBalance: "ยอดคงเหลือใหม่",
      updateCredits: "อัปเดตเครดิต",
      cancel: "ยกเลิก",
      updating: "กำลังอัปเดต...",
      managePermissions: "จัดการสิทธิ์",
      featurePermissions: "สิทธิ์การเข้าถึงฟีเจอร์",
      featurePermissionsDesc: "กำหนดการเข้าถึงฟีเจอร์สำหรับบทบาท Admin และ VA",
      permissions: "สิทธิ์",
      savePermissions: "บันทึกสิทธิ์",
      manageUsers: "จัดการผู้ใช้",
      manageCases: "จัดการคดี",
      viewAnalytics: "ดูสถิติ",
      manageSubscriptions: "จัดการการสมัครสมาชิก",
      manageCredits: "จัดการเครดิต",
      sendNotifications: "ส่งการแจ้งเตือน",
      manageTemplates: "จัดการเทมเพลต",
      deleteData: "ลบข้อมูล",
      accessOpsConsole: "เข้าถึงคอนโซลปฏิบัติการ",
      leaseTrends: "แนวโน้มการอัปโหลดสัญญา",
      depositTrends: "แนวโน้มการติดตามเงินมัดจำ"
    }
  };

  const strings = t[language];

  if (!user || !['admin', 'super_admin'].includes(user.access_level)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textSecondary, opacity: 0.5 }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>Access Denied</h2>
            <p style={{ color: colors.textSecondary }}>Admin access required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSeedDemo = async () => {
    setSeedingDemo(true);
    try {
      await base44.functions.invoke('seedDemoData', {});
      queryClient.invalidateQueries();
      alert('Demo data seeded successfully!');
    } catch (error) {
      console.error('Seed failed:', error);
      alert('Failed to seed demo data');
    } finally {
      setSeedingDemo(false);
    }
  };

  const handleUpdateCredits = async () => {
    if (!selectedUserForCredits || newCreditAmount === '') return;

    try {
      await updateUserMutation.mutateAsync({
        userId: selectedUserForCredits.id,
        data: { letter_credits: parseInt(newCreditAmount) }
      });
      setEditCreditsDialog(false);
      setSelectedUserForCredits(null);
      setNewCreditAmount('');
      alert(language === 'th' ? 'อัปเดตเครดิตสำเร็จ' : 'Credits updated successfully');
    } catch (error) {
      console.error('Failed to update credits:', error);
      alert(language === 'th' ? 'ไม่สามารถอัปเดตเครดิตได้' : 'Failed to update credits');
    }
  };

  const handleOpenCreditsDialog = (targetUser) => {
    setSelectedUserForCredits(targetUser);
    setNewCreditAmount(targetUser.letter_credits?.toString() || '0');
    setEditCreditsDialog(true);
  };

  const handleOpenPermissionsDialog = (targetUser) => {
    setSelectedUserForPermissions(targetUser);
    setPermissionsFormData(targetUser.feature_permissions || {
      manage_users: false,
      manage_cases: false,
      view_analytics: false,
      manage_subscriptions: false,
      manage_credits: false,
      send_notifications: false,
      manage_templates: false,
      delete_data: false,
      access_ops_console: false
    });
    setPermissionsDialog(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUserForPermissions) return;

    try {
      await updateUserMutation.mutateAsync({
        userId: selectedUserForPermissions.id,
        data: { feature_permissions: permissionsFormData }
      });
      setPermissionsDialog(false);
      setSelectedUserForPermissions(null);
      alert(language === 'th' ? 'อัปเดตสิทธิ์สำเร็จ' : 'Permissions updated successfully');
    } catch (error) {
      console.error('Failed to update permissions:', error);
      alert(language === 'th' ? 'ไม่สามารถอัปเดตสิทธิ์ได้' : 'Failed to update permissions');
    }
  };

  const togglePermission = (key) => {
    setPermissionsFormData(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const sortedUsers = [...users].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const FEATURE_DEFINITIONS = [
    { key: 'manage_users', label: strings.manageUsers, icon: Users, color: 'text-blue-600' },
    { key: 'manage_cases', label: strings.manageCases, icon: Shield, color: 'text-emerald-600' },
    { key: 'view_analytics', label: strings.viewAnalytics, icon: Database, color: 'text-purple-600' },
    { key: 'manage_subscriptions', label: strings.manageSubscriptions, icon: Crown, color: 'text-amber-600' },
    { key: 'manage_credits', label: strings.manageCredits, icon: Coins, color: 'text-amber-600' },
    { key: 'send_notifications', label: strings.sendNotifications, icon: Send, color: 'text-blue-600' },
    { key: 'manage_templates', label: strings.manageTemplates, icon: FileText, color: 'text-indigo-600' },
    { key: 'delete_data', label: strings.deleteData, icon: Trash2, color: 'text-red-600' },
    { key: 'access_ops_console', label: strings.accessOpsConsole, icon: Settings, color: 'text-slate-600' }
  ];

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
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

        <AdminDashboardStats stats={adminStats} language={language} colors={colors} />

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

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-3 xl:col-span-2">
            <CaseBreakdown cases={allCases} colors={colors} language={language} />
          </div>
          <div className="lg:col-span-3 xl:col-span-1">
            <ActivityTimeline activities={recentActivities} colors={colors} language={language} />
          </div>
        </div>

        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <TestTube className="w-5 h-5 text-blue-600" />
              {strings.demoDataSeeder}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="mb-4" style={{ color: colors.textSecondary }}>{strings.demoDataDesc}</p>
            <Button
              onClick={handleSeedDemo}
              disabled={seedingDemo}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {seedingDemo ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {strings.seeding}
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  {strings.seedDemo}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="mb-6">
          <TestNotifications users={users} language={language} colors={colors} />
        </div>

        <Dialog open={permissionsDialog} onOpenChange={setPermissionsDialog}>
          <DialogContent className="max-w-2xl" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Lock className="w-5 h-5 text-purple-600" />
                {strings.featurePermissions}
              </DialogTitle>
            </DialogHeader>
            {selectedUserForPermissions && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{ 
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `1px solid ${colors.borderColor}`
                }}>
                  <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
                    {selectedUserForPermissions.full_name}
                  </p>
                  <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                    {selectedUserForPermissions.email}
                  </p>
                  <Badge className={
                    selectedUserForPermissions.access_level === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                    selectedUserForPermissions.access_level === 'admin' ? 'bg-blue-100 text-blue-800' :
                    selectedUserForPermissions.access_level === 'va' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-800'
                  }>
                    {selectedUserForPermissions.access_level || 'user'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                  {FEATURE_DEFINITIONS.map((feature) => {
                    const Icon = feature.icon;
                    const isEnabled = permissionsFormData[feature.key];
                    
                    return (
                      <div
                        key={feature.key}
                        onClick={() => togglePermission(feature.key)}
                        className="p-4 rounded-lg border-2 cursor-pointer transition-all"
                        style={{
                          backgroundColor: isEnabled 
                            ? (isDarkMode ? '#1F2937' : '#F0FDF4')
                            : (isDarkMode ? '#2A2D30' : '#FFFFFF'),
                          borderColor: isEnabled ? '#10B981' : colors.borderColor
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isEnabled ? 'bg-emerald-100' : 'bg-slate-100'
                            }`}>
                              <Icon className={`w-5 h-5 ${isEnabled ? 'text-emerald-600' : feature.color}`} />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                                {feature.label}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {isEnabled ? (
                              <Unlock className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Lock className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPermissionsDialog(false)}
                style={{ borderColor: colors.borderColor }}
              >
                {strings.cancel}
              </Button>
              <Button
                onClick={handleSavePermissions}
                disabled={updateUserMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {updateUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {strings.updating}
                  </>
                ) : (
                  strings.savePermissions
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editCreditsDialog} onOpenChange={setEditCreditsDialog}>
          <DialogContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Coins className="w-5 h-5 text-amber-600" />
                {strings.editCredits}
              </DialogTitle>
            </DialogHeader>
            {selectedUserForCredits && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                    {selectedUserForCredits.full_name}
                  </p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    {selectedUserForCredits.email}
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ 
                  backgroundColor: isDarkMode ? '#353A3D' : '#FFF7ED',
                  border: `1px solid ${colors.borderColor}`
                }}>
                  <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>
                    {strings.currentBalance}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: '#C7A338' }}>
                    {selectedUserForCredits.letter_credits || 0}
                  </p>
                </div>
                <div>
                  <Label htmlFor="newCredits" style={{ color: colors.textPrimary }}>
                    {strings.newBalance}
                  </Label>
                  <Input
                    id="newCredits"
                    type="number"
                    min="0"
                    value={newCreditAmount}
                    onChange={(e) => setNewCreditAmount(e.target.value)}
                    className="mt-2"
                    style={{
                      backgroundColor: colors.cardBg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditCreditsDialog(false)}
                style={{ borderColor: colors.borderColor }}
              >
                {strings.cancel}
              </Button>
              <Button
                onClick={handleUpdateCredits}
                disabled={updateUserMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {updateUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {strings.updating}
                  </>
                ) : (
                  strings.updateCredits
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle style={{ color: colors.textPrimary }}>{strings.userManagement}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>{strings.user}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>{strings.email}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>{strings.accessLevel}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>{strings.plan}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>LINE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>{strings.letterCredits}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>{strings.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((u, idx) => {
                    const lastUpdate = new Date(u.updated_date || u.created_date);
                    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                    const isOnline = lastUpdate > fiveMinutesAgo;
                    
                    return (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: `1px solid ${colors.borderColor}`,
                          backgroundColor: idx % 2 === 0 ? colors.cardBg : (isDarkMode ? '#2A2D30' : '#F8FAFC')
                        }}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>{u.full_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs" style={{ color: colors.textSecondary }}>{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={
                            u.access_level === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                            u.access_level === 'admin' ? 'bg-blue-100 text-blue-800' :
                            u.access_level === 'va' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-800'
                          }>
                            {u.access_level || 'user'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={
                            u.plan_tier === 'secure' ? 'bg-purple-100 text-purple-800' :
                            u.plan_tier === 'protect' ? 'bg-emerald-100 text-emerald-800' :
                            u.plan_tier === 'lite' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'
                          }>
                            {u.plan_tier || 'free'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <span className="text-xs" style={{ color: colors.textSecondary }}>
                              {isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {u.line_messaging_token ? (
                            <Badge className="bg-emerald-100 text-emerald-700 flex items-center gap-1 w-fit">
                              <CheckCircle className="w-3 h-3" />
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500 flex items-center gap-1 w-fit">
                              <Ban className="w-3 h-3" />
                              Not Connected
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleOpenCreditsDialog(u)}
                            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-amber-100 transition-colors"
                          >
                            <Coins className="w-4 h-4 text-amber-600" />
                            <span className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                              {u.letter_credits || 0}
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            <Select
                              value={u.access_level || 'user'}
                              onValueChange={(val) => updateUserMutation.mutate({
                                userId: u.id,
                                data: { access_level: val }
                              })}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="va">VA</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={u.plan_tier || 'free'}
                              onValueChange={(val) => updateUserMutation.mutate({
                                userId: u.id,
                                data: { plan_tier: val }
                              })}
                            >
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="lite">Lite</SelectItem>
                                <SelectItem value="protect">Protect</SelectItem>
                                <SelectItem value="secure">Secure</SelectItem>
                              </SelectContent>
                            </Select>
                            {isSuperAdmin && (u.access_level === 'admin' || u.access_level === 'va') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenPermissionsDialog(u)}
                                className="text-xs h-8"
                              >
                                <Lock className="w-3 h-3 mr-1" />
                                {strings.permissions}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle style={{ color: colors.textPrimary }}>{strings.recentLeases}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {leases.slice(0, 5).map((lease) => (
                <div
                  key={lease.id}
                  className="flex justify-between items-center p-3 rounded-lg"
                  style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}
                >
                  <div>
                    <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                      {lease.property_address || 'No address'}
                    </p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {strings.uploadedBy}: {lease.created_by}
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    {format(new Date(lease.created_date), 'MMM d, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-bold" style={{ color: colors.textPrimary }}>
                    {strings.opsConsole}
                  </h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {strings.opsConsoleDesc}
                  </p>
                </div>
              </div>
              <Link to={createPageUrl("OpsConsole")}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  {strings.goToOps}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}