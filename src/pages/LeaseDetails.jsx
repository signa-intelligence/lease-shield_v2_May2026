import React, { useState } from "react";
import { openDocument } from "@/components/shared/openDocument";
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
  Bell, 
  Edit2, 
  Save, 
  X,
  AlertTriangle,
  Shield,
  Eye,
  ExternalLink,
  Loader2,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import AuthGuard from "../components/shared/AuthGuard";
import { haptic } from "../components/shared/HapticFeedback";
import { ToastProvider, useToast } from "../components/shared/Toast";
import SkeletonLoader from "../components/shared/SkeletonLoader";
import EmptyState from "../components/shared/EmptyState";
import PageHeader from "../components/shared/PageHeader";
import MissingCriticalClauses from "../components/leases/MissingCriticalClauses";

function LeaseDetailsContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
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
      const leaseData = await base44.entities.Lease.get(leaseId);
      console.log('[LEASE_MODAL_DATA]', {
        id: leaseData?.id,
        property_address: leaseData?.property_address,
        allFields: Object.keys(leaseData || {})
      });
      return leaseData;
    },
    enabled: !!leaseId,
  });

  const { data: scan } = useQuery({
    queryKey: ['scan', lease?.id],
    queryFn: async () => {
      const scans = await base44.entities.LeaseScan.list();
      const matchingScan = scans.find(s => s.lease_id === lease.id);
      if (matchingScan) {
        console.log('[LEASE_SCAN_DATA]', {
          scan_id: matchingScan.id,
          has_scan_full: !!matchingScan.scan_full,
          key_terms: matchingScan.scan_full?.key_terms
        });
      }
      return matchingScan;
    },
    enabled: !!lease?.id,
  });
  
  // Derive property address with scan_preview fallback
  const propertyAddress = lease?.property_address || 
    scan?.scan_preview?.property_address ||
    scan?.scan_full?.key_terms?.property_address || 
    'N/A';

  const updateLeaseMutation = useMutation({
    mutationFn: (data) => base44.entities.Lease.update(leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      setEditingNotice(false);
    },
    onError: (error) => {
      console.error('Update failed:', error);
      alert(user?.language === 'th' 
        ? 'ไม่สามารถบันทึกการเปลี่ยนแปลงได้ กรุณาลองอีกครั้ง' 
        : 'Failed to save changes. Please try again.');
    }
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#2A2D30',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)',
    fieldBg: '#374151'
  } : {
    bg: '#F3F6F5',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderColor: 'rgba(12,59,46,0.08)',
    fieldBg: '#F8FAFC'
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
      leaseStart: "Lease Start",
      leaseEnd: "Lease End",
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
      leaseStart: "วันเริ่มสัญญา",
      leaseEnd: "วันสิ้นสุดสัญญา",
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
    },
    zh: {
      leaseDetails: "租约详情",
      loading: "加载中...",
      notFound: "未找到租约",
      backToLeases: "返回租约",
      basicInfo: "基本信息",
      propertyAddress: "物业地址",
      monthlyRent: "月租金",
      securityDeposit: "押金",
      leasePeriod: "租期",
      leaseStart: "租约开始",
      leaseEnd: "租约结束",
      to: "至",
      language: "语言",
      noticeSettings: "通知设置",
      noticeAlertsEnabled: "启用通知提醒",
      noticePeriod: "提前通知期（天数）",
      noticeDeadline: "通知截止日期",
      edit: "编辑",
      save: "保存",
      cancel: "取消",
      days: "天",
      riskAnalysis: "风险分析",
      riskScore: "风险评分",
      viewFullReport: "查看完整报告",
      viewScanResults: "查看扫描结果",
      actions: "操作",
      viewLease: "查看租约文档",
      createDepositTracker: "创建押金追踪器",
      generateLetter: "生成信件",
      deleteWarning: "删除此租约？",
      delete: "删除租约",
      noticeHelp: "租约结束前需要通知房东的天数",
      deadlineCalculated: "根据租约结束日期和提前通知期计算",
      enableAlertsHelp: "在通知截止日期前30、7和3天收到提醒"
    },
    ja: {
      leaseDetails: "賃貸契約の詳細",
      loading: "読み込み中...",
      notFound: "賃貸契約が見つかりません",
      backToLeases: "賃貸契約に戻る",
      basicInfo: "基本情報",
      propertyAddress: "物件住所",
      monthlyRent: "月額家賃",
      securityDeposit: "敷金",
      leasePeriod: "賃貸期間",
      leaseStart: "契約開始",
      leaseEnd: "契約終了",
      to: "から",
      language: "言語",
      noticeSettings: "通知設定",
      noticeAlertsEnabled: "通知アラート有効",
      noticePeriod: "通知期間（日数）",
      noticeDeadline: "通知期限",
      edit: "編集",
      save: "保存",
      cancel: "キャンセル",
      days: "日",
      riskAnalysis: "リスク分析",
      riskScore: "リスクスコア",
      viewFullReport: "完全なレポートを表示",
      viewScanResults: "スキャン結果を表示",
      actions: "アクション",
      viewLease: "賃貸契約書を表示",
      createDepositTracker: "デポジットトラッカーを作成",
      generateLetter: "レターを生成",
      deleteWarning: "この賃貸契約を削除しますか？",
      delete: "賃貸契約を削除",
      noticeHelp: "契約終了前に家主に通知する日数",
      deadlineCalculated: "契約終了日と通知期間に基づいて計算",
      enableAlertsHelp: "通知期限の30日前、7日前、3日前にリマインダーを受け取る"
    },
    ko: {
      leaseDetails: "임대 계약 세부 정보",
      loading: "로딩 중...",
      notFound: "임대 계약을 찾을 수 없음",
      backToLeases: "임대 계약으로 돌아가기",
      basicInfo: "기본 정보",
      propertyAddress: "부동산 주소",
      monthlyRent: "월 임대료",
      securityDeposit: "보증금",
      leasePeriod: "임대 기간",
      leaseStart: "계약 시작",
      leaseEnd: "계약 종료",
      to: "~",
      language: "언어",
      noticeSettings: "통지 설정",
      noticeAlertsEnabled: "통지 알림 활성화",
      noticePeriod: "통지 기간 (일)",
      noticeDeadline: "통지 마감일",
      edit: "편집",
      save: "저장",
      cancel: "취소",
      days: "일",
      riskAnalysis: "위험 분석",
      riskScore: "위험 점수",
      viewFullReport: "전체 보고서 보기",
      viewScanResults: "스캔 결과 보기",
      actions: "작업",
      viewLease: "임대 계약서 보기",
      createDepositTracker: "보증금 추적기 생성",
      generateLetter: "편지 생성",
      deleteWarning: "이 임대 계약을 삭제하시겠습니까?",
      delete: "임대 계약 삭제",
      noticeHelp: "임대 종료 전에 집주인에게 통지할 일수",
      deadlineCalculated: "임대 종료일과 통지 기간을 기반으로 계산",
      enableAlertsHelp: "통지 마감일 30일, 7일, 3일 전에 알림 받기"
    }
  };

  const strings = t[language] || t.en;

  // Hard currency sanitizer - REMOVES ALL $ USD SYMBOLS AT FINAL RENDER
  const sanitizeCurrency = (value) => {
    if (value === null || value === undefined) return 0;
    
    // Debug log raw value
    console.log('[CURRENCY DEBUG] Raw value:', value, 'Type:', typeof value);
    
    // Convert to string and strip ALL non-numeric except digits, decimal, minus
    let cleanedString = String(value).replace(/[^0-9.-]/g, '');
    const numericValue = parseFloat(cleanedString);
    
    console.log('[CURRENCY DEBUG] Cleaned numeric:', numericValue);
    
    return isNaN(numericValue) ? 0 : numericValue;
  };

  // NUCLEAR format - strip $ from EVERYTHING
  const formatCurrency = (value) => {
    // First, check if raw value has $ in it
    const rawStr = String(value);
    console.log('[FORMAT] Raw input:', rawStr);
    
    // Strip ALL $ symbols from raw value first
    const stripped = rawStr.replace(/\$/g, '').replace(/USD/g, '').replace(/US\$/g, '');
    
    const sanitized = sanitizeCurrency(stripped);
    let formatted = sanitized.toLocaleString('en-US');
    
    // TRIPLE-CHECK: strip again after formatting
    formatted = formatted.replace(/\$/g, '').replace(/USD/g, '').replace(/US\$/g, '').trim();
    
    console.log('[FORMAT] Final output:', formatted);
    return formatted;
  };

  // AUTOMATIC DEBUG - Runs on every render
  React.useEffect(() => {
    if (!lease) return;
    
    console.log('🔍 [LEASE DETAILS DEBUG] Build: 2026-01-01-16:45');
    console.log('🔍 Raw lease.rent_amount from DB:', lease.rent_amount, typeof lease.rent_amount);
    console.log('🔍 Raw lease.deposit_amount from DB:', lease.deposit_amount, typeof lease.deposit_amount);
    
    setTimeout(() => {
      console.log('=== DOM INSPECTION (AUTO) ===');
      
      // Find Monthly Rent element
      const rentElements = Array.from(document.querySelectorAll('p')).filter(el => 
        el.textContent.includes('Monthly Rent') || el.textContent.includes('ค่าเช่ารายเดือน')
      );
      if (rentElements.length > 0) {
        const rentParent = rentElements[0].parentElement;
        const rentValueEl = rentParent?.querySelector('p.font-medium');
        if (rentValueEl) {
          console.log('--- RENT DOM ---');
          console.log('innerText:', rentValueEl.innerText);
          console.log('innerHTML:', rentValueEl.innerHTML);
          console.log('textContent:', rentValueEl.textContent);
          console.log('Child nodes:', rentValueEl.childNodes.length);
          rentValueEl.childNodes.forEach((node, i) => {
            console.log(`  Node ${i}:`, node.nodeType, node.nodeName, node.nodeValue || node.textContent);
          });
          console.log('::before:', window.getComputedStyle(rentValueEl, '::before').content);
          console.log('::after:', window.getComputedStyle(rentValueEl, '::after').content);
        }
      }
      
      // Find Security Deposit element
      const depositElements = Array.from(document.querySelectorAll('p')).filter(el => 
        el.textContent.includes('Security Deposit') || el.textContent.includes('เงินมัดจำ')
      );
      if (depositElements.length > 0) {
        const depositParent = depositElements[0].parentElement;
        const depositValueEl = depositParent?.querySelector('p.font-medium');
        if (depositValueEl) {
          console.log('--- DEPOSIT DOM ---');
          console.log('innerText:', depositValueEl.innerText);
          console.log('innerHTML:', depositValueEl.innerHTML);
          console.log('textContent:', depositValueEl.textContent);
          console.log('Child nodes:', depositValueEl.childNodes.length);
          depositValueEl.childNodes.forEach((node, i) => {
            console.log(`  Node ${i}:`, node.nodeType, node.nodeName, node.nodeValue || node.textContent);
          });
          console.log('::before:', window.getComputedStyle(depositValueEl, '::before').content);
          console.log('::after:', window.getComputedStyle(depositValueEl, '::after').content);
        }
      }
      
      console.log('=== END AUTO DEBUG ===');
    }, 500);
  }, [lease]);

  const handleToggleAlerts = async (enabled) => {
    haptic.light();
    try {
      await updateLeaseMutation.mutateAsync({
        notice_alerts_enabled: enabled
      });
      toast.success(language === 'th' ? 'อัปเดตสำเร็จ' : 'Updated successfully');
      haptic.success();
    } catch (error) {
      toast.error(language === 'th' ? 'อัปเดตล้มเหลว' : 'Update failed');
      haptic.error();
    }
  };

  const handleSaveNoticeSettings = async () => {
    if (!lease.end_date || !noticeSettings.notice_period_days) {
      toast.error(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill in all fields');
      haptic.error();
      return;
    }

    haptic.medium();
    const endDate = new Date(lease.end_date);
    const deadline = new Date(endDate);
    deadline.setDate(deadline.getDate() - noticeSettings.notice_period_days);

    try {
      await updateLeaseMutation.mutateAsync({
        notice_period_days: noticeSettings.notice_period_days,
        notice_deadline: deadline.toISOString().split('T')[0]
      });
      toast.success(language === 'th' ? 'บันทึกสำเร็จ' : 'Saved successfully');
      haptic.success();
    } catch (error) {
      toast.error(language === 'th' ? 'บันทึกล้มเหลว' : 'Save failed');
      haptic.error();
    }
  };

  const handleEditNotice = () => {
    haptic.light();
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
      <div className="min-h-screen p-6 page-transition" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-5xl mx-auto">
          <SkeletonLoader variant="card" count={3} isDarkMode={isDarkMode} />
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="min-h-screen p-6 page-transition" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-5xl mx-auto">
          <PageHeader
            title={strings.notFound}
            subtitle={language === 'th' ? 'ไม่พบสัญญาเช่าที่คุณกำลังมองหา' : 'The lease you\'re looking for doesn\'t exist'}
            icon={FileText}
            iconColor="#EF4444"
            showBack={true}
            isDarkMode={isDarkMode}
          />
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-0">
              <EmptyState
                icon={FileText}
                title={strings.notFound}
                description={language === 'th' ? 'หรืออาจถูกลบไปแล้ว' : 'or may have been deleted'}
                actionLabel={strings.backToLeases}
                onAction={() => navigate(createPageUrl("UploadScan"))}
                isDarkMode={isDarkMode}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 page-transition" style={{ backgroundColor: colors.bg }}>
      {/* CSS KILL-SWITCH: Remove any injected $ from pseudo-elements or icons */}
      <style>{`
        .currency-value-no-symbol::before,
        .currency-value-no-symbol::after {
          content: '' !important;
          display: none !important;
        }
        
        .currency-value-no-symbol svg {
          display: none !important;
        }
        
        /* Kill any $ DollarSign icon that might be rendered */
        .currency-value-no-symbol [data-lucide="dollar-sign"] {
          display: none !important;
        }
      `}</style>
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title={strings.leaseDetails}
          subtitle={lease.property_address || ''}
          icon={FileText}
          iconColor="#0C3B2E"
          showBack={true}
          isDarkMode={isDarkMode}
        />

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
              <div className="sm:col-span-2">
                <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                  {strings.propertyAddress}
                </p>
                <p className="font-medium" style={{ 
                  color: colors.textPrimary,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  lineHeight: '1.5'
                }}>
                  {propertyAddress}
                </p>
              </div>

              {lease.rent_amount && (
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                    {strings.monthlyRent}
                  </p>
                  <p className="font-medium text-lg currency-value-no-symbol" style={{ color: colors.textPrimary }}>
                    ฿{formatCurrency(lease.rent_amount)}
                  </p>
                </div>
              )}

              {lease.deposit_amount && (
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                    {strings.securityDeposit}
                  </p>
                  <p className="font-medium text-lg currency-value-no-symbol" style={{ color: colors.textPrimary }}>
                    ฿{formatCurrency(lease.deposit_amount)}
                  </p>
                </div>
              )}

              {lease.start_date && lease.end_date && (
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                    {strings.leasePeriod}
                  </p>
                  <p className="font-medium" style={{ 
                    color: colors.textPrimary,
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                  }}>
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
                  <Button variant="outline" size="sm" onClick={handleEditNotice} className="w-full sm:w-auto btn-interaction">
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
                    onClick={() => {
                      haptic.light();
                      setEditingNotice(false);
                    }}
                    className="flex-1 w-full btn-interaction"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {strings.cancel}
                  </Button>
                  <Button
                    onClick={handleSaveNoticeSettings}
                    disabled={updateLeaseMutation.isLoading}
                    className="flex-1 w-full bg-ls-forest hover:bg-ls-forest/90 btn-interaction"
                  >
                    {updateLeaseMutation.isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
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
                      style={{ color: getRiskColor(scan.risk_score || scan.scan_preview?.risk_score || scan.scan_full?.risk_score || 0) }}
                    >
                      {scan.risk_score || scan.scan_preview?.risk_score || scan.scan_full?.risk_score || 0}
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
                    style={{
                      backgroundColor: isDarkMode ? colors.cardBg : '#FFFFFF',
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    <span className="text-xs md:text-sm">{strings.viewScanResults}</span>
                  </Button>
                  <Button
                    onClick={() => navigate(createPageUrl("ReportFull") + `?scanId=${scan.id}&leaseId=${lease.id}`)}
                    className="w-full sm:w-auto bg-ls-forest hover:bg-ls-forest/90 text-white font-semibold"
                    size="sm"
                    style={{
                      backgroundColor: '#0C3B2E',
                      color: '#FFFFFF'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#0a2f25';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#0C3B2E';
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" style={{ color: '#FFFFFF' }} />
                    <span className="text-xs md:text-sm font-bold" style={{ color: '#FFFFFF' }}>{strings.viewFullReport}</span>
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

              {/* Missing Critical Clauses Detection - Phase 1 */}
              {scan.scan_full?.missingCriticalClauses && (
                <MissingCriticalClauses
                  missingCriticalClauses={scan.scan_full.missingCriticalClauses}
                  language={language}
                  isDarkMode={isDarkMode}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* DEBUG BUTTON - TEMPORARY */}
        <Card className="mb-4 md:mb-6 border-2 border-red-500" style={{ backgroundColor: '#FEE2E2' }}>
          <CardContent className="p-4">
            <Button
              onClick={() => {
                console.log('=== CURRENCY DEBUG INSPECTION ===');
                
                // Find rent value element
                const rentLabels = Array.from(document.querySelectorAll('p')).filter(el => 
                  el.textContent.includes('Monthly Rent') || el.textContent.includes('ค่าเช่ารายเดือน')
                );
                
                if (rentLabels.length > 0) {
                  const rentContainer = rentLabels[0].parentElement;
                  const rentValueEl = rentContainer.querySelector('p.font-medium');
                  
                  console.log('--- RENT VALUE INSPECTION ---');
                  console.log('Tag:', rentValueEl?.tagName);
                  console.log('ClassName:', rentValueEl?.className);
                  console.log('textContent:', rentValueEl?.textContent);
                  console.log('innerText:', rentValueEl?.innerText);
                  console.log('innerHTML:', rentValueEl?.innerHTML);
                  console.log('outerHTML:', rentValueEl?.outerHTML);
                  
                  // Check all child nodes
                  console.log('Child nodes count:', rentValueEl?.childNodes.length);
                  rentValueEl?.childNodes.forEach((node, idx) => {
                    console.log(`  Child ${idx}:`, {
                      nodeType: node.nodeType,
                      nodeName: node.nodeName,
                      nodeValue: node.nodeValue,
                      textContent: node.textContent,
                      outerHTML: node.outerHTML || 'N/A (text node)'
                    });
                  });
                  
                  console.log('Parent outerHTML:', rentContainer?.outerHTML);
                  console.log('Computed ::before:', window.getComputedStyle(rentValueEl, '::before').content);
                  console.log('Computed ::after:', window.getComputedStyle(rentValueEl, '::after').content);
                }
                
                // Find deposit value element
                const depositLabels = Array.from(document.querySelectorAll('p')).filter(el => 
                  el.textContent.includes('Security Deposit') || el.textContent.includes('เงินมัดจำ')
                );
                
                if (depositLabels.length > 0) {
                  const depositContainer = depositLabels[0].parentElement;
                  const depositValueEl = depositContainer.querySelector('p.font-medium');
                  
                  console.log('--- DEPOSIT VALUE INSPECTION ---');
                  console.log('Tag:', depositValueEl?.tagName);
                  console.log('ClassName:', depositValueEl?.className);
                  console.log('textContent:', depositValueEl?.textContent);
                  console.log('innerText:', depositValueEl?.innerText);
                  console.log('innerHTML:', depositValueEl?.innerHTML);
                  console.log('outerHTML:', depositValueEl?.outerHTML);
                  
                  // Check all child nodes
                  console.log('Child nodes count:', depositValueEl?.childNodes.length);
                  depositValueEl?.childNodes.forEach((node, idx) => {
                    console.log(`  Child ${idx}:`, {
                      nodeType: node.nodeType,
                      nodeName: node.nodeName,
                      nodeValue: node.nodeValue,
                      textContent: node.textContent,
                      outerHTML: node.outerHTML || 'N/A (text node)'
                    });
                  });
                  
                  console.log('Parent outerHTML:', depositContainer?.outerHTML);
                  console.log('Computed ::before:', window.getComputedStyle(depositValueEl, '::before').content);
                  console.log('Computed ::after:', window.getComputedStyle(depositValueEl, '::after').content);
                }
                
                console.log('=== END DEBUG ===');
                alert('Debug info logged to console. Check browser console (F12).');
              }}
              className="w-full bg-red-600 text-white font-bold"
            >
              🔍 DEBUG CURRENCY (Check Console)
            </Button>
            <p className="text-xs text-red-800 mt-2 font-mono">
              Build: 2026-01-01-16:30 | Tap button and check console for $ source
            </p>
          </CardContent>
        </Card>

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
                  onClick={() => openDocument(lease.file_url)}
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

              <Button
                variant="outline"
                onClick={async () => {
                  if (!confirm(language === 'th' 
                    ? 'ลบสัญญาเช่านี้?\n\n⚠️ จะลบถาวร:\n• สัญญาเช่าและการวิเคราะห์\n• บันทึกการติดตามเงินมัดจำ\n• ตารางค่าเช่า\n• เหตุการณ์ไทม์ไลน์\n• ข้อมูลที่เกี่ยวข้องทั้งหมด\n\nไม่สามารถยกเลิกได้'
                    : 'Delete this lease?\n\n⚠️ This will permanently remove:\n• Lease agreement and analysis\n• Deposit tracking records\n• Rent schedules\n• Timeline events\n• All related data\n\nThis action cannot be undone.')) {
                    return;
                  }
                  
                  haptic.heavy();
                  
                  try {
                    const response = await base44.functions.invoke('deleteLease', { leaseId: lease.id });
                    
                    if (response?.data?.success) {
                      console.log('[DELETE_SUCCESS]', response.data);
                      
                      // Invalidate all queries
                      await queryClient.invalidateQueries({ queryKey: ['leases'] });
                      await queryClient.invalidateQueries({ queryKey: ['deposits'] });
                      await queryClient.invalidateQueries({ queryKey: ['maintenance'] });
                      await queryClient.invalidateQueries({ queryKey: ['timelineEvents'] });
                      await queryClient.invalidateQueries({ queryKey: ['allScans'] });
                      
                      haptic.success();
                      navigate(createPageUrl("Dashboard"));
                    }
                  } catch (error) {
                    console.error('[DELETE_ERROR]', error);
                    haptic.error();
                    alert(language === 'th' ? 'ไม่สามารถลบสัญญาเช่าได้' : 'Failed to delete lease');
                  }
                }}
                className="justify-start h-auto py-4 border-red-600 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">{language === 'th' ? 'ลบสัญญาเช่านี้' : 'Delete This Lease'}</div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'ลบอย่างถาวร' : 'Permanently delete'}
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

                  {/* Build marker for verification */}
                  <div className="mt-6 text-center p-4 bg-yellow-100 border-2 border-yellow-500 rounded">
                    <p className="text-sm font-bold text-yellow-900 font-mono">
                      ⚡ BUILD: 2026-01-01 16:45 UTC | Auto-Debug Active
                    </p>
                    <p className="text-xs text-yellow-800 mt-1">
                      Check browser console (F12) for automatic $ source detection
                    </p>
                  </div>
                  </div>
                  </div>
                  );
                  }

                  export default function LeaseDetails() {
                    return (
                      <AuthGuard>
                        <ToastProvider>
                          <LeaseDetailsContent />
                        </ToastProvider>
                      </AuthGuard>
                    );
                  }