import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Wallet, Plus, Calendar, Bell, AlertCircle, TrendingUp, X, Loader2, FileText } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ToastProvider, useToast } from "../components/shared/Toast";
import { FeatureGate } from "../components/shared/FeatureGate";
import SwipeToDelete from "../components/shared/SwipeToDelete";
import PullToRefresh from "../components/shared/PullToRefresh";
import { haptic } from "../components/shared/HapticFeedback";
import { getFeatureCardStyles } from "../components/shared/featureTheme";

function DepositTrackerContent() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState(null);
  const [formData, setFormData] = useState({
    deposit_amount: '',
    deposit_paid_date: '',
    expected_return_date: '',
    status: 'tracking',
    notes: '',
    property_address: '',
    rent_amount: '',
    rent_due_day: '',
    rent_alerts_enabled: false,
    rent_alert_days_before: 3
  });
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [selectedDepositForDispute, setSelectedDepositForDispute] = useState(null);

  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const userTier = user?.plan_tier || 'free';

  const depositsTheme = getFeatureCardStyles("deposits", isDarkMode);

  const handleRefresh = async () => {
    haptic.light();
    await queryClient.invalidateQueries({ queryKey: ['deposits'] });
    toast.success(language === 'th' ? 'รีเฟรชสำเร็จ' : 'Refreshed successfully');
  };

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    inputBg: '#353A3D',
    fieldBg: '#353A3D',
    hoverBg: '#3A3D40'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    inputBg: '#FFFFFF',
    fieldBg: '#ECEFED',
    hoverBg: '#F8FAFC'
  };

  const t = {
    en: {
      title: "Deposit Tracker",
      subtitle: "Track your security deposits and prevent unfair deductions",
      addDeposit: "Add Deposit",
      noDeposits: "No deposits tracked yet",
      getStarted: "Start tracking your deposits to protect your money",
      depositAmount: "Deposit Amount (฿)",
      paidDate: "Paid Date",
      expectedReturn: "Expected Return Date",
      status: "Status",
      tracking: "Tracking",
      returned: "Returned",
      dispute: "Dispute",
      propertyAddress: "Property Address",
      notes: "Notes",
      rentAmount: "Monthly Rent (฿)",
      rentDueDay: "Rent Due Day",
      rentAlerts: "Rent Payment Alerts",
      alertDaysBefore: "Days Before Due",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      openCase: "Open Case",
      daysUntilReturn: "days until return",
      daysOverdue: "days overdue",
      depositsTracked: "Deposits",
      saving: "Saving...",
      back: "Back",
      refreshed: "Refreshed successfully",
      depositSaved: "Deposit saved successfully",
      depositUpdated: "Deposit updated successfully",
      depositDeleted: "Deposit deleted successfully",
      deleteConfirm: "Are you sure you want to delete this deposit?"
    },
    th: {
      title: "ติดตามเงินมัดจำ",
      subtitle: "ติดตามเงินมัดจำของคุณและป้องกันการหักเงินที่ไม่ยุติธรรม",
      addDeposit: "เพิ่มเงินมัดจำ",
      noDeposits: "ยังไม่มีการติดตามเงินมัดจำ",
      getStarted: "เริ่มติดตามเงินมัดจำเพื่อปกป้องเงินของคุณ",
      depositAmount: "จำนวนเงินมัดจำ (฿)",
      paidDate: "วันที่จ่าย",
      expectedReturn: "วันที่คาดว่าจะคืน",
      status: "สถานะ",
      tracking: "กำลังติดตาม",
      returned: "คืนแล้ว",
      dispute: "โต้แย้ง",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      notes: "หมายเหตุ",
      rentAmount: "ค่าเช่ารายเดือน (฿)",
      rentDueDay: "วันครบกำหนดชำระค่าเช่า",
      rentAlerts: "แจ้งเตือนการชำระค่าเช่า",
      alertDaysBefore: "จำนวนวันก่อนครบกำหนด",
      save: "บันทึก",
      cancel: "ยกเลิก",
      edit: "แก้ไข",
      delete: "ลบ",
      openCase: "เปิดคดี",
      daysUntilReturn: "วันจนกว่าจะคืน",
      daysOverdue: "วันเกินกำหนด",
      depositsTracked: "เงินมัดจำ",
      saving: "กำลังบันทึก...",
      back: "กลับ",
      refreshed: "รีเฟรชสำเร็จ",
      depositSaved: "บันทึกเงินมัดจำสำเร็จ",
      depositUpdated: "อัปเดตสำเร็จ",
      depositDeleted: "ลบสำเร็จ",
      deleteConfirm: "คุณแน่ใจหรือไม่ว่าต้องการลบเงินมัดจำนี้?"
    }
  };

  const strings = t[language] || t.en;

  const createDepositMutation = useMutation({
    mutationFn: (data) => base44.entities.DepositTracker.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setShowForm(false);
      resetForm();
      toast.success(strings.depositSaved);
    },
    onError: (error) => {
      console.error('Failed to create deposit:', error);
      toast.error(language === 'th' ? 'บันทึกไม่สำเร็จ' : 'Save failed');
    }
  });

  const updateDepositMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DepositTracker.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setShowForm(false);
      setEditingDeposit(null);
      resetForm();
      toast.success(strings.depositUpdated);
    },
    onError: (error) => {
      console.error('Failed to update deposit:', error);
      toast.error(language === 'th' ? 'อัปเดตไม่สำเร็จ' : 'Update failed');
    }
  });

  const deleteDepositMutation = useMutation({
    mutationFn: (id) => base44.entities.DepositTracker.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      toast.success(strings.depositDeleted);
    },
    onError: (error) => {
      console.error('Failed to delete deposit:', error);
      toast.error(language === 'th' ? 'ลบไม่สำเร็จ' : 'Delete failed');
    }
  });

  const resetForm = () => {
    setFormData({
      deposit_amount: '',
      deposit_paid_date: '',
      expected_return_date: '',
      status: 'tracking',
      notes: '',
      property_address: '',
      rent_amount: '',
      rent_due_day: '',
      rent_alerts_enabled: false,
      rent_alert_days_before: 3
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    haptic.medium();

    const depositData = {
      ...formData,
      deposit_amount: parseFloat(formData.deposit_amount),
      rent_amount: formData.rent_amount ? parseFloat(formData.rent_amount) : null,
      rent_due_day: formData.rent_due_day ? parseInt(formData.rent_due_day, 10) : null,
      rent_alert_days_before: formData.rent_alert_days_before ? parseInt(formData.rent_alert_days_before, 10) : null
    };

    if (editingDeposit) {
      await updateDepositMutation.mutateAsync({ id: editingDeposit.id, data: depositData });
    } else {
      await createDepositMutation.mutateAsync(depositData);
    }
  };

  const handleEdit = (deposit) => {
    haptic.light();
    setEditingDeposit(deposit);
    setFormData({
      deposit_amount: deposit.deposit_amount?.toString() || '',
      deposit_paid_date: deposit.deposit_paid_date || '',
      expected_return_date: deposit.expected_return_date || '',
      status: deposit.status || 'tracking',
      notes: deposit.notes || '',
      property_address: deposit.property_address || '',
      rent_amount: deposit.rent_amount?.toString() || '',
      rent_due_day: deposit.rent_due_day?.toString() || '',
      rent_alerts_enabled: deposit.rent_alerts_enabled || false,
      rent_alert_days_before: deposit.rent_alert_days_before || 3
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    haptic.heavy();
    if (window.confirm(strings.deleteConfirm)) {
      deleteDepositMutation.mutate(id);
    }
  };

  const handleOpenDispute = (deposit) => {
    const params = new URLSearchParams({
      amount: deposit.deposit_amount.toString(),
      address: deposit.property_address || '',
      type: 'deposit'
    });
    navigate(createPageUrl("ResolveCase") + `?${params.toString()}`);
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
            <X className="w-4 h-4 mr-2" />
            {strings.back}
          </Button>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: depositsTheme.iconBg,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                <Wallet className="w-6 h-6" style={{ color: depositsTheme.iconColor }} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
              </div>
            </div>
            <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>

            <div className="mt-3">
              <span
                style={{
                  backgroundColor: depositsTheme.iconBg,
                  color: depositsTheme.iconColor,
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '4px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Wallet className="w-3 h-3" />
                {deposits.length} {strings.depositsTracked}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={() => {
                haptic.medium();
                setShowForm(!showForm);
                if (showForm) {
                  setEditingDeposit(null);
                  resetForm();
                }
              }}
              style={{
                padding: '12px 20px',
                borderRadius: '12px',
                backgroundColor: '#0C3B2E',
                color: '#FFFFFF',
                fontWeight: 'bold',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px rgba(12, 59, 46, 0.3)',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0a2f25';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0C3B2E';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              disabled={createDepositMutation.isPending || updateDepositMutation.isPending}
            >
              {showForm && editingDeposit ? <FileText className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {showForm && editingDeposit ? `${strings.edit} ${strings.addDeposit}` : strings.addDeposit}
            </button>
          </div>

          {showForm && (
            <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deposit_amount" style={{ color: colors.textPrimary }}>{strings.depositAmount}</Label>
                      <Input
                        id="deposit_amount"
                        type="number"
                        value={formData.deposit_amount}
                        onChange={(e) => setFormData({...formData, deposit_amount: e.target.value})}
                        required
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.borderColor,
                          color: colors.textPrimary
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="property_address" style={{ color: colors.textPrimary }}>{strings.propertyAddress}</Label>
                      <Input
                        id="property_address"
                        value={formData.property_address}
                        onChange={(e) => setFormData({...formData, property_address: e.target.value})}
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.borderColor,
                          color: colors.textPrimary
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="deposit_paid_date" style={{ color: colors.textPrimary }}>{strings.paidDate}</Label>
                      <Input
                        id="deposit_paid_date"
                        type="date"
                        value={formData.deposit_paid_date}
                        onChange={(e) => setFormData({...formData, deposit_paid_date: e.target.value})}
                        required
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.borderColor,
                          color: colors.textPrimary
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expected_return_date" style={{ color: colors.textPrimary }}>{strings.expectedReturn}</Label>
                      <Input
                        id="expected_return_date"
                        type="date"
                        value={formData.expected_return_date}
                        onChange={(e) => setFormData({...formData, expected_return_date: e.target.value})}
                        required
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.borderColor,
                          color: colors.textPrimary
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rent_amount" style={{ color: colors.textPrimary }}>{strings.rentAmount}</Label>
                      <Input
                        id="rent_amount"
                        type="number"
                        value={formData.rent_amount}
                        onChange={(e) => setFormData({...formData, rent_amount: e.target.value})}
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.borderColor,
                          color: colors.textPrimary
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rent_due_day" style={{ color: colors.textPrimary }}>{strings.rentDueDay}</Label>
                      <Input
                        id="rent_due_day"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.rent_due_day}
                        onChange={(e) => setFormData({...formData, rent_due_day: e.target.value})}
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.borderColor,
                          color: colors.textPrimary
                        }}
                      />
                    </div>
                  </div>

                  {(formData.rent_amount && formData.rent_due_day) && (
                    <FeatureGate
                      requiredTier="protect"
                      currentTier={userTier}
                      feature="rent_alerts"
                      language={language}
                    >
                      <div className="p-4 rounded-lg" style={{ backgroundColor: colors.fieldBg }}>
                        <div className="flex items-center justify-between mb-3">
                          <Label style={{ color: colors.textPrimary }}>{strings.rentAlerts}</Label>
                          <Switch
                            checked={formData.rent_alerts_enabled}
                            onCheckedChange={(checked) => setFormData({...formData, rent_alerts_enabled: checked})}
                          />
                        </div>
                        {formData.rent_alerts_enabled && (
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
                              style={{
                                backgroundColor: colors.inputBg,
                                borderColor: colors.borderColor,
                                color: colors.textPrimary
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </FeatureGate>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: '#0C3B2E',
                        color: '#FFFFFF',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0a2f25'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0C3B2E'}
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
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.light();
                        setShowForm(false);
                        setEditingDeposit(null);
                        resetForm();
                      }}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '8px',
                        backgroundColor: colors.cardBg,
                        color: colors.textPrimary,
                        fontWeight: 'bold',
                        border: `2px solid ${colors.borderColor}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverBg}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.cardBg}
                      disabled={createDepositMutation.isPending || updateDepositMutation.isPending}
                    >
                      {strings.cancel}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {deposits.length === 0 && !showForm ? (
            <Card className="border-none shadow-xl text-center p-12" style={{ backgroundColor: colors.cardBg }}>
              <Wallet className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textSecondary }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>{strings.noDeposits}</h3>
              <p style={{ color: colors.textSecondary }}>{strings.getStarted}</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {deposits.map((deposit) => {
                const daysRemaining = differenceInDays(new Date(deposit.expected_return_date), now);
                const isOverdue = daysRemaining < 0;
                const isUrgent = daysRemaining >= 0 && daysRemaining <= 30;

                return (
                  <SwipeToDelete
                    key={deposit.id}
                    onDelete={() => handleDelete(deposit.id)}
                    deleteLabel={strings.delete}
                    colors={colors}
                  >
                    <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
                      <CardContent className="p-4 md:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Wallet className="w-5 h-5" style={{ color: depositsTheme.iconBg }} />
                              <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>
                                ฿{deposit.deposit_amount.toLocaleString()}
                              </h3>
                            </div>
                            {deposit.property_address && (
                              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                                {deposit.property_address}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              <span style={{ color: colors.textSecondary }}>
                                {isOverdue ? `${Math.abs(daysRemaining)} ${strings.daysOverdue}` : `${daysRemaining} ${strings.daysUntilReturn}`}
                              </span>
                              {(isOverdue || isUrgent) && (
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleEdit(deposit)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                backgroundColor: colors.fieldBg,
                                color: colors.textPrimary,
                                border: `2px solid ${colors.borderColor}`,
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverBg}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.fieldBg}
                            >
                              {strings.edit}
                            </button>
                            {(isOverdue || isUrgent) && (
                              <button
                                onClick={() => handleOpenDispute(deposit)}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  backgroundColor: '#DC2626',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  fontWeight: '600',
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease-in-out'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                              >
                                {strings.openCase}
                              </button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </SwipeToDelete>
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