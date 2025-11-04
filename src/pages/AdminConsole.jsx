
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle2, FileText, Database, Shield, Mail, Trash2, Crown, Bell, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils"; // Added createPageUrl import

export default function AdminConsole() {
  const [seeding, setSeeding] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // New state for LINE notification testing
  const [testingNotification, setTestingNotification] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.asServiceRole.entities.User.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.asServiceRole.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === 'admin',
  });

  const { data: allLeases = [] } = useQuery({
    queryKey: ['allLeases'],
    queryFn: () => base44.entities.Lease.list(),
    enabled: user?.role === 'admin',
  });

  const { data: allDocuments = [] } = useQuery({
    queryKey: ['allDocuments'],
    queryFn: () => base44.entities.Document.list(),
    enabled: user?.role === 'admin',
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    tableBg: '#2A2D30',
    tableRow: '#353A3D',
    leaseBg: '#353A3D'
  } : {
    bg: '#ECEFED',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    tableBg: '#FFFFFF',
    tableRow: '#F8FAFC',
    leaseBg: '#F8FAFC'
  };

  const t = {
    en: {
      title: "Admin Console",
      subtitle: "System management and demo data tools",
      totalUsers: "Total Users",
      activeSubscribers: "Active Subscribers",
      leaseScans: "Lease Scans",
      documents: "Documents",
      demoDataSeeder: "Demo Data Seeder",
      demoDataDesc: "Create demo leases, deposit trackers, and cases for testing.",
      seedDemoData: "Seed Demo Data",
      seeding: "Seeding...",
      userManagement: "User Management",
      user: "User",
      email: "Email",
      plan: "Plan",
      status: "Status",
      role: "Role",
      joined: "Joined",
      actions: "Actions",
      admin: "Admin",
      active: "Active",
      secure: "Secure",
      recentLeases: "Recent Leases",
      noLeases: "No leases yet",
      // New LINE Notification strings
      testLineNotifications: "Test LINE Notifications",
      firstAddWelcome: "First Add Welcome",
      whenUserAddsBot: "When user first adds bot",
      day30Reminder: "30-Day Reminder",
      depositDue30Days: "Deposit due in 30 days",
      day7Warning: "7-Day Warning",
      finalWarningDeadline: "Final warning before deadline",
      overdueAlert: "Overdue Alert",
      depositNotReturned: "Deposit not returned",
      rentReminder: "Rent Reminder",
      rentDue3Days: "Rent due in 3 days",
      welcomeMessage: "Welcome Message",
      welcomeAfterConnecting: "Welcome after connecting",
      leaseNotice30d: "Lease Notice 30d",
      days30ToNotifyLandlord: "30 days to notify landlord",
      leaseNotice7d: "Lease Notice 7d",
      days7LeftToNotify: "7 days left to notify",
      leaseNotice3d: "Lease Notice 3d",
      days3FinalWarning: "3 days! Final warning",
      todayNotifyNow: "TODAY! Notify Now",
      noticeDeadlineToday: "Notice deadline today",
    },
    th: {
      title: "คอนโซลแอดมิน",
      subtitle: "เครื่องมือจัดการระบบและข้อมูลทดสอบ",
      totalUsers: "ผู้ใช้ทั้งหมด",
      activeSubscribers: "สมาชิกที่ใช้งาน",
      leaseScans: "การสแกนสัญญาเช่า",
      documents: "เอกสาร",
      demoDataSeeder: "สร้างข้อมูลทดสอบ",
      demoDataDesc: "สร้างสัญญาเช่า ตัวติดตามเงินมัดจำ และคดีสำหรับทดสอบ",
      seedDemoData: "สร้างข้อมูลทดสอบ",
      seeding: "กำลังสร้าง...",
      userManagement: "จัดการผู้ใช้",
      user: "ผู้ใช้",
      email: "อีเมล",
      plan: "แผน",
      status: "สถานะ",
      role: "บทบาท",
      joined: "เข้าร่วม",
      actions: "การดำเนินการ",
      admin: "แอดมิน",
      active: "ใช้งาน",
      secure: "Secure",
      recentLeases: "สัญญาเช่าล่าสุด",
      noLeases: "ยังไม่มีสัญญาเช่า",
      // New LINE Notification strings
      testLineNotifications: "ทดสอบการแจ้งเตือน LINE",
      firstAddWelcome: "ข้อความต้อนรับแรก",
      whenUserAddsBot: "เมื่อผู้ใช้เพิ่มบอทครั้งแรก",
      day30Reminder: "เตือน 30 วัน",
      depositDue30Days: "เงินมัดจำครบกำหนดใน 30 วัน",
      day7Warning: "เตือน 7 วัน",
      finalWarningDeadline: "คำเตือนสุดท้ายก่อนครบกำหนด",
      overdueAlert: "แจ้งเตือนเกินกำหนด",
      depositNotReturned: "ยังไม่ได้รับเงินมัดจำคืน",
      rentReminder: "เตือนค่าเช่า",
      rentDue3Days: "ค่าเช่าครบกำหนดในอีก 3 วัน",
      welcomeMessage: "ข้อความต้อนรับ",
      welcomeAfterConnecting: "ข้อความต้อนรับหลังเชื่อมต่อ",
      leaseNotice30d: "เตือนสัญญา 30 วัน",
      days30ToNotifyLandlord: "อีก 30 วันถึงกำหนดแจ้งต่อ/ยกเลิก",
      leaseNotice7d: "เตือนสัญญา 7 วัน",
      days7LeftToNotify: "เหลือ 7 วันต้องแจ้ง",
      leaseNotice3d: "เตือนสัญญา 3 วัน",
      days3FinalWarning: "เหลือ 3 วัน! คำเตือนสุดท้าย",
      todayNotifyNow: "วันนี้! แจ้งด่วน",
      noticeDeadlineToday: "กำหนดแจ้งวันนี้",
    }
  };

  const strings = t[language];

  const handleSeedDemoData = async () => {
    setSeeding(true);
    try {
      await base44.functions.invoke('seedDemoData', {});
      queryClient.invalidateQueries();
      alert(language === 'th' ? 'สร้างข้อมูลทดสอบสำเร็จ!' : 'Demo data seeded successfully!');
    } catch (error) {
      console.error('Seeding failed:', error);
      alert(language === 'th' ? 'การสร้างข้อมูลล้มเหลว' : 'Seeding failed');
    } finally {
      setSeeding(false);
    }
  };

  // New function to test LINE notifications
  const handleTestNotification = async (type) => {
    setTestingNotification(true);
    setTestResult(null);

    try {
      await base44.functions.invoke('testLineNotifications', {
        notificationType: type
      });
      setTestResult({ type: 'success', message: `${type} notification sent! Check your LINE` });
      setTimeout(() => setTestResult(null), 5000);
    } catch (error) {
      console.error('Test notification failed:', error);
      setTestResult({ type: 'error', message: 'Failed to send notification' });
      setTimeout(() => setTestResult(null), 5000);
    } finally {
      setTestingNotification(false);
    }
  };

  const handleUserAction = (userId, action, currentData) => {
    const confirmMessage = language === 'th'
      ? `คุณแน่ใจหรือไม่ว่าต้องการ${action === 'delete' ? 'ลบ' : 'เปลี่ยนแปลง'}ผู้ใช้นี้?`
      : `Are you sure you want to ${action} this user?`;
    
    if (!confirm(confirmMessage)) return;

    switch (action) {
      case 'delete':
        deleteUserMutation.mutate(userId);
        break;
      case 'make_admin':
        updateUserMutation.mutate({ userId, data: { role: 'admin' } });
        break;
      case 'remove_admin':
        updateUserMutation.mutate({ userId, data: { role: 'user' } });
        break;
      case 'upgrade_tier':
        const tierLevels = ['free', 'lite', 'protect', 'secure'];
        const currentIndex = tierLevels.indexOf(currentData.plan_tier);
        if (currentIndex < tierLevels.length - 1) {
          updateUserMutation.mutate({ userId, data: { plan_tier: tierLevels[currentIndex + 1] } });
        }
        break;
      case 'downgrade_tier':
        const levels = ['free', 'lite', 'protect', 'secure'];
        const idx = levels.indexOf(currentData.plan_tier);
        if (idx > 0) {
          updateUserMutation.mutate({ userId, data: { plan_tier: levels[idx - 1] } });
        }
        break;
      default:
        console.warn('Unknown user action:', action);
    }
  };

  const activeSubscribers = allUsers.filter(u => u.subscription_status === 'active').length;

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-ls-forest" />
            <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
          </div>
          <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
        </div>

        {/* Ops Console Quick Access Card */}
        <Card className="mb-6 border-none shadow-xl" style={{
          backgroundColor: colors.cardBg,
          background: isDarkMode
            ? 'linear-gradient(135deg, #1e3a5f 0%, #2a4a6f 100%)'
            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
        }}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Scale className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {language === 'th' ? 'คอนโซลปฏิบัติการ' : 'Operations Console'}
                  </h3>
                  <p className="text-white/80 text-sm mb-4">
                    {language === 'th'
                      ? 'จัดการคดีพิพาท มอบหมายงาน และติดตามความคืบหน้า'
                      : 'Manage dispute cases, assign work, and track resolution progress'}
                  </p>
                  <Button
                    onClick={() => navigate(createPageUrl("OpsConsole"))}
                    className="bg-white text-blue-600 hover:bg-blue-50"
                  >
                    <Scale className="w-4 h-4 mr-2" />
                    {language === 'th' ? 'เปิดคอนโซล Ops' : 'Open Ops Console'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add new LINE Testing section before existing cards */}
        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Bell className="w-5 h-5 text-emerald-600" />
              {strings.testLineNotifications}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {testResult && (
              <div className={`p-4 rounded-lg mb-4 ${
                testResult.type === 'success'
                  ? 'bg-emerald-100 border border-emerald-200 text-emerald-800'
                  : 'bg-red-100 border border-red-200 text-red-800'
              }`}>
                {testResult.type === 'success' ? '✅' : '❌'} {testResult.message}
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              <button
                onClick={() => handleTestNotification('first_add')}
                disabled={testingNotification}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: testingNotification ? 'not-allowed' : 'pointer',
                  opacity: testingNotification ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = '#8B5CF6';
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#2D1B4E' : '#F5F3FF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: '24px' }}>🆕</span>
                  <span style={{ fontWeight: 'bold', color: colors.textPrimary }}>
                    {strings.firstAddWelcome}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {strings.whenUserAddsBot}
                </p>
              </button>

              <button
                onClick={() => handleTestNotification('30day')}
                disabled={testingNotification}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: testingNotification ? 'not-allowed' : 'pointer',
                  opacity: testingNotification ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = '#10B981';
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#1E4435' : '#ECFDF5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: '24px' }}>🔔</span>
                  <span style={{ fontWeight: 'bold', color: colors.textPrimary }}>
                    {strings.day30Reminder}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {strings.depositDue30Days}
                </p>
              </button>

              <button
                onClick={() => handleTestNotification('7day')}
                disabled={testingNotification}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: testingNotification ? 'not-allowed' : 'pointer',
                  opacity: testingNotification ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = '#F59E0B';
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#3A2D1C' : '#FFF7ED';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: '24px' }}>⚠️</span>
                  <span style={{ fontWeight: 'bold', color: colors.textPrimary }}>
                    {strings.day7Warning}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {strings.finalWarningDeadline}
                </p>
              </button>

              <button
                onClick={() => handleTestNotification('overdue')}
                disabled={testingNotification}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: testingNotification ? 'not-allowed' : 'pointer',
                  opacity: testingNotification ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = '#EF4444';
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#3A2626' : '#FEE2E2';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: '24px' }}>🚨</span>
                  <span style={{ fontWeight: 'bold', color: colors.textPrimary }}>
                    {strings.overdueAlert}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {strings.depositNotReturned}
                </p>
              </button>

              <button
                onClick={() => handleTestNotification('rent')}
                disabled={testingNotification}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: testingNotification ? 'not-allowed' : 'pointer',
                  opacity: testingNotification ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = '#3B82F6';
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#1E3A5F' : '#EFF6FF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: '24px' }}>💰</span>
                  <span style={{ fontWeight: 'bold', color: colors.textPrimary }}>
                    {strings.rentReminder}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {strings.rentDue3Days}
                </p>
              </button>

              <button
                onClick={() => handleTestNotification('welcome')}
                disabled={testingNotification}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: testingNotification ? 'not-allowed' : 'pointer',
                  opacity: testingNotification ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = '#8B5CF6';
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#2D1B4E' : '#F5F3FF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: '24px' }}>🎉</span>
                  <span style={{ fontWeight: 'bold', color: colors.textPrimary }}>
                    {strings.welcomeMessage}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {strings.welcomeAfterConnecting}
                </p>
              </button>

              <button
                onClick={() => handleTestNotification('notice_30d')}
                disabled={testingNotification}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: testingNotification ? 'not-allowed' : 'pointer',
                  opacity: testingNotification ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = '#06B6D4';
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#164E63' : '#ECFEFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: '24px' }}>📅</span>
                  <span style={{ fontWeight: 'bold', color: colors.textPrimary }}>
                    {strings.leaseNotice30d}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {strings.days30ToNotifyLandlord}
                </p>
              </button>

              <button
                onClick={() => handleTestNotification('notice_7d')}
                disabled={testingNotification}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: testingNotification ? 'not-allowed' : 'pointer',
                  opacity: testingNotification ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = '#F59E0B';
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#3A2D1C' : '#FFF7ED';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: '24px' }}>⚠️</span>
                  <span style={{ fontWeight: 'bold', color: colors.textPrimary }}>
                    {strings.leaseNotice7d}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {strings.days7LeftToNotify}
                </p>
              </button>

              <button
                onClick={() => handleTestNotification('notice_3d')}
                disabled={testingNotification}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: testingNotification ? 'not-allowed' : 'pointer',
                  opacity: testingNotification ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = '#EF4444';
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#3A2626' : '#FEE2E2';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: '24px' }}>🚨</span>
                  <span style={{ fontWeight: 'bold', color: colors.textPrimary }}>
                    {strings.leaseNotice3d}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {strings.days3FinalWarning}
                </p>
              </button>

              <button
                onClick={() => handleTestNotification('notice_today')}
                disabled={testingNotification}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: testingNotification ? 'not-allowed' : 'pointer',
                  opacity: testingNotification ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = '#DC2626';
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#3A1A1A' : '#FEE2E2';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!testingNotification) {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: '24px' }}>🔴</span>
                  <span style={{ fontWeight: 'bold', color: colors.textPrimary }}>
                    {strings.todayNotifyNow}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {strings.noticeDeadlineToday}
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.totalUsers}</p>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{allUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.activeSubscribers}</p>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{activeSubscribers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.leaseScans}</p>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{allLeases.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.documents}</p>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{allDocuments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Data Seeder */}
        <Card className="border-none shadow-lg mb-8" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Database className="w-5 h-5 text-ls-forest" />
              {strings.demoDataSeeder}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="mb-4" style={{ color: colors.textSecondary }}>{strings.demoDataDesc}</p>
            <Button
              onClick={handleSeedDemoData}
              disabled={seeding}
              style={{
                backgroundColor: seeding ? '#9CA3AF' : '#0C3B2E',
                color: '#FFFFFF'
              }}
            >
              <Database className="w-4 h-4 mr-2" />
              {seeding ? strings.seeding : strings.seedDemoData}
            </Button>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="border-none shadow-lg mb-8" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Users className="w-5 h-5 text-ls-forest" />
              {strings.userManagement}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto" style={{ backgroundColor: colors.tableBg }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.borderColor}` }}>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.user}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.email}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.plan}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.status}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.role}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.joined}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u, index) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: `1px solid ${colors.borderColor}`,
                        backgroundColor: index % 2 === 0 ? colors.tableBg : colors.tableRow
                      }}
                    >
                      <td className="py-3 px-4 text-sm font-medium" style={{ color: colors.textPrimary }}>{u.full_name}</td>
                      <td className="py-3 px-4 text-sm" style={{ color: colors.textSecondary }}>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {u.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={
                          u.plan_tier === 'secure' ? 'bg-purple-100 text-purple-700' :
                          u.plan_tier === 'protect' ? 'bg-blue-100 text-blue-700' :
                          u.plan_tier === 'lite' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-700'
                        }>
                          {u.plan_tier === 'secure' ? strings.secure :
                           u.plan_tier === 'protect' ? 'Protect' :
                           u.plan_tier === 'lite' ? 'Lite' :
                           'Free'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {u.subscription_status === 'active' && (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            {strings.active}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {u.role === 'admin' && (
                          <Badge className="bg-ls-gold text-ls-charcoal">
                            <Crown className="w-3 h-3 mr-1" />
                            {strings.admin}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: colors.textSecondary }}>
                        {format(new Date(u.created_date), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleUserAction(u.id, 'make_admin', u)}
                              className="text-xs px-2 py-1 rounded hover:bg-emerald-100"
                              style={{
                                backgroundColor: isDarkMode ? '#353A3D' : '#F0FDF4',
                                color: '#059669',
                                border: `1px solid ${isDarkMode ? '#059669' : '#BBF7D0'}`
                              }}
                              title={language === 'th' ? 'ตั้งเป็นแอดมิน' : 'Make Admin'}
                            >
                              <Crown className="w-3 h-3" />
                            </button>
                          )}
                          {u.role === 'admin' && u.id !== user?.id && (
                            <button
                              onClick={() => handleUserAction(u.id, 'remove_admin', u)}
                              className="text-xs px-2 py-1 rounded hover:bg-slate-100"
                              style={{
                                backgroundColor: isDarkMode ? '#353A3D' : '#F1F5F9',
                                color: colors.textSecondary,
                                border: `1px solid ${colors.borderColor}`
                              }}
                              title={language === 'th' ? 'ลบสิทธิ์แอดมิน' : 'Remove Admin'}
                            >
                              <Crown className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleUserAction(u.id, 'delete', u)}
                            className="text-xs px-2 py-1 rounded hover:bg-red-100"
                            style={{
                              backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2',
                              color: '#DC2626',
                              border: `1px solid ${isDarkMode ? '#DC2626' : '#FECACA'}`
                            }}
                            title={language === 'th' ? 'ลบผู้ใช้' : 'Delete User'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Leases */}
        <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <FileText className="w-5 h-5 text-ls-forest" />
              {strings.recentLeases} ({allLeases.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {allLeases.length === 0 ? (
              <p className="text-center py-8" style={{ color: colors.textSecondary }}>{strings.noLeases}</p>
            ) : (
              <div className="space-y-3">
                {allLeases.slice(0, 10).map((lease) => (
                  <button
                    key={lease.id}
                    onClick={() => navigate(createPageUrl("LeaseDetails") + `?id=${lease.id}`)}
                    className="w-full p-4 rounded-lg border transition-all duration-200"
                    style={{
                      backgroundColor: colors.leaseBg,
                      borderColor: colors.borderColor,
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0C3B2E';
                      e.currentTarget.style.backgroundColor = isDarkMode ? '#3A3D40' : '#F0FDF4';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.borderColor;
                      e.currentTarget.style.backgroundColor = colors.leaseBg;
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: colors.textPrimary }}>
                          {lease.property_address || (language === 'th' ? 'สัญญาเช่า' : 'Lease Agreement')}
                        </p>
                        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                          {language === 'th' ? 'โดย' : 'by'} {lease.created_by}
                        </p>
                        <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                          {format(new Date(lease.created_date), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          lease.status === 'scanned' ? 'bg-blue-100 text-blue-800' :
                          lease.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-amber-100 text-amber-800'
                        }>
                          {lease.status}
                        </Badge>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: colors.textSecondary }}>
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
