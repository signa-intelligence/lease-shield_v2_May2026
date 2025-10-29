import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Wallet, Plus, Calendar, AlertTriangle, CheckCircle2, Clock, Shield, Bell } from "lucide-react";
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
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    deposit_amount: '',
    deposit_paid_date: '',
    expected_return_date: '',
    property_address: '',
    notes: '',
    rent_amount: '',
    rent_due_day: '1',
    rent_alerts_enabled: false,
    rent_alert_days_before: '3'
  });
  
  const queryClient = useQueryClient();
  const { hasAccess: hasDepositShield } = useFeatureAccess('deposit_shield');
  const { hasAccess: hasLineNotify } = useFeatureAccess('line_notify_enabled');

  const t = {
    en: {
      title: "Deposit Protection File",
      subtitle: "Secure storage for your lease, receipts, and deposit proof",
      dialogTitle: "Track New Deposit",
      amountLabel: "Deposit Amount (฿)",
      addressLabel: "Property Address",
      paidDateLabel: "Date Paid",
      returnDateLabel: "Expected Return Date",
      notesLabel: "Notes",
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
      daysBefore: "days before"
    },
    th: {
      title: "ไฟล์ป้องกันเงินมัดจำ",
      subtitle: "จัดเก็บสัญญาเช่า ใบเสร็จ และหลักฐานเงินมัดจำอย่างปลอดภัย",
      dialogTitle: "ติดตามเงินมัดจำใหม่",
      amountLabel: "จำนวนเงินมัดจำ (฿)",
      addressLabel: "ที่อยู่ทรัพย์สิน",
      paidDateLabel: "วันที่จ่าย",
      returnDateLabel: "วันที่คาดว่าจะได้รับคืน",
      notesLabel: "หมายเหตุ",
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
      daysBefore: "วันก่อน"
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
        rent_due_day: '1',
        rent_alerts_enabled: false,
        rent_alert_days_before: '3'
      });
    },
  });

  const updateDepositMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DepositTracker.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const depositData = {
      ...formData,
      deposit_amount: parseFloat(formData.deposit_amount),
      rent_amount: formData.rent_amount ? parseFloat(formData.rent_amount) : null,
      rent_due_day: formData.rent_due_day ? parseInt(formData.rent_due_day) : null,
      rent_alert_days_before: formData.rent_alert_days_before ? parseInt(formData.rent_alert_days_before) : 3,
      status: 'tracking'
    };

    createDepositMutation.mutate(depositData);
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

  const language = user?.language || 'en';
  const strings = t[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ls-stone via-white to-ls-stone p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-8 h-8 text-ls-forest" />
              <h1 className="text-3xl font-bold text-ls-charcoal">{strings.title}</h1>
            </div>
            <p className="text-slate-600">{strings.subtitle}</p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <button 
                style={{
                  backgroundColor: '#0C3B2E',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
              >
                <Plus style={{ width: '20px', height: '20px' }} />
                Add Deposit
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{strings.dialogTitle}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="amount">{strings.amountLabel}</Label>
                  <Input
                    id="amount"
                    type="number"
                    required
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData({...formData, deposit_amount: e.target.value})}
                    placeholder="10000"
                  />
                </div>
                <div>
                  <Label htmlFor="address">{strings.addressLabel}</Label>
                  <Input
                    id="address"
                    value={formData.property_address}
                    onChange={(e) => setFormData({...formData, property_address: e.target.value})}
                    placeholder="123 Main St, Bangkok"
                  />
                </div>
                <div>
                  <Label htmlFor="paid_date">{strings.paidDateLabel}</Label>
                  <Input
                    id="paid_date"
                    type="date"
                    required
                    value={formData.deposit_paid_date}
                    onChange={(e) => setFormData({...formData, deposit_paid_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="return_date">{strings.returnDateLabel}</Label>
                  <Input
                    id="return_date"
                    type="date"
                    required
                    value={formData.expected_return_date}
                    onChange={(e) => setFormData({...formData, expected_return_date: e.target.value})}
                  />
                </div>

                {/* Rent Alerts Section */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label className="text-sm font-bold">{strings.rentAlertsTitle}</Label>
                      <p className="text-xs text-slate-500">{strings.rentAlertsSubtitle}</p>
                    </div>
                    <Switch
                      checked={formData.rent_alerts_enabled}
                      onCheckedChange={(checked) => setFormData({...formData, rent_alerts_enabled: checked})}
                    />
                  </div>

                  {formData.rent_alerts_enabled && (
                    <>
                      <div className="mb-3">
                        <Label htmlFor="rent_amount">{strings.rentAmountLabel}</Label>
                        <Input
                          id="rent_amount"
                          type="number"
                          value={formData.rent_amount}
                          onChange={(e) => setFormData({...formData, rent_amount: e.target.value})}
                          placeholder="15000"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="rent_due_day">{strings.rentDueDayLabel}</Label>
                          <Input
                            id="rent_due_day"
                            type="number"
                            min="1"
                            max="31"
                            value={formData.rent_due_day}
                            onChange={(e) => setFormData({...formData, rent_due_day: e.target.value})}
                            placeholder="1"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            {language === 'th' ? 'เช่น: 1 = วันที่ 1 ของทุกเดือน' : 'e.g., 1 = 1st of every month'}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="alert_days">{strings.alertDaysLabel}</Label>
                          <Input
                            id="alert_days"
                            type="number"
                            min="1"
                            max="14"
                            value={formData.rent_alert_days_before}
                            onChange={(e) => setFormData({...formData, rent_alert_days_before: e.target.value})}
                            placeholder="3"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">{strings.notesLabel}</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Any additional details..."
                    rows={3}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={createDepositMutation.isPending}
                  style={{
                    width: '100%',
                    backgroundColor: createDepositMutation.isPending ? '#9CA3AF' : '#0C3B2E',
                    color: '#FFFFFF',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: createDepositMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: createDepositMutation.isPending ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!createDepositMutation.isPending) {
                      e.target.style.backgroundColor = '#0a2f25';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!createDepositMutation.isPending) {
                      e.target.style.backgroundColor = '#0C3B2E';
                    }
                  }}
                >
                  {createDepositMutation.isPending ? 'Tracking...' : strings.trackDepositButton}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Deposit Shield Feature Banner */}
        <FeatureGate feature="deposit_shield">
          <Card className="mb-6 border-none shadow-lg bg-gradient-to-r from-ls-gold to-amber-600 text-ls-charcoal">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{strings.depositShieldTitle}</h3>
                  <p className="text-ls-charcoal/80 text-sm">
                    {strings.depositShieldSubtitle}
                  </p>
                </div>
                {hasLineNotify && (
                  <button className="px-4 py-2 bg-white/20 border border-white/30 text-ls-charcoal hover:bg-white/40 rounded-lg transition-colors flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    {strings.lineNotifyButton}
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </FeatureGate>

        <div className="grid gap-6">
          {deposits.length === 0 ? (
            <Card className="border-none shadow-xl">
              <CardContent className="p-12 text-center">
                <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-ls-charcoal mb-2">{strings.noDepositsTitle}</h3>
                <p className="text-slate-600 mb-6">{strings.noDepositsSubtitle}</p>
                <button 
                  onClick={() => setShowAddDialog(true)} 
                  style={{
                    backgroundColor: '#0C3B2E',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                >
                  <Plus style={{ width: '20px', height: '20px' }} />
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
                <Card key={deposit.id} className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 ${isUrgent ? 'ring-2 ring-ls-gold' : ''}`}>
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(deposit.status)}
                        <div>
                          <CardTitle className="text-2xl font-bold text-slate-900">
                            ฿{deposit.deposit_amount.toLocaleString()}
                          </CardTitle>
                          {deposit.property_address && (
                            <p className="text-sm text-slate-600 mt-1">{deposit.property_address}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={`${getStatusColor(deposit.status)} border`}>
                          {deposit.status.toUpperCase()}
                        </Badge>
                        {hasDepositShield && deposit.status === 'tracking' && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            <Shield className="w-3 h-3 mr-1" />
                            {strings.protectedBadge}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    {/* Rent Alert Display */}
                    {deposit.rent_alerts_enabled && deposit.rent_amount && nextRentDue && (
                      <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <Bell className="w-5 h-5 text-blue-600" />
                          <h4 className="font-bold text-blue-900">{strings.nextRentDue}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-blue-700 mb-1">Amount</p>
                            <p className="text-lg font-bold text-blue-900">฿{deposit.rent_amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-700 mb-1">Due Date</p>
                            <p className="text-lg font-bold text-blue-900">{format(nextRentDue, 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <p className="text-xs text-blue-700 mt-3">
                          {strings.rentReminder} {deposit.rent_alert_days_before} {strings.daysBefore} ({daysToRent} days)
                        </p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                          <Calendar className="w-4 h-4" />
                          {strings.paidDate}
                        </div>
                        <p className="font-semibold text-slate-900">
                          {format(new Date(deposit.deposit_paid_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                          <Calendar className="w-4 h-4" />
                          {strings.expectedReturn}
                        </div>
                        <p className="font-semibold text-slate-900">
                          {format(new Date(deposit.expected_return_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      {deposit.status === 'tracking' && (
                        <div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                            <Clock className="w-4 h-4" />
                            {strings.daysRemaining}
                          </div>
                          <p className={`font-semibold ${isUrgent ? 'text-amber-600' : 'text-slate-900'}`}>
                            {daysRemaining} days
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {deposit.notes && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-700">{deposit.notes}</p>
                      </div>
                    )}

                    {hasLineNotify && deposit.status === 'tracking' && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 flex items-center gap-2">
                          <Bell className="w-4 h-4" />
                          <span>
                            {strings.reminderLineEmail(daysRemaining)}
                          </span>
                        </p>
                      </div>
                    )}

                    {deposit.status === 'tracking' && (
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => updateDepositMutation.mutate({ 
                            id: deposit.id, 
                            data: { status: 'returned' } 
                          })}
                          style={{
                            flex: 1,
                            backgroundColor: '#FFFFFF',
                            color: '#10B981',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            border: '2px solid #10B981',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#D1FAE5';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#FFFFFF';
                          }}
                        >
                          <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                          {strings.markReturnedButton}
                        </button>
                        <button
                          onClick={() => updateDepositMutation.mutate({ 
                            id: deposit.id, 
                            data: { status: 'dispute' } 
                          })}
                          style={{
                            flex: 1,
                            backgroundColor: '#FFFFFF',
                            color: '#EF4444',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            border: '2px solid #EF4444',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#FEE2E2';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#FFFFFF';
                          }}
                        >
                          <AlertTriangle style={{ width: '16px', height: '16px' }} />
                          {strings.openDisputeButton}
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