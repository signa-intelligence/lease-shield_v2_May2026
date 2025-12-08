import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FileText, Copy, Download, CheckCircle2, ArrowLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/shared/Toast";
import { haptic } from "@/components/shared/HapticFeedback";
import { useNavigate } from "react-router-dom";

export default function LetterGenerator() {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editedBodyEn, setEditedBodyEn] = useState("");
  const [editedBodyTh, setEditedBodyTh] = useState("");
  const [step, setStep] = useState(1); // 1: select property, 2: select template, 3: preview/edit
  const toast = useToast();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['letterTemplates'],
    queryFn: () => base44.entities.LetterTemplate.filter({ is_active: true }),
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const mergeFields = useMemo(() => {
    if (!selectedProperty) return {};

    const deposit = deposits.find(d => d.id === selectedProperty);
    const lease = leases.find(l => l.property_address === deposit?.property_address);

    return {
      tenant_full_name: user?.full_name || '[ADD TENANT NAME]',
      tenant_address: user?.tenant_address || '[ADD TENANT ADDRESS]',
      landlord_name: deposit?.landlord_name || lease?.landlord_name || '[ADD LANDLORD NAME]',
      landlord_address: '[ADD LANDLORD ADDRESS]',
      juristic_name: '[ADD JURISTIC NAME]',
      property_name: deposit?.property_address || lease?.property_address || '[ADD PROPERTY NAME]',
      unit_number: '[ADD UNIT NUMBER]',
      contract_start_date: lease?.start_date || '[ADD START DATE]',
      contract_end_date: lease?.end_date || '[ADD END DATE]',
      today_date: new Date().toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      notice_period_days: lease?.notice_period_days || '[ADD NOTICE PERIOD]',
    };
  }, [selectedProperty, deposits, leases, user]);

  const applyMergeFields = (text) => {
    if (!text) return '';
    let merged = text;
    Object.entries(mergeFields).forEach(([key, value]) => {
      merged = merged.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return merged;
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.template_id === templateId);
    setSelectedTemplate(template);
    setEditedBodyEn(applyMergeFields(template.body_en));
    setEditedBodyTh(applyMergeFields(template.body_th));
    setStep(3);
    haptic.light();
  };

  const handleCopyToClipboard = () => {
    const fullText = `${editedBodyEn}\n\n${'='.repeat(80)}\n\n${editedBodyTh}`;
    navigator.clipboard.writeText(fullText);
    toast.success(language === 'th' ? 'คัดลอกแล้ว!' : 'Copied to clipboard!');
    haptic.medium();
  };

  const handleDownloadPDF = () => {
    const fullText = `${editedBodyEn}\n\n${'='.repeat(80)}\n\n${editedBodyTh}`;
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate.template_id}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(language === 'th' ? 'ดาวน์โหลดแล้ว!' : 'Downloaded!');
    haptic.medium();
  };

  const t = {
    en: {
      title: 'Letter Generator',
      subtitle: 'Generate bilingual letters and checklists',
      step1Title: 'Select Property',
      step2Title: 'Select Template',
      step3Title: 'Preview & Edit',
      selectProperty: 'Choose a property',
      selectTemplate: 'Choose a template',
      noProperties: 'No properties found. Add a deposit or lease first.',
      noTemplates: 'No templates available',
      category: 'Category',
      tone: 'Tone',
      preview: 'Preview',
      edit: 'Edit',
      copyClipboard: 'Copy to Clipboard',
      downloadPDF: 'Download',
      back: 'Back',
      next: 'Next',
      editEnglish: 'Edit English Version',
      editThai: 'Edit Thai Version',
    },
    th: {
      title: 'สร้างหนังสือและเช็คลิสต์',
      subtitle: 'สร้างเอกสารสองภาษา',
      step1Title: 'เลือกทรัพย์สิน',
      step2Title: 'เลือกแบบฟอร์ม',
      step3Title: 'ดูตัวอย่างและแก้ไข',
      selectProperty: 'เลือกทรัพย์สิน',
      selectTemplate: 'เลือกแบบฟอร์ม',
      noProperties: 'ไม่พบทรัพย์สิน กรุณาเพิ่มข้อมูลเงินมัดจำหรือสัญญาเช่าก่อน',
      noTemplates: 'ไม่มีแบบฟอร์ม',
      category: 'หมวดหมู่',
      tone: 'น้ำเสียง',
      preview: 'ดูตัวอย่าง',
      edit: 'แก้ไข',
      copyClipboard: 'คัดลอก',
      downloadPDF: 'ดาวน์โหลด',
      back: 'ย้อนกลับ',
      next: 'ถัดไป',
      editEnglish: 'แก้ไขภาษาอังกฤษ',
      editThai: 'แก้ไขภาษาไทย',
    }
  };

  const strings = t[language] || t.en;

  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: 'rgba(255,255,255,0.1)',
  } : {
    bg: '#F3F6F5',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#475569',
    border: 'rgba(12,59,46,0.08)',
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          {step > 1 && (
            <button
              onClick={() => {
                if (step === 3) {
                  setStep(2);
                  setSelectedTemplate(null);
                } else if (step === 2) {
                  setStep(1);
                  setSelectedProperty(null);
                }
                haptic.light();
              }}
              className="btn-interaction"
              style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
              }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: colors.text }} />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
              {strings.title}
            </h1>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {strings.subtitle}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm"
                style={{
                  backgroundColor: step >= s ? '#0C3B2E' : colors.cardBg,
                  color: step >= s ? '#FFFFFF' : colors.textSecondary,
                  border: `2px solid ${step >= s ? '#C7A338' : colors.border}`,
                }}
              >
                {s}
              </div>
              {s < 3 && (
                <ChevronRight className="w-4 h-4" style={{ color: colors.textSecondary }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Select Property */}
        {step === 1 && (
          <Card style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4" style={{ color: colors.text }}>
                {strings.step1Title}
              </h2>
              {deposits.length === 0 ? (
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {strings.noProperties}
                </p>
              ) : (
                <div className="space-y-3">
                  {deposits.map((deposit) => (
                    <button
                      key={deposit.id}
                      onClick={() => {
                        setSelectedProperty(deposit.id);
                        setStep(2);
                        haptic.light();
                      }}
                      className="w-full p-4 rounded-lg border text-left transition-all"
                      style={{
                        backgroundColor: selectedProperty === deposit.id ? '#0C3B2E' : colors.cardBg,
                        borderColor: selectedProperty === deposit.id ? '#C7A338' : colors.border,
                        color: selectedProperty === deposit.id ? '#FFFFFF' : colors.text,
                      }}
                    >
                      <div className="font-semibold">{deposit.property_address || 'Property'}</div>
                      <div className="text-sm opacity-70">
                        {language === 'th' ? 'เงินมัดจำ' : 'Deposit'}: ฿{deposit.deposit_amount?.toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Template */}
        {step === 2 && (
          <Card style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4" style={{ color: colors.text }}>
                {strings.step2Title}
              </h2>
              {templates.length === 0 ? (
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {strings.noTemplates}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.template_id)}
                      className="p-4 rounded-lg border text-left transition-all card-interactive"
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 flex-shrink-0" style={{ color: '#0C3B2E' }} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold mb-1" style={{ color: colors.text }}>
                            {language === 'th' ? template.title_th : template.title_en}
                          </div>
                          <div className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                            {strings.category}: {template.category} • {strings.tone}: {template.tone_level}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Preview & Edit */}
        {step === 3 && selectedTemplate && (
          <div className="space-y-4">
            <Card style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold" style={{ color: colors.text }}>
                    {language === 'th' ? selectedTemplate.title_th : selectedTemplate.title_en}
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopyToClipboard}
                      variant="outline"
                      size="sm"
                      className="btn-interaction"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {strings.copyClipboard}
                    </Button>
                    <Button
                      onClick={handleDownloadPDF}
                      size="sm"
                      className="btn-interaction"
                      style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {strings.downloadPDF}
                    </Button>
                  </div>
                </div>

                {/* English Version */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.text }}>
                    {strings.editEnglish}
                  </label>
                  <Textarea
                    value={editedBodyEn}
                    onChange={(e) => setEditedBodyEn(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                    style={{
                      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  />
                </div>

                {/* Thai Version */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.text }}>
                    {strings.editThai}
                  </label>
                  <Textarea
                    value={editedBodyTh}
                    onChange={(e) => setEditedBodyTh(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                    style={{
                      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}