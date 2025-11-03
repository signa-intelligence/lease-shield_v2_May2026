
import React, { useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Loader2, AlertCircle, FileText, User, Scale, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TemplateForm() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('caseId');

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(() => {
    const defaultRequestDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return {
      // Personal details
      tenant_name: '',
      landlord_name: '',
      property_address: '',

      // Case details
      contract_ref: 'Residential Lease Agreement',
      deposit_amount_thb: '',
      dispute_type: 'deposit',
      facts: '',
      request_by_date_iso: defaultRequestDate,
      attachments: '', // Will be parsed into an array
      tone: 'standard'
    };
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: caseItem } = useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => {
      if (!caseId) return null;
      try {
        const caseData = await base44.entities.Case.get(caseId);
        return caseData;
      } catch (err) {
        console.error("Failed to fetch case:", err);
        return null;
      }
    },
    enabled: !!caseId,
  });

  // Pre-fill form with case data if available
  useEffect(() => {
    if (caseItem) {
      setFormData(prev => ({
        ...prev,
        deposit_amount_thb: caseItem.dispute_amount ? String(caseItem.dispute_amount) : prev.deposit_amount_thb,
        dispute_type: caseItem.type || prev.dispute_type,
        facts: caseItem.summary || prev.facts,
        request_by_date_iso: caseItem.request_by_date_iso || prev.request_by_date_iso
      }));
    }
  }, [caseItem]);

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

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
      generateLetters: "Generate Letters",
      letterGeneration: "Letter Generation Form",
      formDesc: "Fill in the details below to generate your professional letters",
      personalDetails: "Personal Details",
      tenantName: "Your Full Name",
      tenantNamePlaceholder: "John Smith",
      landlordName: "Landlord's Full Name",
      landlordNamePlaceholder: "Jane Doe",
      propertyAddress: "Property Address",
      propertyAddressPlaceholder: "123 Main St, Bangkok 10110",
      caseDetails: "Case Details",
      contractRef: "Contract Reference",
      contractRefPlaceholder: "Lease Agreement dated 2024-01-15",
      depositAmount: "Deposit Amount (฿)",
      disputeType: "Dispute Type",
      facts: "Key Facts (one per line)",
      factsPlaceholder: "Moved out on 2024-10-12\nKeys returned same day\nNo damages noted",
      requestDate: "Response Deadline",
      attachments: "Attachments",
      attachmentsHelp: "List of documents you're including (e.g., Lease.pdf, Photos.zip)",
      tone: "Letter Tone",
      toneStandard: "Standard - Professional and neutral",
      toneSofter: "Softer - More empathetic",
      toneFirmer: "Firmer - More structured",
      generateButton: "Generate Letters",
      generating: "Generating Letters...",
      cancel: "Cancel",
      required: "Required",
      depositDispute: "Deposit Return",
      earlyTermination: "Early Termination",
      damages: "Damages Dispute",
      other: "Other",
      generatingTitle: "Creating Your Letters",
      generatingDesc: "Our AI is drafting professional bilingual letters for your case...",
      errorFillRequired: 'Please fill in tenant name, landlord name, and property address.',
      errorFillDeposit: 'Please fill in deposit amount.',
      errorGenerationFailed: 'Failed to generate letters. Please try again.'
    },
    th: {
      generateLetters: "สร้างจดหมาย",
      letterGeneration: "แบบฟอร์มสร้างจดหมาย",
      formDesc: "กรอกรายละเอียดด้านล่างเพื่อสร้างจดหมายมืออาชีพของคุณ",
      personalDetails: "รายละเอียดส่วนตัว",
      tenantName: "ชื่อเต็มของคุณ",
      tenantNamePlaceholder: "สมชาย ใจดี",
      landlordName: "ชื่อเต็มของเจ้าของบ้าน",
      landlordNamePlaceholder: "สมหญิง รักดี",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      propertyAddressPlaceholder: "123 ถนนสุขุมวิท แขวงคลองเตย กรุงเทพฯ 10110",
      caseDetails: "รายละเอียดคดี",
      contractRef: "อ้างอิงสัญญา",
      contractRefPlaceholder: "สัญญาเช่าลงวันที่ 15 มกราคม 2567",
      depositAmount: "จำนวนเงินมัดจำ (฿)",
      disputeType: "ประเภทข้อพิพาท",
      facts: "ข้อเท็จจริงสำคัญ (บรรทัดละรายการ)",
      factsPlaceholder: "ย้ายออกเมื่อ 12 ตุลาคม 2567\nคืนกุญแจในวันเดียวกัน\nไม่มีความเสียหาย",
      requestDate: "กำหนดเวลาตอบกลับ",
      attachments: "ไฟล์แนบ",
      attachmentsHelp: "รายการเอกสารที่คุณแนบมาด้วย (เช่น Lease.pdf, Photos.zip)",
      tone: "น้ำเสียงจดหมาย",
      toneStandard: "มาตรฐาน - เป็นมืออาชีพและเป็นกลาง",
      toneSofter: "อ่อนโยน - เห็นอกเห็นใจมากขึ้น",
      toneFirmer: "เข้มงวด - มีโครงสร้างมากขึ้น",
      generateButton: "สร้างจดหมาย",
      generating: "กำลังสร้างจดหมาย...",
      cancel: "ยกเลิก",
      required: "จำเป็น",
      depositDispute: "คืนเงินมัดจำ",
      earlyTermination: "ยกเลิกสัญญาก่อนกำหนด",
      damages: "ข้อพิพาทความเสียหาย",
      other: "อื่นๆ",
      generatingTitle: "กำลังสร้างจดหมายของคุณ",
      generatingDesc: "AI กำลังร่างจดหมายมืออาชีพสองภาษาสำหรับคดีของคุณ...",
      errorFillRequired: 'กรุณากรอกชื่อผู้เช่า ชื่อเจ้าของบ้าน และที่อยู่ทรัพย์สิน',
      errorFillDeposit: 'กรุณากรอกจำนวนเงินมัดจำ',
      errorGenerationFailed: 'ไม่สามารถสร้างจดหมายได้ กรุณาลองอีกครั้ง'
    }
  };

  const strings = t[language];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.tenant_name || !formData.landlord_name || !formData.property_address) {
      setError(strings.errorFillRequired);
      return;
    }

    // Only require deposit amount for deposit-related disputes
    if (formData.dispute_type === 'deposit' && !formData.deposit_amount_thb) {
      setError(strings.errorFillDeposit);
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // Parse facts from textarea (one per line)
      const factsArray = formData.facts
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      // Parse attachments from textarea (one per line)
      const attachmentsArray = formData.attachments
        .split('\n')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      const payload = {
        caseId: caseId || `temp-${Date.now()}`,
        tenant_name: formData.tenant_name,
        landlord_name: formData.landlord_name,
        property_address: formData.property_address,
        contract_ref: formData.contract_ref || 'Residential Lease Agreement',
        deposit_amount_thb: formData.deposit_amount_thb ? parseFloat(formData.deposit_amount_thb) : null,
        dispute_type: formData.dispute_type,
        facts: factsArray.length > 0 ? factsArray : [
          'Tenant moved out and returned keys on the agreed date',
          'No damages noted during handover'
        ],
        request_by_date_iso: formData.request_by_date_iso,
        attachments: attachmentsArray.length > 0 ? attachmentsArray : ['Lease.pdf', 'Photos.zip'],
        tone: formData.tone,
        language: language
      };

      console.log('Generating letters with payload:', payload);

      const response = await base44.functions.invoke('generateLetters', payload);

      console.log('Letters generated:', response.data);

      if (response.data?.success) {
        // If there's a case ID and it's not temporary, go to case details
        if (caseId && !response.data.isTemporary) {
          navigate(createPageUrl("CaseDetails") + `?caseId=${caseId}`);
        } else {
          // For standalone letter generation, go to documents page
          navigate(createPageUrl("DocumentVault"));
        }
      } else {
        throw new Error('Letter generation failed - no success response');
      }
    } catch (err) {
      console.error('Letter generation error:', err);
      setError(err.message || strings.errorGenerationFailed);
      setGenerating(false); // Make sure generating state is reset on error
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  if (generating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: colors.bg }}>
        <Card className="max-w-md w-full border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {strings.generatingTitle}
            </h3>
            <p style={{ color: colors.textSecondary }}>
              {language === 'th'
                ? 'กำลังร่างจดหมายมืออาศพสองภาษาสำหรับคดีของคุณ...'
                : 'Drafting professional bilingual letters for your case...'}
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
          {language === 'th' ? 'กลับ' : 'Back'}
        </button>

        <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-3" style={{ color: colors.textPrimary }}>
              <FileText className="w-6 h-6 text-purple-600" />
              <div>
                <div className="text-xl font-bold">{strings.letterGeneration}</div>
                <p className="text-sm font-normal mt-1" style={{ color: colors.textSecondary }}>
                  {strings.formDesc}
                </p>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            {error && (
              <div className="mb-6 p-4 rounded-lg border-2" style={{
                backgroundColor: isDarkMode ? 'rgb(58, 38, 38)' : '#FEE2E2',
                borderColor: isDarkMode ? 'rgb(80, 40, 40)' : '#FECACA'
              }}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details Section */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <User className="w-5 h-5 text-blue-600" />
                  {strings.personalDetails}
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tenant_name" style={{ color: colors.textPrimary }}>
                      {strings.tenantName} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tenant_name"
                      type="text"
                      required
                      value={formData.tenant_name}
                      onChange={(e) => handleChange('tenant_name', e.target.value)}
                      placeholder={strings.tenantNamePlaceholder}
                      className="mt-2"
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
                      type="text"
                      required
                      value={formData.landlord_name}
                      onChange={(e) => handleChange('landlord_name', e.target.value)}
                      placeholder={strings.landlordNamePlaceholder}
                      className="mt-2"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="property_address" style={{ color: colors.textPrimary }}>
                      {strings.propertyAddress} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="property_address"
                      type="text"
                      required
                      value={formData.property_address}
                      onChange={(e) => handleChange('property_address', e.target.value)}
                      placeholder={strings.propertyAddressPlaceholder}
                      className="mt-2"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Case Details Section */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <Scale className="w-5 h-5 text-purple-600" />
                  {strings.caseDetails}
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contract_ref" style={{ color: colors.textPrimary }}>
                      {strings.contractRef}
                    </Label>
                    <Input
                      id="contract_ref"
                      type="text"
                      value={formData.contract_ref}
                      onChange={(e) => handleChange('contract_ref', e.target.value)}
                      placeholder={strings.contractRefPlaceholder}
                      className="mt-2"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Only show deposit amount for deposit disputes */}
                    {formData.dispute_type === 'deposit' && (
                      <div>
                        <Label htmlFor="deposit_amount" style={{ color: colors.textPrimary }}>
                          {strings.depositAmount} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="deposit_amount"
                          type="number"
                          required
                          value={formData.deposit_amount_thb}
                          onChange={(e) => handleChange('deposit_amount_thb', e.target.value)}
                          placeholder="24900"
                          className="mt-2"
                          style={{
                            backgroundColor: colors.inputBg,
                            borderColor: colors.borderColor,
                            color: colors.textPrimary
                          }}
                        />
                      </div>
                    )}

                    <div className={formData.dispute_type === 'deposit' ? '' : 'sm:col-span-2'}>
                      <Label htmlFor="dispute_type" style={{ color: colors.textPrimary }}>
                        {strings.disputeType}
                      </Label>
                      <Select
                        value={formData.dispute_type}
                        onValueChange={(value) => handleChange('dispute_type', value)}
                      >
                        <SelectTrigger className="mt-2" style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.borderColor,
                          color: colors.textPrimary,
                        }}>
                          <SelectValue placeholder={strings.disputeType} />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
                          <SelectItem value="deposit" style={{ color: colors.textPrimary }}>{strings.depositDispute}</SelectItem>
                          <SelectItem value="early_termination" style={{ color: colors.textPrimary }}>{strings.earlyTermination}</SelectItem>
                          <SelectItem value="damages" style={{ color: colors.textPrimary }}>{strings.damages}</SelectItem>
                          <SelectItem value="other" style={{ color: colors.textPrimary }}>{strings.other}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="facts" style={{ color: colors.textPrimary }}>
                      {strings.facts}
                    </Label>
                    <Textarea
                      id="facts"
                      value={formData.facts}
                      onChange={(e) => handleChange('facts', e.target.value)}
                      placeholder={strings.factsPlaceholder}
                      rows={4}
                      className="mt-2"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="request_date" style={{ color: colors.textPrimary }}>
                      {strings.requestDate}
                    </Label>
                    <Input
                      id="request_date"
                      type="date"
                      value={formData.request_by_date_iso}
                      onChange={(e) => handleChange('request_by_date_iso', e.target.value)}
                      className="mt-2"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="attachments" style={{ color: colors.textPrimary }}>
                      {strings.attachments}
                    </Label>
                    <Textarea
                      id="attachments"
                      value={formData.attachments}
                      onChange={(e) => handleChange('attachments', e.target.value)}
                      placeholder={strings.attachmentsHelp}
                      rows={2}
                      className="mt-2"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
                    />
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>{strings.attachmentsHelp}</p>
                  </div>

                  <div>
                    <Label htmlFor="tone" style={{ color: colors.textPrimary }}>
                      {strings.tone}
                    </Label>
                    <Select
                      value={formData.tone}
                      onValueChange={(value) => handleChange('tone', value)}
                    >
                      <SelectTrigger className="mt-2" style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary,
                      }}>
                        <SelectValue placeholder={strings.tone} />
                      </SelectTrigger>
                        <SelectContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
                        <SelectItem value="standard" style={{ color: colors.textPrimary }}>{strings.toneStandard}</SelectItem>
                        <SelectItem value="softer" style={{ color: colors.textPrimary }}>{strings.toneSofter}</SelectItem>
                        <SelectItem value="firmer" style={{ color: colors.textPrimary }}>{strings.toneFirmer}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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
                  disabled={generating}
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
