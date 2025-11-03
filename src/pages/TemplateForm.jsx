
import React, { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Loader2, FileText, User, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TemplateForm() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  // Get subject from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const subjectFromUrl = urlParams.get('subject') || 'deposit';
  
  const [formData, setFormData] = useState({
    tenant_name: '',
    landlord_name: '',
    property_address: '',
    contract_ref: '',
    deposit_amount_thb: '',
    subject: subjectFromUrl
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

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
      contractRefPlaceholder: "Lease dated January 15, 2024",
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
      errorGenerationFailed: 'Failed to generate letter. Please try again.'
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
      contractRefPlaceholder: "สัญญาเช่าลงวันที่ 15 มกราคม 2567",
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
      errorGenerationFailed: 'ไม่สามารถสร้างจดหมายได้ กรุณาลองอีกครั้ง'
    }
  };

  const strings = t[language];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tenant_name || !formData.landlord_name) {
      setError(strings.errorFillRequired);
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('generatePhase1Letter', {
        subject: formData.subject,
        tenant_name: formData.tenant_name,
        landlord_name: formData.landlord_name,
        property_address: formData.property_address || undefined,
        contract_ref: formData.contract_ref || undefined,
        deposit_amount: formData.deposit_amount_thb || undefined
      });

      if (response.data?.ok) {
        const url = response.data.urls.pdf || response.data.urls.html;
        alert(`✅ ${language === 'th' ? 'สร้างจดหมายสำเร็จ!' : 'Letter generated!'}\n\n${language === 'th' ? 'ดู:' : 'View:'} ${url}`);
        navigate(createPageUrl("DocumentVault"));
      } else {
        throw new Error(response.data?.error || 'Generation failed');
      }
    } catch (err) {
      console.error('Letter generation error:', err);
      setError(strings.errorGenerationFailed);
    } finally {
      setGenerating(false);
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

        <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-3" style={{ color: colors.textPrimary }}>
              <FileText className="w-6 h-6 text-purple-600" />
              <div>
                <div className="text-xl font-bold">{strings.generateLetter}</div>
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
                borderColor: isDarkMode ? 'rgb(80, 40, 40)' : '#FECACA',
                color: '#DC2626'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="subject" style={{ color: colors.textPrimary }}>
                  {strings.letterType} <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.subject} onValueChange={(value) => handleChange('subject', value)}>
                  <SelectTrigger style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary,
                  }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
                    <SelectItem value="deposit" style={{ color: colors.textPrimary }}>{strings.depositReturn}</SelectItem>
                    <SelectItem value="damages" style={{ color: colors.textPrimary }}>{strings.damageDispute}</SelectItem>
                    <SelectItem value="early_termination" style={{ color: colors.textPrimary }}>{strings.earlyTermination}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

              {formData.subject === 'deposit' && (
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
