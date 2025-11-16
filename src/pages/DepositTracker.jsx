import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet, Plus, Calendar, AlertTriangle, CheckCircle2, Clock, Shield, Bell, Loader2, Trash2, ArrowLeft, AlertCircle, Scale } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useFeatureAccess } from "../components/shared/FeatureGate";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { haptic } from "../components/shared/HapticFeedback";
import PullToRefresh from "../components/shared/PullToRefresh";
import { ToastProvider, useToast } from "../components/shared/Toast";
import DebouncedSearch from "../components/shared/DebouncedSearch";
import { getFeatureCardStyles } from "../components/shared/featureTheme";

// A simple SkeletonLoader component to satisfy the outline's requirement
function SkeletonLoader({ variant, count, colors }) {
  const CardSkeleton = () => (
    <div className="rounded-lg p-4 animate-pulse" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor, borderLeft: `4px solid ${colors.borderColor}` }}>
      <div className="h-6 w-3/4 rounded mb-4" style={{ backgroundColor: colors.textSecondary, opacity: 0.2 }}></div>
      <div className="h-4 w-1/2 rounded mb-2" style={{ backgroundColor: colors.textSecondary, opacity: 0.15 }}></div>
      <div className="h-4 w-5/6 rounded" style={{ backgroundColor: colors.textSecondary, opacity: 0.15 }}></div>
    </div>
  );

  if (variant === "card") {
    return (
      <div className="grid gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  }
  return null;
}

function DepositTrackerContent() {
  const navigate = useNavigate();
  const toast = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedDeposit, setExpandedDeposit] = useState(null);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [formData, setFormData] = useState({
    deposit_amount: '',
    deposit_paid_date: '',
    expected_return_date: '',
    property_address: '',
    rent_amount: '',
    rent_due_day: '',
    rent_alerts_enabled: false,
    rent_alert_days_before: 3,
    notes: ''
  });

  const queryClient = useQueryClient();
  const { hasAccess: hasDepositShield } = useFeatureAccess('deposit_shield');
  const { hasAccess: hasRentAlerts } = useFeatureAccess('rent_alerts_auto');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const isFreeTier = !user?.plan_tier || user.plan_tier === 'free';

  const theme = getFeatureCardStyles("deposits", isDarkMode);

  const { data: deposits = [], isLoading } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const createDepositMutation = useMutation({
    mutationFn: (data) => base44.entities.DepositTracker.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setShowAddForm(false);
      setFormData({
        deposit_amount: '',
        deposit_paid_date: '',
        expected_return_date: '',
        property_address: '',
        rent_amount: '',
        rent_due_day: '',
        rent_alerts_enabled: false,
        rent_alert_days_before: 3,
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
      toast.success(language === 'th' ? 'อัปเดตสำเร็จ' : 'Updated successfully');
    },
  });

  const deleteDepositMutation = useMutation({
    mutationFn: (id) => base44.entities.DepositTracker.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      toast.success(language === 'th' ? 'ลบสำเร็จ' : 'Deleted successfully');
    },
  });

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    inputBg: '#353A3D',
    urgentBg: '#3A2626',
    alertBg: '#3A2D1C'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    inputBg: '#FFFFFF',
    urgentBg: '#FEE2E2',
    alertBg: '#FFF7ED'
  };

  const t = {
    en: {
      depositTracker: "Deposit Tracker",
      trackDeposits: "Track your security deposits and rent payments",
      addDeposit: "Add Deposit",
      depositAmount: "Deposit Amount (฿)",
      paidDate: "Paid Date",
      expectedReturn: "Expected Return Date",
      propertyAddress: "Property Address",
      rentAmount: "Monthly Rent (฿)",
      rentDueDay: "Day of Month Rent is Due",
      rentDueDayPlaceholder: "e.g., 1, 5, 15, 30",
      rentDueDayHelper: "Enter the day of the month (1-31)",
      rentAlerts: "Rent Alerts",
      alertDaysBefore: "Alert Me (Days Before)",
      notes: "Notes",
      status: "Status",
      tracking: "Tracking",
      returned: "Returned",
      dispute: "Dispute",
      save: "Save",
      cancel: "Cancel",
      noDeposits: "No Deposits Tracked",
      noDepositsDesc: "Start tracking your security deposits to stay protected",
      daysRemaining: "days remaining",
      overdue: "OVERDUE",
      paidOn: "Paid on",
      returnsOn: "Returns on",
      rentDue: "Rent Due",
      dayOfMonth: "of every month",
      alertEnabled: "Alert enabled",
      daysBeforeDue: "days before due",
      protectedBadge: "Protected",
      delete: "Delete",
      confirmDelete: "Are you sure you want to delete this deposit?",
      saving: "Saving...",
      back: "Back",
      openDisputeCase: "Open Dispute Case",
      openDisputeCaseDesc: "When you mark a deposit as disputed, you should open a formal case to get help resolving it.",
      depositDetails: "Deposit Details",
      amount: "Amount:",
      address: "Address:",
      weAreHereToHelp: "We're here to help",
      openCaseToGet: "Open a case to get: Expert review, letter templates, and negotiation support",
      openCase: "Open Case",
      refreshed: "Refreshed successfully",
      searchDeposits: "Search by property address...",
      noResultsFound: "No deposits found",
      tryDifferentSearch: "Try a different search term",
      upgradeModalTitle: "Upgrade to Manage Deposits",
      upgradeModalDesc: "Deposit Tracker is available on paid plans. Upgrade to unlock secure deposit logging and tracking.",
      viewPlans: "View Plans",
    },
    th: {
      depositTracker: "ติดตามเงินมัดจำ",
      trackDeposits: "ติดตามเงินมัดจำและการชำระค่าเช่าของคุณ",
      addDeposit: "เพิ่มเงินมัดจำ",
      depositAmount: "จำนวนเงินมัดจำ (฿)",
      paidDate: "วันที่จ่าย",
      expectedReturn: "วันที่คาดว่าจะได้รับคืน",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      rentAmount: "ค่าเช่ารายเดือน (฿)",
      rentDueDay: "วันที่ของเดือนที่ต้องจ่ายค่าเช่า",
      rentDueDayPlaceholder: "เช่น 1, 5, 15, 30",
      rentDueDayHelper: "ใส่วันที่ของเดือน (1-31)",
      rentAlerts: "การแจ้งเตือนค่าเช่า",
      alertDaysBefore: "แจ้งเตือนก่อน (วัน)",
      notes: "หมายเหตุ",
      status: "สถานะ",
      tracking: "กำลังติดตาม",
      returned: "คืนแล้ว",
      dispute: "มีข้อพิพาท",
      save: "บันทึก",
      cancel: "ยกเลิก",
      noDeposits: "ไม่มีเงินมัดจำที่ติดตาม",
      noDepositsDesc: "เริ่มติดตามเงินมัดจำของคุณเพื่อรักษาความปลอดภัย",
      daysRemaining: "วันคงเหลือ",
      overdue: "เกินกำหนด",
      paidOn: "จ่ายเมื่อ",
      returnsOn: "คืนเมื่อ",
      rentDue: "ค่าเช่าครบกำหนด",
      dayOfMonth: "ของทุกเดือน",
      alertEnabled: "การแจ้งเตือนเปิดอยู่",
      daysBeforeDue: "วันก่อนครบกำหนด",
      protectedBadge: "ได้รับการป้องกัน",
      delete: "ลบ",
      confirmDelete: "คุณแน่ใจหรือไม่ว่าต้องการลบเงินมัดจำนี้?",
      saving: "กำลังบันทึก...",
      back: "กลับ",
      openDisputeCase: "เปิดคดีพิพาท",
      openDisputeCaseDesc: "เมื่อคุณทำเครื่องหมายเงินมัดจำว่าเป็นข้อพิพาท คุณควรเปิดคดีอย่างเป็นทางการเพื่อรับความช่วยเหลือในการแก้ปัญหา",
      depositDetails: "รายละเอียดเงินมัดจำ",
      amount: "จำนวนเงิน:",
      address: "ที่อยู่:",
      weAreHereToHelp: "เราพร้อมช่วยคุณ",
      openCaseToGet: "เปิดคดีเพื่อรับ: การตรวจสอบโดยผู้เชี่ยวชาญ, เทมเพลตจดหมาย และการสนับสนุนการเจรจา",
      openCase: "เปิดคดี",
      refreshed: "รีเฟรชสำเร็จ",
      searchDeposits: "ค้นหาด้วยที่อยู่ทรัพย์สิน...",
      noResultsFound: "ไม่พบเงินมัดจำ",
      tryDifferentSearch: "ลองค้นหาด้วยคำอื่น",
      upgradeModalTitle: "อัปเกรดเพื่อจัดการเงินมัดจำ",
      upgradeModalDesc: "ระบบติดตามเงินมัดจำใช้ได้กับแผนที่ชำระเงิน อัปเกรดเพื่อปลดล็อกการบันทึกและติดตามเงินมัดจำอย่างปลอดภัย",
      viewPlans: "ดูแผน",
    }
  };

  const strings = (t && t[language] && typeof t[language] === 'object') ? t[language] : t.en;

  const handleRefresh = async () => {
    haptic.light();
    await queryClient.invalidateQueries({ queryKey: ['deposits'] });
  };

  const filteredDeposits = deposits.filter(deposit => {
    if (searchQuery === '') return true;
    return deposit.property_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           deposit.notes?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddDepositClick = () => {
    if (!user || !user.plan_tier || user.plan_tier === 'free') {
      setShowUpgradeModal(true);
      return;
    }
    haptic.light();
    setShowAddForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const depositData = {
      deposit_amount: parseFloat(formData.deposit_amount),
      deposit_paid_date: formData.deposit_paid_date,
      expected_return_date: formData.expected_return_date,
      status: 'tracking',
    };

    if (formData.property_address) {
      depositData.property_address = formData.property_address;
    }
    if (formData.notes) {
      depositData.notes = formData.notes;
    }

    if (hasRentAlerts && formData.rent_amount) {
      depositData.rent_amount = parseFloat(formData.rent_amount);
      if (formData.rent_due_day) {
        depositData.rent_due_day = parseInt(formData.rent_due_day, 10);
      }
      depositData.rent_alerts_enabled = formData.rent_alerts_enabled;
      if (formData.rent_alert_days_before) {
        depositData.rent_alert_days_before = parseInt(formData.rent_alert_days_before, 10);
      }
    }

    try {
      await createDepositMutation.mutateAsync(depositData);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleDelete = (depositId) => {
    if (window.confirm(strings.confirmDelete)) {
      haptic.heavy();
      deleteDepositMutation.mutate(depositId);
    }
  };

  const handleStatusChange = (depositId, newStatus) => {
    if (newStatus === 'dispute') {
      const deposit = deposits.find(d => d.id === depositId);
      setSelectedDispute(deposit);
      setDisputeDialogOpen(true);
    } else {
      haptic.medium();
      updateDepositMutation.mutate({
        id: depositId,
        data: { status: newStatus }
      });
    }
  };

  const handleOpenCase = () => {
    if (!selectedDispute) return;
    
    updateDepositMutation.mutate({
      id: selectedDispute.id,
      data: { status: 'dispute' }
    });
    
    const params = new URLSearchParams({
      amount: selectedDispute.deposit_amount.toString(),
      address: selectedDispute.property_address || '',
      type: 'deposit'
    });
    
    navigate(createPageUrl("ResolveCase") + `?${params.toString()}`);
    setDisputeDialogOpen(false);
  };

  const handleCancelDispute = () => {
    setDisputeDialogOpen(false);
    setSelectedDispute(null);
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
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'returned':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'dispute':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Wallet className="w-5 h-5 text-slate-600" />;
    }
  };

  const now = new Date();

  return (
    <PullToRefresh onRefresh={handleRefresh} colors={colors}>
      <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-6xl mx-auto">
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

          {/* NEW: Upgrade Modal */}
          <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
            <DialogContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <DialogHeader>
                <DialogTitle style={{ color: colors.textPrimary }}>{strings.upgradeModalTitle}</DialogTitle>
                <DialogDescription style={{ color: colors.textSecondary }}>
                  {strings.upgradeModalDesc}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
                  {strings.cancel}
                </Button>
                <Button
                  onClick={() => {
                    haptic.medium();
                    navigate(createPageUrl("Account") + '#plans');
                  }}
                  style={{
                    backgroundColor: '#0C3B2E',
                    color: '#FFFFFF'
                  }}
                >
                  {strings.viewPlans}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
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

              {selectedDispute && (
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
                        <span className="text-sm font-bold" style={{ color: theme.metricColor }}>
                          ฿{selectedDispute.deposit_amount.toLocaleString()}
                        </span>
                      </div>
                      {selectedDispute.property_address && (
                        <div className="flex justify-between">
                          <span className="text-sm" style={{ color: colors.textSecondary }}>
                            {strings.address}
                          </span>
                          <span className="text-sm" style={{ color: colors.textPrimary }}>
                            {selectedDispute.property_address}
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
                  onClick={handleCancelDispute}
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

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2" style={{ color: theme.titleColor }}>
                <Wallet className="w-7 h-7 md:w-8 md:h-8" style={{ color: theme.iconColor }} />
                {strings.depositTracker}
              </h1>
              <p className="text-sm md:text-base" style={{ color: colors.textSecondary }}>
                {strings.trackDeposits}
              </p>
            </div>
            {deposits.length > 0 && (
              <Button
                onClick={handleAddDepositClick}
                className="ls-cta-primary w-full sm:w-auto"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                {strings.addDeposit}
              </Button>
            )}
          </div>

          {deposits.length > 1 && (
            <div className="mb-4">
              <DebouncedSearch
                onSearch={setSearchQuery}
                placeholder={strings.searchDeposits}
                colors={colors}
                language={language}
              />
            </div>
          )}

          {showAddForm && (
            <Card 
              className="mb-6 shadow-xl" 
              style={{ 
                background: theme.cardBg,
                borderLeft: `4px solid ${theme.borderColor}`
              }}
            >
              <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                <CardTitle style={{ color: theme.titleColor }}>{strings.addDeposit}</CardTitle>
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

                  {hasRentAlerts && (
                    <div className="p-4 rounded-lg border" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC', borderColor: colors.borderColor }}>
                      <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                        <Bell className="w-5 h-5 text-blue-600" />
                        {strings.rentAlerts}
                      </h3>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="rent_amount" style={{ color: colors.textPrimary }}>{strings.rentAmount}</Label>
                          <Input
                            id="rent_amount"
                            type="number"
                            value={formData.rent_amount}
                            onChange={(e) => setFormData({...formData, rent_amount: e.target.value})}
                            className="mt-2"
                            style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="rent_due_day" style={{ color: colors.textPrimary }}>
                            {strings.rentDueDay}
                          </Label>
                          <Input
                            id="rent_due_day"
                            type="number"
                            min="1"
                            max="31"
                            placeholder={strings.rentDueDayPlaceholder}
                            value={formData.rent_due_day}
                            onChange={(e) => setFormData({...formData, rent_due_day: e.target.value})}
                            className="mt-2"
                            style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                          />
                          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                            {strings.rentDueDayHelper}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="rent_alert_days_before" style={{ color: colors.textPrimary }}>{strings.alertDaysBefore}</Label>
                          <Input
                            id="rent_alert_days_before"
                            type="number"
                            min="1"
                            max="14"
                            value={formData.rent_alert_days_before}
                            onChange={(e) => setFormData({...formData, rent_alert_days_before: e.target.value})}
                            className="mt-2"
                            style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <Checkbox
                          id="rent_alerts_enabled"
                          checked={formData.rent_alerts_enabled}
                          onCheckedChange={(checked) => setFormData({...formData, rent_alerts_enabled: checked})}
                        />
                        <Label htmlFor="rent_alerts_enabled" className="cursor-pointer" style={{ color: colors.textPrimary }}>
                          {strings.alertEnabled}
                        </Label>
                      </div>
                    </div>
                  )}

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
                      onClick={() => setShowAddForm(false)}
                      disabled={createDepositMutation.isPending}
                    >
                      {strings.cancel}
                    </Button>
                    <Button
                      type="submit"
                      className="ls-cta-primary"
                      disabled={createDepositMutation.isPending}
                    >
                      {createDepositMutation.isPending ? (
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

          {isLoading ? (
            <SkeletonLoader variant="card" count={4} colors={colors} />
          ) : filteredDeposits.length === 0 ? (
            <div className="max-w-2xl mx-auto">
              <div className="text-center py-12 px-6 rounded-2xl" style={{ backgroundColor: colors.cardBg, border: `2px solid ${colors.borderColor}` }}>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0C3B2E20' }}>
                  <Wallet className="w-8 h-8" style={{ color: '#0C3B2E' }} />
                </div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: colors.textPrimary }}>
                  No deposits tracked yet
                </h2>
                <p className="text-base mb-6" style={{ color: colors.textSecondary }}>
                  Track your deposits so you have a clear, time-stamped record if anything goes wrong at move-out.
                </p>
                
                <button
                  onClick={() => {
                    haptic.medium();
                    setShowAddForm(true); // Changed from setShowAddDeposit to setShowAddForm
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#0C3B2E',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 8px rgba(12,59,46,0.3)',
                    transition: 'all 0.2s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#C7A338';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#0C3B2E';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <Plus className="w-5 h-5" />
                  Add first deposit
                </button>

                {isFreeTier && (
                  <div className="mt-6 pt-6 border-t" style={{ borderColor: colors.borderColor }}>
                    <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                      Need full deposit protection and export tools? Upgrade to Lite, Protect or Secure. Annual plans offer the best value.
                    </p>
                    <button
                      onClick={() => navigate(createPageUrl("Account") + '#plans')} // Changed to #plans for consistency
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        color: '#0C3B2E',
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: '500',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.textDecoration = 'none';
                      }}
                    >
                      View plans
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredDeposits.map((deposit) => {
                const daysRemaining = differenceInDays(new Date(deposit.expected_return_date), now);
                const isUrgent = daysRemaining <= 30 && daysRemaining > 0;
                const isOverdue = daysRemaining < 0;

                return (
                  <Card 
                    key={deposit.id} 
                    className="shadow-lg hover:shadow-xl transition-all duration-300" 
                    style={{
                      background: theme.cardBg,
                      borderLeft: `4px solid ${theme.borderColor}`,
                      border: isUrgent ? `2px solid ${theme.borderColor}` : 'none'
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
                            <CardTitle className="text-lg sm:text-xl font-bold break-words" style={{ color: theme.metricColor }}>
                              ฿{deposit.deposit_amount.toLocaleString()}
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
                              onClick={() => handleDelete(deposit.id)}
                              className="p-1.5 rounded-lg hover:bg-red-100 transition-colors"
                              style={{ color: '#EF4444' }}
                              title={strings.delete}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {hasDepositShield && deposit.status === 'tracking' && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs whitespace-nowrap">
                              <Shield className="w-3 h-3 mr-1" />
                              {strings.protectedBadge}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.paidOn}</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <p className="text-sm sm:text-base font-semibold" style={{ color: theme.metricColor }}>
                              {format(new Date(deposit.deposit_paid_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.returnsOn}</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" style={{ color: theme.iconColor }} />
                            <p className="text-sm sm:text-base font-semibold" style={{ color: theme.metricColor }}>
                              {format(new Date(deposit.expected_return_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          {deposit.status === 'tracking' && (
                            <Badge className={`mt-2 text-xs ${
                              isOverdue ? 'bg-red-100 text-red-800 border-red-200' :
                              isUrgent ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              'bg-blue-100 text-blue-800 border-blue-200'
                            } border`}>
                              {isOverdue
                                ? `${strings.overdue} ${Math.abs(daysRemaining)} days`
                                : `${daysRemaining} ${strings.daysRemaining}`
                              }
                            </Badge>
                          )}
                        </div>
                      </div>

                      {hasRentAlerts && deposit.rent_amount && deposit.rent_due_day && (
                        <div className="p-3 sm:p-4 rounded-lg border" style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                          borderColor: colors.borderColor
                        }}>
                          <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Bell className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                                  {strings.rentDue}: {language === 'th' ? 'วันที่ ' : 'Day '}{deposit.rent_due_day} {strings.dayOfMonth}
                                </p>
                                <p className="text-xs sm:text-sm" style={{ color: colors.textSecondary }}>
                                  ฿{deposit.rent_amount.toLocaleString()}/month
                                </p>
                                {deposit.rent_alerts_enabled && (
                                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs mt-1">
                                    {strings.alertEnabled} ({deposit.rent_alert_days_before} {strings.daysBeforeDue})
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

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