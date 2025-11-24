import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Scale,
  User,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  Mail,
  DollarSign,
  Search,
  Filter,
  Loader2,
  ArrowLeft,
  LayoutGrid,
  List
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CaseKanban from "../components/admin/CaseKanban";
import { ToastProvider, useToast } from "../components/shared/Toast";

const STATUS_CONFIG = {
  intake: { label: 'Intake', color: 'bg-slate-100 text-slate-800', icon: Clock },
  pending_review: { label: 'Pending Review', color: 'bg-amber-100 text-amber-800', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-800', icon: Scale },
  ready_drafts: { label: 'Drafts Ready', color: 'bg-purple-100 text-purple-800', icon: FileText },
  client_review: { label: 'Client Review', color: 'bg-indigo-100 text-indigo-800', icon: User },
  awaiting_landlord: { label: 'Awaiting Landlord', color: 'bg-yellow-100 text-yellow-800', icon: Mail },
  in_progress: { label: 'In Progress', color: 'bg-cyan-100 text-cyan-800', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle2 }
};

function OpsConsoleContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  
  // BUG FIX #1: Restore tab from URL params on page load
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'all';
  const [selectedCase, setSelectedCase] = useState(null);
  const [actionMode, setActionMode] = useState(null);
  const [filterStatus, setFilterStatus] = useState(initialTab); // BUG FIX #1: Initialize from URL
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingLetters, setGeneratingLetters] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const accessLevel = user?.access_level || 'user';
  const hasOpsAccess = ['va', 'admin', 'super_admin'].includes(accessLevel) || user?.role === 'admin';

  const { data: cases = [] } = useQuery({
    queryKey: ['allCases'],
    queryFn: async () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 [OPS_CONSOLE] RAW QUERY STARTING');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 Admin user:', user?.email);
      console.log('🔑 Access level:', user?.access_level);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // 🔥 RAW QUERY - NO FILTERS
      const rawResult = await base44.entities.Case.list('-created_date', 100);
      
      console.log('📊 [OPS_CONSOLE] RAW QUERY RESULT:', rawResult.length, 'cases returned');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Log every case
      rawResult.forEach((c, idx) => {
        console.log(`📄 CASE ${idx + 1}:`, {
          id: c.id.slice(0, 8),
          case_number: c.case_number,
          user_email: c.user_email,
          status: c.status,
          is_deleted: c.is_deleted
        });
      });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return rawResult;
    },
    enabled: hasOpsAccess,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: hasOpsAccess,
  });

  const updateCaseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Case.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCases'] });
      toast.success(strings.caseUpdated);
      setSelectedCase(null);
      setActionMode(null);
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
    statBg: '#353A3D',
    modalBg: '#2A2D30',
    inputBg: '#353A3D',
    inputBorder: '#4A4D50'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    statBg: '#FFFFFF',
    modalBg: '#FFFFFF',
    inputBg: '#FFFFFF',
    inputBorder: '#E5E7EB'
  };

  const t = {
    en: {
      back: "Back to Admin",
      opsConsole: "Ops Console",
      subtitle: "Manage dispute cases through resolution",
      unauthorized: "Unauthorized",
      unauthorizedDesc: "You need VA, Admin, or Super Admin access to view this page.",
      totalCases: "Total Cases",
      pendingReview: "Pending Review",
      inProgress: "In Progress",
      resolved: "Resolved",
      searchCases: "Search Cases",
      searchPlaceholder: "Case ID, email, or summary...",
      filterByStatus: "Filter by Status",
      allStatuses: "All Statuses",
      disputeAmount: "Dispute Amount",
      assignedTo: "Assigned To",
      unassigned: "Unassigned",
      opened: "Opened",
      summary: "Summary",
      updateStatus: "Update Status",
      assign: "Assign",
      generating: "Generating...",
      deposit: "Deposit",
      damages: "Damages",
      recordSettlement: "Record Settlement",
      viewDetails: "View Details",
      newStatus: "New Status",
      assignTo: "Assign To",
      selectTeamMember: "Select team member",
      settlementAmount: "Settlement Amount (฿)",
      paymentMethod: "Payment Method",
      paymentMethodPlaceholder: "Bank transfer, Cash, etc.",
      notes: "Notes",
      notesPlaceholder: "Settlement details...",
      cancel: "Cancel",
      caseUpdated: "Case updated successfully"
    },
    th: {
      back: "กลับไปแอดมิน",
      opsConsole: "คอนโซลปฏิบัติการ",
      subtitle: "จัดการคดีพิพาทจนถึงการแก้ปัญหา",
      unauthorized: "ไม่ได้รับอนุญาต",
      unauthorizedDesc: "คุณต้องมีสิทธิ์ VA, Admin หรือ Super Admin เพื่อเข้าถึงหน้านี้",
      totalCases: "คดีทั้งหมด",
      pendingReview: "รอตรวจสอบ",
      inProgress: "ดำเนินการ",
      resolved: "แก้ไขแล้ว",
      searchCases: "ค้นหาคดี",
      searchPlaceholder: "รหัสคดี, อีเมล, หรือสรุป...",
      filterByStatus: "กรองตามสถานะ",
      allStatuses: "สถานะทั้งหมด",
      disputeAmount: "จำนวนเงินพิพาท",
      assignedTo: "มอบหมายให้",
      unassigned: "ยังไม่มอบหมาย",
      opened: "เปิดเมื่อ",
      summary: "สรุป",
      updateStatus: "อัปเดตสถานะ",
      assign: "มอบหมาย",
      generating: "กำลังสร้าง...",
      deposit: "มัดจำ",
      damages: "ความเสียหาย",
      recordSettlement: "บันทึกการตกลง",
      viewDetails: "ดูรายละเอียด",
      newStatus: "สถานะใหม่",
      assignTo: "มอบหมายให้",
      selectTeamMember: "เลือกสมาชิกทีม",
      settlementAmount: "จำนวนเงินตกลง (฿)",
      paymentMethod: "วิธีการชำระเงิน",
      paymentMethodPlaceholder: "โอนธนาคาร, เงินสด ฯลฯ",
      notes: "หมายเหตุ",
      notesPlaceholder: "รายละเอียดการตกลง...",
      cancel: "ยกเลิก",
      caseUpdated: "อัปเดตคดีสำเร็จ"
    },
    zh: {
      back: "返回管理",
      opsConsole: "运营控制台",
      subtitle: "管理纠纷案件至解决",
      unauthorized: "未授权",
      unauthorizedDesc: "您需要VA、管理员或超级管理员访问权限才能查看此页面。",
      totalCases: "总案件数",
      pendingReview: "待审核",
      inProgress: "进行中",
      resolved: "已解决",
      searchCases: "搜索案件",
      searchPlaceholder: "案件ID、电子邮件或摘要...",
      filterByStatus: "按状态筛选",
      allStatuses: "所有状态",
      disputeAmount: "争议金额",
      assignedTo: "分配给",
      unassigned: "未分配",
      opened: "开启于",
      summary: "摘要",
      updateStatus: "更新状态",
      assign: "分配",
      generating: "生成中...",
      deposit: "押金",
      damages: "损害",
      recordSettlement: "记录和解",
      viewDetails: "查看详情",
      newStatus: "新状态",
      assignTo: "分配给",
      selectTeamMember: "选择团队成员",
      settlementAmount: "和解金额 (฿)",
      paymentMethod: "付款方式",
      paymentMethodPlaceholder: "银行转账、现金等",
      notes: "备注",
      notesPlaceholder: "和解详情...",
      cancel: "取消",
      caseUpdated: "案件更新成功"
    },
    ja: {
      back: "管理に戻る",
      opsConsole: "運用コンソール",
      subtitle: "紛争ケースを解決まで管理",
      unauthorized: "未承認",
      unauthorizedDesc: "このページを表示するにはVA、管理者、またはスーパー管理者のアクセス権が必要です。",
      totalCases: "総ケース数",
      pendingReview: "レビュー待ち",
      inProgress: "進行中",
      resolved: "解決済み",
      searchCases: "ケースを検索",
      searchPlaceholder: "ケースID、メール、または概要...",
      filterByStatus: "ステータスでフィルター",
      allStatuses: "すべてのステータス",
      disputeAmount: "紛争金額",
      assignedTo: "割り当て先",
      unassigned: "未割り当て",
      opened: "開設日",
      summary: "概要",
      updateStatus: "ステータスを更新",
      assign: "割り当て",
      generating: "生成中...",
      deposit: "敷金",
      damages: "損害",
      recordSettlement: "和解を記録",
      viewDetails: "詳細を表示",
      newStatus: "新しいステータス",
      assignTo: "割り当て先",
      selectTeamMember: "チームメンバーを選択",
      settlementAmount: "和解金額 (฿)",
      paymentMethod: "支払い方法",
      paymentMethodPlaceholder: "銀行振込、現金など",
      notes: "メモ",
      notesPlaceholder: "和解の詳細...",
      cancel: "キャンセル",
      caseUpdated: "ケースが正常に更新されました"
    },
    ko: {
      back: "관리로 돌아가기",
      opsConsole: "운영 콘솔",
      subtitle: "해결까지 분쟁 사례 관리",
      unauthorized: "권한 없음",
      unauthorizedDesc: "이 페이지를 보려면 VA, 관리자 또는 슈퍼 관리자 액세스 권한이 필요합니다.",
      totalCases: "총 사례 수",
      pendingReview: "검토 대기 중",
      inProgress: "진행 중",
      resolved: "해결됨",
      searchCases: "사례 검색",
      searchPlaceholder: "사례 ID, 이메일 또는 요약...",
      filterByStatus: "상태별 필터",
      allStatuses: "모든 상태",
      disputeAmount: "분쟁 금액",
      assignedTo: "할당 대상",
      unassigned: "미할당",
      opened: "개설일",
      summary: "요약",
      updateStatus: "상태 업데이트",
      assign: "할당",
      generating: "생성 중...",
      deposit: "보증금",
      damages: "손해",
      recordSettlement: "합의 기록",
      viewDetails: "세부정보 보기",
      newStatus: "새 상태",
      assignTo: "할당 대상",
      selectTeamMember: "팀 멤버 선택",
      settlementAmount: "합의 금액 (฿)",
      paymentMethod: "결제 방법",
      paymentMethodPlaceholder: "은행 송금, 현금 등",
      notes: "메모",
      notesPlaceholder: "합의 세부정보...",
      cancel: "취소",
      caseUpdated: "사례가 성공적으로 업데이트되었습니다"
    }
  };

  const strings = t[language] || t.en;

  if (!hasOpsAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: colors.bg }}>
        <Card className="max-w-md border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-8 text-center">
            <Scale className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {strings.unauthorized}
            </h2>
            <p style={{ color: colors.textSecondary }}>
              {strings.unauthorizedDesc}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredCases = cases.filter(c => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch = !searchQuery ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = (caseId, newStatus) => {
    const existingCase = cases.find(c => c.id === caseId);
    const timeline = existingCase?.timeline || [];

    timeline.push({
      timestamp: new Date().toISOString(),
      event: `Status changed to ${newStatus}`,
      actor: user.email
    });

    updateCaseMutation.mutate({
      id: caseId,
      data: { status: newStatus, timeline }
    });
  };

  const handleAssign = (caseId, assigneeEmail) => {
    const existingCase = cases.find(c => c.id === caseId);
    const timeline = existingCase?.timeline || [];

    timeline.push({
      timestamp: new Date().toISOString(),
      event: `Assigned to ${assigneeEmail}`,
      actor: user.email
    });

    updateCaseMutation.mutate({
      id: caseId,
      data: { assignee_id: assigneeEmail, timeline }
    });
  };

  const handleRecordSettlement = (caseId, settlementData) => {
    const existingCase = cases.find(c => c.id === caseId);
    const timeline = existingCase?.timeline || [];

    timeline.push({
      timestamp: new Date().toISOString(),
      event: `Settlement recorded: ฿${settlementData.amount}`,
      actor: user.email,
      meta: settlementData
    });

    updateCaseMutation.mutate({
      id: caseId,
      data: {
        status: 'resolved',
        settlement: {
          ...settlementData,
          date: new Date().toISOString()
        },
        timeline
      }
    });
  };

  const handleGenerateLetter = async (caseItem, subject) => {
    setGeneratingLetters(`${caseItem.id}-${subject}`);
    try {
      const response = await base44.functions.invoke('generatePhase1Letter', {
        caseId: caseItem.id,
        subject: subject
      });

      if (response.data?.ok) {
        queryClient.invalidateQueries({ queryKey: ['allCases'] });
        toast.success(`${subject.toUpperCase()} letter generated!`);
      } else {
        throw new Error(response.data?.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Letter generation failed:', error);
      toast.error('Failed to generate letter');
    } finally {
      setGeneratingLetters(null);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("AdminConsole"))}
            className="mb-4"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.borderColor,
              color: colors.textPrimary
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {strings.back}
          </Button>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Scale className="w-8 h-8 text-ls-forest" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.textPrimary }}>
                  {strings.opsConsole}
                </h1>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {strings.subtitle}
                </p>
              </div>
            </div>

            <div 
              className="flex rounded-lg p-1"
              style={{ 
                backgroundColor: colors.cardBg,
                border: `2px solid ${colors.borderColor}`,
              }}
            >
              <button
                onClick={() => setViewMode('kanban')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: viewMode === 'kanban' ? '#0C3B2E' : 'transparent',
                  color: viewMode === 'kanban' ? '#FFFFFF' : colors.textPrimary,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <LayoutGrid className="w-4 h-4" />
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: viewMode === 'list' ? '#0C3B2E' : 'transparent',
                  color: viewMode === 'list' ? '#FFFFFF' : colors.textPrimary,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <List className="w-4 h-4" />
                List
              </button>
            </div>
          </div>
        </div>

        {/* 🔍 FORENSIC DEBUG PANEL */}
        <div className="mb-6 p-4 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
          <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">
            🔍 OPS CONSOLE FORENSIC DEBUG (Remove after investigation)
          </h3>
          <div className="text-xs space-y-2">
            <p><strong>Admin user:</strong> {user?.email}</p>
            <p><strong>Access level:</strong> {user?.access_level}</p>
            <p><strong>Raw query returned:</strong> {cases.length} cases</p>
            <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded border border-red-300 max-h-96 overflow-auto">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(cases.map(c => ({
                  id: c.id,
                  case_number: c.case_number,
                  user_email: c.user_email,
                  status: c.status,
                  is_deleted: c.is_deleted
                })), null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-md" style={{ backgroundColor: colors.statBg, borderColor: colors.borderColor }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {strings.totalCases}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{cases.length}</p>
                </div>
                <Scale className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md" style={{ backgroundColor: colors.statBg, borderColor: colors.borderColor }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {strings.pendingReview}
                  </p>
                  <p className="text-2xl font-bold text-amber-600">
                    {cases.filter(c => c.status === 'pending_review').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md" style={{ backgroundColor: colors.statBg, borderColor: colors.borderColor }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {strings.inProgress}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {cases.filter(c => ['under_review', 'ready_drafts', 'client_review', 'awaiting_landlord', 'in_progress'].includes(c.status)).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md" style={{ backgroundColor: colors.statBg, borderColor: colors.borderColor }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {strings.resolved}
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {cases.filter(c => c.status === 'resolved' || c.status === 'closed').length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 border-none shadow-md" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
          <CardContent className="p-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search" className="text-sm font-semibold mb-2 block" style={{ color: colors.textPrimary }}>
                  <Search className="w-4 h-4 inline mr-2" />
                  {strings.searchCases}
                </Label>
                <Input
                  id="search"
                  placeholder={strings.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary
                  }}
                />
              </div>
              <div>
                <Label htmlFor="filter" className="text-sm font-semibold mb-2 block" style={{ color: colors.textPrimary }}>
                  <Filter className="w-4 h-4 inline mr-2" />
                  {strings.filterByStatus}
                </Label>
                <Select value={filterStatus} onValueChange={(val) => {
                  setFilterStatus(val);
                  // BUG FIX #1: Update URL when filter changes (preserves tab on refresh)
                  const newUrl = val === 'all' 
                    ? window.location.pathname 
                    : `${window.location.pathname}?tab=${val}`;
                  window.history.replaceState({}, '', newUrl);
                }}>
                  <SelectTrigger style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary
                  }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{strings.allStatuses}</SelectItem>
                    <SelectItem value="intake">{STATUS_CONFIG.intake.label}</SelectItem>
                    <SelectItem value="pending_review">{STATUS_CONFIG.pending_review.label}</SelectItem>
                    <SelectItem value="under_review">{STATUS_CONFIG.under_review.label}</SelectItem>
                    <SelectItem value="ready_drafts">{STATUS_CONFIG.ready_drafts.label}</SelectItem>
                    <SelectItem value="client_review">{STATUS_CONFIG.client_review.label}</SelectItem>
                    <SelectItem value="awaiting_landlord">{STATUS_CONFIG.awaiting_landlord.label}</SelectItem>
                    <SelectItem value="in_progress">{STATUS_CONFIG.in_progress.label}</SelectItem>
                    <SelectItem value="resolved">{STATUS_CONFIG.resolved.label}</SelectItem>
                    <SelectItem value="closed">{STATUS_CONFIG.closed.label}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {viewMode === 'kanban' ? (
          <CaseKanban
            cases={filteredCases}
            users={users}
            onUpdateStatus={handleUpdateStatus}
            language={language}
            colors={colors}
          />
        ) : (
          <div className="grid gap-4">
            {filteredCases.map((caseItem) => {
              const statusConfig = STATUS_CONFIG[caseItem.status] || STATUS_CONFIG.pending_review;
              const StatusIcon = statusConfig.icon;
              const tenant = users.find(u => u.email === caseItem.user_email);
              const assignee = users.find(u => u.email === caseItem.assignee_id);

              return (
                <Card key={caseItem.id} className="border-none shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
                  <CardHeader className="pb-3" style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Scale className="w-6 h-6 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg" style={{ color: colors.textPrimary }}>
                            {caseItem.case_number || `Case #${caseItem.id.slice(0, 8)}`}
                          </CardTitle>
                          <p className="text-sm" style={{ color: colors.textSecondary }}>
                            {tenant?.full_name || caseItem.user_email}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${statusConfig.color} border flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-6 mb-4">
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                          {strings.disputeAmount}
                        </p>
                        <div className="flex items-baseline gap-1">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <p className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                            ฿{caseItem.dispute_amount?.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                          {strings.assignedTo}
                        </p>
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                          {assignee?.full_name || strings.unassigned}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                          {strings.opened}
                        </p>
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                          {format(new Date(caseItem.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    {caseItem.summary && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                          {strings.summary}
                        </p>
                        <p className="text-sm line-clamp-2" style={{ color: colors.textPrimary }}>{caseItem.summary}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCase(caseItem);
                          setActionMode('status');
                        }}
                      >
                        {strings.updateStatus}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCase(caseItem);
                          setActionMode('assign');
                        }}
                      >
                        {strings.assign}
                      </Button>

                      {caseItem.status === 'under_review' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateLetter(caseItem, 'deposit')}
                            disabled={generatingLetters === `${caseItem.id}-deposit`}
                            className="border-blue-600 text-blue-600"
                          >
                            {generatingLetters === `${caseItem.id}-deposit` ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                {strings.generating}
                              </>
                            ) : (
                              <>
                                <FileText className="w-3 h-3 mr-1" />
                                {strings.deposit}
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateLetter(caseItem, 'damages')}
                            disabled={generatingLetters === `${caseItem.id}-damages`}
                            className="border-orange-600 text-orange-600"
                          >
                            {generatingLetters === `${caseItem.id}-damages` ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                {strings.generating}
                              </>
                            ) : (
                              <>
                                <FileText className="w-3 h-3 mr-1" />
                                {strings.damages}
                              </>
                            )}
                          </Button>
                        </>
                      )}

                      {caseItem.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCase(caseItem);
                            setActionMode('settlement');
                          }}
                          className="border-emerald-600 text-emerald-600"
                        >
                          {strings.recordSettlement}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(createPageUrl("CaseDetails") + `?caseId=${caseItem.id}&from=ops&tab=${filterStatus}`)}
                      >
                        {strings.viewDetails}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {selectedCase && actionMode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-none shadow-2xl" style={{ backgroundColor: colors.modalBg }}>
              <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                <CardTitle style={{ color: colors.textPrimary }}>
                  {actionMode === 'status' && strings.updateStatus}
                  {actionMode === 'assign' && strings.assign}
                  {actionMode === 'settlement' && strings.recordSettlement}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {actionMode === 'status' && (
                  <div className="space-y-4">
                    <Label style={{ color: colors.textPrimary }}>
                      {strings.newStatus}
                    </Label>
                    <Select
                      defaultValue={selectedCase.status}
                      onValueChange={(value) => {
                        // WORKFLOW FIX: Validate allowed transitions
                        const currentStatus = selectedCase.status;
                        const allowedTransitions = {
                          'intake': ['pending_review'],
                          'pending_review': ['under_review', 'intake'],
                          'under_review': ['ready_drafts', 'pending_review'],
                          'ready_drafts': ['client_review', 'under_review'],
                          'client_review': ['awaiting_landlord', 'ready_drafts'],
                          'awaiting_landlord': ['in_progress', 'client_review'],
                          'in_progress': ['resolved', 'awaiting_landlord'],
                          'resolved': ['closed'],
                          'closed': []
                        };
                        
                        const allowed = allowedTransitions[currentStatus] || [];
                        if (!allowed.includes(value)) {
                          toast.error(language === 'th' 
                            ? `ไม่สามารถเปลี่ยนจาก ${currentStatus} ไป ${value}` 
                            : language === 'zh' ? `无法从 ${currentStatus} 更改为 ${value}`
                            : language === 'ja' ? `${currentStatus}から${value}に変更できません`
                            : language === 'ko' ? `${currentStatus}에서 ${value}로 변경할 수 없습니다`
                            : `Cannot transition from ${currentStatus} to ${value}`);
                          return;
                        }
                        
                        handleUpdateStatus(selectedCase.id, value);
                      }}
                    >
                      <SelectTrigger style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                        color: colors.textPrimary
                      }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="intake">{STATUS_CONFIG.intake.label}</SelectItem>
                        <SelectItem value="pending_review">{STATUS_CONFIG.pending_review.label}</SelectItem>
                        <SelectItem value="under_review">{STATUS_CONFIG.under_review.label}</SelectItem>
                        <SelectItem value="ready_drafts">{STATUS_CONFIG.ready_drafts.label}</SelectItem>
                        <SelectItem value="client_review">{STATUS_CONFIG.client_review.label}</SelectItem>
                        <SelectItem value="awaiting_landlord">{STATUS_CONFIG.awaiting_landlord.label}</SelectItem>
                        <SelectItem value="in_progress">{STATUS_CONFIG.in_progress.label}</SelectItem>
                        <SelectItem value="resolved">{STATUS_CONFIG.resolved.label}</SelectItem>
                        <SelectItem value="closed">{STATUS_CONFIG.closed.label}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionMode === 'assign' && (
                  <div className="space-y-4">
                    <Label style={{ color: colors.textPrimary }}>
                      {strings.assignTo}
                    </Label>
                    <Select
                      defaultValue={selectedCase.assignee_id}
                      onValueChange={(value) => {
                        handleAssign(selectedCase.id, value);
                      }}
                    >
                      <SelectTrigger style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                        color: colors.textPrimary
                      }}>
                        <SelectValue placeholder={strings.selectTeamMember} />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => u.access_level === 'va' || u.access_level === 'admin' || u.access_level === 'super_admin' || u.role === 'admin').map(u => (
                          <SelectItem key={u.id} value={u.email}>
                            {u.full_name} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionMode === 'settlement' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      handleRecordSettlement(selectedCase.id, {
                        amount: parseFloat(formData.get('amount')),
                        currency: 'THB',
                        method: formData.get('method'),
                        notes: formData.get('notes')
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="amount" style={{ color: colors.textPrimary }}>
                        {strings.settlementAmount}
                      </Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        required
                        placeholder="15000"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.textPrimary
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="method" style={{ color: colors.textPrimary }}>
                        {strings.paymentMethod}
                      </Label>
                      <Input
                        id="method"
                        name="method"
                        placeholder={strings.paymentMethodPlaceholder}
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.textPrimary
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes" style={{ color: colors.textPrimary }}>
                        {strings.notes}
                      </Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        placeholder={strings.notesPlaceholder}
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.textPrimary
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCase(null);
                          setActionMode(null);
                        }}
                      >
                        {strings.cancel}
                      </Button>
                      <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                        {strings.recordSettlement}
                      </Button>
                    </div>
                  </form>
                )}

                {(actionMode === 'status' || actionMode === 'assign') && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => {
                      setSelectedCase(null);
                      setActionMode(null);
                    }}
                  >
                    {strings.cancel}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OpsConsole() {
  return (
    <ToastProvider>
      <OpsConsoleContent />
    </ToastProvider>
  );
}