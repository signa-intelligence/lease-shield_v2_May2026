
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Shield, Database, TestTube, Send, Loader2, Settings, Trash2, Ban, CheckCircle, Crown, Coins } from "lucide-react";
import { format } from "date-fns";
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

export default function AdminConsole() {
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [selectedUserForTest, setSelectedUserForTest] = useState(null);
  const [testNotificationType, setTestNotificationType] = useState('deposit_30day');
  const [sortField, setSortField] = useState('created_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editCreditsDialog, setEditCreditsDialog] = useState(false);
  const [selectedUserForCredits, setSelectedUserForCredits] = useState(null);
  const [newCreditAmount, setNewCreditAmount] = useState('');

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
    queryFn: () => base44.entities.Lease.list('-created_date', 10),
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
      
      // Send LINE notification if user has LINE connected
      const targetUser = users.find(u => u.id === variables.userId);
      if (targetUser?.line_messaging_token) {
        try {
          let message = '';
          const lang = targetUser.language || 'en';
          
          // Determine what changed and create appropriate message
          if (variables.data.letter_credits !== undefined) {
            const oldCredits = targetUser.letter_credits || 0;
            const newCredits = variables.data.letter_credits;
            const diff = newCredits - oldCredits;
            
            message = lang === 'th'
              ? `🔔 อัปเดตบัญชี Lease Shield\n\nเครดิตจดหมายของคุณถูกอัปเดตโดยแอดมิน\n\n• ยอดเดิม: ${oldCredits}\n• ยอดใหม่: ${newCredits}\n• เปลี่ยนแปลง: ${diff > 0 ? '+' : ''}${diff}\n\nตรวจสอบบัญชีของคุณ: leaseshield.asia/account`
              : `🔔 Lease Shield Account Update\n\nYour letter credits were updated by admin\n\n• Previous: ${oldCredits}\n• New Balance: ${newCredits}\n• Change: ${diff > 0 ? '+' : ''}${diff}\n\nCheck your account: leaseshield.asia/account`;
          } else if (variables.data.plan_tier) {
            const oldTier = targetUser.plan_tier || 'free';
            const newTier = variables.data.plan_tier;
            
            message = lang === 'th'
              ? `🔔 อัปเดตบัญชี Lease Shield\n\nแผนของคุณถูกเปลี่ยนโดยแอดมิน\n\n• จาก: ${oldTier.toUpperCase()}\n• เป็น: ${newTier.toUpperCase()}\n\nตรวจสอบบัญชีของคุณ: leaseshield.asia/account`
              : `🔔 Lease Shield Account Update\n\nYour plan tier was changed by admin\n\n• From: ${oldTier.toUpperCase()}\n• To: ${newTier.toUpperCase()}\n\nCheck your account: leaseshield.asia/account`;
          } else if (variables.data.access_level) {
            const oldLevel = targetUser.access_level || 'user';
            const newLevel = variables.data.access_level;
            
            message = lang === 'th'
              ? `🔔 อัปเดตบัญชี Lease Shield\n\nระดับการเข้าถึงของคุณถูกเปลี่ยนโดยแอดมิน\n\n• จาก: ${oldLevel.toUpperCase()}\n• เป็น: ${newLevel.toUpperCase()}\n\nตรวจสอบบัญชีของคุณ: leaseshield.asia/account`
              : `🔔 Lease Shield Account Update\n\nYour access level was changed by admin\n\n• From: ${oldLevel.toUpperCase()}\n• To: ${newLevel.toUpperCase()}\n\nCheck your account: leaseshield.asia/account`;
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
          // Don't fail the mutation if LINE message fails
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

  const t = {
    en: {
      adminConsole: "Admin Console",
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
      testNotifications: "Test LINE Notifications",
      selectUser: "Select User",
      notificationType: "Notification Type",
      sendTest: "Send Test",
      sending: "Sending...",
      lineNotConnected: "LINE Not Connected",
      testSent: "Test notification sent!",
      editCredits: "Edit Credits",
      letterCredits: "Letter Credits",
      currentBalance: "Current Balance",
      newBalance: "New Balance",
      updateCredits: "Update Credits",
      cancel: "Cancel",
      updating: "Updating...",
    },
    th: {
      adminConsole: "คอนโซลผู้ดูแล",
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
      testNotifications: "ทดสอบการแจ้งเตือน LINE",
      selectUser: "เลือกผู้ใช้",
      notificationType: "ประเภทการแจ้งเตือน",
      sendTest: "ส่งทดสอบ",
      sending: "กำลังส่ง...",
      lineNotConnected: "ไม่ได้เชื่อมต่อ LINE",
      testSent: "ส่งการแจ้งเตือนทดสอบแล้ว!",
      editCredits: "แก้ไขเครดิต",
      letterCredits: "เครดิตจดหมาย",
      currentBalance: "ยอดคงเหลือปัจจุบัน",
      newBalance: "ยอดคงเหลือใหม่",
      updateCredits: "อัปเดตเครดิต",
      cancel: "ยกเลิก",
      updating: "กำลังอัปเดต...",
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

  const handleSendTestNotification = async () => {
    if (!selectedUserForTest) {
      alert('Please select a user');
      return;
    }

    setSendingTest(true);
    try {
      await base44.functions.invoke('testLineNotifications', {
        targetUserId: selectedUserForTest.id,
        notificationType: testNotificationType
      });
      alert(strings.testSent);
    } catch (error) {
      console.error('Test notification failed:', error);
      alert('Failed to send test notification');
    } finally {
      setSendingTest(false);
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

  const activeSubscribers = users.filter(u => 
    u.subscription_status === 'active' && u.plan_tier && u.plan_tier !== 'free'
  ).length;

  const sortedUsers = [...users].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
            {strings.adminConsole}
          </h1>
          <p style={{ color: colors.textSecondary }}>{strings.systemOverview}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.totalUsers}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: colors.textPrimary }}>{users.length}</p>
                </div>
                <Users className="w-12 h-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.activeSubscribers}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: colors.textPrimary }}>{activeSubscribers}</p>
                </div>
                <Crown className="w-12 h-12 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.totalLeases}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: colors.textPrimary }}>{leases.length}</p>
                </div>
                <FileText className="w-12 h-12 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.totalDocuments}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: colors.textPrimary }}>{documents.length}</p>
                </div>
                <Database className="w-12 h-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Data Seeder */}
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

        {/* Test LINE Notifications */}
        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Send className="w-5 h-5 text-emerald-600" />
              {strings.testNotifications}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label style={{ color: colors.textPrimary }}>{strings.selectUser}</Label>
                <Select
                  value={selectedUserForTest?.id}
                  onValueChange={(userId) => setSelectedUserForTest(users.find(u => u.id === userId))}
                >
                  <SelectTrigger style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
                    <SelectValue placeholder={strings.selectUser} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.line_messaging_token).map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label style={{ color: colors.textPrimary }}>{strings.notificationType}</Label>
                <Select value={testNotificationType} onValueChange={setTestNotificationType}>
                  <SelectTrigger style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit_30day">Deposit 30 Day</SelectItem>
                    <SelectItem value="deposit_7day">Deposit 7 Day</SelectItem>
                    <SelectItem value="deposit_overdue">Deposit Overdue</SelectItem>
                    <SelectItem value="rent_reminder">Rent Reminder</SelectItem>
                    <SelectItem value="lease_notice_30day">Lease Notice 30 Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSendTestNotification}
                  disabled={sendingTest || !selectedUserForTest}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {sendingTest ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {strings.sending}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {strings.sendTest}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Credits Dialog */}
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

        {/* User Management Table */}
        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle style={{ color: colors.textPrimary }}>{strings.userManagement}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>
                      {strings.user}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>
                      {strings.email}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>
                      {strings.accessLevel}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>
                      {strings.plan}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>
                      {strings.letterCredits}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>
                      {strings.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((u, idx) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: `1px solid ${colors.borderColor}`,
                        backgroundColor: idx % 2 === 0 ? colors.cardBg : (isDarkMode ? '#2A2D30' : '#F8FAFC')
                      }}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {u.full_name}
                        </p>
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
                        <div className="flex gap-2">
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

        {/* Operations Console Quick Access */}
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
