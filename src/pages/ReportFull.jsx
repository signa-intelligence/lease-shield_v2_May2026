import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { riskTheme, LEGAL_DISCLAIMER } from "../components/shared/riskTheme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Shield, FileText, ArrowLeft, AlertTriangle, Info, CheckCircle2, AlertCircle, Loader2, DollarSign, Home } from "lucide-react";
import { FeatureGate } from "../components/shared/FeatureGate";
import AuthGuard from "../components/shared/AuthGuard";
import { haptic } from "../components/shared/HapticFeedback";
import { ToastProvider, useToast } from "../components/shared/Toast";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import SkeletonLoader from "../components/shared/SkeletonLoader";

function ReportFullContent() {
  // ============================================================================
  // ALL HOOKS FIRST - UNCONDITIONAL, TOP-LEVEL, STABLE ORDER
  // ============================================================================
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [expandedClauses, setExpandedClauses] = useState({});
  const [schemaInvalidCount, setSchemaInvalidCount] = useState(0);
  const [repairAttempted, setRepairAttempted] = useState(false);

  // Parse URL params
  const urlParams = new URLSearchParams(window.location.search);
  const scanId = urlParams.get('scanId');
  const leaseId = urlParams.get('leaseId');

  // Log route access
  React.useEffect(() => {
    console.log('[REPORTFULL_LOAD]', {
      step: 'RENDER_START',
      scanId,
      leaseId,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }, [scanId, leaseId]);


  // Fetch user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        console.log('[REPORTFULL_LOAD]', { step: 'FETCH_USER_START' });
        const userData = await base44.auth.me();
        console.log('[REPORTFULL_LOAD]', { 
          step: 'FETCH_USER_SUCCESS', 
          userId: userData?.id, 
          email: userData?.email 
        });
        return userData;
      } catch (error) {
        console.error('[REPORTFULL_LOAD]', { 
          step: 'FETCH_USER_ERROR', 
          error: error.message, 
          stack: error.stack 
        });
        console.error('[TELEMETRY] ReportFullLoadFailed', {
          step: 'AUTH',
          scanId,
          leaseId,
          errorMessage: error.message,
          stackTrace: error.stack?.substring(0, 200)
        });
        throw error;
      }
    }
  });

  // Fetch scan
  const { data: scan, isLoading: scanLoading, error: scanError } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: async () => {
      try {
        console.log('[REPORTFULL_LOAD]', { step: 'FETCH_SCAN_START', scanId });
        const scans = await base44.entities.LeaseScan.list();
        const foundScan = scans.find(s => s.id === scanId);
        
        if (!foundScan) {
          console.error('[REPORTFULL_LOAD]', { 
            step: 'FETCH_SCAN_NOT_FOUND', 
            scanId, 
            totalScans: scans.length 
          });
          console.error('[TELEMETRY] ReportFullLoadFailed', {
            step: 'FETCH',
            scanId,
            leaseId,
            errorMessage: 'Scan not found',
            httpStatus: 404
          });
        } else {
          console.log('[REPORTFULL_LOAD]', { 
            step: 'FETCH_SCAN_SUCCESS',
            scanId: foundScan.id, 
            riskScore: foundScan.risk_score,
            hasFlags: !!foundScan.scan_full?.flags,
            flagsCount: foundScan.scan_full?.flags?.length || 0
          });
        }
        
        return foundScan;
      } catch (error) {
        console.error('[REPORTFULL_LOAD]', { 
          step: 'FETCH_SCAN_ERROR',
          scanId, 
          error: error.message, 
          status: error.response?.status,
          stack: error.stack 
        });
        console.error('[TELEMETRY] ReportFullLoadFailed', {
          step: 'FETCH',
          scanId,
          leaseId,
          httpStatus: error.response?.status,
          errorMessage: error.message,
          stackTrace: error.stack?.substring(0, 200)
        });
        throw error;
      }
    },
    enabled: !!scanId && !!user,
    retry: 1
  });

  // Fetch lease
  const { data: lease, isLoading: leaseLoading, error: leaseError } = useQuery({
    queryKey: ['lease', scan?.lease_id || leaseId],
    queryFn: async () => {
      try {
        const targetLeaseId = scan?.lease_id || leaseId;
        console.log('[REPORTFULL_LOAD]', { step: 'FETCH_LEASE_START', leaseId: targetLeaseId });
        const leases = await base44.entities.Lease.list();
        const foundLease = leases.find(l => l.id === targetLeaseId);
        
        if (!foundLease) {
          console.error('[REPORTFULL_LOAD]', { 
            step: 'FETCH_LEASE_NOT_FOUND', 
            leaseId: targetLeaseId, 
            totalLeases: leases.length 
          });
        } else {
          console.log('[REPORTFULL_LOAD]', { 
            step: 'FETCH_LEASE_SUCCESS',
            leaseId: foundLease.id, 
            address: foundLease.property_address 
          });
        }
        
        return foundLease;
      } catch (error) {
        console.error('[REPORTFULL_LOAD]', { 
          step: 'FETCH_LEASE_ERROR',
          leaseId: scan?.lease_id || leaseId,
          error: error.message,
          status: error.response?.status,
          stack: error.stack
        });
        console.error('[TELEMETRY] ReportFullLoadFailed', {
          step: 'FETCH',
          scanId,
          leaseId: scan?.lease_id || leaseId,
          httpStatus: error.response?.status,
          errorMessage: error.message,
          stackTrace: error.stack?.substring(0, 200)
        });
        throw error;
      }
    },
    enabled: !!(scan?.lease_id || leaseId) && !!user,
    retry: 1
  });

  // SINGLE SOURCE OF TRUTH: Use scan's issues_validated (or fallback to flags with validation)
  const { validatedFlags, invalidCount, invalidCodes, invalidDetails } = React.useMemo(() => {
    if (!scan) return { validatedFlags: [], invalidCount: 0, invalidCodes: [], invalidDetails: [] };

    console.log('[REPORTFULL_LOAD]', { 
      step: 'LOAD_VALIDATED_ISSUES',
      hasScan: !!scan,
      hasLease: !!lease,
      hasIssuesValidated: !!scan.scan_full?.issues_validated,
      hasFlags: !!scan.scan_full?.flags
    });

    // Primary: use issues_validated if available
    let validatedIssues = [];
    if (Array.isArray(scan.scan_full?.issues_validated)) {
      validatedIssues = scan.scan_full.issues_validated;
      console.log('[REPORTFULL_LOAD]', {
        step: 'USING_VALIDATED_ISSUES',
        count: validatedIssues.length
      });
    } else {
      // Fallback: validate flags array (legacy scans)
      const allFlags = Array.isArray(scan.scan_full?.flags) ? scan.scan_full.flags : [];

      validatedIssues = allFlags.filter(f => {
        const hasTitle = f?.title && String(f.title).trim().length > 0;
        const hasWhyMatters = (f?.why_it_matters || f?.summary || f?.explanation || '').trim().length > 0;
        const hasRecs = Array.isArray(f?.recommendations) 
          ? f.recommendations.filter(r => r && r.trim().length > 0).length > 0
          : (f?.recommendation || '').trim().length > 0;

        return hasTitle && hasWhyMatters && hasRecs;
      });

      console.log('[REPORTFULL_LOAD]', {
        step: 'LEGACY_VALIDATION_APPLIED',
        total: allFlags.length,
        validated: validatedIssues.length,
        dropped: allFlags.length - validatedIssues.length
      });
    }

    // Track invalid issues from scan metadata
    const invalidIssues = scan.scan_full?.issues_invalid || [];
    const invalidCount = invalidIssues.length;
    const invalidCodes = invalidIssues.map(inv => `${inv.rule_id || 'UNKNOWN'}:${(inv.missing_fields || []).join(',')}`);
    const invalidDetails = invalidIssues.map((inv, idx) => ({
      index: idx,
      ruleId: inv.rule_id,
      missingFields: inv.missing_fields || []
    }));

    console.log('[REPORTFULL_LOAD]', {
      step: 'VALIDATION_COMPLETE',
      validatedCount: validatedIssues.length,
      invalidCount
    });

    return { 
      validatedFlags: validatedIssues, 
      invalidCount, 
      invalidCodes, 
      invalidDetails 
    };
  }, [scan, lease]);

  // Update invalid count state
  React.useEffect(() => {
    if (invalidCount > 0) {
      setSchemaInvalidCount(invalidCount);
      console.error('[TELEMETRY] ReportFullLoadFailed', {
        step: 'RENDER',
        scanId,
        leaseId,
        errorMessage: `${invalidCount} issues failed schema validation`,
        httpStatus: 'N/A'
      });
    }
  }, [invalidCount, scanId, leaseId]);

  // Background repair for legacy invalid issues: attempt safe defaults then persist
  React.useEffect(() => {
    if (!scan || repairAttempted || invalidCount <= 0) return;
    const invalidList = Array.isArray(scan?.scan_full?.issues_invalid) ? scan.scan_full.issues_invalid : [];

    const originalFlags = Array.isArray(scan?.scan_full?.flags) ? scan.scan_full.flags : [];

    const repairOne = (f) => {
      const safe = (v, fb='') => (typeof v === 'string' && v.trim()) || fb;
      const recs = Array.isArray(f.recommendations) && f.recommendations.length > 0
        ? f.recommendations
        : (safe(f.recommendation,'').split('\n').map(s=>s.replace(/^•\s*/, '').trim()).filter(Boolean));
      const title = safe(f.title, safe(f.name, 'Detected risk'));
      const severity = ['critical','high','medium','low'].includes(f.severity) ? f.severity : 'medium';
      const description = safe(f.description, 'This clause may pose a tenant risk. Review recommended.');
      const explanation = safe(f.explanation, 'Impact not provided');
      const recommendation = recs.length > 0 ? recs.join('\n') : 'Request clarification and amend this clause.';
      const clause_id = safe(f.clause_id, 'UNKNOWN');
      const page_number = typeof f.page_number === 'number' ? f.page_number : (Number(f.page_number) || 1);
      const evidence = safe(f.evidence, safe(f.evidence_snippet, 'Evidence unavailable'));
      const rule_id = safe(f.rule_id, 'LEGACY_UNKNOWN_RULE');
      const category = safe(f.category, 'Other Risks');

      const repaired = {
        ...f,
        rule_id,
        category,
        title,
        severity,
        description,
        explanation,
        recommendation,
        evidence,
        clause_id,
        page_number
      };

      const ok = repaired.title && repaired.severity && (repaired.description || repaired.explanation) && repaired.recommendation;
      return ok ? repaired : null;
    };

    const repaired = invalidList.map(repairOne).filter(Boolean);
    const merged = [...validatedFlags, ...repaired];

    if (merged.length > validatedFlags.length) {
      setRepairAttempted(true);
      base44.entities.LeaseScan.update(scan.id, { scan_full: { ...(scan.scan_full||{}), flags: merged } })
        .then(() => {
          console.log('[REPORTFULL_REPAIR]', { scanId: scan.id, repaired_count: repaired.length, dropped_count: invalidCount - repaired.length });
          queryClient.invalidateQueries({ queryKey: ['scan', scanId] });
        })
        .catch(err => {
          console.error('[REPORTFULL_REPAIR_ERROR]', err?.message);
        });
    } else {
      setRepairAttempted(true);
    }
  }, [scan, invalidCount, validatedFlags, queryClient, repairAttempted, scanId]);

  // ============================================================================
  // DERIVED STATE - AFTER ALL HOOKS
  // ============================================================================
  const isLoading = scanLoading || leaseLoading;
  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const userTier = user?.plan_tier || 'free';

  const userRole = user?.role?.toLowerCase();
  const accessLevel = user?.access_level?.toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'va' || accessLevel === 'admin' || accessLevel === 'super_admin' || accessLevel === 'va';
  const showInvalidBanner = isAdmin && schemaInvalidCount > 0;

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

  console.log('[REPORTFULL_LOAD]', {
    step: 'REPORT_STATUS',
    scanId,
    leaseId,
    isLoading,
    hasScan: !!scan,
    hasLease: !!lease,
    scanKeys: scan ? Object.keys(scan) : [],
    reportShape: scan?.scan_full ? Object.keys(scan.scan_full) : []
  });

  const t = {
    en: {
      negotiateBeforeSigning: "Recommended: Review Letter Templates",
      negotiateDesc: "Download editable document templates to communicate with your landlord. Choose the template that matches your situation.",
      openLetterTemplates: "View Document Templates",
      noScanReportFound: "No scan report found",
      uploadALease: "Upload a Lease",
      fullLeaseReport: "Full Lease Report",
      downloadPDF: "Download PDF",
      riskAssessment: "Risk Assessment",
      score: "Score",
      keyLeaseTerms: "Key Lease Terms",
      propertyAddress: "Property Address",
      monthlyRent: "Monthly Rent",
      securityDeposit: "Security Deposit",
      leasePeriod: "Lease Period",
      leaseStart: "Lease Start",
      leaseEnd: "Lease End",
      leaseType: "Lease Type",
      language: "Language",
      detailedIssues: "Detailed Issues & Recommendations",
      evidence: "Evidence",
      explanation: "Explanation",
      recommendation: "Recommended Action",
      impact: "Impact",
      likelihood: "Likelihood",
      missingProtections: "Missing Protections",
      suggestedNextSteps: "Suggested Next Steps",
      enableDepositShield: "Enable Deposit Shield",
      trackYourSecurityDeposit: "Track your security deposit",
      moreDetailedIssues: "More Detailed Issue(s)",
      upgradeToUnlock: "Upgrade to Unlock",
      backToSummary: "Back to Summary",
      originalClause: "Original Clause",
      clauseReference: "Clause",
      pageReference: "Page",
      whyThisMatters: "Why This Matters",
      proceduralRisks: "Procedural Risks",
      financialRisks: "Financial Risks",
      rightsLegalRisks: "Rights & Legal Risks",
      privacyAccess: "Privacy & Access",
      fairnessBalance: "Fairness & Balance",
      rightsUsage: "Rights & Usage",
      legalRights: "Legal Rights",
      otherRisks: "Other Risks",
      leaseLanguageBanner: "This lease is written in {leaseLanguage}. Analysis provided in {uiLanguage}.",
      compoundRisk: "Multi-Clause Pattern",
      penaltyDetails: "Penalty Details"
    },
    th: {
      negotiateBeforeSigning: "แนะนำ: ดูเทมเพลตเอกสาร",
      negotiateDesc: "ดาวน์โหลดเทมเพลตที่แก้ไขได้เพื่อติดต่อกับเจ้าของบ้าน เลือกเทมเพลตที่ตรงกับสถานการณ์ของคุณ",
      openLetterTemplates: "ดูเทมเพลตเอกสาร",
      noScanReportFound: "ไม่พบรายงานการสแกน",
      uploadALease: "อัปโหลดสัญญาเช่า",
      fullLeaseReport: "รายงานการเช่าฉบับเต็ม",
      downloadPDF: "ดาวน์โหลด PDF",
      riskAssessment: "การประเมินความเสี่ยง",
      score: "คะแนน",
      keyLeaseTerms: "ข้อกำหนดสัญญาเช่าที่สำคัญ",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      monthlyRent: "ค่าเช่ารายเดือน",
      securityDeposit: "เงินประกัน",
      leasePeriod: "ระยะเวลาเช่า",
      leaseStart: "วันเริ่มสัญญา",
      leaseEnd: "วันสิ้นสุดสัญญา",
      leaseType: "ประเภทสัญญาเช่า",
      language: "ภาษา",
      detailedIssues: "ปัญหาและข้อแนะนำโดยละเอียด",
      evidence: "หลักฐาน",
      explanation: "คำอธิบาย",
      recommendation: "การดำเนินการที่แนะนำ",
      impact: "ผลกระทบ",
      likelihood: "โอกาส",
      missingProtections: "การป้องกันที่ขาดหายไป",
      suggestedNextSteps: "ขั้นตอนที่แนะนำ",
      enableDepositShield: "เปิดใช้งาน Deposit Shield",
      trackYourSecurityDeposit: "ติดตามเงินมัดจำของคุณ",
      moreDetailedIssues: "เหลืออีก {count} ปัญหาโดยละเอียด",
      upgradeToUnlock: "อัปเกรดเพื่อปลดล็อค",
      backToSummary: "กลับไปที่สรุป",
      originalClause: "ข้อความในสัญญาเดิม",
      clauseReference: "ข้อ",
      pageReference: "หน้า",
      whyThisMatters: "ทำไมสำคัญ",
      proceduralRisks: "ความเสี่ยงด้านขั้นตอน",
      financialRisks: "ความเสี่ยงทางการเงิน",
      rightsLegalRisks: "ความเสี่ยงด้านสิทธิและกฎหมาย",
      privacyAccess: "ความเป็นส่วนตัวและการเข้าถึง",
      fairnessBalance: "ความเป็นธรรมและความสมดุล",
      rightsUsage: "สิทธิและการใช้งาน",
      legalRights: "สิทธิและกฎหมาย",
      otherRisks: "ความเสี่ยงอื่นๆ",
      leaseLanguageBanner: "สัญญานี้เขียนเป็นภาษา{leaseLanguage} การวิเคราะห์แสดงเป็นภาษา{uiLanguage}",
      compoundRisk: "รูปแบบหลายข้อ",
      penaltyDetails: "รายละเอียดค่าปรับ"
    },
    zh: {
      autoGenerateLetters: "自动生成信件",
      autoGenerateDesc: "根据您的扫描结果自动创建谈判信件",
      secureTierOnly: "仅限安全层",
      generating: "正在分析扫描并生成...",
      generated: "信件已生成！",
      viewLetters: "查看信件",
      upgradeToSecure: "升级到安全层",
      upgradeDesc: "根据您的租约扫描结果获取自动信件生成",
      lettersGenerated: "信件生成成功",
      analysisComplete: "分析完成 - 根据扫描建议创建信件",
      noScanReportFound: "未找到扫描报告",
      uploadALease: "上传租约",
      fullLeaseReport: "完整租约报告",
      downloadPDF: "下载PDF",
      riskAssessment: "风险评估",
      score: "评分",
      keyLeaseTerms: "关键租约条款",
      propertyAddress: "物业地址",
      monthlyRent: "月租金",
      securityDeposit: "押金",
      leasePeriod: "租期",
      leaseStart: "租约开始",
      leaseEnd: "租约结束",
      leaseType: "租约类型",
      language: "语言",
      detailedIssues: "详细问题与建议",
      evidence: "证据",
      explanation: "解释",
      recommendation: "建议",
      impact: "影响",
      likelihood: "可能性",
      missingProtections: "缺失的保护",
      suggestedNextSteps: "建议的下一步",
      enableDepositShield: "启用押金盾",
      trackYourSecurityDeposit: "追踪您的押金",
      generateLetter: "生成信件",
      professionalTenantLetters: "专业租户信件",
      failedToGenerateLetters: "生成信件失败。请重试。",
      moreDetailedIssues: "{count} 个更详细的问题",
      upgradeToUnlock: "升级以解锁",
      backToSummary: "返回摘要"
    },
    ja: {
      autoGenerateLetters: "自動レター生成",
      autoGenerateDesc: "スキャン結果に基づいて交渉レターを自動作成",
      secureTierOnly: "セキュアティアのみ",
      generating: "スキャンを分析して生成中...",
      generated: "レター生成完了！",
      viewLetters: "レターを表示",
      upgradeToSecure: "セキュアにアップグレード",
      upgradeDesc: "賃貸契約スキャン結果に基づく自動レター生成を取得",
      lettersGenerated: "レターが正常に生成されました",
      analysisComplete: "分析完了 - スキャン推奨事項からレターを作成",
      noScanReportFound: "スキャンレポートが見つかりません",
      uploadALease: "賃貸契約をアップロード",
      fullLeaseReport: "完全な賃貸レポート",
      downloadPDF: "PDFをダウンロード",
      riskAssessment: "リスク評価",
      score: "スコア",
      keyLeaseTerms: "主要な賃貸条件",
      propertyAddress: "物件住所",
      monthlyRent: "月額家賃",
      securityDeposit: "敷金",
      leasePeriod: "賃貸期間",
      leaseStart: "契約開始",
      leaseEnd: "契約終了",
      leaseType: "賃貸タイプ",
      language: "言語",
      detailedIssues: "詳細な問題と推奨事項",
      evidence: "証拠",
      explanation: "説明",
      recommendation: "推奨事項",
      impact: "影響",
      likelihood: "可能性",
      missingProtections: "不足している保護",
      suggestedNextSteps: "推奨される次のステップ",
      enableDepositShield: "デポジットシールドを有効化",
      trackYourSecurityDeposit: "敷金を追跡",
      generateLetter: "レターを生成",
      professionalTenantLetters: "プロフェッショナルな賃借人レター",
      failedToGenerateLetters: "レターの生成に失敗しました。もう一度お試しください。",
      moreDetailedIssues: "その他 {count} 件の詳細な問題",
      upgradeToUnlock: "アップグレードしてロック解除",
      backToSummary: "概要に戻る"
    },
    ko: {
      autoGenerateLetters: "자동 편지 생성",
      autoGenerateDesc: "스캔 결과를 기반으로 협상 편지를 자동 생성합니다",
      secureTierOnly: "시큐어 티어 전용",
      generating: "스캔 분석 및 생성 중...",
      generated: "편지 생성 완료!",
      viewLetters: "편지 보기",
      upgradeToSecure: "시큐어로 업그레이드",
      upgradeDesc: "임대 계약 스캔 결과를 기반으로 자동 편지 생성 받기",
      lettersGenerated: "편지가 성공적으로 생성되었습니다",
      analysisComplete: "분석 완료 - 스캔 권장사항에서 편지 생성됨",
      noScanReportFound: "스캔 보고서를 찾을 수 없음",
      uploadALease: "임대 계약 업로드",
      fullLeaseReport: "전체 임대 보고서",
      downloadPDF: "PDF 다운로드",
      riskAssessment: "위험 평가",
      score: "점수",
      keyLeaseTerms: "주요 임대 조건",
      propertyAddress: "부동산 주소",
      monthlyRent: "월 임대료",
      securityDeposit: "보증금",
      leasePeriod: "임대 기간",
      leaseStart: "계약 시작",
      leaseEnd: "계약 종료",
      leaseType: "임대 유형",
      language: "언어",
      detailedIssues: "상세 문제 및 권장사항",
      evidence: "증거",
      explanation: "설명",
      recommendation: "권장사항",
      impact: "영향",
      likelihood: "가능성",
      missingProtections: "누락된 보호",
      suggestedNextSteps: "제안된 다음 단계",
      enableDepositShield: "보증금 실드 활성화",
      trackYourSecurityDeposit: "보증금 추적",
      generateLetter: "편지 생성",
      professionalTenantLetters: "전문 임차인 편지",
      failedToGenerateLetters: "편지 생성에 실패했습니다. 다시 시도해주세요.",
      moreDetailedIssues: "{count}개의 상세 문제 더 보기",
      upgradeToUnlock: "업그레이드하여 잠금 해제",
      backToSummary: "요약으로 돌아가기"
    }
  };

  const strings = t[language] || t.en;

  // Currency sanitizer - removes all non-numeric characters except digits, decimal, minus
  const sanitizeCurrency = (value) => {
    if (value === null || value === undefined) return 0;
    
    // Debug log to see raw value
    console.log('[ReportFull] Raw currency value:', value, typeof value);
    
    // Convert to string and remove everything except digits, decimal point, and minus
    const cleanedString = String(value).replace(/[^0-9.-]/g, '');
    const numericValue = parseFloat(cleanedString);
    
    // Debug log cleaned value
    console.log('[ReportFull] Sanitized to:', numericValue);
    
    return isNaN(numericValue) ? 0 : numericValue;
  };

  const handleDownloadPDF = async () => {
    if (!scan || !lease) return;

    setDownloadingPDF(true);
    haptic.medium();

    const correlationId = `pdf-dl-${Date.now()}-${user.id.substring(0, 8)}`;
    console.log('[REPORTFULL_LOAD]', { 
      step: 'EXPORT_PDF_START',
      correlationId,
      userId: user.id,
      userEmail: user.email,
      scanId: scan.id,
      leaseId: lease.id,
      validatedCount: validatedFlags.length
    });

    try {
      // Use ONLY validated flags - strict final sanitization
      const sanitizedFlags = validatedFlags.map(f => ({
        title: f.title,
        severity: f.severity,
        why_it_matters: f.why_it_matters || f.summary || f.explanation || f.description || '',
        summary: f.summary || f.why_it_matters || f.explanation || f.description || '',
        recommendations: Array.isArray(f.recommendations) 
          ? f.recommendations.map(r => String(r || '').replace(/^[\s•\-–—!*→'"]+/, '').trim()).filter(Boolean)
          : String(f.recommendation || '')
              .split('\n')
              .map(s => s.replace(/^[\s•\-–—!*→'"]+/, '').trim())
              .filter(Boolean)
      })).filter(x => {
        // Final guard: reject if missing core content
        const valid = x.title && x.title.trim().length > 0 &&
                     x.why_it_matters && x.why_it_matters.trim().length > 0 &&
                     Array.isArray(x.recommendations) && x.recommendations.length > 0;

        if (!valid) {
          console.error('[PDFSanitizationDropped]', {
            title: x.title,
            hasWhyMatters: !!x.why_it_matters,
            recCount: x.recommendations?.length || 0
          });
        }

        return valid;
      });

      // COUNT VALIDATION
      if (sanitizedFlags.length !== validatedFlags.length) {
        console.error('[ReportCountMismatch]', {
          event: 'ReportCountMismatch',
          context: 'PDF_EXPORT_PREP',
          validated: validatedFlags.length,
          sanitized: sanitizedFlags.length,
          dropped: validatedFlags.length - sanitizedFlags.length
        });
      }

      const pdfData = {
        lease_address: lease.property_address || 'Lease Agreement',
        risk_score: scan.risk_score,
        summary: scan.summary,
        flags: sanitizedFlags,
        missing_items: scan.scan_full?.missing_items || [],
        key_terms: scan.scan_full?.key_terms || {},
        lease_start: lease.start_date,
        lease_end: lease.end_date,
        rent_amount: lease.rent_amount,
        deposit_amount: lease.deposit_amount,
        generated_date: new Date().toISOString()
      };

      console.log('[REPORTFULL_LOAD]', { 
        step: 'EXPORT_PDF_FUNCTION_CALL',
        correlationId,
        dataSize: JSON.stringify(pdfData).length,
        flagsCount: pdfData.flags.length,
        language
      });

      // Call PDF generation function (returns uploaded PDF URL)
      const response = await base44.functions.invoke('generateLeaseReportPDF', {
        scanData: pdfData,
        language: language,
        correlationId
      });

      console.log('[REPORTFULL_LOAD]', { 
        step: 'EXPORT_PDF_FUNCTION_RESPONSE',
        correlationId,
        success: response.data?.success,
        hasPdfUrl: !!response.data?.pdf_url,
        status: response.status
      });

      if (response.data?.success && response.data?.pdf_url) {
        const pdfUrl = response.data.pdf_url;
        console.log('[REPORTFULL_LOAD]', { 
          step: 'EXPORT_PDF_SUCCESS',
          correlationId,
          pdfUrl 
        });
        
        // MOBILE-SAFE DOWNLOAD: Direct navigation to PDF URL
        window.location.href = pdfUrl;
        
        toast.success(language === 'th' ? 'กำลังดาวน์โหลด PDF' : 'Downloading PDF');
        haptic.success();
      } else {
        console.error('[REPORTFULL_LOAD]', { 
          step: 'EXPORT_PDF_FAILED',
          correlationId,
          success: response.data?.success,
          error: response.data?.error
        });
        console.error('[TELEMETRY] ReportFullLoadFailed', {
          step: 'EXPORT_PDF',
          scanId,
          leaseId: lease?.id,
          errorMessage: response.data?.error || 'PDF generation failed',
          httpStatus: response.status
        });
        throw new Error(response.data?.error || 'PDF generation failed');
      }
    } catch (error) {
      console.error('[REPORTFULL_LOAD]', {
        step: 'EXPORT_PDF_ERROR',
        correlationId,
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        userId: user.id,
        scanId: scan?.id,
        leaseId: lease?.id
      });
      
      console.error('[TELEMETRY] ReportFullLoadFailed', {
        step: 'EXPORT_PDF',
        scanId: scan?.id,
        leaseId: lease?.id,
        errorMessage: error.message,
        httpStatus: error.response?.status,
        stackTrace: error.stack?.substring(0, 200)
      });
      
      // User-friendly error messages based on status
      let errorMsg;
      const status = error.response?.status;
      
      if (status === 401 || status === 403) {
        errorMsg = language === 'th' 
          ? 'กรุณาเข้าสู่ระบบอีกครั้งและลองใหม่'
          : 'Please sign in again and retry';
      } else if (status >= 500) {
        errorMsg = language === 'th'
          ? 'การสร้าง PDF ล้มเหลวบนเซิร์ฟเวอร์ กรุณาลองใหม่'
          : 'PDF generation failed on server. Please retry';
      } else {
        errorMsg = language === 'th' 
          ? 'การดาวน์โหลด PDF ล้มเหลว กรุณาลองใหม่'
          : language === 'zh'
            ? 'PDF下载失败 请重试'
            : language === 'ja'
              ? 'PDFダウンロード失敗 再試行してください'
              : language === 'ko'
                ? 'PDF 다운로드 실패 다시 시도하세요'
                : 'PDF download failed. Please retry';
      }
      
      toast.error(errorMsg);
      haptic.error();
    } finally {
      setDownloadingPDF(false);
    }
  };



  // VALIDATION: Check for required params
  if (!scanId) {
    console.error('[ReportFull] Missing scanId parameter');
    return (
      <div className="min-h-screen p-6 page-transition" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'ลิงก์รายงานไม่ถูกต้อง' : 'Invalid Report Link'}
              </h2>
              <p className="mb-4" style={{ color: colors.textSecondary }}>
                {language === 'th' 
                  ? 'ไม่พบข้อมูลการสแกน กรุณาสแกนสัญญาใหม่'
                  : 'Scan data not found. Please scan your lease again.'}
              </p>
              <Button onClick={() => navigate(createPageUrl("UploadScan"))}>
                {strings.uploadALease}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // AUTH ERROR HANDLING
  if (user === undefined && !isLoading) {
    console.error('[ReportFull] User not authenticated');
    console.error('[TELEMETRY] ReportFullLoadFailed', {
      step: 'AUTH',
      scanId,
      leaseId,
      errorMessage: 'User not authenticated',
      httpStatus: 401
    });
    
    return (
      <div className="min-h-screen p-6 page-transition" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-8 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-amber-500" />
              <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'กรุณาเข้าสู่ระบบ' : 'Sign In Required'}
              </h2>
              <p className="mb-4" style={{ color: colors.textSecondary }}>
                {language === 'th' 
                  ? 'กรุณาเข้าสู่ระบบเพื่อดูรายงานนี้'
                  : 'Please sign in to view this report'}
              </p>
              <Button onClick={() => base44.auth.redirectToLogin(window.location.pathname + window.location.search)}>
                {language === 'th' ? 'เข้าสู่ระบบ' : 'Sign In'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // FETCH ERROR HANDLING
  if (scanError || leaseError) {
    const error = scanError || leaseError;
    const status = error?.response?.status;
    
    console.error('[ReportFull] Data fetch error', { 
      scanError: scanError?.message, 
      leaseError: leaseError?.message,
      status 
    });
    
    if (status === 401 || status === 403) {
      return (
        <div className="min-h-screen p-6 page-transition" style={{ backgroundColor: colors.bg }}>
          <div className="max-w-4xl mx-auto">
            <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
              <CardContent className="p-8 text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-amber-500" />
                <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                  {language === 'th' ? 'ไม่มีสิทธิ์เข้าถึง' : 'Access Denied'}
                </h2>
                <p className="mb-4" style={{ color: colors.textSecondary }}>
                  {language === 'th' 
                    ? 'คุณไม่มีสิทธิ์ดูรายงานนี้ หรือเซสชันหมดอายุ'
                    : 'You do not have permission to view this report, or your session expired'}
                </p>
                <Button onClick={() => base44.auth.redirectToLogin(window.location.pathname + window.location.search)}>
                  {language === 'th' ? 'เข้าสู่ระบบอีกครั้ง' : 'Sign In Again'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen p-6 page-transition" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'โหลดรายงานล้มเหลว' : 'Failed to Load Report'}
              </h2>
              <p className="mb-4" style={{ color: colors.textSecondary }}>
                {error?.message || (language === 'th' ? 'เกิดข้อผิดพลาดในการโหลดข้อมูล' : 'An error occurred while loading data')}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => window.location.reload()}>
                  {language === 'th' ? 'ลองใหม่' : 'Retry'}
                </Button>
                <Button variant="outline" onClick={() => navigate(createPageUrl("UploadScan"))}>
                  {language === 'th' ? 'กลับ' : 'Go Back'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 page-transition" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <SkeletonLoader variant="card" count={3} isDarkMode={isDarkMode} />
        </div>
      </div>
    );
  }

  if (!scan || !lease) {
    return (
      <div className="min-h-screen p-6 page-transition" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-0">
              <EmptyState
                icon={FileText}
                title={strings.noScanReportFound}
                description=""
                actionLabel={strings.uploadALease}
                onAction={() => navigate(createPageUrl("UploadScan"))}
                isDarkMode={isDarkMode}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getSeverityIcon = (severity) => {
    const icons = { critical: AlertTriangle, high: AlertTriangle, medium: Info, low: CheckCircle2 };
    return icons[severity] || Info;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: "text-red-600 bg-red-50 border-red-200",
      high: "text-orange-600 bg-orange-50 border-orange-200",
      medium: "text-amber-600 bg-amber-50 border-amber-200",
      low: "text-emerald-600 bg-emerald-50 border-emerald-200"
    };
    return colors[severity] || "text-slate-600 bg-slate-50 border-slate-200";
  };

  const getRiskLevel = (score) => {
    if (score >= 70) return { level: 'high', label: language === 'th' ? 'ความเสี่ยงสูง' : language === 'ru' ? 'Высокий риск' : 'HIGH RISK', color: '#EF4444', bg: '#FEE2E2' };
    if (score >= 40) return { level: 'medium', label: language === 'th' ? 'ความเสี่ยงปานกลาง' : language === 'ru' ? 'Средний риск' : 'MEDIUM RISK', color: '#F59E0B', bg: '#FEF3C7' };
    return { level: 'low', label: language === 'th' ? 'ความเสี่ยงต่ำ' : language === 'ru' ? 'Низкий риск' : 'LOW RISK', color: '#10B981', bg: '#D1FAE5' };
  };

  const theme = riskTheme(scan?.risk_score || 0, scan?.overall_risk);
  const riskLevel = theme ? { level: theme.key, label: theme.key === 'high' ? (language === 'th' ? 'ความเสี่ยงสูง' : language === 'ru' ? 'Высокий риск' : 'HIGH RISK') : theme.key === 'medium' ? (language === 'th' ? 'ความเสี่ยงปานกลาง' : language === 'ru' ? 'Средний риск' : 'MEDIUM RISK') : (language === 'th' ? 'ความเสี่ยงต่ำ' : language === 'ru' ? 'Низкий риск' : 'LOW RISK'), color: theme.color, bg: theme.bg } : null;
  
  // Extract other scan data
  const missingItems = scan?.scan_full?.missing_items || [];
  const keyTerms = scan?.scan_full?.key_terms || {};

  // LIMIT FLAGS BASED ON TIER (consistent with ScanPreview)
  const getFullDisplayFlags = () => {
    // Lite tier: Show max 5 flags
    if (userTier === 'lite') {
      return validatedFlags.slice(0, 5);
    }
    
    // Free tier shouldn't access this page, but if they do, show 4
    if (userTier === 'free') {
      return validatedFlags.slice(0, 4);
    }
    
    // Protect and Secure: Show all flags
    return validatedFlags;
  };

  const allFlags = validatedFlags;
  const mainFlags = allFlags.filter(f => (f.confidence || 'HIGH') !== 'LOW');
  const lowConfidence = allFlags.filter(f => (f.confidence || 'HIGH') === 'LOW');
  const fullFlags = getFullDisplayFlags(mainFlags);
  const totalFlags = mainFlags.length;
  const hiddenFlagsCount = mainFlags.length - fullFlags.length;
  // moved above with mainFlags/lowConfidence

  // DEFENSIVE: Group flags by category with fallback
  const groupedFlags = fullFlags.reduce((groups, flag) => {
    try {
      const category = flag?.category || 'Other Risks';
      if (!groups[category]) groups[category] = [];
      groups[category].push(flag);
    } catch (error) {
      console.error('[ReportFull] Error grouping flag', { flag, error: error.message });
      console.error('[TELEMETRY] ReportFullLoadFailed', {
        step: 'RENDER',
        scanId,
        leaseId,
        errorMessage: 'Flag grouping error: ' + error.message,
        stackTrace: error.stack?.substring(0, 200)
      });
    }
    return groups;
  }, {});

  // Sort within groups by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  Object.keys(groupedFlags).forEach(category => {
    groupedFlags[category].sort((a, b) => 
      (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99)
    );
  });

  // Category display order
  const categoryOrder = [
    'Legal Rights',
    'Procedural Fairness',
    'Financial Risk',
    'Rights & Legal',
    'Privacy & Access',
    'Rights & Usage',
    'Fairness & Balance'
  ];

  const getCategoryTitle = (category) => {
    const map = {
      'Procedural Fairness': language === 'th' ? 'ความเสี่ยงด้านขั้นตอน' : 'Procedural Risks',
      'Financial Risk': language === 'th' ? 'ความเสี่ยงทางการเงิน' : 'Financial Risks',
      'Rights & Legal': language === 'th' ? 'ความเสี่ยงด้านสิทธิและกฎหมาย' : 'Rights & Legal Risks',
      'Legal Rights': language === 'th' ? 'ความเสี่ยงด้านสิทธิและกฎหมาย' : 'Rights & Legal Risks',
      'Privacy & Access': language === 'th' ? 'ความเป็นส่วนตัวและการเข้าถึง' : 'Privacy & Access',
      'Fairness & Balance': language === 'th' ? 'ความเป็นธรรมและความสมดุล' : 'Fairness & Balance',
      'Rights & Usage': language === 'th' ? 'สิทธิและการใช้งาน' : 'Rights & Usage'
    };
    return map[category] || category;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Legal Rights': Shield,
      'Procedural Fairness': AlertTriangle,
      'Financial Risk': DollarSign,
      'Rights & Legal': Shield,
      'Privacy & Access': Home,
      'Rights & Usage': Home,
      'Fairness & Balance': AlertCircle
    };
    return icons[category] || AlertCircle;
  };

  // Check if lease language differs from UI language
  const leaseLanguage = scan.scan_full?.language_detected || lease.language_detected || 'en';
  const uiLanguage = language;
  const showLanguageBanner = leaseLanguage !== uiLanguage;

  const getLanguageLabel = (code) => {
    const labels = { en: 'English', th: 'Thai', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', ru: 'Russian', mixed: 'Mixed' };
    return labels[code] || code.toUpperCase();
  };

  // STEP 3: Log render start
  console.log('[REPORTFULL_LOAD]', { 
    step: 'RENDER_REPORT_START',
    flagsToRender: fullFlags.length
  });

  return (
    <FeatureGate feature="full_report">
      <div className="min-h-screen p-4 md:p-6 page-transition" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          
          {/* SCHEMA INVALID BANNER */}
          {showInvalidBanner && (
            <div className="mb-4 p-4 rounded-lg border-2" style={{
              backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2',
              borderColor: '#DC2626'
            }}>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: isDarkMode ? '#FCA5A5' : '#DC2626' }}>
                    {language === 'th' 
                      ? `${schemaInvalidCount} ปัญหาไม่สามารถแสดงได้ (ISSUE_SCHEMA_INVALID)`
                      : `${schemaInvalidCount} issue(s) quarantined (ISSUE_SCHEMA_INVALID)`}
                  </p>
                  <p className="text-xs mt-1" style={{ color: isDarkMode ? '#FCA5A5' : '#DC2626' }}>
                    {language === 'th'
                      ? 'เฉพาะประเด็นที่ผ่านการตรวจสอบเท่านั้นที่จะแสดงในรายงานและ PDF'
                      : 'Only validated issues are shown in the report and PDF.'}
                  </p>
                  {Array.isArray(invalidCodes) && invalidCodes.length > 0 && (
                    <p className="text-[10px] opacity-75 mt-1" style={{ color: isDarkMode ? '#FCA5A5' : '#DC2626' }}>
                      Codes: {invalidCodes.slice(0,3).join(', ')}{invalidCodes.length>3?` +${invalidCodes.length-3} more`:''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <PageHeader
            title={strings.fullLeaseReport}
            subtitle={lease.property_address || 'Lease Agreement'}
            icon={FileText}
            iconColor="#0C3B2E"
            showBack={true}
            backRoute={createPageUrl("UploadScan")}
            isDarkMode={isDarkMode}
            actions={
              <div className="flex gap-2">
                <Button 
                  className="btn-interaction"
                  style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                  onClick={handleDownloadPDF}
                  disabled={downloadingPDF}
                >
                  {downloadingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {language === 'th' ? 'กำลังสร้าง...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      {strings.downloadPDF}
                    </>
                  )}
                </Button>
              </div>
            }
          />


          {/* Language Banner */}
          {showLanguageBanner && (
            <div className="mb-4 p-4 rounded-lg border-2" style={{
              backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF',
              borderColor: '#3B82F6'
            }}>
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-sm font-medium" style={{ color: isDarkMode ? '#93C5FD' : '#1E40AF' }}>
                  {strings.leaseLanguageBanner
                    .replace('{leaseLanguage}', getLanguageLabel(leaseLanguage))
                    .replace('{uiLanguage}', getLanguageLabel(uiLanguage))}
                </p>
              </div>
            </div>
          )}

          {/* Risk Score Summary */}
          <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader style={{ 
              backgroundColor: riskLevel?.color || '#0C3B2E',
              color: '#FFFFFF'
            }}>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span>{strings.riskAssessment}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="text-lg px-4 py-2" style={{
                    backgroundColor: riskLevel?.bg || '#fff',
                    color: riskLevel?.color || '#1F2937',
                    border: `2px solid ${riskLevel?.color || '#D1D5DB'}`
                  }}>
                    {strings.score}: {scan.risk_score}/100
                  </Badge>
                  <Badge className="text-sm px-3 py-1.5 font-bold flex items-center gap-1" style={{
                    backgroundColor: '#FFFFFF',
                    color: riskLevel?.color || '#10B981'
                  }}>
                    {riskLevel?.level === 'high' && <AlertTriangle className="w-4 h-4" />}
                    {riskLevel?.label || 'LOW RISK'}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            {riskLevel?.level === 'high' && (
              <div className="px-6 pt-4 pb-2">
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
              <p className="leading-relaxed" style={{ color: colors.textPrimary }}>{scan.summary}</p>
              {/* Clause Coverage Summary */}
              {Array.isArray(scan?.scan_full?.clause_reviews) && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1E3A2E' : '#ECFDF5', border: `1px solid ${colors.borderColor}` }}>
                    <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Total clauses reviewed</p>
                    <p className="text-xl font-bold" style={{ color: colors.textPrimary }}>{scan.scan_full.clause_reviews.length}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#3A2D1C' : '#FFF7ED', border: `1px solid ${colors.borderColor}` }}>
                    <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Clauses with detected risks</p>
                    <p className="text-xl font-bold" style={{ color: colors.textPrimary }}>{scan.scan_full.clause_reviews.filter(c=>c.review_status==='RISK_DETECTED').length}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC', border: `1px solid ${colors.borderColor}` }}>
                    <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>No-risk indicator clauses</p>
                    <p className="text-xl font-bold" style={{ color: colors.textPrimary }}>{scan.scan_full.clause_reviews.filter(c=>c.review_status==='NO_AUTOMATED_RISK').length}</p>
                  </div>
                </div>
              )}
            </CardContent>
            </Card>

            {/* Key Terms */}
          {Object.keys(keyTerms).length > 0 && (
            <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
              <CardHeader className="border-b" style={{ borderColor: colors.borderColor }}>
                <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <FileText className="w-5 h-5" style={{ color: '#0C3B2E' }} />
                  {strings.keyLeaseTerms}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {keyTerms.property_address && (
                    <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.propertyAddress}</p>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{keyTerms.property_address}</p>
                    </div>
                  )}
                  {keyTerms.rent_amount && (
                    <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.monthlyRent}</p>
                      <p className="font-medium text-lg" style={{ color: colors.textPrimary }}>฿{sanitizeCurrency(keyTerms.rent_amount).toLocaleString('en-US')}</p>
                    </div>
                  )}
                  {keyTerms.deposit_amount && (
                    <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.securityDeposit}</p>
                      <p className="font-medium text-lg" style={{ color: colors.textPrimary }}>฿{sanitizeCurrency(keyTerms.deposit_amount).toLocaleString('en-US')}</p>
                    </div>
                  )}
                  {keyTerms.start_date && (
                    <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.leasePeriod}</p>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>
                        {keyTerms.start_date} {keyTerms.end_date && `to ${keyTerms.end_date}`}
                      </p>
                    </div>
                  )}
                  {keyTerms.lease_type_detected && (
                    <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.leaseType}</p>
                      <p className="font-medium capitalize" style={{ color: colors.textPrimary }}>{keyTerms.lease_type_detected.replace('_', ' ')}</p>
                    </div>
                  )}
                  {keyTerms.language_detected && (
                    <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.language}</p>
                      <p className="font-medium uppercase" style={{ color: colors.textPrimary }}>{keyTerms.language_detected}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Flags - GROUPED BY CATEGORY */}
          {fullFlags.length > 0 && (
            <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
              <CardHeader className="border-b" style={{ borderColor: colors.borderColor }}>
                <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  {strings.detailedIssues} ({fullFlags.length}{hiddenFlagsCount > 0 ? ` / ${totalFlags}` : ''})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  {/* Render by category */}
                  {categoryOrder.map(category => {
                    const categoryFlags = groupedFlags[category];
                    if (!categoryFlags || categoryFlags.length === 0) return null;

                    const CategoryIcon = getCategoryIcon(category);
                    
                    return (
                      <div key={category}>
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b" style={{ 
                          borderColor: colors.borderColor
                        }}>
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                            backgroundColor: isDarkMode ? '#374151' : '#F3F4F6'
                          }}>
                            <CategoryIcon className="w-5 h-5" style={{ color: '#0C3B2E' }} />
                          </div>
                          <h3 className="text-lg font-bold flex-1" style={{ color: colors.textPrimary }}>
                            {getCategoryTitle(category)}
                          </h3>
                          <Badge className="text-xs font-bold" style={{
                            backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                            color: colors.textPrimary
                          }}>
                            {categoryFlags.length}
                          </Badge>
                        </div>
                        
                        <div className="space-y-4">
                          {categoryFlags.map((flag, index) => {
                            try {
                              // DEFENSIVE: Validate flag structure
                              if (!flag || typeof flag !== 'object') {
                                console.warn('[ReportFull] Invalid flag', { flag, index });
                                return (
                                  <div key={index} className="p-4 rounded-lg border" style={{
                                    backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2',
                                    borderColor: '#EF4444'
                                  }}>
                                    <p className="text-sm" style={{ color: isDarkMode ? '#FCA5A5' : '#DC2626' }}>
                                      {language === 'th' ? 'ข้อมูลปัญหาไม่สมบูรณ์' : 'Issue data unavailable'}
                                    </p>
                                  </div>
                                );
                              }

                              const SeverityIcon = getSeverityIcon(flag.severity);
                              const flagKey = `${category}-${index}`;
                              const showOriginal = expandedClauses[flagKey] || false;
                              
                              return (
                                <div key={index} className="rounded-xl border-2 overflow-hidden" style={{
                                backgroundColor: colors.cardBg,
                                borderColor: flag.severity === 'critical' ? '#EF4444' : 
                                             flag.severity === 'high' ? '#F59E0B' :
                                             flag.severity === 'medium' ? '#EAB308' : '#10B981'
                              }}>
                                {/* Header */}
                                <div className="p-4" style={{
                                  backgroundColor: flag.severity === 'critical' ? (isDarkMode ? '#3A2626' : '#FEE2E2') :
                                                   flag.severity === 'high' ? (isDarkMode ? '#3A2D1C' : '#FFF7ED') :
                                                   flag.severity === 'medium' ? (isDarkMode ? '#3A3420' : '#FEF9C3') :
                                                   (isDarkMode ? '#1E4435' : '#ECFDF5')
                                }}>
                                  <div className="flex items-start gap-3">
                                    <SeverityIcon className="w-6 h-6 mt-0.5 flex-shrink-0" style={{
                                      color: flag.severity === 'critical' ? '#EF4444' :
                                             flag.severity === 'high' ? '#F59E0B' :
                                             flag.severity === 'medium' ? '#EAB308' : '#10B981'
                                    }} />
                                    <div className="flex-1">
                                      <div className="flex items-start justify-between gap-3 mb-2">
                                        <h4 className="font-bold text-base sm:text-lg leading-tight" style={{ color: colors.textPrimary }}>
                                          {flag.title || (language === 'th' ? 'ปัญหาที่ตรวจพบ' : 'Detected Issue')}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                          <Badge className="text-xs font-bold uppercase px-2 py-1 flex-shrink-0" style={{
                                          backgroundColor: flag.severity === 'critical' ? '#DC2626' :
                                                           flag.severity === 'high' ? '#EA580C' :
                                                           flag.severity === 'medium' ? '#D97706' : '#059669',
                                          color: '#FFFFFF'
                                        }}>
                                          {flag.severity || 'medium'}
                                          </Badge>
                                          </div>
                                      </div>
                                      {flag.clause_id && (
                                        <div className="flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
                                          <Badge variant="outline" className="font-mono text-xs">
                                            {strings.clauseReference} {flag.clause_id}
                                          </Badge>
                                          {flag.page_number && (
                                            <Badge variant="outline" className="text-xs">
                                              {strings.pageReference} {flag.page_number}
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Body */}
                                <div className="p-5 space-y-4">
                                  {/* Compound Risk Badge */}
                                  {flag.compound && (
                                    <Badge className="mb-2" style={{
                                      backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2',
                                      color: '#DC2626',
                                      border: '1px solid #DC2626'
                                    }}>
                                      {strings.compoundRisk}
                                    </Badge>
                                  )}

                                  {/* Why This Matters */}
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: colors.textSecondary }}>
                                      {strings.whyThisMatters}
                                    </p>
                                    <p className="text-sm leading-relaxed" style={{ color: colors.textPrimary }}>
                                      {flag.explanation || flag.description || (language === 'th' ? 'รายละเอียดไม่พร้อมใช้งาน' : 'Details unavailable')}
                                    </p>
                                  </div>

                                  {/* Recommended Action - BOXED AND PROMINENT */}
                                  {(flag.recommendations || flag.recommendation) && (
                                    <div className="rounded-xl p-4 border-2" style={{
                                      backgroundColor: isDarkMode ? '#1E3A2E' : '#F0FDF4',
                                      borderColor: '#0C3B2E',
                                      boxShadow: '0 2px 8px rgba(12,59,46,0.1)'
                                    }}>
                                      <p className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: '#0C3B2E' }}>
                                        <CheckCircle2 className="w-4 h-4" />
                                        {strings.recommendation}
                                      </p>
                                      <div className="text-sm leading-relaxed space-y-2" style={{ color: colors.textPrimary }}>
                                        {(() => {
                                          // Normalize to array and strip ALL bullet prefixes
                                          const recs = Array.isArray(flag.recommendations)
                                            ? flag.recommendations.map(r => String(r || '').replace(/^[\s•\-–—!*→'"]+/, '').trim()).filter(Boolean)
                                            : String(flag.recommendation || '')
                                                .split('\n')
                                                .map(s => s.replace(/^[\s•\-–—!*→'"]+/, '').trim())
                                                .filter(Boolean);

                                          return recs.map((rec, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                              <span className="text-emerald-600 font-bold flex-shrink-0">•</span>
                                              <span className="flex-1">{rec}</span>
                                            </div>
                                          ));
                                        })()}
                                      </div>
                                    </div>
                                  )}

                                  {/* Penalty Details */}
                                  {flag.penalties && Array.isArray(flag.penalties) && flag.penalties.length > 0 && (
                                    <div className="p-3 rounded-lg border-l-4" style={{
                                      backgroundColor: isDarkMode ? '#3A2626' : '#FEF2F2',
                                      borderLeftColor: '#DC2626'
                                    }}>
                                      <p className="text-xs font-bold mb-1" style={{ color: '#DC2626' }}>
                                        {strings.penaltyDetails}
                                      </p>
                                      <p className="text-sm" style={{ color: isDarkMode ? '#FCA5A5' : '#DC2626' }}>
                                        {(flag.penalties[0]?.type || 'unknown').toUpperCase()} penalty: ฿{flag.penalties[0]?.amount?.toLocaleString() || 'N/A'}
                                        {flag.penalties[0]?.multiplier && ` (${flag.penalties[0].multiplier}× multiplier)`}
                                        {flag.penalties[0]?.note && ` — ${flag.penalties[0].note}`}
                                      </p>
                                    </div>
                                  )}

                                  {/* Original Clause Snippet - Collapsible */}
                                  {flag.evidence && !flag.missing_safeguard && (
                                    <div>
                                      <button
                                        onClick={() => setExpandedClauses(prev => ({ ...prev, [flagKey]: !showOriginal }))}
                                        className="text-xs font-semibold flex items-center gap-2 transition-colors hover:underline"
                                        style={{ color: '#0C3B2E' }}
                                      >
                                        <span>{showOriginal ? '▼' : '▶'}</span>
                                        <span>{strings.originalClause}</span>
                                      </button>
                                      {showOriginal && (
                                        <div className="mt-2 p-3 rounded-lg border-l-4" style={{
                                          backgroundColor: isDarkMode ? '#2A2D30' : '#F8FAFC',
                                          borderLeftColor: '#64748B'
                                        }}>
                                          <p className="text-xs italic leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
                                            "{flag.evidence}"
                                          </p>
                                          {flag.original_language && (
                                            <p className="text-xs opacity-60" style={{ color: colors.textSecondary }}>
                                              Language: {flag.original_language.toUpperCase()}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Compound Risk Info */}
                                  {flag.contributing_clauses && Array.isArray(flag.contributing_clauses) && (
                                    <div className="text-xs p-2 rounded" style={{
                                      backgroundColor: isDarkMode ? '#3A2626' : '#FEF2F2',
                                      color: colors.textSecondary
                                    }}>
                                      <span className="font-semibold">Contributing clauses: </span>
                                      {flag.contributing_clauses.join(', ')}
                                    </div>
                                  )}
                                  </div>
                                  </div>
                                  );
                                  } catch (error) {
                                  console.error('[ReportFull] Error rendering flag', { flag, error: error.message, stack: error.stack });
                                  console.error('[TELEMETRY] ReportFullLoadFailed', {
                                  step: 'RENDER',
                                  scanId,
                                  leaseId,
                                  errorMessage: 'Flag render error: ' + error.message,
                                  stackTrace: error.stack?.substring(0, 200)
                                  });

                                  return (
                                  <div key={index} className="p-4 rounded-lg border" style={{
                                  backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2',
                                  borderColor: '#EF4444'
                                  }}>
                                  <p className="text-sm" style={{ color: isDarkMode ? '#FCA5A5' : '#DC2626' }}>
                                   {language === 'th' ? 'ข้อมูลปัญหาไม่สมบูรณ์' : 'Issue data unavailable'}
                                  </p>
                                  </div>
                                  );
                                  }
                                  })}
                                  </div>
                                  </div>
                                  );
                                  })}
                  
                  {/* SHOW UPGRADE CTA IF FLAGS ARE HIDDEN */}
                  {hiddenFlagsCount > 0 && (
                    <div className="mt-6 p-6 rounded-xl border-2 border-dashed" style={{
                      backgroundColor: isDarkMode ? '#2A2D30' : '#FEF9C3',
                      borderColor: isDarkMode ? '#C7A338' : '#EAB308'
                    }}>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold mb-2" style={{ color: colors.textPrimary }}>
                            {language === 'th' 
                              ? strings.moreDetailedIssues.replace('{count}', hiddenFlagsCount)
                              : `${hiddenFlagsCount} ${strings.moreDetailedIssues.replace('{count}', hiddenFlagsCount)}`}
                          </h4>
                          <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                            {language === 'th' 
                              ? 'อัปเกรดเป็น Protect หรือ Secure เพื่อดูการวิเคราะห์ทั้งหมดพร้อมคำแนะนำโดยละเอียด'
                              : 'Upgrade to Protect or Secure to view complete analysis with detailed recommendations'}
                          </p>
                          <Button
                            onClick={() => navigate(createPageUrl("Account") + '?highlight=plans')}
                            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800"
                          >
                            {strings.upgradeToUnlock}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => navigate(createPageUrl("ScanPreview") + `?scanId=${scanId}`)}
                            className="w-full mt-2"
                            style={isDarkMode ? { borderColor: colors.borderColor, color: colors.textPrimary } : {}}
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {strings.backToSummary}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Observations (LOW confidence) */}
          {lowConfidence.length > 0 && (
            <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
              <CardHeader className="border-b" style={{ borderColor: colors.borderColor }}>
                <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <Info className="w-5 h-5 text-slate-500" /> Additional Observations (verify)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {lowConfidence.map((f,i)=> (
                  <div key={i} className="p-3 rounded border" style={{ borderColor: colors.borderColor }}>
                    <div className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{f.title}</div>
                    <div className="text-xs" style={{ color: colors.textSecondary }}>{f.summary}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Missing Protections */}
          {missingItems.length > 0 && (
            <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
              <CardHeader className="border-b" style={{ borderColor: colors.borderColor }}>
                <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  {strings.missingProtections} ({missingItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-3">
                  {missingItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 rounded-lg border border-amber-200" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFBEB' }}>
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-900 leading-relaxed" style={{ color: isDarkMode ? colors.textPrimary : '#B45309' }}>{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="border-none shadow-lg" style={{ 
            backgroundColor: colors.cardBg,
            background: isDarkMode 
              ? 'linear-gradient(to br, #2A2D30, #1F2937)' 
              : 'linear-gradient(to br, #F0FDF4, #DBEAFE)'
          }}>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4" style={{ color: colors.textPrimary }}>
                {strings.suggestedNextSteps}
              </h3>

              {/* Open Letter Templates */}
              <div className="mb-4 rounded-xl border-2 overflow-hidden" style={{
                backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                borderColor: '#0C3B2E'
              }}>
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                      backgroundColor: '#0C3B2E'
                    }}>
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold mb-2" style={{ color: colors.textPrimary }}>
                        {strings.negotiateBeforeSigning}
                      </h4>
                      <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                        {strings.negotiateDesc}
                      </p>
                      <Button
                        onClick={() => {
                          haptic.medium();
                          navigate(createPageUrl("Templates"));
                        }}
                        className="w-full btn-interaction"
                        style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {strings.openLetterTemplates}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other suggested actions */}
              <div className="grid md:grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => navigate(createPageUrl("DepositTracker"))}
                  style={isDarkMode ? { backgroundColor: colors.cardBg, borderColor: colors.borderColor, color: colors.textPrimary } : {}}
                >
                  <Shield className="w-5 h-5 mr-3 text-emerald-600" />
                  <div className="text-left">
                    <div className="font-semibold" style={{ color: colors.textPrimary }}>
                      {strings.enableDepositShield}
                    </div>
                    <div className="text-xs" style={{ color: colors.textSecondary }}>
                      {strings.trackYourSecurityDeposit}
                    </div>
                  </div>
                </Button>
              </div>
              <div className="mt-6 text-xs italic" style={{ color: colors.textSecondary }}>
                {LEGAL_DISCLAIMER}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


      </FeatureGate>
      );
}

export default function ReportFull() {
  return (
    <AuthGuard>
      <ToastProvider>
        <ReportFullContent />
      </ToastProvider>
    </AuthGuard>
  );
}