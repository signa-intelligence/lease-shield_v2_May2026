import React, { useState } from "react";
import { openDocument } from "@/components/shared/openDocument";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Info,
  AlertCircle,
  FileText,
  ArrowLeft,
  ExternalLink,
  Download,
  Loader2,
  RefreshCw,
  Wallet,
  ArrowRight,
  Sparkles
} from "lucide-react";
import AuthGuard from "../components/shared/AuthGuard";
import { haptic } from "../components/shared/HapticFeedback";
import SkeletonLoader from "../components/shared/SkeletonLoader";
import EmptyState from "../components/shared/EmptyState";
import { useFeatureAccess } from "../components/shared/FeatureGate";

const SEVERITY_CONFIG = {
  low: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Low' },
  medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'High' },
  critical: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Critical' }
};

function ScanPreviewContent() {
  const navigate = useNavigate();
  const [showDepositTrackerPrompt, setShowDepositTrackerPrompt] = useState(false);
  const [error, setError] = useState(null);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const urlParams = new URLSearchParams(window.location.search);
  const scanId = urlParams.get('scanId');
  const leaseId = urlParams.get('leaseId');

  // DEV LOGGING: Check params received
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.log('[ScanPreview] Route params:', { scanId, leaseId });
  }

  const { data: leaseResults, isLoading: leaseLoading, error: leaseError } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: async () => {
      if (!leaseId) return null;
      const results = await base44.entities.Lease.filter({ id: leaseId });
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.log('[ScanPreview] Lease fetch result:', { count: results?.length, exists: !!results?.[0] });
      }
      return results;
    },
    enabled: !!leaseId,
    retry: 1
  });

  const { data: scans, isLoading: scansLoading, error: scansError } = useQuery({
    queryKey: ['scans'],
    queryFn: async () => {
      const allScans = await base44.entities.LeaseScan.list();
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.log('[ScanPreview] Scans fetched:', { total: allScans?.length });
      }
      return allScans;
    },
    enabled: !!user,
    retry: 1
  });

  // Check if user has deposits tracked
  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { hasAccess: hasFullReportAccess } = useFeatureAccess('full_report');

  const relevantLease = leaseResults && leaseResults.length > 0 ? leaseResults[0] : null;
  const scan = scans?.find(s => s.id === scanId) || scans?.find(s => s.lease_id === leaseId);

  // DEV LOGGING: Check data presence
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.log('[ScanPreview] Data resolved:', { 
      hasLease: !!relevantLease, 
      hasScan: !!scan, 
      scanRiskScore: scan?.risk_score 
    });
  }

  const isLoading = userLoading || leaseLoading || scansLoading;
  const hasError = leaseError || scansError;

  const lease = relevantLease;

  const hasDepositForLease = deposits.some(d => {
    if (d.property_address && lease?.property_address && 
        d.property_address !== 'N/A' && lease.property_address !== 'N/A') {
      return d.property_address === lease.property_address;
    }
    
    if (lease?.deposit_amount && d.deposit_amount === lease.deposit_amount) {
      return true;
    }
    
    return false;
  });

  const shouldShowTrackDepositCard = lease?.deposit_amount && lease.deposit_amount > 0 && !hasDepositForLease;

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const userTier = user?.plan_tier || 'free';

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: isDarkMode ? '#1A1D1F' : '#F9FAFB' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#0C3B2E' }} />
            <p className="text-lg font-semibold" style={{ color: isDarkMode ? '#ECEFED' : '#1A1D1F' }}>
              {language === 'th' ? 'กำลังโหลด...' : language === 'ru' ? 'Загрузка...' : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (hasError || !leaseId || !scanId) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: isDarkMode ? '#1A1D1F' : '#F9FAFB' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-16 h-16 mb-4 text-red-600" />
            <h2 className="text-xl font-bold mb-2" style={{ color: isDarkMode ? '#ECEFED' : '#1A1D1F' }}>
              {language === 'th' ? 'เกิดข้อผิดพลาด' : language === 'ru' ? 'Произошла ошибка' : 'Error Loading Scan'}
            </h2>
            <p className="text-sm mb-6 text-center" style={{ color: isDarkMode ? '#A8ABAD' : '#64748b' }}>
              {language === 'th' 
                ? 'ไม่พบข้อมูลการสแกน กรุณาลองอีกครั้ง' 
                : language === 'ru'
                  ? 'Данные сканирования не найдены. Пожалуйста, попробуйте снова.'
                  : 'Scan data not found. Please try again.'}
            </p>
            <Button
              onClick={() => {
                haptic.medium();
                navigate(createPageUrl("UploadScan"));
              }}
              style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'th' ? 'กลับไปยังหน้าสแกน' : language === 'ru' ? 'Вернуться к сканированию' : 'Back to Scan Your Lease'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // DATA NOT READY STATE
  if (!relevantLease || !scan) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: isDarkMode ? '#1A1D1F' : '#F9FAFB' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-16 h-16 mb-4 text-amber-600" />
            <h2 className="text-xl font-bold mb-2" style={{ color: isDarkMode ? '#ECEFED' : '#1A1D1F' }}>
              {language === 'th' ? 'ผลการสแกนยังไม่พร้อม' : language === 'ru' ? 'Результаты еще не готовы' : 'Scan Results Not Ready'}
            </h2>
            <p className="text-sm mb-6 text-center" style={{ color: isDarkMode ? '#A8ABAD' : '#64748b' }}>
              {language === 'th' 
                ? 'การวิเคราะห์กำลังดำเนินการ กรุณารอสักครู่' 
                : language === 'ru'
                  ? 'Анализ в процессе. Пожалуйста, подождите.'
                  : 'Analysis in progress. Please wait a moment.'}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  haptic.light();
                  // Manual refresh via React Query invalidation instead of hard reload
                  navigate(0);
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {language === 'th' ? 'รีเฟรช' : language === 'ru' ? 'Обновить' : 'Retry'}
              </Button>
              <Button
                onClick={() => {
                  haptic.medium();
                  navigate(createPageUrl("UploadScan"));
                }}
                style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'th' ? 'กลับ' : language === 'ru' ? 'Назад' : 'Back'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  const t = {
    en: {
      backToScans: "Back to Scans",
      riskScore: "Risk Score",
      summary: "Summary",
      topIssues: "Top Issues Found",
      allIssues: "All Issues Found",
      viewFullReport: "View Full Report",
      viewLease: "View Lease",
      lowRisk: "Low Risk",
      moderateRisk: "Moderate Risk",
      highRisk: "High Risk",
      criticalRisk: "Critical Risk",
      loading: "Loading scan results...",
      noScanFound: "Scan not found",
      noScanDesc: "The scan you're looking for could not be found.",
      nextStep: "✅ Next Step",
      nextStepTitle: "Protect Your Deposit",
      nextStepDesc: "Now that your lease is scanned, track your security deposit to ensure it's returned on time.",
      trackDeposit: "Track Deposit Now",
      depositTracked: "Deposit Already Tracked",
      viewDeposits: "View Deposits",
      depositAmount: "Security Deposit",
      leaseScanned: "Lease Analysed Successfully!",
      upgradeToUnlock: "Upgrade to Unlock",
      upgradeNow: "Upgrade Now",
      back: "Back"
    },
    th: {
      backToScans: "กลับไปที่การสแกน",
      riskScore: "คะแนนความเสี่ยง",
      summary: "สรุป",
      topIssues: "ปัญหาสำคัญที่พบ",
      allIssues: "ปัญหาทั้งหมดที่พบ",
      viewFullReport: "ดูรายงานฉบับเต็ม",
      viewLease: "ดูสัญญาเช่า",
      lowRisk: "ความเสี่ยงต่ำ",
      moderateRisk: "ความเสี่ยงปานกลาง",
      highRisk: "ความเสี่ยงสูง",
      criticalRisk: "ความเสี่ยงวิกฤต",
      loading: "กำลังโหลดผลการสแกน...",
      noScanFound: "ไม่พบการสแกน",
      noScanDesc: "ไม่พบการสแกนที่คุณกำลังมองหา",
      nextStep: "✅ ขั้นตอนถัดไป",
      nextStepTitle: "ปกป้องเงินมัดจำ",
      nextStepDesc: "ตอนนี้สัญญาเช่าของคุณสแกนแล้ว ติดตามเงินมัดจำเพื่อให้แน่ใจว่าจะได้รับคืนตรงเวลา",
      trackDeposit: "ติดตามเงินมัดจำตอนนี้",
      depositTracked: "ติดตามเงินมัดจำแล้ว",
      viewDeposits: "ดูเงินมัดจำ",
      depositAmount: "เงินมัดจำ",
      leaseScanned: "วิเคราะห์สัญญาเช่าสำเร็จ!",
      upgradeToUnlock: "อัปเกรดเพื่อปลดล็อค",
      upgradeNow: "อัปเกรดตอนนี้",
      back: "กลับ"
    }
  };

  const strings = t[language] || t.en;

  const getRiskLevel = (score) => {
    if (score >= 80) return { level: 'critical', label: language === 'th' ? 'ความเสี่ยงวิกฤต' : language === 'ru' ? 'Критический риск' : 'CRITICAL RISK', color: '#991B1B', bg: '#FECACA' };
    if (score >= 61) return { level: 'high', label: language === 'th' ? 'ความเสี่ยงสูง' : language === 'ru' ? 'Высокий риск' : 'HIGH RISK', color: '#DC2626', bg: '#FEE2E2' };
    if (score >= 31) return { level: 'medium', label: language === 'th' ? 'ความเสี่ยงปานกลาง' : language === 'ru' ? 'Средний риск' : 'MEDIUM RISK', color: '#F97316', bg: '#FFEDD5' };
    return { level: 'low', label: language === 'th' ? 'ความเสี่ยงต่ำ' : language === 'ru' ? 'Низкий риск' : 'LOW RISK', color: '#10B981', bg: '#D1FAE5' };
  };

  const riskLevel = scan ? getRiskLevel(scan.risk_score) : null;

  // A scan run at full depth (including the promotional free full scan) is not
  // truncated for free tier. Lite remains capped at 5 by tier entitlement.
  const isFullScan = scan?.scan_full?.preview_mode === false;

  const getDisplayFlags = () => {
    const allFlags = scan?.flags || [];
    
    if (userTier === 'lite') {
      return allFlags.slice(0, 5);
    }
    
    if (userTier === 'free' && !isFullScan) {
      return allFlags.slice(0, 4);
    }
    
    return allFlags;
  };

  const displayFlags = getDisplayFlags();
  const totalFlags = scan?.flags?.length || 0;
  const hasMoreIssues = displayFlags.length < totalFlags;
  const hiddenCount = totalFlags - displayFlags.length;

  return (
    <div className="min-h-screen p-4 md:p-6 page-transition" style={{ backgroundColor: colors.bg, paddingBottom: '180px' }}>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => {
            haptic.light();
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate(createPageUrl("UploadScan"));
            }
          }}
          className="mb-6 btn-interaction"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {strings.backToScans}
        </Button>

        {/* Risk-Aware Next Step Card */}
        {(() => {
          const isHighRisk = riskLevel?.level === 'high';
          const isMediumRisk = riskLevel?.level === 'medium';
          const isLowRisk = riskLevel?.level === 'low';
          
          // HIGH RISK: Urgent action required
          if (isHighRisk) {
            return (
              <Card 
                className="mb-6 border-none shadow-xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  animation: 'slideDown 0.5s ease-out'
                }}
              >
                <style>
                  {`
                    @keyframes slideDown {
                      from { opacity: 0; transform: translateY(-20px); }
                      to { opacity: 1; transform: translateY(0); }
                    }
                  `}
                </style>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {language === 'th' ? '⚠️ ความเสี่ยงสูง — ดำเนินการก่อนเซ็น' : 'High Risk — Act Before You Sign'}
                      </h3>
                      <p className="text-white/90 mb-4 text-sm leading-relaxed">
                        {language === 'th' 
                          ? 'สัญญานี้มีข้อกำหนดที่เอื้อประโยชน์ต่อเจ้าของบ้านอย่างมาก ตรวจสอบความเสี่ยงและสร้างจดหมายเจรจาก่อนเซ็น'
                          : 'This lease contains clauses that may heavily favour the landlord. Review the risks and generate a negotiation letter before signing.'}
                      </p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            haptic.medium();
                            window.scrollTo({ top: 600, behavior: 'smooth' });
                          }}
                          className="btn-interaction"
                          style={{
                            width: '100%',
                            backgroundColor: '#FFFFFF',
                            color: '#DC2626',
                            padding: '14px 20px',
                            borderRadius: '10px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <AlertTriangle className="w-5 h-5" />
                          <span>{language === 'th' ? 'ตรวจสอบความเสี่ยง' : 'Review Risks'}</span>
                        </button>
                        <button
                          onClick={() => {
                            haptic.medium();
                            navigate(createPageUrl("Templates"));
                          }}
                          className="btn-interaction"
                          style={{
                            width: '100%',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: '#FFFFFF',
                            padding: '12px 20px',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '600',
                            border: '2px solid rgba(255,255,255,0.4)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <FileText className="w-4 h-4" />
                          <span>{language === 'th' ? 'ดูเทมเพลตจดหมาย' : 'View Letter Templates'}</span>
                        </button>
                        {shouldShowTrackDepositCard && (
                          <button
                            onClick={() => {
                              haptic.light();
                              navigate(createPageUrl("PropertyTracker"));
                            }}
                            style={{
                              width: '100%',
                              backgroundColor: 'transparent',
                              color: 'rgba(255,255,255,0.8)',
                              padding: '8px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '13px',
                              textDecoration: 'underline'
                            }}
                          >
                            {language === 'th' ? 'หรือติดตามเงินมัดจำ →' : 'Or track deposit →'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }
          
          // MEDIUM RISK: Balanced guidance
          if (isMediumRisk) {
            return (
              <Card 
                className="mb-6 border-none shadow-xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  animation: 'slideDown 0.5s ease-out'
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Info className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {language === 'th' ? '📋 ขั้นตอนถัดไป' : '📋 Next Step'}
                      </h3>
                      <p className="text-white/90 mb-4 text-sm leading-relaxed">
                        {language === 'th' 
                          ? 'สัญญานี้มีความเสี่ยงปานกลาง ตรวจสอบคำแนะนำและติดตามเงินมัดจำ'
                          : 'This lease has moderate risk. Review recommendations and track your deposit.'}
                      </p>
                      <div className="flex flex-col gap-2">
                        <button
                          disabled={isLoading}
                          onClick={() => {
                            if (isLoading) return;
                            haptic.medium();
                            navigate(createPageUrl("ReportFull") + `?scanId=${scan.id}`);
                          }}
                          className="btn-interaction"
                          style={{
                            width: '100%',
                            backgroundColor: '#FFFFFF',
                            color: '#D97706',
                            padding: '14px 20px',
                            borderRadius: '10px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <FileText className="w-5 h-5" />
                          <span>{language === 'th' ? 'ดูคำแนะนำ' : 'Review Recommendations'}</span>
                        </button>
                        {shouldShowTrackDepositCard && (
                          <button
                            onClick={() => {
                              haptic.medium();
                              navigate(createPageUrl("PropertyTracker"));
                            }}
                            className="btn-interaction"
                            style={{
                              width: '100%',
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              color: '#FFFFFF',
                              padding: '12px 20px',
                              borderRadius: '10px',
                              fontSize: '14px',
                              fontWeight: '600',
                              border: '2px solid rgba(255,255,255,0.4)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}
                          >
                            <Wallet className="w-4 h-4" />
                            <span>{language === 'th' ? 'ติดตามเงินมัดจำ' : 'Track Deposit'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }
          
          // LOW RISK: Focus on deposit tracking (existing green card)
          if (isLowRisk && shouldShowTrackDepositCard) {
            return (
              <Card 
                className="mb-6 border-none shadow-xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  animation: 'slideDown 0.5s ease-out'
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{strings.nextStep}</h3>
                      <p className="text-white/90 mb-2 text-base">
                        {strings.nextStepDesc}
                      </p>
                      <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
                        <Wallet className="w-4 h-4" />
                        <span className="font-semibold">{strings.depositAmount}:</span>
                        <span className="text-lg font-bold">฿{lease.deposit_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            haptic.medium();
                            navigate(createPageUrl("PropertyTracker"));
                          }}
                          className="btn-interaction"
                          style={{
                            width: '100%',
                            backgroundColor: '#FFFFFF',
                            color: '#10B981',
                            padding: '14px 24px',
                            borderRadius: '10px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <Wallet className="w-5 h-5" />
                          <span>{strings.trackDeposit}</span>
                          <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                          disabled={isLoading}
                          onClick={() => {
                            if (isLoading) return;
                            haptic.light();
                            navigate(createPageUrl("ReportFull") + `?scanId=${scan.id}`);
                          }}
                          style={{
                            width: '100%',
                            backgroundColor: 'transparent',
                            color: 'rgba(255,255,255,0.9)',
                            padding: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '13px',
                            textDecoration: 'underline'
                          }}
                        >
                          {language === 'th' ? 'หรือดูรายงานฉบับเต็ม →' : 'Or view full report →'}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }
          
          return null;
        })()}

        {hasDepositForLease && lease?.deposit_amount > 0 && (
          <Card 
            className="mb-6 border-none shadow-xl"
            style={{
              backgroundColor: isDarkMode ? '#1E3A2E' : '#ECFDF5',
              borderLeft: '4px solid #10B981'
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                      {strings.depositTracked}
                    </p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {language === 'th' ? 'คุณกำลังติดตามเงินมัดจำสำหรับทรัพย์สินนี้แล้ว' : 'You\'re already tracking the deposit for this property'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(createPageUrl("PropertyTracker"))}
                  style={{
                    borderColor: '#10B981',
                    color: '#10B981'
                  }}
                >
                  {strings.viewDeposits}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader className="border-b" style={{ backgroundColor: riskLevel?.color || '#10B981' }}>
            <div className="text-white">
              <CardTitle className="text-2xl font-bold mb-3">{strings.riskScore}</CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="text-2xl px-4 py-2 font-bold" style={{
                  backgroundColor: riskLevel?.bg || '#D1FAE5',
                  color: riskLevel?.color || '#10B981',
                  border: `2px solid ${riskLevel?.color || '#10B981'}`
                }}>
                  {scan.risk_score}/100
                </Badge>
                <Badge className="text-lg px-4 py-2 font-bold flex items-center gap-2" style={{
                  backgroundColor: '#FFFFFF',
                  color: riskLevel?.color || '#10B981'
                }}>
                  {riskLevel?.level === 'high' && <AlertTriangle className="w-5 h-5" />}
                  {riskLevel?.label || 'LOW RISK'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          {riskLevel?.level === 'high' && (
            <div className="px-6 pt-4">
              <div className="p-3 rounded-lg border-l-4" style={{
                backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2',
                borderLeftColor: '#EF4444'
              }}>
                <p className="text-sm font-semibold" style={{ color: isDarkMode ? '#FCA5A5' : '#DC2626' }}>
                  {language === 'th' 
                    ? 'ความเสี่ยงสูง: สัญญานี้มีข้อกำหนดที่เอื้อประโยชน์ต่อเจ้าของบ้านอย่างมาก ตรวจสอบก่อนเซ็น'
                    : language === 'ru'
                      ? 'Высокий риск: этот договор содержит условия, которые сильно благоприятствуют арендодателю. Проверьте перед подписанием.'
                      : 'High risk: this lease contains clauses that heavily favour the landlord. Review before signing.'}
                </p>
              </div>
            </div>
          )}
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-2" style={{ color: colors.textPrimary }}>{strings.summary}</h3>
            <p style={{ color: colors.textSecondary }}>{scan.summary}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              {userTier === 'lite' 
                ? `${language === 'th' ? 'ปัญหาสำคัญ 5 อันดับแรก' : 'Top 5 Issues'} (${Math.min(5, totalFlags)})`
                : ((hasFullReportAccess || isFullScan)
                    ? `${strings.allIssues} (${displayFlags.length})`
                    : `${strings.topIssues} (${displayFlags.length})`)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayFlags.map((flag, idx) => {
              const severityConfig = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.medium;
              return (
                <div key={idx} className="p-4 rounded-xl border-2" style={{
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB'
                }}>
                  <div className="flex items-start justify-between mb-2 gap-2 flex-wrap">
                    <Badge className={`${severityConfig.color} border`}>
                      {severityConfig.label}
                    </Badge>
                    {flag.category && (
                      <Badge variant="outline">{flag.category}</Badge>
                    )}
                  </div>
                  <p className="text-base font-semibold" style={{ 
                    color: colors.textPrimary,
                    wordBreak: 'break-word'
                  }}>{flag.description}</p>
                </div>
              );
            })}

            {hasMoreIssues && (
              <div className="p-6 rounded-xl border-2" style={{
                backgroundColor: isDarkMode ? '#1E3A2E' : '#F0FDF4',
                borderColor: '#0C3B2E'
              }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{
                    backgroundColor: '#0C3B2E'
                  }}>
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold mb-2" style={{ color: colors.textPrimary }}>
                      {language === 'th' 
                        ? `เหลืออีก ${hiddenCount} ปัญหา` 
                        : `${hiddenCount} More Issue${hiddenCount > 1 ? 's' : ''} Found`}
                    </h4>
                    <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                      {userTier === 'lite'
                        ? (language === 'th' 
                            ? 'อัปเกรดเป็น Protect หรือ Secure เพื่อดูรายงานฉบับเต็มพร้อมคำแนะนำโดยละเอียด'
                            : 'Upgrade to Protect or Secure to view full report with detailed recommendations')
                        : (language === 'th' 
                            ? 'อัปเกรดเป็น Lite, Protect หรือ Secure เพื่อดูรายงานฉบับเต็มพร้อมคำแนะนำโดยละเอียด'
                            : 'Upgrade to Lite, Protect, or Secure to view full report with detailed recommendations')}
                    </p>
                    <button
                      onClick={() => {
                        haptic.medium();
                        navigate(createPageUrl("Account") + '#plans');
                      }}
                      className="btn-interaction"
                      style={{
                        width: '100%',
                        backgroundColor: '#0C3B2E',
                        color: '#FFFFFF',
                        padding: '14px 24px',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 6px rgba(12, 59, 46, 0.3)',
                        marginBottom: '12px',
                        minHeight: '52px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#0a2f25';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 10px rgba(12, 59, 46, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#0C3B2E';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 6px rgba(12, 59, 46, 0.3)';
                      }}
                    >
                      <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        {language === 'th' ? 'อัปเกรดตอนนี้' : 'Upgrade Now'}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        haptic.light();
                        navigate(-1);
                      }}
                      className="btn-interaction"
                      style={{
                        width: '100%',
                        backgroundColor: 'transparent',
                        color: colors.textPrimary,
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: `2px solid ${colors.borderColor}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        minHeight: '48px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = colors.bg;
                        e.target.style.borderColor = '#0C3B2E';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.borderColor = colors.borderColor;
                      }}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{strings.back}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fixed Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30" style={{
          backgroundColor: isDarkMode ? '#1A1D1F' : '#FFFFFF',
          borderTop: `2px solid ${isDarkMode ? '#3A3D40' : '#E5E7EB'}`,
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
          paddingBottom: 'calc(76px + env(safe-area-inset-bottom, 0px))'
        }}>
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                disabled={isLoading}
                onClick={() => {
                  if (isLoading) return;
                  haptic.medium();
                  navigate(createPageUrl("ReportFull") + `?scanId=${scan.id}`);
                }}
                className="btn-interaction"
                style={{
                  flex: 1,
                  backgroundColor: '#0C3B2E',
                  color: '#FFFFFF',
                  padding: '16px 24px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(12, 59, 46, 0.3), 0 2px 4px -1px rgba(12, 59, 46, 0.2)',
                  minHeight: '56px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#0a2f25';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 10px -1px rgba(12, 59, 46, 0.4), 0 4px 6px -1px rgba(12, 59, 46, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#0C3B2E';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(12, 59, 46, 0.3), 0 2px 4px -1px rgba(12, 59, 46, 0.2)';
                }}
              >
                <FileText className="w-5 h-5" />
                <span style={{ fontSize: '16px', fontWeight: '700' }}>{strings.viewFullReport}</span>
              </button>
              {lease.file_url && (
                <button
                  onClick={() => openDocument(lease.file_url)}
                  style={{
                    flex: 1,
                    backgroundColor: isDarkMode ? '#2A2D30' : '#FFFFFF',
                    color: '#0C3B2E',
                    padding: '16px 24px',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    border: '3px solid #0C3B2E',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    minHeight: '56px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#0C3B2E';
                    e.target.style.color = '#FFFFFF';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(12, 59, 46, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = isDarkMode ? '#2A2D30' : '#FFFFFF';
                    e.target.style.color = '#0C3B2E';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  <ExternalLink className="w-5 h-5" />
                  <span style={{ fontSize: '16px', fontWeight: '700' }}>{strings.viewLease}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScanPreview() {
  return (
    <AuthGuard>
      <ScanPreviewContent />
    </AuthGuard>
  );
}