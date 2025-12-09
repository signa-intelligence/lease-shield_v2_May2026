import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Shield, AlertCircle, FileX, Scale, Camera, Mail, AlertTriangle, Gavel, CheckCircle, ArrowLeft, Coins, CheckCircle2, Upload, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from "@/components/ui/select";
import { haptic } from "../components/shared/HapticFeedback";
import PageHeader from "../components/shared/PageHeader"; // Added import

const TEMPLATES = [
  {
    id: 'lease_negotiation',
    letterKey: 'N1',
    name: {
      en: 'Pre-Signing Lease Negotiation',
      th: 'จดหมายทบทวนสัญญาก่อนลงนาม',
      ja: '署名前リース交渉',
      zh: '签署前租约谈判',
      ko: '서명 전 임대 협상',
      ru: 'Переговоры до подписания аренды'
    },
    description: {
      en: 'Request clarification of concerning lease terms before signing',
      th: 'ขอชี้แจงข้อกำหนดที่น่ากังวลก่อนการลงนามสัญญา',
      ja: '署名前に懸念のあるリース条項の説明を求める',
      zh: '签署前要求澄清令人担忧的租约条款',
      ko: '서명 전에 우려되는 임대 조건에 대한 설명 요청',
      ru: 'Запрос разъяснений по вызывающим беспокойство условиям аренды до подписания'
    },
    icon: FileText,
    color: 'from-amber-400 to-orange-600',
    preSigning: true,
    creditCost: 1
  },
  {
    id: 'deposit',
    letterKey: 'L1',
    name: {
      en: 'Deposit Return Request',
      th: 'จดหมายขอคืนเงินมัดจำ',
      ja: '敷金返還請求',
      zh: '押金退还请求',
      ko: '보증금 반환 요청',
      ru: 'Запрос возврата депозита'
    },
    description: {
      en: 'Friendly formal request for security deposit return',
      th: 'จดหมายทางการสุภาพขอคืนเงินประกัน',
      ja: '友好的な正式な敷金返還請求',
      zh: '友好的正式保证金退还请求',
      ko: '우호적인 공식 보증금 반환 요청',
      ru: 'Дружественный официальный запрос на возврат залога'
    },
    icon: Shield,
    color: 'from-blue-400 to-blue-600',
    creditCost: 1
  },
  {
    id: 'deductions',
    letterKey: 'L2',
    name: {
      en: 'Request for Itemised Deductions',
      th: 'ขอรายละเอียดการหักเงิน',
      ja: '項目別控除要求',
      zh: '要求逐项扣除',
      ko: '항목별 공제 요청',
      ru: 'Запрос детализации вычетов'
    },
    description: {
      en: 'Request breakdown of damage charges and deductions',
      th: 'ขอรายละเอียดค่าเสียหายและการหักเงินแบบแยกรายการ',
      ja: '損害料金と控除の内訳を要求',
      zh: '要求损害费用和扣除的明细',
      ko: '손해 비용 및 공제 내역 요청',
      ru: 'Запрос детализации расходов на ущерб и вычетов'
    },
    icon: FileText,
    color: 'from-amber-400 to-amber-600',
    creditCost: 1
  },
  {
    id: 'reminder',
    letterKey: 'L3',
    name: {
      en: 'Friendly Reminder',
      th: 'จดหมายเตือนแบบมิตร',
      ja: '友好的なリマインダー',
      zh: '友好提醒',
      ko: '우호적 알림',
      ru: 'Дружеское напоминание'
    },
    description: {
      en: 'Gentle follow-up on pending deposit return',
      th: 'จดหมายติดตามความคืบหน้าอย่างสุภาพ',
      ja: '保留中の敷金返還に関する丁寧なフォローアップ',
      zh: '对待退还押金的温和跟进',
      ko: '대기 중인 보증금 반환에 대한 부드러운 후속 조치',
      ru: 'Мягкое напоминание о возврате залога'
    },
    icon: Mail,
    color: 'from-purple-400 to-purple-600',
    creditCost: 1
  },
  {
    id: 'dispute',
    letterKey: 'P1',
    name: {
      en: 'Formal Dispute of Withholding',
      th: 'จดหมายคัดค้านการระงับเงิน',
      ja: '差し止めに対する正式な異議申し立て',
      zh: '正式扣押争议',
      ko: '보류에 대한 공식 이의 제기',
      ru: 'Официальный спор об удержании'
    },
    description: {
      en: 'Formal dispute of unfair deposit withholding',
      th: 'จดหมายคัดค้านการระงับเงินประกันอย่างเป็นทางการ',
      ja: '不当な敷金差し止めに対する正式な異議',
      zh: '对不公平押金扣留的正式争议',
      ko: '부당한 보증금 보류에 대한 공식 이의 제기',
      ru: 'Официальный спор о несправедливом удержании депозита'
    },
    icon: Scale,
    color: 'from-emerald-500 to-emerald-700',
    creditCost: 1
  },
  {
    id: 'early_termination',
    letterKey: 'P2',
    name: {
      en: 'Early Termination Reconciliation',
      th: 'ประสานยุติสัญญาก่อนกำหนด',
      ja: '早期終了和解',
      zh: '提前终止调解',
      ko: '조기 해지 조정',
      ru: 'Согласование досрочного расторжения'
    },
    description: {
      en: 'Coordinate early lease termination details',
      th: 'ประสานรายละเอียดการยุติสัญญาก่อนกำหนด',
      ja: '早期リース終了の詳細を調整',
      zh: '协调提前租约终止的细节',
      ko: '조기 임대 종료 세부 사항 조정',
      ru: 'Согласование деталей досрочного прекращения аренды'
    },
    icon: FileX,
    color: 'from-teal-500 to-teal-700',
    creditCost: 1
  },
  {
    id: 'condition_dispute',
    letterKey: 'P3',
    name: {
      en: 'Property Condition Dispute',
      th: 'โต้แย้งสภาพทรัพย์สิน',
      ja: '物件状態の紛争',
      zh: '财产状况争议',
      ko: '부동산 상태 분쟁',
      ru: 'Спор о состоянии имущества'
    },
    description: {
      en: 'Dispute claimed property damages',
      th: 'โต้แย้งการเรียกร้องค่าเสียหายทรัพย์สิน',
      ja: '主張された物件損害に異議を唱える',
      zh: '对声称的财产损害提出异议',
      ko: '주장된 부동산 손해에 대한 이의 제기',
      ru: 'Оспаривание заявленного ущерба имуществу'
    },
    icon: Camera,
    color: 'from-cyan-500 to-cyan-700',
    creditCost: 1
  },
  {
    id: 'evidence',
    letterKey: 'P4',
    name: {
      en: 'Request for Evidence',
      th: 'ขอหลักฐานประกอบ',
      ja: '証拠提出要求',
      zh: '要求提供证据',
      ko: '증거 요청',
      ru: 'Запрос доказательств'
    },
    description: {
      en: 'Request supporting documents for claimed damages',
      th: 'ขอเอกสารหลักฐานสำหรับค่าเสียหายที่อ้าง',
      ja: '主張された損害の裏付け文書を要求',
      zh: '要求提供声称损害的支持文件',
      ko: '주장된 손해에 대한 증빙 서류 요청',
      ru: 'Запрос подтверждающих документов для заявленного ущерба'
    },
    icon: FileText,
    color: 'from-sky-500 to-sky-700',
    creditCost: 1
  },
  {
    id: 'final_opportunity',
    letterKey: 'S1',
    name: {
      en: 'Final Opportunity',
      th: 'โอกาสสุดท้าย',
      ja: '最終的な機会',
      zh: '最后机会',
      ko: '마지막 기회',
      ru: 'Последняя возможность'
    },
    description: {
      en: 'Last chance before formal escalation',
      th: 'โอกาสสุดท้ายก่อนดำเนินการทางกฎหมาย',
      ja: '正式なエスカレーション前の最後のチャンス',
      zh: '正式升级前的最后机会',
      ko: '공식적인 확대 전 마지막 기회',
      ru: 'Последний шанс перед официальной эскалацией'
    },
    icon: AlertTriangle,
    color: 'from-orange-600 to-red-600',
    creditCost: 1
  },
  {
    id: 'non_compliance',
    letterKey: 'S2',
    name: {
      en: 'Notice of Non-Compliance',
      th: 'แจ้งไม่ปฏิบัติตามสัญญา',
      ja: '不履行通知',
      zh: '违规通知',
      ko: '미준수 통지',
      ru: 'Уведомление о несоблюдении'
    },
    description: {
      en: 'Official notice of contract breach',
      th: 'แจ้งการฝ่าฝืนสัญญาอย่างเป็นทางการ',
      ja: '契約違反の公式通知',
      zh: '合同违约正式通知',
      ko: '계약 위반 공식 통지',
      ru: 'Официальное уведомление о нарушении договора'
    },
    icon: Gavel,
    color: 'from-red-600 to-red-800',
    creditCost: 1
  },
  {
    id: 'settlement',
    letterKey: 'S3',
    name: {
      en: 'Settlement Confirmation',
      th: 'ยืนยันการตกลงชำระเงิน',
      ja: '和解確認',
      zh: '和解确认',
      ko: '합의 확인',
      ru: 'Подтверждение урегулирования'
    },
    description: {
      en: 'Confirm successful deposit transfer',
      th: 'ยืนยันการคืนเงินประกันสำเร็จ',
      ja: '敷金返還の成功を確認',
      zh: '确认成功转账押金',
      ko: '성공적인 보증금 이체 확인',
      ru: 'Подтверждение успешного перевода депозита'
    },
    icon: CheckCircle,
    color: 'from-emerald-600 to-green-700',
    creditCost: 1
  }
];

export default function Templates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    category: 'friendly',
    title_en: '',
    title_th: '',
    description_en: '',
    description_th: '',
    credit_cost: 1,
    file: null
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: customTemplates = [] } = useQuery({
    queryKey: ['customTemplates'],
    queryFn: () => base44.entities.TemplateLibrary.filter({ is_active: true }),
    enabled: !!user,
    initialData: []
  });

  const { data: letterTemplates = [] } = useQuery({
    queryKey: ['letterTemplates'],
    queryFn: () => base44.entities.LetterTemplate.filter({ is_active: true }),
    enabled: !!user,
    initialData: []
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.TemplateLibrary.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customTemplates'] });
      setShowUploadDialog(false);
      setUploadFormData({
        category: 'friendly',
        title_en: '',
        title_th: '',
        description_en: '',
        description_th: '',
        credit_cost: 1,
        file: null
      });
    }
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const isAdmin = user?.role === 'admin' || ['admin', 'super_admin'].includes(user?.access_level);
  const userCredits = user?.letter_credits || 0;

  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#2A2D30',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    inputBg: '#374151',
    borderColor: 'rgba(255,255,255,0.1)'
  } : {
    bg: '#F3F6F5',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    inputBg: '#FFFFFF',
    borderColor: 'rgba(12,59,46,0.08)'
  };

  const t = {
    en: {
      title: "Letter Templates",
      subtitle: "Professional multi-language escalation ladder - all templates available",
      creditBalance: "Credit Balance",
      credits: "Credits",
      allLetters: "All Letters (11 Templates)",
      bilingualLetterTemplates: "Bilingual Letter Templates (EN/TH)",
      bilingualSubtitle: "Professional checklists and formal notices with merge field support",
      openInGenerator: "Open in Letter Generator",
      checklist: "Checklist",
      moveOut: "Move-Out",
      insufficientCredits: "Insufficient credits",
      upgradeForCredits: "Upgrade for more credits",
      preSigningSection: "⭐ Pre-Signing Negotiation",
      friendlyApproach: "Friendly Approach (3 Letters)",
      professionalEscalation: "Professional Escalation (4 Letters)",
      finalMeasures: "Final Measures (3 Letters)",
      oneLetterPerCredit: "1 letter = 1 credit",
      accessTemplateLibrary: "Access template library",
      bilingual: "Bilingual Templates",
      creditsNeverExpire: "Credits never expire",
      purchaseCredits: "Purchase Credits",
      uploadTemplate: "Upload Template",
      uploadTemplateTitle: "Upload New Letter Template",
      category: "Category",
      titleEnglish: "Title (English)",
      titleThai: "Title (Thai)",
      descriptionEnglish: "Description (English)",
      descriptionThai: "Description (Thai)",
      creditCost: "Credit Cost",
      selectFile: "Select Template File",
      uploading: "Uploading...",
      cancel: "Cancel",
      upload: "Upload",
      adminOnly: "Admin Only",
      back: "Back",
      fillAllFields: "Please fill in all fields and select a file",
      uploadSuccess: "Template uploaded successfully!",
      uploadFailed: "Upload failed. Please try again."
    },
    th: {
      title: "เทมเพลตจดหมาย",
      subtitle: "บันไดการยกระดับมืออาชีพสองภาษา - ทุกเทมเพลตพร้อมใช้งาน",
      creditBalance: "เครดิตคงเหลือ",
      credits: "เครดิต",
      allLetters: "จดหมายทั้งหมด (11 เทมเพลต)",
      bilingualLetterTemplates: "เทมเพลตจดหมายสองภาษา (อังกฤษ/ไทย)",
      bilingualSubtitle: "รายการตรวจสอบและจดหมายทางการพร้อมระบบรวมข้อมูล",
      openInGenerator: "เปิดในเครื่องมือสร้าง",
      checklist: "รายการตรวจสอบ",
      moveOut: "ย้ายออก",
      insufficientCredits: "เครดิตไม่เพียงพอ",
      upgradeForCredits: "อัปเกรดเพื่อรับเครดิตเพิ่ม",
      preSigningSection: "⭐ เจรจาก่อนลงนาม",
      friendlyApproach: "แนวทางเป็นมิตร (3 จดหมาย)",
      professionalEscalation: "การยกระดับอย่างมืออาชีพ (4 จดหมาย)",
      finalMeasures: "มาตรการสุดท้าย (3 จดหมาย)",
      oneLetterPerCredit: "1 จดหมาย = 1 เครดิต",
      accessTemplateLibrary: "เข้าถึงคลังเทมเพลต",
      bilingual: "เทมเพลตสองภาษา",
      creditsNeverExpire: "เครดิตไม่หมดอายุ",
      purchaseCredits: "ซื้อเครดิต",
      uploadTemplate: "อัปโหลดเทมเพลต",
      uploadTemplateTitle: "อัปโหลดเทมเพลตจดหมายใหม่",
      category: "หมวดหมู่",
      titleEnglish: "ชื่อ (อังกฤษ)",
      titleThai: "ชื่อ (ไทย)",
      descriptionEnglish: "คำอธิบาย (อังกฤษ)",
      descriptionThai: "คำอธิบาย (ไทย)",
      creditCost: "ต้นทุนเครดิต",
      selectFile: "เลือกไฟล์เทมเพลต",
      uploading: "กำลังอัปโหลด...",
      cancel: "ยกเลิก",
      upload: "อัปโหลด",
      adminOnly: "สำหรับแอดมินเท่านั้น",
      back: "กลับ",
      fillAllFields: "กรุณากรอกข้อมูลให้ครบถ้วนและเลือกไฟล์",
      uploadSuccess: "อัปโหลดเทมเพลตสำเร็จ!",
      uploadFailed: "อัปโหลดล้มเหลว กรุณาลองอีกครั้ง"
    },
    zh: {
      title: "法律信件模板",
      subtitle: "专业双语升级阶梯 - 所有模板可用",
      creditBalance: "信用余额",
      credits: "信用",
      allLetters: "所有信件（11个模板）",
      insufficientCredits: "信用不足",
      upgradeForCredits: "升级以获得更多信用",
      preSigningSection: "⭐ 签署前协商",
      friendlyApproach: "友好方式（3封信）",
      professionalEscalation: "专业升级（4封信）",
      finalMeasures: "最终措施（3封信）",
      oneLetterPerCredit: "1封信 = 1信用",
      accessTemplateLibrary: "访问模板库",
      bilingual: "双语模板",
      creditsNeverExpire: "信用永不过期",
      purchaseCredits: "购买信用",
      uploadTemplate: "上传模板",
      uploadTemplateTitle: "上传新信件模板",
      category: "类别",
      titleEnglish: "标题（英文）",
      titleThai: "标题（泰文）",
      descriptionEnglish: "描述（英文）",
      descriptionThai: "描述（泰文）",
      creditCost: "信用成本",
      selectFile: "选择模板文件",
      uploading: "上传中...",
      cancel: "取消",
      upload: "上传",
      adminOnly: "仅限管理员",
      back: "返回",
      fillAllFields: "请填写所有字段并选择文件",
      uploadSuccess: "模板上传成功！",
      uploadFailed: "上传失败。请重试。"
    },
    ja: {
      title: "法的レターテンプレート",
      subtitle: "プロフェッショナルなバイリンガルエスカレーションラダー - すべてのテンプレート利用可能",
      creditBalance: "クレジット残高",
      credits: "クレジット",
      allLetters: "すべてのレター（11テンプレート）",
      insufficientCredits: "クレジット不足",
      upgradeForCredits: "より多くのクレジットを得るためにアップグレード",
      preSigningSection: "⭐ 署名前交渉",
      friendlyApproach: "友好的アプローチ（3レター）",
      professionalEscalation: "プロフェッショナルエスカレーション（4レター）",
      finalMeasures: "最終手段（3レター）",
      oneLetterPerCredit: "1レター = 1クレジット",
      accessTemplateLibrary: "テンプレートライブラリにアクセス",
      bilingual: "バイリンガルテンプレート",
      creditsNeverExpire: "クレジットは期限切れになりません",
      purchaseCredits: "クレジット購入",
      uploadTemplate: "テンプレートアップロード",
      uploadTemplateTitle: "新しいレターテンプレートをアップロード",
      category: "カテゴリ",
      titleEnglish: "タイトル（英語）",
      titleThai: "タイトル（タイ語）",
      descriptionEnglish: "説明（英語）",
      descriptionThai: "説明（タイ語）",
      creditCost: "クレジットコスト",
      selectFile: "テンプレートファイルを選択",
      uploading: "アップロード中...",
      cancel: "キャンセル",
      upload: "アップロード",
      adminOnly: "管理者のみ",
      back: "戻る",
      fillAllFields: "すべてのフィールドに入力してファイルを選択してください",
      uploadSuccess: "テンプレートが正常にアップロードされました！",
      uploadFailed: "アップロードに失敗しました。もう一度お試しください。"
    },
    ko: {
      title: "법적 편지 템플릿",
      subtitle: "전문적인 이중 언어 확대 사다리 - 모든 템플릿 사용 가능",
      creditBalance: "크레딧 잔액",
      credits: "크레딧",
      allLetters: "모든 편지 (11개 템플릿)",
      insufficientCredits: "크레딧 부족",
      upgradeForCredits: "더 많은 크레딧을 위해 업그레이드",
      preSigningSection: "⭐ 서명 전 협상",
      friendlyApproach: "우호적 접근 (3개 편지)",
      professionalEscalation: "전문적 확대 (4개 편지)",
      finalMeasures: "최종 조치 (3개 편지)",
      oneLetterPerCredit: "1개 편지 = 1 크레딧",
      accessTemplateLibrary: "템플릿 라이브러리 액세스",
      bilingual: "이중 언어 템플릿",
      creditsNeverExpire: "크레딧은 만료되지 않습니다",
      purchaseCredits: "크레딧 구매",
      uploadTemplate: "템플릿 업로드",
      uploadTemplateTitle: "새 편지 템플릿 업로드",
      category: "카테고리",
      titleEnglish: "제목 (영어)",
      titleThai: "제목 (태국어)",
      descriptionEnglish: "설명 (영어)",
      descriptionThai: "설명 (태국어)",
      creditCost: "크레딧 비용",
      selectFile: "템플릿 파일 선택",
      uploading: "업로드 중...",
      cancel: "취소",
      upload: "업로드",
      adminOnly: "관리자 전용",
      back: "뒤로",
      fillAllFields: "모든 필드를 입력하고 파일을 선택하세요",
      uploadSuccess: "템플릿이 성공적으로 업로드되었습니다！",
      uploadFailed: "업로드 실패. 다시 시도하세요."
    },
    ru: {
      title: "Шаблоны писем",
      subtitle: "Профессиональная двуязычная лестница эскалации – все шаблоны доступны",
      creditBalance: "Баланс кредитов",
      credits: "Кредиты",
      allLetters: "Все письма (11 шаблонов)",
      insufficientCredits: "Недостаточно кредитов",
      upgradeForCredits: "Обновитесь для получения дополнительных кредитов",
      preSigningSection: "⭐ Переговоры до подписания",
      friendlyApproach: "Дружественный подход (3 письма)",
      professionalEscalation: "Профессиональная эскалация (4 письма)",
      finalMeasures: "Финальные меры (3 письма)",
      general_concerns: "Общие проблемы",
      oneLetterPerCredit: "1 письмо = 1 кредит",
      accessTemplateLibrary: "Доступ к библиотеке шаблонов",
      bilingual: "Многоязычные шаблоны",
      creditsNeverExpire: "Кредиты не истекают",
      purchaseCredits: "Купить кредиты",
      uploadTemplate: "Загрузить шаблон",
      uploadTemplateTitle: "Загрузить новый шаблон письма",
      category: "Категория",
      titleEnglish: "Название (английский)",
      titleThai: "Название (тайский)",
      descriptionEnglish: "Описание (английский)",
      descriptionThai: "Описание (тайский)",
      creditCost: "Стоимость в кредитах",
      selectFile: "Выберите файл шаблона",
      uploading: "Загрузка...",
      cancel: "Отмена",
      upload: "Загрузить",
      adminOnly: "Только для админа",
      back: "Назад",
      fillAllFields: "Пожалуйста, заполните все поля и выберите файл",
      uploadSuccess: "Шаблон успешно загружен!",
      uploadFailed: "Загрузка не удалась. Попробуйте снова."
    }
  };

  const strings = t[language] || t.en;

  const categoryOptions = {
    en: {
      pre_signing: 'Pre-Signing Negotiation',
      friendly: 'Friendly Approach',
      professional: 'Professional Escalation',
      final: 'Final Measures'
    },
    th: {
      pre_signing: 'เจรจาก่อนลงนาม',
      friendly: 'แนวทางเป็นมิตร',
      professional: 'การยกระดับอย่างมืออาชีพ',
      final: 'มาตรการสุดท้าย'
    },
    zh: {
      pre_signing: '签署前协商',
      friendly: '友好方式',
      professional: '专业升级',
      final: '最终措施'
    },
    ja: {
      pre_signing: '署名前交渉',
      friendly: '友好的アプローチ',
      professional: 'プロフェッショナルエスカレーション',
      final: '最終手段'
    },
    ko: {
      pre_signing: '서명 전 협상',
      friendly: '우호적 접근',
      professional: '전문적 확대',
      final: '최종 조치'
    },
    ru: {
      pre_signing: 'Переговоры до подписания',
      friendly: 'Дружественный подход',
      professional: 'Профессиональная эскалация',
      final: 'Финальные меры'
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFormData({ ...uploadFormData, file });
    }
  };

  const handleTemplateClick = (template) => {
    haptic.medium();
    
    // For built-in templates, check credits and navigate to form
    if (template.id) {
      if (userCredits >= template.creditCost) {
        navigate(createPageUrl("TemplateForm") + `?subject=${template.id}`);
      } else {
        haptic.error();
      }
    } else {
      // For custom uploaded templates, open the file directly
      if (userCredits >= template.credit_cost) {
        window.open(template.file_url, '_blank');
      } else {
        haptic.error();
      }
    }
  };

  const handleUploadTemplate = async () => {
    if (!uploadFormData.file || !uploadFormData.title_en || !uploadFormData.title_th) {
      alert(strings.fillAllFields);
      return;
    }

    haptic.medium();
    setUploadingFile(true);
    try {
      // Upload file first
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadFormData.file });

      // Create template record
      await createTemplateMutation.mutateAsync({
        category: uploadFormData.category,
        title_en: uploadFormData.title_en,
        title_th: uploadFormData.title_th,
        description_en: uploadFormData.description_en,
        description_th: uploadFormData.description_th,
        credit_cost: uploadFormData.credit_cost,
        file_url: file_url,
        is_active: true
      });

      haptic.success();
      alert(strings.uploadSuccess);
    } catch (error) {
      console.error('Upload failed:', error);
      haptic.error();
      alert(strings.uploadFailed);
    } finally {
      setUploadingFile(false);
    }
  };

  const renderTemplateCard = (template, isCustom = false) => {
    const Icon = isCustom ? FileText : template.icon;
    const hasEnoughCredits = userCredits >= (isCustom ? template.credit_cost : template.creditCost);
    const color = isCustom ? 'from-blue-500 to-blue-700' : template.color;

    return (
      <Card
        key={isCustom ? template.id : template.id}
        className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 ${hasEnoughCredits ? 'cursor-pointer' : 'opacity-75'}`}
        style={{ backgroundColor: colors.cardBg }}
        onClick={() => handleTemplateClick(template)}
      >
        <div className={`h-2 bg-gradient-to-r ${color} rounded-t-xl`} />
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
              <Coins className="w-3 h-3" />
              {isCustom ? template.credit_cost : template.creditCost}
            </Badge>
          </div>

          <h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
            {isCustom 
              ? (language === 'th' ? template.title_th : template.title_en)
              : (template.name?.[language] || template.name?.en || template.name_en)
            }
          </h3>

          <p className="text-xs sm:text-sm mb-4" style={{ color: colors.textSecondary }}>
            {isCustom
              ? (language === 'th' ? template.description_th : template.description_en)
              : (template.description?.[language] || template.description?.en || template.description_en)
            }
          </p>

          {!hasEnoughCredits && (
            <div className="text-xs text-center p-2 rounded-lg" style={{
              backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2',
              color: '#DC2626'
            }}>
              {strings.insufficientCredits}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        
        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-2xl" style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.borderColor
          }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>
                {strings.uploadTemplateTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label style={{ color: colors.textPrimary }}>{strings.category}</Label>
                <Select value={uploadFormData.category} onValueChange={(val) => setUploadFormData({...uploadFormData, category: val})}>
                  <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: colors.cardBg }}>
                    <SelectItem value="pre_signing">{categoryOptions[language].pre_signing}</SelectItem>
                    <SelectItem value="friendly">{categoryOptions[language].friendly}</SelectItem>
                    <SelectItem value="professional">{categoryOptions[language].professional}</SelectItem>
                    <SelectItem value="final">{categoryOptions[language].final}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{ color: colors.textPrimary }}>{strings.titleEnglish}</Label>
                  <Input
                    value={uploadFormData.title_en}
                    onChange={(e) => setUploadFormData({...uploadFormData, title_en: e.target.value})}
                    className="mt-2"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                  />
                </div>
                <div>
                  <Label style={{ color: colors.textPrimary }}>{strings.titleThai}</Label>
                  <Input
                    value={uploadFormData.title_th}
                    onChange={(e) => setUploadFormData({...uploadFormData, title_th: e.target.value})}
                    className="mt-2"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                  />
                </div>
              </div>

              <div>
                <Label style={{ color: colors.textPrimary }}>{strings.descriptionEnglish}</Label>
                <Textarea
                  value={uploadFormData.description_en}
                  onChange={(e) => setUploadFormData({...uploadFormData, description_en: e.target.value})}
                  className="mt-2"
                  rows={2}
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
              </div>

              <div>
                <Label style={{ color: colors.textPrimary }}>{strings.descriptionThai}</Label>
                <Textarea
                  value={uploadFormData.description_th}
                  onChange={(e) => setUploadFormData({...uploadFormData, description_th: e.target.value})}
                  className="mt-2"
                  rows={2}
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
              </div>

              <div>
                <Label style={{ color: colors.textPrimary }}>{strings.creditCost}</Label>
                <Input
                  type="number"
                  min="1"
                  value={uploadFormData.credit_cost}
                  onChange={(e) => setUploadFormData({...uploadFormData, credit_cost: parseInt(e.target.value) || 1})}
                  className="mt-2"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
              </div>

              <div>
                <Label style={{ color: colors.textPrimary }}>{strings.selectFile}</Label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="mt-2 w-full"
                  accept=".pdf,.doc,.docx"
                  style={{ color: colors.textPrimary }}
                />
                {uploadFormData.file && (
                  <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                    {uploadFormData.file.name}
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadDialog(false)}
                  disabled={uploadingFile}
                >
                  {strings.cancel}
                </Button>
                <Button
                  onClick={handleUploadTemplate}
                  disabled={uploadingFile}
                  className="bg-ls-forest hover:bg-ls-forest/90"
                >
                  {uploadingFile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {strings.uploading}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {strings.upload}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <PageHeader
          title={strings.title}
          subtitle={strings.subtitle}
          icon={FileText}
          iconColor="#0C3B2E"
          showBack={true}
          backLabel={strings.back}
          colors={colors}
          actions={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs sm:text-sm w-fit">
                {strings.allLetters}
              </Badge>
              
              {isAdmin && (
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  className="bg-ls-forest hover:bg-ls-forest/90"
                  size="sm"
                  style={{ height: '36px' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {strings.uploadTemplate}
                </Button>
              )}
            </div>
          }
        />

        {/* Credit Balance Card */}
        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                    {strings.creditBalance}
                  </p>
                  <p className="text-4xl font-bold" style={{ color: '#C7A338' }}>
                    {userCredits}
                  </p>
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    {strings.oneLetterPerCredit}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {strings.accessTemplateLibrary}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {strings.bilingual}
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {strings.creditsNeverExpire}
                  </Badge>
                </div>
                <Button
                  onClick={() => navigate(createPageUrl("Account") + '#letter-credits')}
                  className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 w-full md:w-auto"
                  style={{ height: '40px' }}
                >
                  <Coins className="w-4 h-4 mr-2" />
                  {strings.purchaseCredits}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BILINGUAL LETTER TEMPLATES SECTION */}
        {letterTemplates.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 flex-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded"></div>
              <h2 className="text-lg sm:text-xl font-bold" style={{ color: colors.textPrimary }}>
                {strings.bilingualLetterTemplates}
              </h2>
              <div className="h-1 flex-1 bg-gradient-to-l from-blue-400 to-blue-600 rounded"></div>
            </div>
            <p className="text-sm mb-6 text-center" style={{ color: colors.textSecondary }}>
              {strings.bilingualSubtitle}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {letterTemplates.map((template) => {
                const categoryColorMap = {
                  'Checklist': 'from-blue-400 to-blue-600',
                  'Pre-Lease': 'from-amber-400 to-orange-600',
                  'Move-Out': 'from-purple-400 to-purple-600',
                  'Friendly': 'from-purple-400 to-purple-600',
                  'Formal': 'from-emerald-500 to-emerald-700',
                  'Final': 'from-orange-600 to-red-600'
                };
                const categoryColor = categoryColorMap[template.category] || 'from-blue-500 to-blue-700';

                return (
                  <Card
                    key={template.id}
                    className="border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                    style={{ backgroundColor: colors.cardBg }}
                    onClick={() => {
                      haptic.light();
                      navigate(createPageUrl("LetterGenerator") + `?id=${template.template_id}`);
                    }}
                  >
                    <div className={`h-2 bg-gradient-to-r ${categoryColor} rounded-t-xl`} />
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColor} flex items-center justify-center`}>
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                          {template.category}
                        </Badge>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
                        {language === 'th' ? template.title_th : template.title_en}
                      </h3>
                      <p className="text-xs sm:text-sm mb-4" style={{ color: colors.textSecondary }}>
                        {language === 'th' ? template.title_en : template.title_th}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* PRE-SIGNING SECTION */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-amber-400 to-orange-600 rounded"></div>
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: colors.textPrimary }}>
              {strings.preSigningSection}
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-l from-amber-400 to-orange-600 rounded"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...TEMPLATES.filter(tmpl => tmpl.preSigning), ...(customTemplates || []).filter(tmpl => tmpl.category === 'pre_signing')].map((template) => renderTemplateCard(template, !template.id))}
          </div>
        </div>

        {/* FRIENDLY APPROACH SECTION */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-blue-400 to-purple-600 rounded"></div>
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: colors.textPrimary }}>
              {strings.friendlyApproach}
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-l from-blue-400 to-purple-600 rounded"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...TEMPLATES.filter(tmpl => ['deposit', 'deductions', 'reminder'].includes(tmpl.id)), ...(customTemplates || []).filter(tmpl => tmpl.category === 'friendly')].map((template) => renderTemplateCard(template, !template.id))}
          </div>
        </div>

        {/* PROFESSIONAL ESCALATION SECTION */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded"></div>
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: colors.textPrimary }}>
              {strings.professionalEscalation}
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-l from-emerald-500 to-cyan-600 rounded"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...TEMPLATES.filter(tmpl => ['dispute', 'early_termination', 'condition_dispute', 'evidence'].includes(tmpl.id)), ...(customTemplates || []).filter(tmpl => tmpl.category === 'professional')].map((template) => renderTemplateCard(template, !template.id))}
          </div>
        </div>

        {/* FINAL MEASURES SECTION */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-orange-600 to-red-700 rounded"></div>
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: colors.textPrimary }}>
              {strings.finalMeasures}
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-l from-orange-600 to-red-700 rounded"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {secureTemplates.map((template) => renderTemplateCard(template, !template.id))}
          </div>
        </div>
      </div>
    </div>
  );
}