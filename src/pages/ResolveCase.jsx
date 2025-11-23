import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, AlertCircle, Loader2, CheckCircle2, Upload, X, Crown, TrendingDown, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RESOLVE_PRICING, hasMemberPricing } from "../components/shared/resolvePricing";
import { ToastProvider, useToast } from "../components/shared/Toast";

function ResolveCaseContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    type: 'deposit',
    dispute_amount: '',
    summary: '',
    landlord_name: '',
    landlord_email: '',
    property_address: '',
    deposit_amount: '',
    evidence_files: []
  });
  const [uploading, setUploading] = useState(false);
  const [autoFilledFromDeposit, setAutoFilledFromDeposit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  // Auto-fill from deposit if coming from deposit tracker
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const depositIdParam = urlParams.get('depositId');
    
    if (depositIdParam && deposits.length > 0) {
      const deposit = deposits.find(d => d.id === depositIdParam);
      if (deposit) {
        setFormData(prev => ({
          ...prev,
          type: 'deposit',
          dispute_amount: deposit.deposit_amount?.toString() || '',
          property_address: deposit.property_address || '',
          summary: language === 'th'
            ? `เงินมัดจำ ฿${deposit.deposit_amount?.toLocaleString()} ยังไม่ได้รับคืน`
            : language === 'ru'
            ? `Депозит ฿${deposit.deposit_amount?.toLocaleString()} не возвращён`
            : `Security deposit of ฿${deposit.deposit_amount?.toLocaleString()} not returned`,
          landlord_name: user?.landlord_name || '',
          landlord_email: user?.landlord_email || ''
        }));
        setAutoFilledFromDeposit(true);
      }
    }
  }, [deposits, user, language]);

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
    textSecondary: '#6B7280',
    borderColor: '#E5E7EB',
    inputBg: '#FFFFFF'
  };

  const createCaseMutation = useMutation({
    mutationFn: async (caseData) => {
      return await base44.entities.Case.create(caseData);
    },
    onSuccess: async (newCase) => {
      console.log('[RESOLVE_FLOW] Case created:', {
        id: newCase.id,
        status: newCase.status,
        user_email: newCase.user_email,
        dispute_amount: newCase.dispute_amount
      });
      
      // Get pricing for this user
      const pricing = {
        effectivePrice: newCase.is_member_at_creation ? RESOLVE_PRICING.MEMBER_RATE : RESOLVE_PRICING.PUBLIC_RATE,
        priceType: newCase.is_member_at_creation ? 'member' : 'public'
      };
      
      // Create Stripe checkout session
      try {
        const response = await base44.functions.invoke('createResolveCheckout', {
          userId: user.id,
          userEmail: user.email,
          caseId: newCase.id,
          priceType: pricing.priceType,
          amount: pricing.effectivePrice
        });
        
        if (response.data?.url) {
          console.log('[RESOLVE_PAGE] Redirecting to Stripe checkout');
          window.location.href = response.data.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } catch (error) {
        console.error('[RESOLVE_PAGE] Failed to create checkout:', error);
        toast.error(language === 'th' ? 'ไม่สามารถเริ่มการชำระเงินได้' : language === 'ru' ? 'Ошибка инициализации оплаты' : 'Failed to initiate payment');
        setSubmitting(false);
      }
    },
    onError: (error) => {
      console.error('[RESOLVE_PAGE] Case creation failed:', error);
      toast.error(language === 'th' ? 'ไม่สามารถสร้างคดีได้' : language === 'ru' ? 'Ошибка создания дела' : 'Failed to create case');
      setSubmitting(false);
    }
  });

  const handleFileUpload = async (files) => {
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file =>
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      
      const newFiles = results.map((result, idx) => ({
        id: Date.now() + idx,
        url: result.file_url,
        type: 'photo',
        label: files[idx].name,
        uploaded_date: new Date().toISOString()
      }));
      
      setFormData(prev => ({
        ...prev,
        evidence_files: [...prev.evidence_files, ...newFiles]
      }));
    } catch (error) {
      console.error('Upload failed:', error);
      alert(language === 'th' ? 'ไม่สามารถอัปโหลดไฟล์ได้' : language === 'ru' ? 'Ошибка загрузки файлов' : 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (fileId) => {
    setFormData(prev => ({
      ...prev,
      evidence_files: prev.evidence_files.filter(f => f.id !== fileId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.type || !formData.dispute_amount || !formData.summary) {
      toast.error(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : language === 'ru' ? 'Пожалуйста, заполните все обязательные поля' : 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    
    try {
      // Create case with all details
      const caseData = {
        user_email: user.email,
        type: formData.type,
        dispute_amount: parseFloat(formData.dispute_amount),
        summary: formData.summary,
        landlord_name: formData.landlord_name || user?.landlord_name || '',
        landlord_email: formData.landlord_email || user?.landlord_email || '',
        property_address: formData.property_address || '',
        evidence: formData.evidence_files,
        status: 'awaiting_payment',
        is_member_at_creation: hasMemberPricing(user),
        timeline: [
          {
            timestamp: new Date().toISOString(),
            event: 'Case details submitted - awaiting payment',
            actor: user.email
          }
        ]
      };

      console.log('[RESOLVE_FLOW] Case created on form submit - creating in DB...');
      console.log('[RESOLVE_FLOW] Case data:', {
        user_email: caseData.user_email,
        type: caseData.type,
        status: caseData.status,
        dispute_amount: caseData.dispute_amount
      });
      createCaseMutation.mutate(caseData);
    } catch (error) {
      console.error('[RESOLVE_PAGE] Submit failed:', error);
      toast.error(language === 'th' ? 'ไม่สามารถส่งคดีได้' : language === 'ru' ? 'Не удалось отправить дело' : 'Failed to submit case');
      setSubmitting(false);
    }
  };

  const strings = {
    en: {
      title: "Open a Case",
      subtitle: "Get help resolving your rental dispute",
      autoFilled: "Auto-filled from overdue deposit",
      caseType: "Case Type",
      depositCase: "Deposit Not Returned",
      earlyTermCase: "Early Termination Issue",
      damagesCase: "Damages Dispute",
      otherCase: "Other Issue",
      disputeAmount: "Amount in Dispute",
      disputePlaceholder: "10000",
      propertAddress: "Property Address",
      addressPlaceholder: "123 Main St, Bangkok",
      summary: "Case Summary",
      summaryPlaceholder: "Describe your situation in detail...",
      landlordInfo: "Landlord Information",
      landlordName: "Landlord Name",
      landlordEmail: "Landlord Email",
      evidence: "Supporting Evidence",
      evidenceDesc: "Upload photos, receipts, or documents",
      uploadFiles: "Upload Files",
      uploading: "Uploading...",
      removeFile: "Remove",
      submit: "Submit Case",
      creating: "Creating case...",
      submitting: "Submitting & proceeding to payment...",
      required: "Required",
      optional: "Optional",
      caseDetails: "Case Details",
      autoFilledMsg: "Deposit data has been pre-filled. You can edit as needed.",
      resolveService: "Resolve Your Dispute",
      resolvePricing: "Service Pricing",
      memberPrice: "Member Price",
      publicPrice: "Public Price",
      perCase: "per case",
      savingsNote: "Save ฿{amount} vs public rate",
      upgradeToMemberRate: "Members pay ฿{memberPrice} per case. Upgrade your plan to unlock the member rate.",
      whatsIncluded: "What's Included:",
      reviewDocs: "Professional review of your documents",
      recommendActions: "Recommended action plan & strategy",
      templateLetters: "Customized legal template letters",
      memberSince: "Member since",
      memberPricingUnlocked: "member pricing unlocked",
      memberPricingUnlocksIn: "Member pricing unlocks after 30 days of active membership. Your member rate will apply to cases submitted after",
      membersPayAfter30Days: "Members pay ฿2,490 per case after 30 days. You can join today for additional benefits.",
      newMembershipNote: "Your new membership will apply member rates to future cases. This case is billed at the public rate.",
      memberRateExplanation: "Member rates apply after 30 days of active Lite, Protect or Secure membership. Upgrades during case submission apply to future cases only."
    },
    th: {
      title: "เปิดคดี",
      subtitle: "รับความช่วยเหลือในการแก้ไขข้อพิพาทเช่า",
      autoFilled: "กรอกอัตโนมัติจากเงินมัดจำที่เกินกำหนด",
      caseType: "ประเภทคดี",
      depositCase: "เงินมัดจำยังไม่ได้คืน",
      earlyTermCase: "ปัญหาการยกเลิกสัญญาก่อนกำหนด",
      damagesCase: "ข้อพิพาทความเสียหาย",
      otherCase: "ปัญหาอื่นๆ",
      disputeAmount: "จำนวนเงินที่พิพาท",
      disputePlaceholder: "10000",
      propertAddress: "ที่อยู่ทรัพย์สิน",
      addressPlaceholder: "123 ถ.สุขุมวิท กรุงเทพฯ",
      summary: "สรุปคดี",
      summaryPlaceholder: "อธิบายสถานการณ์ของคุณอย่างละเอียด...",
      landlordInfo: "ข้อมูลเจ้าของบ้าน",
      landlordName: "ชื่อเจ้าของบ้าน",
      landlordEmail: "อีเมลเจ้าของบ้าน",
      evidence: "หลักฐานประกอบ",
      evidenceDesc: "อัปโหลดรูปภาพ ใบเสร็จ หรือเอกสาร",
      uploadFiles: "อัปโหลดไฟล์",
      uploading: "กำลังอัปโหลด...",
      removeFile: "ลบ",
      submit: "ส่งคดี",
      creating: "กำลังสร้างคดี...",
      submitting: "กำลังส่งและไปชำระเงิน...",
      required: "จำเป็น",
      optional: "ไม่บังคับ",
      caseDetails: "รายละเอียดคดี",
      autoFilledMsg: "ข้อมูลเงินมัดจำได้ถูกกรอกให้อัตโนมัติ คุณสามารถแก้ไขได้",
      resolveService: "แก้ไขข้อพิพาทของคุณ",
      resolvePricing: "ราคาบริการ",
      memberPrice: "ราคาสมาชิก",
      publicPrice: "ราคาทั่วไป",
      perCase: "ต่อคดี",
      savingsNote: "ประหยัด ฿{amount} เมื่อเทียบกับราคาทั่วไป",
      upgradeToMemberRate: "สมาชิกจ่าย ฿{memberPrice} ต่อคดี อัปเกรดแผนของคุณเพื่อปลดล็อกราคาสมาชิก",
      whatsIncluded: "รวมถึง:",
      reviewDocs: "ตรวจสอบเอกสารโดยผู้เชี่ยวชาญ",
      recommendActions: "แผนปฏิบัติการและกลยุทธ์ที่แนะนำ",
      templateLetters: "จดหมายตัวอย่างกฎหมายที่ปรับแต่ง",
      memberSince: "สมาชิกตั้งแต่",
      memberPricingUnlocked: "ปลดล็อกราคาสมาชิกแล้ว",
      memberPricingUnlocksIn: "ราคาสมาชิกจะปลดล็อกหลังจากสมาชิกครบ 30 วัน ราคาสมาชิกจะใช้กับคดีที่ส่งหลังวันที่",
      membersPayAfter30Days: "สมาชิกจ่าย ฿2,490 ต่อคดีหลังครบ 30 วัน คุณสามารถเข้าร่วมวันนี้เพื่อรับสิทธิพิเศษเพิ่มเติม",
      newMembershipNote: "การเป็นสมาชิกใหม่ของคุณจะใช้ราคาสมาชิกกับคดีในอนาคต คดีนี้จะคิดราคาทั่วไป",
      memberRateExplanation: "ราคาสมาชิกใช้งานได้หลังสมาชิก Lite, Protect หรือ Secure ครบ 30 วัน การอัปเกรดระหว่างส่งคดีจะมีผลกับคดีในอนาคตเท่านั้น"
    },
    zh: {
      title: "开启案件",
      subtitle: "获得解决租赁纠纷的帮助",
      autoFilled: "从逾期押金自动填充",
      caseType: "案件类型",
      depositCase: "押金未退还",
      earlyTermCase: "提前终止问题",
      damagesCase: "损害纠纷",
      otherCase: "其他问题",
      disputeAmount: "争议金额",
      disputePlaceholder: "10000",
      propertAddress: "物业地址",
      addressPlaceholder: "123 Main St, Bangkok",
      summary: "案件摘要",
      summaryPlaceholder: "详细描述您的情况...",
      landlordInfo: "房东信息",
      landlordName: "房东姓名",
      landlordEmail: "房东电子邮件",
      evidence: "支持证据",
      evidenceDesc: "上传照片、收据或文件",
      uploadFiles: "上传文件",
      uploading: "上传中...",
      removeFile: "移除",
      submit: "提交案件",
      creating: "创建案件中...",
      submitting: "提交并进入支付...",
      required: "必填",
      optional: "可选",
      caseDetails: "案件详情",
      autoFilledMsg: "押金数据已预填。您可以根据需要进行编辑。",
      resolveService: "解决您的纠纷",
      resolvePricing: "服务定价",
      memberPrice: "会员价格",
      publicPrice: "公开价格",
      perCase: "每案",
      savingsNote: "比公开价节省฿{amount}",
      upgradeToMemberRate: "会员每案支付฿{memberPrice}。升级您的计划以解锁会员价格。",
      whatsIncluded: "包含内容：",
      reviewDocs: "专业文档审查",
      recommendActions: "推荐行动计划和策略",
      templateLetters: "定制法律模板信函",
      memberSince: "会员始于",
      memberPricingUnlocked: "会员定价已解锁",
      memberPricingUnlocksIn: "会员定价在活跃会员30天后解锁。您的会员价格将适用于之后提交的案件",
      membersPayAfter30Days: "会员30天后每案支付฿2,490。您可以今天加入以获得更多福利。",
      newMembershipNote: "您的新会员资格将对未来案件适用会员价格。此案件按公开价格计费。",
      memberRateExplanation: "会员价格在Lite、Protect或Secure会员30天后生效。案件提交期间的升级仅适用于未来的案件。"
    },
    ja: {
      title: "ケースを開く",
      subtitle: "賃貸紛争の解決を支援します",
      autoFilled: "期限超過の敷金から自動入力",
      caseType: "ケースタイプ",
      depositCase: "敷金が返還されていない",
      earlyTermCase: "早期終了問題",
      damagesCase: "損害紛争",
      otherCase: "その他の問題",
      disputeAmount: "紛争金額",
      disputePlaceholder: "10000",
      propertAddress: "物件住所",
      addressPlaceholder: "123 Main St, Bangkok",
      summary: "ケース概要",
      summaryPlaceholder: "状況を詳しく説明してください...",
      landlordInfo: "家主情報",
      landlordName: "家主名",
      landlordEmail: "家主メール",
      evidence: "裏付け証拠",
      evidenceDesc: "写真、領収書、または書類をアップロード",
      uploadFiles: "ファイルをアップロード",
      uploading: "アップロード中...",
      removeFile: "削除",
      submit: "ケースを送信",
      creating: "ケース作成中...",
      submitting: "提出して支払いへ...",
      required: "必須",
      optional: "オプション",
      caseDetails: "ケース詳細",
      autoFilledMsg: "敷金データが事前入力されました。必要に応じて編集できます。",
      resolveService: "紛争を解決する",
      resolvePricing: "サービス価格",
      memberPrice: "会員価格",
      publicPrice: "公開価格",
      perCase: "ケースごと",
      savingsNote: "公開価格より฿{amount}お得",
      upgradeToMemberRate: "会員はケースごとに฿{memberPrice}を支払います。プランをアップグレードして会員価格を解除してください。",
      whatsIncluded: "含まれるもの：",
      reviewDocs: "プロフェッショナルな書類審査",
      recommendActions: "推奨される行動計画と戦略",
      templateLetters: "カスタマイズされた法的テンプレートレター",
      memberSince: "会員登録日",
      memberPricingUnlocked: "会員価格が解除されました",
      memberPricingUnlocksIn: "会員価格は30日のアクティブな会員資格後に解除されます。会員価格は次の日以降に提出されたケースに適用されます",
      membersPayAfter30Days: "会員は30日後にケースごとに฿2,490を支払います。今日参加して追加の特典を受け取りましょう。",
      newMembershipNote: "新しい会員資格は今後のケースに会員価格を適用します。このケースは公開価格で請求されます。",
      memberRateExplanation: "会員価格はLite、Protect、Secureの会員登録後30日で適用されます。ケース提出中のアップグレードは今後のケースにのみ適用されます。"
    },
    ko: {
      title: "사례 열기",
      subtitle: "임대 분쟁 해결 도움 받기",
      autoFilled: "연체 보증금에서 자동 입력됨",
      caseType: "사례 유형",
      depositCase: "보증금 미반환",
      earlyTermCase: "조기 종료 문제",
      damagesCase: "손해 분쟁",
      otherCase: "기타 문제",
      disputeAmount: "분쟁 금액",
      disputePlaceholder: "10000",
      propertAddress: "부동산 주소",
      addressPlaceholder: "123 Main St, Bangkok",
      summary: "사례 요약",
      summaryPlaceholder: "상황을 자세히 설명하세요...",
      landlordInfo: "집주인 정보",
      landlordName: "집주인 이름",
      landlordEmail: "집주인 이메일",
      evidence: "증빙 자료",
      evidenceDesc: "사진, 영수증 또는 문서 업로드",
      uploadFiles: "파일 업로드",
      uploading: "업로드 중...",
      removeFile: "제거",
      submit: "사례 제출",
      creating: "사례 생성 중...",
      submitting: "제출 및 결제 진행 중...",
      required: "필수",
      optional: "선택사항",
      caseDetails: "사례 상세정보",
      autoFilledMsg: "보증금 데이터가 미리 채워졌습니다. 필요에 따라 편집할 수 있습니다.",
      resolveService: "분쟁 해결",
      resolvePricing: "서비스 가격",
      memberPrice: "회원 가격",
      publicPrice: "공개 가격",
      perCase: "사례당",
      savingsNote: "공개 가격보다 ฿{amount} 절약",
      upgradeToMemberRate: "회원은 사례당 ฿{memberPrice}를 지불합니다. 회원 가격을 잠금 해제하려면 플랜을 업그레이드하세요.",
      whatsIncluded: "포함 내용:",
      reviewDocs: "전문 문서 검토",
      recommendActions: "권장 실행 계획 및 전략",
      templateLetters: "맞춤형 법적 템플릿 레터",
      memberSince: "회원 가입일",
      memberPricingUnlocked: "회원 가격이 잠금 해제됨",
      memberPricingUnlocksIn: "회원 가격은 30일의 활성 회원 자격 후에 잠금 해제됩니다. 회원 가격은 다음 날짜 이후에 제출된 사례에 적용됩니다",
      membersPayAfter30Days: "회원은 30일 후 사례당 ฿2,490를 지불합니다. 오늘 가입하여 추가 혜택을 받으세요.",
      newMembershipNote: "새 회원 자격은 향후 사례에 회원 가격을 적용합니다. 이 사례는 공개 가격으로 청구됩니다.",
      memberRateExplanation: "회원 요금은 Lite, Protect 또는 Secure 회원 가입 30일 후 적용됩니다. 사례 제출 중 업그레이드는 향후 사례에만 적용됩니다."
    },
    ru: {
      title: "Открыть дело",
      subtitle: "Получите помощь в решении спора по аренде",
      autoFilled: "Заполнено автоматически из просроченного депозита",
      caseType: "Тип дела",
      depositCase: "Депозит не возвращён",
      earlyTermCase: "Досрочное расторжение",
      damagesCase: "Спор о повреждениях",
      otherCase: "Другая проблема",
      disputeAmount: "Сумма спора",
      disputePlaceholder: "10000",
      propertAddress: "Адрес недвижимости",
      addressPlaceholder: "123 Main St, Bangkok",
      summary: "Описание дела",
      summaryPlaceholder: "Подробно опишите вашу ситуацию...",
      landlordInfo: "Данные владельца",
      landlordName: "Имя владельца",
      landlordEmail: "Email владельца",
      evidence: "Подтверждающие материалы",
      evidenceDesc: "Загрузите фотографии, квитанции или документы",
      uploadFiles: "Загрузить файлы",
      uploading: "Загрузка...",
      removeFile: "Удалить",
      submit: "Отправить дело",
      creating: "Создание дела...",
      submitting: "Отправка и переход к оплате...",
      required: "Обязательно",
      optional: "Необязательно",
      caseDetails: "Информация по делу",
      autoFilledMsg: "Данные депозита были предварительно заполнены. Вы можете их отредактировать.",
      resolveService: "Решите свой спор",
      resolvePricing: "Стоимость услуги",
      memberPrice: "Тариф участника",
      publicPrice: "Публичный тариф",
      perCase: "за одно дело",
      savingsNote: "Экономия ฿{amount} от публичного тарифа",
      upgradeToMemberRate: "Участники сервиса платят ฿{memberPrice} за одно дело. Обновите тариф, чтобы получить льготную цену.",
      whatsIncluded: "Что входит в услугу:",
      reviewDocs: "Профессиональный анализ ваших документов",
      recommendActions: "Рекомендованный план действий и стратегия",
      templateLetters: "Индивидуально подготовленные шаблоны юридических писем",
      memberSince: "Участник с",
      memberPricingUnlocked: "Тариф участника активирован",
      memberPricingUnlocksIn: "Тариф участника активируется после 30 дней активного членства. Ваш тариф применится к делам, поданным после",
      membersPayAfter30Days: "Участники платят ฿2,490 за дело через 30 дней. Присоединяйтесь сегодня для дополнительных преимуществ.",
      newMembershipNote: "Ваше новое членство применит тарифы участника к будущим делам. Это дело оплачивается по публичному тарифу.",
      memberRateExplanation: "Тарифы участника действуют через 30 дней активного членства Lite, Protect или Secure. Обновления во время подачи дела применяются только к будущим делам."
    }
  };

  const str = strings[language] || strings.en;

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#DC2626',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(220, 38, 38, 0.3)'
            }}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.textPrimary }}>
                {str.title}
              </h1>
              <p style={{ color: colors.textSecondary }}>{str.subtitle}</p>
            </div>
          </div>

          {/* Auto-fill indicator */}
          {autoFilledFromDeposit && (
            <div className="mt-4 p-4 rounded-lg border-2 animate-pulse" style={{
              backgroundColor: isDarkMode ? '#1E4435' : '#ECFDF5',
              borderColor: '#10B981'
            }}>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm" style={{ color: '#10B981' }}>
                    🛡️ {str.autoFilled}
                  </p>
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    {str.autoFilledMsg}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resolve Service Pricing */}
        <Card className="border-none shadow-xl mb-6" style={{ 
          backgroundColor: colors.cardBg,
          borderLeft: hasMemberPricing(user) ? '4px solid #10B981' : '4px solid #C7A338'
        }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" style={{ color: hasMemberPricing(user) ? '#10B981' : '#C7A338' }} />
              <CardTitle style={{ color: colors.textPrimary }}>{str.resolveService}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-bold mb-3" style={{ color: colors.textSecondary }}>
                {str.whatsIncluded}
              </h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#10B981' }} />
                  <span className="text-sm" style={{ color: colors.textPrimary }}>{str.reviewDocs}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#10B981' }} />
                  <span className="text-sm" style={{ color: colors.textPrimary }}>{str.recommendActions}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#10B981' }} />
                  <span className="text-sm" style={{ color: colors.textPrimary }}>{str.templateLetters}</span>
                </li>
              </ul>
            </div>

            <div className="border-t pt-4" style={{ borderColor: colors.borderColor }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                  {str.resolvePricing}
                </span>
                {hasMemberPricing(user) && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    <Crown className="w-3 h-3 mr-1" />
                    {str.memberPrice}
                  </Badge>
                )}
              </div>

              {hasMemberPricing(user) ? (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold" style={{ color: '#10B981' }}>
                      ฿{RESOLVE_PRICING.MEMBER_RATE.toLocaleString()}
                    </span>
                    <span className="text-sm" style={{ color: colors.textSecondary }}>
                      {str.perCase}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ 
                    backgroundColor: isDarkMode ? '#1E4435' : '#ECFDF5' 
                  }}>
                    <TrendingDown className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold" style={{ color: '#10B981' }}>
                      {str.savingsNote.replace('{amount}', RESOLVE_PRICING.SAVINGS.toLocaleString())}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
                      ฿{RESOLVE_PRICING.PUBLIC_RATE.toLocaleString()}
                    </span>
                    <span className="text-sm" style={{ color: colors.textSecondary }}>
                      {str.perCase}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg" style={{ 
                    backgroundColor: isDarkMode ? '#3A2D1C' : '#FEF3C7',
                    border: `1px solid ${isDarkMode ? '#F59E0B' : '#FCD34D'}`
                  }}>
                    <p className="text-xs" style={{ color: isDarkMode ? '#FCD34D' : '#92400E' }}>
                      {str.upgradeToMemberRate.replace('{memberPrice}', RESOLVE_PRICING.MEMBER_RATE.toLocaleString())}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => navigate(createPageUrl("account") + '?showPlans=true')}
                      style={{
                        borderColor: '#C7A338',
                        color: '#C7A338'
                      }}
                    >
                      {language === 'th' ? 'ดูแผน' : language === 'zh' ? '查看计划' : language === 'ja' ? 'プランを見る' : language === 'ko' ? '플랜 보기' : language === 'ru' ? 'Посмотреть тарифы' : 'View Plans'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader>
              <CardTitle style={{ color: colors.textPrimary }}>{str.caseDetails}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Case Type */}
              <div>
                <Label style={{ color: colors.textPrimary }}>
                  {str.caseType} <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                  <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: colors.cardBg }}>
                    <SelectItem value="deposit">{str.depositCase}</SelectItem>
                    <SelectItem value="early_termination">{str.earlyTermCase}</SelectItem>
                    <SelectItem value="damages">{str.damagesCase}</SelectItem>
                    <SelectItem value="other">{str.otherCase}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dispute Amount */}
              <div>
                <Label style={{ color: colors.textPrimary }}>
                  {str.disputeAmount} (฿) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.dispute_amount}
                  onChange={(e) => setFormData({...formData, dispute_amount: e.target.value})}
                  placeholder={str.disputePlaceholder}
                  className="mt-2"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
              </div>

              {/* Property Address */}
              <div>
                <Label style={{ color: colors.textPrimary }}>
                  {str.propertAddress} <span className="text-sm" style={{ color: colors.textSecondary }}>({str.optional})</span>
                </Label>
                <Input
                  value={formData.property_address}
                  onChange={(e) => setFormData({...formData, property_address: e.target.value})}
                  placeholder={str.addressPlaceholder}
                  className="mt-2"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
              </div>

              {/* Summary */}
              <div>
                <Label style={{ color: colors.textPrimary }}>
                  {str.summary} <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({...formData, summary: e.target.value})}
                  placeholder={str.summaryPlaceholder}
                  rows={6}
                  className="mt-2"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Landlord Info */}
          <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader>
              <CardTitle style={{ color: colors.textPrimary }}>{str.landlordInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label style={{ color: colors.textPrimary }}>{str.landlordName}</Label>
                <Input
                  value={formData.landlord_name}
                  onChange={(e) => setFormData({...formData, landlord_name: e.target.value})}
                  className="mt-2"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
              </div>
              <div>
                <Label style={{ color: colors.textPrimary }}>{str.landlordEmail}</Label>
                <Input
                  type="email"
                  value={formData.landlord_email}
                  onChange={(e) => setFormData({...formData, landlord_email: e.target.value})}
                  className="mt-2"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Evidence Upload */}
          <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader>
              <CardTitle style={{ color: colors.textPrimary }}>{str.evidence}</CardTitle>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>{str.evidenceDesc}</p>
            </CardHeader>
            <CardContent>
              <label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  disabled={uploading}
                />
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all"
                  style={{
                    borderColor: colors.borderColor,
                    backgroundColor: isDarkMode ? '#353A3D' : '#F9FAFB'
                  }}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textSecondary }} />
                  <p className="font-semibold" style={{ color: colors.textPrimary }}>
                    {uploading ? str.uploading : str.uploadFiles}
                  </p>
                </div>
              </label>

              {formData.evidence_files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.evidence_files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 rounded-lg" style={{
                      backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6'
                    }}>
                      <span className="text-sm" style={{ color: colors.textPrimary }}>{file.label}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting || uploading}
            className="w-full bg-red-600 hover:bg-red-700 py-6 text-lg font-bold"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {str.submitting}
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                {str.submit}
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResolveCase() {
  return (
    <ToastProvider>
      <ResolveCaseContent />
    </ToastProvider>
  );
}