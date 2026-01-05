import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
  X,
  Trash2,
  Home,
  Bell,
  Edit2,
  Save,
  Shield,
  Eye,
  ExternalLink,
  Copy,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ProgressBreadcrumb from "../components/shared/ProgressBreadcrumb";
import UploadProgress from "../components/shared/UploadProgress";
import { haptic } from "../components/shared/HapticFeedback";
import SwipeToDelete from "../components/shared/SwipeToDelete";
import AuthGuard from "../components/shared/AuthGuard";
import { FEATURE_COLORS } from "../components/shared/featureTheme";
import TrustBadge from "../components/shared/TrustBadge";
import { generateRequestId, normalizeFiles, preflightCheck } from "../components/shared/FileNormalizer";
import { formatErrorForUser, createDebugLog } from "../components/shared/ErrorCategorizer";
import { getDeviceContext } from "../components/shared/DeviceContext";
import { uploadFileWithSession, uploadMultipleFiles, getUploadTimeout } from "../components/shared/MobileUploader";
import RetryAnalysis from "../components/shared/RetryAnalysis";
import ScanReviewConfirmation from "../components/scan/ScanReviewConfirmation";

function UploadScanPageContent() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [debugLog, setDebugLog] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [leaseDetails, setLeaseDetails] = useState(null);
  const [pendingLeaseId, setPendingLeaseId] = useState(null);
  const [analysisStage, setAnalysisStage] = useState('');
  // New state variables for batch mode
  const [batchMode, setBatchMode] = useState(false);
  const [batchResults, setBatchResults] = useState([]); // To store results of each file in batch

  // New state for viewing lease details
  const [selectedLease, setSelectedLease] = useState(null);
  const [editingNotice, setEditingNotice] = useState(false);
  const [noticeSettings, setNoticeSettings] = useState({ notice_period_days: 30 });
  
  // NEW: Document viewer modal state
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentToView, setDocumentToView] = useState(null);

  // NEW: Track current step for breadcrumb
  const [currentStep, setCurrentStep] = useState(0);

  // NEW: State for post-scan upgrade hint
  const [showPostScanHint, setShowPostScanHint] = useState(false);
  
  // NEW: State for disclaimer modal
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [disclaimerCheckboxTicked, setDisclaimerCheckboxTicked] = useState(false);

  // NEW: State for completion modal
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedLeaseId, setCompletedLeaseId] = useState(null);

  // NEW: State for add pages flow
  const [addingPagesToLease, setAddingPagesToLease] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]);

  // NEW: State for review confirmation
  const [showReviewScreen, setShowReviewScreen] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [savingConfirmedData, setSavingConfirmedData] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
    initialData: [],
    refetchInterval: (query) => {
      // Poll every 5 seconds if any lease is in pending/queued/processing state
      const data = query.state.data || [];
      const hasPendingScans = data.some(l => 
        l.status === 'uploaded' || 
        l.status === 'queued' || 
        l.status === 'processing'
      );
      return hasPendingScans ? 5000 : false;
    }
  });

  const { data: allScans = [] } = useQuery({
    queryKey: ['allScans'],
    queryFn: () => base44.entities.LeaseScan.list(),
    enabled: !!user,
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const userTier = user?.plan_tier || 'free';

  // ✅ SCAN LIMIT ENFORCEMENT
  const getScanLimits = () => {
    switch(userTier) {
      case 'free': return { limit: 1, period: 'lifetime', unlimited: false };
      case 'lite': return { limit: 6, period: 'year', unlimited: false };
      case 'protect': return { limit: 12, period: 'year', unlimited: false };
      case 'secure': return { limit: 999, period: 'year', unlimited: true };
      default: return { limit: 1, period: 'lifetime', unlimited: false };
    }
  };

  const canUploadLease = () => {
    const limits = getScanLimits();
    if (limits.unlimited) return { allowed: true, remaining: 999, used: 0, limit: 999, period: limits.period };

    let scannedCount = 0;
    if (limits.period === 'lifetime') {
      scannedCount = leases.filter(l => l.status === 'scanned' || l.status === 'paid').length;
    } else if (limits.period === 'year') {
      const thisYear = new Date().getFullYear();
      scannedCount = leases.filter(l => {
        if (!l.created_date) return false;
        const leaseYear = new Date(l.created_date).getFullYear();
        return leaseYear === thisYear && (l.status === 'scanned' || l.status === 'paid');
      }).length;
    }

    return {
      allowed: scannedCount < limits.limit,
      remaining: Math.max(0, limits.limit - scannedCount),
      used: scannedCount,
      limit: limits.limit,
      period: limits.period
    };
  };

  const scanStatus = canUploadLease();

  const colors = {
    bg: isDarkMode ? '#1A1D1F' : '#F9FAFB',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#9CA3AF' : '#6B7280',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
    inputBg: isDarkMode ? '#353A3D' : '#FFFFFF',
  };

  const t = {
    en: {
      title: "Scan Your Lease",
      subtitle: "Upload your lease agreement for automated analysis",
      uploadArea: "Drop your lease files here or click to browse",
      supportedFormats: "PDF, PNG, or JPG only. Max 10MB per file.",
      selectFiles: "Select Files",
      uploadAll: "Analyse Files",
      uploading: "Uploading files...",
      analyzingTitle: "Analysing Your Lease",
      analyzingDesc: "Reviewing your lease agreement. This may take up to 30 seconds...",
      analyzing: {
        uploading: "Uploading files...",
        creating: "Creating lease record...",
        scanning: "Analysing document...",
        extracting: "Extracting lease details...",
        finalizing: "Finalising analysis..."
      },
      recentScans: "Recent Scans",
      viewAll: "View All Leases",
      noScans: "No recent scans",
      scanDate: "Scanned on",
      confirmNoticeTitle: "Set Notice Period Reminder",
      confirmNoticeDesc: "We detected your lease ends on",
      noticePeriodLabel: "Notice Period (Days)",
      noticePeriodHelp: "Days before lease end to notify landlord",
      skipReminder: "Skip",
      setReminder: "Set Reminder",
      riskLevels: {
        low: "Low Risk",
        medium: "Medium Risk",
        high: "High Risk",
        critical: "Critical Risk"
      },
      leaseDetails: "Lease Details",
      basicInfo: "Basic Information",
      propertyAddress: "Property Address",
      monthlyRent: "Monthly Rent",
      securityDeposit: "Security Deposit",
      leasePeriod: "Lease Period",
      leaseStart: "Lease Start",
      leaseEnd: "Lease End",
      to: "to",
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
      viewLease: "View Lease Document",
      closeDetails: "Close Details",
      enableAlertsHelp: "Receive reminders 30, 7, and 3 days before notice deadline",
      deadlineCalculated: "Calculated based on lease end date and notice period",
      allLeases: "All Leases",
      scanLimitReached: "Scan Limit Reached",
      scanLimitMsg: "You've used {used} of {limit} scans {periodText}",
      upgradeForMore: "Upgrade for More Scans",
      scansRemaining: "{remaining} scan(s) remaining {periodText}",
      unlimitedScans: "Unlimited Scans",
      browseDocuments: "Upload Documents",
      batchUpload: "Batch Upload",
      singleUpload: "Single Upload",
      filesWillBeSeparate: "Each file will be uploaded as a separate lease",
      stepUpload: "Upload",
      stepAnalyze: "Analyse",
      stepResults: "Results",
      stepTrack: "Track",
      upgradeHintText: "Upgrade to unlock unlimited scans and advanced lease analysis.",
      viewPlans: "View plans",
      disclaimerTitle: "Lease Scan Disclaimer",
      disclaimerCheckbox: "I have read and agree to the Lease Scan Disclaimer.",
      agreeAndContinue: "Agree & Continue",
      disclaimerCancel: "Cancel",
      disclaimerText: {
        p1: "Lease Shield provides automated lease analysis, practical guidance, and document templates to help users better understand rental agreements and common risk areas. All information is provided for general informational purposes only.",
        p2: "Lease Shield is not a law firm and does not provide legal advice or legal representation. Use of this service does not create a lawyer–client relationship.",
        p3: "While Lease Shield uses structured analysis and up-to-date reference data, results may vary depending on document quality, language, and jurisdiction. Lease Shield does not warrant that scan results, recommendations, or generated documents are complete, error-free, or suitable for every situation.",
        responsibleTitle: "You remain responsible for:",
        responsibilities: [
          "Reviewing and understanding your lease documents",
          "Confirming the accuracy of all information",
          "Seeking independent professional or legal advice where appropriate",
          "Deciding whether and how to rely on any outputs provided"
        ],
        p4: "Lease Shield is not a party to any lease agreement and is not responsible for decisions made, disputes arising, or outcomes resulting from use of this service.",
        p5: "By continuing, you acknowledge that Lease Shield is a support and insight tool, and that you use it at your own discretion and risk."
      }
    },
    th: {
      title: "สแกนสัญญาเช่า",
      subtitle: "อัปโหลดสัญญาเช่าเพื่อวิเคราะห์อัตโนมัติ",
      uploadArea: "วางไฟล์สัญญาเช่าที่นี่ หรือคลิกเพื่อเลือกไฟล์",
      supportedFormats: "รองรับเฉพาะ PDF, PNG หรือ JPG ไฟล์ละไม่เกิน 10MB",
      selectFiles: "เลือกไฟล์",
      uploadAll: "วิเคราะห์ไฟล์",
      uploading: "กำลังอัปโหลดไฟล์...",
      analyzingTitle: "กำลังวิเคราะห์สัญญาเช่า",
      analyzingDesc: "กำลังตรวจสอบสัญญาเช่าของคุณ อาจใช้เวลาประมาณ 30 วินาที...",
      analyzing: {
        uploading: "กำลังอัปโหลดไฟล์...",
        creating: "กำลังสร้างบันทึกสัญญาเช่า...",
        scanning: "กำลังวิเคราะห์เอกสาร...",
        extracting: "กำลังดึงข้อมูลสัญญาเช่า...",
        finalizing: "กำลังสรุปการวิเคราะห์..."
      },
      recentScans: "การสแกนล่าสุด",
      viewAll: "ดูสัญญาเช่าทั้งหมด",
      noScans: "ยังไม่มีการสแกน",
      scanDate: "สแกนเมื่อ",
      confirmNoticeTitle: "ตั้งการแจ้งเตือนระยะเวลาแจ้งล่วงหน้า",
      confirmNoticeDesc: "เราตรวจพบว่าสัญญาเช่าของคุณสิ้นสุดวันที่",
      noticePeriodLabel: "ระยะเวลาแจ้งล่วงหน้า (วัน)",
      noticePeriodHelp: "จำนวนวันก่อนสัญญาหมดอายุที่ต้องแจ้งเจ้าของบ้าน",
      skipReminder: "ข้าม",
      setReminder: "ตั้งการแจ้งเตือน",
      riskLevels: {
        low: "ความเสี่ยงต่ำ",
        medium: "ความเสี่ยงปานกลาง",
        high: "ความเสี่ยงสูง",
        critical: "ความเสี่ยงวิกฤต"
      },
      leaseDetails: "รายละเอียดสัญญาเช่า",
      basicInfo: "ข้อมูลพื้นฐาน",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      monthlyRent: "ค่าเช่ารายเดือน",
      securityDeposit: "เงินมัดจำ",
      leasePeriod: "ระยะเวลาสัญญา",
      leaseStart: "วันเริ่มสัญญา",
      leaseEnd: "วันสิ้นสุดสัญญา",
      to: "ถึง",
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
      viewLease: "ดูเอกสารสัญญาเช่า",
      closeDetails: "ปิดรายละเอียด",
      enableAlertsHelp: "รับการแจ้งเตือน 30, 7 และ 3 วันก่อนถึงกำหนดแจ้ง",
      deadlineCalculated: "คำนวณจากวันสิ้นสุดสัญญาและระยะเวลาแจ้งล่วงหน้า",
      allLeases: "สัญญาเช่าทั้งหมด",
      scanLimitReached: "ถึงขีดจำกัดการสแกนแล้ว",
      scanLimitMsg: "คุณใช้ไป {used} จาก {limit} การสแกน{periodText}",
      upgradeForMore: "อัปเกรดเพื่อเพิ่มการสแกน",
      scansRemaining: "เหลืออีก {remaining} การสแกน{periodText}",
      unlimitedScans: "สแกนได้ไม่จำกัด",
      browseDocuments: "อัปโหลดเอกสาร",
      batchUpload: "อัปโหลดแบบกลุ่ม",
      singleUpload: "อัปโหลดแบบเดี่ยว",
      filesWillBeSeparate: "แต่ละไฟล์จะถูกอัปโหลดเป็นสัญญาเช่าแยกกัน",
      stepUpload: "อัปโหลด",
      stepAnalyze: "วิเคราะห์",
      stepResults: "ผลลัพธ์",
      stepTrack: "ติดตาม",
      upgradeHintText: "อัปเกรดเพื่อปลดล็อกการสแกนไม่จำกัดและการวิเคราะห์สัญญาขั้นสูง",
      viewPlans: "ดูแผน",
      disclaimerTitle: "ข้อจำกัดความรับผิดชอบการสแกนสัญญาเช่า",
      disclaimerCheckbox: "ข้าพเจ้าได้อ่านและยอมรับข้อจำกัดความรับผิดชอบการสแกนสัญญาเช่าแล้ว",
      agreeAndContinue: "ยอมรับและดำเนินการต่อ",
      disclaimerCancel: "ยกเลิก",
      disclaimerText: {
        p1: "Lease Shield ให้บริการวิเคราะห์สัญญาเช่าอัตโนมัติ คำแนะนำเชิงปฏิบัติ และเทมเพลตเอกสารเพื่อช่วยให้ผู้ใช้เข้าใจสัญญาเช่าและจุดเสี่ยงทั่วไปได้ดีขึ้น ข้อมูลทั้งหมดมีไว้เพื่อวัตถุประสงค์ในการให้ข้อมูลทั่วไปเท่านั้น",
        p2: "Lease Shield ไม่ใช่สำนักงานกฎหมาย และไม่ให้คำปรึกษาด้านกฎหมายหรือการเป็นตัวแทนทางกฎหมาย การใช้บริการนี้ไม่ก่อให้เกิดความสัมพันธ์ทนายความ-ลูกความ",
        p3: "แม้ว่า Lease Shield ใช้การวิเคราะห์ที่มีโครงสร้างและข้อมูลอ้างอิงที่เป็นปัจจุบัน แต่ผลลัพธ์อาจแตกต่างกันไปตามคุณภาพเอกสาร ภาษา และเขตอำนาจศาล Lease Shield ไม่รับประกันว่าผลการสแกน คำแนะนำ หรือเอกสารที่สร้างขึ้นจะครบถ้วน ปราศจากข้อผิดพลาด หรือเหมาะสมกับทุกสถานการณ์",
        responsibleTitle: "คุณยังคงมีหน้าที่รับผิดชอบในการ:",
        responsibilities: [
          "ตรวจสอบและทำความเข้าใจเอกสารสัญญาเช่าของคุณ",
          "ยืนยันความถูกต้องของข้อมูลทั้งหมด",
          "ขอคำปรึกษาจากผู้เชี่ยวชาญหรือทนายความอิสระเมื่อจำเป็น",
          "ตัดสินใจว่าจะพึ่งพาผลลัพธ์ที่ให้มาหรือไม่ และอย่างไร"
        ],
        p4: "Lease Shield ไม่ได้เป็นคู่สัญญาในสัญญาเช่าใด ๆ และไม่รับผิดชอบต่อการตัดสินใจที่ทำ ข้อพิพาทที่เกิดขึ้น หรือผลลัพธ์ที่เกิดจากการใช้บริการนี้",
        p5: "เมื่อดำเนินการต่อ คุณรับทราบว่า Lease Shield เป็นเครื่องมือช่วยเหลือและให้ข้อมูลเชิงลึก และคุณใช้งานด้วยดุลยพินิจและความเสี่ยงของคุณเอง"
      }
    },
    zh: {
      title: "扫描租约",
      subtitle: "上传您的租赁协议进行自动分析",
      uploadArea: "将租约文件拖放到此处或点击浏览",
      supportedFormats: "仅支持 PDF、PNG 或 JPG，每个文件最大 10MB",
      selectFiles: "选择文件",
      uploadAll: "分析文件",
      uploading: "正在上传文件...",
      analyzingTitle: "正在分析您的租约",
      analyzingDesc: "正在审查您的租赁协议。这可能需要30秒...",
      analyzing: {
        uploading: "正在上传文件...",
        creating: "正在创建租约记录...",
        scanning: "正在分析文档...",
        extracting: "正在提取租约详情...",
        finalizing: "正在完成分析..."
      },
      recentScans: "最近扫描",
      viewAll: "查看所有租约",
      noScans: "暂无扫描记录",
      scanDate: "扫描于",
      confirmNoticeTitle: "设置提前通知提醒",
      noticePeriodLabel: "提前通知期（天数）",
      confirmNoticeDesc: "我们检测到您的租约结束于",
      noticePeriodHelp: "租约结束前需要通知房东的天数",
      skipReminder: "跳过",
      setReminder: "设置提醒",
      riskLevels: {
        low: "低风险",
        medium: "中等风险",
        high: "高风险",
        critical: "严重风险"
      },
      leaseDetails: "租约详情",
      basicInfo: "基本信息",
      propertyAddress: "物业地址",
      monthlyRent: "月租金",
      securityDeposit: "押金",
      leasePeriod: "租期",
      leaseStart: "租约开始",
      leaseEnd: "租约结束",
      to: "至",
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
      viewLease: "查看租约文档",
      closeDetails: "关闭详情",
      enableAlertsHelp: "在通知截止日期前30、7和3天收到提醒",
      deadlineCalculated: "根据租约结束日期和提前通知期计算",
      allLeases: "所有租约",
      scanLimitReached: "已达扫描限制",
      scanLimitMsg: "您已使用 {used} / {limit} 次扫描{periodText}",
      upgradeForMore: "升级以获得更多扫描",
      scansRemaining: "剩余 {remaining} 次扫描{periodText}",
      unlimitedScans: "无限制扫描",
      browseDocuments: "上传文档",
      batchUpload: "批量上传",
      singleUpload: "单次上传",
      filesWillBeSeparate: "每个文件将作为单独的租约上传",
      stepUpload: "上传",
      stepAnalyze: "分析",
      stepResults: "结果",
      stepTrack: "追踪",
      upgradeHintText: "升级以解锁无限扫描和高级租约分析。",
      viewPlans: "查看计划",
      disclaimerTitle: "租约扫描免责声明",
      disclaimerCheckbox: "我已阅读并同意租约扫描免责声明。",
      agreeAndContinue: "同意并继续",
      disclaimerCancel: "取消",
      disclaimerText: {
        p1: "Lease Shield 提供自动化租约分析、实用指导和文档模板，帮助用户更好地理解租赁协议和常见风险领域。所有信息仅供一般参考之用。",
        p2: "Lease Shield 不是律师事务所，不提供法律意见或法律代理服务。使用本服务不会建立律师-客户关系。",
        p3: "虽然 Lease Shield 使用结构化分析和最新参考数据，但结果可能因文档质量、语言和司法管辖区而异。Lease Shield 不保证扫描结果、建议或生成文档完整、无误或适用于每种情况。",
        responsibleTitle: "您仍需承担以下责任：",
        responsibilities: [
          "审阅并理解您的租赁文件",
          "确认所有信息的准确性",
          "在适当情况下寻求独立的专业或法律意见",
          "决定是否以及如何依赖所提供的任何输出内容"
        ],
        p4: "Lease Shield 不是任何租约协议的当事方，对因使用本服务而做出的决定、产生的纠纷或造成的结果不承担责任。",
        p5: "继续操作即表示您确认 Lease Shield 是一种支持和洞察工具，您自行决定使用并承担风险。"
      }
    },
    ja: {
      title: "賃貸契約をスキャン",
      subtitle: "賃貸契約書をアップロードして自動分析",
      uploadArea: "ここに賃貸契約ファイルをドロップまたはクリックして参照",
      supportedFormats: "PDF、PNG、JPG のみ。各ファイル最大10MB",
      selectFiles: "ファイルを選択",
      uploadAll: "ファイルを分析",
      uploading: "ファイルをアップロード中...",
      analyzingTitle: "賃貸契約を分析中",
      analyzingDesc: "賃貸契約を確認しています。最大30秒かかる場合があります...",
      analyzing: {
        uploading: "ファイルをアップロード中...",
        creating: "賃貸契約記録を作成中...",
        scanning: "ドキュメントを分析中...",
        extracting: "賃貸契約の詳細を抽出中...",
        finalizing: "分析を完了中..."
      },
      recentScans: "最近のスキャン",
      viewAll: "すべての賃貸契約を表示",
      noScans: "スキャン記録なし",
      scanDate: "スキャン日",
      confirmNoticeTitle: "通知期間リマインダーを設定",
      confirmNoticeDesc: "賃貸契約の終了日を検出しました",
      noticePeriodLabel: "通知期間（日数）",
      noticePeriodHelp: "契約終了前に家主に通知する日数",
      skipReminder: "スキップ",
      setReminder: "リマインダーを設定",
      riskLevels: {
        low: "低リスク",
        medium: "中リスク",
        high: "高リスク",
        critical: "重大リスク"
      },
      leaseDetails: "賃貸契約の詳細",
      basicInfo: "基本情報",
      propertyAddress: "物件住所",
      monthlyRent: "月額家賃",
      securityDeposit: "敷金",
      leasePeriod: "契約期間",
      leaseStart: "契約開始",
      leaseEnd: "契約終了",
      to: "から",
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
      viewLease: "賃貸契約書を表示",
      closeDetails: "詳細を閉じる",
      enableAlertsHelp: "通知期限の30日前、7日前、3日前にリマインダーを受け取る",
      deadlineCalculated: "契約終了日と通知期間に基づいて計算",
      allLeases: "すべての賃貸契約",
      scanLimitReached: "スキャン制限に達しました",
      scanLimitMsg: "{limit}回のスキャンのうち{used}回を使用{periodText}",
      upgradeForMore: "アップグレードしてさらにスキャン",
      scansRemaining: "残り{remaining}回のスキャン{periodText}",
      unlimitedScans: "無制限スキャン",
      browseDocuments: "ドキュメントをアップロード",
      batchUpload: "一括アップロード",
      singleUpload: "単一アップロード",
      filesWillBeSeparate: "各ファイルは個別の賃貸契約としてアップロードされます",
      stepUpload: "アップロード",
      stepAnalyze: "分析",
      stepResults: "結果",
      stepTrack: "追跡",
      upgradeHintText: "無制限スキャンと高度な賃貸契約分析をアンロックするためにアップグレードしてください。",
      viewPlans: "プランを見る",
      disclaimerTitle: "賃貸契約スキャン免責事項",
      disclaimerCheckbox: "賃貸契約スキャン免責事項を読み、同意します。",
      agreeAndContinue: "同意して続行",
      disclaimerCancel: "キャンセル",
      disclaimerText: {
        p1: "Lease Shield は、ユーザーが賃貸契約書および一般的なリスク領域をよりよく理解できるよう、自動リース分析、実用的なガイダンス、および文書テンプレートを提供します。すべての情報は一般的な情報提供のみを目的として提供されます。",
        p2: "Lease Shield は法律事務所ではなく、法律助言や法的代理を提供しません。本サービスの利用により弁護士-依頼者関係は成立しません。",
        p3: "Lease Shield は構造化された分析と最新の参照データを使用していますが、結果は文書の品質、言語、および管轄区域によって異なる場合があります。Lease Shield は、スキャン結果、推奨事項、または生成された文書が完全で、エラーがなく、またはすべての状況に適していることを保証しません。",
        responsibleTitle: "以下については利用者が責任を負います：",
        responsibilities: [
          "賃貸契約書類の確認と理解",
          "すべての情報の正確性の確認",
          "必要に応じて独立した専門家または法律助言を求めること",
          "提供された出力に依拠するかどうか、およびその方法を決定すること"
        ],
        p4: "Lease Shield はいかなる賃貸契約の当事者でもなく、本サービスの利用から生じた決定、紛争、または結果について責任を負いません。",
        p5: "続行することで、Lease Shield がサポートおよび洞察ツールであり、ご自身の裁量とリスクでご利用いただくことを認識したものとします。"
      }
    },
    ko: {
      title: "임대 계약 스캔",
      subtitle: "임대 계약서를 업로드하여 자동 분석",
      uploadArea: "여기에 임대 계약 파일을 드롭하거나 클릭하여 찾아보기",
      supportedFormats: "PDF, PNG, JPG만 지원. 파일당 최대 10MB",
      selectFiles: "파일 선택",
      uploadAll: "파일 분석",
      uploading: "파일 업로드 중...",
      analyzingTitle: "임대 계약 분석 중",
      analyzingDesc: "임대 계약을 검토하고 있습니다. 최대 30초 소요될 수 있습니다...",
      analyzing: {
        uploading: "파일 업로드 중...",
        creating: "임대 계약 기록 생성 중...",
        scanning: "문서를 분석 중...",
        extracting: "임대 계약 세부 정보 추출 중...",
        finalizing: "분석 완료 중..."
      },
      recentScans: "최근 스캔",
      viewAll: "모든 임대 계약 보기",
      noScans: "스캔 기록 없음",
      scanDate: "스캔 날짜",
      confirmNoticeTitle: "통지 기간 알림 설정",
      confirmNoticeDesc: "임대 계약 종료일 감지됨",
      noticePeriodLabel: "통지 기간 (일)",
      noticePeriodHelp: "임대 종료 전에 집주인에게 통지할 일수",
      skipReminder: "건너뛰기",
      setReminder: "알림 설정",
      riskLevels: {
        low: "낮은 위험",
        medium: "중간 위험",
        high: "높은 위험",
        critical: "심각한 위험"
      },
      leaseDetails: "임대 계약 세부 정보",
      basicInfo: "기본 정보",
      propertyAddress: "부동산 주소",
      monthlyRent: "월 임대료",
      securityDeposit: "보증금",
      leasePeriod: "임대 기간",
      leaseStart: "계약 시작",
      leaseEnd: "계약 종료",
      to: "~",
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
      viewLease: "임대 계약서 보기",
      closeDetails: "세부 정보 닫기",
      enableAlertsHelp: "통지 마감일 30일, 7일, 3일 전에 알림 받기",
      deadlineCalculated: "임대 종료일과 통지 기간을 기반으로 계산",
      allLeases: "모든 임대 계약",
      scanLimitReached: "스캔 한도 도달",
      scanLimitMsg: "{limit}회 스캔 중 {used}회 사용{periodText}",
      upgradeForMore: "더 많은 스캔을 위해 업그레이드",
      scansRemaining: "{remaining}회 스캔 남음{periodText}",
      unlimitedScans: "무제한 스캔",
      browseDocuments: "문서 업로드",
      batchUpload: "일괄 업로드",
      singleUpload: "단일 업로드",
      filesWillBeSeparate: "각 파일은 별도의 임대 계약으로 업로드됩니다",
      stepUpload: "업로드",
      stepAnalyze: "분석",
      stepResults: "결과",
      stepTrack: "추적",
      upgradeHintText: "무제한 스캔 및 고급 임대 계약 분석을 잠금 해제하려면 업그레이드하십시오.",
      viewPlans: "플랜 보기",
      disclaimerTitle: "임대차 계약 스캔 면책 조항",
      disclaimerCheckbox: "임대차 계약 스캔 면책 조항을 읽고 이에 동의합니다.",
      agreeAndContinue: "동의 및 계속",
      disclaimerCancel: "취소",
      disclaimerText: {
        p1: "Lease Shield는 사용자가 임대 계약 및 일반적인 위험 영역을 더 잘 이해할 수 있도록 자동 임대 분석, 실용적인 지침 및 문서 템플릿을 제공합니다. 모든 정보는 일반 정보 제공 목적으로만 제공됩니다.",
        p2: "Lease Shield는 법률사무소가 아니며 법률 자문 또는 법률 대리를 제공하지 않습니다. 본 서비스 사용으로 변호사-의뢰인 관계가 성립되지 않습니다.",
        p3: "Lease Shield는 구조화된 분석 및 최신 참조 데이터를 사용하지만, 결과는 문서 품질, 언어 및 관할 구역에 따라 달라질 수 있습니다. Lease Shield는 스캔 결과, 권장 사항 또는 생성된 문서가 완전하거나 오류가 없거나 모든 상황에 적합하다는 것을 보증하지 않습니다.",
        responsibleTitle: "귀하는 다음에 대한 책임이 있습니다:",
        responsibilities: [
          "임대차 계약 문서 검토 및 이해",
          "모든 정보의 정확성 확인",
          "적절한 경우 독립적인 전문가 또는 법률 자문 구하기",
          "제공된 결과물을 신뢰할지 여부 및 방법 결정"
        ],
        p4: "Lease Shield는 어떠한 임대 계약의 당사자도 아니며, 본 서비스 사용으로 인해 내린 결정, 발생한 분쟁 또는 초래된 결과에 대해 책임을 지지 않습니다.",
        p5: "계속 진행하면 Lease Shield가 지원 및 인사이트 도구임을 인정하고 귀하의 재량과 위험 부담으로 사용하는 것에 동의하는 것입니다."
      }
    },
    ru: {
      title: "Сканировать договор",
      subtitle: "Загрузите договор аренды для автоматического анализа",
      uploadArea: "Перетащите файлы договора сюда или нажмите, чтобы выбрать",
      supportedFormats: "Только PDF, PNG или JPG. Максимум 10 МБ на файл",
      selectFiles: "Выбрать файлы",
      uploadAll: "Анализировать файлы",
      uploading: "Загрузка файлов...",
      analyzingTitle: "Анализ вашего договора",
      analyzingDesc: "Проверка договора аренды. Это может занять до 30 секунд...",
      analyzing: {
        uploading: "Загрузка файлов...",
        creating: "Создание записи договора...",
        scanning: "Анализ документа...",
        extracting: "Извлечение деталей договора...",
        finalizing: "Завершение анализа..."
      },
      recentScans: "Последние сканирования",
      viewAll: "Посмотреть все договоры",
      noScans: "Сканирований пока нет",
      scanDate: "Отсканировано",
      confirmNoticeTitle: "Настроить напоминание о периоде уведомления",
      confirmNoticeDesc: "Мы обнаружили, что ваш договор заканчивается",
      noticePeriodLabel: "Период уведомления (дней)",
      noticePeriodHelp: "За сколько дней до окончания договора уведомить арендодателя",
      skipReminder: "Пропустить",
      setReminder: "Установить напоминание",
      riskLevels: {
        low: "Низкий риск",
        medium: "Средний риск",
        high: "Высокий риск",
        critical: "Критический риск"
      },
      leaseDetails: "Детали договора",
      basicInfo: "Основная информация",
      propertyAddress: "Адрес недвижимости",
      monthlyRent: "Ежемесячная аренда",
      securityDeposit: "Залоговый депозит",
      leasePeriod: "Период аренды",
      leaseStart: "Начало аренды",
      leaseEnd: "Окончание аренды",
      to: "до",
      noticeSettings: "Настройки уведомлений",
      noticeAlertsEnabled: "Уведомления включены",
      noticePeriod: "Период уведомления (дней)",
      noticeDeadline: "Крайний срок уведомления",
      edit: "Редактировать",
      save: "Сохранить",
      cancel: "Отмена",
      days: "дней",
      riskAnalysis: "Анализ рисков",
      riskScore: "Оценка риска",
      viewFullReport: "Посмотреть полный отчёт",
      viewScanResults: "Посмотреть результаты сканирования",
      viewLease: "Посмотреть документ договора",
      closeDetails: "Закрыть детали",
      enableAlertsHelp: "Получайте напоминания за 30, 7 и 3 дня до крайнего срока уведомления",
      deadlineCalculated: "Рассчитывается на основе даты окончания договора и периода уведомления",
      allLeases: "Все договоры",
      scanLimitReached: "Лимит сканирований достигнут",
      scanLimitMsg: "Вы использовали {used} из {limit} сканирований{periodText}",
      upgradeForMore: "Обновитесь для большего количества сканирований",
      scansRemaining: "Осталось {remaining} сканирований{periodText}",
      unlimitedScans: "Неограниченные сканирования",
      browseDocuments: "Загрузить файлы",
      batchUpload: "Пакетная загрузка",
      singleUpload: "Одиночная загрузка",
      filesWillBeSeparate: "Каждый файл будет загружен как отдельный договор",
      stepUpload: "Загрузка",
      stepAnalyze: "Анализ",
      stepResults: "Результаты",
      stepTrack: "Отслеживание",
      upgradeHintText: "Обновитесь для неограниченного сканирования и расширенного анализа договоров.",
      viewPlans: "Посмотреть планы",
      disclaimerTitle: "Оговорка о сканировании договора аренды",
      disclaimerCheckbox: "Я прочитал(а) и соглашаюсь с оговоркой о сканировании договора аренды.",
      agreeAndContinue: "Согласиться и продолжить",
      disclaimerCancel: "Отмена",
      disclaimerText: {
        p1: "Lease Shield предоставляет автоматизированный анализ договора аренды, практическое руководство и шаблоны документов, чтобы помочь пользователям лучше понимать договоры аренды и общие области риска. Вся информация предоставляется исключительно в общих информационных целях.",
        p2: "Lease Shield не является юридической фирмой и не предоставляет юридические консультации или юридическое представительство. Использование данного сервиса не создаёт отношений адвокат-клиент.",
        p3: "Хотя Lease Shield использует структурированный анализ и актуальные справочные данные, результаты могут различаться в зависимости от качества документа, языка и юрисдикции. Lease Shield не гарантирует, что результаты сканирования, рекомендации или сгенерированные документы являются полными, безошибочными или подходящими для каждой ситуации.",
        responsibleTitle: "Вы несёте ответственность за:",
        responsibilities: [
          "Просмотр и понимание ваших документов аренды",
          "Подтверждение точности всей информации",
          "Обращение за независимой профессиональной или юридической консультацией при необходимости",
          "Решение о том, полагаться ли на предоставленные результаты и каким образом"
        ],
        p4: "Lease Shield не является стороной какого-либо договора аренды и не несёт ответственности за принятые решения, возникшие споры или последствия, вытекающие из использования данного сервиса.",
        p5: "Продолжая, вы признаёте, что Lease Shield является инструментом поддержки и аналитики, и что вы используете его по своему усмотрению и на свой риск."
      }
    }
  };

  const strings = t[language] || t.en;

  // NEW: Define breadcrumb steps
  const breadcrumbSteps = [
    { label: strings.stepUpload, sublabel: language === 'th' ? 'เลือกไฟล์' : language === 'zh' ? '选择文件' : language === 'ja' ? 'ファイルを選択' : language === 'ko' ? '파일 선택' : language === 'ru' ? 'Выберите файлы' : 'Select files' },
    { label: strings.stepAnalyze, sublabel: language === 'th' ? 'สแกน' : language === 'zh' ? '扫描' : language === 'ja' ? 'スキャン' : language === 'ko' ? '스캔' : language === 'ru' ? 'Сканирование' : 'Scan' },
    { label: strings.stepResults, sublabel: language === 'th' ? 'ดูผล' : language === 'zh' ? '查看结果' : language === 'ja' ? '結果を見る' : language === 'ko' ? '결과 보기' : language === 'ru' ? 'Просмотр результатов' : 'View results' },
    { label: strings.stepTrack, sublabel: language === 'th' ? 'ติดตามมัดจำ' : language === 'zh' ? '追踪押金' : language === 'ja' ? '敷金を追跡' : language === 'ko' ? '보증금 추적' : language === 'ru' ? 'Отслеживать депозит' : 'Track deposit' }
  ];

  // Update step based on upload/analysis state
  useEffect(() => {
    if (analyzing) {
      setCurrentStep(1); // Analyzing step
    } else if (uploading) {
      setCurrentStep(1); // Also uploading/creating/scanning
    } else if (selectedFiles.length > 0) {
      setCurrentStep(0); // Files selected, ready to upload
    } else {
      setCurrentStep(0); // Initial state or after completion/error
    }
  }, [uploading, analyzing, selectedFiles]);

  const updateLeaseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lease.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      setEditingNotice(false);
    }
  });

  const handleAcceptDisclaimerAndProceed = async () => {
    if (!disclaimerCheckboxTicked) return;
    
    haptic.medium();
    setShowDisclaimerModal(false);
    setDisclaimerCheckboxTicked(false);
    
    // Save acceptance to user profile
    await base44.auth.updateMe({ scan_disclaimer_accepted: true });
    queryClient.invalidateQueries({ queryKey: ['user'] });
    
    // Immediately proceed with upload
    proceedWithUpload();
  };

  const proceedWithUpload = async () => {
    // Reset post-scan hint at the start of a new upload attempt
    setShowPostScanHint(false);
    
    // Generate unique request ID for tracking
    const requestId = generateRequestId();
    const deviceContext = getDeviceContext();
    const stages = [];
    const networkLog = [];
    
    const logStage = (stage, data) => {
      const entry = { stage, timestamp: new Date().toISOString(), ...data };
      stages.push(entry);
      console.log(`[${requestId}] ${stage}:`, data);
    };

    const logNetwork = (stage, data) => {
      const entry = { stage, timestamp: new Date().toISOString(), ...data };
      networkLog.push(entry);
      console.log(`[${requestId}] NETWORK ${stage}:`, data);
    };

    logStage('INIT', { 
      deviceContext,
      filesCount: selectedFiles.length,
      userTier
    });

    // ✅ CHECK SCAN LIMIT BEFORE UPLOAD
    if (!scanStatus.allowed) {
      const periodText = scanStatus.period === 'year'
        ? (language === 'th' ? 'ปีนี้' : 'this year')
        : (language === 'th' ? 'ตลอดชีพ' : 'lifetime');

      alert(
        language === 'th'
          ? `คุณใช้ครบโควต้าการสแกนแล้ว (${scanStatus.used}/${scanStatus.limit} ${periodText})\n\nอัปเกรดแผนเพื่อสแกนเพิ่มเติม`
          : `You've reached your scan limit (${scanStatus.used}/${scanStatus.limit} ${periodText})\n\nUpgrade your plan for more scans`
      );
      return;
    }

    if (selectedFiles.length === 0) {
      setError(language === 'th' ? 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์' : 'Please select at least one file');
      setTimeout(() => setError(null), 3000);
      return;
    }

    haptic.medium();

    // MULTI-FILE MODE: Upload ALL files as ONE lease (pages of the same document)
    if (selectedFiles.length > 1) {
      setUploading(true);
      setAnalyzing(false);
      setError(null);
      setUploadProgress(0);
      setCurrentStep(1);
      
      let createdLeaseId = null;

      try {
        // Upload all files first
        const uploadedUrls = [];
        
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          
          setAnalysisStage(language === 'th' ? `กำลังอัปโหลดหน้า ${i + 1}/${selectedFiles.length}` : `Uploading page ${i + 1}/${selectedFiles.length}`);
          setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 30));

          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          uploadedUrls.push(file_url);
        }

        setAnalysisStage('creating');
        setUploadProgress(40);

        // Create ONE lease with all file URLs
        const lease = await base44.entities.Lease.create({
          file_url: uploadedUrls[0], // Primary file
          file_urls: uploadedUrls, // All pages
          status: 'queued',
          created_by: user?.email
        });
        createdLeaseId = lease.id;

        setUploadProgress(50);
        setAnalyzing(true);
        setUploading(false);
        setAnalysisStage('scanning');
        setUploadProgress(60);

        // Trigger analysis with all pages (server creates scanId)
        const { data: scanResponse } = await base44.functions.invoke('scanLease', {
          fileUrls: uploadedUrls,
          requestId,
          leaseId: lease.id
        });
        const scanId = scanResponse?.scanId;
        if (!scanId) { throw new Error('FATAL_CLIENT_ERROR: scanId missing from backend response'); }
        if (scanId === lease.id) { throw new Error('BUG: scanId incorrectly equals leaseId'); }

        if (!scanResponse || scanResponse.ok === false) {
          const err = new Error(scanResponse?.error?.message || 'Scan failed with no message');
          err.code = scanResponse?.error?.code || 'UNKNOWN';
          err.step = scanResponse?.error?.step || 'ANALYSIS';
          throw err;
        }

        // Verify payload was created
        const { data: verifyStatus } = await base44.functions.invoke('debugScanStatus', { scanId });
        if (!verifyStatus?.hasPdfPayload) {
          throw new Error(`Scan saved but report payload missing. Scan pipeline failed: ${verifyStatus?.error?.message || 'Unknown error'}`);
        }
        window.location.href = `/reportfull?scanId=${encodeURIComponent(scanId)}&leaseId=${encodeURIComponent(lease.id)}`;
        return;


        
        const scanResult = scanResponse.result;
        setAnalysisStage('extracting');
        setUploadProgress(70);

        await base44.entities.Lease.update(lease.id, {
          status: 'scanned',
          property_address: scanResult.property_address || null,
          start_date: scanResult.start_date || null,
          end_date: scanResult.end_date || null,
          rent_amount: scanResult.rent_amount > 0 ? scanResult.rent_amount : null,
          deposit_amount: scanResult.deposit_amount > 0 ? scanResult.deposit_amount : null,
          language_detected: scanResult.language_detected || 'en'
        });
        setUploadProgress(90);

        setAnalysisStage('finalizing');
        setUploadProgress(100);
        setCurrentStep(2);

        // Prepare data for review (multi-page mode)
        try {
          console.log('[AUTO_POPULATE] Preparing data for review...');
          const { data: populateResponse } = await base44.functions.invoke('populateTrackersFromScan', {
            scanResult,
            leaseId: lease.id,
            scanId: scan.id
          });
          
          if (populateResponse?.success && populateResponse.review_mode) {
            console.log('[AUTO_POPULATE] Review data prepared:', populateResponse);
            setReviewData(populateResponse);
            setShowReviewScreen(true);
            setCompletedLeaseId(createdLeaseId);
          } else {
            // Fallback: show completion modal
            setCompletedLeaseId(createdLeaseId);
            setShowCompletionModal(true);
          }
        } catch (populateErr) {
          console.error('[AUTO_POPULATE] Failed (non-critical):', populateErr);
          // Show completion modal on error
          setCompletedLeaseId(createdLeaseId);
          setShowCompletionModal(true);
        }
        
        if (scanResult.end_date) {
          setLeaseDetails({
            end_date: scanResult.end_date,
            notice_period_days: scanResult.notice_period_days || 30
          });
          setPendingLeaseId(createdLeaseId);
        }

        setSelectedFiles([]);
        queryClient.invalidateQueries({ queryKey: ['leases'] });
        queryClient.invalidateQueries({ queryKey: ['allScans'] });

      } catch (err) {
        console.error('[MULTI_PAGE_ERROR]', err);

        if (createdLeaseId) {
          try {
            await base44.entities.Lease.update(createdLeaseId, { status: 'failed' });
          } catch (updateErr) {
            console.error('Failed to mark lease as failed:', updateErr);
          }
        }

        setError(typeof err === 'string' ? err : err.message);
        setCurrentStep(0);
      } finally {
        setUploading(false);
        setAnalyzing(false);
        setUploadProgress(0);
        setAnalysisStage('');
      }
      
      return;
    }

    // SINGLE MODE: Keep existing logic with file normalization
    setUploading(true);
    setError(null);
    setDebugLog(null);
    setUploadProgress(0);
    setRetryCount(0);
    setAnalysisStage('uploading');
    setCurrentStep(1); // Move to analyzing

    let currentRetry = 0;
    let createdLeaseId = null;
    const maxRetries = 0; // Disable auto-retry to show errors immediately

    const attemptUpload = async () => {
      let scanId = null;
      try {
        // STEP 0: Preflight check - verify files are readable
        logStage('PREFLIGHT_CHECK_START', {
          filesCount: selectedFiles.length
        });

        for (let i = 0; i < selectedFiles.length; i++) {
          const preflightResult = await preflightCheck(selectedFiles[i], requestId);
          if (!preflightResult.success) {
            logStage('PREFLIGHT_FAILED', {
              fileIndex: i,
              fileName: selectedFiles[i].name,
              error: preflightResult.error
            });
            throw new Error(`PREFLIGHT_READ_FAILED: ${preflightResult.error}`);
          }
        }

        logStage('PREFLIGHT_CHECK_PASSED', { filesCount: selectedFiles.length });

        // STEP 1: Normalize files (critical for Google Drive PDFs on Android)
        logStage('FILE_NORMALIZATION_START', {
          filesCount: selectedFiles.length,
          fileDetails: selectedFiles.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
            lastModified: f.lastModified
          }))
        });

        const normalizedResults = await normalizeFiles(selectedFiles, requestId);
        
        const failedFiles = normalizedResults.filter(r => !r.success);
        if (failedFiles.length > 0) {
          logStage('FILE_NORMALIZATION_FAILED', {
            failedCount: failedFiles.length,
            errors: failedFiles.map(f => ({ name: f.original.name, error: f.error }))
          });
          throw new Error(`FILE_NORMALIZATION_FAILED: ${failedFiles[0].error}`);
        }

        const normalizedFiles = normalizedResults.map(r => r.normalized);
        logStage('FILE_NORMALIZATION_SUCCESS', {
          normalizedCount: normalizedFiles.length,
          wasNormalized: normalizedResults.some(r => r.wasNormalized)
        });

        setAnalysisStage('uploading');
        setUploadProgress(10);

        // STEP 2: Upload normalized files using mobile-proof uploader
        const uploadTimeoutMs = getUploadTimeout();
        
        logStage('UPLOAD_START', { filesCount: normalizedFiles.length });
        logNetwork('UPLOAD_CONFIG', {
          method: 'POST',
          integration: 'Core.UploadFile',
          filesCount: normalizedFiles.length,
          totalBytes: normalizedFiles.reduce((sum, f) => sum + f.size, 0),
          timeoutMs: uploadTimeoutMs,
          timeoutConfigured: uploadTimeoutMs > 0,
          devicePlatform: deviceContext.platform,
          isAndroid: deviceContext.isAndroid,
          runtime: deviceContext.runtime
        });

        const uploadStartTime = Date.now();

        const uploadResults = await uploadMultipleFiles(
          normalizedFiles,
          requestId,
          (fileIndex, progress) => {
            const overallProgress = 10 + (fileIndex / normalizedFiles.length * 20) + (progress / 100 * (20 / normalizedFiles.length));
            setUploadProgress(Math.round(overallProgress));
          }
        );

        const uploadDuration = Date.now() - uploadStartTime;
        
        // Check for failures
        const failedUploads = uploadResults.filter(r => !r.success);
        if (failedUploads.length > 0) {
          logStage('UPLOAD_FAILED', {
            failedCount: failedUploads.length,
            errors: failedUploads.map(r => ({ file: r.fileName, error: r.error }))
          });
          
          // Merge network logs
          failedUploads.forEach(r => {
            if (r.networkLog) {
              networkLog.push(...r.networkLog);
            }
          });
          
          throw new Error(`UPLOAD_FAILED: ${failedUploads[0].error}`);
        }
        
        const fileUrls = uploadResults.map(r => r.file_url);
        
        // Merge all network logs
        uploadResults.forEach(r => {
          if (r.networkLog) {
            networkLog.push(...r.networkLog);
          }
        });
        
        logStage('UPLOAD_SUCCESS', {
          duration: uploadDuration,
          filesUploaded: fileUrls.length,
          totalBytesUploaded: uploadResults.reduce((sum, r) => sum + (r.bytesUploaded || 0), 0),
          urls: fileUrls.map(url => url.substring(0, 100) + '...')
        });
        
        setUploadProgress(30);

        setAnalysisStage('creating');
        setUploadProgress(40);

        const lease = await base44.entities.Lease.create({
          file_url: fileUrls[0],
          file_urls: fileUrls,
          status: 'uploaded',
          created_by: user?.email // Ensure created_by is set
        });
        createdLeaseId = lease.id;
        setUploadProgress(50);

        setAnalyzing(true);
        setUploading(false);
        setAnalysisStage('scanning');
        setUploadProgress(60);

        // STEP 3: Invoke analysis
        logStage('ANALYSIS_START', { fileUrls });
        const analysisStartTime = Date.now();

        const { data: scanResponse } = await base44.functions.invoke('scanLease', {
          fileUrls: fileUrls,
          requestId,
          leaseId: createdLeaseId
        });
        scanId = scanResponse?.scanId;
        if (!scanId) { throw new Error('FATAL_CLIENT_ERROR: scanId missing from backend response'); }
        if (scanId === createdLeaseId) { throw new Error('BUG: scanId incorrectly equals leaseId'); }

        const analysisDuration = Date.now() - analysisStartTime;
        
        logStage('ANALYSIS_RESPONSE', {
          duration: analysisDuration,
          success: scanResponse?.success,
          hasResult: !!scanResponse?.result,
          backendRequestId: scanResponse?.diagnostic?.requestId,
          buildTag: scanResponse?.diagnostic?.buildTag,
          error: scanResponse?.error
        });

        if (!scanResponse || scanResponse.ok === false) {
          const backendError = scanResponse?.error || { code: 'UNKNOWN_BACKEND_ERROR', step: 'ANALYSIS', message: 'Scan failed without specific error' };
          
          logStage('ANALYSIS_FAILED', { error: backendError });

          const errorObj = new Error(backendError.message);
          errorObj.code = backendError.code;
          errorObj.step = backendError.step;
          errorObj.stack = backendError.stack;
          errorObj.requestId = requestId;
          throw errorObj;
        }

        // VERIFY PAYLOAD PERSISTED
        logStage('VERIFICATION_START', { scanId });
        const { data: verifyStatus } = await base44.functions.invoke('debugScanStatus', { scanId });
        
        if (!verifyStatus?.hasPdfPayload) {
          const verificationError = new Error(`Post-scan verification failed: Report payload is missing.`);
          verificationError.code = 'VERIFICATION_FAILED';
          verificationError.step = 'SELF_CHECK';
          verificationError.details = verifyStatus;
          throw verificationError;
        }
        
        logStage('VERIFICATION_PASSED', { isFallback: verifyStatus.isFallback });
        setUploadProgress(90);
        
        logStage('ANALYSIS_SUCCESS', {
          riskScore: scanResponse.result?.risk_score,
          flagsCount: scanResponse.result?.flags?.length
        });

        // Navigate to report with server-provided scanId
        if (!scanId) throw new Error('BUG: scanId missing');
        if (scanId === createdLeaseId) throw new Error('BUG: scanId incorrectly equals leaseId');
        window.location.href = `/reportfull?scanId=${encodeURIComponent(scanId)}&leaseId=${encodeURIComponent(createdLeaseId)}`;
        return;

        const scanResult = scanResponse.result;
        setAnalysisStage('extracting');
        setUploadProgress(70);

        await base44.entities.Lease.update(createdLeaseId, {
          status: 'scanned',
          property_address: scanResult.property_address || null,
          start_date: scanResult.start_date || null,
          end_date: scanResult.end_date || null,
          rent_amount: scanResult.rent_amount > 0 ? scanResult.rent_amount : null,
          deposit_amount: scanResult.deposit_amount > 0 ? scanResult.deposit_amount : null,
          language_detected: scanResult.language_detected || 'en'
        });
        setUploadProgress(80);

        setAnalysisStage('finalizing');


        setUploadProgress(100);
        setCurrentStep(2); // Move to results step

        // Auto-populate trackers and timeline
        try {
          console.log('[AUTO_POPULATE] Starting auto-population...');
          const { data: populateResponse } = await base44.functions.invoke('populateTrackersFromScan', {
            scanResult,
            leaseId: createdLeaseId,
            scanId
          });
          
          if (populateResponse?.success) {
            console.log('[AUTO_POPULATE] Success:', populateResponse);
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['deposits'] });
            queryClient.invalidateQueries({ queryKey: ['timelineEvents'] });
          }
        } catch (populateErr) {
          console.error('[AUTO_POPULATE] Failed (non-critical):', populateErr);
          // Don't block user flow if auto-population fails
        }

        // Show completion modal
        setCompletedLeaseId(createdLeaseId);
        setShowCompletionModal(true);
        
        if (scanResult.end_date) {
          setLeaseDetails({
            end_date: scanResult.end_date,
            notice_period_days: scanResult.notice_period_days || 30
          });
          setPendingLeaseId(createdLeaseId);
        }

        setSelectedFiles([]);
        queryClient.invalidateQueries({ queryKey: ['leases'] });
        queryClient.invalidateQueries({ queryKey: ['allScans'] });

      } catch (err) {
        logStage('ERROR_CAUGHT', {
          error: err.message,
          details: err.details,
          stage: analysisStage,
          retryAttempt: currentRetry
        });

        currentRetry++;
        setRetryCount(currentRetry);

        if (false) { // RETRY DISABLED
          // This block is now disabled to show errors immediately.
        } else {
          // Final failure after all retries - categorize and format error
          const formattedError = formatErrorForUser(err, requestId, language, {
            uploadStage: analysisStage
          });
          formattedError.scanId = scanId || null;
          const debugData = createDebugLog(requestId, stages, deviceContext, networkLog);
          
          logStage('FINAL_FAILURE', {
            category: formattedError.category,
            retriesExhausted: true,
            devicePlatform: deviceContext.platform,
            isAndroid: deviceContext.isAndroid,
            uploadStage: analysisStage
          });

          setError(formattedError);
          setDebugLog(debugData);

          if (createdLeaseId) {
            try {
              await base44.entities.Lease.delete(createdLeaseId);
            } catch (cleanupErr) {
              console.error('Failed final cleanup:', cleanupErr);
            }
          }
          setCurrentStep(0); // Reset step on error
        }
      } finally {
        setUploading(false);
        setAnalyzing(false);
        setUploadProgress(0);
        setAnalysisStage('');
      }
    };

    await attemptUpload();
  };

  const handleUploadAll = async () => {
    // Check if user needs to see disclaimer first
    if (!user?.scan_disclaimer_accepted) {
      setShowDisclaimerModal(true);
      return;
    }
    
    // If already accepted, proceed directly
    proceedWithUpload();
  };

  const handleConfirmLeaseDetails = async () => {
    if (!pendingLeaseId || !leaseDetails) return;

    haptic.medium();

    try {
      const endDate = new Date(leaseDetails.end_date);
      const deadline = new Date(endDate);
      deadline.setDate(deadline.getDate() - leaseDetails.notice_period_days);

      await base44.entities.Lease.update(pendingLeaseId, {
        notice_period_days: leaseDetails.notice_period_days,
        notice_alerts_enabled: true,
        notice_deadline: deadline.toISOString().split('T')[0]
      });

      queryClient.invalidateQueries({ queryKey: ['leases'] });
      setShowConfirmation(false);
      setCurrentStep(3);
      haptic.success();
    } catch (err) {
      console.error('Failed to update lease details:', err);
      setShowConfirmation(false);
      setCurrentStep(3);
      haptic.error();
    }
  };

  const handleCompletionViewResults = async () => {
    haptic.medium();
    setShowCompletionModal(false);
    
    const lease = leases.find(l => l.id === completedLeaseId);
    if (lease) {
      setSelectedLease(lease);
    }
  };

  const handleCompletionDone = () => {
    haptic.light();
    setShowCompletionModal(false);
    setCompletedLeaseId(null);
    setCurrentStep(0);
    if (userTier === 'free') {
      setShowPostScanHint(true);
    }
  };

  const handleConfirmReviewedData = async (editedData) => {
    setSavingConfirmedData(true);
    haptic.medium();

    try {
      console.log('[CONFIRM_SCAN_DATA] Saving confirmed data...');
      
      // Reconstruct deposit data from edited form
      const depositData = {
        deposit_amount: editedData.deposit_amount || reviewData.data_prepared.deposit_tracker.deposit_amount,
        property_address: editedData.property_address || reviewData.data_prepared.deposit_tracker.property_address,
        rent_amount: editedData.monthly_rent || reviewData.data_prepared.deposit_tracker.rent_amount,
        rent_due_day: editedData.rent_due_day || reviewData.data_prepared.deposit_tracker.rent_due_day,
        deposit_paid_date: editedData.deposit_due_date || reviewData.data_prepared.deposit_tracker.deposit_paid_date,
        expected_return_date: editedData.expected_return_date || reviewData.data_prepared.deposit_tracker.expected_return_date,
        deposit_due_date: editedData.deposit_due_date || reviewData.data_prepared.deposit_tracker.deposit_due_date,
        lease_start_date: editedData.lease_start || reviewData.data_prepared.deposit_tracker.lease_start_date,
        lease_end_date: editedData.lease_end || reviewData.data_prepared.deposit_tracker.lease_end_date,
        ...reviewData.data_prepared.deposit_tracker,
        existingDepositId: reviewData.data_prepared.deposit_tracker.existingDepositId
      };

      const { data: confirmResponse } = await base44.functions.invoke('confirmScanData', {
        depositData,
        timelineEvents: reviewData.data_prepared.timeline_events,
        scanId: completedLeaseId,
        leaseId: completedLeaseId
      });

      if (confirmResponse?.success) {
        console.log('[CONFIRM_SCAN_DATA] Data saved successfully');
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['deposits'] });
        queryClient.invalidateQueries({ queryKey: ['timelineEvents'] });
        
        setShowReviewScreen(false);
        setShowCompletionModal(true);
        haptic.success();
      } else {
        throw new Error('Failed to save confirmed data');
      }
    } catch (error) {
      console.error('[CONFIRM_SCAN_DATA] Error:', error);
      alert(language === 'th' ? 'ไม่สามารถบันทึกข้อมูลได้' : 'Failed to save data');
      haptic.error();
    } finally {
      setSavingConfirmedData(false);
    }
  };

  const handleCancelReview = () => {
    haptic.light();
    setShowReviewScreen(false);
    setShowCompletionModal(true);
  };

  const handleSkipConfirmation = () => {
    haptic.light();
    setShowConfirmation(false);
    setCurrentStep(2);
  };

  const handleAddPages = async () => {
    if (!addingPagesToLease || additionalFiles.length === 0) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);
    setAnalysisStage('uploading');

    try {
      const existingUrls = addingPagesToLease.file_urls || [addingPagesToLease.file_url];
      const newUrls = [];

      // Upload new pages
      for (let i = 0; i < additionalFiles.length; i++) {
        const file = additionalFiles[i];
        
        setAnalysisStage(language === 'th' ? `กำลังอัปโหลดหน้าใหม่ ${i + 1}/${additionalFiles.length}` : `Uploading new page ${i + 1}/${additionalFiles.length}`);
        setUploadProgress(Math.round(((i + 1) / additionalFiles.length) * 30));

        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        newUrls.push(file_url);
      }

      const allUrls = [...existingUrls, ...newUrls];

      // Update lease with new pages and set to re-analyzing
      await base44.entities.Lease.update(addingPagesToLease.id, {
        file_urls: allUrls,
        status: 'processing'
      });

      setUploadProgress(40);
      setAnalysisStage('scanning');
      setUploadProgress(50);

      // Re-trigger analysis
      const { data: scanResponse } = await base44.functions.invoke('scanLease', {
        fileUrls: allUrls,
        requestId: `reanalyze-${Date.now()}`,
        leaseId: addingPagesToLease.id,
        scanId: addingPagesToLease.id
      });

      if (!scanResponse || !scanResponse.success) {
        throw new Error(scanResponse?.error || 'Re-analysis failed');
      }

      const scanResult = scanResponse.result;
      setAnalysisStage('extracting');
      setUploadProgress(70);

      await base44.entities.Lease.update(addingPagesToLease.id, {
        status: 'scanned',
        property_address: scanResult.property_address || null,
        start_date: scanResult.start_date || null,
        end_date: scanResult.end_date || null,
        rent_amount: scanResult.rent_amount > 0 ? scanResult.rent_amount : null,
        deposit_amount: scanResult.deposit_amount > 0 ? scanResult.deposit_amount : null,
        language_detected: scanResult.language_detected || 'en'
      });

      // Update existing scan
      const existingScans = await base44.entities.LeaseScan.filter({ lease_id: addingPagesToLease.id });
      if (existingScans.length > 0) {
        await base44.entities.LeaseScan.update(existingScans[0].id, {
          risk_score: scanResult.risk_score,
          flags: scanResult.issues_validated || scanResult.flags || [],
          summary: scanResult.summary,
          scan_full: {
            ...scanResult,
            issues_validated: scanResult.issues_validated || scanResult.flags || [],
            issues_invalid: scanResult.issues_invalid || [],
            flags: scanResult.issues_validated || scanResult.flags || []
          },
          version: '3.0'
        });
      }

      setUploadProgress(100);

      // Show completion modal
      setCompletedLeaseId(addingPagesToLease.id);
      setShowCompletionModal(true);
      setAddingPagesToLease(null);
      setAdditionalFiles([]);
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['allScans'] });

    } catch (err) {
      console.error('Failed to add pages:', err);
      setError(typeof err === 'string' ? err : err.message);
      
      if (addingPagesToLease) {
        await base44.entities.Lease.update(addingPagesToLease.id, { status: 'failed' });
      }
    } finally {
      setUploading(false);
      setAnalyzing(false);
      setUploadProgress(0);
      setAnalysisStage('');
    }
  };

  const deleteLeaseWithScanMutation = useMutation({
    mutationFn: async (leaseId) => {
      const associatedScans = await base44.entities.LeaseScan.filter({ lease_id: leaseId });
      for (const scan of associatedScans) {
        await base44.entities.LeaseScan.delete(scan.id);
      }
      await base44.entities.Lease.delete(leaseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['allScans'] });
      setSelectedLease(null);
    },
  });

  const handleSwipeDelete = (leaseId) => {
    haptic.heavy();
    const confirmMessage = language === 'th'
      ? 'คุณแน่ใจหรือไม่ว่าต้องการลบการสแกนนี้?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้'
      : 'Are you sure you want to delete this scan?\n\nThis action cannot be undone.';

    const userConfirmed = window.confirm(confirmMessage);

    if (userConfirmed) {
      deleteLeaseWithScanMutation.mutate(leaseId);
    }
  };

  const handleDeleteLease = (leaseId, e) => {
    e.stopPropagation();

    const confirmMessage = language === 'th'
      ? 'คุณแน่ใจหรือไม่ว่าต้องการลบการสแกนนี้?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้'
      : 'Are you sure you want to delete this scan?\n\nThis action cannot be undone.';

    const userConfirmed = window.confirm(confirmMessage);

    if (userConfirmed) {
      haptic.heavy();
      deleteLeaseWithScanMutation.mutate(leaseId);
    }
  };

  const handleViewDetails = (lease) => {
    setSelectedLease(lease);
  };

  const handleFileSelect = (e) => {
    // Only allow file selection if upload is allowed
    if (!scanStatus.allowed) return;
    const files = Array.from(e.target.files || e.dataTransfer?.files || []);
    
    // Validate file types
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      const validExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
      const validMimeTypes = ['application/pdf', 'image/png', 'image/jpeg'];
      
      if (validExtensions.includes(ext) || validMimeTypes.includes(file.type)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });
    
    if (invalidFiles.length > 0) {
      const errorMsg = language === 'th'
        ? `รองรับเฉพาะ PDF, PNG และ JPG\n\nไฟล์ที่ไม่รองรับ: ${invalidFiles.join(', ')}`
        : language === 'zh'
          ? `仅支持 PDF、PNG 和 JPG\n\n不支持的文件: ${invalidFiles.join(', ')}`
          : language === 'ja'
            ? `PDF、PNG、JPG のみサポート\n\nサポートされていないファイル: ${invalidFiles.join(', ')}`
            : language === 'ko'
              ? `PDF, PNG, JPG만 지원됩니다\n\n지원되지 않는 파일: ${invalidFiles.join(', ')}`
              : language === 'ru'
                ? `Поддерживаются только PDF, PNG и JPG\n\nНеподдерживаемые файлы: ${invalidFiles.join(', ')}`
                : `Only PDF, PNG, and JPG files are supported.\n\nUnsupported files: ${invalidFiles.join(', ')}`;
      
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
    
    setDragActive(false);
  };

  const handleDrop = (e) => {
    // Only allow drop if upload is allowed
    if (!scanStatus.allowed) return;
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    
    // Validate file types
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      const validExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
      const validMimeTypes = ['application/pdf', 'image/png', 'image/jpeg'];
      
      if (validExtensions.includes(ext) || validMimeTypes.includes(file.type)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });
    
    if (invalidFiles.length > 0) {
      const errorMsg = language === 'th'
        ? `รองรับเฉพาะ PDF, PNG และ JPG\n\nไฟล์ที่ไม่รองรับ: ${invalidFiles.join(', ')}`
        : language === 'zh'
          ? `仅支持 PDF、PNG 和 JPG\n\n不支持的文件: ${invalidFiles.join(', ')}`
          : language === 'ja'
            ? `PDF、PNG、JPG のみサポート\n\nサポートされていないファイル: ${invalidFiles.join(', ')}`
            : language === 'ko'
              ? `PDF, PNG, JPG만 지원됩니다\n\n지원되지 않는 파일: ${invalidFiles.join(', ')}`
              : language === 'ru'
                ? `Поддерживаются только PDF, PNG и JPG\n\nНеподдерживаемые файлы: ${invalidFiles.join(', ')}`
                : `Only PDF, PNG, and JPG files are supported.\n\nUnsupported files: ${invalidFiles.join(', ')}`;
      
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRetry = () => {
    setError(null);
    setDebugLog(null);
    setSelectedFiles([]);
    setUploadProgress(0);
    setRetryCount(0);
    setAnalysisStage('');
    setCurrentStep(0); // Reset step on retry
  };



  const handleToggleAlerts = async (enabled) => {
    haptic.light();
    await updateLeaseMutation.mutateAsync({
      id: selectedLease.id,
      data: { notice_alerts_enabled: enabled }
    });
    setSelectedLease({ ...selectedLease, notice_alerts_enabled: enabled });
  };

  const handleSaveNoticeSettings = async () => {
    if (!selectedLease.end_date || !noticeSettings.notice_period_days) {
      alert(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill in all fields');
      return;
    }

    haptic.medium();

    const endDate = new Date(selectedLease.end_date);
    const deadline = new Date(endDate);
    deadline.setDate(deadline.getDate() - noticeSettings.notice_period_days);

    await updateLeaseMutation.mutateAsync({
      id: selectedLease.id,
      data: {
        notice_period_days: noticeSettings.notice_period_days,
        notice_deadline: deadline.toISOString().split('T')[0]
      }
    });

    setSelectedLease({
      ...selectedLease,
      notice_period_days: noticeSettings.notice_period_days,
      notice_deadline: deadline.toISOString().split('T')[0]
    });
    setEditingNotice(false);
    haptic.success();
  };

  const getRiskColor = (score) => {
    if (score >= 75) return '#EF4444'; // Red (Critical)
    if (score >= 50) return '#F59E0B'; // Orange (High)
    if (score >= 25) return '#EAB308'; // Yellow (Medium)
    return '#10B981'; // Green (Low)
  };

  // Get scan for selected lease
  const selectedScan = selectedLease ? allScans.find(s => s.lease_id === selectedLease.id) : null;

  // Check URL params and open lease modal if leaseId is provided
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const leaseIdFromUrl = urlParams.get('leaseId');

    if (leaseIdFromUrl && leases.length > 0) {
      const leaseToOpen = leases.find(l => l.id === leaseIdFromUrl);
      if (leaseToOpen) {
        setSelectedLease(leaseToOpen);
        // Clear the URL param
        window.history.replaceState({}, '', createPageUrl("UploadScan"));
      }
    }
  }, [leases]);

  const getPeriodText = (period) => {
    if (period === 'year') {
      return language === 'th' ? 'ปีนี้' : language === 'ru' ? 'в этом году' : 'this year';
    } else if (period === 'lifetime') {
      return language === 'th' ? 'ตลอดชีพ' : language === 'ru' ? 'за всё время' : 'lifetime';
    }
    return '';
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-5xl mx-auto">
        
        {/* Review Screen (full page, not modal) */}
        {showReviewScreen && reviewData && (
          <ScanReviewConfirmation
            reviewData={reviewData.review_required}
            onConfirm={handleConfirmReviewedData}
            onCancel={handleCancelReview}
            colors={colors}
            language={language}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Main upload UI (hidden when review screen is active) */}
        {!showReviewScreen && (
          <>
        {/* NEW: Progress Breadcrumb */}
        {(uploading || analyzing || selectedFiles.length > 0) && (
          <div className="mb-6">
            <ProgressBreadcrumb
              steps={breadcrumbSteps}
              currentStep={currentStep}
              primaryColor="#0C3B2E"
              secondaryColor="#C7A338"
            />
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>{strings.title}</h1>
          <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>

          {/* ✅ SCAN LIMIT INDICATOR */}
          <div className="mt-3">
            {getScanLimits().unlimited ? (
              <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                ✨ {strings.unlimitedScans}
              </Badge>
            ) : (
              <Badge className={scanStatus.allowed ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}>
                {scanStatus.allowed
                  ? strings.scansRemaining
                      .replace('{remaining}', scanStatus.remaining)
                      .replace('{periodText}', getPeriodText(scanStatus.period))
                  : strings.scanLimitMsg
                      .replace('{used}', scanStatus.used)
                      .replace('{limit}', scanStatus.limit)
                      .replace('{periodText}', getPeriodText(scanStatus.period))
                }
              </Badge>
            )}
          </div>
        </div>

        {/* ✅ NEW: Post-scan upgrade hint */}
        {showPostScanHint && userTier === 'free' && (
          <div
            style={{
              marginBottom: 16,
              padding: 10,
              borderRadius: 12,
              backgroundColor: isDarkMode ? 'rgba(12,59,46,0.12)' : 'rgba(12,59,46,0.06)',
              border: '1px dashed rgba(12,59,46,0.25)',
              fontSize: '0.8rem',
              color: colors.textPrimary
            }}
          >
            <strong>Tip:</strong> {strings.upgradeHintText}
            <button
              onClick={() => navigate(createPageUrl('Account') + '#plans')}
              style={{
                padding: '4px 8px',
                borderRadius: 9999,
                backgroundColor: '#0C3B2E',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                marginLeft: 6,
              }}
            >
              {strings.viewPlans}
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg border-2 border-red-200" style={{ backgroundColor: isDarkMode ? '#3A2626' : '#FEF2F2' }}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-600 font-semibold mb-1">
                  {typeof error === 'object' ? `[${error.code || 'FAIL'}] Scan failed at step: ${error.step || 'ANALYSIS'}` : 'Error Occurred'}
                </p>
                <p className="text-red-600 text-sm whitespace-pre-line mb-2">
                  {typeof error === 'object' ? error.message : String(error)}
                </p>
                {typeof error === 'object' && error.requestId && (
                    <p className="text-red-500 text-xs font-mono">Request ID: {error.requestId}</p>
                )}
                {typeof error === 'object' && error.scanId && (
                    <p className="text-red-500 text-xs font-mono">Scan ID: {error.scanId}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleRetry} className="border-red-300 text-red-700 hover:bg-red-100">
                        Try Again
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(JSON.stringify({error, debugLog}, null, 2))}>
                        <Copy className="w-3 h-3 mr-1" /> Copy Error
                    </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lease Details Confirmation Modal */}
        {showConfirmation && leaseDetails && (
          <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
            <DialogContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <DialogHeader>
                <DialogTitle style={{ color: colors.textPrimary }}>{strings.confirmNoticeTitle}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p style={{ color: colors.textSecondary }}>
                  {leaseDetails.end_date ? `${strings.confirmNoticeDesc}: ${format(new Date(leaseDetails.end_date), 'MMM d, yyyy')}` : `${strings.confirmNoticeDesc}: N/A`}
                </p>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {strings.noticePeriodLabel}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={leaseDetails.notice_period_days}
                    onChange={(e) => setLeaseDetails({...leaseDetails, notice_period_days: parseInt(e.target.value)})}
                    className="w-full p-3 border-2 rounded-lg"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                  />
                  <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    {strings.noticePeriodHelp}
                  </p>
                </div>
                <Button
                  onClick={handleConfirmLeaseDetails}
                  className="w-full py-6 text-base font-bold"
                  style={{
                    backgroundColor: '#0C3B2E',
                    color: '#FFFFFF',
                    minHeight: '56px',
                    fontSize: '16px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0a2f25';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0C3B2E';
                  }}
                >
                  {strings.setReminder}
                </Button>
                <button
                  onClick={handleSkipConfirmation}
                  className="w-full text-center py-2 text-sm font-medium transition-colors"
                  style={{ color: colors.textSecondary }}
                  onMouseEnter={(e) => e.target.style.color = colors.textPrimary}
                  onMouseLeave={(e) => e.target.style.color = colors.textSecondary}
                >
                  {strings.skipReminder}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Lease Details Modal - REDESIGNED CLEAN & STRUCTURED */}
        {selectedLease && (
          <Dialog open={!!selectedLease} onOpenChange={() => setSelectedLease(null)}>
            <DialogContent
              className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col p-0"
              style={{ backgroundColor: colors.cardBg }}
            >
              <DialogHeader className="px-6 py-4 border-b flex-shrink-0 flex flex-row items-center justify-between" style={{
                backgroundColor: colors.cardBg,
                borderBottom: `1px solid ${colors.borderColor}`
              }}>
                <DialogTitle className="text-xl font-bold" style={{ color: colors.textPrimary }}>{strings.leaseDetails}</DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
                {/* Basic Info */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm" style={{ color: colors.textSecondary }}>{strings.basicInfo}</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                      <p className="font-semibold mb-1 text-xs" style={{ color: colors.textSecondary }}>{strings.propertyAddress}</p>
                      <p className="break-words text-sm" style={{ color: colors.textPrimary }}>{selectedLease.property_address || 'N/A'}</p>
                    </div>
                    {selectedLease.rent_amount > 0 && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                        <p className="font-semibold mb-1 text-xs" style={{ color: colors.textSecondary }}>{strings.monthlyRent}</p>
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                          ฿{selectedLease.rent_amount.toLocaleString('en-US')}
                        </p>
                      </div>
                    )}
                    {selectedLease.deposit_amount > 0 && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                        <p className="font-semibold mb-1 text-xs" style={{ color: colors.textSecondary }}>{strings.securityDeposit}</p>
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                          ฿{selectedLease.deposit_amount.toLocaleString('en-US')}
                        </p>
                      </div>
                    )}
                    {(selectedLease.start_date || selectedLease.end_date) && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                        <p className="font-semibold mb-1 text-xs" style={{ color: colors.textSecondary }}>{strings.leasePeriod}</p>
                        <p className="break-words text-sm" style={{ color: colors.textPrimary }}>
                          {selectedLease.start_date ? format(new Date(selectedLease.start_date), 'MMM d, yyyy') : 'N/A'} {strings.to} {selectedLease.end_date ? format(new Date(selectedLease.end_date), 'MMM d, yyyy') : 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notice Settings */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm" style={{ color: colors.textSecondary }}>{strings.noticeSettings}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.cardBg }}>
                      <div className="flex-1 pr-3">
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>{strings.noticeAlertsEnabled}</p>
                        <p className="text-xs break-words" style={{ color: colors.textSecondary }}>{strings.enableAlertsHelp}</p>
                      </div>
                      <Switch
                        checked={selectedLease.notice_alerts_enabled !== false}
                        onCheckedChange={handleToggleAlerts}
                        disabled={!selectedLease.end_date}
                      />
                    </div>

                    {!editingNotice ? (
                      <div className="space-y-3">
                        {selectedLease.end_date && (
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.noticePeriod}</p>
                              <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                                {selectedLease.notice_period_days || 30} {strings.days}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => {
                              setNoticeSettings({ notice_period_days: selectedLease.notice_period_days || 30 });
                              setEditingNotice(true);
                            }} disabled={!selectedLease.end_date}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              {strings.edit}
                            </Button>
                          </div>
                        )}
                        {selectedLease.notice_deadline && (
                          <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1E4435' : '#ECFDF5' }}>
                            <p className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>{strings.noticeDeadline}</p>
                            <p className="text-lg font-bold break-words" style={{ color: colors.textPrimary }}>
                              {format(new Date(selectedLease.notice_deadline), 'MMMM d, yyyy')}
                            </p>
                            <p className="text-xs mt-1 break-words" style={{ color: colors.textSecondary }}>
                              {strings.deadlineCalculated}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                            {strings.noticePeriodLabel}
                          </label>
                          <input
                            type="number"
                            value={noticeSettings.notice_period_days}
                            onChange={(e) => setNoticeSettings({ notice_period_days: parseInt(e.target.value) || 30 })}
                            min="1"
                            max="365"
                            className="w-full p-3 border-2 rounded-lg"
                            style={{
                              backgroundColor: colors.inputBg,
                              borderColor: colors.borderColor,
                              color: colors.textPrimary
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setEditingNotice(false)} className="flex-1">
                            <X className="w-4 h-4 mr-2" />
                            {strings.cancel}
                          </Button>
                          <Button onClick={handleSaveNoticeSettings} className="flex-1 bg-ls-forest hover:bg-ls-forest/90">
                            <Save className="w-4 h-4 mr-2" />
                            {strings.save}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Risk Summary Section */}
                {selectedScan && (() => {
                  const riskLevel = selectedScan.risk_score >= 70 
                    ? { level: 'high', label: language === 'th' ? 'ความเสี่ยงสูง' : language === 'ru' ? 'Высокий' : 'HIGH RISK', color: '#EF4444', bg: '#FEE2E2' }
                    : selectedScan.risk_score >= 40
                      ? { level: 'medium', label: language === 'th' ? 'ความเสี่ยงปานกลาง' : language === 'ru' ? 'Средний' : 'MEDIUM RISK', color: '#F59E0B', bg: '#FEF3C7' }
                      : { level: 'low', label: language === 'th' ? 'ความเสี่ยงต่ำ' : language === 'ru' ? 'Низкий' : 'LOW RISK', color: '#10B981', bg: '#D1FAE5' };
                  
                  return (
                    <div className="space-y-4">
                      <h3 className="font-bold text-base" style={{ color: colors.textPrimary }}>{strings.riskAnalysis}</h3>
                      
                      <div className="p-5 rounded-xl border-2" style={{
                        backgroundColor: riskLevel.bg,
                        borderColor: riskLevel.color
                      }}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs font-semibold mb-1 opacity-80" style={{ color: riskLevel.color }}>{strings.riskScore}</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-bold" style={{ color: riskLevel.color }}>
                                {selectedScan.risk_score}
                              </span>
                              <span className="text-xl font-semibold" style={{ color: riskLevel.color }}>/100</span>
                            </div>
                          </div>
                          <Badge className="text-sm font-bold px-3 py-1" style={{
                            backgroundColor: riskLevel.color,
                            color: '#FFFFFF'
                          }}>
                            {riskLevel.label}
                          </Badge>
                        </div>
                        {selectedScan.summary && (
                          <p className="text-xs leading-relaxed mt-3 pt-3 border-t" style={{
                            color: riskLevel.color,
                            borderTopColor: `${riskLevel.color}50`
                          }}>
                            {selectedScan.summary}
                          </p>
                        )}
                      </div>

                      {/* Primary Action: View Full Report */}
                      <Button
                        onClick={() => {
                          haptic.medium();
                          setSelectedLease(null);
                          navigate(`/reportfull?scanId=${selectedScan.id}&leaseId=${selectedLease.id}`);
                        }}
                        className="w-full py-4 text-base font-bold"
                        style={{
                          backgroundColor: '#0C3B2E',
                          color: '#FFFFFF',
                          minHeight: '56px'
                        }}
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        {strings.viewFullReport}
                      </Button>

                      {/* Secondary Actions */}
                      <div className="flex flex-col gap-2">
                        {selectedLease.file_url && (
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              haptic.light();
                              setDocumentToView(selectedLease);
                              setShowDocumentModal(true);
                            }}
                            className="w-full justify-center py-3"
                            style={{
                              borderColor: colors.borderColor,
                              color: colors.textPrimary
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {strings.viewLease}
                            {selectedLease.file_urls && selectedLease.file_urls.length > 1 && (
                              <Badge className="ml-2 text-xs bg-emerald-100 text-emerald-700">
                                {selectedLease.file_urls.length} {language === 'th' ? 'หน้า' : language === 'ru' ? 'стр.' : 'pages'}
                              </Badge>
                            )}
                          </Button>
                        )}

                        {selectedLease.status === 'scanned' && (
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              haptic.medium();
                              setAddingPagesToLease(selectedLease);
                              setSelectedLease(null);
                            }}
                            className="w-full justify-center py-2 text-sm"
                            style={{
                              borderColor: '#0C3B2E',
                              color: '#0C3B2E'
                            }}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {language === 'th' ? 'เพิ่มหน้า' : language === 'ru' ? 'Добавить страницы' : 'Add pages'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Destructive Action */}
                <div className="pt-4 border-t" style={{ borderColor: colors.borderColor }}>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.heavy();
                      handleDeleteLease(selectedLease.id, e);
                    }}
                    className="w-full justify-center py-3 text-sm font-semibold border-red-600 text-red-600 hover:bg-red-50"
                    style={isDarkMode ? { 
                      backgroundColor: '#3A2626',
                      borderColor: '#EF4444',
                      color: '#FCA5A5'
                    } : {}}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {language === 'th' ? 'ลบสัญญาเช่านี้' : language === 'ru' ? 'Удалить договор' : 'Delete This Lease'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Completion Modal */}
        <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
          <DialogContent
            className="max-w-md w-[90vw]"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl" style={{ color: colors.textPrimary }}>
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              {language === 'th' ? 'วิเคราะห์เสร็จสิ้น' : language === 'ru' ? 'Анализ завершен' : 'Lease Analysed'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {language === 'th' 
                  ? 'สัญญาเช่าของคุณได้รับการวิเคราะห์เรียบร้อยแล้ว'
                  : language === 'ru'
                    ? 'Ваш договор аренды успешно проанализирован'
                    : 'Your lease has been successfully analysed'}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleCompletionViewResults}
                  className="w-full"
                  style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {language === 'th' ? 'ดูผลลัพธ์' : language === 'ru' ? 'Посмотреть результаты' : 'View Results'}
                </Button>
                <Button
                  onClick={handleCompletionDone}
                  variant="outline"
                  className="w-full"
                >
                  {language === 'th' ? 'เสร็จสิ้น' : language === 'ru' ? 'Готово' : 'Done'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Pages Modal */}
        <Dialog open={!!addingPagesToLease} onOpenChange={() => {
          setAddingPagesToLease(null);
          setAdditionalFiles([]);
        }}>
          <DialogContent
            className="max-w-lg w-[95vw]"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'เพิ่มหน้าเข้าสัญญา' : language === 'ru' ? 'Добавить страницы' : 'Add Pages to Lease'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {uploading ? (
                <UploadProgress
                  currentStage={analysisStage}
                  progress={uploadProgress}
                  fileCount={additionalFiles.length}
                  primaryColor={colors.textPrimary}
                  secondaryColor={colors.textSecondary}
                  language={language}
                  isAnalyzing={analyzing}
                  isUploading={uploading}
                  strings={strings}
                />
              ) : (
                <>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {language === 'th' 
                      ? `สัญญาปัจจุบัน: ${addingPagesToLease?.file_urls?.length || 1} หน้า`
                      : language === 'ru'
                        ? `Текущий договор: ${addingPagesToLease?.file_urls?.length || 1} стр.`
                        : `Current lease: ${addingPagesToLease?.file_urls?.length || 1} page(s)`}
                  </p>
                  
                  <div className="space-y-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setAdditionalFiles(files);
                        }}
                        className="hidden"
                      />
                      <div className="p-4 border-2 border-dashed rounded-lg text-center"
                        style={{ borderColor: colors.borderColor }}
                      >
                        <Camera className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textSecondary }} />
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                          {language === 'th' ? 'ถ่ายรูปหน้าเพิ่มเติม' : language === 'ru' ? 'Сфотографировать страницы' : 'Take photos of additional pages'}
                        </p>
                      </div>
                    </label>

                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setAdditionalFiles(files);
                        }}
                        className="hidden"
                      />
                      <div className="p-4 border-2 border-dashed rounded-lg text-center"
                        style={{ borderColor: colors.borderColor }}
                      >
                        <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textSecondary }} />
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                          {language === 'th' ? 'เลือกไฟล์' : language === 'ru' ? 'Выбрать файлы' : 'Browse files'}
                        </p>
                      </div>
                    </label>
                  </div>

                  {additionalFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                        {language === 'th' ? `เลือกแล้ว ${additionalFiles.length} ไฟล์` : language === 'ru' ? `Выбрано ${additionalFiles.length} файлов` : `${additionalFiles.length} file(s) selected`}
                      </p>
                      {additionalFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: colors.fieldBg }}>
                          <FileText className="w-4 h-4" style={{ color: colors.textSecondary }} />
                          <span className="text-xs flex-1" style={{ color: colors.textPrimary }}>{file.name}</span>
                          <button onClick={() => setAdditionalFiles(prev => prev.filter((_, i) => i !== idx))}>
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAddingPagesToLease(null);
                        setAdditionalFiles([]);
                      }}
                      className="flex-1"
                    >
                      {language === 'th' ? 'ยกเลิก' : language === 'ru' ? 'Отмена' : 'Cancel'}
                    </Button>
                    <Button
                      onClick={handleAddPages}
                      disabled={additionalFiles.length === 0}
                      className="flex-1"
                      style={{ 
                        backgroundColor: additionalFiles.length > 0 ? '#0C3B2E' : '#9CA3AF',
                        color: '#FFFFFF'
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {language === 'th' ? 'อัปโหลด' : language === 'ru' ? 'Загрузить' : 'Upload'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Document Viewer Modal */}
        <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
          <DialogContent
            className="max-w-md w-[90vw]"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'เอกสารสัญญาเช่า' : language === 'ru' ? 'Документ аренды' : 'Lease Document'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {language === 'th' 
                  ? 'เลือกวิธีดูเอกสาร' 
                  : language === 'ru'
                    ? 'Выберите способ просмотра'
                    : 'Choose how to view your document'}
              </p>
              
              <Button
                onClick={() => {
                  haptic.medium();
                  setShowDocumentModal(false);
                  
                  // Navigate to document viewer page for multi-page, or open single page
                  if (documentToView?.file_urls && documentToView.file_urls.length > 1) {
                    navigate(createPageUrl("LeaseViewer") + `?leaseId=${documentToView.id}`);
                  } else {
                    window.open(documentToView?.file_url, '_blank');
                  }
                }}
                className="w-full py-4"
                style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                {language === 'th' ? 'ดูออนไลน์' : language === 'ru' ? 'Посмотреть онлайн' : 'View Online'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  haptic.light();
                  setShowDocumentModal(false);
                  
                  // Download all pages
                  if (documentToView?.file_urls && documentToView.file_urls.length > 1) {
                    documentToView.file_urls.forEach((url, idx) => {
                      setTimeout(() => {
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `lease-page-${idx + 1}`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }, idx * 500);
                    });
                  } else {
                    const link = document.createElement('a');
                    link.href = documentToView?.file_url;
                    link.download = 'lease-document';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                className="w-full py-3"
              >
                <Download className="w-5 h-5 mr-2" />
                {language === 'th' ? 'ดาวน์โหลด' : language === 'ru' ? 'Скачать' : 'Download'}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => {
                  haptic.light();
                  setShowDocumentModal(false);
                  setDocumentToView(null);
                }}
                className="w-full"
              >
                {language === 'th' ? 'ยกเลิก' : language === 'ru' ? 'Отмена' : 'Cancel'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Disclaimer Modal */}
        <Dialog open={showDisclaimerModal} onOpenChange={setShowDisclaimerModal}>
          <DialogContent 
            className="max-w-2xl w-[95vw] h-[85vh] flex flex-col p-0"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
          >
            <DialogHeader className="px-6 py-4 border-b flex-shrink-0" style={{ borderBottomColor: colors.borderColor }}>
              <DialogTitle className="text-xl font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <AlertCircle className="w-6 h-6 text-amber-600" />
                {strings.disclaimerTitle}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="space-y-4 text-sm leading-relaxed" style={{ color: colors.textPrimary }}>
                <p>{strings.disclaimerText.p1}</p>
                <p>{strings.disclaimerText.p2}</p>
                <p>{strings.disclaimerText.p3}</p>
                <div>
                  <p className="font-semibold mb-2">{strings.disclaimerText.responsibleTitle}</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {strings.disclaimerText.responsibilities.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <p>{strings.disclaimerText.p4}</p>
                <p className="font-semibold">{strings.disclaimerText.p5}</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex-shrink-0 space-y-4" style={{ borderTopColor: colors.borderColor }}>
              <div className="flex items-start gap-3 p-3 rounded-lg" style={{
                backgroundColor: isDarkMode ? '#374151' : '#F3F4F6'
              }}>
                <input
                  type="checkbox"
                  id="modal-disclaimer-checkbox"
                  checked={disclaimerCheckboxTicked}
                  onChange={(e) => {
                    haptic.light();
                    setDisclaimerCheckboxTicked(e.target.checked);
                  }}
                  className="w-5 h-5 mt-0.5 flex-shrink-0 cursor-pointer"
                  style={{ accentColor: '#0C3B2E' }}
                />
                <label htmlFor="modal-disclaimer-checkbox" className="font-semibold text-sm cursor-pointer" style={{ color: colors.textPrimary }}>
                  {strings.disclaimerCheckbox}
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    haptic.light();
                    setShowDisclaimerModal(false);
                    setDisclaimerCheckboxTicked(false);
                  }}
                  className="flex-1"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                >
                  {strings.disclaimerCancel}
                </Button>
                <Button
                  onClick={handleAcceptDisclaimerAndProceed}
                  disabled={!disclaimerCheckboxTicked}
                  className="flex-1"
                  style={{
                    backgroundColor: disclaimerCheckboxTicked ? '#0C3B2E' : '#9CA3AF',
                    color: '#FFFFFF',
                    cursor: disclaimerCheckboxTicked ? 'pointer' : 'not-allowed',
                    opacity: disclaimerCheckboxTicked ? 1 : 0.6
                  }}
                >
                  {strings.agreeAndContinue}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Zone */}
        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <div className="p-6 md:p-8">
            {uploading || analyzing ? (
              <UploadProgress
                currentStage={analysisStage}
                progress={uploadProgress}
                fileCount={selectedFiles.length}
                primaryColor={colors.textPrimary}
                secondaryColor={colors.textSecondary}
                language={language}
                isAnalyzing={analyzing}
                isUploading={uploading}
                strings={strings}
                retryCount={retryCount}
              />
            ) : (
              <>
                {/* ✅ SHOW UPGRADE BANNER IF LIMIT REACHED */}
                {!scanStatus.allowed && (
                  <div className="mb-6 p-6 rounded-xl border-2" style={{
                    backgroundColor: isDarkMode ? '#3A2626' : '#FEF2F2',
                    borderColor: '#EF4444'
                  }}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2" style={{ color: colors.textPrimary }}>
                          {strings.scanLimitReached}
                        </h3>
                        <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                          {strings.scanLimitMsg
                            .replace('{used}', scanStatus.used)
                            .replace('{limit}', scanStatus.limit)
                            .replace('{periodText}', getPeriodText(scanStatus.period))}
                        </p>
                        <Button
                          onClick={() => navigate(createPageUrl("Account"))}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {strings.upgradeForMore}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Batch Mode Info */}
                {selectedFiles.length > 1 && (
                  <div className="mb-4 p-4 rounded-lg" style={{
                    backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF',
                    border: '2px solid #3B82F6'
                  }}>
                    <div className="flex items-center gap-3">
                      <Upload className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-bold text-sm" style={{ color: isDarkMode ? '#93C5FD' : '#1D4ED8' }}>{strings.batchUpload}</p>
                        <p className="text-xs" style={{ color: isDarkMode ? '#BFDBFE' : '#2563EB' }}>{strings.filesWillBeSeparate}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trust Badge */}
                <div className="mb-4">
                  <TrustBadge language={language} isDarkMode={isDarkMode} />
                </div>

                <div
                  className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : ''} ${!scanStatus.allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{
                    borderColor: dragActive ? '#3B82F6' : colors.borderColor,
                    backgroundColor: dragActive ? (isDarkMode ? '#1E3A5F' : '#EFF6FF') : 'transparent',
                    pointerEvents: scanStatus.allowed ? 'auto' : 'none'
                  }}
                  onDragEnter={() => scanStatus.allowed && setDragActive(true)}
                  onDragLeave={() => setDragActive(false)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4" style={{ color: colors.textSecondary }} />
                  <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                    {strings.uploadArea}
                  </h3>
                  <p className="mb-2 font-semibold" style={{ color: colors.textPrimary }}>{strings.supportedFormats}</p>
                  <p className="mb-4 text-xs" style={{ color: colors.textSecondary }}>
                    {language === 'th' 
                      ? '⚠️ หากเลือกจาก Google Drive บน Android ไม่สามารถอ่านไฟล์ได้ กรุณาดาวน์โหลดไปยังอุปกรณ์ก่อน'
                      : language === 'ru'
                        ? '⚠️ Если выбираете из Google Drive на Android и не можете прочитать, сначала скачайте на устройство'
                        : '⚠️ If selecting from Google Drive on Android fails, download to device first'}
                  </p>

                  <div className="flex justify-center">
                    <label className="inline-block">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg,image/*,application/pdf,image/png,image/jpeg"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={!scanStatus.allowed}
                      />
                      <span
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg ${!scanStatus.allowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        style={{
                          backgroundColor: '#0C3B2E',
                          color: '#FFFFFF'
                        }}
                      >
                        <FileText className="w-5 h-5" />
                        {strings.browseDocuments}
                      </span>
                    </label>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>
                      {language === 'th' ? 'ไฟล์ที่เลือก' : language === 'ru' ? 'Выбранные файлы' : 'Selected Files'} ({selectedFiles.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg" style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6'
                        }}>
                          <FileText className="w-5 h-5 flex-shrink-0" style={{ color: colors.textSecondary }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="font-medium" style={{ 
                              color: colors.textPrimary,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {file.name}
                            </p>
                            <p className="text-sm" style={{ color: colors.textSecondary }}>
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                          >
                            <X className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        haptic.medium();
                        handleUploadAll();
                      }}
                      disabled={uploading || !scanStatus.allowed}
                      className={`w-full mt-4 py-4 rounded-lg font-bold ${!scanStatus.allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{
                        backgroundColor: '#0C3B2E',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        minHeight: '56px',
                        fontSize: '16px',
                        padding: '12px 24px'
                      }}
                    >
                      <Upload className="w-5 h-5 flex-shrink-0" />
                      <span style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {strings.uploadAll}
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* All Leases List - WITH SWIPE */}
        {leases.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              {strings.allLeases} ({leases.length})
            </h2>
            <div className="grid gap-3">
              {leases.map((lease) => (
                <SwipeToDelete
                  key={lease.id}
                  onDelete={() => handleSwipeDelete(lease.id)}
                  deleteLabel={language === 'th' ? 'ลบ' : 'Delete'}
                  colors={colors}
                >
                  <Card
                    className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer"
                    style={{ backgroundColor: colors.cardBg }}
                    onClick={() => {
                      haptic.light();
                      handleViewDetails(lease);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-ls-forest flex-shrink-0 mt-0.5" />

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base mb-1 line-clamp-2" style={{
                            color: colors.textPrimary,
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            lineHeight: '1.4'
                          }}>
                            {lease.property_address || (language === 'th' ? 'สัญญาเช่า' : language === 'ru' ? 'Договор аренды' : 'Lease Agreement')}
                          </h3>
                          <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                            {strings.scanDate}: {format(new Date(lease.created_date), 'dd MMM yyyy')}
                          </p>
                          {lease.file_urls && lease.file_urls.length > 1 && (
                            <Badge className="bg-blue-50 text-blue-700 text-xs border-blue-200">
                              {lease.file_urls.length} {language === 'th' ? 'หน้า' : language === 'ru' ? 'стр.' : 'pages'}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {lease.status === 'scanned' && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                              {language === 'th' ? 'วิเคราะห์แล้ว' : language === 'ru' ? 'Проанализировано' : 'Analysed'}
                            </Badge>
                          )}
                          {lease.status === 'uploaded' && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              {language === 'th' ? 'รอ' : language === 'ru' ? 'Ожидание' : 'Pending'}
                            </Badge>
                          )}
                          {lease.status === 'queued' && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              {language === 'th' ? 'คิว' : language === 'ru' ? 'В очереди' : 'Queued'}
                            </Badge>
                          )}
                          {lease.status === 'processing' && (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              {language === 'th' ? 'ประมวลผล' : language === 'ru' ? 'Обработка' : 'Processing'}
                            </Badge>
                          )}
                          {lease.status === 'failed' && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {language === 'th' ? 'ล้มเหลว' : language === 'ru' ? 'Ошибка' : 'Failed'}
                            </Badge>
                          )}
                          
                          {(lease.status === 'uploaded' || lease.status === 'failed') && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <RetryAnalysis 
                                lease={lease} 
                                language={language}
                                colors={colors}
                                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['leases', 'allScans'] })}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </SwipeToDelete>
              ))}
            </div>
          </div>
        )}

        {/* Legal Disclaimer */}
        <div className="mt-8 p-4 rounded-lg text-center max-w-4xl mx-auto" style={{
          backgroundColor: isDarkMode ? '#2A2D30' : '#F8FAFC',
          border: `1px solid ${colors.borderColor}`
        }}>
          <p className="text-xs leading-relaxed" style={{ color: colors.textSecondary }}>
            {language === 'th' 
              ? 'Lease Shield ให้คำแนะนำทั่วไปและเทมเพลตเอกสารเพื่อความสะดวกของคุณ Lease Shield ไม่ใช่สำนักงานกฎหมาย ไม่ให้บริการตัวแทนทางกฎหมาย และไม่ได้เป็นคู่สัญญาในสัญญาเช่าของคุณ คุณมีหน้าที่รับผิดชอบในการตรวจสอบความถูกต้องของข้อมูลและเอกสารทั้งหมดก่อนส่ง'
              : language === 'zh'
                ? 'Lease Shield为您提供一般性指导和文档模板以方便使用。Lease Shield不是律师事务所，不提供法律代理，也不是您租约的一方。在发送之前，您有责任检查所有信息和文档的准确性。'
                : language === 'ja'
                  ? 'Lease Shieldは、お客様の便宜のために一般的なガイダンスと文書テンプレートを提供します。Lease Shieldは法律事務所ではなく、法的代理を提供せず、お客様のリース契約の当事者でもありません。送信する前に、すべての情報と文書の正確性を確認する責任はお客様にあります。'
                  : language === 'ko'
                    ? 'Lease Shield는 귀하의 편의를 위해 일반적인 안내 및 문서 템플릿을 제공합니다。Lease Shield는 법률 회사가 아니며 법적 대리를 제공하지 않으며 귀하의 임대 계약 당사자가 아닙니다。발송하기 전에 모든 정보와 문서의 정확성을 확인할 책임은 귀하에게 있습니다。'
                    : language === 'ru'
                      ? 'Lease Shield предоставляет общие рекомендации и шаблоны документов для вашего удобства。Lease Shield не является юридической фирмой、не предоставляет юридическое представительство и не является стороной вашего договора аренды。Вы несёте ответственность за проверку точности всей информации и документов перед отправкой。'
                      : 'Lease Shield provides general guidance and document templates for your convenience. Lease Shield is not a law firm, does not provide legal representation, and is not a party to your lease. You are responsible for checking the accuracy of all information and documents before sending them.'}
          </p>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

export default function UploadScanPage() {
  return (
    <AuthGuard>
      <UploadScanPageContent />
    </AuthGuard>
  );
}