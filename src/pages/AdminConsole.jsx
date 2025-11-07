
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle2, FileText, Database, Shield, Mail, Trash2, Crown, Bell, Scale, MoreVertical, ChevronDown, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export default function AdminConsole() {
  const [seeding, setSeeding] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // New state for LINE notification testing
  const [testingNotification, setTestingNotification] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  // New state for sending LINE messages to users
  const [sendingLineMessage, setSendingLineMessage] = useState(false);
  const [lineMessageResult, setLineMessageResult] = useState(null);

  // New state for sending test notifications to users
  const [selectedUserForTest, setSelectedUserForTest] = useState('');
  const [sendingTestToUser, setSendingTestToUser] = useState(false);
  const [testToUserResult, setTestToUserResult] = useState(null);

  // New state for user action feedback
  const [userActionResult, setUserActionResult] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    // Only fetch if current user is an admin or super_admin
    enabled: user?.access_level === 'admin' || user?.access_level === 'super_admin' || user?.role === 'admin',
  });

  const { data: allLeases = [] } = useQuery({
    queryKey: ['allLeases'],
    queryFn: () => base44.entities.Lease.list(),
    // Only fetch if current user is an admin or super_admin
    enabled: user?.access_level === 'admin' || user?.access_level === 'super_admin' || user?.role === 'admin',
  });

  const { data: allDocuments = [] } = useQuery({
    queryKey: ['allDocuments'],
    queryFn: () => base44.entities.Document.list(),
    // Only fetch if current user is an admin or super_admin
    enabled: user?.access_level === 'admin' || user?.access_level === 'super_admin' || user?.role === 'admin',
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const accessLevel = user?.access_level || 'user';
  const isSuperAdmin = accessLevel === 'super_admin';
  const isAdmin = ['admin', 'super_admin'].includes(accessLevel) || user?.role === 'admin';

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

  // Restrict access to admin and super_admin only
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: colors.bg }}>
        <Card className="max-w-md border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {language === 'th' ? 'ไม่ได้รับอนุญาต' : 'Unauthorized'}
            </h2>
            <p style={{ color: colors.textSecondary }}>
              {language === 'th' ? 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้' : 'You do not have permission to access this page.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      accessLevel: "Access Level",
      joined: "Joined",
      actions: "Actions",
      admin: "Admin",
      active: "Active",
      secure: "Secure",
      recentLeases: "Recent Leases",
      noLeases: "No leases yet",
      superAdminOnly: "Super Admin Only",
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
      accessLevel: "ระดับการเข้าถึง",
      joined: "เข้าร่วม",
      actions: "การดำเนินการ",
      admin: "แอดมิน",
      active: "ใช้งาน",
      secure: "Secure",
      recentLeases: "สัญญาเช่าล่าสุด",
      noLeases: "ยังไม่มีสัญญาเช่า",
      superAdminOnly: "สำหรับ Super Admin เท่านั้น",
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

  // New function to send LINE message to a specific user
  const handleSendLineToUser = async (targetUser) => {
    const message = prompt(
      language === 'th' 
        ? `ส่งข้อความไปยัง ${targetUser.full_name} (${targetUser.email}):\n\nพิมพ์ข้อความของคุณ:` 
        : `Send message to ${targetUser.full_name} (${targetUser.email}):\n\nType your message:`,
      language === 'th'
        ? '🔔 ข้อความทดสอบจากแอดมิน Lease Shield\n\nนี่คือข้อความทดสอบเพื่อยืนยันว่าระบบการแจ้งเตือน LINE ทำงานได้ดี'
        : '🔔 Test message from Lease Shield Admin\n\nThis is a test message to confirm your LINE notifications are working properly'
    );

    if (!message || message.trim() === '') {
      return;
    }

    if (!targetUser.line_messaging_token) {
      alert(
        language === 'th'
          ? 'ผู้ใช้นี้ยังไม่ได้เชื่อมต่อ LINE'
          : 'This user has not connected LINE yet'
      );
      return;
    }

    setSendingLineMessage(true);
    setLineMessageResult(null);

    try {
      await base44.functions.invoke('sendLineMessage', {
        userId: targetUser.line_messaging_token,
        message: message.trim()
      });

      setLineMessageResult({ 
        type: 'success', 
        message: language === 'th' 
          ? `✅ ส่งข้อความถึง ${targetUser.full_name} สำเร็จ!` 
          : `✅ Message sent to ${targetUser.full_name} successfully!`
      });
      setTimeout(() => setLineMessageResult(null), 5000);
    } catch (error) {
      console.error('Failed to send LINE message:', error);
      setLineMessageResult({ 
        type: 'error', 
        message: language === 'th' 
          ? `❌ ส่งข้อความล้มเหลว: ${error.message}` 
          : `❌ Failed to send: ${error.message}`
      });
      setTimeout(() => setLineMessageResult(null), 5000);
    } finally {
      setSendingLineMessage(false);
    }
  };

  // New function to send test notification to selected user
  const handleSendTestToUser = async (notificationType) => {
    if (!selectedUserForTest) {
      alert(language === 'th' ? 'กรุณาเลือกผู้ใช้' : 'Please select a user');
      return;
    }

    setSendingTestToUser(true);
    setTestToUserResult(null);

    try {
      await base44.functions.invoke('testLineNotifications', {
        notificationType: notificationType,
        targetUserEmail: selectedUserForTest
      });

      const targetUser = allUsers.find(u => u.email === selectedUserForTest);
      setTestToUserResult({
        type: 'success',
        message: language === 'th'
          ? `✅ ส่งข้อความ "${notificationType}" ถึง ${targetUser?.full_name} สำเร็จ!`
          : `✅ Sent "${notificationType}" to ${targetUser?.full_name} successfully!`
      });
      setTimeout(() => setTestToUserResult(null), 5000);
    } catch (error) {
      console.error('Test to user failed:', error);
      setTestToUserResult({
        type: 'error',
        message: language === 'th'
          ? `❌ ส่งไม่สำเร็จ: ${error.message}`
          : `❌ Failed: ${error.message}`
      });
      setTimeout(() => setTestToUserResult(null), 5000);
    } finally {
      setSendingTestToUser(false);
    }
  };

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.asServiceRole.entities.User.update(userId, data),
    onSuccess: (updatedUser, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      
      const actionType = variables.data.access_level ? 'access level' : 
                        variables.data.plan_tier ? 'plan tier' : 'user data';
      
      setUserActionResult({
        type: 'success',
        message: language === 'th' 
          ? `✅ อัปเดต ${actionType} สำเร็จ` 
          : `✅ Successfully updated ${actionType}`
      });
      
      setTimeout(() => setUserActionResult(null), 5000);
    },
    onError: (error) => {
      console.error('User update error:', error);
      setUserActionResult({
        type: 'error',
        message: language === 'th'
          ? `❌ อัปเดตล้มเหลว: ${error.message}`
          : `❌ Update failed: ${error.message}`
      });
      setTimeout(() => setUserActionResult(null), 5000);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.asServiceRole.entities.User.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setUserActionResult({
        type: 'success',
        message: language === 'th' ? '✅ ลบผู้ใช้สำเร็จ' : '✅ User deleted successfully'
      });
      setTimeout(() => setUserActionResult(null), 5000);
    },
    onError: (error) => {
      console.error('User delete error:', error);
      setUserActionResult({
        type: 'error',
        message: language === 'th'
          ? `❌ ลบล้มเหลว: ${error.message}`
          : `❌ Delete failed: ${error.message}`
      });
      setTimeout(() => setUserActionResult(null), 5000);
    },
  });

  const handleUserAction = async (action, targetUser) => {
    console.log('🔧 User action:', action, 'for user:', targetUser.email);
    
    const confirmMessage = language === 'th'
      ? `คุณแน่ใจหรือไม่ว่าต้องการ${action === 'delete' ? 'ลบ' : 'เปลี่ยนแปลง'}ผู้ใช้นี้?`
      : `Are you sure you want to ${action === 'delete' ? 'delete' : 'update'} this user?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    if (action === 'delete') {
      // Only super admin can delete users
      if (!isSuperAdmin) {
        alert(language === 'th' ? 'เฉพาะ Super Admin เท่านั้นที่สามารถลบผู้ใช้ได้' : 'Only Super Admin can delete users');
        return;
      }
      deleteUserMutation.mutate(targetUser.id);
      return;
    }

    if (action.startsWith('access_')) {
      const level = action.replace('access_', '');
      console.log('🔐 Updating access level to:', level);
      
      // Only super admin can grant super_admin access
      if (level === 'super_admin' && !isSuperAdmin) {
        alert(language === 'th' ? 'เฉพาะ Super Admin เท่านั้นที่สามารถให้สิทธิ์ Super Admin ได้' : 'Only Super Admin can grant Super Admin access');
        return;
      }
      
      updateUserMutation.mutate({ 
        userId: targetUser.id, 
        data: { access_level: level } 
      });
    } else if (action.startsWith('tier_')) {
      const tier = action.replace('tier_', '');
      console.log('💳 Updating plan tier to:', tier);
      
      updateUserMutation.mutate({ 
        userId: targetUser.id, 
        data: { plan_tier: tier } 
      });
    }
  };

  const handleViewLease = (lease) => {
    // Navigate to lease details page
    navigate(createPageUrl("LeaseDetails") + `?leaseId=${lease.id}`);
  };

  const activeSubscribers = allUsers.filter(u => u.subscription_status === 'active').length;

  // Get users with LINE connected for the dropdown
  const usersWithLine = allUsers.filter(u => u.line_messaging_token);

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-ls-forest" />
            <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
            {isSuperAdmin && (
              <Badge className="bg-purple-600 text-white">SUPER ADMIN</Badge>
            )}
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

        {/* LINE Message Result Alert */}
        {lineMessageResult && (
          <div className={`mb-6 p-4 rounded-lg ${
            lineMessageResult.type === 'success'
              ? 'bg-emerald-100 border border-emerald-200 text-emerald-800'
              : 'bg-red-100 border border-red-200 text-red-800'
          }`}>
            {lineMessageResult.message}
          </div>
        )}

        {/* Test to User Result Alert */}
        {testToUserResult && (
          <div className={`mb-6 p-4 rounded-lg ${
            testToUserResult.type === 'success'
              ? 'bg-emerald-100 border border-emerald-200 text-emerald-800'
              : 'bg-red-100 border border-red-200 text-red-800'
          }`}>
            {testToUserResult.message}
          </div>
        )}

        {/* User Action Result Alert - NEW */}
        {userActionResult && (
          <div className={`mb-6 p-4 rounded-lg ${
            userActionResult.type === 'success'
              ? 'bg-emerald-100 border border-emerald-200 text-emerald-800'
              : 'bg-red-100 border border-red-200 text-red-800'
          }`}>
            {userActionResult.message}
          </div>
        )}

        {/* Send Test Notifications to Users */}
        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Users className="w-5 h-5 text-blue-600" />
              {language === 'th' ? 'ส่งการแจ้งเตือนทดสอบไปยังผู้ใช้' : 'Send Test Notifications to Users'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'เลือกผู้ใช้:' : 'Select User:'}
              </label>
              <select
                value={selectedUserForTest}
                onChange={(e) => setSelectedUserForTest(e.target.value)}
                className="w-full p-3 rounded-lg border"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.borderColor,
                  color: colors.textPrimary
                }}
                disabled={sendingTestToUser}
              >
                <option value="">
                  {language === 'th' ? '-- เลือกผู้ใช้ --' : '-- Select User --'}
                </option>
                {/* Add "Send to Myself" option at the top */}
                {user?.line_messaging_token && (
                  <option value={user.email}>
                    {language === 'th' ? '🔹 ตัวฉันเอง' : '🔹 Myself'} ({user.full_name})
                  </option>
                )}
                {usersWithLine
                  .filter(u => u.email !== user?.email) // Don't show current user twice
                  .map(u => (
                    <option key={u.email} value={u.email}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
              </select>
              {usersWithLine.length === 0 && !user?.line_messaging_token && (
                <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                  {language === 'th' 
                    ? 'ไม่มีผู้ใช้ที่เชื่อมต่อ LINE' 
                    : 'No users with LINE connected'}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              <button
                onClick={() => handleSendTestToUser('first_add')}
                disabled={!selectedUserForTest || sendingTestToUser}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: (!selectedUserForTest || sendingTestToUser) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedUserForTest || sendingTestToUser) ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = '#8B5CF6';
                    e.target.style.backgroundColor = isDarkMode ? '#2D1B4E' : '#F5F3FF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = colors.borderColor;
                    e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
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
                onClick={() => handleSendTestToUser('30day')}
                disabled={!selectedUserForTest || sendingTestToUser}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: (!selectedUserForTest || sendingTestToUser) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedUserForTest || sendingTestToUser) ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = '#10B981';
                    e.target.style.backgroundColor = isDarkMode ? '#1E4435' : '#ECFDF5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = colors.borderColor;
                    e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
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
                onClick={() => handleSendTestToUser('7day')}
                disabled={!selectedUserForTest || sendingTestToUser}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: (!selectedUserForTest || sendingTestToUser) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedUserForTest || sendingTestToUser) ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = '#F59E0B';
                    e.target.style.backgroundColor = isDarkMode ? '#3A2D1C' : '#FFF7ED';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = colors.borderColor;
                    e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
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
                onClick={() => handleSendTestToUser('overdue')}
                disabled={!selectedUserForTest || sendingTestToUser}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: (!selectedUserForTest || sendingTestToUser) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedUserForTest || sendingTestToUser) ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = '#EF4444';
                    e.target.style.backgroundColor = isDarkMode ? '#3A2626' : '#FEE2E2';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = colors.borderColor;
                    e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
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
                onClick={() => handleSendTestToUser('rent')}
                disabled={!selectedUserForTest || sendingTestToUser}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: (!selectedUserForTest || sendingTestToUser) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedUserForTest || sendingTestToUser) ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.backgroundColor = isDarkMode ? '#1E3A5F' : '#EFF6FF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = colors.borderColor;
                    e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
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
                onClick={() => handleSendTestToUser('welcome')}
                disabled={!selectedUserForTest || sendingTestToUser}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: (!selectedUserForTest || sendingTestToUser) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedUserForTest || sendingTestToUser) ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = '#8B5CF6';
                    e.target.style.backgroundColor = isDarkMode ? '#2D1B4E' : '#F5F3FF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = colors.borderColor;
                    e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
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
                onClick={() => handleSendTestToUser('notice_30d')}
                disabled={!selectedUserForTest || sendingTestToUser}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: (!selectedUserForTest || sendingTestToUser) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedUserForTest || sendingTestToUser) ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = '#06B6D4';
                    e.target.style.backgroundColor = isDarkMode ? '#164E63' : '#ECFEFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = colors.borderColor;
                    e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
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
                onClick={() => handleSendTestToUser('notice_7d')}
                disabled={!selectedUserForTest || sendingTestToUser}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: (!selectedUserForTest || sendingTestToUser) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedUserForTest || sendingTestToUser) ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = '#F59E0B';
                    e.target.style.backgroundColor = isDarkMode ? '#3A2D1C' : '#FFF7ED';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = colors.borderColor;
                    e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
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
                onClick={() => handleSendTestToUser('notice_3d')}
                disabled={!selectedUserForTest || sendingTestToUser}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: (!selectedUserForTest || sendingTestToUser) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedUserForTest || sendingTestToUser) ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = '#EF4444';
                    e.target.style.backgroundColor = isDarkMode ? '#3A2626' : '#FEE2E2';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = colors.borderColor;
                    e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
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
                onClick={() => handleSendTestToUser('notice_today')}
                disabled={!selectedUserForTest || sendingTestToUser}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `2px solid ${colors.borderColor}`,
                  cursor: (!selectedUserForTest || sendingTestToUser) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedUserForTest || sendingTestToUser) ? 0.6 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = '#DC2626';
                    e.target.style.backgroundColor = isDarkMode ? '#3A1A1A' : '#FEE2E2';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedUserForTest && !sendingTestToUser) {
                    e.target.style.borderColor = colors.borderColor;
                    e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F8FAFC';
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
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.accessLevel}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.plan}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.status}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>LINE</th>
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
                          u.access_level === 'super_admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          u.access_level === 'admin' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          u.access_level === 'va' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }>
                          {u.access_level === 'super_admin' ? 'Super Admin' :
                           u.access_level === 'admin' ? 'Admin' :
                           u.access_level === 'va' ? 'VA' :
                           'User'}
                        </Badge>
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
                        {u.line_messaging_token ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <span className="text-emerald-600">●</span> Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500">
                            Not Connected
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: colors.textSecondary }}>
                        {format(new Date(u.created_date), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              disabled={updateUserMutation.isPending || deleteUserMutation.isPending}
                              style={{
                                backgroundColor: isDarkMode ? colors.tableRow : '#FFFFFF',
                                color: colors.textPrimary,
                                borderColor: colors.borderColor
                              }}
                            >
                              {(updateUserMutation.isPending || deleteUserMutation.isPending) ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                <MoreVertical className="w-4 h-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
                            <DropdownMenuLabel style={{ color: colors.textPrimary }}>User Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator style={{ backgroundColor: colors.borderColor }} />

                            {/* NEW: Send LINE Message option */}
                            <DropdownMenuItem
                              onClick={() => handleSendLineToUser(u)}
                              disabled={!u.line_messaging_token || sendingLineMessage}
                              style={{ color: colors.textPrimary }}
                            >
                              <Bell className="w-4 h-4 mr-2 text-emerald-600" />
                              {language === 'th' ? 'ส่งข้อความ LINE' : 'Send LINE Message'}
                              {!u.line_messaging_token && ' 🔒'}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator style={{ backgroundColor: colors.borderColor }} />

                            <DropdownMenuLabel style={{ color: colors.textSecondary, fontSize: '11px' }}>Access Level</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleUserAction('access_user', u)}
                              disabled={u.access_level === 'user' || updateUserMutation.isPending}
                              style={{ color: colors.textPrimary }}
                            >
                              {u.access_level === 'user' && '✓ '}User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUserAction('access_va', u)}
                              disabled={u.access_level === 'va' || updateUserMutation.isPending}
                              style={{ color: colors.textPrimary }}
                            >
                              {u.access_level === 'va' && '✓ '}VA (Operations)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUserAction('access_admin', u)}
                              disabled={u.access_level === 'admin' || updateUserMutation.isPending}
                              style={{ color: colors.textPrimary }}
                            >
                              {u.access_level === 'admin' && '✓ '}Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUserAction('access_super_admin', u)}
                              disabled={u.access_level === 'super_admin' || !isSuperAdmin || updateUserMutation.isPending}
                              style={{ color: colors.textPrimary }}
                            >
                              <Crown className="w-4 h-4 mr-2" />
                              {u.access_level === 'super_admin' && '✓ '}Super Admin {!isSuperAdmin && '🔒'}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator style={{ backgroundColor: colors.borderColor }} />
                            <DropdownMenuLabel style={{ color: colors.textSecondary, fontSize: '11px' }}>Plan Tier</DropdownMenuLabel>

                            <DropdownMenuItem
                              onClick={() => handleUserAction('tier_free', u)}
                              disabled={u.plan_tier === 'free' || updateUserMutation.isPending}
                              style={{ color: colors.textPrimary }}
                            >
                              {u.plan_tier === 'free' && '✓ '}Free
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUserAction('tier_lite', u)}
                              disabled={u.plan_tier === 'lite' || updateUserMutation.isPending}
                              style={{ color: colors.textPrimary }}
                            >
                              {u.plan_tier === 'lite' && '✓ '}Lite
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUserAction('tier_protect', u)}
                              disabled={u.plan_tier === 'protect' || updateUserMutation.isPending}
                              style={{ color: colors.textPrimary }}
                            >
                              {u.plan_tier === 'protect' && '✓ '}Protect
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUserAction('tier_secure', u)}
                              disabled={u.plan_tier === 'secure' || updateUserMutation.isPending}
                              style={{ color: colors.textPrimary }}
                            >
                              {u.plan_tier === 'secure' && '✓ '}Secure
                            </DropdownMenuItem>

                            <DropdownMenuSeparator style={{ backgroundColor: colors.borderColor }} />

                            <DropdownMenuItem
                              onClick={() => handleUserAction('delete', u)}
                              className="text-red-600"
                              disabled={u.id === user?.id || !isSuperAdmin || deleteUserMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User {!isSuperAdmin && '🔒'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                  <div
                    key={lease.id}
                    className="p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200"
                    style={{
                      backgroundColor: colors.leaseBg,
                      borderColor: colors.borderColor
                    }}
                    onClick={() => handleViewLease(lease)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0C3B2E';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.borderColor;
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="w-4 h-4 text-ls-forest" />
                          <p className="font-semibold" style={{ color: colors.textPrimary }}>
                            {lease.property_address || (language === 'th' ? 'สัญญาเช่า' : 'Lease Agreement')}
                          </p>
                        </div>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {language === 'th' ? 'โดย' : 'by'} {lease.created_by}
                        </p>
                        <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                          {format(new Date(lease.created_date), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                      <Badge className={
                        lease.status === 'scanned' ? 'bg-blue-100 text-blue-800' :
                        lease.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-amber-100 text-amber-800'
                      }>
                        {lease.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
