
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, FileText, ArrowLeft, ExternalLink, Loader2, Wallet, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useFeatureAccess } from "../components/shared/FeatureGate";

const SEVERITY_CONFIG = {
  low: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Low' },
  medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'High' },
  critical: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Critical' }
};

export default function ScanPreview() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const scanId = urlParams.get('scanId');
  const leaseId = urlParams.get('leaseId');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: leases = [], isLoading: leasesLoading } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: allScans = [], isLoading: scansLoading } = useQuery({
    queryKey: ['allScans'],
    queryFn: () => base44.entities.LeaseScan.list(),
    enabled: !!user && leases.length > 0,
  });

  // Check if user has deposits tracked
  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { hasAccess: hasFullReportAccess } = useFeatureAccess('full_report');

  const scan = allScans.find(s => {
    if (scanId) return s.id === scanId;
    if (leaseId) return s.lease_id === leaseId;
    return false;
  });

  const lease = leases.find(l => {
    if (leaseId) return l.id === leaseId;
    if (scan) return l.id === scan.lease_id;
    return false;
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const userTier = user?.plan_tier || 'free';

  // FIXED: Better logic to check if deposit is tracked
  // Check by: 1) matching property address (if exists), OR 2) deposit amount matches
  const hasDepositForLease = deposits.some(d => {
    // Match by property address if both exist and are not "N/A"
    if (d.property_address && lease?.property_address && 
        d.property_address !== 'N/A' && lease.property_address !== 'N/A') {
      return d.property_address === lease.property_address;
    }
    
    // Fallback: Match by deposit amount if lease has one
    if (lease?.deposit_amount && d.deposit_amount === lease.deposit_amount) {
      return true;
    }
    
    return false;
  });

  // Show the card if lease has a deposit amount and it's not tracked
  const shouldShowTrackDepositCard = lease?.deposit_amount && lease.deposit_amount > 0 && !hasDepositForLease;

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
      leaseScanned: "Lease Analyzed Successfully!"
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
      leaseScanned: "วิเคราะห์สัญญาเช่าสำเร็จ!"
    },
    zh: {
      backToScans: "返回扫描",
      riskScore: "风险评分",
      summary: "摘要",
      topIssues: "发现的主要问题",
      allIssues: "发现的所有问题",
      viewFullReport: "查看完整报告",
      viewLease: "查看租约",
      lowRisk: "低风险",
      moderateRisk: "中等风险",
      highRisk: "高风险",
      criticalRisk: "严重风险",
      loading: "正在加载扫描结果...",
      noScanFound: "未找到扫描",
      noScanDesc: "找不到您要查找的扫描。",
      nextStep: "✅ 下一步",
      nextStepTitle: "保护您的押金",
      nextStepDesc: "现在您的租约已扫描，追踪您的押金以确保按时返还。",
      trackDeposit: "立即追踪押金",
      depositTracked: "押金已追踪",
      viewDeposits: "查看押金",
      depositAmount: "押金",
      leaseScanned: "租约分析成功！"
    },
    ja: {
      backToScans: "スキャンに戻る",
      riskScore: "リスクスコア",
      summary: "概要",
      topIssues: "見つかった主な問題",
      allIssues: "見つかったすべての問題",
      viewFullReport: "完全なレポートを表示",
      viewLease: "賃貸契約を表示",
      lowRisk: "低リスク",
      moderateRisk: "中リスク",
      highRisk: "高リスク",
      criticalRisk: "重大リスク",
      loading: "スキャン結果を読み込み中...",
      noScanFound: "スキャンが見つかりません",
      noScanDesc: "お探しのスキャンが見つかりませんでした。",
      nextStep: "✅ 次のステップ",
      nextStepTitle: "敷金を保護",
      nextStepDesc: "賃貸契約がスキャンされたので、敷金を追跡して時間通りに返金されることを確認します。",
      trackDeposit: "今すぐ敷金を追跡",
      depositTracked: "敷金は既に追跡中",
      viewDeposits: "敷金を表示",
      depositAmount: "敷金",
      leaseScanned: "賃貸契約分析成功！"
    },
    ko: {
      backToScans: "스캔으로 돌아가기",
      riskScore: "위험 점수",
      summary: "요약",
      topIssues: "발견된 주요 문제",
      allIssues: "발견된 모든 문제",
      viewFullReport: "전체 보고서 보기",
      viewLease: "임대 계약 보기",
      lowRisk: "낮은 위험",
      moderateRisk: "중간 위험",
      highRisk: "높은 위험",
      criticalRisk: "심각한 위험",
      loading: "스캔 결과 로딩 중...",
      noScanFound: "스캔을 찾을 수 없음",
      noScanDesc: "찾으시는 스캔을 찾을 수 없습니다.",
      nextStep: "✅ 다음 단계",
      nextStepTitle: "보증금 보호",
      nextStepDesc: "이제 임대 계약이 스캔되었으므로 제때 반환되도록 보증금을 추적하세요.",
      trackDeposit: "지금 보증금 추적",
      depositTracked: "보증금이 이미 추적 중",
      viewDeposits: "보증금 보기",
      depositAmount: "보증금",
      leaseScanned: "임대 계약 분석 성공！"
    }
  };

  const strings = t[language] || t.en;

  const getRiskColor = (score) => {
    if (score <= 30) return '#10B981';
    if (score <= 60) return '#F59E0B';
    if (score <= 80) return '#EF4444';
    return '#DC2626';
  };

  const getRiskLabel = (score) => {
    if (score <= 30) return strings.lowRisk;
    if (score <= 60) return strings.moderateRisk;
    if (score <= 80) return strings.highRisk;
    return strings.criticalRisk;
  };

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b'
  };

  const getDisplayFlags = () => {
    const allFlags = scan?.flags || [];
    
    if (userTier === 'lite') {
      return allFlags.slice(0, 5);
    }
    
    if (userTier === 'free') {
      return allFlags.slice(0, 4);
    }
    
    return allFlags;
  };

  const displayFlags = getDisplayFlags();
  const totalFlags = scan?.flags?.length || 0;
  const hasMoreIssues = displayFlags.length < totalFlags;
  const hiddenCount = totalFlags - displayFlags.length;

  if (userLoading || leasesLoading || scansLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p style={{ color: colors.textSecondary }}>{strings.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!scan || !lease) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("UploadScan"))}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {strings.backToScans}
          </Button>
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {strings.noScanFound}
              </h3>
              <p style={{ color: colors.textSecondary }}>{strings.noScanDesc}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const riskColor = getRiskColor(scan.risk_score);
  const riskLabel = getRiskLabel(scan.risk_score);

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg, paddingBottom: '180px' }}>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("UploadScan"))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {strings.backToScans}
        </Button>

        {/* IMPROVED: Next Step Guidance Card - Now shows for all deposits with amount */}
        {shouldShowTrackDepositCard && (
          <Card 
            className="mb-6 border-none shadow-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              animation: 'slideDown 0.5s ease-out'
            }}
          >
            <style>
              {`
                @keyframes slideDown {
                  from {
                    opacity: 0;
                    transform: translateY(-20px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}
            </style>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-white">{strings.nextStep}</h3>
                  </div>
                  <p className="text-white/90 mb-2 text-base">
                    {strings.nextStepDesc}
                  </p>
                  <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
                    <Wallet className="w-4 h-4" />
                    <span className="font-semibold">{strings.depositAmount}:</span>
                    <span className="text-lg font-bold">฿{lease.deposit_amount.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => navigate(createPageUrl("PropertyTracker"))}
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
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 10px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <Wallet className="w-5 h-5" />
                    <span>{strings.trackDeposit}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show alternative if deposit already tracked */}
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
          <CardHeader className="border-b" style={{ backgroundColor: riskColor }}>
            <div className="text-white">
              <CardTitle className="text-2xl font-bold mb-2">{strings.riskScore}</CardTitle>
              <div className="flex items-center gap-4">
                <div className="text-6xl font-bold">{scan.risk_score}%</div>
                <div className="text-xl">{riskLabel}</div>
              </div>
            </div>
          </CardHeader>
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
                : (hasFullReportAccess 
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
              <div className="p-6 rounded-xl border-2 border-dashed" style={{
                backgroundColor: isDarkMode ? '#2A2D30' : '#FEF9C3',
                borderColor: isDarkMode ? '#C7A338' : '#EAB308'
              }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-ls-gold rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold mb-2" style={{ color: colors.textPrimary }}>
                      {language === 'th' 
                        ? `เหลืออีก ${hiddenCount} ปัญหา${userTier === 'lite' ? ' (อัปเกรดเป็น Protect/Secure เพื่อดูทั้งหมด)' : ''}` 
                        : `${hiddenCount} More Issue${hiddenCount > 1 ? 's' : ''} Found${userTier === 'lite' ? ' (Upgrade to Protect/Secure)' : ''}`}
                    </h4>
                    <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                      {userTier === 'lite'
                        ? (language === 'th' 
                            ? 'อัปเกรดเป็น Protect หรือ Secure เพื่อดูปัญหาทั้งหมดพร้อมคำแนะนำโดยละเอียด'
                            : 'Upgrade to Protect or Secure to view all issues with detailed recommendations')
                        : (language === 'th' 
                            ? 'อัปเกรดเป็น Lite, Protect หรือ Secure เพื่อดูรายงานฉบับเต็มพร้อมคำแนะนำโดยละเอียด'
                            : 'Upgrade to Lite, Protect, or Secure to view full report with detailed recommendations')}
                    </p>
                    <button
                      onClick={() => navigate(createPageUrl("Account"))}
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
                        boxShadow: '0 4px 6px rgba(12, 59, 46, 0.3)'
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
                        {language === 'th' ? 'อัปเกรดเพื่อปลดล็อค' : 'Upgrade to Unlock'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fixed Action Bar - Enhanced Visibility */}
        <div className="fixed bottom-0 left-0 right-0 z-30" style={{
          backgroundColor: isDarkMode ? '#1A1D1F' : '#FFFFFF',
          borderTop: `2px solid ${isDarkMode ? '#3A3D40' : '#E5E7EB'}`,
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
          paddingBottom: 'calc(76px + env(safe-area-inset-bottom, 0px))'
        }}>
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate(createPageUrl("ReportFull") + `?scanId=${scan.id}&leaseId=${lease.id}`)}
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
                  onClick={() => window.open(lease.file_url, '_blank')}
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
