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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TEMPLATES = [
  {
    id: 'lease_negotiation',
    letterKey: 'N1',
    name_en: 'Pre-Signing Lease Negotiation',
    name_th: 'จดหมายทบทวนสัญญาก่อนลงนาม',
    description_en: 'Request clarification of concerning lease terms before signing',
    description_th: 'ขอชี้แจงข้อกำหนดที่น่ากังวลก่อนการลงนามสัญญา',
    icon: FileText,
    color: 'from-amber-400 to-orange-600',
    preSigning: true,
    creditCost: 1
  },
  {
    id: 'deposit',
    letterKey: 'L1',
    name_en: 'Deposit Return Request',
    name_th: 'จดหมายขอคืนเงินมัดจำ',
    description_en: 'Friendly formal request for security deposit return',
    description_th: 'จดหมายทางการสุภาพขอคืนเงินประกัน',
    icon: Shield,
    color: 'from-blue-400 to-blue-600',
    creditCost: 1
  },
  {
    id: 'deductions',
    letterKey: 'L2',
    name_en: 'Request for Itemised Deductions',
    name_th: 'ขอรายละเอียดการหักเงิน',
    description_en: 'Request breakdown of damage charges and deductions',
    description_th: 'ขอรายละเอียดค่าเสียหายและการหักเงินแบบแยกรายการ',
    icon: FileText,
    color: 'from-amber-400 to-amber-600',
    creditCost: 1
  },
  {
    id: 'reminder',
    letterKey: 'L3',
    name_en: 'Friendly Reminder',
    name_th: 'จดหมายเตือนแบบมิตร',
    description_en: 'Gentle follow-up on pending deposit return',
    description_th: 'จดหมายติดตามความคืบหน้าอย่างสุภาพ',
    icon: Mail,
    color: 'from-purple-400 to-purple-600',
    creditCost: 1
  },
  {
    id: 'dispute',
    letterKey: 'P1',
    name_en: 'Formal Dispute of Withholding',
    name_th: 'จดหมายคัดค้านการระงับเงิน',
    description_en: 'Formal dispute of unfair deposit withholding',
    description_th: 'จดหมายคัดค้านการระงับเงินประกันอย่างเป็นทางการ',
    icon: Scale,
    color: 'from-emerald-500 to-emerald-700',
    creditCost: 1
  },
  {
    id: 'early_termination',
    letterKey: 'P2',
    name_en: 'Early Termination Reconciliation',
    name_th: 'ประสานยุติสัญญาก่อนกำหนด',
    description_en: 'Coordinate early lease termination details',
    description_th: 'ประสานรายละเอียดการยุติสัญญาก่อนกำหนด',
    icon: FileX,
    color: 'from-teal-500 to-teal-700',
    creditCost: 1
  },
  {
    id: 'condition_dispute',
    letterKey: 'P3',
    name_en: 'Property Condition Dispute',
    name_th: 'โต้แย้งสภาพทรัพย์สิน',
    description_en: 'Dispute claimed property damages',
    description_th: 'โต้แย้งการเรียกร้องค่าเสียหายทรัพย์สิน',
    icon: Camera,
    color: 'from-cyan-500 to-cyan-700',
    creditCost: 1
  },
  {
    id: 'evidence',
    letterKey: 'P4',
    name_en: 'Request for Evidence',
    name_th: 'ขอหลักฐานประกอบ',
    description_en: 'Request supporting documents for claimed damages',
    description_th: 'ขอเอกสารหลักฐานสำหรับค่าเสียหายที่อ้าง',
    icon: FileText,
    color: 'from-sky-500 to-sky-700',
    creditCost: 1
  },
  {
    id: 'final_opportunity',
    letterKey: 'S1',
    name_en: 'Final Opportunity',
    name_th: 'โอกาสสุดท้าย',
    description_en: 'Last chance before formal escalation',
    description_th: 'โอกาสสุดท้ายก่อนดำเนินการทางกฎหมาย',
    icon: AlertTriangle,
    color: 'from-orange-600 to-red-600',
    creditCost: 1
  },
  {
    id: 'non_compliance',
    letterKey: 'S2',
    name_en: 'Notice of Non-Compliance',
    name_th: 'แจ้งไม่ปฏิบัติตามสัญญา',
    description_en: 'Official notice of contract breach',
    description_th: 'แจ้งการฝ่าฝืนสัญญาอย่างเป็นทางการ',
    icon: Gavel,
    color: 'from-red-600 to-red-800',
    creditCost: 1
  },
  {
    id: 'settlement',
    letterKey: 'S3',
    name_en: 'Settlement Confirmation',
    name_th: 'ยืนยันการตกลงชำระเงิน',
    description_en: 'Confirm successful deposit transfer',
    description_th: 'ยืนยันการคืนเงินประกันสำเร็จ',
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
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    inputBg: '#353A3D',
    borderColor: '#3A3D40'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    inputBg: '#FFFFFF',
    borderColor: '#E5E7EB'
  };

  const t = {
    en: {
      title: "Legal Letter Templates",
      subtitle: "Professional bilingual escalation ladder - all templates available",
      creditBalance: "Credit Balance",
      credits: "Credits",
      allLetters: "All Letters (11 Templates)",
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
      adminOnly: "Admin Only"
    },
    th: {
      title: "เทมเพลตจดหมายทางกฎหมาย",
      subtitle: "บันไดการยกระดับมืออาชีพสองภาษา - ทุกเทมเพลตพร้อมใช้งาน",
      creditBalance: "เครดิตคงเหลือ",
      credits: "เครดิต",
      allLetters: "จดหมายทั้งหมด (11 เทมเพลต)",
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
      adminOnly: "สำหรับแอดมินเท่านั้น"
    }
  };

  const strings = t[language];

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
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFormData({ ...uploadFormData, file });
    }
  };

  const handleUploadTemplate = async () => {
    if (!uploadFormData.file || !uploadFormData.title_en || !uploadFormData.title_th) {
      alert(language === 'th' 
        ? 'กรุณากรอกข้อมูลให้ครบถ้วนและเลือกไฟล์' 
        : 'Please fill in all fields and select a file');
      return;
    }

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

      alert(language === 'th' ? 'อัปโหลดเทมเพลตสำเร็จ!' : 'Template uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert(language === 'th' ? 'อัปโหลดล้มเหลว กรุณาลองอีกครั้ง' : 'Upload failed. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Organize templates by category
  const preSigningTemplates = [...TEMPLATES.filter(t => t.preSigning), ...customTemplates.filter(t => t.category === 'pre_signing')];
  const liteTemplates = [...TEMPLATES.filter(t => ['deposit', 'deductions', 'reminder'].includes(t.id)), ...customTemplates.filter(t => t.category === 'friendly')];
  const protectTemplates = [...TEMPLATES.filter(t => ['dispute', 'early_termination', 'condition_dispute', 'evidence'].includes(t.id)), ...customTemplates.filter(t => t.category === 'professional')];
  const secureTemplates = [...TEMPLATES.filter(t => ['final_opportunity', 'non_compliance', 'settlement'].includes(t.id)), ...customTemplates.filter(t => t.category === 'final')];

  const handleTemplateClick = (template) => {
    // For built-in templates, check credits and navigate to form
    if (template.id) {
      if (userCredits >= template.creditCost) {
        navigate(createPageUrl("TemplateForm") + `?subject=${template.id}`);
      }
    } else {
      // For custom uploaded templates, open the file directly
      if (userCredits >= template.credit_cost) {
        window.open(template.file_url, '_blank');
      }
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
              : (language === 'th' ? template.name_th : template.name_en)
            }
          </h3>

          <p className="text-xs sm:text-sm mb-4" style={{ color: colors.textSecondary }}>
            {isCustom
              ? (language === 'th' ? template.description_th : template.description_en)
              : (language === 'th' ? template.description_th : template.description_en)
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
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'th' ? 'กลับ' : 'Back'}
        </Button>

        <div className="mb-8">
          <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-ls-forest" />
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
            </div>
            {isAdmin && (
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="bg-ls-forest hover:bg-ls-forest/90"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                {strings.uploadTemplate}
              </Button>
            )}
          </div>
          <p className="text-sm sm:text-base mb-4" style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
          
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs sm:text-sm">
            {strings.allLetters}
          </Badge>
        </div>

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

        {/* SIMPLIFIED CREDIT BALANCE SECTION */}
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
                  onClick={() => navigate(createPageUrl("Account"))}
                  className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 w-full md:w-auto"
                >
                  <Coins className="w-4 h-4 mr-2" />
                  {strings.purchaseCredits}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
            {preSigningTemplates.map((template) => renderTemplateCard(template, !template.id))}
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
            {liteTemplates.map((template) => renderTemplateCard(template, !template.id))}
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
            {protectTemplates.map((template) => renderTemplateCard(template, !template.id))}
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