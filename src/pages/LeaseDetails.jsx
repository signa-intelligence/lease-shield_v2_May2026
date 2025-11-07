
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Home, 
  DollarSign, 
  Bell, 
  Edit2, 
  Save, 
  X,
  AlertTriangle,
  Shield,
  Eye,
  ExternalLink,
  Loader2 // Added Loader2 import
} from "lucide-react";
import { format } from "date-fns";

export default function LeaseDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const leaseId = urlParams.get('leaseId');

  const [editingNotice, setEditingNotice] = useState(false);
  const [noticeSettings, setNoticeSettings] = useState({
    notice_period_days: 30,
    notice_deadline: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: lease, isLoading: leaseLoading } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: async () => {
      const leases = await base44.entities.Lease.list();
      return leases.find(l => l.id === leaseId);
    },
    enabled: !!leaseId,
  });

  const { data: scan } = useQuery({
    queryKey: ['scan', lease?.id],
    queryFn: async () => {
      const scans = await base44.entities.LeaseScan.list();
      return scans.find(s => s.lease_id === lease.id);
    },
    enabled: !!lease?.id,
  });

  const updateLeaseMutation = useMutation({
    mutationFn: (data) => base44.entities.Lease.update(leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      setEditingNotice(false);
    },
    onError: (error) => {
      console.error('Update failed:', error);
      alert(language === 'th' 
        ? 'ไม่สามารถบันทึกการเปลี่ยนแปลงได้ กรุณาลองอีกครั้ง' 
        : 'Failed to save changes. Please try again.');
    }
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    inputBg: '#353A3D'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    inputBg: '#FFFFFF'
  };

  const t = {
    en: {
      leaseDetails: "Lease Details",
      loading: "Loading...",
      notFound: "Lease not found",
      backToLeases: "Back to Leases",
      basicInfo: "Basic Information",
      propertyAddress: "Property Address",
      monthlyRent: "Monthly Rent",
      securityDeposit: "Security Deposit",
      leasePeriod: "Lease Period",
      to: "to",
      language: "Language",
      noticeSettings: "Notice Settings",
      noticeAlertsEnabled: "Notice Alerts Enabled",
      noticePeriod: "Notice Period (Days)",
      noticeDeadline: "Notice Deadline",
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      days: "days",
      riskAnalysis: "Risk Analysis",
      riskScore: "Risk Score",
      viewFullReport: "View Full Report",
      viewScanResults: "View Scan Results",
      actions: "Actions",
      viewLease: "View Lease Document",
      createDepositTracker: "Create Deposit Tracker",
      generateLetter: "Generate Letter",
      deleteWarning: "Delete this lease?",
      delete: "Delete Lease",
      noticeHelp: "Days before lease end to notify landlord",
      deadlineCalculated: "Calculated based on lease end date and notice period",
      enableAlertsHelp: "Receive reminders 30, 7, and 3 days before notice deadline"
    },
    th: {
      leaseDetails: "รายละเอียดสัญญาเช่า",
      loading: "กำลังโหลด...",
      notFound: "ไม่พบสัญญาเช่า",
      backToLeases: "กลับไปที่สัญญาเช่า",
      basicInfo: "ข้อมูลพื้นฐาน",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      monthlyRent: "ค่าเช่ารายเดือน",
      securityDeposit: "เงินมัดจำ",
      leasePeriod: "ระยะเวลาสัญญา",
      to: "ถึง",
      language: "ภาษา",
      noticeSettings: "การตั้งค่าการแจ้งเตือน",
      noticeAlertsEnabled: "เปิดการแจ้งเตือน",
      noticePeriod: "ระยะเวลาแจ้งล่วงหน้า (วัน)",
      noticeDeadline: "กำหนดแจ้ง",
      edit: "แก้ไข",
      save: "บันทึก",
      cancel: "ยกเลิก",
      days: "วัน",
      riskAnalysis: "การวิเคราะห์ความเสี่ยง",
      riskScore: "คะแนนความเสี่ยง",
      viewFullReport: "ดูรายงานฉบับเต็ม",
      viewScanResults: "ดูผลการสแกน",
      actions: "การดำเนินการ",
      viewLease: "ดูเอกสารสัญญาเช่า",
      createDepositTracker: "สร้างตัวติดตามเงินมัดจำ",
      generateLetter: "สร้างจดหมาย",
      deleteWarning: "ลบสัญญาเช่านี้?",
      delete: "ลบสัญญาเช่า",
      noticeHelp: "จำนวนวันก่อนสัญญาหมดอายุที่ต้องแจ้งเจ้าของบ้าน",
      deadlineCalculated: "คำนวณจากวันสิ้นสุดสัญญาและระยะเวลาแจ้งล่วงหน้า",
      enableAlertsHelp: "รับการแจ้งเตือน 30, 7 และ 3 วันก่อนถึงกำหนดแจ้ง"
    }
  };

  const strings = t[language];

  const handleToggleAlerts = async (enabled) => {
    await updateLeaseMutation.mutateAsync({
      notice_alerts_enabled: enabled
    });
  };

  const handleSaveNoticeSettings = async () => {
    if (!lease.end_date || !noticeSettings.notice_period_days) {
      alert(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill in all fields');
      return;
    }

    const endDate = new Date(lease.end_date);
    const deadline = new Date(endDate);
    deadline.setDate(deadline.getDate() - noticeSettings.notice_period_days);

    await updateLeaseMutation.mutateAsync({
      notice_period_days: noticeSettings.notice_period_days,
      notice_deadline: deadline.toISOString().split('T')[0]
    });
  };

  const handleEditNotice = () => {
    setNoticeSettings({
      notice_period_days: lease.notice_period_days || 30,
      notice_deadline: lease.notice_deadline || ''
    });
    setEditingNotice(true);
  };

  const getRiskColor = (score) => {
    if (score >= 75) return '#EF4444';
    if (score >= 50) return '#F59E0B';
    if (score >= 25) return '#EAB308';
    return '#10B981';
  };

  if (leaseLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: colors.textSecondary }} />
            <p className="text-lg" style={{ color: colors.textSecondary }}>{strings.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-5xl mx-auto">
          <Button variant="outline" onClick={() => navigate(createPageUrl("UploadScan"))} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {strings.backToLeases}
          </Button>
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{
              backgroundColor: isDarkMode ? '#3A3D40' : '#F3F4F6'
            }}>
              <FileText className="w-10 h-10" style={{ color: colors.textSecondary, opacity: 0.5 }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {strings.notFound}
            </h2>
            <p className="mb-6" style={{ color: colors.textSecondary }}>
              {language === 'th' 
                ? 'ไม่พบสัญญาเช่าที่คุณกำลังมองหา หรืออาจถูกลบไปแล้ว' 
                : 'The lease you\'re looking for doesn\'t exist or may have been deleted.'}
            </p>
            <Button onClick={() => navigate(createPageUrl("UploadScan"))} className="bg-ls-forest hover:bg-ls-forest/90">
              {language === 'th' ? 'กลับไปที่สัญญาเช่า' : 'Go to Leases'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-5xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl("UploadScan"))}
          className="mb-4 md:mb-6"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {strings.backToLeases}
        </Button>

        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6" style={{ color: colors.textPrimary }}>
          {strings.leaseDetails}
        </h1>

        {/* Basic Information */}
        <Card className="mb-4 md:mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Home className="w-4 h-4 md:w-5 md:h-5 text-ls-forest" />
              {strings.basicInfo}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                  {strings.propertyAddress}
                </p>
                <p className="font-medium" style={{ color: colors.textPrimary }}>
                  {lease.property_address || 'N/A'}
                </p>
              </div>

              {lease.rent_amount && (
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                    {strings.monthlyRent}
                  </p>
                  <p className="font-medium" style={{ color: colors.textPrimary }}>
                    ฿{lease.rent_amount.toLocaleString()}
                  </p>
                </div>
              )}

              {lease.deposit_amount && (
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                    {strings.securityDeposit}
                  </p>
                  <p className="font-medium" style={{ color: colors.textPrimary }}>
                    ฿{lease.deposit_amount.toLocaleString()}
                  </p>
                </div>
              )}

              {lease.start_date && lease.end_date && (
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                    {strings.leasePeriod}
                  </p>
                  <p className="font-medium" style={{ color: colors.textPrimary }}>
                    {format(new Date(lease.start_date), 'MMM d, yyyy')} {strings.to} {format(new Date(lease.end_date), 'MMM d, yyyy')}
                  </p>
                </div>
              )}

              {lease.language_detected && (
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                    {strings.language}
                  </p>
                  <Badge variant="outline">{lease.language_detected.toUpperCase()}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notice Settings */}
        <Card className="mb-4 md:mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-ls-forest" />
              {strings.noticeSettings}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {/* Toggle Alerts */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6 p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
              <div className="flex-1">
                <p className="font-semibold mb-1 text-sm md:text-base" style={{ color: colors.textPrimary }}>
                  {strings.noticeAlertsEnabled}
                </p>
                <p className="text-xs md:text-sm" style={{ color: colors.textSecondary }}>
                  {strings.enableAlertsHelp}
                </p>
              </div>
              <Switch
                checked={lease.notice_alerts_enabled !== false}
                onCheckedChange={handleToggleAlerts}
              />
            </div>

            {/* Notice Period and Deadline */}
            {!editingNotice ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                      {strings.noticePeriod}
                    </p>
                    <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                      {lease.notice_period_days || 30} {strings.days}
                    </p>
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      {strings.noticeHelp}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleEditNotice} className="w-full sm:w-auto">
                    <Edit2 className="w-4 h-4 mr-2" />
                    {strings.edit}
                  </Button>
                </div>

                {lease.notice_deadline && (
                  <div className="p-4 rounded-lg border-2" style={{
                    backgroundColor: isDarkMode ? '#1E4435' : '#ECFDF5',
                    borderColor: isDarkMode ? '#10B981' : '#A7F3D0'
                  }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>
                      {strings.noticeDeadline}
                    </p>
                    <p className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                      {format(new Date(lease.notice_deadline), 'MMMM d, yyyy')}
                    </p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {strings.deadlineCalculated}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {strings.noticePeriod}
                  </label>
                  <input
                    type="number"
                    value={noticeSettings.notice_period_days}
                    onChange={(e) => setNoticeSettings({...noticeSettings, notice_period_days: parseInt(e.target.value) || 30})}
                    min="1"
                    max="365"
                    className="w-full p-3 border-2 rounded-lg"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    {strings.noticeHelp}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setEditingNotice(false)}
                    className="flex-1 w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {strings.cancel}
                  </Button>
                  <Button
                    onClick={handleSaveNoticeSettings}
                    disabled={updateLeaseMutation.isLoading}
                    className="flex-1 w-full bg-ls-forest hover:bg-ls-forest/90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {strings.save}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Analysis */}
        {scan && (
          <Card className="mb-4 md:mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Shield className="w-4 h-4 md:w-5 md:h-5 text-ls-forest" />
                {strings.riskAnalysis}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                    {strings.riskScore}
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="text-3xl md:text-4xl font-bold"
                      style={{ color: getRiskColor(scan.risk_score) }}
                    >
                      {scan.risk_score}
                    </div>
                    <div className="text-xl md:text-2xl font-medium" style={{ color: colors.textSecondary }}>
                      /100
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl("ScanPreview") + `?scanId=${scan.id}&leaseId=${lease.id}`)}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    <span className="text-xs md:text-sm">{strings.viewScanResults}</span>
                  </Button>
                  <Button
                    onClick={() => navigate(createPageUrl("ReportFull") + `?scanId=${scan.id}&leaseId=${lease.id}`)}
                    className="bg-ls-forest hover:bg-ls-forest/90 w-full sm:w-auto"
                    size="sm"
                    style={{ color: '#FFFFFF' }}
                  >
                    <FileText className="w-4 h-4 mr-2" style={{ color: '#FFFFFF' }} />
                    <span className="text-xs md:text-sm">{strings.viewFullReport}</span>
                  </Button>
                </div>
              </div>

              {scan.summary && (
                <div className="p-4 rounded-lg" style={{
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `1px solid ${colors.borderColor}`
                }}>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {scan.summary}
                  </p>
                </div>
              )}

              {scan.flags && scan.flags.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                      {scan.flags.length} {language === 'th' ? 'ปัญหาที่พบ' : 'Issues Found'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {scan.flags.slice(0, 3).map((flag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {flag.category}
                      </Badge>
                    ))}
                    {scan.flags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{scan.flags.length - 3} {language === 'th' ? 'เพิ่มเติม' : 'more'}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">{strings.actions}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lease.file_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(lease.file_url, '_blank')}
                  className="justify-start h-auto py-4"
                >
                  <ExternalLink className="w-5 h-5 mr-3 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold">{strings.viewLease}</div>
                    <div className="text-xs" style={{ color: colors.textSecondary }}>
                      {language === 'th' ? 'เปิดเอกสารต้นฉบับ' : 'Open original document'}
                    </div>
                  </div>
                </Button>
              )}

              {lease.deposit_amount && (
                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl("DepositTracker"))}
                  className="justify-start h-auto py-4"
                >
                  <Shield className="w-5 h-5 mr-3 text-emerald-600" />
                  <div className="text-left">
                    <div className="font-semibold">{strings.createDepositTracker}</div>
                    <div className="text-xs" style={{ color: colors.textSecondary }}>
                      {language === 'th' ? 'ติดตามเงินมัดจำ' : 'Track your deposit'}
                    </div>
                  </div>
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("Templates"))}
                className="justify-start h-auto py-4"
              >
                <FileText className="w-5 h-5 mr-3 text-purple-600" />
                <div className="text-left">
                  <div className="font-semibold">{strings.generateLetter}</div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'สร้างจดหมายอย่างเป็นทางการ' : 'Create formal letters'}
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
