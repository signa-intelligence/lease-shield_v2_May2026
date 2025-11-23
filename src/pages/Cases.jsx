import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Scale, Plus, Crown, Calendar, Zap, FileText, Loader2,
  CheckCircle2, Eye, Download, ChevronDown, ChevronUp, ArrowLeft, Clock, AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { useFeatureAccess } from "@/components/shared/FeatureGate";
import LetterPreview from "../components/shared/LetterPreview";
import { haptic } from "../components/shared/HapticFeedback";
import SwipeToDelete from "../components/shared/SwipeToDelete";
import SkeletonLoader from "../components/shared/SkeletonLoader";
import EmptyState from "../components/shared/EmptyState";
import FloatingActionButton from "../components/shared/FloatingActionButton";
import LazyImage from "../components/shared/LazyImage";
import PullToRefresh from "../components/shared/PullToRefresh";
import { ToastProvider, useToast } from "../components/shared/Toast";
import DebouncedSearch from "../components/shared/DebouncedSearch";
import { getFeatureCardStyles, FEATURE_COLORS } from "../components/shared/featureTheme";
import { RESOLVE_PRICING, hasMemberPricing, getMembershipEligibility, getResolvePricingForUser } from "../components/shared/resolvePricing";

const STATUS_CONFIG = {
  awaiting_payment: { label: 'Awaiting Payment', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  intake: { label: 'Intake', color: 'bg-slate-100 text-slate-800', icon: Calendar },
  pending_review: { label: 'Pending Review', color: 'bg-amber-100 text-amber-800', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-800', icon: Scale },
  ready_drafts: { label: 'Ready Drafts', color: 'bg-purple-100 text-purple-800', icon: FileText },
  client_review: { label: 'Client Review', color: 'bg-cyan-100 text-cyan-800', icon: Eye },
  awaiting_landlord: { label: 'Awaiting Landlord', color: 'bg-orange-100 text-orange-800', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-800', icon: Zap },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle2 }
};

function CasesContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { hasAccess: hasPriorityQueue } = useFeatureAccess('priority_queue');
  const { hasAccess: hasMemberPrice } = useFeatureAccess('resolve_member_price');

  const [expandedCase, setExpandedCase] = useState(null);
  const [previewLetter, setPreviewLetter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showResolveSuccessBanner, setShowResolveSuccessBanner] = useState(false);
  const [highlightCaseId, setHighlightCaseId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: cases = [], refetch: refetchCases, isLoading, error } = useQuery({
    queryKey: ['cases', user?.email],
    queryFn: async () => {
      console.log('🔍 [CASES_PAGE] Fetching cases for user:', user?.email);
      console.log('🔍 [CASES_PAGE] User object:', { id: user?.id, email: user?.email, role: user?.role });
      
      const result = await base44.entities.Case.filter({ user_email: user?.email }, '-created_date');
      
      console.log('📊 [CASES_PAGE] Query returned:', result.length, 'cases');
      console.log('📊 [CASES_PAGE] Raw result:', JSON.stringify(result.map(c => ({
        id: c.id,
        user_email: c.user_email,
        status: c.status,
        type: c.type,
        created_date: c.created_date
      })), null, 2));
      
      return result;
    },
    enabled: !!user,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
    cacheTime: 0,
  });

  // Always refetch on mount to avoid stale data after redirects
  useEffect(() => {
    if (refetchCases) {
      refetchCases();
    }
  }, [refetchCases]);

  // Safe URL param handling - runs after cases are loaded
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const resolveSuccess = urlParams.get('resolve_success');
    const resolveCancelled = urlParams.get('resolve_cancelled');
    const caseId = urlParams.get('caseId');

    console.log('🔍 [CASES_PAGE] URL params:', { resolveSuccess, resolveCancelled, caseId });
    console.log('🔍 [CASES_PAGE] User:', user?.email);
    console.log('🔍 [CASES_PAGE] Loaded cases:', cases.length);

    if (resolveSuccess === 'true') {
      setShowResolveSuccessBanner(true);
      if (caseId) {
        setHighlightCaseId(caseId);
        
        // Check if case exists
        const foundCase = cases.find(c => c.id === caseId);
        if (foundCase) {
          console.log('[CASES_PAGE] ✅ Case found:', foundCase.id, 'Status:', foundCase.status);
        } else {
          console.warn('[CASES_PAGE] ⚠️ Case not found in loaded cases:', caseId);
        }
      }
      
      // Clean URL after 5 seconds
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }, 5000);
    }

    if (resolveCancelled === 'true') {
      console.log('[CASES_PAGE] ⚠️ Payment cancelled');
      
      toast.error(
        language === 'th' ? 'การชำระเงินไม่สำเร็จ คดีของคุณยังไม่ได้ถูกส่ง' :
        language === 'ru' ? 'Оплата не завершена. Ваше дело не было отправлено' :
        'Payment not completed. Your case has not been submitted yet'
      );
      
      // Clean URL immediately
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [user, cases, toast, language]);

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const theme = getFeatureCardStyles("cases", isDarkMode);

  // Debug logging
  useEffect(() => {
    console.log('🔄 [CASES_PAGE] Cases updated:', {
      isLoading,
      hasError: !!error,
      count: cases.length,
      user: user?.email,
      caseIds: cases.map(c => c.id),
      statuses: cases.map(c => c.status)
    });
  }, [cases, isLoading, error, user]);

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40'
  } : {
    bg: '#ECEFED',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  const t = {
    th: {
      title: "คดีของฉัน",
      subtitle: "ติดตามคดีพิพาทของคุณ",
      openNewCase: "เปิดคดีใหม่",
      premiumBenefits: "สิทธิประโยชน์แบบพรีเมียม",
      memberRate: "ราคาสมาชิกสำหรับบริการทั้งหมด",
      priorityHandling: "จัดการคดีแบบเร่งด่วน",
      noCases: "ยังไม่มีคดี",
      noCasesDesc: "เปิดคดีเพื่อรับความช่วยเหลือจากมืออาชีพในการเรียกคืนเงินมัดจำหรือข้อพิพาท",
      noCasesCreatedYet: "ยังไม่มีการสร้างกรณี",
      noCasesCreatedYetDesc: "เมื่อเกิดข้อพิพาท ให้บันทึกกรณีที่นี่เพื่อเก็บข้อความ, หลักฐาน และไทม์ไลน์ทั้งหมดไว้ในที่เดียวที่ปลอดภัย",
      upgradeForDisputeTools: "อัปเกรดเพื่อเครื่องมือสนับสนุนข้อพิพาท",
      caseNumber: "คดี",
      opened: "เปิดเมื่อ",
      disputeAmount: "จำนวนเงินพิพาท",
      features: "ฟีเจอร์",
      fastTrack: "เร่งด่วน",
      letterPack: "แพ็กจดหมาย",
      memberRateBadge: "ราคาสมาชิก",
      viewDetails: "ดูรายละเอียด",
      generatedLetters: "จดหมาย",
      showLetters: "แสดงจดหมาย",
      hideLetters: "ซ่อนจดหมาย",
      preview: "ดูตัวอย่าง",
      download: "ดาวน์โหลด",
      delete: "ลบ",
      back: "ย้อนกลับ",
      refreshed: "รีเฟรชสำเร็จ",
      downloadSuccess: "เริ่มดาวน์โหลดแล้ว",
      downloadFailed: "ดาวน์โหลดไม่สำเร็จ",
      previewError: "ไม่พบไฟล์สำหรับจดหมายนี้",
      searchCases: "ค้นหาด้วยเลขคดีหรือรายละเอียด...",
      filterByStatus: "กรองตามสถานะ",
      allStatuses: "ทุกสถานะ",
      noResultsFound: "ไม่พบคดี",
      tryDifferentSearch: "ลองค้นหาหรือกรองด้วยค่าอื่น",
    },
    zh: {
      title: "我的案件",
      subtitle: "追踪您的争议案件",
      openNewCase: "开启新案件",
      premiumBenefits: "高级案件福利",
      memberRate: "所有服务的会员价",
      priorityHandling: "优先案件处理",
      noCases: "暂无案件",
      noCasesDesc: "开启案件以获得押金回收或租赁纠纷的专业帮助",
      noCasesCreatedYet: "尚未创建案件",
      noCasesCreatedYetDesc: "当发生争议时，在此处记录案件，将所有消息、证据和时间线集中保存在一个受保护的地方。",
      upgradeForDisputeTools: "升级以获取争议支持工具",
      caseNumber: "案件",
      opened: "开启于",
      disputeAmount: "争议金额",
      features: "功能",
      fastTrack: "快速通道",
      letterPack: "信件包",
      memberRateBadge: "会员价",
      viewDetails: "查看详情",
      generatedLetters: "信件",
      showLetters: "显示信件",
      hideLetters: "隐藏信件",
      preview: "预览",
      download: "下载",
      delete: "删除",
      back: "返回",
      refreshed: "刷新成功",
      downloadSuccess: "下载已开始",
      downloadFailed: "下载失败",
      previewError: "未找到此信件的文件",
      searchCases: "按案件编号或描述搜索...",
      filterByStatus: "按状态筛选",
      allStatuses: "所有状态",
      noResultsFound: "未找到案件",
      tryDifferentSearch: "尝试不同的搜索或筛选",
    },
    ja: {
      title: "マイケース",
      subtitle: "紛争ケースを追跡",
      openNewCase: "新しいケースを開く",
      premiumBenefits: "プレミアムケース特典",
      memberRate: "全サービスのメンバー価格",
      priorityHandling: "優先ケース処理",
      noCases: "ケースなし",
      noCasesDesc: "敷金回収または賃貸紛争に関する専門的な支援を受けるためにケースを開いてください",
      noCasesCreatedYet: "まだケースは作成されていません",
      noCasesCreatedYetDesc: "紛争が発生した場合、メッセージ、証拠、タイムラインをすべて1つの保護された場所に保持するために、ここでケースを記録してください。",
      upgradeForDisputeTools: "紛争支援ツールにアップグレード",
      caseNumber: "ケース",
      opened: "開設日",
      disputeAmount: "紛争金額",
      features: "機能",
      fastTrack: "ファストトラック",
      letterPack: "レターパック",
      memberRateBadge: "メンバー価格",
      viewDetails: "詳細を見る",
      generatedLetters: "レター",
      showLetters: "レターを表示",
      hideLetters: "レターを非表示",
      preview: "プレビュー",
      download: "ダウンロード",
      delete: "削除",
      back: "戻る",
      refreshed: "更新成功",
      downloadSuccess: "ダウンロード開始",
      downloadFailed: "ダウンロード失敗",
      previewError: "このレターのファイルが見つかりません",
      searchCases: "ケース番号または説明で検索...",
      filterByStatus: "ステータスでフィルター",
      allStatuses: "すべてのステータス",
      noResultsFound: "ケースが見つかりません",
      tryDifferentSearch: "別の検索またはフィルターを試してください",
    },
    ko: {
      title: "내 사례",
      subtitle: "분쟁 사례 추적",
      openNewCase: "새 사례 열기",
      premiumBenefits: "프리미엄 사례 혜택",
      memberRate: "모든 서비스에 대한 회원 가격",
      priorityHandling: "우선 사례 처리",
      noCases: "아직 사례 없음",
      noCasesDesc: "보증금 회수 또는 임대 분쟁에 대한 전문적인 도움을 받으려면 사례를 여세요",
      noCasesCreatedYet: "아직 생성된 사례가 없습니다",
      noCasesCreatedYetDesc: "분쟁이 발생하면, 모든 메시지, 증거 및 타임라인을 하나의 보호된 장소에 보관하기 위해 여기에 사례를 기록하십시오.",
      upgradeForDisputeTools: "분쟁 지원 도구를 위한 업그레이드",
      caseNumber: "사례",
      opened: "개설일",
      disputeAmount: "분쟁 금액",
      features: "기능",
      fastTrack: "패스트 트랙",
      letterPack: "레터 팩",
      memberRateBadge: "회원 가격",
      viewDetails: "세부 정보 보기",
      generatedLetters: "레터",
      showLetters: "레터 표시",
      hideLetters: "레터 숨기기",
      preview: "미리보기",
      download: "다운로드",
      delete: "삭제",
      back: "뒤로",
      refreshed: "새로고침 성공",
      downloadSuccess: "다운로드 시작됨",
      downloadFailed: "다운로드 실패",
      previewError: "이 레터의 파일을 찾을 수 없습니다",
      searchCases: "사례 번호 또는 설명으로 검색...",
      filterByStatus: "상태별 필터",
      allStatuses: "모든 상태",
      noResultsFound: "사례를 찾을 수 없음",
      tryDifferentSearch: "다른 검색 또는 필터를 시도하세요",
    },
    ru: {
      title: "Мои дела",
      subtitle: "Управление вашими спорами",
      openNewCase: "Открыть дело",
      premiumBenefits: "Преимущества для участников",
      memberRate: "Тарифы участника на все услуги",
      priorityHandling: "Приоритетная обработка дел",
      noCases: "Дел пока нет",
      noCasesDesc: "Откройте дело для профессиональной помощи в возврате депозита или разрешении споров по аренде",
      noCasesCreatedYet: "Дела ещё не созданы",
      noCasesCreatedYetDesc: "При возникновении спора зафиксируйте его здесь, чтобы хранить все сообщения, доказательства и события в одном защищённом месте.",
      upgradeForDisputeTools: "Обновить план для инструментов споров",
      caseNumber: "Дело",
      opened: "Открыто",
      disputeAmount: "Сумма спора",
      features: "Опции",
      fastTrack: "Ускоренный режим",
      letterPack: "Пакет писем",
      memberRateBadge: "Тариф участника",
      viewDetails: "Подробнее",
      generatedLetters: "Письма",
      showLetters: "Показать письма",
      hideLetters: "Скрыть письма",
      preview: "Просмотр",
      download: "Скачать",
      delete: "Удалить",
      back: "Назад",
      refreshed: "Обновлено",
      downloadSuccess: "Скачивание началось",
      downloadFailed: "Ошибка скачивания",
      previewError: "Файл письма не найден",
      searchCases: "Поиск по номеру или описанию...",
      filterByStatus: "Фильтр по статусу",
      allStatuses: "Все статусы",
      noResultsFound: "Дела не найдены",
      tryDifferentSearch: "Попробуйте другой фильтр",
      needMoreHelp: "Нужна помощь со спором?",
      openResolveDesc: "Откройте дело Resolve для профессиональной поддержки.",
      openResolveCase: "Открыть дело Resolve"
    },
    en: {
      title: "My Cases",
      subtitle: "Track your dispute cases",
      openNewCase: "Open New Case",
      premiumBenefits: "Premium Case Benefits",
      memberRate: "Member rate on all services",
      priorityHandling: "Priority case handling",
      noCases: "No Cases Yet",
      noCasesDesc: "Open a case to get professional help with deposit recovery or lease disputes",
      noCasesCreatedYet: "No cases created yet",
      noCasesCreatedYetDesc: "When there's a dispute, log a case here to keep all messages, evidence and timelines in one protected place.",
      upgradeForDisputeTools: "Upgrade for dispute support tools",
      caseNumber: "Case",
      opened: "Opened",
      disputeAmount: "Dispute Amount",
      features: "Features",
      fastTrack: "Fast Track",
      letterPack: "Letter Pack",
      memberRateBadge: "Member Rate",
      viewDetails: "View Details",
      generatedLetters: "Letters",
      showLetters: "Show Letters",
      hideLetters: "Hide Letters",
      preview: "Preview",
      download: "Download",
      delete: "Delete",
      back: "Back",
      refreshed: "Refreshed successfully",
      downloadSuccess: "Download started",
      downloadFailed: "Download failed",
      previewError: "No file found for this letter",
      searchCases: "Search by case number or description...",
      filterByStatus: "Filter by status",
      allStatuses: "All Statuses",
      noResultsFound: "No cases found",
      tryDifferentSearch: "Try a different search or filter",
      needMoreHelp: "Need more help?",
      openResolveDesc: "Open a Resolve case for professional support at member or public rates.",
      openResolveCase: "Open Resolve Case"
    }
  };

  const strings = t[language] || t.en;

  const handleRefresh = async () => {
    haptic.light();
    await queryClient.invalidateQueries({ queryKey: ['cases'] });
    toast.success(strings.refreshed);
  };

  // Visible statuses - cases to show to users
  const VISIBLE_STATUSES = ['awaiting_payment', 'intake', 'pending_review', 'under_review', 'ready_drafts', 
                            'client_review', 'awaiting_landlord', 'in_progress', 'resolved', 'closed'];
  
  // Filter cases: only show visible statuses, then apply search & status filter
  const visibleCases = cases.filter(c => VISIBLE_STATUSES.includes(c.status));
  
  const filteredCases = visibleCases.filter(caseItem => {
    const matchesSearch = searchQuery === '' ||
      caseItem.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getLetterTitle = (subject) => {
    const titles = {
      lease_negotiation: language === 'th' ? 'จดหมายขอทบทวนสัญญาเช่า' : 'Lease Negotiation Request',
      deposit: language === 'th' ? 'จดหมายขอคืนเงินมัดจำ' : 'Deposit Return Request',
      damages: language === 'th' ? 'จดหมายโต้แย้งค่าเสียหาย' : 'Damage Claim Response',
      early_termination: language === 'th' ? 'จดหมายแจ้งยกเลิกก่อนกำหนด' : 'Early Termination Notice',
      deductions: language === 'th' ? 'ขอรายละเอียดการหักเงิน' : 'Request for Itemised Deductions'
    };
    return titles[subject] || subject;
  };

  const handleDownloadDocx = async (docUrl, subject) => {
    haptic.light();
    try {
      const response = await fetch(docUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${subject}_${new Date().getTime()}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      haptic.success();
      toast.success(strings.downloadSuccess);
    } catch (err) {
      console.error('Download failed:', err);
      haptic.error();
      toast.error(strings.downloadFailed);
    }
  };

  const handlePreviewHtml = (caseItem, subject) => {
    haptic.light();
    const htmlKey = `${subject}_html_url`;
    const docKey = `${subject}_url`;

    const htmlUrl = caseItem?.letters?.[htmlKey];
    const docUrl = caseItem?.letters?.[docKey];

    if (!htmlUrl && !docUrl) {
      toast.error(strings.previewError);
      return;
    }

    setPreviewLetter({
      htmlUrl: htmlUrl,
      docUrl: docUrl,
      subject: subject
    });
  };

  const getGeneratedLetters = (caseItem) => {
    const letters = [];
    if (caseItem?.letters) {
      if (caseItem.letters.lease_negotiation_url) letters.push('lease_negotiation');
      if (caseItem.letters.deposit_url) letters.push('deposit');
      if (caseItem.letters.damages_url) letters.push('damages');
      if (caseItem.letters.deductions_url) letters.push('deductions');
      if (caseItem.letters.early_termination_url) letters.push('early_termination');
    }
    return letters;
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} colors={colors}>
      <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-7xl mx-auto">
          {previewLetter && (
            <LetterPreview
              open={!!previewLetter}
              onOpenChange={() => setPreviewLetter(null)}
              htmlUrl={previewLetter.htmlUrl}
              docUrl={previewLetter.docUrl}
              title={getLetterTitle(previewLetter.subject)}
            />
          )}

          <FloatingActionButton
            icon={Plus}
            label={strings.openNewCase}
            onClick={() => {
              haptic.medium();
              navigate(createPageUrl("resolvecase") + "?mode=new");
            }}
            color="#C7A338"
            color="#C7A338"
          />

          <Button
            variant="ghost"
            onClick={() => {
              haptic.light();
              navigate(createPageUrl("dashboard"));
            }}
            className="mb-4"
            style={{ color: colors.textSecondary, minHeight: '44px' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {strings.back}
          </Button>

          {/* Resolve Success Banner */}
          {showResolveSuccessBanner && (
            <div 
              className="mb-6 p-4 rounded-xl border-2 animate-pulse"
              style={{
                backgroundColor: isDarkMode ? '#1E4435' : '#ECFDF5',
                borderColor: '#10B981'
              }}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-base mb-1" style={{ color: '#10B981' }}>
                    {language === 'th' ? '✅ ส่งคดีสำเร็จ!' :
                     language === 'ru' ? '✅ Дело отправлено!' :
                     language === 'zh' ? '✅ 案件已提交！' :
                     language === 'ja' ? '✅ ケースが送信されました！' :
                     language === 'ko' ? '✅ 사례가 제출되었습니다!' :
                     '✅ Case Submitted Successfully!'}
                  </h3>
                  <p className="text-sm" style={{ color: colors.textPrimary }}>
                    {language === 'th' ? 'ทีมของเราจะตรวจสอบเอกสารและติดต่อกลับภายใน 12-24 ชั่วโมง' :
                     language === 'ru' ? 'Наша команда рассмотрит документы и свяжется с вами в течение 12-24 часов' :
                     language === 'zh' ? '我们的团队将在12-24小时内审核您的文件并跟进' :
                     language === 'ja' ? '当チームは12〜24時間以内に書類を確認し、フォローアップします' :
                     language === 'ko' ? '저희 팀이 12-24시간 이내에 문서를 검토하고 연락드리겠습니다' :
                     'Our team will review your documents and follow up within 12-24 hours'}
                  </p>
                  <button
                    onClick={() => setShowResolveSuccessBanner(false)}
                    className="mt-2 text-xs font-semibold underline"
                    style={{ color: '#10B981' }}
                  >
                    {language === 'th' ? 'ปิด' :
                     language === 'ru' ? 'Закрыть' :
                     language === 'zh' ? '关闭' :
                     language === 'ja' ? '閉じる' :
                     language === 'ko' ? '닫기' :
                     'Dismiss'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2" style={{ color: theme.headerColor }}>
              <Scale className="w-7 h-7 md:w-8 md:h-8" style={{ color: FEATURE_COLORS.cases.accent }} />
              {strings.title}
            </h1>
            <p className="text-sm md:text-base" style={{ color: colors.textSecondary }}>
              {strings.subtitle}
            </p>
          </div>

          <Card className="mb-6 mt-6 border-none shadow-lg bg-gradient-to-br from-purple-600 to-blue-600">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start gap-3">
                <Crown className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">{strings.premiumBenefits}</h3>
                  <ul className="space-y-1 text-sm text-white/90">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{strings.memberRate}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{strings.priorityHandling}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resolve CTA Banner */}
          {(() => {
            // Resolve CTA for all users
            const eligibility = getMembershipEligibility(user);
            const showMemberRate = eligibility.isEligible;
            const displayPrice = showMemberRate ? RESOLVE_PRICING.MEMBER_RATE : RESOLVE_PRICING.PUBLIC_RATE;
            const rateLabel = showMemberRate ? 'member rate' : 'public rate';
            
            return (
              <div 
                className="mb-6 p-4 rounded-xl border-2"
                style={{
                  backgroundColor: isDarkMode ? '#2A1F1F' : '#FFFBEB',
                  borderColor: isDarkMode ? '#EF444450' : '#FDE047',
                  boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(239,68,68,0.08)'
                }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-base font-bold mb-1" style={{ color: colors.textPrimary }}>
                      {strings.needMoreHelp}
                    </h3>
                    <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                      {strings.openResolveDesc}
                    </p>
                    <p className="text-xs" style={{ color: colors.textSecondary, opacity: 0.9 }}>
                      {showMemberRate 
                        ? (language === 'th' ? 'ราคาสมาชิกใช้งานได้หลังสมาชิก 30 วัน การอัปเกรดระหว่างส่งคดีจะมีผลกับคดีในอนาคตเท่านั้น' : 
                           language === 'zh' ? '会员价在会员30天后生效。案件提交期间的升级仅适用于未来的案件。' :
                           language === 'ja' ? '会員価格は会員登録後30日で適用されます。ケース提出中のアップグレードは今後のケースにのみ適用されます。' :
                           language === 'ko' ? '회원 요금은 회원 가입 30일 후 적용됩니다. 사례 제출 중 업그레이드는 향후 사례에만 적용됩니다.' :
                           language === 'ru' ? 'Цены для членов действуют через 30 дней членства. Обновления во время подачи дела применяются только к будущим делам.' :
                           'Member rates apply after 30 days of active Lite, Protect or Secure membership. Upgrades during case submission apply to future cases only.')
                        : (language === 'th' ? 'ราคาสมาชิกใช้งานได้หลังสมาชิก Lite, Protect หรือ Secure ครบ 30 วัน' :
                           language === 'zh' ? '会员价在Lite、Protect或Secure会员30天后生效' :
                           language === 'ja' ? '会員価格はLite、Protect、Secureの会員登録後30日で適用' :
                           language === 'ko' ? '회원 요금은 Lite, Protect 또는 Secure 회원 30일 후 적용' :
                           language === 'ru' ? 'Цены для членов действуют через 30 дней активного членства Lite, Protect или Secure' :
                           'Member rates apply after 30 days of active Lite, Protect or Secure membership')
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => {
                     haptic.medium();
                     navigate(createPageUrl("resolvecase") + "?mode=new");
                    }}
                    className="btn-interaction w-full sm:w-auto"
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: '#EF4444',
                      border: '2px solid #EF4444',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#EF4444';
                      e.target.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#EF4444';
                    }}
                  >
                    {language === 'th' ? `ส่งคดี – ฿${displayPrice.toLocaleString()} ราคา${showMemberRate ? 'สมาชิก' : 'ทั่วไป'}` :
                     language === 'zh' ? `提交案件 – ฿${displayPrice.toLocaleString()} ${showMemberRate ? '会员' : '公开'}价格` :
                     language === 'ja' ? `ケース提出 – ฿${displayPrice.toLocaleString()} ${showMemberRate ? '会員' : '公開'}価格` :
                     language === 'ko' ? `사례 제출 – ฿${displayPrice.toLocaleString()} ${showMemberRate ? '회원' : '공개'} 요금` :
                     language === 'ru' ? `Подать дело – ฿${displayPrice.toLocaleString()} ${showMemberRate ? 'для членов' : 'публичная цена'}` :
                     `Submit Case – ฿${displayPrice.toLocaleString()} ${rateLabel}`}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Search & Filter Controls */}
          {visibleCases.length > 0 && (
            <div className="mb-6 space-y-3">
              <DebouncedSearch
                onSearch={setSearchQuery}
                placeholder={strings.searchCases}
                colors={colors}
                language={language}
              />
              
              <div>
                <Label className="text-xs font-semibold mb-2 block" style={{ color: colors.textSecondary }}>
                  {strings.filterByStatus}
                </Label>
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => {
                    haptic.light();
                    setStatusFilter(value);
                  }}
                >
                  <SelectTrigger style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: colors.cardBg }}>
                    <SelectItem value="all">{strings.allStatuses}</SelectItem>
                    <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
                    <SelectItem value="intake">Intake</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="ready_drafts">Ready Drafts</SelectItem>
                    <SelectItem value="client_review">Client Review</SelectItem>
                    <SelectItem value="awaiting_landlord">Awaiting Landlord</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {isLoading ? (
            <SkeletonLoader variant="card" count={3} colors={colors} />
          ) : visibleCases.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 sm:p-5" style={{ borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" }}>
              <h3 className="font-semibold text-sm sm:text-base mb-1">{strings.noCasesCreatedYet}</h3>
              <p className="text-xs sm:text-sm text-gray-700 mb-3">
                {strings.noCasesCreatedYetDesc}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    haptic.medium();
                    navigate(createPageUrl("resolvecase"));
                  }}
                  className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm"
                  style={{ backgroundColor: "#0C3B2E", color: "#FFFFFF" }}
                >
                  {strings.openNewCase}
                </button>
                {(!user?.plan_tier || user.plan_tier === 'free') && (
                  <button
                    type="button"
                    onClick={() => {
                     haptic.light();
                     navigate(createPageUrl("account") + '#plans');
                    }}
                    className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border"
                    style={{ borderColor: "#0C3B2E", color: "#0C3B2E", backgroundColor: "#FFFFFF" }}
                  >
                    {strings.upgradeForDisputeTools}
                  </button>
                )}
              </div>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textSecondary, opacity: 0.3 }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
                {strings.noResultsFound}
              </h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {strings.tryDifferentSearch}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCases.map((caseItem) => {
                const statusConfig = STATUS_CONFIG[caseItem.status] || STATUS_CONFIG.intake;
                const StatusIcon = statusConfig.icon;
                const availableLetters = getGeneratedLetters(caseItem);
                const hasLetters = availableLetters.length > 0;
                const isExpanded = expandedCase === caseItem.id;
                const hasEvidence = caseItem.evidence && caseItem.evidence.length > 0;

                const isHighlighted = highlightCaseId === caseItem.id;
                
                return (
                  <SwipeToDelete
                    key={caseItem.id}
                    deleteLabel={strings.delete}
                    colors={colors}
                  >
                    <Card
                      className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer"
                      style={{ 
                        background: isHighlighted ? (isDarkMode ? '#1E4435' : '#F0FDF4') : theme.background,
                        borderLeft: `4px solid ${isHighlighted ? '#10B981' : FEATURE_COLORS.cases.accent}`,
                        animation: isHighlighted ? 'pulse 2s ease-in-out 3' : 'none'
                      }}
                      onClick={() => {
                        haptic.light();
                        navigate(createPageUrl("casedetails") + `?caseId=${caseItem.id}`);
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Scale className="w-5 h-5 flex-shrink-0" style={{ color: FEATURE_COLORS.cases.accent }} />
                            <CardTitle className="text-xl font-bold" style={{ color: theme.headerColor }}>
                              {caseItem.case_number || `Case #${caseItem.id.slice(0, 8)}`}
                            </CardTitle>
                          </div>
                          <Badge className={`${statusConfig.color} border whitespace-nowrap`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-xs md:text-sm mt-2" style={{ color: colors.textSecondary }}>
                          {strings.opened} {format(new Date(caseItem.created_date), 'MMM d, yyyy')}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                            {strings.disputeAmount}
                          </p>
                          <p className="text-2xl font-bold" style={{ color: theme.metricColor }}>
                            ฿{caseItem.dispute_amount?.toLocaleString() || '0'}
                          </p>
                        </div>

                        {(caseItem.fast_track || caseItem.letter_pack || caseItem.is_member_at_creation) && (
                          <div>
                            <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                              {strings.features}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {caseItem.fast_track && (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                                  <Zap className="w-3 h-3 mr-1" />
                                  {strings.fastTrack}
                                </Badge>
                              )}
                              {caseItem.letter_pack && (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {strings.letterPack}
                                </Badge>
                              )}
                              {caseItem.is_member_at_creation && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  {strings.memberRateBadge}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {caseItem.summary && (
                          <p className="text-sm line-clamp-2" style={{ color: colors.textSecondary }}>
                            {caseItem.summary}
                          </p>
                        )}

                        {hasEvidence && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                              {language === 'th' ? 'หลักฐาน' : language === 'ru' ? 'Доказательства' : 'Evidence'} ({caseItem.evidence.length})
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                              {caseItem.evidence.slice(0, 4).map((evidence, idx) => (
                                <LazyImage
                                  key={idx}
                                  src={evidence.url}
                                  alt={evidence.label || `Evidence ${idx + 1}`}
                                  className="w-full h-16 object-cover rounded-lg border"
                                  style={{ borderColor: colors.borderColor }}
                                  loadingColor="#C7A338"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    haptic.light();
                                    window.open(evidence.url, '_blank');
                                  }}
                                  fallback={
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                                      <FileText className="w-6 h-6 text-gray-400" />
                                    </div>
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {hasLetters && (
                          <div className="border-t pt-3" style={{ borderColor: colors.borderColor }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedCase(isExpanded ? null : caseItem.id);
                              }}
                              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-opacity-80 transition-all"
                              style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" style={{ color: colors.textPrimary }} />
                                <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                  {strings.generatedLetters} ({availableLetters.length})
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" style={{ color: colors.textSecondary }} />
                              ) : (
                                <ChevronDown className="w-4 h-4" style={{ color: colors.textSecondary }} />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="mt-3 space-y-2">
                                {availableLetters.map((subject) => (
                                  <div
                                    key={subject}
                                    className="flex items-center justify-between p-3 rounded-lg"
                                    style={{
                                      backgroundColor: isDarkMode ? '#2A2D30' : '#FFFFFF',
                                      border: `1px solid ${colors.borderColor}`
                                    }}
                                  >
                                    <div className="flex-1 min-w-0 mr-3">
                                      <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                                        {getLetterTitle(subject)}
                                      </p>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePreviewHtml(caseItem, subject);
                                        }}
                                        className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all"
                                        style={{
                                          backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                                          color: colors.textPrimary,
                                          border: `1px solid ${colors.borderColor}`
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.backgroundColor = isDarkMode ? '#4A4D50' : '#EEF2FF';
                                          e.target.style.borderColor = '#6366F1';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F3F4F6';
                                          e.target.style.borderColor = colors.borderColor;
                                        }}
                                      >
                                        <Eye className="w-3 h-3" />
                                        {strings.preview}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadDocx(caseItem.letters[`${subject}_url`], subject);
                                        }}
                                        className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ls-cta-primary"
                                      >
                                        <Download className="w-3 h-3" />
                                        {strings.download}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <Button
                          variant="outline"
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(createPageUrl("casedetails") + `?caseId=${caseItem.id}`);
                          }}
                        >
                          {strings.viewDetails}
                        </Button>
                      </CardContent>
                    </Card>
                  </SwipeToDelete>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}

export default function CasesPage() {
  return (
    <ToastProvider>
      <CasesContent />
    </ToastProvider>
  );
}