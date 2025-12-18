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
  DollarSign,
  Bell,
  Edit2,
  Save,
  Shield,
  Eye,
  ExternalLink
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

function UploadScanPageContent() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
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

  // NEW: Track current step for breadcrumb
  const [currentStep, setCurrentStep] = useState(0);

  // NEW: State for post-scan upgrade hint
  const [showPostScanHint, setShowPostScanHint] = useState(false);
  
  // NEW: State for disclaimer modal
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [disclaimerCheckboxTicked, setDisclaimerCheckboxTicked] = useState(false);

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
      supportedFormats: "PDF, Word (DOC/DOCX), PNG, JPG (Max 10MB each)",
      selectFiles: "Select Files",
      uploadAll: "Upload & Analyze",
      uploading: "Uploading files...",
      analyzingTitle: "Analyzing Your Lease",
      analyzingDesc: "Our AI is reviewing your lease agreement. This may take up to 30 seconds...",
      analyzing: {
        uploading: "Uploading files...",
        creating: "Creating lease record...",
        scanning: "AI analyzing document...",
        extracting: "Extracting lease details...",
        finalizing: "Finalizing analysis..."
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
      browseDocuments: "Browse Documents",
      takePhotos: "Take Photos",
      batchUpload: "Batch Upload",
      singleUpload: "Single Upload",
      filesWillBeSeparate: "Each file will be uploaded as a separate lease",
      stepUpload: "Upload",
      stepAnalyze: "Analyze",
      stepResults: "Results",
      stepTrack: "Track",
      upgradeHintText: "Upgrade to unlock unlimited scans and advanced lease analysis.",
      viewPlans: "View plans",
      disclaimerTitle: "Lease Scan Disclaimer",
      disclaimerCheckbox: "I have read and agree to the Lease Scan Disclaimer.",
      agreeAndContinue: "Agree & Continue",
      disclaimerCancel: "Cancel",
      disclaimerText: {
        p1: "Lease Shield provides automated analysis, general guidance, and document templates for informational purposes only.",
        p2: "Lease Shield is not a law firm, does not provide legal advice, and does not provide legal representation. No lawyer-client relationship is created by using this service.",
        p3: "Results may be incomplete, inaccurate, or outdated. Lease Shield does not guarantee the accuracy, completeness, or suitability of scan results, recommendations, or generated documents.",
        responsibleTitle: "You remain fully responsible for:",
        responsibilities: [
          "Reviewing your lease documents",
          "Verifying the accuracy of all information",
          "Seeking independent legal advice before taking action",
          "Deciding whether and how to use any output provided"
        ],
        p4: "Lease Shield is not a party to your lease and assumes no liability for decisions, disputes, losses, or outcomes arising from the use of this service.",
        p5: "By proceeding, you acknowledge and accept that you use Lease Shield at your own risk."
      }
    },
    th: {
      title: "สแกนสัญญาเช่า",
      subtitle: "อัปโหลดสัญญาเช่าเพื่อวิเคราะห์อัตโนมัติ",
      uploadArea: "วางไฟล์สัญญาเช่าที่นี่ หรือคลิกเพื่อเลือกไฟล์",
      supportedFormats: "รองรับ PDF, Word (DOC/DOCX), PNG, JPG (ไฟล์ละไม่เกิน 10MB)",
      selectFiles: "เลือกไฟล์",
      uploadAll: "อัปโหลดและวิเคราะห์",
      uploading: "กำลังอัปโหลดไฟล์...",
      analyzingTitle: "กำลังวิเคราะห์สัญญาเช่า",
      analyzingDesc: "AI กำลังตรวจสอบสัญญาเช่าของคุณ อาจใช้เวลาประมาณ 30 วินาที...",
      analyzing: {
        uploading: "กำลังอัปโหลดไฟล์...",
        creating: "กำลังสร้างบันทึกสัญญาเช่า...",
        scanning: "AI กำลังวิเคราะห์เอกสาร...",
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
      browseDocuments: "เลือกเอกสาร",
      takePhotos: "ถ่ายรูป",
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
        p1: "Lease Shield ให้บริการวิเคราะห์อัตโนมัติ คำแนะนำทั่วไป และเทมเพลตเอกสารเพื่อวัตถุประสงค์ในการให้ข้อมูลเท่านั้น",
        p2: "Lease Shield ไม่ใช่สำนักงานกฎหมาย ไม่ให้คำปรึกษาด้านกฎหมาย และไม่ให้การเป็นตัวแทนทางกฎหมาย การใช้บริการนี้ไม่ก่อให้เกิดความสัมพันธ์ทนายความ-ลูกความ",
        p3: "ผลลัพธ์อาจไม่ครบถ้วน ไม่ถูกต้อง หรือไม่เป็นปัจจุบัน Lease Shield ไม่รับประกันความถูกต้อง ความครบถ้วน หรือความเหมาะสมของผลการสแกน คำแนะนำ หรือเอกสารที่สร้างขึ้น",
        responsibleTitle: "คุณยังคงต้องรับผิดชอบทั้งหมดสำหรับ:",
        responsibilities: [
          "การตรวจสอบเอกสารสัญญาเช่าของคุณ",
          "การตรวจสอบความถูกต้องของข้อมูลทั้งหมด",
          "การขอคำปรึกษากฎหมายจากผู้เชี่ยวชาญอิสระก่อนดำเนินการ",
          "การตัดสินใจว่าจะใช้ผลลัพธ์อย่างไรและในกรณีใด"
        ],
        p4: "Lease Shield ไม่ได้เป็นคู่สัญญาในสัญญาเช่าของคุณ และไม่รับผิดชอบต่อการตัดสินใจ ข้อพิพาท ความเสียหาย หรือผลลัพธ์ใด ๆ ที่เกิดจากการใช้บริการนี้",
        p5: "เมื่อดำเนินการต่อ คุณรับทราบและยอมรับว่าการใช้ Lease Shield เป็นความเสี่ยงของคุณเอง"
      }
    },
    zh: {
      title: "扫描租约",
      subtitle: "上传您的租赁协议进行自动分析",
      uploadArea: "将租约文件拖放到此处或点击浏览",
      supportedFormats: "支持 PDF、Word (DOC/DOCX)、PNG、JPG（每个文件最大 10MB）",
      selectFiles: "选择文件",
      uploadAll: "上传并分析",
      uploading: "正在上传文件...",
      analyzingTitle: "正在分析您的租约",
      analyzingDesc: "我们的AI正在审查您的租赁协议。这可能需要30秒...",
      analyzing: {
        uploading: "正在上传文件...",
        creating: "正在创建租约记录...",
        scanning: "AI正在分析文档...",
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
      browseDocuments: "浏览文档",
      takePhotos: "拍照",
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
        p1: "Lease Shield 仅提供自动化分析、一般性建议和文档模板，供信息参考之用。",
        p2: "Lease Shield 不是律师事务所，不提供法律意见，也不提供法律代理服务。使用本服务不会建立律师—客户关系。",
        p3: "结果可能不完整、不准确或已过期。Lease Shield 不保证扫描结果、建议或生成文件的准确性、完整性或适用性。",
        responsibleTitle: "您仍需对以下事项承担全部责任：",
        responsibilities: [
          "审阅您的租赁文件",
          "核实所有信息的准确性",
          "在采取行动前寻求独立法律意见",
          "决定是否以及如何使用任何输出内容"
        ],
        p4: "Lease Shield 不是您租约的合同当事方，对因使用本服务所产生的决定、纠纷、损失或结果不承担任何责任。",
        p5: "继续即表示您确认并接受：使用 Lease Shield 风险自负。"
      }
    },
    ja: {
      title: "賃貸契約をスキャン",
      subtitle: "賃貸契約書をアップロードして自動分析",
      uploadArea: "ここに賃貸契約ファイルをドロップまたはクリックして参照",
      supportedFormats: "PDF、Word (DOC/DOCX)、PNG、JPG（各ファイル最大10MB）",
      selectFiles: "ファイルを選択",
      uploadAll: "アップロードして分析",
      uploading: "ファイルをアップロード中...",
      analyzingTitle: "賃貸契約を分析中",
      analyzingDesc: "AIが賃貸契約を確認しています。最大30秒かかる場合があります...",
      analyzing: {
        uploading: "ファイルをアップロード中...",
        creating: "賃貸契約記録を作成中...",
        scanning: "AIがドキュメントを分析中...",
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
      browseDocuments: "ドキュメントを参照",
      takePhotos: "写真を撮る",
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
        p1: "Lease Shield は情報提供目的で、自動分析・一般的なガイダンス・文書テンプレートを提供します。",
        p2: "Lease Shield は法律事務所ではなく、法律助言や法的代理を提供しません。本サービスの利用により弁護士—依頼者関係は成立しません。",
        p3: "結果は不完全、不正確、または最新でない可能性があります。Lease Shield はスキャン結果、推奨事項、生成文書の正確性・完全性・適合性を保証しません。",
        responsibleTitle: "以下については利用者が全責任を負います：",
        responsibilities: [
          "賃貸契約書類の確認",
          "すべての情報の正確性の検証",
          "行動前に独立した法律助言を求めること",
          "出力結果を使用するかどうか、および使用方法の判断"
        ],
        p4: "Lease Shield は賃貸契約の当事者ではなく、本サービス利用に起因する判断、紛争、損害、結果について一切責任を負いません。",
        p5: "続行することで、Lease Shield の利用は自己責任であることを確認し同意したものとします。"
      }
    },
    ko: {
      title: "임대 계약 스캔",
      subtitle: "임대 계약서를 업로드하여 자동 분석",
      uploadArea: "여기에 임대 계약 파일을 드롭하거나 클릭하여 찾아보기",
      supportedFormats: "PDF, Word (DOC/DOCX), PNG, JPG 지원 (파일당 최대 10MB)",
      selectFiles: "파일 선택",
      uploadAll: "업로드 및 분석",
      uploading: "파일 업로드 중...",
      analyzingTitle: "임대 계약 분석 중",
      analyzingDesc: "AI가 귀하의 임대 계약을 검토하고 있습니다. 최대 30초 소요될 수 있습니다...",
      analyzing: {
        uploading: "파일 업로드 중...",
        creating: "임대 계약 기록 생성 중...",
        scanning: "AI가 문서를 분석 중...",
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
      browseDocuments: "문서 찾아보기",
      takePhotos: "사진 촬영",
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
        p1: "Lease Shield는 정보 제공 목적의 자동 분석, 일반 안내 및 문서 템플릿을 제공합니다.",
        p2: "Lease Shield는 법률사무소가 아니며 법률 자문 또는 법률 대리를 제공하지 않습니다. 본 서비스를 사용한다고 해서 변호사-의뢰인 관계가 성립되지 않습니다.",
        p3: "결과는 불완전하거나 부정확하거나 최신이 아닐 수 있습니다. Lease Shield는 스캔 결과, 권고 또는 생성 문서의 정확성, 완전성, 적합성을 보장하지 않습니다.",
        responsibleTitle: "귀하는 다음에 대해 전적으로 책임이 있습니다:",
        responsibilities: [
          "임대차 계약서 검토",
          "모든 정보의 정확성 확인",
          "조치 전 독립적인 법률 자문 구하기",
          "출력 결과를 사용할지 및 사용 방법 결정"
        ],
        p4: "Lease Shield는 귀하의 임대차 계약의 당사자가 아니며, 본 서비스 사용으로 인한 결정, 분쟁, 손실 또는 결과에 대해 책임을 지지 않습니다.",
        p5: "계속 진행하면 Lease Shield 사용은 본인 책임임을 인정하고 동의하는 것입니다."
      }
    },
    ru: {
      title: "Сканировать договор",
      subtitle: "Загрузите договор аренды для автоматического анализа",
      uploadArea: "Перетащите файлы договора сюда или нажмите, чтобы выбрать",
      supportedFormats: "PDF, Word (DOC/DOCX), PNG, JPG (до 10 МБ каждый)",
      selectFiles: "Выбрать файлы",
      uploadAll: "Загрузить и проанализировать",
      uploading: "Загрузка файлов...",
      analyzingTitle: "Анализ вашего договора",
      analyzingDesc: "Наш ИИ проверяет договор аренды. Это может занять до 30 секунд...",
      analyzing: {
        uploading: "Загрузка файлов...",
        creating: "Создание записи договора...",
        scanning: "ИИ анализирует документ...",
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
      browseDocuments: "Выбрать файлы",
      takePhotos: "Сделать фото",
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
        p1: "Lease Shield предоставляет автоматизированный анализ, общие рекомендации и шаблоны документов исключительно в информационных целях.",
        p2: "Lease Shield не является юридической фирмой, не предоставляет юридические консультации и не осуществляет юридическое представительство. Использование сервиса не создаёт отношений «адвокат—клиент».",
        p3: "Результаты могут быть неполными, неточными или устаревшими. Lease Shield не гарантирует точность, полноту или пригодность результатов сканирования, рекомендаций или сгенерированных документов.",
        responsibleTitle: "Вы полностью несёте ответственность за:",
        responsibilities: [
          "Проверку ваших документов аренды",
          "Проверку точности всей информации",
          "Обращение за независимой юридической консультацией перед действиями",
          "Решение о том, использовать ли и как использовать любые результаты"
        ],
        p4: "Lease Shield не является стороной вашего договора аренды и не несёт ответственности за решения, споры, убытки или последствия, возникающие в результате использования сервиса.",
        p5: "Продолжая, вы подтверждаете и принимаете, что используете Lease Shield на свой страх и риск."
      }
    }
  };

  const strings = t[language] || t.en;

  // NEW: Define breadcrumb steps
  const breadcrumbSteps = [
    { label: strings.stepUpload, sublabel: language === 'th' ? 'เลือกไฟล์' : language === 'zh' ? '选择文件' : language === 'ja' ? 'ファイルを選択' : language === 'ko' ? '파일 선택' : language === 'ru' ? 'Выберите файлы' : 'Select files' },
    { label: strings.stepAnalyze, sublabel: language === 'th' ? 'AI สแกน' : language === 'zh' ? 'AI扫描' : language === 'ja' ? 'AIスキャン' : language === 'ko' ? 'AI 스캔' : language === 'ru' ? 'ИИ сканирование' : 'AI scan' },
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

    // BATCH MODE: Upload multiple leases separately
    if (selectedFiles.length > 1) {
      setBatchMode(true);
      setUploading(true);
      setAnalyzing(false); // Batch upload is just uploading, not analyzing immediately
      setError(null);
      setUploadProgress(0); // Reset progress for batch
      setCurrentStep(1); // Move to analyzing step
      const batchResultsTemp = []; // Use a temporary array to store results for this batch operation

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
          setAnalysisStage(language === 'th' ? `กำลังอัปโหลดไฟล์ ${i + 1}/${selectedFiles.length}` : `Uploading file ${i + 1}/${selectedFiles.length}`);
          setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));

          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          
          const lease = await base44.entities.Lease.create({
            file_url: file_url,
            file_urls: [file_url], // Assuming each file is a single lease document
            status: 'uploaded', // Leases created in batch mode are 'uploaded', not yet 'scanned'
            created_by: user?.email // Ensure created_by is set
          });
          batchResultsTemp.push({ file: file.name, leaseId: lease.id, success: true });
        } catch (err) {
          console.error(`Batch upload error for file ${file.name}:`, err);
          batchResultsTemp.push({ file: file.name, success: false, error: err.message });
          // If one file fails, continue with others in the batch
        }
      }

      setBatchResults(batchResultsTemp); // Store all batch results
      setUploading(false);
      setBatchMode(false); // Exit batch mode
      setSelectedFiles([]); // Clear selected files after batch upload attempt
      setUploadProgress(0);
      setAnalysisStage(''); // Clear stage
      setCurrentStep(0); // Reset after batch upload
      queryClient.invalidateQueries({ queryKey: ['leases'] }); // Invalidate to show new 'uploaded' leases

      const successCount = batchResultsTemp.filter(r => r.success).length;
      // Provide a summary alert
      alert(
        language === 'th'
          ? `อัปโหลดสำเร็จ ${successCount}/${batchResultsTemp.length} ไฟล์\n\nไฟล์ที่อัปโหลดสำเร็จแล้วจะปรากฏในรายการ "สัญญาเช่าทั้งหมด" และคุณสามารถเริ่มการวิเคราะห์ได้จากที่นั่น`
          : `Successfully uploaded ${successCount}/${batchResultsTemp.length} files.\n\nSuccessfully uploaded files will appear in "All Leases" list, where you can initiate analysis.`
      );
      return; // Crucially, exit here for batch mode
    }

    // SINGLE MODE: Keep existing logic
    setUploading(true);
    setError(null);
    setUploadProgress(0);
    setRetryCount(0);
    setAnalysisStage('uploading');
    setCurrentStep(1); // Move to analyzing

    let currentRetry = 0;
    let createdLeaseId = null;
    const maxRetries = 3;

    const attemptUpload = async () => {
      try {
        setAnalysisStage('uploading');
        setUploadProgress(10);

        const uploadPromises = selectedFiles.map(file =>
          base44.integrations.Core.UploadFile({ file })
        );

        const uploadResults = await Promise.all(uploadPromises);
        const fileUrls = uploadResults.map(result => result.file_url);
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

        const { data: scanResponse } = await base44.functions.invoke('scanLease', {
          fileUrls: fileUrls
        });

        if (!scanResponse || !scanResponse.success) {
          throw new Error(scanResponse?.error || 'Scan failed');
        }

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

        await base44.entities.LeaseScan.create({
          lease_id: createdLeaseId,
          risk_score: scanResult.risk_score,
          flags: scanResult.flags || [],
          summary: scanResult.summary,
          scan_full: scanResult,
          version: '1.0'
        });
        setUploadProgress(100);
        setCurrentStep(2); // Move to results step

        if (scanResult.end_date) {
          setLeaseDetails({
            end_date: scanResult.end_date,
            notice_period_days: scanResult.notice_period_days || 30
          });
          setPendingLeaseId(createdLeaseId);
          setShowConfirmation(true);
          // showPostScanHint will be set in handleConfirmLeaseDetails or handleSkipConfirmation
        } else {
          // Open details modal instead of navigating
          const updatedLeases = await base44.entities.Lease.filter({ created_by: user?.email }, '-created_date');
          const newLease = updatedLeases.find(l => l.id === createdLeaseId);
          setSelectedLease(newLease);
          setCurrentStep(2); // Still results step if no end date
          if (userTier === 'free') {
            setShowPostScanHint(true); // Show hint immediately if no end_date
          }
        }

        setSelectedFiles([]);
        queryClient.invalidateQueries({ queryKey: ['leases'] });
        queryClient.invalidateQueries({ queryKey: ['allScans'] });

      } catch (err) {
        console.error('❌ Upload/Analysis error:', err);

        const isWordDoc = selectedFiles.some(f =>
          f.name.toLowerCase().endsWith('.doc') ||
          f.name.toLowerCase().endsWith('.docx')
        );

        currentRetry++;
        setRetryCount(currentRetry);

        if (currentRetry <= maxRetries) {
          setError(language === 'th'
            ? `เกิดข้อผิดพลาด กำลังลองใหม่... (${currentRetry}/${maxRetries})`
            : `Error occurred. Retrying... (${currentRetry}/${maxRetries})`);

          await new Promise(resolve => setTimeout(resolve, 2000 * currentRetry));

          if (createdLeaseId && analysisStage !== 'uploading') {
            try {
              await base44.entities.Lease.delete(createdLeaseId);
              createdLeaseId = null;
            } catch (cleanupErr) {
              console.error('Failed to cleanup lease:', cleanupErr);
            }
          }

          return attemptUpload();
        } else {
          let errorMessage;

          if (isWordDoc) {
            errorMessage = language === 'th'
              ? 'ไม่สามารถวิเคราะห์ไฟล์ Word ได้\n\n💡 กรุณาลอง:\n• แปลงเป็น PDF ก่อนอัปโหลด\n• ถ่ายภาพหน้าสัญญาแทน\n• เปิดด้วย Google Docs แล้ว Download เป็น PDF'
              : 'Unable to analyze Word document\n\n💡 Please try:\n• Convert to PDF before uploading\n• Take photos of lease pages\n• Open in Google Docs and save as PDF';
          } else if (err.message?.toLowerCase().includes('timeout')) {
            errorMessage = language === 'th'
              ? 'การวิเคราะห์ใช้เวลานานเกินไป\n\n💡 กรุณาลอง:\n• ใช้ไฟล์ที่เล็กกว่า\n• แยกอัปโหลดทีละหน้า\n• ถ่ายภาพที่ชัดเจนกว่า'
              : 'Analysis timed out\n\n💡 Please try:\n• Use smaller files\n• Upload pages separately\n• Take clearer photos';
          } else {
            errorMessage = language === 'th'
              ? 'ไม่สามารถวิเคราะห์ได้\n\n💡 กรุณาตรวจสอบ:\n• ไฟล์เป็นสัญญาเช่าที่อ่านได้\n• ขนาดไฟล์ไม่เกิน 10MB\n• ภาพชัดเจนและอ่านได้'
              : 'Analysis failed\n\n💡 Please check:\n• File is a readable lease agreement\n• File size is under 10MB\n• Images are clear and readable';
          }

          setError(errorMessage);

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
      setCurrentStep(3); // Move to track deposit step

      // Open in modal instead of navigating
      const updatedLeases = await base44.entities.Lease.filter({ created_by: user?.email }, '-created_date');
      const updatedLease = updatedLeases.find(l => l.id === pendingLeaseId);
      setSelectedLease(updatedLease);
      haptic.success();
      if (userTier === 'free') {
        setShowPostScanHint(true); // Show hint after confirming notice details
      }
    } catch (err) {
      console.error('Failed to update lease details:', err);
      // Still open the modal even if update fails
      const updatedLeases = await base44.entities.Lease.filter({ created_by: user?.email }, '-created_date');
      const updatedLease = updatedLeases.find(l => l.id === pendingLeaseId);
      setSelectedLease(updatedLease);
      setCurrentStep(3); // Even on error, we attempted to set it, so move to track
      haptic.error();
      if (userTier === 'free') {
        setShowPostScanHint(true); // Show hint even if update failed
      }
    }
  };

  const handleSkipConfirmation = async () => {
    haptic.light();
    setShowConfirmation(false);
    setCurrentStep(2); // Stay on results step
    if (pendingLeaseId) {
      const updatedLeases = await base44.entities.Lease.filter({ created_by: user?.email }, '-created_date');
      const skippedLease = updatedLeases.find(l => l.id === pendingLeaseId);
      setSelectedLease(skippedLease);
      if (userTier === 'free') {
        setShowPostScanHint(true); // Show hint after skipping notice details
      }
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
    setSelectedFiles(prev => [...prev, ...files]);
    setError(null);
    setDragActive(false);
  };

  const handleDrop = (e) => {
    // Only allow drop if upload is allowed
    if (!scanStatus.allowed) return;
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
    setError(null);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRetry = () => {
    setError(null);
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
          <div className="mb-6 p-4 rounded-lg border-2 border-red-200 animate-shake" style={{
            backgroundColor: isDarkMode ? '#3A2626' : '#FEE2F2'
          }}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-600 font-semibold mb-1">
                  {language === 'th' ? 'เกิดข้อผิดพลาด' : 'Error Occurred'}
                </p>
                <p className="text-red-600 text-sm whitespace-pre-line">{error}</p>
                {retryCount > 0 && retryCount < 3 && (
                  <p className="text-red-500 text-xs mt-2">
                    {language === 'th'
                      ? `🔄 กำลังลองอีกครั้ง... (ครั้งที่ ${retryCount}/3)`
                      : `🔄 Retrying... (Attempt ${retryCount}/3)`}
                  </p>
                )}
              </div>
              <button
                onClick={handleRetry}
                className="text-red-600 hover:text-red-800 font-semibold text-sm"
              >
                ✕
              </button>
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
                  className="w-full bg-ls-forest hover:bg-ls-forest/90 py-6 text-base font-bold"
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

        {/* Lease Details Modal - FIXED FOR MOBILE */}
        {selectedLease && (
          <Dialog open={!!selectedLease} onOpenChange={() => setSelectedLease(null)}>
            <DialogContent
              className="max-w-4xl w-[95vw] h-[90vh] max-h-[90vh] flex flex-col p-0"
              style={{ backgroundColor: colors.cardBg }}
            >
              <DialogHeader className="px-4 py-4 border-b flex-shrink-0" style={{
                backgroundColor: colors.cardBg,
                borderBottom: `1px solid ${colors.borderColor}`
              }}>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg" style={{ color: colors.textPrimary }}>{strings.leaseDetails}</DialogTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLease(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Basic Info */}
                <Card className="border-none" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base" style={{ color: colors.textPrimary }}>
                      <Home className="w-4 h-4 text-ls-forest" />
                      {strings.basicInfo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <p className="font-semibold mb-1 text-xs" style={{ color: colors.textSecondary }}>{strings.propertyAddress}</p>
                      <p className="break-words" style={{ color: colors.textPrimary }}>{selectedLease.property_address || 'N/A'}</p>
                    </div>
                    {selectedLease.rent_amount > 0 && (
                      <div>
                        <p className="font-semibold mb-1 text-xs" style={{ color: colors.textSecondary }}>{strings.monthlyRent}</p>
                        <p className="flex items-center" style={{ color: colors.textPrimary }}>
                          <DollarSign className="w-4 h-4 mr-1"/>฿{selectedLease.rent_amount.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedLease.deposit_amount > 0 && (
                      <div>
                        <p className="font-semibold mb-1 text-xs" style={{ color: colors.textSecondary }}>{strings.securityDeposit}</p>
                        <p className="flex items-center" style={{ color: colors.textPrimary }}>
                          <DollarSign className="w-4 h-4 mr-1"/>฿{selectedLease.deposit_amount.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {(selectedLease.start_date || selectedLease.end_date) && (
                      <div>
                        <p className="font-semibold mb-1 text-xs" style={{ color: colors.textSecondary }}>{strings.leasePeriod}</p>
                        <p className="break-words" style={{ color: colors.textPrimary }}>
                          {selectedLease.start_date ? format(new Date(selectedLease.start_date), 'MMM d, yyyy') : 'N/A'} {strings.to} {selectedLease.end_date ? format(new Date(selectedLease.end_date), 'MMM d, yyyy') : 'N/A'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notice Settings */}
                <Card className="border-none" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base" style={{ color: colors.textPrimary }}>
                      <Bell className="w-4 h-4 text-ls-forest" />
                      {strings.noticeSettings}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                  </CardContent>
                </Card>

                {/* Risk Analysis - IMPROVED BUTTON VISIBILITY */}
                {selectedScan && (
                  <Card className="border-none" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base" style={{ color: colors.textPrimary }}>
                        <Shield className="w-4 h-4 text-ls-forest" />
                        {strings.riskAnalysis}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.riskScore}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold" style={{ color: getRiskColor(selectedScan.risk_score) }}>
                              {selectedScan.risk_score}
                            </span>
                            <span className="text-lg" style={{ color: colors.textSecondary }}>/100</span>
                          </div>
                        </div>
                        
                        {/* ✅ IMPROVED: More visible, prominent buttons */}
                        <div className="flex flex-col gap-3">
                          <Button
                            onClick={() => {
                              setSelectedLease(null);
                              navigate(createPageUrl("ScanPreview") + `?scanId=${selectedScan.id}&leaseId=${selectedLease.id}`);
                            }}
                            className="w-full justify-center py-3 text-sm font-bold"
                            style={{
                              backgroundColor: isDarkMode ? '#4B5563' : '#F3F4F6',
                              color: colors.textPrimary,
                              border: `2px solid ${colors.borderColor}`
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = isDarkMode ? '#6B7280' : '#E5E7EB';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = isDarkMode ? '#4B5563' : '#F3F4F6';
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {strings.viewScanResults}
                          </Button>
                          
                          <Button
                            onClick={() => {
                              setSelectedLease(null);
                              navigate(createPageUrl("ReportFull") + `?scanId=${selectedScan.id}&leaseId=${selectedLease.id}`);
                            }}
                            className="w-full justify-center py-3 text-sm font-bold"
                            style={{
                              backgroundColor: '#0C3B2E',
                              color: '#FFFFFF',
                              border: 'none'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#0a2f25';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#0C3B2E';
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {strings.viewFullReport}
                          </Button>
                        </div>
                      </div>
                      {selectedScan.summary && (
                        <p className="text-sm p-3 rounded-lg break-words" style={{
                          backgroundColor: colors.cardBg,
                          color: colors.textSecondary
                        }}>
                          {selectedScan.summary}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-4 border-t" style={{ borderColor: colors.borderColor }}>
                  {selectedLease.file_url && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedLease.file_url, '_blank')}
                      className="w-full justify-start"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {strings.viewLease}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={(e) => handleDeleteLease(selectedLease.id, e)}
                    className="w-full justify-start text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {language === 'th' ? 'ลบ' : language === 'ru' ? 'Удалить' : 'Delete'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

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
                  <p className="mb-4" style={{ color: colors.textSecondary }}>{strings.supportedFormats}</p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <label className="inline-block">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
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

                    <label className="inline-block">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={!scanStatus.allowed}
                      />
                      <span
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 ${!scanStatus.allowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#FFFFFF',
                          color: '#0C3B2E',
                          borderColor: '#0C3B2E'
                        }}
                      >
                        <Camera className="w-5 h-5" />
                        {strings.takePhotos}
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
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6'
                        }}>
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5" style={{ color: colors.textSecondary }} />
                            <div>
                              <p className="font-medium" style={{ color: colors.textPrimary }}>{file.name}</p>
                              <p className="text-sm" style={{ color: colors.textSecondary }}>
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
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
                      className={`w-full mt-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${!scanStatus.allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{
                        backgroundColor: '#0C3B2E',
                        color: '#FFFFFF'
                      }}
                    >
                      <Upload className="w-5 h-5" />
                      {strings.uploadAll}
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
            <div className="grid gap-4">
              {leases.map((lease) => (
                <SwipeToDelete
                  key={lease.id}
                  onDelete={() => handleSwipeDelete(lease.id)}
                  deleteLabel={language === 'th' ? 'ลบ' : 'Delete'}
                  colors={colors}
                >
                  <Card
                    className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    style={{ backgroundColor: colors.cardBg }}
                    onClick={() => {
                      haptic.light();
                      handleViewDetails(lease);
                    }}
                  >
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-ls-forest flex-shrink-0" />
                            <h3 className="font-bold text-sm break-words line-clamp-2" style={{
                              color: colors.textPrimary,
                              overflowWrap: 'break-word',
                              wordBreak: 'break-word'
                            }}>
                              {lease.property_address || (language === 'th' ? 'สัญญาเช่า' : language === 'ru' ? 'Договор аренды' : 'Lease Agreement')}
                            </h3>
                          </div>
                          <p className="text-sm" style={{ color: colors.textSecondary }}>
                            {strings.scanDate}: {format(new Date(lease.created_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {lease.status === 'scanned' && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {language === 'th' ? 'วิเคราะห์แล้ว' : language === 'ru' ? 'Проанализировано' : 'Analyzed'}
                            </Badge>
                          )}
                          {lease.status === 'uploaded' && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              {language === 'th' ? 'รอการวิเคราะห์' : language === 'ru' ? 'Ожидание анализа' : 'Awaiting Analysis'}
                            </Badge>
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