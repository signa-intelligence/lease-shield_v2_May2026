
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Eye,
  X,
  Mail,
  Calendar,
  Shield,
  FileText,
  Wallet,
  AlertCircle,
  LogOut,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UserImpersonation({ colors, language = 'en' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [impersonatedUser, setImpersonatedUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsersForImpersonation'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAllUsers');
      return response.data?.users || [];
    },
  });

  const { data: userStats } = useQuery({
    queryKey: ['userStats', impersonatedUser?.email],
    queryFn: async () => {
      if (!impersonatedUser?.email) return null;
      
      const [leases, deposits, cases, documents] = await Promise.all([
        base44.asServiceRole.entities.Lease.filter({ created_by: impersonatedUser.email }),
        base44.asServiceRole.entities.DepositTracker.filter({ created_by: impersonatedUser.email }),
        base44.asServiceRole.entities.Case.filter({ user_email: impersonatedUser.email }),
        base44.asServiceRole.entities.Document.filter({ created_by: impersonatedUser.email }),
      ]);
      
      return { leases, deposits, cases, documents };
    },
    enabled: !!impersonatedUser,
  });

  const t = {
    en: {
      title: "User Impersonation",
      subtitle: "View app as any user for support & debugging",
      searchPlaceholder: "Search by email or name...",
      noUsers: "No users found",
      viewAsUser: "View as User",
      userEmail: "Email",
      joinedOn: "Joined",
      plan: "Plan",
      activity: "Activity",
      leases: "Leases",
      deposits: "Deposits",
      cases: "Cases",
      documents: "Documents",
      goToDashboard: "Go to Dashboard",
      userTimeline: "User Timeline",
      internalNotes: "Internal Notes",
      quickActions: "Quick Actions",
      userImpersonation: "User Impersonation",
      impersonationDesc: "View the app as any user for debugging",
      selectUser: "Select User to Impersonate",
      selectUserPlaceholder: "Choose a user...",
      impersonate: "Impersonate",
      stopImpersonating: "Stop Impersonating",
      currentlyViewing: "Currently viewing as"
    },
    th: {
      title: "ดูในฐานะผู้ใช้",
      subtitle: "ดูแอปในฐานะผู้ใช้รายใดก็ได้เพื่อการสนับสนุนและแก้ไขข้อบกพร่อง",
      searchPlaceholder: "ค้นหาด้วยอีเมลหรือชื่อ...",
      noUsers: "ไม่พบผู้ใช้",
      viewAsUser: "ดูในฐานะผู้ใช้",
      userEmail: "อีเมล",
      joinedOn: "สมัครเมื่อ",
      plan: "แผน",
      activity: "กิจกรรม",
      leases: "สัญญาเช่า",
      deposits: "เงินมัดจำ",
      cases: "คดี",
      documents: "เอกสาร",
      goToDashboard: "ไปที่แดชบอร์ด",
      userTimeline: "ไทม์ไลน์ผู้ใช้",
      internalNotes: "บันทึกภายใน",
      quickActions: "การดำเนินการด่วน",
      userImpersonation: "แอบอ้างผู้ใช้",
      impersonationDesc: "ดูแอปในฐานะผู้ใช้คนใดก็ได้เพื่อการแก้ไขข้อบกพร่อง",
      selectUser: "เลือกผู้ใช้ที่จะแอบอ้าง",
      selectUserPlaceholder: "เลือกผู้ใช้...",
      impersonate: "แอบอ้าง",
      stopImpersonating: "หยุดการแอบอ้าง",
      currentlyViewing: "กำลังดูในฐานะ"
    },
    zh: {
      title: "用户模拟",
      subtitle: "以任何用户身份查看应用以进行支持和调试",
      searchPlaceholder: "按电子邮件或姓名搜索...",
      noUsers: "未找到用户",
      viewAsUser: "以用户身份查看",
      userEmail: "电子邮件",
      joinedOn: "加入于",
      plan: "计划",
      activity: "活动",
      leases: "租约",
      deposits: "押金",
      cases: "案件",
      documents: "文档",
      goToDashboard: "转到仪表板",
      userTimeline: "用户时间轴",
      internalNotes: "内部备注",
      quickActions: "快速操作",
      userImpersonation: "用户模拟",
      impersonationDesc: "以任何用户身份查看应用以进行调试",
      selectUser: "选择要模拟的用户",
      selectUserPlaceholder: "选择用户...",
      impersonate: "模拟",
      stopImpersonating: "停止模拟",
      currentlyViewing: "当前查看身份"
    },
    ja: {
      title: "ユーザーなりすまし",
      subtitle: "サポートとデバッグのために任意のユーザーとしてアプリを表示",
      searchPlaceholder: "メールまたは名前で検索...",
      noUsers: "ユーザーが見つかりません",
      viewAsUser: "ユーザーとして表示",
      userEmail: "メール",
      joinedOn: "参加日",
      plan: "プラン",
      activity: "アクティビティ",
      leases: "賃貸契約",
      deposits: "敷金",
      cases: "ケース",
      documents: "ドキュメント",
      goToDashboard: "ダッシュボードへ",
      userTimeline: "ユーザータイムライン",
      internalNotes: "内部メモ",
      quickActions: "クイックアクション",
      userImpersonation: "ユーザーなりすまし",
      impersonationDesc: "デバッグのため任意のユーザーとしてアプリを表示",
      selectUser: "なりすますユーザーを選択",
      selectUserPlaceholder: "ユーザーを選択...",
      impersonate: "なりすます",
      stopImpersonating: "なりすまし停止",
      currentlyViewing: "現在の表示ユーザー"
    },
    ko: {
      title: "사용자 가장",
      subtitle: "지원 및 디버깅을 위해 모든 사용자로 앱 보기",
      searchPlaceholder: "이메일 또는 이름으로 검색...",
      noUsers: "사용자를 찾을 수 없음",
      viewAsUser: "사용자로 보기",
      userEmail: "이메일",
      joinedOn: "가입일",
      plan: "계획",
      activity: "활동",
      leases: "임대 계약",
      deposits: "보증금",
      cases: "사례",
      documents: "문서",
      goToDashboard: "대시보드로 이동",
      userTimeline: "사용자 타임라인",
      internalNotes: "내부 메모",
      quickActions: "빠른 작업",
      userImpersonation: "사용자 가장",
      impersonationDesc: "디버깅을 위해 모든 사용자로 앱 보기",
      selectUser: "가장할 사용자 선택",
      selectUserPlaceholder: "사용자 선택...",
      impersonate: "가장",
      stopImpersonating: "가장 중지",
      currentlyViewing: "현재 보는 사용자"
    }
  };

  const strings = t[language] || t.en;

  const filteredUsers = allUsers.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImpersonate = (user) => {
    setImpersonatedUser(user);
  };

  const handleStopImpersonation = () => {
    setImpersonatedUser(null);
  };

  const handleViewDashboard = () => {
    // Store impersonation info in sessionStorage
    sessionStorage.setItem('impersonating_user_email', impersonatedUser.email);
    navigate(createPageUrl("Dashboard"));
  };

  return (
    <div className="space-y-6">
      {/* Active Impersonation Banner */}
      {impersonatedUser && (
        <Card className="border-none shadow-xl" style={{ 
          backgroundColor: '#EF4444',
          borderLeft: '6px solid #DC2626'
        }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-white" />
                <div>
                  <p className="font-bold text-white text-sm">{strings.currentlyViewing}</p>
                  <p className="text-white/90 text-xs">{impersonatedUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleViewDashboard}
                  size="sm"
                  className="bg-white text-red-600 hover:bg-white/90"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {strings.goToDashboard}
                </Button>
                <Button
                  onClick={handleStopImpersonation}
                  size="sm"
                  variant="outline"
                  className="border-white text-white hover:bg-white/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {strings.stopImpersonating}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Stats Preview */}
      {impersonatedUser && userStats && (
        <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Activity className="w-5 h-5 text-ls-forest" />
              {strings.activity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.fieldBg }}>
                <FileText className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {userStats.leases?.length || 0}
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>{strings.leases}</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.fieldBg }}>
                <Wallet className="w-6 h-6 mx-auto mb-2 text-amber-600" />
                <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {userStats.deposits?.length || 0}
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>{strings.deposits}</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.fieldBg }}>
                <Shield className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {userStats.cases?.length || 0}
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>{strings.cases}</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.fieldBg }}>
                <FileText className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {userStats.documents?.length || 0}
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>{strings.documents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Search & List */}
      <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Users className="w-5 h-5 text-ls-forest" />
            {strings.title}
          </CardTitle>
          <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: colors.textSecondary }} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={strings.searchPlaceholder}
              className="pl-10"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.borderColor,
                color: colors.textPrimary
              }}
            />
          </div>

          {/* User List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-2" style={{ color: colors.textSecondary, opacity: 0.3 }} />
                <p style={{ color: colors.textSecondary }}>{strings.noUsers}</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-lg border-2 transition-all"
                  style={{
                    backgroundColor: impersonatedUser?.id === user.id ? '#3B82F615' : colors.fieldBg,
                    borderColor: impersonatedUser?.id === user.id ? '#3B82F6' : colors.borderColor,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm mb-1 truncate" style={{ color: colors.textPrimary }}>
                        {user.full_name}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-3 h-3 flex-shrink-0" style={{ color: colors.textSecondary }} />
                        <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                          {user.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          {user.plan_tier || 'free'}
                        </Badge>
                        <span className="text-xs" style={{ color: colors.textSecondary }}>
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {format(new Date(user.created_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => impersonatedUser?.id === user.id ? handleStopImpersonation() : handleImpersonate(user)}
                      size="sm"
                      variant={impersonatedUser?.id === user.id ? "destructive" : "default"}
                      className={impersonatedUser?.id === user.id ? "" : "bg-ls-forest hover:bg-ls-forest/90"}
                    >
                      {impersonatedUser?.id === user.id ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          {strings.stopImpersonating}
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          {strings.viewAsUser}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
