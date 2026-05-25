import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Scale,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  UserCheck,
  Zap,
  Crown,
  Mail,
  Loader2,
  ExternalLink,
  Download,
  Eye,
  Upload,
  X
} from "lucide-react";
import { format } from "date-fns";
import LetterPreview from "../components/shared/LetterPreview";
import { getFeatureCardStyles } from "../components/shared/featureTheme";
import AuthGuard from "../components/shared/AuthGuard";
import { haptic } from "../components/shared/HapticFeedback";
import { ToastProvider, useToast } from "../components/shared/Toast";
import PageHeader from "../components/shared/PageHeader";
import SkeletonLoader from "../components/shared/SkeletonLoader";
import EmptyState from "../components/shared/EmptyState";
import CaseMessages from "../components/cases/CaseMessages";

const STATUS_CONFIG = {
  intake: { label: 'Intake', color: 'bg-slate-100 text-slate-800', icon: Clock },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800', icon: Clock },
  active: { label: 'Active', color: 'bg-blue-100 text-blue-800', icon: Scale },
  waiting: { label: 'Waiting', color: 'bg-purple-100 text-purple-800', icon: Clock },
  user_action: { label: 'Action Required', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  closed: { label: 'Closed', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  awaiting_payment: { label: 'Awaiting Payment', color: '#C7A338', icon: Clock }
};

function CaseDetailsContent() {
  const navigate = useNavigate();
  const toast = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('caseId');
  const fromOps = urlParams.get('from') === 'ops';
  const previousTab = urlParams.get('tab') || 'all';
  const queryClient = useQueryClient();

  const [compilingPack, setCompilingPack] = useState(false);
  const [previewLetter, setPreviewLetter] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('photo');
  const [customLabel, setCustomLabel] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    e.target.value = null;
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const newEntry = {
          id: crypto.randomUUID(),
          url: file_url,
          type: uploadType,
          label: customLabel || file.name,
          uploaded_date: new Date().toISOString()
        };
        const existingEvidence = caseItem.evidence || [];
        await base44.entities.Case.update(caseItem.id, {
          evidence: [...existingEvidence, newEntry]
        });
      }
      queryClient.invalidateQueries({ queryKey: ['case', caseItem.id] });
      setSelectedFiles([]);
      setCustomLabel('');
      setShowUploadModal(false);
    } catch (error) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const DOC_TYPE_CONFIG = {
    lease: { label_en: 'Lease', label_th: 'สัญญาเช่า' },
    receipt: { label_en: 'Receipt', label_th: 'ใบเสร็จ' },
    photo: { label_en: 'Photo', label_th: 'รูปภาพ' },
    video: { label_en: 'Video', label_th: 'วิดีโอ' },
    letter: { label_en: 'Letter', label_th: 'จดหมาย' },
    other: { label_en: 'Other', label_th: 'อื่น ๆ' }
  };

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: caseItem, isLoading: caseLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => {
      const cases = await base44.entities.Case.list();
      const foundCase = cases.find(c => c.id === caseId);
      
      // DEBUG: Log attachments data
      console.log('📎 [CASE_DETAILS] Case attachments loaded:', {
        case_id: caseId,
        case_number: foundCase?.case_number,
        attachments_count: foundCase?.evidence?.length || 0,
        attachments: foundCase?.evidence || []
      });
      
      return foundCase;
    },
    enabled: !!caseId,
  });

  const { data: lease } = useQuery({
    queryKey: ['lease', caseItem?.lease_id],
    queryFn: async () => {
      if (!caseItem?.lease_id) return null;
      const leases = await base44.entities.Lease.list();
      return leases.find(l => l.id === caseItem.lease_id);
    },
    enabled: !!caseItem?.lease_id,
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const theme = getFeatureCardStyles("cases", isDarkMode);

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
  };

  const handleCompilePack = async () => {
    haptic.medium();
    setCompilingPack(true);
    try {
      const response = await base44.functions.invoke('compileLetterPack', {
        caseId: caseItem.id
      });

      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['case', caseId] });
        toast.success(language === 'th' ? 'สร้าง Letter Pack สำเร็จ!' : 'Letter Pack compiled successfully!');
        haptic.success();
      }
    } catch (error) {
      console.error('Failed to compile letter pack:', error);
      toast.error(language === 'th' ? 'ไม่สามารถสร้าง Letter Pack ได้' : 'Failed to compile letter pack');
      haptic.error();
    } finally {
      setCompilingPack(false);
    }
  };

  // New function to handle Word document downloads
  const handleDownloadWord = (subject) => {
    haptic.light();
    const urlKey = `${subject}_url`;
    const url = caseItem?.letters?.[urlKey];

    if (!url) {
      toast.error(language === 'th'
        ? `ไม่พบไฟล์ Word สำหรับ ${subject}`
        : `No Word file found for ${subject}`);
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(language === 'th' ? 'เริ่มดาวน์โหลดแล้ว' : 'Download started');
  };

  const handlePreviewHtml = (subject) => {
    haptic.light();
    const htmlKey = `${subject}_html_url`;
    const docKey = `${subject}_url`;

    const htmlUrl = caseItem?.letters?.[htmlKey];
    const docUrl = caseItem?.letters?.[docKey];

    if (!htmlUrl && !docUrl) {
      toast.error(language === 'th'
        ? `ไม่พบไฟล์สำหรับ ${subject}`
        : `No file found for ${subject}`);
      return;
    }

    setPreviewLetter({
      htmlUrl: htmlUrl,
      docUrl: docUrl,
      subject: subject
    });
  };

  const getLetterTitle = (subject) => {
    const titles = {
      lease_negotiation: strings.leaseNegotiationRequest,
      deposit: strings.depositReturnRequest,
      damages: strings.damageClaimResponse,
      early_termination: strings.earlyTerminationNotice,
      v1: strings.initialNotice,
      v2: strings.followupLetter,
      v3: strings.finalSettlementOffer
    };
    return titles[subject] || subject;
  };

  const t = {
    en: {
      caseDetails: "Case Details",
      loading: "Loading...",
      notFound: "Case not found",
      backToCases: "Back to Cases",
      caseNumber: "Case #",
      opened: "Opened",
      status: "Status",
      disputeAmount: "Dispute Amount",
      caseSummary: "Case Summary",
      features: "Features",
      fastTrack: "Fast Track",
      letterPack: "Letter Pack",
      memberRate: "Member Rate",
      relatedLease: "Related Lease",
      viewLease: "View Lease",
      opsAssignment: "Ops Assignment",
      opsTeam: "Ops Team",
      unassigned: "Not yet assigned",
      timeline: "Case Timeline",
      caseOpened: "Case Opened",
      awaitingReview: "Awaiting team review",
      actions: "Actions",
      uploadDocument: "Upload Document",
      contactSupport: "Contact Support",
      caseHistory: "Case History",
      generatedLetters: "Generated Letters",
      initialNotice: "Initial Notice",
      clarificationDocumentation: "Clarification & Documentation",
      followupLetter: "Follow-up Letter",
      reconciliationPlan: "Reconciliation Plan",
      finalSettlementOffer: "Final Settlement Offer",
      beforeEscalation: "Before Escalation",
      view: "View",
      compilePack: "Compile Pack",
      compiling: "Compiling...",
      completeLetterPack: "📄 Complete Letter Pack",
      allLettersInOnePdf: "All letters in one PDF",
      download: "Download",
      downloadWord: "Download Word",
      preview: "Preview",
      notFoundDesc: "The case you're looking for doesn't exist.",
      teamWillContact: "Our team will contact you soon",
      reviewWithin: "Our team will review your case within 24-48 hours",
      addEvidence: "Add evidence",
      contactTeam: "Contact team",
      leaseNegotiationRequest: "Lease Negotiation Request",
      depositReturnRequest: "Deposit Return Request",
      damageClaimResponse: "Damage Claim Response",
      earlyTerminationNotice: "Early Termination Notice",
      forNegotiationBeforeSigning: "For negotiation before signing - Send to landlord",
      requestItemisedAssessment: "Request itemised assessment",
      requestReconciliation: "Request reconciliation"
    },
    th: {
      caseDetails: "รายละเอียดคดี",
      loading: "กำลังโหลด...",
      notFound: "ไม่พบคดี",
      backToCases: "กลับไปที่คดี",
      caseNumber: "คดีหมายเลข #",
      opened: "เปิด",
      status: "สถานะ",
      disputeAmount: "จำนวนเงินที่พิพาท",
      caseSummary: "สรุปคดี",
      features: "คุณสมบัติ",
      fastTrack: "Fast Track",
      letterPack: "ชุดจดหมาย",
      memberRate: "ราคาสมาชิก",
      relatedLease: "สัญญาเช่าที่เกี่ยวข้อง",
      viewLease: "ดูสัญญาเช่า",
      opsAssignment: "การมอบหมายทีม",
      opsTeam: "ทีมปฏิบัติการ",
      unassigned: "ยังไม่ได้มอบหมาย",
      timeline: "ไทม์ไลน์คดี",
      caseOpened: "เปิดคดี",
      awaitingReview: "รอการตรวจสอบจากทีม",
      actions: "การดำเนินการ",
      uploadDocument: "อัปโหลดเอกสาร",
      contactSupport: "ติดต่อฝ่ายสนับสนุน",
      caseHistory: "ประวัติคดี",
      generatedLetters: "จดหมายที่สร้าง",
      initialNotice: "จดหมายแจ้งเบื้องต้น",
      clarificationDocumentation: "ขอชี้แจงและเอกสาร",
      followupLetter: "จดหมายติดตาม",
      reconciliationPlan: "แผนการกระทบยอด",
      finalSettlementOffer: "จดหมายข้อเสนอสุดท้าย",
      beforeEscalation: "ก่อนการยกระดับ",
      view: "ดู",
      compilePack: "รวม PDF",
      compiling: "กำลังรวม...",
      completeLetterPack: "📄 Letter Pack ฉบับเต็ม",
      allLettersInOnePdf: "จดหมายทั้งหมดรวมใน PDF เดียว",
      download: "ดาวน์โหลด",
      downloadWord: "ดาวน์โหลด Word",
      preview: "ดูตัวอย่าง",
      notFoundDesc: "ไม่พบคดีที่คุณกำลังมองหา",
      teamWillContact: "ทีมของเราจะติดต่อคุณเร็วๆ นี้",
      reviewWithin: "ทีมของเราจะตรวจสอบคดีของคุณภายใน 24-48 ชั่วโมง",
      addEvidence: "เพิ่มหลักฐาน",
      contactTeam: "ติดต่อทีม",
      leaseNegotiationRequest: "จดหมายขอทบทวนสัญญาเช่า",
      depositReturnRequest: "จดหมายขอคืนเงินมัดจำ",
      damageClaimResponse: "จดหมายโต้แย้งค่าเสียหาย",
      earlyTerminationNotice: "จดหมายแจ้งยกเลิกก่อนกำหนด",
      forNegotiationBeforeSigning: "สำหรับเจรจาก่อนลงนาม - ส่งหาเจ้าของบ้าน",
      requestItemisedAssessment: "ขอรายละเอียดการประเมิน",
      requestReconciliation: "ขอประสานการยกเลิกสัญญา"
    },
    zh: {
      caseDetails: "案件详情",
      loading: "加载中...",
      notFound: "案件未找到",
      backToCases: "返回案件",
      caseNumber: "案件 #",
      opened: "开启",
      status: "状态",
      disputeAmount: "争议金额",
      caseSummary: "案件摘要",
      features: "功能",
      fastTrack: "快速通道",
      letterPack: "信件包",
      memberRate: "会员价",
      relatedLease: "相关租约",
      viewLease: "查看租约",
      opsAssignment: "运营分配",
      opsTeam: "运营团队",
      unassigned: "尚未分配",
      timeline: "案件时间轴",
      caseOpened: "案件已开启",
      awaitingReview: "等待团队审核",
      actions: "操作",
      uploadDocument: "上传文档",
      contactSupport: "联系支持",
      caseHistory: "案件历史",
      generatedLetters: "生成的信件",
      initialNotice: "初始通知",
      clarificationDocumentation: "澄清和文档",
      followupLetter: "跟进信件",
      reconciliationPlan: "和解计划",
      finalSettlementOffer: "最终和解提议",
      beforeEscalation: "升级之前",
      view: "查看",
      compilePack: "编译包",
      compiling: "编译中...",
      completeLetterPack: "📄 完整信件包",
      allLettersInOnePdf: "所有信件合并为一个PDF",
      download: "下载",
      downloadWord: "下载Word",
      preview: "预览",
      notFoundDesc: "找不到您要查找的案件。",
      teamWillContact: "我们的团队将很快与您联系",
      reviewWithin: "我们的团队将在24-48小时内审核您的案件",
      addEvidence: "添加证据",
      contactTeam: "联系团队",
      leaseNegotiationRequest: "租约谈判请求",
      depositReturnRequest: "押金退还请求",
      damageClaimResponse: "损害赔偿请求回复",
      earlyTerminationNotice: "提前终止通知",
      forNegotiationBeforeSigning: "签署前谈判 - 发送给房东",
      requestItemisedAssessment: "请求详细评估",
      requestReconciliation: "请求和解"
    },
    ja: {
      caseDetails: "ケース詳細",
      loading: "読み込み中...",
      notFound: "ケースが見つかりません",
      backToCases: "ケースに戻る",
      caseNumber: "ケース #",
      opened: "開設日",
      status: "ステータス",
      disputeAmount: "紛争金額",
      caseSummary: "ケース概要",
      features: "機能",
      fastTrack: "ファストトラック",
      letterPack: "レターパック",
      memberRate: "メンバー価格",
      relatedLease: "関連賃貸契約",
      viewLease: "賃貸契約を表示",
      opsAssignment: "運用割り当て",
      opsTeam: "運用チーム",
      unassigned: "まだ割り当てられていません",
      timeline: "ケースタイムライン",
      caseOpened: "ケース開設",
      awaitingReview: "チームのレビュー待ち",
      actions: "アクション",
      uploadDocument: "ドキュメントをアップロード",
      contactSupport: "サポートに連絡",
      caseHistory: "ケース履歴",
      generatedLetters: "生成されたレター",
      initialNotice: "初期通知",
      clarificationDocumentation: "明確化と文書化",
      followupLetter: "フォローアップレター",
      reconciliationPlan: "和解計画",
      finalSettlementOffer: "最終和解提案",
      beforeEscalation: "エスカレーション前",
      view: "表示",
      compilePack: "パックをコンパイル",
      compiling: "コンパイル中...",
      completeLetterPack: "📄 完全なレターパック",
      allLettersInOnePdf: "すべてのレターを1つのPDFに",
      download: "ダウンロード",
      downloadWord: "Wordをダウンロード",
      preview: "プレビュー",
      notFoundDesc: "お探しのケースは存在しません。",
      teamWillContact: "チームがすぐにご連絡します",
      reviewWithin: "チームは24〜48時間以内にケースをレビューします",
      addEvidence: "証拠を追加",
      contactTeam: "チームに連絡",
      leaseNegotiationRequest: "賃貸契約交渉リクエスト",
      depositReturnRequest: "敷金返還リクエスト",
      damageClaimResponse: "損害賠償請求への回答",
      earlyTerminationNotice: "早期解約通知",
      forNegotiationBeforeSigning: "署名前の交渉 - 家主へ送付",
      requestItemisedAssessment: "項目別評価を要求",
      requestReconciliation: "和解調整を要求"
    },
    ko: {
      caseDetails: "사례 상세정보",
      loading: "로딩 중...",
      notFound: "사례를 찾을 수 없음",
      backToCases: "사례로 돌아가기",
      caseNumber: "사례 #",
      opened: "개설일",
      status: "상태",
      disputeAmount: "분쟁 금액",
      caseSummary: "사례 요약",
      features: "기능",
      fastTrack: "패스트 트랙",
      letterPack: "레터 팩",
      memberRate: "회원 가격",
      relatedLease: "관련 임대 계약",
      viewLease: "임대 계약 보기",
      opsAssignment: "운영 할당",
      opsTeam: "운영 팀",
      unassigned: "아직 할당되지 않음",
      timeline: "사례 타임라인",
      caseOpened: "사례 개설",
      awaitingReview: "팀 검토 대기 중",
      actions: "작업",
      uploadDocument: "문서 업로드",
      contactSupport: "지원 문의",
      caseHistory: "사례 기록",
      generatedLetters: "생성된 레터",
      initialNotice: "초기 통지",
      clarificationDocumentation: "명확화 및 문서화",
      followupLetter: "후속 레터",
      reconciliationPlan: "화해 계획",
      finalSettlementOffer: "최종 합의 제안",
      beforeEscalation: "확대 전",
      view: "보기",
      compilePack: "팩 컴파일",
      compiling: "컴파일 중...",
      completeLetterPack: "📄 완전한 레터 팩",
      allLettersInOnePdf: "모든 레터를 하나의 PDF로",
      download: "다운로드",
      downloadWord: "Word 다운로드",
      preview: "미리보기",
      notFoundDesc: "찾으시는 사례가 존재하지 않습니다.",
      teamWillContact: "팀이 곧 연락드리겠습니다",
      reviewWithin: "팀이 24-48시간 이내에 사례를 검토합니다",
      addEvidence: "증거 추가",
      contactTeam: "팀에 문의",
      leaseNegotiationRequest: "임대 협상 요청서",
      depositReturnRequest: "보증금 반환 요청서",
      damageClaimResponse: "손해배상 청구 응답",
      earlyTerminationNotice: "조기 해지 통지",
      forNegotiationBeforeSigning: "서명 전 협상 - 집주인에게 발송",
      requestItemisedAssessment: "항목별 평가 요청",
      requestReconciliation: "화해 요청"
    }
  };

  const strings = t[language] || t.en;
  const statusConfig = caseItem ? STATUS_CONFIG[caseItem.status] || STATUS_CONFIG.intake : STATUS_CONFIG.intake;
  const StatusIcon = statusConfig.icon;

  if (caseLoading) {
    return (
      <div className="min-h-screen p-6 page-transition" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-5xl mx-auto">
          <SkeletonLoader variant="card" count={3} isDarkMode={isDarkMode} />
        </div>
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="min-h-screen p-6 page-transition" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-5xl mx-auto">
          <PageHeader
            title={strings.notFound}
            subtitle={strings.notFoundDesc}
            icon={Scale}
            iconColor="#EF4444"
            showBack={true}
            backRoute={fromOps ? `${createPageUrl("OpsConsole")}?tab=${previousTab}` : createPageUrl("Cases")}
            isDarkMode={isDarkMode}
          />
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-0">
              <EmptyState
                icon={Scale}
                title={strings.notFound}
                description={strings.notFoundDesc}
                actionLabel={strings.backToCases}
                onAction={() => navigate(createPageUrl("Cases"))}
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
      <div className="max-w-5xl mx-auto">
        {/* Upload Modal */}
        <Dialog open={showUploadModal} onOpenChange={(open) => { if (!uploading) { setShowUploadModal(open); if (!open) { setSelectedFiles([]); setCustomLabel(''); } } }}>
          <DialogContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'อัปโหลดเอกสาร' : 'Upload Document'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label style={{ color: colors.textPrimary }}>{language === 'th' ? 'ประเภทเอกสาร' : 'Document Type'}</Label>
                <Select value={uploadType} onValueChange={setUploadType}>
                  <SelectTrigger className="mt-2" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#FFFFFF', borderColor: colors.borderColor, color: colors.textPrimary }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: colors.cardBg }}>
                    {Object.entries(DOC_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {language === 'th' ? config.label_th : config.label_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label style={{ color: colors.textPrimary }}>{language === 'th' ? 'ป้ายกำกับ (ไม่บังคับ)' : 'Label (optional)'}</Label>
                <Input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder={language === 'th' ? 'เช่น รูปภาพตอนย้ายเข้า' : 'e.g., Move-in photos'}
                  className="mt-2"
                  style={{ backgroundColor: isDarkMode ? '#353A3D' : '#FFFFFF', borderColor: colors.borderColor, color: colors.textPrimary }}
                />
              </div>
              <div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="case-file-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov,.avi"
                  disabled={uploading}
                />
                <label htmlFor="case-file-upload" className={uploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}>
                  <div className="border-2 border-dashed rounded-xl p-6 text-center transition-colors" style={{ borderColor: colors.borderColor, backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                    <Upload className="w-10 h-10 mx-auto mb-2" style={{ color: colors.textSecondary }} />
                    <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                      {language === 'th' ? 'คลิกเพื่อเลือกไฟล์' : 'Click to browse files'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>PDF, JPG, PNG, MP4, MOV</p>
                  </div>
                </label>
              </div>
              {selectedFiles.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6' }}>
                      <span className="text-sm truncate flex-1" style={{ color: colors.textPrimary }}>{file.name}</span>
                      <button onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))} disabled={uploading} className="ml-2 p-1 hover:bg-red-100 rounded">
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => { setShowUploadModal(false); setSelectedFiles([]); setCustomLabel(''); }} disabled={uploading}>
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </Button>
                <Button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0} style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}>
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{language === 'th' ? 'กำลังอัปโหลด...' : 'Uploading...'}</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" />{language === 'th' ? 'อัปโหลด' : 'Upload'}</>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {previewLetter && (
          <LetterPreview
            open={!!previewLetter}
            onOpenChange={() => {
              haptic.light();
              setPreviewLetter(null);
            }}
            htmlUrl={previewLetter.htmlUrl}
            docUrl={previewLetter.docUrl}
            title={getLetterTitle(previewLetter.subject)}
          />
        )}

        <Button
          variant="outline"
          onClick={() => {
            haptic.light();
            navigate(fromOps ? `${createPageUrl("OpsConsole")}?tab=${previousTab}` : createPageUrl("Cases"));
          }}
          className="mb-4 md:mb-6 btn-interaction"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {fromOps 
            ? (language === 'th' ? 'กลับไปคอนโซลปฏิบัติการ' 
              : language === 'zh' ? '返回运营控制台'
              : language === 'ja' ? 'オペレーションコンソールに戻る'
              : language === 'ko' ? '운영 콘솔로 돌아가기'
              : 'Back to Ops Console')
            : strings.backToCases
          }
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: theme.headerColor }}>
              {caseItem.case_number || `Case #${caseItem.id.slice(0, 8)}`}
            </h1>
            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <Calendar className="w-4 h-4" />
              {strings.opened} {format(new Date(caseItem.created_date), 'MMMM d, yyyy')}
            </div>
          </div>
          <Badge className={`${statusConfig.color} border flex items-center gap-2 text-sm px-4 py-2`}>
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </Badge>
          {caseItem.status === 'awaiting_payment' && (
            <button
              disabled={isProcessingPayment}
              onClick={async () => {
                setIsProcessingPayment(true);
                try {
                  const response = await base44.functions.invoke('createResolveCheckout', {
                    userId: user.id,
                    userEmail: user.email,
                    caseId: caseItem.id,
                    priceType: 'public',
                    amount: 5000
                  });
                  if (response.data?.url) {
                    window.location.href = response.data.url;
                  } else {
                    toast.error('Payment initiation failed. Please try again.');
                    setIsProcessingPayment(false);
                  }
                } catch (err) {
                  toast.error('Payment initiation failed. Please try again.');
                  setIsProcessingPayment(false);
                }
              }}
              style={{ backgroundColor: isProcessingPayment ? '#9CA3AF' : '#C7A338', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: '600', fontSize: '14px', cursor: isProcessingPayment ? 'not-allowed' : 'pointer' }}
            >
              {isProcessingPayment ? 'Processing...' : 'Complete Payment'}
            </button>
          )}
        </div>

        {/* Case Information */}
        <Card
          className="mb-6 border-none shadow-lg"
          style={{
            background: theme.background,
            borderLeft: `4px solid ${theme.borderLeftColor}`
          }}
        >
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg" style={{ color: theme.headerColor }}>
              <Scale className="w-5 h-5" style={{ color: theme.accent }} />
              {strings.caseDetails}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {/* Dispute Amount */}
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                  {strings.disputeAmount}
                </p>
                <div className="flex items-baseline gap-2">
                  <DollarSign className="w-5 h-5" style={{ color: theme.accent }} />
                  <p className="text-2xl font-bold" style={{ color: theme.metricColor }}>
                    ฿{caseItem.dispute_amount?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Features */}
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                  {strings.features}
                </p>
                <div className="flex flex-wrap gap-2">
                  {caseItem.fast_track && (
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                      <Zap className="w-3 h-3 mr-1" />
                      {strings.fastTrack}
                    </Badge>
                  )}
                  {caseItem.letter_pack && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      <Mail className="w-3 h-3 mr-1" />
                      {strings.letterPack}
                    </Badge>
                  )}
                  {caseItem.is_member_at_creation && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      <Crown className="w-3 h-3 mr-1" />
                      {strings.memberRate}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Case Summary */}
            {caseItem.summary && (
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                  {strings.caseSummary}
                </p>
                <div className="p-4 rounded-lg" style={{
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `1px solid ${colors.borderColor}`
                }}>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: colors.textPrimary, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {caseItem.summary}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Lease */}
        {lease && (
          <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <FileText className="w-5 h-5 text-ls-forest" />
                {strings.relatedLease}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
                    {lease.property_address || 'Lease Agreement'}
                  </p>
                  {lease.rent_amount && (
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      ฿{lease.rent_amount.toLocaleString()}/month
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(createPageUrl("LeaseDetails") + `?leaseId=${lease.id}`)}
                >
                  {strings.viewLease}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ops Assignment */}
        <Card
          className="mb-6 border-none shadow-lg"
          style={{
            background: theme.background,
            borderLeft: `4px solid ${theme.borderLeftColor}`
          }}
        >
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg" style={{ color: theme.headerColor }}>
              <UserCheck className="w-5 h-5" style={{ color: theme.accent }} />
              {strings.opsAssignment}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {caseItem.ops_assigned ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: colors.textPrimary }}>
                    {strings.opsTeam}
                  </p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {strings.teamWillContact}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: colors.textPrimary }}>
                    {strings.unassigned}
                  </p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {strings.reviewWithin}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Letters Section */}
        {caseItem.letters && (caseItem.letters.v1_url || caseItem.letters.v2_url || caseItem.letters.v3_url || caseItem.letter_pack_url || caseItem.letters.deposit_url || caseItem.letters.damages_url || caseItem.letters.early_termination_url || caseItem.letters.lease_negotiation_url) && (
          <Card
            className="mb-6 border-none shadow-lg"
            style={{
              background: theme.background,
              borderLeft: `4px solid ${theme.borderLeftColor}`
            }}
          >
            <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg" style={{ color: theme.headerColor }}>
                  <FileText className="w-5 h-5" style={{ color: theme.accent }} />
                  {strings.generatedLetters}
                </CardTitle>
                {/* Letter Pack Compile Button */}
                {!caseItem.letter_pack_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCompilePack}
                    disabled={compilingPack}
                    className="border-purple-600 text-purple-600"
                  >
                    {compilingPack ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        {strings.compiling}
                      </>
                    ) : (
                      <>
                        <FileText className="w-3 h-3 mr-1" />
                        {strings.compilePack}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {/* Letter Pack - Full Compilation */}
              {caseItem.letter_pack_url && (
                <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-base" style={{ color: colors.textPrimary }}>
                          {strings.completeLetterPack}
                        </p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {strings.allLettersInOnePdf}
                        </p>
                      </div>
                    </div>
                    <a href={caseItem.letter_pack_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="ls-cta-primary">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {strings.download}
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              {/* Individual Letters - Phase 1 (Subject-based) */}
              <div className="space-y-3">
                {/* Lease Negotiation Letter - PRE-SIGNING */}
                {caseItem.letters.lease_negotiation_url && (
                  <div className="flex items-center justify-between p-3 rounded-lg border-2" style={{
                    backgroundColor: isDarkMode ? '#1F2937' : '#FEF3C7',
                    borderColor: '#F59E0B',
                    border: `2px solid ${isDarkMode ? '#F59E0B' : '#FCD34D'}`
                  }}>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 mb-1 text-xs">
                          ⭐ PRE-SIGNING
                        </Badge>
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {strings.leaseNegotiationRequest}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {strings.forNegotiationBeforeSigning}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePreviewHtml('lease_negotiation')}
                        className="px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                          color: colors.textPrimary,
                          border: `1px solid ${colors.borderColor}`
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#FEF3C7';
                          e.target.style.borderColor = '#F59E0B';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F3F4F6';
                          e.target.style.borderColor = colors.borderColor;
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        {strings.preview}
                      </button>
                      <button
                        onClick={() => handleDownloadWord('lease_negotiation')}
                        className="px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ls-cta-primary"
                      >
                        <Download className="w-4 h-4" />
                        Word
                      </button>
                    </div>
                  </div>
                )}

                {/* Deposit Letter */}
                {caseItem.letters.deposit_url && (
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {strings.depositReturnRequest}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {strings.clarificationDocumentation}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePreviewHtml('deposit')}
                        className="px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                          color: colors.textPrimary,
                          border: `1px solid ${colors.borderColor}`
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#EEF2FF';
                          e.target.style.borderColor = '#6366F1';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F3F4F6';
                          e.target.style.borderColor = colors.borderColor;
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        {strings.preview}
                      </button>
                      <button
                        onClick={() => handleDownloadWord('deposit')}
                        className="px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ls-cta-primary"
                      >
                        <Download className="w-4 h-4" />
                        Word
                      </button>
                    </div>
                  </div>
                )}

                {/* Damages Letter */}
                {caseItem.letters.damages_url && (
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {strings.damageClaimResponse}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {strings.requestItemisedAssessment}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePreviewHtml('damages')}
                        className="px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                          color: colors.textPrimary,
                          border: `1px solid ${colors.borderColor}`
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#EEF2FF';
                          e.target.style.borderColor = '#6366F1';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F3F4F6';
                          e.target.style.borderColor = colors.borderColor;
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        {strings.preview}
                      </button>
                      <button
                        onClick={() => handleDownloadWord('damages')}
                        className="px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ls-cta-primary"
                      >
                        <Download className="w-4 h-4" />
                        Word
                      </button>
                    </div>
                  </div>
                )}

                {/* Early Termination Letter */}
                {caseItem.letters.early_termination_url && (
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {strings.earlyTerminationNotice}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {strings.requestReconciliation}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePreviewHtml('early_termination')}
                        className="px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                          color: colors.textPrimary,
                          border: `1px solid ${colors.borderColor}`
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#EEF2FF';
                          e.target.style.borderColor = '#6366F1';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F3F4F6';
                          e.target.style.borderColor = colors.borderColor;
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        {strings.preview}
                      </button>
                      <button
                        onClick={() => handleDownloadWord('early_termination')}
                        className="px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ls-cta-primary"
                      >
                        <Download className="w-4 h-4" />
                        Word
                      </button>
                    </div>
                  </div>
                )}

                {/* Legacy Letters (v1, v2, v3) */}
                {caseItem.letters.v1_url && (
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {strings.initialNotice}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {strings.clarificationDocumentation}
                        </p>
                      </div>
                    </div>
                    <a href={caseItem.letters.v1_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {strings.view}
                      </Button>
                    </a>
                  </div>
                )}

                {caseItem.letters.v2_url && (
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {strings.followupLetter}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {strings.reconciliationPlan}
                        </p>
                      </div>
                    </div>
                    <a href={caseItem.letters.v2_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {strings.view}
                      </Button>
                    </a>
                  </div>
                )}

                {caseItem.letters.v3_url && (
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {strings.finalSettlementOffer}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {strings.beforeEscalation}
                        </p>
                      </div>
                    </div>
                    <a href={caseItem.letters.v3_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {strings.view}
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Clock className="w-5 h-5 text-slate-600" />
              {strings.timeline}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="w-0.5 h-full bg-slate-200 mt-2"></div>
                </div>
                <div className="flex-1 pb-6">
                  <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
                    {strings.caseOpened}
                  </p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {format(new Date(caseItem.created_date), 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>

              {caseItem.status === 'active' && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
                      {strings.awaitingReview}
                    </p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {strings.teamWillContact}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <div className="mb-6">
          <CaseMessages
            caseItem={caseItem}
            caseId={caseId}
            user={user}
            isAdmin={fromOps}
            language={language}
            isDarkMode={isDarkMode}
            colors={colors}
          />
        </div>

        {/* Actions */}
        <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">{strings.actions}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <Button
              variant="outline"
              onClick={() => { haptic.light(); setShowUploadModal(true); }}
              className="justify-start h-auto py-4 w-full"
            >
              <FileText className="w-5 h-5 mr-3 text-blue-600" />
              <div className="text-left">
                <div className="font-semibold">{strings.uploadDocument}</div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>
                  {strings.addEvidence}
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CaseDetails() {
  return (
    <AuthGuard>
      <ToastProvider>
        <CaseDetailsContent />
      </ToastProvider>
    </AuthGuard>
  );
}