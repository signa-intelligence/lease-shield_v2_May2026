import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Shield, Database, TestTube, Send, Loader2, Settings, Trash2, Ban, CheckCircle, Crown, Coins, Lock, Unlock, DollarSign, TrendingUp, AlertCircle, UserX, UserCheck, Scale } from "lucide-react";
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
import ReminderControl from "../components/admin/ReminderControl";
import NotificationHistory from "../components/admin/NotificationHistory";
import CaseKanban from "../components/admin/CaseKanban";
import UserImpersonation from "../components/admin/UserImpersonation";

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
  const [showKanban, setShowKanban] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const [loadingDebug, setLoadingDebug] = useState(false);
  const [restoringUsers, setRestoringUsers] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch all users using service role to bypass RLS
  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      console.log('🔍 [ADMIN] Fetching all users via getAllUsers function...');
      try {
        const response = await base44.functions.invoke('getAllUsers');
        console.log('📊 [ADMIN] Function response:', response.data);
        const userList = response.data?.users || response.data || [];
        console.log('📊 [ADMIN] Fetched users count:', userList.length);
        return userList;
      } catch (error) {
        console.error('❌ [ADMIN] Failed to fetch users:', error);
        return [];
      }
    },
    enabled: !!user && (
      ['admin', 'super_admin', 'va'].includes(user.access_level) ||
      ['admin', 'super_admin', 'va'].includes(user.role)
    ),
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['allLeases'],
    queryFn: () => base44.entities.Lease.list('-created_date'),
    enabled: !!user && (
      ['admin', 'super_admin', 'va'].includes(user.access_level) ||
      ['admin', 'super_admin', 'va'].includes(user.role)
    ),
  });

  const { data: allCases = [] } = useQuery({
    queryKey: ['allCases'],
    queryFn: () => base44.entities.Case.list('-created_date'),
    enabled: !!user && (
      ['admin', 'super_admin', 'va'].includes(user.access_level) ||
      ['admin', 'super_admin', 'va'].includes(user.role)
    ),
  });

  const { data: allDeposits = [] } = useQuery({
    queryKey: ['allDeposits'],
    queryFn: () => base44.entities.DepositTracker.list('-created_date'),
    enabled: !!user && (
      ['admin', 'super_admin', 'va'].includes(user.access_level) ||
      ['admin', 'super_admin', 'va'].includes(user.role)
    ),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['allDocuments'],
    queryFn: () => base44.entities.Document.list(),
    enabled: !!user && (
      ['admin', 'super_admin', 'va'].includes(user.access_level) ||
      ['admin', 'super_admin', 'va'].includes(user.role)
    ),
  });

  // ✅ COMPUTE SUPER ADMIN COUNT
  const superAdmins = users.filter(u => u.access_level === 'super_admin' && u.is_active !== false && !u.deleted_at);
  const superAdminCount = superAdmins.length;

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
          } else if (variables.data.is_active !== undefined) {
            message = lang === 'th'
              ? `🔔 อัปเดตบัญชี Lease Shield\n\nบัญชีของคุณถูก${variables.data.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}โดยแอดมิน\n\nตรวจสอบบัญชีของคุณ: app.leaseshield.asia/account`
              : `🔔 Lease Shield Account Update\n\nYour account was ${variables.data.is_active ? 'enabled' : 'disabled'} by admin\n\nCheck your account: app.leaseshield.asia/account`;
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
    mutationFn: (userId) => base44.entities.User.update(userId, { deleted_at: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });

  const handleCaseStatusChange = async (caseId, newStatus) => {
    try {
      await base44.asServiceRole.entities.Case.update(caseId, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['allCases'] });
    } catch (error) {
      console.error('Failed to update case status:', error);
    }
  };

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
      manageTemplates: "Manage Letter Templates",
      deleteData: "Delete Data",
      accessOpsConsole: "Access Ops Console",
      leaseTrends: "Lease Upload Trends",
      depositTrends: "Deposit Tracking Trends",
      caseManagement: "Case Management",
      hideKanban: "Hide Kanban",
      showKanban: "Show Kanban",
      revenueAnalyticsTitle: "Revenue & Business Analytics",
      revenueAnalyticsDesc: "View revenue, users, and feature purchase insights",
      viewAnalyticsButton: "View Analytics",
      superAdminWarning: "There must be at least one Super Admin at all times. Cannot change this user's role.",
      disableUser: "Disable",
      enableUser: "Enable",
      removeUser: "Remove",
      confirmDisable: "Are you sure you want to disable this user? They will not be able to sign in.",
      confirmEnable: "Enable this user account?",
      confirmRemove: "Are you sure you want to remove this user? This is a soft delete and can be reversed.",
      cannotDisableSelf: "Cannot disable yourself",
      cannotRemoveSelf: "Cannot remove yourself",
      disabled: "Disabled",
      deleted: "Deleted",
      manageTemplatesDesc: "Upload and manage letter templates for users",
      goToTemplates: "Manage Templates",
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
      manageTemplates: "จัดการเทมเพลตจดหมาย",
      deleteData: "ลบข้อมูล",
      accessOpsConsole: "เข้าถึงคอนโซลปฏิบัติการ",
      leaseTrends: "แนวโน้มการอัปโหลดสัญญา",
      depositTrends: "แนวโน้มการติดตามเงินมัดจำ",
      caseManagement: "จัดการคดี",
      hideKanban: "ซ่อน Kanban",
      showKanban: "แสดง Kanban",
      revenueAnalyticsTitle: "วิเคราะห์รายได้และธุรกิจ",
      revenueAnalyticsDesc: "ดูข้อมูลรายได้ ผู้ใช้ และการซื้อฟีเจอร์",
      viewAnalyticsButton: "เปิดดู",
      superAdminWarning: "ต้องมี Super Admin อย่างน้อยหนึ่งคนเสมอ ไม่สามารถเปลี่ยนบทบาทของผู้ใช้นี้ได้",
      disableUser: "ปิดใช้งาน",
      enableUser: "เปิดใช้งาน",
      removeUser: "ลบ",
      confirmDisable: "คุณแน่ใจหรือไม่ว่าต้องการปิดใช้งานผู้ใช้นี้? พวกเขาจะไม่สามารถเข้าสู่ระบบได้",
      confirmEnable: "เปิดใช้งานบัญชีผู้ใช้นี้?",
      confirmRemove: "คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้? นี่คือการลบแบบซอฟต์และสามารถกู้คืนได้",
      cannotDisableSelf: "ไม่สามารถปิดใช้งานตัวเองได้",
      cannotRemoveSelf: "ไม่สามารถลบตัวเองได้",
      disabled: "ปิดใช้งาน",
      deleted: "ถูกลบ",
      manageTemplatesDesc: "อัปโหลดและจัดการเทมเพลตจดหมายสำหรับผู้ใช้",
      goToTemplates: "จัดการเทมเพลต",
    },
    zh: {
      adminConsole: "管理控制台",
      adminDashboard: "管理仪表板",
      adminSubtitle: "监控系统性能和用户活动",
      systemOverview: "系统概览与管理",
      totalUsers: "总用户数",
      activeSubscribers: "活跃订阅者",
      totalLeases: "总租约数",
      totalDocuments: "总文档数",
      demoDataSeeder: "演示数据生成器",
      demoDataDesc: "生成测试样本数据",
      seedDemo: "生成演示数据",
      seeding: "生成中...",
      userManagement: "用户管理",
      user: "用户",
      email: "电子邮件",
      plan: "计划",
      accessLevel: "访问级别",
      status: "状态",
      actions: "操作",
      active: "活跃",
      suspended: "已暂停",
      suspend: "暂停",
      unsuspend: "取消暂停",
      delete: "删除",
      changeRole: "更改角色",
      changeTier: "更改层级",
      recentLeases: "最近的租约",
      property: "物业",
      uploadedBy: "上传者",
      uploadedOn: "上传于",
      opsConsole: "运营控制台",
      opsConsoleDesc: "管理案件和运营",
      goToOps: "前往运营控制台",
      editCredits: "编辑积分",
      letterCredits: "信件积分",
      currentBalance: "当前余额",
      newBalance: "新余额",
      updateCredits: "更新积分",
      cancel: "取消",
      updating: "更新中...",
      managePermissions: "管理权限",
      featurePermissions: "功能权限",
      featurePermissionsDesc: "配置管理员和VA角色的功能访问",
      permissions: "权限",
      savePermissions: "保存权限",
      manageUsers: "管理用户",
      manageCases: "管理案件",
      viewAnalytics: "查看分析",
      manageSubscriptions: "管理订阅",
      manageCredits: "管理积分",
      sendNotifications: "发送通知",
      manageTemplates: "管理信件模板",
      deleteData: "删除数据",
      accessOpsConsole: "访问运营控制台",
      leaseTrends: "租约上传趋势",
      depositTrends: "押金追踪趋势",
      caseManagement: "案件管理",
      hideKanban: "隐藏看板",
      showKanban: "显示看板",
      revenueAnalyticsTitle: "收入和业务分析",
      revenueAnalyticsDesc: "查看收入、用户和功能购买洞察",
      viewAnalyticsButton: "查看分析",
      superAdminWarning: "至少需要保留一名超级管理员。无法更改此用户的角色。",
      disableUser: "禁用",
      enableUser: "启用",
      removeUser: "移除",
      confirmDisable: "您确定要禁用此用户吗？他们将无法登录。",
      confirmEnable: "启用此用户帐户？",
      confirmRemove: "您确定要移除此用户吗？这是软删除，可以恢复。",
      cannotDisableSelf: "无法禁用自己",
      cannotRemoveSelf: "无法移除自己",
      disabled: "已禁用",
      deleted: "已删除",
      manageTemplatesDesc: "上传和管理用户的信件模板",
      goToTemplates: "管理模板",
    },
    ja: {
      adminConsole: "管理コンソール",
      adminDashboard: "管理ダッシュボード",
      adminSubtitle: "システムパフォーマンスとユーザーアクティビティを監視",
      systemOverview: "システム概要と管理",
      totalUsers: "総ユーザー数",
      activeSubscribers: "アクティブサブスクライバー",
      totalLeases: "総賃貸契約数",
      totalDocuments: "総ドキュメント数",
      demoDataSeeder: "デモデータシーダー",
      demoDataDesc: "テスト用サンプルデータを生成",
      seedDemo: "デモデータを生成",
      seeding: "生成中...",
      userManagement: "ユーザー管理",
      user: "ユーザー",
      email: "メール",
      plan: "プラン",
      accessLevel: "アクセスレベル",
      status: "ステータス",
      actions: "アクション",
      active: "アクティブ",
      suspended: "停止中",
      suspend: "停止",
      unsuspend: "停止解除",
      delete: "削除",
      changeRole: "役割を変更",
      changeTier: "階層を変更",
      recentLeases: "最近の賃貸契約",
      property: "物件",
      uploadedBy: "アップロード者",
      uploadedOn: "アップロード日",
      opsConsole: "オペレーションコンソール",
      opsConsoleDesc: "ケースと運用を管理",
      goToOps: "オペレーションコンソールへ",
      editCredits: "クレジット編集",
      letterCredits: "レタークレジット",
      currentBalance: "現在の残高",
      newBalance: "新しい残高",
      updateCredits: "クレジット更新",
      cancel: "キャンセル",
      updating: "更新中...",
      managePermissions: "権限管理",
      featurePermissions: "機能権限",
      featurePermissionsDesc: "管理者とVA役割の機能アクセスを設定",
      permissions: "権限",
      savePermissions: "権限を保存",
      manageUsers: "ユーザー管理",
      manageCases: "ケース管理",
      viewAnalytics: "分析を表示",
      manageSubscriptions: "サブスクリプション管理",
      manageCredits: "クレジット管理",
      sendNotifications: "通知を送信",
      manageTemplates: "レターテンプレート管理",
      deleteData: "データ削除",
      accessOpsConsole: "オペレーションコンソールアクセス",
      leaseTrends: "賃貸契約アップロードトレンド",
      depositTrends: "敷金追跡トレンド",
      caseManagement: "ケース管理",
      hideKanban: "カンバンを非表示",
      showKanban: "カンバンを表示",
      revenueAnalyticsTitle: "収益とビジネス分析",
      revenueAnalyticsDesc: "収益、ユーザー、機能購入の洞察を表示",
      viewAnalyticsButton: "分析を表示",
      superAdminWarning: "常に少なくとも1人のスーパー管理者が必要です。このユーザーの役割を変更することはできません。",
      disableUser: "無効化",
      enableUser: "有効化",
      removeUser: "削除",
      confirmDisable: "このユーザーを無効にしますか？ログインできなくなります。",
      confirmEnable: "このユーザーアカウントを有効にしますか？",
      confirmRemove: "このユーザーを削除しますか？これはソフトデリートであり、元に戻すことができます。",
      cannotDisableSelf: "自分自身を無効にすることはできません",
      cannotRemoveSelf: "自分自身を削除することはできません",
      disabled: "無効",
      deleted: "削除済み",
      manageTemplatesDesc: "ユーザー向けのレターテンプレートをアップロード・管理します",
      goToTemplates: "テンプレート管理",
    },
    ko: {
      adminConsole: "관리 콘솔",
      adminDashboard: "관리 대시보드",
      adminSubtitle: "시스템 성능 및 사용자 활동 모니터링",
      systemOverview: "시스템 개요 및 관리",
      totalUsers: "총 사용자 수",
      activeSubscribers: "활성 구독자",
      totalLeases: "총 임대 계약 수",
      totalDocuments: "총 문서 수",
      demoDataSeeder: "데모 데이터 생성기",
      demoDataDesc: "테스트용 샘플 데이터 생성",
      seedDemo: "데모 데이터 생성",
      seeding: "생성 중...",
      userManagement: "사용자 관리",
      user: "사용자",
      email: "이메일",
      plan: "계획",
      accessLevel: "액세스 레벨",
      status: "상태",
      actions: "작업",
      active: "활성",
      suspended: "정지됨",
      suspend: "정지",
      unsuspend: "정지 해제",
      delete: "삭제",
      changeRole: "역할 변경",
      changeTier: "등급 변경",
      recentLeases: "최근 임대 계약",
      property: "부동산",
      uploadedBy: "업로드자",
      uploadedOn: "업로드 날짜",
      opsConsole: "운영 콘솔",
      opsConsoleDesc: "사례 및 운영 관리",
      goToOps: "운영 콘솔로 이동",
      editCredits: "크레딧 편집",
      letterCredits: "레터 크레딧",
      currentBalance: "현재 잔액",
      newBalance: "새 잔액",
      updateCredits: "크레딧 업데이트",
      cancel: "취소",
      updating: "업데이트 중...",
      managePermissions: "권한 관리",
      featurePermissions: "기능 권한",
      featurePermissionsDesc: "관리자 및 VA 역할에 대한 기능 액세스 구성",
      permissions: "권한",
      savePermissions: "권한 저장",
      manageUsers: "사용자 관리",
      manageCases: "사례 관리",
      viewAnalytics: "분석 보기",
      manageSubscriptions: "구독 관리",
      manageCredits: "크레딧 관리",
      sendNotifications: "알림 보내기",
      manageTemplates: "템플릿 관리",
      deleteData: "데이터 삭제",
      accessOpsConsole: "운영 콘솔 액세스",
      leaseTrends: "임대 계약 업로드 추세",
      depositTrends: "보증금 추적 추세",
      caseManagement: "사례 관리",
      hideKanban: "칸반 숨기기",
      showKanban: "칸반 표시",
      revenueAnalyticsTitle: "수익 및 비즈니스 분석",
      revenueAnalyticsDesc: "수익, 사용자 및 기능 구매 통찰력 보기",
      viewAnalyticsButton: "분석 보기",
      superAdminWarning: "항상 최소 한 명의 슈퍼 관리자가 있어야 합니다. 이 사용자의 역할을 변경할 수 없습니다.",
      disableUser: "비활성화",
      enableUser: "활성화",
      removeUser: "제거",
      confirmDisable: "이 사용자를 비활성화하시겠습니까? 로그인할 수 없게 됩니다.",
      confirmEnable: "이 사용자 계정을 활성화하시겠습니까?",
      confirmRemove: "이 사용자를 제거하시겠습니까? 이는 소프트 삭제이며 되돌릴 수 있습니다.",
      cannotDisableSelf: "자신을 비활성화할 수 없습니다",
      cannotRemoveSelf: "자신을 제거할 수 없습니다",
      disabled: "비활성화됨",
      deleted: "삭제됨",
      manageTemplatesDesc: "사용자를 위한 편지 템플릿 업로드 및 관리",
      goToTemplates: "템플릿 관리",
    }
  };

  const strings = t[language] || t.en;

  // Check admin access using both role and access_level
  const isAuthorized = user && (
    ['admin', 'super_admin', 'va'].includes(user.access_level) ||
    ['admin', 'super_admin', 'va'].includes(user.role)
  );

  if (!isAuthorized) {
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

  const handleDisableUser = async (targetUser) => {
    if (targetUser.id === user.id) {
      alert(strings.cannotDisableSelf);
      return;
    }

    const isTargetUserSuperAdmin = targetUser.access_level === 'super_admin';
    if (isTargetUserSuperAdmin && superAdminCount <= 1) {
      alert(strings.superAdminWarning);
      return;
    }

    if (!confirm(strings.confirmDisable)) return;

    try {
      await updateUserMutation.mutateAsync({
        userId: targetUser.id,
        data: { is_active: false }
      });
    } catch (error) {
      console.error('Failed to disable user:', error);
      alert(language === 'th' ? 'ไม่สามารถปิดใช้งานผู้ใช้ได้' : 'Failed to disable user');
    }
  };

  const handleEnableUser = async (targetUser) => {
    if (!confirm(strings.confirmEnable)) return;

    try {
      await updateUserMutation.mutateAsync({
        userId: targetUser.id,
        data: { is_active: true }
      });
    } catch (error) {
      console.error('Failed to enable user:', error);
      alert(language === 'th' ? 'ไม่สามารถเปิดใช้งานผู้ใช้ได้' : 'Failed to enable user');
    }
  };

  const handleRemoveUser = async (targetUser) => {
    if (targetUser.id === user.id) {
      alert(strings.cannotRemoveSelf);
      return;
    }

    const isTargetUserSuperAdmin = targetUser.access_level === 'super_admin';
    if (isTargetUserSuperAdmin && superAdminCount <= 1) {
      alert(strings.superAdminWarning);
      return;
    }

    if (!confirm(strings.confirmRemove)) return;

    try {
      await deleteUserMutation.mutateAsync(targetUser.id);
    } catch (error) {
      console.error('Failed to remove user:', error);
      alert(language === 'th' ? 'ไม่สามารถลบผู้ใช้ได้' : 'Failed to remove user');
    }
  };

  const handleDebugUsers = async () => {
    setLoadingDebug(true);
    try {
      const response = await base44.functions.invoke('debugUsers');
      console.log('🔍 Debug result:', response.data);
      setDebugData(response.data);
    } catch (error) {
      console.error('Debug failed:', error);
      alert('Debug failed: ' + error.message);
    } finally {
      setLoadingDebug(false);
    }
  };

  const handleRestoreUsers = async () => {
    if (!confirm('Restore all soft-deleted and disabled users? This will make them active and visible again.')) {
      return;
    }

    setRestoringUsers(true);
    try {
      const response = await base44.functions.invoke('restoreUsers');
      console.log('✅ Restore result:', response.data);
      
      if (response.data?.success) {
        alert(`✅ RESTORED ${response.data.restored_count} users!\n\nCheck the table below.`);
        queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      } else {
        alert('❌ Restore failed: ' + response.data?.error);
      }
    } catch (error) {
      console.error('Restore failed:', error);
      alert('Restore failed: ' + error.message);
    } finally {
      setRestoringUsers(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const response = await base44.functions.invoke('exportUsersBackup');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      alert('✅ User backup exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error.message);
    }
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

        {isSuperAdmin && (
          <Card className="mb-6 border-none shadow-lg" style={{ 
            backgroundColor: colors.cardBg,
            borderLeft: '6px solid #10B981'
          }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#10B981',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: colors.textPrimary }}>
                      {strings.revenueAnalyticsTitle}
                    </h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {strings.revenueAnalyticsDesc}
                    </p>
                  </div>
                </div>
                <Link to={createPageUrl("RevenueAnalytics")}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {strings.viewAnalyticsButton}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 1. OPERATIONS CONSOLE - MOVED TO TOP */}
        <Card className="mb-6 border-none shadow-lg" style={{ 
          backgroundColor: colors.cardBg,
          borderLeft: '6px solid #3B82F6'
        }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#3B82F6',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Settings className="w-6 h-6 text-white" />
                </div>
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
                  <Scale className="w-4 h-4 mr-2" />
                  {strings.goToOps}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 2. MANAGE LETTER TEMPLATES */}
        {isSuperAdmin && (
          <Card className="mb-6 border-none shadow-lg" style={{ 
            backgroundColor: colors.cardBg,
            borderLeft: '6px solid #8B5CF6'
          }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#8B5CF6',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: colors.textPrimary }}>
                      {strings.manageTemplates}
                    </h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {strings.manageTemplatesDesc}
                    </p>
                  </div>
                </div>
                <Link to={createPageUrl("AdminTemplates")}>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <FileText className="w-4 h-4 mr-2" />
                    {strings.goToTemplates}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <AdminDashboardStats stats={adminStats} language={language} colors={colors} />

        {/* 3. USER MANAGEMENT */}
          <Card className="mb-6 border-none shadow-lg" style={{ 
            backgroundColor: colors.cardBg,
            borderLeft: '6px solid #EF4444'
          }}>
            <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
              <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <AlertCircle className="w-5 h-5 text-red-600" />
                User Debug & Recovery Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Use these tools to investigate and restore missing users.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleDebugUsers}
                    disabled={loadingDebug}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loadingDebug ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Debug User Database
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleRestoreUsers}
                    disabled={restoringUsers}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {restoringUsers ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Restore All Users
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleExportBackup}
                    variant="outline"
                    style={{ borderColor: colors.borderColor }}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Export Backup
                  </Button>
                </div>

                {debugData && (
                  <div className="mt-4 p-4 rounded-lg overflow-auto max-h-96" style={{
                    backgroundColor: isDarkMode ? '#1A1D1F' : '#F8FAFC',
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <pre className="text-xs" style={{ color: colors.textPrimary }}>
                      {JSON.stringify(debugData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}



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

        {isSuperAdmin && (
          <Card className="mb-6 border-none shadow-lg" style={{ 
            backgroundColor: colors.cardBg,
            borderLeft: '6px solid #8B5CF6'
          }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#8B5CF6',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: colors.textPrimary }}>
                      {strings.manageTemplates}
                    </h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {strings.manageTemplatesDesc}
                    </p>
                  </div>
                </div>
                <Link to={createPageUrl("AdminTemplates")}>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <FileText className="w-4 h-4 mr-2" />
                    {strings.goToTemplates}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3. USER MANAGEMENT */}
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
                    const isCurrentUserSuperAdmin = user?.access_level === 'super_admin';
                    const isTargetUserSuperAdmin = u.access_level === 'super_admin';
                    const canChangeRole = !(isTargetUserSuperAdmin && superAdminCount <= 1 && isCurrentUserSuperAdmin);
                    const isDisabled = u.is_active === false;
                    const isDeleted = !!u.deleted_at;
                    const isSelf = u.id === user.id;
                    
                    return (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: `1px solid ${colors.borderColor}`,
                          backgroundColor: idx % 2 === 0 ? colors.cardBg : (isDarkMode ? '#2A2D30' : '#F8FAFC'),
                          opacity: (isDisabled || isDeleted) ? 0.6 : 1
                        }}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>{u.full_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs" style={{ color: colors.textSecondary }}>{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            <Badge className={
                              u.access_level === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                              u.access_level === 'admin' ? 'bg-blue-100 text-blue-800' :
                              u.access_level === 'va' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-800'
                            }>
                              {u.access_level || 'user'}
                            </Badge>
                            {(isDisabled || isDeleted) && (
                              <Badge className="bg-red-100 text-red-800">
                                {isDeleted ? strings.deleted : strings.disabled}
                              </Badge>
                            )}
                          </div>
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
                              disabled={!canChangeRole}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="va">VA</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                {isSuperAdmin && (
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {!canChangeRole && (
                                <div className="flex items-center gap-1 text-red-500 text-xs">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{strings.superAdminWarning}</span>
                                </div>
                            )}
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
                            <div className="flex gap-1 mt-2">
                              {isDeleted ? (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                                  {strings.deleted}
                                </Badge>
                              ) : isDisabled ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEnableUser(u)}
                                  className="text-xs h-7 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                >
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  {strings.enableUser}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDisableUser(u)}
                                  disabled={!canChangeRole && isSelf}
                                  className="text-xs h-7 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                >
                                  <Ban className="w-3 h-3 mr-1" />
                                  {strings.disableUser}
                                </Button>
                              )}
                              {!isDeleted && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveUser(u)}
                                  disabled={(!canChangeRole && isSelf) || isSelf}
                                  className="text-xs h-7 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                >
                                  <UserX className="w-3 h-3 mr-1" />
                                  {strings.removeUser}
                                </Button>
                              )}
                            </div>
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

        {/* 4. RECENT LEASES */}
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


      </div>
    </div>
  );
}