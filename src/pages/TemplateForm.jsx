
import React, { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge"; // Import Badge component
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Loader2, FileText, Send, CheckCircle2, Download, Eye } from "lucide-react";
import { base44 } from "@/api/base44Client";
import LetterPreview from "../components/shared/LetterPreview";

export default function TemplateForm() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedUrls, setGeneratedUrls] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Get subject from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const subjectFromUrl = urlParams.get('subject') || 'deposit';

  const [formData, setFormData] = useState({
    tenant_name: '',
    landlord_name: '',
    property_address: '',
    contract_ref: '',
    deposit_amount_thb: '',
    example_item_1: '',
    example_item_2: '',
    example_item_3: '',
    breach_summary: '',
    settlement_amount: '',
    settlement_date: '',
    subject: subjectFromUrl
  });

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
    settlement: language === 'th' ? 'ยืนยันการตกลงชำระเงิน' : 'Settlement Confirmation'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tenant_name || !formData.landlord_name) {
      setError(strings.errorFillRequired);
      return;
    }

    // Check credits before proceeding
    if (userCredits < 1) {
      setError(strings.insufficientCreditsError);
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const payload = {
        subject: formData.subject,
        tenant_name: formData.tenant_name,
        landlord_name: formData.landlord_name,
        property_address: formData.property_address || undefined,
        contract_ref: formData.contract_ref || undefined,
      };

      if (['deposit', 'deductions'].includes(formData.subject)) {
        payload.deposit_amount = formData.deposit_amount_thb || undefined;
      }
      if (formData.subject === 'condition_dispute') {
        payload.example_item_1 = formData.example_item_1 || undefined;
        payload.example_item_2 = formData.example_item_2 || undefined;
        payload.example_item_3 = formData.example_item_3 || undefined;
      }
      if (formData.subject === 'non_compliance') {
        payload.breach_summary = formData.breach_summary || undefined;
      }
      if (formData.subject === 'settlement') {
        payload.settlement_amount = formData.settlement_amount || undefined;
        payload.settlement_date = formData.settlement_date || undefined;
      }

      const response = await base44.functions.invoke('generatePhase1Letter', payload);

      if (response.data?.ok) {
        setGeneratedUrls({
          html: response.data.urls?.html,
          doc: response.data.urls?.doc
        });
        setShowSuccess(true);
      } else {
        throw new Error(response.data?.error || 'Generation failed');
      }
    } catch (err) {
      console.error('Letter generation error:', err);
      setError(err.message || strings.errorGenerationFailed);
    } finally {
      setGenerating(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handlePreviewHtml = () => {
    setShowSuccess(false); // Close success dialog
    setShowPreview(true); // Open preview dialog
  };

  const handleDownloadWord = () => {
    if (generatedUrls?.doc) {
      window.open(generatedUrls.doc, '_blank', 'noopener,noreferrer');
    }
  };

  const handleGoToVault = () => {
    setShowSuccess(false);
    navigate(createPageUrl("DocumentVault"));
  };

  if (generating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: colors.bg }}>
        <Card className="max-w-md w-full border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {strings.generating}
            </h3>
            <p style={{ color: colors.textSecondary }}>
              {language === 'th' ? 'กำลังสร้างจดหมายของคุณ...' : 'Creating your letter...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

        {/* Letter Preview Dialog */}
        <LetterPreview
          open={showPreview}
          onOpenChange={setShowPreview}
          htmlUrl={generatedUrls?.html}
          docUrl={generatedUrls?.doc}
          title={letterTypeLabels[formData.subject]}
        />

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="sm:max-w-md" style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.borderColor
          }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3" style={{ color: colors.textPrimary }}>
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  {strings.successTitle}
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p style={{ color: colors.textSecondary }}>
                {strings.successDesc}
              </p>

              <div className="space-y-3">
                {/* Preview HTML Button */}
                <button
                  onClick={handlePreviewHtml}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all"
                  style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                    color: colors.textPrimary,
                    border: `2px solid ${colors.borderColor}`
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
                  <Eye className="w-5 h-5" />
                  {strings.previewHtml}
                </button>

                {/* Download Word Button */}
                <button
                  onClick={handleDownloadWord}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all"
                  style={{
                    backgroundColor: '#0C3B2E',
                    color: '#FFFFFF'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                >
                  <Download className="w-5 h-5" />
                  {strings.downloadWord}
                </button>

                {/* Go to Vault Button */}
                <button
                  onClick={handleGoToVault}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all"
                  style={{
                    backgroundColor: '#C7A338',
                    color: '#1A1D1F'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#d4af37'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#C7A338'}
                >
                  <FileText className="w-5 h-5" />
                  {strings.goToVault}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Letter Type - Display Only */}
              <div className="p-4 rounded-lg" style={{
                backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                border: `1px solid ${colors.borderColor}`
              }}>
                <Label style={{ color: colors.textSecondary, fontSize: '12px', fontWeight: '600' }}>
                  {strings.letterType}
                </Label>
                <p className="mt-1 text-lg font-semibold" style={{ color: colors.textPrimary }}>
                  {letterTypeLabels[formData.subject]}
                </p>
              </div>

              {/* Common Fields */}
              <div>
                <Label htmlFor="tenant_name" style={{ color: colors.textPrimary }}>
                  {strings.yourName} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tenant_name"
                  value={formData.tenant_name}
                  onChange={(e) => handleChange('tenant_name', e.target.value)}
                  placeholder={strings.yourNamePlaceholder}
                  required
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>

              <div>
                <Label htmlFor="landlord_name" style={{ color: colors.textPrimary }}>
                  {strings.landlordName} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="landlord_name"
                  value={formData.landlord_name}
                  onChange={(e) => handleChange('landlord_name', e.target.value)}
                  placeholder={strings.landlordNamePlaceholder}
                  required
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>

              <div>
                <Label htmlFor="property_address" style={{ color: colors.textPrimary }}>
                  {strings.propertyAddress}
                </Label>
                <Input
                  id="property_address"
                  value={formData.property_address}
                  onChange={(e) => handleChange('property_address', e.target.value)}
                  placeholder={strings.propertyAddressPlaceholder}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>

              <div>
                <Label htmlFor="contract_ref" style={{ color: colors.textPrimary }}>
                  {strings.contractRef}
                </Label>
                <Input
                  id="contract_ref"
                  value={formData.contract_ref}
                  onChange={(e) => handleChange('contract_ref', e.target.value)}
                  placeholder={strings.contractRefPlaceholder}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>

              {/* Conditional Fields Based on Letter Type */}
              {['deposit', 'deductions'].includes(formData.subject) && (
                <div>
                  <Label htmlFor="deposit_amount_thb" style={{ color: colors.textPrimary }}>
                    {strings.depositAmount}
                  </Label>
                  <Input
                    id="deposit_amount_thb"
                    type="number"
                    value={formData.deposit_amount_thb}
                    onChange={(e) => handleChange('deposit_amount_thb', e.target.value)}
                    placeholder="25000"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
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
                      onChange={(e) => handleChange('example_item_1', e.target.value)}
                      placeholder={strings.exampleItem1Placeholder}
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="example_item_2" style={{ color: colors.textPrimary }}>
                      {strings.exampleItem2}
                    </Label>
                    <Input
                      id="example_item_2"
                      value={formData.example_item_2}
                      onChange={(e) => handleChange('example_item_2', e.target.value)}
                      placeholder={strings.exampleItem2Placeholder}
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="example_item_3" style={{ color: colors.textPrimary }}>
                      {strings.exampleItem3}
                    </Label>
                    <Input
                      id="example_item_3"
                      value={formData.example_item_3}
                      onChange={(e) => handleChange('example_item_3', e.target.value)}
                      placeholder={strings.exampleItem3Placeholder}
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
                    />
                  </div>
                </>
              )}

              {formData.subject === 'non_compliance' && (
                <div>
                  <Label htmlFor="breach_summary" style={{ color: colors.textPrimary }}>
                    {strings.breachSummary}
                  </Label>
                  <textarea
                    id="breach_summary"
                    value={formData.breach_summary}
                    onChange={(e) => handleChange('breach_summary', e.target.value)}
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
                      onChange={(e) => handleChange('settlement_amount', e.target.value)}
                      placeholder={strings.settlementAmountPlaceholder}
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
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
                      onChange={(e) => handleChange('settlement_date', e.target.value)}
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
                    />
                  </div>
                </>
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
                >
                  {strings.cancel}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={generating || userCredits < 1}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {strings.generateButton}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
