import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, ShoppingCart, AlertCircle } from "lucide-react";
import AuthGuard from "../components/shared/AuthGuard";
import { ToastProvider, useToast } from "../components/shared/Toast";
import { haptic } from "../components/shared/HapticFeedback";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import ConfirmDownloadModal from "../components/templates/ConfirmDownloadModal";

function TemplatesContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [downloading, setDownloading] = useState(null);
  const [confirmTemplate, setConfirmTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  


  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templateAssets'],
    queryFn: async () => {
      const allResults = await base44.entities.TemplateLibrary.list();

      // Filter: only valid active templates
      const validTemplates = allResults.filter(t => 
        t.status === 'active' &&
        t.template_key &&
        t.title_en &&
        t.description_en &&
        t.preview_en &&
        t.file_path
      );

      // Deduplicate by template_key
      const seenKeys = new Set();
      const uniqueTemplates = [];

      for (const t of validTemplates) {
        if (!seenKeys.has(t.template_key)) {
          seenKeys.add(t.template_key);
          uniqueTemplates.push(t);
        }
      }

      // Sort by category and sort_order
      uniqueTemplates.sort((a, b) => {
        const catOrder = { checklists: 1, pre_signing: 2, initial_resolution: 3, professional: 4, final: 5 };
        const catA = catOrder[a.category] || 99;
        const catB = catOrder[b.category] || 99;
        if (catA !== catB) return catA - catB;
        return (a.sort_order || 100) - (b.sort_order || 100);
      });
      
      return uniqueTemplates;
    }
  });

  const handleDownloadClick = (template) => {
    // Validate template has required fields
    const isValid = template.template_key && template.title_en && template.description_en && 
                    template.preview_en && template.file_path;
    
    if (!isValid) {
      toast.error(language === 'th' ? 'เทมเพลตไม่พร้อมใช้งานชั่วคราว' : 'Template temporarily unavailable');
      haptic.error();
      return;
    }
    
    setConfirmTemplate(template);
    document.body.style.overflow = 'hidden';
    const lisaFab = document.querySelector('.fab-bottom');
    if (lisaFab) lisaFab.style.display = 'none';
  };

  const handleCancelModal = () => {
    setConfirmTemplate(null);
    setPreviewTemplate(null);
  };

  React.useEffect(() => {
    // Unlock body scroll and restore chat FAB when modal closes
    if (!confirmTemplate && !previewTemplate) {
      document.body.style.overflow = '';
      const lisaFab = document.querySelector('.fab-bottom');
      if (lisaFab) lisaFab.style.display = '';
    }
    return () => {
      document.body.style.overflow = '';
      const lisaFab = document.querySelector('.fab-bottom');
      if (lisaFab) lisaFab.style.display = '';
    };
  }, [confirmTemplate, previewTemplate]);

  const handleConfirmDownload = async () => {
    const template = confirmTemplate;
    setConfirmTemplate(null);
    
    try {
      setDownloading(template.id);
      
      const response = await base44.functions.invoke('downloadTemplate', {
        template_key: template.template_key
      });

      // Read response - ALWAYS parse as text first to see errors
      const isSuccess = response.status === 200;
      let data;
      
      try {
        data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      } catch {
        data = { ok: false, message: 'Invalid response format' };
      }

      if (!isSuccess || !data.ok) {
        const errorParts = [
          data.step ? `[${data.step}]` : null,
          data.message || 'Unknown error'
        ].filter(Boolean);
        const errorText = errorParts.join(' ');
        
        console.error('[DOWNLOAD] Failed:', {
          status: response.status,
          data
        });
        
        toast.error(`Download failed: ${response.status} - ${errorText.substring(0, 220)}`);
        haptic.error();
        return;
      }

      // Success - open URL in new tab and use download anchor
      const downloadUrl = data.url;
      const filename = data.filename || `LeaseShield_${template.template_key}.docx`;

      // Try multiple download methods for compatibility
      // Method 1: Create download anchor (works on most mobile browsers)
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      a.target = '_blank';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);

      // Method 2: Also open in new tab as fallback
      setTimeout(() => {
        window.open(downloadUrl, '_blank');
      }, 200);
      
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success(language === 'th' ? 'ดาวน์โหลดสำเร็จ' : 'Download successful');
      haptic.success();
      
    } catch (error) {
      console.error('[DOWNLOAD] Exception:', error);
      toast.error(`Download failed: ${error.message?.substring(0, 220) || 'Unknown error'}`);
      haptic.error();
    } finally {
      setDownloading(null);
    }
  };

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const letterCredits = user?.letter_credits || 0;

  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#1F2937',
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
      title: "Document Templates",
      subtitle: "Download ready-to-use templates. Fill in your details and send to landlord.",
      creditsBalance: "Credits:",
      download: "Download",
      buyCredits: "Buy Credits",
      credit: "credit",
      noTemplates: "No templates available",
      confirmDownloadTitle: "Confirm Download",
      creditWillBeDeducted: "1 credit will be deducted",
      cancel: "Cancel",
      confirmDownload: "Confirm Download",
      previewUnavailable: "Preview not available",
      insideTemplate: "Inside this template:",
      mainSections: "Main sections:",
      includes: "Includes:",
      fillInFields: "Fill-in fields:",
      categories: {
        checklists: "Checklists",
        pre_signing: "Pre-Signing",
        initial_resolution: "Initial Resolution",
        professional: "Professional",
        final: "Final Notice"
      }
    },
    th: {
      title: "เทมเพลตเอกสาร",
      subtitle: "ดาวน์โหลดเทมเพลตพร้อมใช้ กรอกข้อมูลและส่งให้เจ้าของบ้าน",
      creditsBalance: "เครดิต:",
      download: "ดาวน์โหลด",
      buyCredits: "ซื้อเครดิต",
      credit: "เครดิต",
      noTemplates: "ไม่มีเทมเพลต",
      confirmDownloadTitle: "ยืนยันการดาวน์โหลด",
      creditWillBeDeducted: "จะหัก 1 เครดิต",
      cancel: "ยกเลิก",
      confirmDownload: "ยืนยันดาวน์โหลด",
      previewUnavailable: "ไม่มีตัวอย่าง",
      insideTemplate: "ภายในเทมเพลต:",
      mainSections: "ส่วนหลัก:",
      includes: "รวมถึง:",
      fillInFields: "ช่องกรอกข้อมูล:",
      categories: {
        checklists: "รายการตรวจสอบ",
        pre_signing: "ก่อนลงนาม",
        initial_resolution: "แก้ไขเบื้องต้น",
        professional: "มืออาชีพ",
        final: "แจ้งเตือนสุดท้าย"
      }
    }
  };

  const strings = t[language] || t.en;

  // Group templates by category
  const categorizedTemplates = templates.reduce((acc, template) => {
    const cat = template.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(template);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-6xl mx-auto flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#0C3B2E' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg, paddingBottom: '100px' }}>
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title={strings.title}
          subtitle={strings.subtitle}
          icon={FileText}
          iconColor="#0C3B2E"
          showBack={false}
          isDarkMode={isDarkMode}
          actions={
            <Card className="border-none shadow-md" style={{ backgroundColor: colors.cardBg }}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" style={{ color: '#0C3B2E' }} />
                  <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    {strings.creditsBalance}
                  </span>
                </div>
                <Badge className="text-lg font-bold px-4 py-1" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                  {letterCredits}
                </Badge>
              </CardContent>
            </Card>
          }
        />



        {templates.length === 0 ? (
          <div className="text-center py-12">
            <EmptyState
              icon={FileText}
              title={strings.noTemplates}
              description={language === 'th' 
                ? 'ไม่พบเทมเพลต' 
                : 'No templates found'}
              isDarkMode={isDarkMode}
            />
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(categorizedTemplates).map(([category, categoryTemplates]) => (
              <div key={category}>
                <h2 className="text-xl font-bold mb-4 pb-2 border-b" style={{ 
                  color: colors.textPrimary,
                  borderColor: colors.borderColor
                }}>
                  {strings.categories[category] || category}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTemplates.map((template) => {
                    const title = language === 'th' ? (template.title_th || template.title_en) : (template.title_en || template.title_th || 'Untitled Template');
                    const description = language === 'th' ? (template.description_th || template.description_en) : (template.description_en || template.description_th || '');
                    const creditCost = template.cost_credits || 1;
                    const canDownload = letterCredits >= creditCost;
                    const isDownloadingThis = downloading === template.id;

                    return (
                      <Card
                        key={template.id}
                        className="border-none shadow-md hover:shadow-lg transition-all card-interactive"
                        style={{ backgroundColor: colors.cardBg }}
                      >
                        <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                          <CardTitle className="flex items-start justify-between gap-2" style={{ color: colors.textPrimary }}>
                            <span className="text-base line-clamp-2">{title}</span>
                            <Badge className="flex-shrink-0 text-xs" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                              {creditCost} {strings.credit}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <p className="text-sm line-clamp-3" style={{ color: colors.textSecondary }}>
                            {description}
                          </p>



                          <div className="flex gap-2">
                            {canDownload ? (
                              <Button
                                onClick={() => handleDownloadClick(template)}
                                disabled={isDownloadingThis}
                                className="w-full"
                                style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                              >
                                {isDownloadingThis ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {language === 'th' ? 'กำลังดาวน์โหลด...' : 'Downloading...'}
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-4 h-4 mr-2" />
                                    {strings.download}
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => {
                                  haptic.light();
                                  navigate(createPageUrl("Account"));
                                }}
                                className="w-full"
                                style={{ backgroundColor: '#C7A338', color: '#FFFFFF' }}
                              >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                {strings.buyCredits}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Single Reusable Confirmation Modal */}
      <ConfirmDownloadModal
        template={confirmTemplate}
        onConfirm={handleConfirmDownload}
        onCancel={handleCancelModal}
        colors={colors}
        language={language}
        isDarkMode={isDarkMode}
      />


    </div>
  );
}

export default function Templates() {
  return (
    <AuthGuard>
      <ToastProvider>
        <TemplatesContent />
      </ToastProvider>
    </AuthGuard>
  );
}