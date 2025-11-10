
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Loader2, FileText, Send, AlertCircle, Edit2, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TemplateForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [generatedLetter, setGeneratedLetter] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [editedContent, setEditedContent] = useState({ letter_en: '', letter_th: '' });

  // Get subject from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedSubject = urlParams.get('subject');

  const [formData, setFormData] = useState({
    subject: '',
    tenant_name: '',
    landlord_name: '',
    property_address: '',
    contract_ref: '',
    deposit_amount: '',
    example_item_1: '',
    example_item_2: '',
    example_item_3: '',
    breach_summary: '',
    settlement_amount: '',
    settlement_date: '',
    concerns_list: ''
  });

  // Effect to set initial subject from URL, runs once on mount
  useEffect(() => {
    if (preSelectedSubject) {
      setFormData(prev => ({ ...prev, subject: preSelectedSubject }));
    }
  }, [preSelectedSubject]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const userCredits = user?.letter_credits || 0;

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
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    inputBg: '#FFFFFF'
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
      creditsDeductedMessage: "1 credit will be deducted upon saving this letter."
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
      creditsDeductedMessage: "จะถูกหัก 1 เครดิตเมื่อบันทึกจดหมายนี้"
    }
  };

  const strings = t[language];

  const letterTypeLabels = {
    deposit: language === 'th' ? 'จดหมายขอคืนเงินมัดจำ' : 'Deposit Return Request',
    deductions: language === 'th' ? 'ขอรายละเอียดการหักเงิน' : 'Request for Itemised Deductions',
    reminder: language === 'th' ? 'จดหมายเตือนแบบมิตร' : 'Friendly Reminder',
    dispute: language === 'th' ? 'จดหมายคัดค้านการระงับเงิน' : 'Formal Dispute of Withholding',
    early_termination: language === 'th' ? 'ประสานยุติสัญญาก่อนกำหนด' : 'Early Termination Reconciliation',
    condition_dispute: language === 'th' ? 'โต้แย้งสภาพทรัพย์สิน' : 'Property Condition Dispute',
    evidence: language === 'th' ? 'ขอหลักฐานประกอบ' : 'Request for Evidence',
    final_opportunity: language === 'th' ? 'โอกาสสุดท้าย' : 'Final Opportunity',
    non_compliance: language === 'th' ? 'แจ้งไม่ปฏิบัติตามสัญญา' : 'Notice of Non-Compliance',
    settlement: language === 'th' ? 'ยืนยันการตกลงชำระเงิน' : 'Settlement Confirmation',
    general_concerns: language === 'th' ? 'ข้อกังวลทั่วไป' : 'General Concerns/Issues'
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.subject) {
      setError(language === 'th' ? 'กรุณาเลือกประเภทจดหมาย' : 'Please select a letter type');
      return;
    }
    if (!formData.tenant_name || !formData.landlord_name) {
      setError(strings.errorFillRequired);
      return;
    }

    // Credit check
    if (userCredits < 1) {
      setError(language === 'th'
        ? 'เครดิตไม่เพียงพอ กรุณาซื้อเครดิตเพื่อสร้างจดหมาย'
        : 'Insufficient credits. Please purchase credits to generate letters.');
      return;
    }

    setGenerating(true);
    try {
      // The backend `generatePhase1Letter` expects the full formData and handles specific fields based on subject
      // Call the backend function to generate the letter (credit is deducted here)
      const response = await base44.functions.invoke('generatePhase1Letter', formData);

      if (response.data?.ok) {
        // Refresh user credits immediately
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });

        // Store the generated content for review
        setGeneratedLetter(response.data);
        setEditedContent({
          letter_en: response.data.letter_content?.letter_en || '',
          letter_th: response.data.letter_content?.letter_th || ''
        });
        setReviewMode(true); // Enter review mode
      } else {
        throw new Error(response.data?.error || 'Generation failed');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || (language === 'th'
        ? 'ไม่สามารถสร้างจดหมายได้ กรุณาลองอีกครั้ง'
        : 'Failed to generate letter. Please try again.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAfterReview = async () => {
    if (!generatedLetter || !editedContent.letter_en || !editedContent.letter_th) {
      setError(language === 'th' ? 'กรุณาตรวจสอบเนื้อหาจดหมาย' : 'Please review letter content');
      return;
    }

    setSaving(true);
    setError(null); // Clear any previous error

    try {
      // Save the reviewed content (no credit deduction - already done)
      const response = await base44.functions.invoke('saveReviewedLetter', {
        ...formData, // Send all form data again
        letter_id: generatedLetter.letter_id, // Pass the letter_id from the initial generation response
        letter_en: editedContent.letter_en,
        letter_th: editedContent.letter_th,
      });

      if (response.data?.ok) {
        queryClient.invalidateQueries({ queryKey: ['documents'] });

        // Show success and navigate
        alert(language === 'th'
          ? 'บันทึกจดหมายสำเร็จ!'
          : 'Letter saved successfully!');

        navigate(createPageUrl("DocumentVault"));
      } else {
        throw new Error(response.data?.error || 'Save failed');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || (language === 'th'
        ? 'ไม่สามารถบันทึกได้ กรุณาลองอีกครั้ง'
        : 'Failed to save. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelReview = () => {
    if (window.confirm(language === 'th'
      ? 'ยกเลิกการแก้ไข? เครดิตถูกหักไปแล้ว หากยกเลิกจะไม่มีการบันทึกจดหมาย'
      : 'Cancel editing? Credit was already deducted. If you cancel, the letter will not be saved.')) {
      setReviewMode(false);
      setGeneratedLetter(null);
      setEditedContent({ letter_en: '', letter_th: '' });
      setError(null); // Clear any error
      navigate(createPageUrl("Templates"));
    }
  };

  // Review Mode UI
  if (reviewMode && generatedLetter) {
    return (
      <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-5xl mx-auto">
          <Button
            variant="ghost"
            onClick={handleCancelReview}
            className="mb-4 text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: colors.textSecondary }}
            disabled={saving}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {strings.back}
          </Button>

          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {language === 'th' ? 'ตรวจสอบและแก้ไขจดหมาย' : 'Review & Edit Letter'}
            </h1>
            <p style={{ color: colors.textSecondary }}>
              {language === 'th'
                ? 'ตรวจสอบเนื้อหาและแก้ไขตามต้องการ จากนั้นบันทึกไปยังคลังหลักฐาน'
                : 'Review the content and make any edits needed, then save to Evidence Vault.'}
            </p>
            <div className="mt-2">
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                {language === 'th'
                  ? `✅ เครดิตถูกหักแล้ว - เหลือ ${generatedLetter.credits_remaining || 0}`
                  : `✅ Credit deducted - ${generatedLetter.credits_remaining || 0} remaining`}
              </Badge>
            </div>
          </div>

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
                <Edit2 className="w-5 h-5 text-purple-600" /> {/* Kept original purple as ls-forest is not in colors */}
                {language === 'th' ? 'แก้ไขเนื้อหา' : 'Edit Content'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* English Version */}
              <div>
                <Label htmlFor="letter_en" className="text-base font-semibold mb-2 block" style={{ color: colors.textPrimary }}>
                  {language === 'th' ? 'จดหมายภาษาอังกฤษ' : 'English Letter'}
                </Label>
                <Textarea
                  id="letter_en"
                  value={editedContent.letter_en}
                  onChange={(e) => setEditedContent(prev => ({ ...prev, letter_en: e.target.value }))}
                  rows={15}
                  className="font-sans"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary,
                    whiteSpace: 'pre-wrap'
                  }}
                />
              </div>

              {/* Thai Version */}
              <div>
                <Label htmlFor="letter_th" className="text-base font-semibold mb-2 block" style={{ color: colors.textPrimary }}>
                  {language === 'th' ? 'จดหมายภาษาไทย' : 'Thai Letter'}
                </Label>
                <Textarea
                  id="letter_th"
                  value={editedContent.letter_th}
                  onChange={(e) => setEditedContent(prev => ({ ...prev, letter_th: e.target.value }))}
                  rows={15}
                  className="font-sans"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary,
                    whiteSpace: 'pre-wrap'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelReview}
                  disabled={saving}
                  className="flex-1"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary,
                  }}
                >
                  {strings.cancel}
                </Button>
                <Button
                  onClick={handleSaveAfterReview}
                  disabled={saving || !editedContent.letter_en || !editedContent.letter_th}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" // Using purple as ls-forest is not in colors
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {language === 'th' ? 'กำลังบันทึก...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {language === 'th' ? 'บันทึกจดหมาย' : 'Save Letter'}
                    </>
                  )}
                </Button>
              </div>

              <div className="text-xs text-center pt-2" style={{ color: colors.textSecondary }}>
                {language === 'th'
                  ? '💾 เมื่อบันทึก จดหมายจะถูกเก็บในคลังหลักฐาน (เครดิตถูกหักไปแล้ว)'
                  : '💾 On save, the letter will be stored in Evidence Vault (credit already deducted)'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Original Form UI - this block executes if not in reviewMode
  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 text-sm font-medium hover:opacity-70 transition-opacity"
          style={{ color: colors.textSecondary }}
        >
          <ArrowLeft className="w-4 h-4" />
          {strings.cancel}
        </button>

        <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-3" style={{ color: colors.textPrimary }}>
              <FileText className="w-6 h-6 text-purple-600" />
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

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Letter Type Selection - Replaced display-only with Select component */}
              <div>
                <Label htmlFor="letter_subject" style={{ color: colors.textPrimary }}>
                  {strings.letterType} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => handleInputChange('subject', value)}
                  disabled={generating} // Disable selection while generating
                >
                  <SelectTrigger
                    id="letter_subject"
                    className="w-full"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                  >
                    <SelectValue placeholder={strings.selectLetterTypePlaceholder}>
                      {formData.subject ? letterTypeLabels[formData.subject] : strings.selectLetterTypePlaceholder}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}>
                    {Object.entries(letterTypeLabels).map(([key, label]) => (
                      <SelectItem
                        key={key}
                        value={key}
                        style={{
                          backgroundColor: colors.cardBg,
                          color: colors.textPrimary
                        }}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              {/* Common Fields */}
              <div>
                <Label htmlFor="tenant_name" style={{ color: colors.textPrimary }}>
                  {strings.yourName} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tenant_name"
                  value={formData.tenant_name}
                  onChange={(e) => handleInputChange('tenant_name', e.target.value)}
                  placeholder={strings.yourNamePlaceholder}
                  required
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                  disabled={generating}
                />
              </div>

              <div>
                <Label htmlFor="landlord_name" style={{ color: colors.textPrimary }}>
                  {strings.landlordName} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="landlord_name"
                  value={formData.landlord_name}
                  onChange={(e) => handleInputChange('landlord_name', e.target.value)}
                  placeholder={strings.landlordNamePlaceholder}
                  required
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                  disabled={generating}
                />
              </div>

              <div>
                <Label htmlFor="property_address" style={{ color: colors.textPrimary }}>
                  {strings.propertyAddress}
                </Label>
                <Input
                  id="property_address"
                  value={formData.property_address}
                  onChange={(e) => handleInputChange('property_address', e.target.value)}
                  placeholder={strings.propertyAddressPlaceholder}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                  disabled={generating}
                />
              </div>

              <div>
                <Label htmlFor="contract_ref" style={{ color: colors.textPrimary }}>
                  {strings.contractRef}
                </Label>
                <Input
                  id="contract_ref"
                  value={formData.contract_ref}
                  onChange={(e) => handleInputChange('contract_ref', e.target.value)}
                  placeholder={strings.contractRefPlaceholder}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                  disabled={generating}
                />
              </div>

              {/* Conditional Fields Based on Letter Type */}
              {['deposit', 'deductions'].includes(formData.subject) && (
                <div>
                  <Label htmlFor="deposit_amount" style={{ color: colors.textPrimary }}>
                    {strings.depositAmount}
                  </Label>
                  <Input
                    id="deposit_amount"
                    type="number"
                    value={formData.deposit_amount}
                    onChange={(e) => handleInputChange('deposit_amount', e.target.value)}
                    placeholder="25000"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                    disabled={generating}
                  />
                </div>
              )}

              {formData.subject === 'condition_dispute' && (
                <>
                  <div>
                    <Label htmlFor="example_item_1" style={{ color: colors.textPrimary }}>
                      {strings.exampleItem1}
                    </Label>
                    <Input
                      id="example_item_1"
                      value={formData.example_item_1}
                      onChange={(e) => handleInputChange('example_item_1', e.target.value)}
                      placeholder={strings.exampleItem1Placeholder}
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
                      disabled={generating}
                    />
                  </div>
                  <div>
                    <Label htmlFor="example_item_2" style={{ color: colors.textPrimary }}>
                      {strings.exampleItem2}
                    </Label>
                    <Input
                      id="example_item_2"
                      value={formData.example_item_2}
                      onChange={(e) => handleInputChange('example_item_2', e.target.value)}
                      placeholder={strings.exampleItem2Placeholder}
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
                      disabled={generating}
                    />
                  </div>
                  <div>
                    <Label htmlFor="example_item_3" style={{ color: colors.textPrimary }}>
                      {strings.exampleItem3}
                    </Label>
                    <Input
                      id="example_item_3"
                      value={formData.example_item_3}
                      onChange={(e) => handleInputChange('example_item_3', e.target.value)}
                      placeholder={strings.exampleItem3Placeholder}
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
                      disabled={generating}
                    />
                  </div>
                </>
              )}

              {formData.subject === 'non_compliance' && (
                <div>
                  <Label htmlFor="breach_summary" style={{ color: colors.textPrimary }}>
                    {strings.breachSummary}
                  </Label>
                  <Textarea
                    id="breach_summary"
                    value={formData.breach_summary}
                    onChange={(e) => handleInputChange('breach_summary', e.target.value)}
                    placeholder={strings.breachSummaryPlaceholder}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      border: `1px solid ${colors.borderColor}`,
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    disabled={generating}
                  />
                </div>
              )}

              {formData.subject === 'settlement' && (
                <>
                  <div>
                    <Label htmlFor="settlement_amount" style={{ color: colors.textPrimary }}>
                      {strings.settlementAmount}
                    </Label>
                    <Input
                      id="settlement_amount"
                      type="number"
                      value={formData.settlement_amount}
                      onChange={(e) => handleInputChange('settlement_amount', e.target.value)}
                      placeholder={strings.settlementAmountPlaceholder}
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
                      disabled={generating}
                    />
                  </div>
                  <div>
                    <Label htmlFor="settlement_date" style={{ color: colors.textPrimary }}>
                      {strings.settlementDate}
                    </Label>
                    <Input
                      id="settlement_date"
                      type="date"
                      value={formData.settlement_date}
                      onChange={(e) => handleInputChange('settlement_date', e.target.value)}
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
                      disabled={generating}
                    />
                  </div>
                </>
              )}

              {formData.subject === 'general_concerns' && (
                <div>
                  <Label htmlFor="concerns_list" style={{ color: colors.textPrimary }}>
                    {strings.concernsList}
                  </Label>
                  <Textarea
                    id="concerns_list"
                    value={formData.concerns_list}
                    onChange={(e) => handleInputChange('concerns_list', e.target.value)}
                    placeholder={strings.concernsListPlaceholder}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      border: `1px solid ${colors.borderColor}`,
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    disabled={generating}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
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
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
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
                {strings.creditsDeductedMessage}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
