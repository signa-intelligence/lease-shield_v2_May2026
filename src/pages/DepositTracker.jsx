
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Wallet, Plus, Calendar, AlertTriangle, CheckCircle2, Clock, Shield, Bell, Loader2 } from "lucide-react"; // Added Loader2
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, addMonths, startOfMonth } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FeatureGate, useFeatureAccess } from "../components/shared/FeatureGate";

export default function DepositTracker() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    deposit_amount: '',
    deposit_paid_date: '',
    expected_return_date: '',
    property_address: '',
    notes: '',
    rent_amount: '',
    rent_due_day: '', // Changed from '1'
    rent_alerts_enabled: false,
    rent_alert_days_before: 3 // Changed from '3'
  });
  const [formErrors, setFormErrors] = useState({}); // Added
  const [submitting, setSubmitting] = useState(false); // Added
  
  const queryClient = useQueryClient();
  const { hasAccess: hasDepositShield } = useFeatureAccess('deposit_shield');
  const { hasAccess: hasLineNotify } = useFeatureAccess('line_notify_enabled');
  const { hasAccess: hasRentAlertsAuto } = useFeatureAccess('rent_alerts_auto'); // Added for FeatureGate

  const t = {
    en: {
      title: "Deposit Protection File",
      subtitle: "Secure storage for your lease, receipts, and deposit proof",
      dialogTitle: "Track New Deposit", // Updated
      depositAmount: "Deposit Amount (฿)", // New
      depositPaidDate: "Date Paid", // New
      expectedReturnDate: "Expected Return Date", // New
      propertyAddress: "Property Address", // New
      notes: "Notes", // New
      rentAmountLabel: "Monthly Rent (฿)",
      rentDueDayLabel: "Rent Due Day of Month (1-31)",
      rentAlertsLabel: "Enable Rent Alerts",
      alertDaysLabel: "Alert Days Before",
      trackDepositButton: "Track Deposit",
      depositShieldTitle: "Deposit Shield Active",
      depositShieldSubtitle: "Your deposits are protected with automatic reminders and dispute assistance",
      rentAlertsTitle: "Rent Alerts",
      rentAlertsSubtitle: "Automated reminders for rent payments and renewals",
      lineNotifyButton: "LINE Notify",
      noDepositsTitle: "No Deposits Tracked",
      noDepositsSubtitle: "Start tracking your security deposits to get return reminders",
      addFirstDepositButton: "Add Your First Deposit",
      paidDate: "Paid Date",
      expectedReturn: "Expected Return",
      daysRemaining: "Days Remaining",
      protectedBadge: "Protected",
      reminderLineEmail: (daysRemaining) => {
        if (daysRemaining <= 30) return '30-day reminder will be sent via LINE & Email';
        if (daysRemaining <= 7) return '7-day reminder will be sent via LINE & Email';
        return 'Automated reminder will be sent via LINE & Email';
      },
      markReturnedButton: "Mark Returned",
      openDisputeButton: "Open Dispute",
      nextRentDue: "Next Rent Due",
      rentReminder: "Rent reminder",
      daysBefore: "days before",
      // New validation strings
      addDepositTitle: "Track New Deposit",
      monthlyRent: "Monthly Rent (฿)",
      rentDueDay: "Rent Due Day",
      additionalNotes: "Additional notes...",
      saving: "Saving...",
      'Please enter deposit amount': 'Please enter deposit amount',
      'Please enter deposit paid date': 'Please enter deposit paid date',
      'Please enter expected return date': 'Please enter expected return date',
      'Return date must be after paid date': 'Return date must be after paid date',
      'Return date is too far in the future': 'Return date is too far in the future (max 5 years)',
      'Please enter monthly rent': 'Please enter monthly rent',
      'Please enter due day (1-31)': 'Please enter due day (1-31)',
      'Failed to create deposit. Please try again.': 'Failed to create deposit. Please try again.',
    },
    th: {
      title: "ไฟล์ป้องกันเงินมัดจำ",
      subtitle: "จัดเก็บสัญญาเช่า ใบเสร็จ และหลักฐานเงินมัดจำอย่างปลอดภัย",
      dialogTitle: "ติดตามเงินมัดจำใหม่", // Updated
      depositAmount: "จำนวนเงินมัดจำ (฿)", // New
      depositPaidDate: "วันที่จ่าย", // New
      expectedReturnDate: "วันที่คาดว่าจะได้รับคืน", // New
      propertyAddress: "ที่อยู่ทรัพย์สิน", // New
      notes: "หมายเหตุ", // New
      rentAmountLabel: "ค่าเช่ารายเดือน (฿)",
      rentDueDayLabel: "วันครบกำหนดค่าเช่าในเดือน (1-31)",
      rentAlertsLabel: "เปิดการแจ้งเตือนค่าเช่า",
      alertDaysLabel: "แจ้งเตือนก่อนกี่วัน",
      trackDepositButton: "ติดตามเงินมัดจำ",
      depositShieldTitle: "ระบบป้องกันเงินมัดจำทำงานอยู่",
      depositShieldSubtitle: "เงินมัดจำของคุณได้รับการคุ้มครองด้วยการแจ้งเตือนอัตโนมัติและความช่วยเหลือในการข้อพิพาท",
      rentAlertsTitle: "การแจ้งเตือนค่าเช่า",
      rentAlertsSubtitle: "แจ้งเตือนอัตโนมัติสำหรับการชำระค่าเช่าและการต่ออายุ",
      lineNotifyButton: "แจ้งเตือน LINE",
      noDepositsTitle: "ยังไม่มีเงินมัดจำที่ติดตาม",
      noDepositsSubtitle: "เริ่มติดตามเงินประกันของคุณเพื่อรับการแจ้งเตือนการคืนเงิน",
      addFirstDepositButton: "เพิ่มเงินมัดจำแรกของคุณ",
      paidDate: "วันที่จ่าย",
      expectedReturn: "คาดว่าจะได้รับคืน",
      daysRemaining: "วันคงเหลือ",
      protectedBadge: "คุ้มครอง",
      reminderLineEmail: (daysRemaining) => {
        if (daysRemaining <= 30) return 'จะมีการแจ้งเตือน 30 วันผ่าน LINE และอีเมล';
        if (daysRemaining <= 7) return 'จะมีการแจ้งเตือน 7 วันผ่าน LINE และอีเมล';
        return 'จะมีการแจ้งเตือนอัตโนมัติผ่าน LINE และอีเมล';
      },
      markReturnedButton: "ทำเครื่องหมายว่าคืนแล้ว",
      openDisputeButton: "เปิดข้อพิพาท",
      nextRentDue: "ครบกำหนดค่าเช่าครั้งถัดไป",
      rentReminder: "แจ้งเตือนค่าเช่า",
      daysBefore: "วันก่อน",
      // New validation strings
      addDepositTitle: "ติดตามเงินมัดจำใหม่",
      monthlyRent: "ค่าเช่ารายเดือน (฿)",
      rentDueDay: "วันครบกำหนดค่าเช่า",
      additionalNotes: "หมายเหตุเพิ่มเติม...",
      saving: "กำลังบันทึก...",
      'กรุณาระบุจำนวนเงินมัดจำ': 'กรุณาระบุจำนวนเงินมัดจำ',
      'กรุณาระบุวันที่จ่ายเงินมัดจำ': 'กรุณาระบุวันที่จ่ายเงินมัดจำ',
      'กรุณาระบุวันที่คาดว่าจะได้รับเงินคืน': 'กรุณาระบุวันที่คาดว่าจะได้รับเงินคืน',
      'วันที่คาดว่าจะได้รับเงินคืนต้องอยู่หลังวันที่จ่ายเงินมัดจำ': 'วันที่คาดว่าจะได้รับเงินคืนต้องอยู่หลังวันที่จ่ายเงินมัดจำ',
      'วันที่คาดว่าจะได้รับเงินคืนไกลเกินไป': 'วันที่คาดว่าจะได้รับเงินคืนไกลเกินไป (สูงสุด 5 ปี)',
      'กรุณาระบุค่าเช่ารายเดือน': 'กรุณาระบุค่าเช่ารายเดือน',
      'กรุณาระบุวันครบกำหนดชำระ (1-31)': 'กรุณาระบุวันครบกำหนดชำระ (1-31)',
      'ไม่สามารถสร้างรายการได้ กรุณาลองอีกครั้ง': 'ไม่สามารถสร้างรายการได้ กรุณาลองอีกครั้ง',
    }
  };

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const createDepositMutation = useMutation({
    mutationFn: (data) => base44.entities.DepositTracker.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setShowAddDialog(false);
      setFormData({
        deposit_amount: '',
        deposit_paid_date: '',
        expected_return_date: '',
        property_address: '',
        notes: '',
        rent_amount: '',
        rent_due_day: '',
        rent_alerts_enabled: false,
        rent_alert_days_before: 3
      });
      setFormErrors({});
      setSubmitting(false);
    },
    onError: (error) => {
      console.error('Failed to create deposit:', error);
      setFormErrors({ 
        submit: strings['Failed to create deposit. Please try again.']
      });
      setSubmitting(false);
    }
  });

  const updateDepositMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DepositTracker.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
    },
  });

  const language = user?.language || 'en';
  const strings = t[language];

  const validateForm = () => {
    const errors = {};
    
    if (!formData.deposit_amount || parseFloat(formData.deposit_amount) <= 0) {
      errors.deposit_amount = strings['Please enter deposit amount'];
    }
    
    if (!formData.deposit_paid_date) {
      errors.deposit_paid_date = strings['Please enter deposit paid date'];
    }
    
    if (!formData.expected_return_date) {
      errors.expected_return_date = strings['Please enter expected return date'];
    }
    
    // Validate dates
    if (formData.deposit_paid_date && formData.expected_return_date) {
      const paidDate = new Date(formData.deposit_paid_date);
      const returnDate = new Date(formData.expected_return_date);
      
      if (returnDate <= paidDate) {
        errors.expected_return_date = strings['Return date must be after paid date'];
      }
      
      // Check if return date is too far in the future (more than 5 years)
      const fiveYearsFromNow = new Date();
      fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
      if (returnDate > fiveYearsFromNow) {
        errors.expected_return_date = strings['Return date is too far in the future'];
      }
    }
    
    if (formData.rent_alerts_enabled) {
      if (!formData.rent_amount || parseFloat(formData.rent_amount) <= 0) {
        errors.rent_amount = strings['Please enter monthly rent'];
      }
      
      const rentDueDay = parseInt(formData.rent_due_day);
      if (!formData.rent_due_day || isNaN(rentDueDay) || rentDueDay < 1 || rentDueDay > 31) {
        errors.rent_due_day = strings['Please enter due day (1-31)'];
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      await createDepositMutation.mutateAsync({
        deposit_amount: parseFloat(formData.deposit_amount),
        deposit_paid_date: formData.deposit_paid_date,
        expected_return_date: formData.expected_return_date,
        property_address: formData.property_address || undefined,
        notes: formData.notes || undefined,
        rent_amount: formData.rent_alerts_enabled && formData.rent_amount ? parseFloat(formData.rent_amount) : undefined,
        rent_due_day: formData.rent_alerts_enabled && formData.rent_due_day ? parseInt(formData.rent_due_day) : undefined,
        rent_alerts_enabled: formData.rent_alerts_enabled,
        rent_alert_days_before: formData.rent_alerts_enabled ? parseInt(formData.rent_alert_days_before) : 3,
        status: 'tracking'
      });
      
      // State reset handled by onSuccess of mutation
    } catch (error) {
      // Error handled by onError of mutation
    } finally {
      // Submitting state reset handled by onError/onSuccess of mutation
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      tracking: "bg-blue-100 text-blue-800 border-blue-200",
      returned: "bg-emerald-100 text-emerald-800 border-emerald-200",
      dispute: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  const getStatusIcon = (status) => {
    const icons = {
      tracking: Clock,
      returned: CheckCircle2,
      dispute: AlertTriangle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-5 h-5" />;
  };

  const getDaysRemaining = (date) => {
    return differenceInDays(new Date(date), new Date());
  };

  const getNextRentDueDate = (rentDueDay) => {
    const today = new Date();
    const currentMonth = startOfMonth(today);
    const thisMonthDue = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), rentDueDay);
    
    if (thisMonthDue < today) {
      return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, rentDueDay);
    }
    return thisMonthDue;
  };

  const isDarkMode = user?.theme === 'dark';
  const now = new Date();

  // Dark mode colors
  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    inputBg: '#353A3D',
    infoBg: '#353A3D',
    accentBg: '#EFF6FF', // Default light mode accent (blue-50)
    blueText: '#93C5FD', 
    blueBg: '#1E3A8A', // Changed
    blueBorder: '#3B82F6', 
    greenText: '#6EE7B7', 
    goldText: '#FBBF24', 
    grayText: '#A8ABAD', 
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    inputBg: '#FFFFFF',
    infoBg: '#F0F9FF', // Changed
    accentBg: '#EFF6FF', 
    blueText: '#1E40AF', 
    blueBg: '#DBEAFE', // Changed
    blueBorder: '#93C5FD', 
    greenText: '#10B981', 
    goldText: '#B45309', 
    grayText: '#CBD5E1', 
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-ls-forest" />
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
            </div>
            <p className="text-sm sm:text-base" style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) {
              setFormErrors({});
            }
          }}>
            <DialogTrigger asChild>
              <button 
                className="w-full sm:w-auto"
                style={{
                  backgroundColor: '#0C3B2E',
                  color: '#FFFFFF',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
              >
                <Plus style={{ width: '18px', height: '18px' }} />
                <span className="text-sm sm:text-base">{language === 'th' ? 'เพิ่มมัดจำ' : 'Add Deposit'}</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto" style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.borderColor,
              margin: '16px'
            }}>
              <DialogHeader>
                <DialogTitle style={{ color: colors.textPrimary }}>{strings.addDepositTitle}</DialogTitle>
              </DialogHeader>
              
              {formErrors.submit && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                  ❌ {formErrors.submit}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {strings.depositAmount} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.deposit_amount}
                    onChange={(e) => {
                      setFormData({...formData, deposit_amount: e.target.value});
                      setFormErrors({...formErrors, deposit_amount: null});
                    }}
                    className={`w-full p-3 border-2 rounded-lg ${formErrors.deposit_amount ? 'border-red-500' : ''}`}
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: formErrors.deposit_amount ? '#EF4444' : colors.borderColor,
                      color: colors.textPrimary
                    }}
                    placeholder="10000"
                  />
                  {formErrors.deposit_amount && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.deposit_amount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {strings.depositPaidDate} *
                  </label>
                  <input
                    type="date"
                    value={formData.deposit_paid_date}
                    onChange={(e) => {
                      setFormData({...formData, deposit_paid_date: e.target.value});
                      setFormErrors({...formErrors, deposit_paid_date: null});
                    }}
                    className={`w-full p-3 border-2 rounded-lg ${formErrors.deposit_paid_date ? 'border-red-500' : ''}`}
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: formErrors.deposit_paid_date ? '#EF4444' : colors.borderColor,
                      color: colors.textPrimary,
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                    }}
                  />
                  {formErrors.deposit_paid_date && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.deposit_paid_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {strings.expectedReturnDate} *
                  </label>
                  <input
                    type="date"
                    value={formData.expected_return_date}
                    onChange={(e) => {
                      setFormData({...formData, expected_return_date: e.target.value});
                      setFormErrors({...formErrors, expected_return_date: null});
                    }}
                    className={`w-full p-3 border-2 rounded-lg ${formErrors.expected_return_date ? 'border-red-500' : ''}`}
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: formErrors.expected_return_date ? '#EF4444' : colors.borderColor,
                      color: colors.textPrimary,
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                    }}
                  />
                  {formErrors.expected_return_date && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.expected_return_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {strings.propertyAddress}
                  </label>
                  <input
                    type="text"
                    value={formData.property_address}
                    onChange={(e) => setFormData({...formData, property_address: e.target.value})}
                    className="w-full p-3 border-2 rounded-lg"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                    placeholder={language === 'th' ? 'ที่อยู่ทรัพย์สิน' : 'Property address'}
                  />
                </div>

                {/* Rent Alerts Section */}
                <FeatureGate feature="rent_alerts_auto">
                  <div className="p-4 rounded-lg border-2" style={{
                    backgroundColor: isDarkMode ? '#1E4435' : '#ECFDF5',
                    borderColor: isDarkMode ? '#10B981' : '#A7F3D0'
                  }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold" style={{ color: colors.textPrimary }}>
                          {strings.rentAlertsTitle}
                        </span>
                      </div>
                      <Switch
                        checked={formData.rent_alerts_enabled}
                        onCheckedChange={(checked) => setFormData({...formData, rent_alerts_enabled: checked})}
                      />
                    </div>
                    
                    {formData.rent_alerts_enabled && (
                      <div className="space-y-3 mt-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1" style={{ color: colors.textPrimary }}>
                            {strings.monthlyRent} *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.rent_amount}
                            onChange={(e) => {
                              setFormData({...formData, rent_amount: e.target.value});
                              setFormErrors({...formErrors, rent_amount: null});
                            }}
                            className={`w-full p-2 border rounded-lg text-sm ${formErrors.rent_amount ? 'border-red-500' : ''}`}
                            style={{
                              backgroundColor: colors.inputBg,
                              borderColor: formErrors.rent_amount ? '#EF4444' : colors.borderColor,
                              color: colors.textPrimary
                            }}
                            placeholder="8000"
                          />
                          {formErrors.rent_amount && (
                            <p className="text-xs text-red-600 mt-1">{formErrors.rent_amount}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold mb-1" style={{ color: colors.textPrimary }}>
                            {strings.rentDueDay} *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={formData.rent_due_day}
                            onChange={(e) => {
                              setFormData({...formData, rent_due_day: e.target.value});
                              setFormErrors({...formErrors, rent_due_day: null});
                            }}
                            className={`w-full p-2 border rounded-lg text-sm ${formErrors.rent_due_day ? 'border-red-500' : ''}`}
                            style={{
                              backgroundColor: colors.inputBg,
                              borderColor: formErrors.rent_due_day ? '#EF4444' : colors.borderColor,
                              color: colors.textPrimary
                            }}
                            placeholder="5"
                          />
                          {formErrors.rent_due_day && (
                            <p className="text-xs text-red-600 mt-1">{formErrors.rent_due_day}</p>
                          )}
                          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                            {language === 'th' ? 'เช่น: 1 = วันที่ 1 ของทุกเดือน' : 'e.g., 1 = 1st of every month'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1" style={{ color: colors.textPrimary }}>
                            {strings.alertDaysLabel}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="14"
                            value={formData.rent_alert_days_before}
                            onChange={(e) => {
                              setFormData({...formData, rent_alert_days_before: e.target.value});
                            }}
                            className="w-full p-2 border rounded-lg text-sm"
                            style={{
                              backgroundColor: colors.inputBg,
                              borderColor: colors.borderColor,
                              color: colors.textPrimary
                            }}
                            placeholder="3"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </FeatureGate>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {strings.notes}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full p-3 border-2 rounded-lg"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                    placeholder={strings.additionalNotes}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    backgroundColor: submitting ? '#9CA3AF' : '#0C3B2E',
                    color: '#FFFFFF',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {strings.saving}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {strings.trackDepositButton}
                    </>
                  )}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Deposit Shield Feature Banner */}
        <FeatureGate feature="deposit_shield">
          <Card className="mb-6 border-none shadow-lg text-ls-charcoal" style={{
            background: 'linear-gradient(to right, #C7A338, #d97706)' 
          }}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base sm:text-lg mb-1">{strings.depositShieldTitle}</h3>
                  <p className="text-ls-charcoal/80 text-xs sm:text-sm">
                    {strings.depositShieldSubtitle}
                  </p>
                </div>
                {hasLineNotify && (
                  <button className="w-full sm:w-auto px-4 py-2 bg-white/20 border border-white/30 text-ls-charcoal hover:bg-white/40 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                    <Bell className="w-4 h-4" />
                    {strings.lineNotifyButton}
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </FeatureGate>

        {/* Deposits Grid - Always single column on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deposits.length === 0 ? (
            <Card className="border-none shadow-xl md:col-span-2" style={{ backgroundColor: colors.cardBg }}>
              <CardContent className="p-8 sm:p-12 text-center">
                <Wallet className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" style={{ color: colors.textSecondary, opacity: 0.5 }} />
                <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>{strings.noDepositsTitle}</h3>
                <p className="mb-6 text-sm sm:text-base" style={{ color: colors.textSecondary }}>{strings.noDepositsSubtitle}</p>
                <button 
                  onClick={() => setShowAddDialog(true)} 
                  className="w-full sm:w-auto"
                  style={{
                    backgroundColor: '#0C3B2E',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                >
                  <Plus style={{ width: '18px', height: '18px' }} />
                  {strings.addFirstDepositButton}
                </button>
              </CardContent>
            </Card>
          ) : (
            deposits.map((deposit) => {
              const daysRemaining = getDaysRemaining(deposit.expected_return_date);
              const isUrgent = daysRemaining <= 30 && deposit.status === 'tracking';
              const nextRentDue = deposit.rent_alerts_enabled && deposit.rent_due_day ? getNextRentDueDate(deposit.rent_due_day) : null;
              const daysToRent = nextRentDue ? getDaysRemaining(nextRentDue) : null;
              
              return (
                <Card key={deposit.id} className={`border-none shadow-lg hover:shadow-xl transition-all duration-300`} style={{
                  backgroundColor: colors.cardBg,
                  border: isUrgent ? `2px solid #C7A338` : 'none'
                }}>
                  <CardHeader className="pb-3 sm:pb-4" style={{
                    borderBottom: `1px solid ${colors.borderColor}`
                  }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(deposit.status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg sm:text-xl font-bold break-words" style={{ color: colors.textPrimary }}>
                            ฿{deposit.deposit_amount.toLocaleString()}
                          </CardTitle>
                          {deposit.property_address && (
                            <p className="text-xs sm:text-sm mt-1 break-words" style={{ color: colors.textSecondary }}>{deposit.property_address}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end flex-shrink-0">
                        <Badge className={`${getStatusColor(deposit.status)} border text-xs`}>
                          {deposit.status.toUpperCase()}
                        </Badge>
                        {hasDepositShield && deposit.status === 'tracking' && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs whitespace-nowrap">
                            <Shield className="w-3 h-3 mr-1" />
                            {strings.protectedBadge}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-3 sm:p-4">
                    {/* Rent Alert Display */}
                    {hasRentAlertsAuto && deposit.rent_alerts_enabled && deposit.rent_amount && nextRentDue && (
                      <div className="mb-4 p-3 rounded-xl border-2" style={{ 
                        backgroundColor: colors.infoBg,
                        borderColor: colors.blueBorder
                      }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Bell className="w-4 h-4" style={{ color: colors.blueText }} />
                          <h4 className="font-bold text-sm" style={{ color: colors.textPrimary }}>{strings.nextRentDue}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Amount</p>
                            <p className="text-base font-bold" style={{ color: colors.textPrimary }}>฿{deposit.rent_amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Due Date</p>
                            <p className="text-base font-bold" style={{ color: colors.textPrimary }}>{format(nextRentDue, 'MMM d')}</p>
                          </div>
                        </div>
                        <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                          {strings.rentReminder} {deposit.rent_alert_days_before} {strings.daysBefore} ({daysToRent} days)
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs mb-1" style={{ color: colors.textSecondary }}>
                          <Calendar className="w-3 h-3" />
                          {strings.paidDate}
                        </div>
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {format(new Date(deposit.deposit_paid_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-xs mb-1" style={{ color: colors.textSecondary }}>
                          <Calendar className="w-3 h-3" />
                          {strings.expectedReturn}
                        </div>
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {format(new Date(deposit.expected_return_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      {deposit.status === 'tracking' && (
                        <>
                          <div className="col-span-2">
                            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: colors.textSecondary }}>
                              <Clock className="w-3 h-3" />
                              {strings.daysRemaining}
                            </div>
                            <p className={`font-semibold text-sm`} style={{ color: isUrgent ? colors.goldText : colors.textPrimary }}>
                              {daysRemaining} days
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {deposit.notes && (
                      <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: colors.infoBg }}>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>{deposit.notes}</p>
                      </div>
                    )}

                    {hasLineNotify && deposit.status === 'tracking' && (
                      <div className="mb-4 p-2 rounded-lg" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.blueBorder}` }}>
                        <p className="text-xs flex items-center gap-2" style={{ color: colors.textSecondary }}>
                          <Bell className="w-3 h-3" style={{ color: colors.blueText }} />
                          <span>
                            {strings.reminderLineEmail(daysRemaining)}
                          </span>
                        </p>
                      </div>
                    )}

                    {deposit.status === 'tracking' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => updateDepositMutation.mutate({ 
                            id: deposit.id, 
                            data: { status: 'returned' } 
                          })}
                          className="flex-1"
                          style={{
                            backgroundColor: '#FFFFFF',
                            color: '#10B981',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            border: '2px solid #10B981',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#D1FAE5';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#FFFFFF';
                          }}
                        >
                          <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                          <span className="text-xs sm:text-sm">{strings.markReturnedButton}</span>
                        </button>
                        <button
                          onClick={() => updateDepositMutation.mutate({ 
                            id: deposit.id, 
                            data: { status: 'dispute' } 
                          })}
                          className="flex-1"
                          style={{
                            backgroundColor: '#FFFFFF',
                            color: '#EF4444',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            border: '2px solid #EF4444',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#FEE2E2';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#FFFFFF';
                          }}
                        >
                          <AlertTriangle style={{ width: '14px', height: '14px' }} />
                          <span className="text-xs sm:text-sm">{strings.openDisputeButton}</span>
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
