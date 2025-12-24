import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Loader2, FileText, Send, AlertCircle, Edit2, Save, Globe, CheckSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { buildLetterLanguagePack, getLanguageLabel, formatLanguageList } from "../components/shared/languageRules";
import AuthGuard from "../components/shared/AuthGuard";
import { ToastProvider, useToast } from "../components/shared/Toast";
import { haptic } from "../components/shared/HapticFeedback";
import MobileFormInput from "../components/shared/MobileFormInput";
import PageHeader from "../components/shared/PageHeader";
import ProgressBar from "../components/shared/ProgressBar";

function TemplateFormContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [generatedLetter, setGeneratedLetter] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [editedContent, setEditedContent] = useState({});
  const [languagePack, setLanguagePack] = useState(null);

  // Get subject from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedSubject = urlParams.get('subject');

  // NORMALIZED MASTER INPUT SCHEMA - Used by ALL templates
  const [formData, setFormData] = useState({
    template_key: '',
    // SECTION 1: Parties
    tenant_name: '',
    tenant_address: '',
    tenant_email: '',
    tenant_phone: '',
    landlord_name: '',
    landlord_address: '',
    // SECTION 2: Property
    property_address: '',
    property_name: '',
    unit_number: '',
    contract_ref: '',
    // SECTION 3: Language
    recipientType: 'landlord',
    includeTenantCopy: false,
    includeThaiCopy: false,
    includeLandlordCopy: false
  });

  // Effect to set initial template from URL, runs once on mount
  useEffect(() => {
    if (preSelectedSubject) {
      setFormData(prev => ({ ...prev, template_key: preSelectedSubject }));
    }
  }, [preSelectedSubject]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: dbTemplates = [] } = useQuery({
    queryKey: ['templateLibrary'],
    queryFn: () => base44.entities.TemplateLibrary.filter({ status: 'active' }),
    enabled: !!user,
    initialData: []
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const userCredits = user?.letter_credits || 0;

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
      generateLetter: "Generate Letter",
      formDesc: "Fill in the details to generate your letter",
      personalDetails: "Letter Details",
      yourName: "Your Name (Tenant)",
      yourNamePlaceholder: "John Smith",
      landlordName: "Landlord's Name",
      landlordNamePlaceholder: "Jane Doe",
      propertyAddress: "Property Address",
      propertyAddressPlaceholder: "123 Main St, Bangkok",
      contractRef: "Contract Reference (optional)",
      contractRefPlaceholder: "e.g., Lease dated January 15, 2024",
      depositAmount: "Deposit Amount (optional)",
      letterType: "Letter Type",
      depositReturn: "Deposit Return Request",
      damageDispute: "Damage Claim Response",
      earlyTermination: "Early Termination Notice",
      generateButton: "Generate Letter",
      generating: "Generating...",
      cancel: "Back",
      required: "Required",
      errorFillRequired: 'Please fill in your name and landlord name.',
      errorGenerationFailed: 'Failed to generate letter. Please try again.',
      successTitle: "Letter Generated Successfully!",
      successDesc: "Your bilingual letter has been created and saved to your Document Vault.",
      previewHtml: "Preview in Browser",
      downloadWord: "Download Word",
      goToVault: "Go to Document Vault",
      exampleItem1: "Example Item 1 (optional)",
      exampleItem1Placeholder: "e.g., Wall scuff marks",
      exampleItem2: "Example Item 2 (optional)",
      exampleItem2Placeholder: "e.g., Minor carpet wear",
      exampleItem3: "Example Item 3 (optional)",
      exampleItem3Placeholder: "e.g., Light scratches",
      breachSummary: "Breach Summary",
      breachSummaryPlaceholder: "Describe the non-compliance issue...",
      settlementAmount: "Settlement Amount (THB)",
      settlementAmountPlaceholder: "18000",
      settlementDate: "Settlement Date",
      insufficientCreditsError: "Insufficient credits. Please purchase credits from Account page.",
      insufficientCreditsWarningTitle: "⚠️ Insufficient Credits",
      insufficientCreditsWarningDesc: "You need 1 credit to generate a letter. Please purchase credits from the Account page.",
      goToAccount: "Go to Account",
      creditsLabel: "Credits",
      back: "Back",
      reviewEditLetter: "Review & Edit Letter",
      reviewEditLetterDesc: "Review the content and make edits before saving. You can edit the text directly.",
      editContent: "Edit Content",
      englishLetter: "English Letter",
      thaiLetter: "Thai Letter",
      saveLetter: "Save Letter",
      saving: "Saving...",
      saveLetterSuccess: "Letter saved successfully!",
      saveLetterCreditDeduction: "⚡ On save, 1 credit will be deducted and the letter will be saved to Document Vault.",
      cancelReviewConfirm: "Cancel letter generation? Changes will not be saved.",
      selectLetterType: "Select Letter Type",
      selectLetterTypePlaceholder: "Choose a letter type",
      concernsList: "List of Concerns (Optional)",
      concernsListPlaceholder: "e.g., Unpaid rent, Noise complaints, Unauthorized pet",
      creditsDeductedMessage: "1 credit will be deducted upon saving this letter.",
      selectTypeFirst: "Please select a letter type",
      insufficientCreditsMsg: "Insufficient credits. Please purchase credits to generate letters.",
      creditAlreadyDeducted: "On save, the letter will be stored in Evidence Vault (credit already deducted)",
      cancelEditConfirm: "Cancel editing? Credit was already deducted. If you cancel, the letter will not be saved.",
      reviewContentRequired: "Please review letter content",
      saveFailed: "Failed to save. Please try again.",
      creditDeductedRemaining: "✅ Credit deducted - {credits_remaining} remaining",
      languageOptions: "Language Options",
      recipientLabel: "Letter Recipient",
      recipientTenant: "Tenant (Myself)",
      recipientLandlord: "Landlord",
      recipientJuristic: "Juristic Office",
      juristicLanguageInfo: "📋 Juristic letters will be generated in Thai and English only (Thailand standard)",
      primaryLanguage: "Primary language:",
      englishIncluded: "✓ English will be included automatically",
      includeTenantLanguageCopy: "Include tenant language copy",
      includeThaiCopy: "Include Thai copy",
      includeLandlordLanguageCopy: "Include landlord language",
      willGenerate: "📦 Will generate:",
      languages: "languages",
      yourLanguage: "Your language:"
    },
    th: {
      generateLetter: "สร้างจดหมาย",
      formDesc: "กรอกรายละเอียดเพื่อสร้างจดหมาย",
      personalDetails: "รายละเอียดจดหมาย",
      yourName: "ชื่อของคุณ (ผู้เช่า)",
      yourNamePlaceholder: "สมชาย ใจดี",
      landlordName: "ชื่อเจ้าของบ้าน",
      landlordNamePlaceholder: "สมหญิง รักดี",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      propertyAddressPlaceholder: "123 ถนนสุขุมวิท กรุงเทพฯ",
      contractRef: "อ้างอิงสัญญา (ไม่บังคับ)",
      contractRefPlaceholder: "เช่น สัญญาเช่าลงวันที่ 15 มกราคม 2567",
      depositAmount: "จำนวนเงินมัดจำ (ไม่บังคับ)",
      letterType: "ประเภทจดหมาย",
      depositReturn: "จดหมายขอคืนเงินมัดจำ",
      damageDispute: "โต้แย้งค่าซ่อมแซม",
      earlyTermination: "แจ้งยกเลิกก่อนกำหนด",
      generateButton: "สร้างจดหมาย",
      generating: "กำลังสร้าง...",
      cancel: "กลับ",
      required: "จำเป็น",
      errorFillRequired: 'กรุณากรอกชื่อของคุณและชื่อเจ้าของบ้าน',
      errorGenerationFailed: 'ไม่สามารถสร้างจดหมายได้ กรุณาลองอีกครั้ง',
      successTitle: "สร้างจดหมายสำเร็จ!",
      successDesc: "จดหมายสองภาษาของคุณถูกสร้างและบันทึกไว้ใน Document Vault แล้ว",
      previewHtml: "ดูตัวอย่างในเบราว์เซอร์",
      downloadWord: "ดาวน์โหลด Word",
      goToVault: "ไปที่ Document Vault",
      exampleItem1: "ตัวอย่างรายการ 1 (ไม่บังคับ)",
      exampleItem1Placeholder: "เช่น รอยขีดข่วนกำแพง",
      exampleItem2: "ตัวอย่างรายการ 2 (ไม่บังคับ)",
      exampleItem2Placeholder: "เช่น พรมสึกเล็กน้อย",
      exampleItem3: "ตัวอย่างรายการ 3 (ไม่บังคับ)",
      exampleItem3Placeholder: "เช่น รอยขีดข่วนเล็กน้อย",
      breachSummary: "สรุปการฝ่าฝืน",
      breachSummaryPlaceholder: "อธิบายปัญหาการไม่ปฏิบัติตาม...",
      settlementAmount: "จำนวนเงินชำระ (บาท)",
      settlementAmountPlaceholder: "18000",
      settlementDate: "วันที่ชำระเงิน",
      insufficientCreditsError: "เครดิตไม่เพียงพอ กรุณาซื้อเครดิตเพิ่มจากหน้าบัญชี",
      insufficientCreditsWarningTitle: "⚠️ เครดิตไม่เพียงพอ",
      insufficientCreditsWarningDesc: "คุณต้องการ 1 เครดิตเพื่อสร้างจดหมาย กรุณาซื้อเครดิตเพิ่มจากหน้าบัญชี",
      goToAccount: "ไปที่หน้าบัญชี",
      creditsLabel: "เครดิต",
      back: "กลับ",
      reviewEditLetter: "ตรวจสอบและแก้ไขจดหมาย",
      reviewEditLetterDesc: "ตรวจสอบเนื้อหาและแก้ไขก่อนบันทึก คุณสามารถแก้ไขข้อความได้โดยตรง",
      editContent: "แก้ไขเนื้อหา",
      englishLetter: "จดหมายภาษาอังกฤษ",
      thaiLetter: "จดหมายภาษาไทย",
      saveLetter: "บันทึกจดหมาย",
      saving: "กำลังบันทึก...",
      saveLetterSuccess: "บันทึกจดหมายสำเร็จ!",
      saveLetterCreditDeduction: "⚡ เมื่อบันทึก เครดิต 1 จะถูกหัก และจดหมายจะถูกบันทึกในคลังเอกสาร.",
      cancelReviewConfirm: "ยกเลิกการสร้างจดหมาย? การเปลี่ยนแปลงจะไม่ถูกบันทึก",
      selectLetterType: "เลือกประเภทจดหมาย",
      selectLetterTypePlaceholder: "เลือกประเภทจดหมาย",
      concernsList: "รายการข้อกังวล (ไม่บังคับ)",
      concernsListPlaceholder: "เช่น ค่าเช่าที่ค้างชำระ, ข้อร้องเรียนเรื่องเสียงดัง, สัตว์เลี้ยงไม่ได้รับอนุญาต",
      creditsDeductedMessage: "จะถูกหัก 1 เครดิตเมื่อบันทึกจดหมายนี้",
      selectTypeFirst: "กรุณาเลือกประเภทจดหมาย",
      insufficientCreditsMsg: "เครดิตไม่เพียงพอ กรุณาซื้อเครดิตเพื่อสร้างจดหมาย",
      creditAlreadyDeducted: "เมื่อบันทึก จดหมายจะถูกเก็บในคลังหลักฐาน (เครดิตถูกหักไปแล้ว)",
      cancelEditConfirm: "ยกเลิกการแก้ไข? เครดิตถูกหักไปแล้ว หากยกเลิกจะไม่มีการบันทึกจดหมาย",
      reviewContentRequired: "กรุณาตรวจสอบเนื้อหาจดหมาย",
      saveFailed: "ไม่สามารถบันทึกได้ กรุณาลองอีกครั้ง",
      creditDeductedRemaining: "✅ เครดิตถูกหักแล้ว - เหลือ {credits_remaining}",
      languageOptions: "ตัวเลือกภาษา",
      recipientLabel: "ผู้รับจดหมาย",
      recipientTenant: "ผู้เช่า (ตัวเอง)",
      recipientLandlord: "เจ้าของบ้าน",
      recipientJuristic: "นิติบุคคล",
      juristicLanguageInfo: "📋 จดหมายนิติบุคคลจะสร้างเป็นภาษาไทยและอังกฤษเท่านั้น (ตามมาตรฐานในประเทศไทย)",
      primaryLanguage: "ภาษาหลัก:",
      englishIncluded: "✓ อังกฤษจะถูกเพิ่มโดยอัตโนมัติ",
      includeTenantLanguageCopy: "รวมสำเนาภาษาผู้เช่า",
      includeThaiCopy: "รวมภาษาไทย",
      includeLandlordLanguageCopy: "รวมภาษาเจ้าของบ้าน",
      willGenerate: "📦 จะสร้าง:",
      languages: "ภาษา",
      yourLanguage: "ภาษาของคุณ:"
      },
      zh: {
      generateLetter: "生成信件",
      formDesc: "填写详细信息以生成您的信件",
      personalDetails: "信件详情",
      yourName: "您的姓名（租户）",
      yourNamePlaceholder: "张三",
      landlordName: "房东姓名",
      landlordNamePlaceholder: "李四",
      propertyAddress: "物业地址",
      propertyAddressPlaceholder: "123 Main St, Bangkok",
      contractRef: "合同参考（可选）",
      contractRefPlaceholder: "例如，2024年1月15日签订的租约",
      depositAmount: "押金金额（可选）",
      letterType: "信件类型",
      depositReturn: "押金退还请求",
      damageDispute: "损害索赔回应",
      earlyTermination: "提前终止通知",
      generateButton: "生成信件",
      generating: "生成中...",
      cancel: "返回",
      required: "必填",
      errorFillRequired: '请填写您的姓名和房东姓名。',
      errorGenerationFailed: '生成信件失败。请重试。',
      successTitle: "信件生成成功！",
      successDesc: "您的双语信件已创建并保存到文档保管库。",
      previewHtml: "在浏览器中预览",
      downloadWord: "下载Word",
      goToVault: "转到文档保管库",
      exampleItem1: "示例项目1（可选）",
      exampleItem1Placeholder: "例如，墙壁划痕",
      exampleItem2: "示例项目2（可选）",
      exampleItem2Placeholder: "例如，地毯轻微磨损",
      exampleItem3: "示例项目3（可选）",
      exampleItem3Placeholder: "例如，轻微划痕",
      breachSummary: "违约摘要",
      breachSummaryPlaceholder: "描述不合规问题...",
      settlementAmount: "和解金额（泰铢）",
      settlementAmountPlaceholder: "18000",
      settlementDate: "和解日期",
      insufficientCreditsError: "信用不足。请从帐户页面购买信用。",
      insufficientCreditsWarningTitle: "⚠️ 信用不足",
      insufficientCreditsWarningDesc: "您需要1个信用来生成信件。请从帐户页面购买信用。",
      goToAccount: "转到帐户",
      creditsLabel: "信用",
      back: "返回",
      reviewEditLetter: "审阅和编辑信件",
      reviewEditLetterDesc: "在保存之前审阅内容并进行编辑。您可以直接编辑文本。",
      editContent: "编辑内容",
      englishLetter: "英文信件",
      thaiLetter: "泰文信件",
      saveLetter: "保存信件",
      saving: "保存中...",
      saveLetterSuccess: "信件保存成功！",
      saveLetterCreditDeduction: "⚡ 保存时，将扣除1个信用，信件将保存到文档保管库。",
      cancelReviewConfirm: "取消信件生成？更改将不会保存。",
      selectLetterType: "选择信件类型",
      selectLetterTypePlaceholder: "选择信件类型",
      concernsList: "关注列表（可选）",
      concernsListPlaceholder: "例如，未付租金、噪音投诉、未经授权的宠物",
      creditsDeductedMessage: "保存此信件时将扣除1个信用。",
      selectTypeFirst: "请先选择信件类型",
      insufficientCreditsMsg: "信用不足。请购买信用以生成信件。",
      creditAlreadyDeducted: "保存时，信件将存储在证据保管库中（信用已扣除）",
      cancelEditConfirm: "取消编辑？信用已被扣除。如果取消，信件将不会被保存。",
      reviewContentRequired: "请审阅信件内容",
      saveFailed: "保存失败。请重试。",
      creditDeductedRemaining: "✅ 信用已扣除 - 剩余 {credits_remaining}",
      languageOptions: "语言选项",
      recipientLabel: "收件人",
      recipientTenant: "租户（本人）",
      recipientLandlord: "房东",
      recipientJuristic: "物业办公室",
      juristicLanguageInfo: "📋 物业办公室信件将仅以泰语和英语生成（泰国标准）",
      primaryLanguage: "主要语言:",
      englishIncluded: "✓ 英语将自动包含",
      includeTenantLanguageCopy: "包含租户语言副本",
      includeThaiCopy: "包含泰语",
      includeLandlordLanguageCopy: "包含房东语言",
      willGenerate: "📦 将生成:",
      languages: "语言"
      },
      ja: {
      generateLetter: "レターを生成",
      formDesc: "レター生成のための詳細を入力してください",
      personalDetails: "レター詳細",
      yourName: "あなたの名前（賃借人）",
      yourNamePlaceholder: "田中太郎",
      landlordName: "家主の名前",
      landlordNamePlaceholder: "佐藤花子",
      propertyAddress: "物件住所",
      propertyAddressPlaceholder: "123 Main St, Bangkok",
      contractRef: "契約参照（オプション）",
      contractRefPlaceholder: "例：2024年1月15日付けリース",
      depositAmount: "敷金額（オプション）",
      letterType: "レタータイプ",
      depositReturn: "敷金返還請求",
      damageDispute: "損害請求への回答",
      earlyTermination: "早期終了通知",
      generateButton: "レターを生成",
      generating: "生成中...",
      cancel: "戻る",
      required: "必須",
      errorFillRequired: 'あなたの名前と家主の名前を入力してください。',
      errorGenerationFailed: 'レターの生成に失敗しました。もう一度お試しください。',
      successTitle: "レター生成成功！",
      successDesc: "バイリンガルレターが作成され、ドキュメントボールトに保存されました。",
      previewHtml: "ブラウザでプレビュー",
      downloadWord: "Wordをダウンロード",
      goToVault: "ドキュメントボールトへ",
      exampleItem1: "例アイテム1（オプション）",
      exampleItem1Placeholder: "例：壁の擦り傷",
      exampleItem2: "例アイテム2（オプション）",
      exampleItem2Placeholder: "例：軽微なカーペットの摩耗",
      exampleItem3: "例アイテム3（オプション）",
      exampleItem3Placeholder: "例：軽微な引っかき傷",
      breachSummary: "違反の概要",
      breachSummaryPlaceholder: "コンプライアンス違反の問題を説明...",
      settlementAmount: "和解金額（タイバーツ）",
      settlementAmountPlaceholder: "18000",
      settlementDate: "和解日",
      insufficientCreditsError: "クレジット不足。アカウントページからクレジットを購入してください。",
      insufficientCreditsWarningTitle: "⚠️ クレジット不足",
      insufficientCreditsWarningDesc: "レターを生成するには1クレジットが必要です。アカウントページからクレジットを購入してください。",
      goToAccount: "アカウントへ",
      creditsLabel: "クレジット",
      back: "戻る",
      reviewEditLetter: "レターを確認して編集",
      reviewEditLetterDesc: "保存する前に内容を確認して編集してください。テキストを直接編集できます。",
      editContent: "コンテンツを編集",
      englishLetter: "英語レター",
      thaiLetter: "タイ語レター",
      saveLetter: "レターを保存",
      saving: "保存中...",
      saveLetterSuccess: "レターが正常に保存されました！",
      saveLetterCreditDeduction: "⚡ 保存時に1クレジットが差し引かれ、レターがドキュメントボールトに保存されます。",
      cancelReviewConfirm: "レター生成をキャンセルしますか？変更は保存されません。",
      selectLetterType: "レタータイプを選択",
      selectLetterTypePlaceholder: "レタータイプを選択",
      concernsList: "懸念事項リスト（オプション）",
      concernsListPlaceholder: "例：未払い家賃、騒音苦情、無許可のペット",
      creditsDeductedMessage: "このレターを保存すると1クレジットが差し引かれます。",
      selectTypeFirst: "まずレタータイプを選択してください",
      insufficientCreditsMsg: "クレジット不足。レター生成にはクレジットを購入してください。",
      creditAlreadyDeducted: "保存時にレターは証拠保管庫に保存されます（クレジットは既に差し引かれています）",
      cancelEditConfirm: "編集をキャンセルしますか？クレジットは既に差し引かれています。キャンセルすると、レターは保存されません。",
      reviewContentRequired: "レターの内容を確認してください",
      saveFailed: "保存に失敗しました。もう一度お試しください。",
      creditDeductedRemaining: "✅ クレジットが差し引かれました - 残り {credits_remaining}",
      languageOptions: "言語オプション",
      recipientLabel: "受取人",
      recipientTenant: "借主（自分）",
      recipientLandlord: "家主",
      recipientJuristic: "管理事務所",
      juristicLanguageInfo: "📋 管理事務所への手紙はタイ語と英語のみで生成されます（タイの標準）",
      primaryLanguage: "主要言語:",
      englishIncluded: "✓ 英語は自動的に含まれます",
      includeTenantLanguageCopy: "借主言語のコピーを含める",
      includeThaiCopy: "タイ語を含める",
      includeLandlordLanguageCopy: "家主の言語を含める",
      willGenerate: "📦 生成予定:",
      languages: "言語"
      },
      ko: {
      generateLetter: "편지 생성",
      formDesc: "편지를 생성하기 위해 세부 정보를 입력하세요",
      personalDetails: "편지 세부정보",
      yourName: "귀하의 이름（임차인）",
      yourNamePlaceholder: "홍길동",
      landlordName: "집주인 이름",
      landlordNamePlaceholder: "김영희",
      propertyAddress: "부동산 주소",
      propertyAddressPlaceholder: "123 Main St, Bangkok",
      contractRef: "계약 참조（선택사항）",
      contractRefPlaceholder: "예：2024년 1월 15일자 임대",
      depositAmount: "보증금 금액（선택사항）",
      letterType: "편지 유형",
      depositReturn: "보증금 반환 요청",
      damageDispute: "손해 청구 응답",
      earlyTermination: "조기 종료 통지",
      generateButton: "편지 생성",
      generating: "생성 중...",
      cancel: "뒤로",
      required: "필수",
      errorFillRequired: '귀하의 이름과 집주인 이름을 입력하세요.',
      errorGenerationFailed: '편지 생성 실패. 다시 시도하세요.',
      successTitle: "편지 생성 성공！",
      successDesc: "이중 언어 편지가 생성되어 문서 보관소에 저장되었습니다.",
      previewHtml: "브라우저에서 미리보기",
      downloadWord: "Word 다운로드",
      goToVault: "문서 보관소로 이동",
      exampleItem1: "예시 항목 1（선택사항）",
      exampleItem1Placeholder: "예：벽 긁힘",
      exampleItem2: "예시 항목 2（선택사항）",
      exampleItem2Placeholder: "예：카펫 경미한 마모",
      exampleItem3: "예시 항목 3（선택사항）",
      exampleItem3Placeholder: "예：가벼운 긁힘",
      breachSummary: "위반 요약",
      breachSummaryPlaceholder: "준수 위반 문제를 설명하세요...",
      settlementAmount: "합의 금액（바트）",
      settlementAmountPlaceholder: "18000",
      settlementDate: "합의 날짜",
      insufficientCreditsError: "크레딧 부족. 계정 페이지에서 크레딧을 구매하세요.",
      insufficientCreditsWarningTitle: "⚠️ 크레딧 부족",
      insufficientCreditsWarningDesc: "편지를 생성하려면 1 크레딧이 필요합니다. 계정 페이지에서 크레딧을 구매하세요.",
      goToAccount: "계정으로 이동",
      creditsLabel: "크레딧",
      back: "뒤로",
      reviewEditLetter: "편지 검토 및 편집",
      reviewEditLetterDesc: "저장하기 전에 내용을 검토하고 편집하세요. 텍스트를 직접 편집할 수 있습니다.",
      editContent: "콘텐츠 편집",
      englishLetter: "영어 편지",
      thaiLetter: "태국어 편지",
      saveLetter: "편지 저장",
      saving: "저장 중...",
      saveLetterSuccess: "편지가 성공적으로 저장되었습니다！",
      saveLetterCreditDeduction: "⚡ 저장 시 1 크레딧이 차감되고 편지가 문서 보관소에 저장됩니다.",
      cancelReviewConfirm: "편지 생성을 취소하시겠습니까? 변경사항이 저장되지 않습니다.",
      selectLetterType: "편지 유형 선택",
      selectLetterTypePlaceholder: "편지 유형 선택",
      concernsList: "우려 목록（선택사항）",
      concernsListPlaceholder: "예：미납 임대료, 소음 불만, 무단 애완동물",
      creditsDeductedMessage: "이 편지를 저장하면 1 크레딧이 차감됩니다.",
      selectTypeFirst: "먼저 편지 유형을 선택하세요",
      insufficientCreditsMsg: "크레딧 부족. 편지를 생성하려면 크레딧을 구매하세요.",
      creditAlreadyDeducted: "저장 시 편지가 증거 보관소에 저장됩니다（크레딧이 이미 차감됨）",
      cancelEditConfirm: "편집을 취소하시겠습니까? 크레딧이 이미 차감되었습니다. 취소하면 편지가 저장되지 않습니다.",
      reviewContentRequired: "편지 내용을 검토하세요",
      saveFailed: "저장 실패. 다시 시도하세요.",
      creditDeductedRemaining: "✅ 크레딧 차감됨 - {credits_remaining} 남음",
      languageOptions: "언어 옵션",
      recipientLabel: "수신자",
      recipientTenant: "임차인 (본인)",
      recipientLandlord: "집주인",
      recipientJuristic: "관리 사무소",
      juristicLanguageInfo: "📋 관리 사무소 편지는 태국어와 영어로만 생성됩니다 (태국 표준)",
      primaryLanguage: "주 언어:",
      englishIncluded: "✓ 영어가 자동으로 포함됩니다",
      includeTenantLanguageCopy: "임차인 언어 사본 포함",
      includeThaiCopy: "태국어 포함",
      includeLandlordLanguageCopy: "집주인 언어 포함",
      willGenerate: "📦 생성 예정:",
      languages: "언어"
      },
      ru: {
      generateLetter: "Создать письмо",
      formDesc: "Заполните детали для создания вашего письма",
      personalDetails: "Детали письма",
      yourName: "Ваше имя (Арендатор)",
      yourNamePlaceholder: "Иван Иванов",
      landlordName: "Имя арендодателя",
      landlordNamePlaceholder: "Мария Петрова",
      propertyAddress: "Адрес недвижимости",
      propertyAddressPlaceholder: "123 Main St, Bangkok",
      contractRef: "Ссылка на договор (необязательно)",
      contractRefPlaceholder: "например, Договор от 15 января 2024",
      depositAmount: "Сумма депозита (необязательно)",
      letterType: "Тип письма",
      depositReturn: "Запрос возврата депозита",
      damageDispute: "Ответ на претензию по ущербу",
      earlyTermination: "Уведомление о досрочном расторжении",
      generateButton: "Создать письмо",
      generating: "Создание...",
      cancel: "Назад",
      required: "Обязательно",
      errorFillRequired: "Пожалуйста, заполните ваше имя и имя арендодателя.",
      errorGenerationFailed: "Не удалось создать письмо. Попробуйте снова.",
      successTitle: "Письмо успешно создано!",
      successDesc: "Ваше многоязычное письмо создано и сохранено в хранилище документов.",
      previewHtml: "Просмотр в браузере",
      downloadWord: "Скачать Word",
      goToVault: "Перейти в хранилище документов",
      exampleItem1: "Пример 1 (необязательно)",
      exampleItem1Placeholder: "например, Царапины на стене",
      exampleItem2: "Пример 2 (необязательно)",
      exampleItem2Placeholder: "например, Небольшой износ ковра",
      exampleItem3: "Пример 3 (необязательно)",
      exampleItem3Placeholder: "например, Лёгкие царапины",
      breachSummary: "Описание нарушения",
      breachSummaryPlaceholder: "Опишите проблему несоблюдения...",
      settlementAmount: "Сумма урегулирования (THB)",
      settlementAmountPlaceholder: "18000",
      settlementDate: "Дата урегулирования",
      insufficientCreditsError: "Недостаточно кредитов. Пожалуйста, приобретите кредиты на странице аккаунта.",
      insufficientCreditsWarningTitle: "⚠️ Недостаточно кредитов",
      insufficientCreditsWarningDesc: "Вам нужен 1 кредит для создания письма. Пожалуйста, приобретите кредиты на странице аккаунта.",
      goToAccount: "Перейти к аккаунту",
      creditsLabel: "Кредиты",
      back: "Назад",
      reviewEditLetter: "Проверка и редактирование письма",
      reviewEditLetterDesc: "Проверьте содержание и внесите правки перед сохранением. Вы можете редактировать текст напрямую.",
      editContent: "Редактировать содержание",
      englishLetter: "Английское письмо",
      thaiLetter: "Тайское письмо",
      saveLetter: "Сохранить письмо",
      saving: "Сохранение...",
      saveLetterSuccess: "Письмо успешно сохранено!",
      saveLetterCreditDeduction: "⚡ При сохранении будет списан 1 кредит, и письмо будет сохранено в хранилище документов.",
      cancelReviewConfirm: "Отменить создание письма? Изменения не будут сохранены.",
      selectLetterType: "Выберите тип письма",
      selectLetterTypePlaceholder: "Выберите тип письма",
      concernsList: "Список проблем (необязательно)",
      concernsListPlaceholder: "например, Неоплаченная аренда, Жалобы на шум, Неразрешённое животное",
      creditsDeductedMessage: "При создании этого письма будет списан 1 кредит.",
      selectTypeFirst: "Пожалуйста, сначала выберите тип письма",
      insufficientCreditsMsg: "Недостаточно кредитов. Пожалуйста, приобретите кредиты для создания писем.",
      creditAlreadyDeducted: "При сохранении письмо будет сохранено в хранилище доказательств (кредит уже списан)",
      cancelEditConfirm: "Отменить редактирование? Кредит уже был списан. Если отменить, письмо не будет сохранено.",
      reviewContentRequired: "Пожалуйста, проверьте содержание письма",
      saveFailed: "Не удалось сохранить. Попробуйте снова.",
      creditDeductedRemaining: "✅ Кредит списан - осталось {credits_remaining}",
      languageOptions: "Языковые опции",
      recipientLabel: "Получатель письма",
      recipientTenant: "Арендатор (себе)",
      recipientLandlord: "Арендодатель",
      recipientJuristic: "Управляющая компания",
      juristicLanguageInfo: "📋 Письма для управляющей компании создаются только на тайском и английском (стандарт Таиланда)",
      primaryLanguage: "Основной язык:",
      englishIncluded: "✓ Английский будет включён автоматически",
      includeTenantLanguageCopy: "Включить копию на языке арендатора",
      includeThaiCopy: "Включить тайский",
      includeLandlordLanguageCopy: "Включить язык арендодателя",
      willGenerate: "📦 Будет создано:",
      languages: "языков"
      }
      };

  const strings = t[language] || t.en;

  // Build letter type labels - combine built-in and DB templates
  const letterTypeLabels = {
    // Built-in legacy templates
    deposit: strings.depositReturn,
    deductions: language === 'th' ? 'ขอรายละเอียดการหักเงิน' : language === 'zh' ? '要求逐项扣除' : language === 'ja' ? '明細化された控除要求' : language === 'ko' ? '항목별 공제 요청' : 'Request for Itemised Deductions',
    reminder: language === 'th' ? 'จดหมายเตือนแบบมิตร' : language === 'zh' ? '友好提醒' : language === 'ja' ? '友好的なリマインダー' : language === 'ko' ? '친근한 알림' : 'Friendly Reminder',
    dispute: language === 'th' ? 'จดหมายคัดค้านการระงับเงิน' : language === 'zh' ? '正式扣款争议' : language === 'ja' ? '差し止めに対する正式な異議申し立て' : language === 'ko' ? '공식 보류 이의 제기' : 'Formal Dispute of Withholding',
    early_termination: language === 'th' ? 'ประสานยุติสัญญาก่อนกำหนด' : language === 'zh' ? '提前终止调解' : language === 'ja' ? '早期終了和解' : language === 'ko' ? '조기 해지 조정' : 'Early Termination Reconciliation',
    condition_dispute: language === 'th' ? 'โต้แย้งสภาพทรัพย์สิน' : language === 'zh' ? '财产状况争议' : language === 'ja' ? '物件状態に関する紛争' : language === 'ko' ? '부동산 상태 분쟁' : 'Property Condition Dispute',
    evidence: language === 'th' ? 'ขอหลักฐานประกอบ' : language === 'zh' ? '要求提供证据' : language === 'ja' ? '証拠提出要求' : language === 'ko' ? '증거 요청' : 'Request for Evidence',
    final_opportunity: language === 'th' ? 'โอกาสสุดท้าย' : language === 'zh' ? '最后机会' : language === 'ja' ? '最終的な機会' : language === 'ko' ? '마지막 기회' : 'Final Opportunity',
    non_compliance: language === 'th' ? 'แจ้งไม่ปฏิบัติตามสัญญา' : language === 'zh' ? '违规通知' : language === 'ja' ? '不履行通知' : language === 'ko' ? '미준수 통지' : 'Notice of Non-Compliance',
    settlement: language === 'th' ? 'ยืนยันการตกลงชำระเงิน' : language === 'zh' ? '和解确认' : language === 'ja' ? '和解確認' : language === 'ko' ? '합의 확인' : 'Settlement Confirmation',
    general_concerns: language === 'th' ? 'ข้อกังวลทั่วไป' : language === 'zh' ? '一般关注/问题' : language === 'ja' ? '一般的な懸念/問題' : language === 'ko' ? '일반적인 우려/문제' : 'General Concerns/Issues'
  };

  // Add DB templates to the dropdown
  dbTemplates.forEach(template => {
    if (!letterTypeLabels[template.template_id]) {
      letterTypeLabels[template.template_id] = language === 'th' ? template.title_th : template.title_en;
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.template_key) {
      setError(strings.selectTypeFirst);
      haptic.error();
      return;
    }
    if (!formData.tenant_name?.trim() || !formData.tenant_address?.trim() || !formData.landlord_name?.trim() || !formData.property_address?.trim()) {
      setError(language === 'th' ? 'กรุณากรอกข้อมูลที่จำเป็นทั้งหมด' : 'Please fill in all required fields');
      haptic.error();
      return;
    }

    if (userCredits < 1) {
      setError(strings.insufficientCreditsMsg);
      haptic.error();
      return;
    }

    haptic.medium();
    setGenerating(true);
    
    try {
      // Use new master letter generator
      const response = await base44.functions.invoke('generateMasterLetter', {
        template_key: formData.template_key,
        tenant_name: formData.tenant_name,
        tenant_address: formData.tenant_address,
        tenant_email: formData.tenant_email,
        tenant_phone: formData.tenant_phone,
        landlord_name: formData.landlord_name,
        landlord_address: formData.landlord_address,
        property_address: formData.property_address,
        property_name: formData.property_name,
        unit_number: formData.unit_number,
        contract_ref: formData.contract_ref,
        recipientType: formData.recipientType,
        includeTenantCopy: formData.includeTenantCopy,
        includeThaiCopy: formData.includeThaiCopy,
        includeLandlordCopy: formData.includeLandlordCopy
      });

      if (response.data?.ok) {
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        setGeneratedLetter(response.data);
        setLanguagePack(response.data.language_pack);
        setEditedContent(response.data.letter_content || {});
        setReviewMode(true);
        haptic.success();
        toast.success(strings.creditDeductedRemaining.replace('{credits_remaining}', response.data.credits_remaining || 0));
      } else {
        throw new Error(response.data?.error || strings.errorGenerationFailed);
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || strings.errorGenerationFailed);
      haptic.error();
      toast.error(err.message || strings.errorGenerationFailed);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAfterReview = async () => {
    if (!generatedLetter || !languagePack || Object.keys(editedContent).length === 0) {
      setError(strings.reviewContentRequired);
      haptic.error();
      return;
    }

    haptic.medium();
    setSaving(true);
    setError(null);

    try {
      // Save the reviewed multi-language content (no credit deduction - already done)
      const response = await base44.functions.invoke('saveReviewedLetter', {
        subject: formData.template_key,
        tenant_name: formData.tenant_name,
        landlord_name: formData.landlord_name,
        property_address: formData.property_address,
        reviewedLetters: editedContent,
        languagePack: languagePack,
        recipientType: formData.recipientType
      });

      if (response.data?.ok) {
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        toast.success(strings.saveLetterSuccess);
        haptic.success();
        navigate(createPageUrl("EvidenceVault"));
      } else {
        throw new Error(response.data?.error || strings.saveFailed);
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || strings.saveFailed);
      toast.error(err.message || strings.saveFailed);
      haptic.error();
    } finally {
      setSaving(false);
    }
  };

  const handleCancelReview = () => {
    const confirmMsg = language === 'th'
      ? 'ยกเลิกการแก้ไข? เครดิตถูกหักไปแล้วเมื่อสร้าง หากยกเลิกจะไม่มีการบันทึกจดหมาย'
      : language === 'zh'
      ? '取消编辑？生成时已扣除信用。如果取消，信件将不会被保存。'
      : language === 'ja'
      ? '編集をキャンセルしますか？生成時にクレジットは既に差し引かれています。キャンセルすると、レターは保存されません。'
      : language === 'ko'
      ? '편집을 취소하시겠습니까? 생성 시 크레딧이 이미 차감되었습니다. 취소하면 편지가 저장되지 않습니다.'
      : language === 'ru'
      ? 'Отменить редактирование? Кредит уже списан при генерации. Если отменить, письмо не будет сохранено.'
      : 'Cancel editing? Credit was already deducted on generation. If you cancel, the letter will not be saved.';
    
    if (window.confirm(confirmMsg)) {
      setReviewMode(false);
      setGeneratedLetter(null);
      setEditedContent({});
      setLanguagePack(null);
      setError(null);
      navigate(createPageUrl("Templates"));
    }
  };

  if (reviewMode && generatedLetter) {
    return (
      <div className="min-h-screen p-4 md:p-6 page-transition" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-5xl mx-auto">
          <PageHeader
            title={strings.reviewEditLetter}
            subtitle={strings.reviewEditLetterDesc}
            icon={Edit2}
            iconColor="#0C3B2E"
            showBack={true}
            backRoute={() => handleCancelReview()}
            isDarkMode={isDarkMode}
            actions={
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                {strings.creditDeductedRemaining.replace('{credits_remaining}', generatedLetter.credits_remaining || 0)}
              </Badge>
            }
          />

          {error && (
            <Card className="mb-4 border-2 border-red-500" style={{ backgroundColor: colors.cardBg }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-600">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
              <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Edit2 className="w-5 h-5" style={{ color: '#0C3B2E' }} />
                {strings.editContent}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {languagePack && languagePack.allLanguages.map((langCode) => {
                const label = getLanguageLabel(langCode, language);
                return (
                  <div key={langCode}>
                    <label htmlFor={`letter_${langCode}`} className="text-base font-semibold mb-3 block flex items-center gap-2" style={{ color: colors.textPrimary }}>
                      <Globe className="w-4 h-4" style={{ color: '#0C3B2E' }} />
                      {label}
                      {langCode === languagePack.primary && (
                        <Badge className="text-xs" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>Primary</Badge>
                      )}
                    </label>
                    <div className="mb-2 p-3 rounded-lg text-xs" style={{ 
                      backgroundColor: isDarkMode ? '#1F2937' : '#F0FDF4',
                      color: colors.textSecondary,
                      border: `1px solid ${isDarkMode ? '#374151' : '#86EFAC'}`
                    }}>
                      💡 {language === 'th' 
                        ? 'จดหมายมีโครงสร้างมาตรฐาน: วันที่ → ผู้รับ → หัวข้อ → เนื้อหา → ลายเซ็น'
                        : 'Letter follows standard structure: Date → Recipient → Subject → Body → Signature'}
                    </div>
                    <textarea
                      id={`letter_${langCode}`}
                      value={editedContent[langCode] || ''}
                      onChange={(e) => setEditedContent(prev => ({ ...prev, [langCode]: e.target.value }))}
                      rows={20}
                      className="font-sans w-full"
                      style={{
                        backgroundColor: colors.fieldBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary,
                        whiteSpace: 'pre-wrap',
                        padding: '16px',
                        borderRadius: '12px',
                        border: `2px solid ${colors.borderColor}`,
                        fontSize: '14px',
                        lineHeight: '1.8',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                      }}
                    />
                  </div>
                );
              })}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    haptic.light();
                    handleCancelReview();
                  }}
                  disabled={saving}
                  className="flex-1 btn-interaction"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary,
                  }}
                >
                  {strings.cancel}
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    haptic.medium();
                    try {
                      const response = await base44.functions.invoke('generateDocx', {
                        letterContent: editedContent,
                        languagePack: languagePack,
                        subject: formData.template_key,
                        tenant_name: formData.tenant_name,
                        landlord_name: formData.landlord_name,
                        property_address: formData.property_address,
                        recipientType: formData.recipientType
                      });
                      
                      if (response.data?.ok && response.data?.docx_url) {
                        const a = document.createElement('a');
                        a.href = response.data.docx_url;
                        a.download = response.data.filename || 'letter.docx';
                        a.click();
                        toast.success(language === 'th' ? 'ดาวน์โหลด DOCX สำเร็จ' : 'DOCX downloaded successfully');
                      }
                    } catch (err) {
                      console.error('DOCX generation failed:', err);
                      toast.error(language === 'th' ? 'ไม่สามารถสร้าง DOCX ได้' : 'Failed to generate DOCX');
                    }
                  }}
                  disabled={saving}
                  className="flex-1 btn-interaction"
                  style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {strings.downloadWord}
                </Button>
                <Button
                  onClick={() => {
                    haptic.medium();
                    handleSaveAfterReview();
                  }}
                  disabled={saving || Object.keys(editedContent).length === 0}
                  className="flex-1 btn-interaction"
                  style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {strings.saving}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {strings.saveLetter}
                    </>
                  )}
                </Button>
              </div>

              <div className="text-xs text-center pt-2" style={{ color: colors.textSecondary }}>
                {language === 'th'
                  ? 'เมื่อบันทึก จดหมายจะถูกเก็บในคลังหลักฐาน (เครดิตถูกหักไปแล้วเมื่อสร้าง)'
                  : language === 'zh'
                  ? '保存时，信件将存储在证据库中（生成时已扣除信用）'
                  : language === 'ja'
                  ? '保存時、レターは証拠保管庫に保存されます（生成時にクレジットは既に差し引かれています）'
                  : language === 'ko'
                  ? '저장 시 편지가 증거 보관소에 저장됩니다（생성 시 크레딧이 이미 차감됨）'
                  : language === 'ru'
                  ? 'При сохранении письмо будет сохранено в хранилище доказательств (кредит уже списан при генерации)'
                  : 'On save, the letter will be stored in Evidence Vault (credit already deducted on generation)'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 page-transition" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-3xl mx-auto">
        {generating && (
          <Card className="border-none shadow-lg mb-6" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <ProgressBar
                value={65}
                label={strings.generating}
                showPercentage={false}
                color="#0C3B2E"
                isDarkMode={isDarkMode}
                animated={true}
              />
            </CardContent>
          </Card>
        )}

        <button
          onClick={() => {
            haptic.light();
            navigate(-1);
          }}
          className="flex items-center gap-2 mb-6 text-sm font-medium hover:opacity-70 transition-opacity btn-interaction"
          style={{ color: colors.textSecondary }}
        >
          <ArrowLeft className="w-4 h-4" />
          {strings.back}
        </button>

        <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-3" style={{ color: colors.textPrimary }}>
              <FileText className="w-6 h-6" style={{ color: '#0C3B2E' }} />
              <div className="flex-1">
                <div className="text-xl font-bold">{strings.generateLetter}</div>
                <p className="text-sm font-normal mt-1" style={{ color: colors.textSecondary }}>
                  {strings.formDesc}
                </p>
              </div>
              {/* Credit Display */}
              <Badge className={`${userCredits > 0 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-red-100 text-red-700 border-red-200'} text-base px-3 py-1`}>
                {userCredits} {strings.creditsLabel}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            {/* Credit Warning */}
            {userCredits < 1 && (
              <div className="mb-6 p-4 rounded-lg border-2" style={{
                backgroundColor: isDarkMode ? 'rgb(58, 38, 38)' : '#FEE2E2',
                borderColor: isDarkMode ? 'rgb(80, 40, 40)' : '#FECACA',
                color: '#DC2626'
              }}>
                <p className="font-semibold mb-2">
                  {strings.insufficientCreditsWarningTitle}
                </p>
                <p className="text-sm">
                  {strings.insufficientCreditsWarningDesc}
                </p>
                <Button
                  onClick={() => navigate(createPageUrl("Account"))}
                  className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
                  size="sm"
                >
                  {strings.goToAccount}
                </Button>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-lg border-2" style={{
                backgroundColor: isDarkMode ? 'rgb(58, 38, 38)' : '#FEE2E2',
                borderColor: isDarkMode ? 'rgb(80, 40, 40)' : '#FECACA',
                color: '#DC2626'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-6">
              {/* SECTION 1: PARTIES */}
              <div>
                <h3 className="text-sm font-bold mb-4 pb-2 border-b" style={{ color: colors.textPrimary, borderColor: colors.borderColor }}>
                  {language === 'th' ? 'คู่สัญญา' : 'Parties'}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <MobileFormInput
                    label={`${strings.yourName} *`}
                    value={formData.tenant_name}
                    onChange={(e) => handleInputChange('tenant_name', e.target.value)}
                    placeholder="John Smith"
                    required
                    colors={colors}
                    disabled={generating}
                  />
                  
                  <MobileFormInput
                    label={`${strings.landlordName} *`}
                    value={formData.landlord_name}
                    onChange={(e) => handleInputChange('landlord_name', e.target.value)}
                    placeholder="Jane Doe"
                    required
                    colors={colors}
                    disabled={generating}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <MobileFormInput
                    label={language === 'th' ? 'ที่อยู่ผู้เช่า *' : 'Tenant Address *'}
                    value={formData.tenant_address}
                    onChange={(e) => handleInputChange('tenant_address', e.target.value)}
                    placeholder="123 Sukhumvit Rd, Bangkok 10110"
                    multiline
                    rows={3}
                    colors={colors}
                    disabled={generating}
                    required
                  />

                  <MobileFormInput
                    label={language === 'th' ? 'ที่อยู่เจ้าของบ้าน' : "Landlord Address"}
                    value={formData.landlord_address}
                    onChange={(e) => handleInputChange('landlord_address', e.target.value)}
                    placeholder="456 Silom Rd, Bangkok 10500"
                    multiline
                    rows={3}
                    colors={colors}
                    disabled={generating}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <MobileFormInput
                    label={language === 'th' ? 'อีเมล' : 'Email'}
                    type="email"
                    value={formData.tenant_email || ''}
                    onChange={(e) => handleInputChange('tenant_email', e.target.value)}
                    placeholder="tenant@example.com"
                    colors={colors}
                    disabled={generating}
                  />

                  <MobileFormInput
                    label={language === 'th' ? 'เบอร์โทร' : 'Phone'}
                    type="tel"
                    value={formData.tenant_phone || ''}
                    onChange={(e) => handleInputChange('tenant_phone', e.target.value)}
                    placeholder="+66 2 123 4567"
                    colors={colors}
                    disabled={generating}
                  />
                </div>
              </div>

              {/* SECTION 2: PROPERTY */}
              <div>
                <h3 className="text-sm font-bold mb-4 pb-2 border-b" style={{ color: colors.textPrimary, borderColor: colors.borderColor }}>
                  {language === 'th' ? 'ทรัพย์สิน' : 'Property'}
                </h3>
                <div className="space-y-4">
                  <MobileFormInput
                    label={`${strings.propertyAddress} *`}
                    value={formData.property_address}
                    onChange={(e) => handleInputChange('property_address', e.target.value)}
                    placeholder="789 Rama IV Rd, Khlong Toei, Bangkok 10110"
                    multiline
                    rows={3}
                    colors={colors}
                    disabled={generating}
                    required
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <MobileFormInput
                      label={language === 'th' ? 'ชื่อโครงการ/อาคาร' : 'Building / Project Name'}
                      value={formData.property_name}
                      onChange={(e) => handleInputChange('property_name', e.target.value)}
                      placeholder="The Residence"
                      colors={colors}
                      disabled={generating}
                    />

                    <MobileFormInput
                      label={language === 'th' ? 'หมายเลขห้อง' : 'Unit Number'}
                      value={formData.unit_number}
                      onChange={(e) => handleInputChange('unit_number', e.target.value)}
                      placeholder="12A"
                      colors={colors}
                      disabled={generating}
                    />
                  </div>

                  <MobileFormInput
                    label={strings.contractRef}
                    value={formData.contract_ref}
                    onChange={(e) => handleInputChange('contract_ref', e.target.value)}
                    placeholder="Lease dated 15 January 2024"
                    colors={colors}
                    disabled={generating}
                  />
                </div>
              </div>

              {/* SECTION 3: LANGUAGE OPTIONS */}
              <div>
                <h3 className="text-sm font-bold mb-4 pb-2 border-b" style={{ color: colors.textPrimary, borderColor: colors.borderColor }}>
                  {language === 'th' ? 'ตัวเลือกภาษา' : 'Language Options'}
                </h3>
                <Card className="border-2" style={{ borderColor: '#C7A338', backgroundColor: colors.fieldBg }}>
                <CardContent className="p-4 space-y-3">

                  {formData.recipientType === 'juristic' && (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#374151' : '#F0FDF4', border: `1px solid ${isDarkMode ? '#4B5563' : '#86EFAC'}` }}>
                      <p className="text-xs" style={{ color: colors.textPrimary }}>
                        {language === 'th' 
                          ? '📋 จดหมายนิติบุคคลจะสร้างเป็นภาษาไทยและอังกฤษเท่านั้น (ตามมาตรฐานในประเทศไทย)'
                          : language === 'zh'
                          ? '📋 法人信件将仅以泰语和英语生成（泰国标准）'
                          : language === 'ja'
                          ? '📋 法人レターはタイ語と英語のみで生成されます（タイの標準）'
                          : language === 'ko'
                          ? '📋 법인 편지는 태국어와 영어로만 생성됩니다 (태국 표준)'
                          : language === 'ru'
                          ? '📋 Письмо для юридического лица будет создано только на тайском и английском языках (стандарт Таиланда)'
                          : '📋 Juristic letters will be generated in Thai and English only (Thailand standard)'}
                      </p>
                    </div>
                  )}

                  {formData.recipientType === 'landlord' && user && (
                    <div className="space-y-3">
                      <div className="text-xs space-y-2" style={{ color: colors.textSecondary }}>
                        <p>
                          <strong style={{ color: colors.textPrimary }}>
                            {language === 'th' ? 'ภาษาหลัก:' : 'Primary language:'}
                          </strong> {language === 'th' ? 'ไทย + อังกฤษ' : 'Thai + English'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.includeThaiCopy}
                            onChange={(e) => handleInputChange('includeThaiCopy', e.target.checked)}
                            disabled={generating}
                            className="w-4 h-4 accent-ls-forest"
                          />
                          <span className="text-sm" style={{ color: colors.textPrimary }}>
                            {language === 'th' ? 'รวมภาษาไทย' : 'Include Thai translation'}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {formData.recipientType === 'tenant' && user && (
                    <div className="text-xs space-y-2" style={{ color: colors.textSecondary }}>
                      <p>
                        <strong style={{ color: colors.textPrimary }}>
                          {language === 'th' ? 'ภาษาของคุณ:' : 'Your language:'}
                        </strong> {getLanguageLabel(user?.language || 'en', language)} + {language === 'th' ? 'อังกฤษ' : 'English'}
                      </p>
                    </div>
                  )}
                </CardContent>
                </Card>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary,
                  }}
                  disabled={generating}
                >
                  {strings.cancel}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 btn-interaction"
                  style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                  disabled={generating || userCredits < 1}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {strings.generating}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {strings.generateButton}
                    </>
                  )}
                </Button>
              </div>
              <div className="text-xs text-center pt-2" style={{ color: colors.textSecondary }}>
                <p>{language === 'th' 
                  ? '💳 1 เครดิตจะถูกหักเมื่อสร้าง (ครอบคลุมทุกภาษา)'
                  : '💳 1 credit will be deducted on generation (covers all languages)'}</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TemplateForm() {
  return (
    <AuthGuard>
      <ToastProvider>
        <TemplateFormContent />
      </ToastProvider>
    </AuthGuard>
  );
}