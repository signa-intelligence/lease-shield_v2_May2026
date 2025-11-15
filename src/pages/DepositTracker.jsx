
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, ArrowLeft, AlertCircle, FileText, CheckCircle2, Scale, Loader2, Trash2 } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PullToRefresh from "../components/shared/PullToRefresh";
import { ToastProvider, useToast } from "../components/shared/Toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { CTA_COLOR } from "../components/shared/featureTheme";
import { haptic } from "../components/shared/HapticFeedback";

function DepositTrackerContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);

  const [formData, setFormData] = useState({
    deposit_amount: '',
    deposit_paid_date: '',
    expected_return_date: '',
    property_address: '',
    notes: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: deposits = [], isLoading } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    inputBg: '#353A3D',
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    inputBg: '#FFFFFF',
  };

  const createDepositMutation = useMutation({
    mutationFn: (data) => base44.entities.DepositTracker.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setShowForm(false);
      setFormData({
        deposit_amount: '',
        deposit_paid_date: '',
        expected_return_date: '',
        property_address: '',
        notes: ''
      });
      toast.success(language === 'th' ? 'บันทึกสำเร็จ' : 'Saved successfully');
    },
    onError: (error) => {
      console.error('Failed to create deposit:', error);
      toast.error(user?.language === 'th'
        ? 'บันทึกไม่สำเร็จ'
        : 'Save failed');
    }
  });

  const updateDepositMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DepositTracker.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setShowForm(false);
      toast.success(language === 'th' ? 'อัปเดตสำเร็จ' : 'Updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update deposit:', error);
      toast.error(user?.language === 'th'
        ? 'อัปเดตไม่สำเร็จ'
        : 'Update failed');
    }
  });

  const deleteDepositMutation = useMutation({
    mutationFn: (id) => base44.entities.DepositTracker.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      toast.success(language === 'th' ? 'ลบสำเร็จ' : 'Deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete deposit:', error);
      toast.error(user?.language === 'th'
        ? 'ลบไม่สำเร็จ'
        : 'Delete failed');
    }
  });

  const handleRefresh = async () => {
    haptic.light();
    await queryClient.invalidateQueries({ queryKey: ['deposits'] });
    toast.success(language === 'th' ? 'รีเฟรชสำเร็จ' : 'Refreshed successfully');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const depositData = {
      deposit_amount: parseFloat(formData.deposit_amount),
      deposit_paid_date: formData.deposit_paid_date,
      expected_return_date: formData.expected_return_date,
      property_address: formData.property_address || undefined,
      notes: formData.notes || undefined,
      status: selectedDeposit ? selectedDeposit.status : 'tracking', // Preserve status on edit
    };

    try {
      if (selectedDeposit) {
        await updateDepositMutation.mutateAsync({ id: selectedDeposit.id, data: depositData });
      } else {
        await createDepositMutation.mutateAsync(depositData);
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleEditClick = (deposit) => {
    haptic.light();
    setSelectedDeposit(deposit);
    setFormData({
      deposit_amount: deposit.deposit_amount.toString(),
      deposit_paid_date: format(new Date(deposit.deposit_paid_date), 'yyyy-MM-dd'),
      expected_return_date: format(new Date(deposit.expected_return_date), 'yyyy-MM-dd'),
      property_address: deposit.property_address || '',
      notes: deposit.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = (depositId) => {
    if (window.confirm(strings.confirmDelete || 'Are you sure you want to delete this deposit?')) {
      haptic.heavy();
      deleteDepositMutation.mutate(depositId);
    }
  };

  const handleStatusChange = (depositId, newStatus) => {
    haptic.medium();
    if (newStatus === 'dispute') {
      const deposit = deposits.find(d => d.id === depositId);
      setSelectedDeposit(deposit);
      setShowDisputeDialog(true);
    } else {
      updateDepositMutation.mutate({
        id: depositId,
        data: { status: newStatus }
      });
    }
  };

  const handleAddClick = () => {
    haptic.light();
    const isFreeUser = !user?.plan_tier || user?.plan_tier === 'free';
    if (isFreeUser) {
      setShowUpgradeModal(true);
    } else {
      setShowForm(true);
      setSelectedDeposit(null);
      setFormData({
        deposit_amount: '',
        deposit_paid_date: '',
        expected_return_date: '',
        property_address: '',
        notes: ''
      });
    }
  };

  const handleOpenCase = () => {
    if (!selectedDeposit) return;
    haptic.medium();

    updateDepositMutation.mutate({
      id: selectedDeposit.id,
      data: { status: 'dispute' }
    });

    const params = new URLSearchParams({
      amount: selectedDeposit.deposit_amount.toString(),
      address: selectedDeposit.property_address || '',
      type: 'deposit'
    });

    navigate(createPageUrl("ResolveCase") + `?${params.toString()}`);
    setShowDisputeDialog(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'tracking':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'returned':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'dispute':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'tracking':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'returned':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'dispute':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Wallet className="w-5 h-5 text-slate-600" />;
    }
  };

  const now = new Date();

  const t = {
    en: {
      title: "Deposit Tracker",
      subtitle: "Track your security deposits and ensure timely returns",
      addDeposit: "Add Deposit",
      depositAmount: "Deposit Amount (£)",
      paidDate: "Date Paid",
      expectedReturn: "Expected Return Date",
      propertyAddress: "Property Address",
      notes: "Notes",
      save: "Save",
      cancel: "Cancel",
      noDeposits: "No Deposits Tracked",
      noDepositsDesc: "Start tracking your deposits to ensure they're returned on time",
      status: "Status",
      tracking: "Tracking",
      returned: "Returned",
      dispute: "Dispute",
      back: "Back",
      openDisputeCase: "Open Dispute Case",
      openDisputeCaseDesc: "When you mark a deposit as disputed, you should open a formal case to get help resolving it.",
      depositDetails: "Deposit Details",
      amount: "Amount:",
      address: "Address:",
      weAreHereToHelp: "We're here to help",
      openCaseToGet: "Open a case to get: Expert review, letter templates, and negotiation support",
      openCase: "Open Case",
      daysUntilReturn: "days until expected return",
      overdue: "days overdue",
      upgradeRequired: "Upgrade Required",
      upgradeDepositBody: "Deposit Tracker is available on paid plans. Upgrade to Lite, Protect, or Secure to securely log and monitor deposits.",
      viewPlans: "View Plans",
      maybeLater: "Maybe Later",
      saving: "Saving...",
      edit: "Edit",
      delete: "Delete",
      confirmDelete: "Are you sure you want to delete this deposit?",
      paidOn: "Paid on",
      returnsOn: "Returns on",
    },
    th: {
      title: "ติดตามเงินมัดจำ",
      subtitle: "ติดตามเงินมัดจำและให้แน่ใจว่าคืนตรงเวลา",
      addDeposit: "เพิ่มเงินมัดจำ",
      depositAmount: "จำนวนเงินมัดจำ (฿)",
      paidDate: "วันที่จ่าย",
      expectedReturn: "วันที่คาดว่าจะคืน",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      notes: "หมายเหตุ",
      save: "บันทึก",
      cancel: "ยกเลิก",
      noDeposits: "ไม่มีเงินมัดจำที่ติดตาม",
      noDepositsDesc: "เริ่มติดตามเงินมัดจำเพื่อให้แน่ใจว่าจะได้รับคืนตรงเวลา",
      status: "สถานะ",
      tracking: "ติดตาม",
      returned: "คืนแล้ว",
      dispute: "โต้แย้ง",
      back: "กลับ",
      openDisputeCase: "เปิดคดีพิพาท",
      openDisputeCaseDesc: "เมื่อคุณทำเครื่องหมายเงินมัดจำว่าเป็นข้อพิพาท คุณควรเปิดคดีอย่างเป็นทางการเพื่อรับความช่วยเหลือในการแก้ปัญหา",
      depositDetails: "รายละเอียดเงินมัดจำ",
      amount: "จำนวนเงิน:",
      address: "ที่อยู่:",
      weAreHereToHelp: "เราพร้อมช่วยคุณ",
      openCaseToGet: "เปิดคดีเพื่อรับ: การตรวจสอบโดยผู้เชี่ยวชาญ, เทมเพลตจดหมาย และการสนับสนุนการเจรจา",
      openCase: "เปิดคดี",
      daysUntilReturn: "วันจนกว่าจะคืน",
      overdue: "วันที่เกินกำหนด",
      upgradeRequired: "ต้องอัปเกรด",
      upgradeDepositBody: "เครื่องมือติดตามเงินมัดจำพร้อมใช้งานในแผนแบบชำระเงิน อัปเกรดเป็น Lite, Protect หรือ Secure เพื่อบันทึกและติดตามเงินมัดจำอย่างปลอดภัย",
      viewPlans: "ดูแผน",
      maybeLater: "ภายหลัง",
      saving: "กำลังบันทึก...",
      edit: "แก้ไข",
      delete: "ลบ",
      confirmDelete: "คุณแน่ใจหรือไม่ว่าต้องการลบเงินมัดจำนี้?",
      paidOn: "จ่ายเมื่อ",
      returnsOn: "คืนเมื่อ",
    },
    zh: {
      title: "押金追踪器",
      subtitle: "追踪您的保证金并确保按时退还",
      addDeposit: "添加押金",
      depositAmount: "押金金额 (¥)",
      paidDate: "支付日期",
      expectedReturn: "预期退还日期",
      propertyAddress: "物业地址",
      notes: "备注",
      save: "保存",
      cancel: "取消",
      noDeposits: "未追踪押金",
      noDepositsDesc: "开始追踪您的押金以确保按时退还",
      status: "状态",
      tracking: "追踪中",
      returned: "已退还",
      dispute: "争议",
      back: "返回",
      openDisputeCase: "开启争议案件",
      openDisputeCaseDesc: "当您将押金标记为有争议时，您应该开启一个正式案件以获得解决帮助。",
      depositDetails: "押金详情",
      amount: "金额:",
      address: "地址:",
      weAreHereToHelp: "我们在此提供帮助",
      openCaseToGet: "开启案件以获得：专家审查、信函模板和谈判支持",
      openCase: "开启案件",
      daysUntilReturn: "天直到预期退还",
      overdue: "天逾期",
      upgradeRequired: "需要升级",
      upgradeDepositBody: "押金追踪器在付费计划中可用。升级到 Lite、Protect 或 Secure 以安全地记录和监控押金。",
      viewPlans: "查看计划",
      maybeLater: "稍后再说",
      saving: "保存中...",
      edit: "编辑",
      delete: "删除",
      confirmDelete: "您确定要删除此押金吗？",
      paidOn: "支付于",
      returnsOn: "退还于",
    },
    ja: {
      title: "敷金トラッカー",
      subtitle: "保証金を追跡し、タイムリーな返還を確保",
      addDeposit: "敷金を追加",
      depositAmount: "敷金額 (円)",
      paidDate: "支払日",
      expectedReturn: "返還予定日",
      propertyAddress: "物件住所",
      notes: "メモ",
      save: "保存",
      cancel: "キャンセル",
      noDeposits: "追跡中の敷金なし",
      noDepositsDesc: "敷金を追跡して、時間通りに返還されるようにします",
      status: "ステータス",
      tracking: "追跡中",
      returned: "返還済み",
      dispute: "紛争",
      back: "戻る",
      openDisputeCase: "紛争ケースを開く",
      openDisputeCaseDesc: "敷金を紛争としてマークした場合、解決の支援を得るために正式なケースを開く必要があります。",
      depositDetails: "敷金詳細",
      amount: "金額:",
      address: "住所:",
      weAreHereToHelp: "私たちはここにいます",
      openCaseToGet: "ケースを開くと、専門家によるレビュー、レターテンプレート、交渉サポートが受けられます",
      openCase: "ケースを開く",
      daysUntilReturn: "返還までの日数",
      overdue: "日延滞",
      upgradeRequired: "アップグレードが必要",
      upgradeDepositBody: "敷金トラッカーは有料プランで利用できます。Lite、Protect、または Secure にアップグレードして、敷金を安全に記録および監視します。",
      viewPlans: "プランを表示",
      maybeLater: "後で",
      saving: "保存中...",
      edit: "編集",
      delete: "削除",
      confirmDelete: "この敷金を削除してもよろしいですか？",
      paidOn: "支払日",
      returnsOn: "返還日",
    },
    ko: {
      title: "보증금 추적기",
      subtitle: "보증금을 추적하고 적시 반환 보장",
      addDeposit: "보증금 추가",
      depositAmount: "보증금 금액 (₩)",
      paidDate: "지불 날짜",
      expectedReturn: "예상 반환 날짜",
      propertyAddress: "부동산 주소",
      notes: "메모",
      save: "저장",
      cancel: "취소",
      noDeposits: "추적 중인 보증금 없음",
      noDepositsDesc: "보증금을 추적하여 제때 반환되도록 합니다",
      status: "상태",
      tracking: "추적 중",
      returned: "반환됨",
      dispute: "분쟁",
      back: "뒤로",
      openDisputeCase: "분쟁 사례 열기",
      openDisputeCaseDesc: "보증금을 분쟁으로 표시하면 해결에 도움이 되는 공식적인 사례를 열어야 합니다.",
      depositDetails: "보증금 세부 정보",
      amount: "금액:",
      address: "주소:",
      weAreHereToHelp: "저희가 도와드리겠습니다",
      openCaseToGet: "사례를 열어 다음을 받으세요: 전문가 검토, 서신 템플릿, 협상 지원",
      openCase: "사례 열기",
      daysUntilReturn: "반환까지 남은 일수",
      overdue: "일 연체",
      upgradeRequired: "업그레이드 필요",
      upgradeDepositBody: "보증금 추적기는 유료 계획에서 사용할 수 있습니다. Lite, Protect 또는 Secure로 업그레이드하여 보증금을 안전하게 기록하고 모니터링하세요.",
      viewPlans: "계획 보기",
      maybeLater: "나중에",
      saving: "저장 중...",
      edit: "수정",
      delete: "삭제",
      confirmDelete: "이 보증금을 삭제하시겠습니까?",
      paidOn: "지불일",
      returnsOn: "반환일",
    }
  };

  const strings = t[language] || t.en;

  return (
    <PullToRefresh onRefresh={handleRefresh} colors={colors}>
      <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => {
              haptic.light();
              navigate(createPageUrl("Dashboard"));
            }}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {strings.back}
          </Button>

          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Wallet className="w-7 h-7 md:w-8 md:h-8 text-ls-gold" />
              {strings.title}
            </h1>
            <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
          </div>

          <Button
            onClick={handleAddClick}
            className="w-full mb-6"
            style={{
              backgroundColor: CTA_COLOR,
              color: "#FFFFFF",
              fontWeight: 600,
              padding: "12px 16px",
              borderRadius: "8px"
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            {strings.addDeposit}
          </Button>

          {/* Upgrade Modal for Free Users */}
          <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
            <DialogContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <DialogHeader>
                <DialogTitle style={{ color: colors.textPrimary }}>{strings.upgradeRequired}</DialogTitle>
                <DialogDescription style={{ color: colors.textSecondary }}>
                  {strings.upgradeDepositBody}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1"
                >
                  {strings.maybeLater}
                </Button>
                <Button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    navigate(createPageUrl("Account") + "#plans");
                  }}
                  className="flex-1"
                  style={{
                    backgroundColor: CTA_COLOR,
                    color: "#FFFFFF"
                  }}
                >
                  {strings.viewPlans}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {showForm && (
            <Card
              className="mb-6 shadow-xl"
              style={{
                background: colors.cardBg,
                borderLeft: `4px solid ${CTA_COLOR}`
              }}
            >
              <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                <CardTitle style={{ color: colors.textPrimary }}>
                  {selectedDeposit ? strings.edit : strings.addDeposit}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deposit_amount" style={{ color: colors.textPrimary }}>{strings.depositAmount}</Label>
                      <Input
                        id="deposit_amount"
                        type="number"
                        required
                        value={formData.deposit_amount}
                        onChange={(e) => setFormData({...formData, deposit_amount: e.target.value})}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="property_address" style={{ color: colors.textPrimary }}>{strings.propertyAddress}</Label>
                      <Input
                        id="property_address"
                        type="text"
                        value={formData.property_address}
                        onChange={(e) => setFormData({...formData, property_address: e.target.value})}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deposit_paid_date" style={{ color: colors.textPrimary }}>{strings.paidDate}</Label>
                      <Input
                        id="deposit_paid_date"
                        type="date"
                        required
                        value={formData.deposit_paid_date}
                        onChange={(e) => setFormData({...formData, deposit_paid_date: e.target.value})}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expected_return_date" style={{ color: colors.textPrimary }}>{strings.expectedReturn}</Label>
                      <Input
                        id="expected_return_date"
                        type="date"
                        required
                        value={formData.expected_return_date}
                        onChange={(e) => setFormData({...formData, expected_return_date: e.target.value})}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes" style={{ color: colors.textPrimary }}>{strings.notes}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="mt-2"
                      rows={3}
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      disabled={createDepositMutation.isPending || updateDepositMutation.isPending}
                    >
                      {strings.cancel}
                    </Button>
                    <Button
                      type="submit"
                      className="ls-cta-primary"
                      disabled={createDepositMutation.isPending || updateDepositMutation.isPending}
                    >
                      {(createDepositMutation.isPending || updateDepositMutation.isPending) ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {strings.saving}
                        </>
                      ) : (
                        strings.save
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
            <DialogContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  {strings.openDisputeCase}
                </DialogTitle>
                <DialogDescription style={{ color: colors.textSecondary }}>
                  {strings.openDisputeCaseDesc}
                </DialogDescription>
              </DialogHeader>

              {selectedDeposit && (
                <div className="py-4 space-y-3">
                  <div className="p-4 rounded-lg border" style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    borderColor: colors.borderColor
                  }}>
                    <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                      {strings.depositDetails}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: colors.textSecondary }}>
                          {strings.amount}
                        </span>
                        <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                          £{selectedDeposit.deposit_amount.toLocaleString()}
                        </span>
                      </div>
                      {selectedDeposit.property_address && (
                        <div className="flex justify-between">
                          <span className="text-sm" style={{ color: colors.textSecondary }}>
                            {strings.address}
                          </span>
                          <span className="text-sm" style={{ color: colors.textPrimary }}>
                            {selectedDeposit.property_address}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border-2 border-blue-200" style={{
                    backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF'
                  }}>
                    <div className="flex items-start gap-3">
                      <Scale className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm mb-1" style={{ color: colors.textPrimary }}>
                          {strings.weAreHereToHelp}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {strings.openCaseToGet}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    haptic.light();
                    setShowDisputeDialog(false);
                  }}
                  style={{ borderColor: colors.borderColor }}
                >
                  {strings.cancel}
                </Button>
                <Button
                  onClick={handleOpenCase}
                  className="ls-cta-primary"
                >
                  <Scale className="w-4 h-4 mr-2" />
                  {strings.openCase}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {isLoading ? (
            <div className="text-center py-12" style={{ color: colors.textSecondary }}>
              <Loader2 className="w-8 h-8 mx-auto animate-spin mb-4" />
              Loading deposits...
            </div>
          ) : deposits.length === 0 ? (
            <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
              <CardContent className="p-12 text-center">
                <Wallet className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textSecondary, opacity: 0.3 }} />
                <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                  {strings.noDeposits}
                </h3>
                <p style={{ color: colors.textSecondary }}>{strings.noDepositsDesc}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {deposits.map((deposit) => {
                const daysRemaining = differenceInDays(new Date(deposit.expected_return_date), now);
                const isOverdue = daysRemaining < 0;

                return (
                  <Card
                    key={deposit.id}
                    className="shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{
                      background: colors.cardBg,
                      borderLeft: `4px solid ${CTA_COLOR}`
                    }}
                  >
                    <CardHeader className="pb-3 sm:pb-4" style={{
                      borderBottom: `1px solid ${colors.borderColor}`
                    }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIcon(deposit.status)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg sm:text-xl font-bold break-words text-ls-gold">
                              £{deposit.deposit_amount.toLocaleString()}
                            </CardTitle>
                            {deposit.property_address && (
                              <p className="text-xs sm:text-sm mt-1 break-words" style={{ color: colors.textSecondary }}>{deposit.property_address}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <select
                              value={deposit.status}
                              onChange={(e) => handleStatusChange(deposit.id, e.target.value)}
                              className={`${getStatusColor(deposit.status)} border text-xs font-semibold px-2 sm:px-3 py-1 rounded-full cursor-pointer`}
                              style={{ outline: 'none' }}
                            >
                              <option value="tracking">{strings.tracking.toUpperCase()}</option>
                              <option value="returned">{strings.returned.toUpperCase()}</option>
                              <option value="dispute">{strings.dispute.toUpperCase()}</option>
                            </select>
                            <button
                              onClick={() => handleEditClick(deposit)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              style={{ color: colors.textSecondary }}
                              title={strings.edit}
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(deposit.id)}
                              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                              style={{ color: '#EF4444' }}
                              title={strings.delete}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.paidOn}</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <p className="text-sm sm:text-base font-semibold" style={{ color: colors.textPrimary }}>
                              {format(new Date(deposit.deposit_paid_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.returnsOn}</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-ls-gold" />
                            <p className="text-sm sm:text-base font-semibold" style={{ color: colors.textPrimary }}>
                              {format(new Date(deposit.expected_return_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          {deposit.status === 'tracking' && (
                            <Badge className={`mt-2 text-xs ${
                              isOverdue ? 'bg-red-100 text-red-800 border-red-200' :
                              daysRemaining <= 30 ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              'bg-blue-100 text-blue-800 border-blue-200'
                            } border`}>
                              {isOverdue
                                ? `${Math.abs(daysRemaining)} ${strings.overdue}`
                                : `${daysRemaining} ${strings.daysUntilReturn}`
                              }
                            </Badge>
                          )}
                        </div>
                      </div>

                      {deposit.notes && (
                        <div>
                          <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>{strings.notes}</p>
                          <p className="text-xs sm:text-sm p-3 rounded-lg" style={{
                            backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                            color: colors.textPrimary
                          }}>
                            {deposit.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}

export default function DepositTracker() {
  return (
    <ToastProvider>
      <DepositTrackerContent />
    </ToastProvider>
  );
}
