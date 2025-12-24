import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, ShoppingCart, AlertCircle, Eye, X } from "lucide-react";
import AuthGuard from "../components/shared/AuthGuard";
import { ToastProvider, useToast } from "../components/shared/Toast";
import { haptic } from "../components/shared/HapticFeedback";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

function TemplatesContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [downloading, setDownloading] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [previewModal, setPreviewModal] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templateAssets'],
    queryFn: async () => {
      const results = await base44.entities.TemplateLibrary.filter({ status: 'active' }, 'sort_order');
      console.log('📄 Templates fetched:', results.length);
      console.log('📄 Template IDs:', results.map(t => t.id));
      
      // Deduplicate by template_key, keeping first occurrence
      const seen = new Set();
      const deduplicated = results.filter(t => {
        if (seen.has(t.template_key)) {
          console.warn(`⚠️ Duplicate template_key detected: ${t.template_key} (ID: ${t.id})`);
          return false;
        }
        seen.add(t.template_key);
        return true;
      });
      
      return deduplicated;
    }
  });

  const downloadMutation = useMutation({
    mutationFn: async (template) => {
      const response = await base44.functions.invoke('downloadTemplate', {
        template_id: template.id
      });

      if (!response.data?.ok) {
        throw new Error(response.data?.error || 'Download failed');
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      // Trigger file download
      if (data.download_url) {
        const link = document.createElement('a');
        link.href = data.download_url;
        link.download = data.filename || 'template.docx';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success(language === 'th' ? 'กำลังดาวน์โหลด' : 'Downloading template');
      haptic.success();
      setDownloading(null);
    },
    onError: (error) => {
      const errorMsg = error.message || '';
      
      if (errorMsg.includes('Insufficient credits')) {
        toast.error(language === 'th' ? 'เครดิตไม่เพียงพอ' : 'Insufficient credits');
      } else if (errorMsg.includes('not found')) {
        toast.error(language === 'th' ? 'ไม่พบเทมเพลต' : 'Template not found');
      } else {
        toast.error(language === 'th' ? 'ดาวน์โหลดล้มเหลว' : 'Download failed');
      }
      
      haptic.error();
      setDownloading(null);
    }
  });

  const handleDownload = async (template) => {
    haptic.light();
    setConfirmModal(template);
  };

  const confirmDownload = () => {
    if (!confirmModal) return;
    haptic.medium();
    setDownloading(confirmModal.id);
    downloadMutation.mutate(confirmModal);
    setConfirmModal(null);
  };

  const handlePreview = (template) => {
    haptic.light();
    setPreviewModal(template);
  };

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const letterCredits = user?.letter_credits || 0;

  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#1F2937',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)'
  } : {
    bg: '#F3F6F5',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderColor: 'rgba(12,59,46,0.08)'
  };

  const t = {
    en: {
      title: "Templates & Documents",
      subtitle: "Download editable Word templates. Fill in names and addresses yourself.",
      creditsBalance: "Credits:",
      download: "Download",
      buyCredits: "Buy Credits",
      credit: "credit",
      noTemplates: "No templates available",
      categories: {
        checklists: "Checklists",
        pre_signing: "Pre-Signing",
        initial_resolution: "Initial Resolution",
        professional: "Professional",
        final: "Final Demand"
      }
    },
    th: {
      title: "เทมเพลตและเอกสาร",
      subtitle: "ดาวน์โหลดเทมเพลต Word ที่แก้ไขได้ กรอกชื่อและที่อยู่ด้วยตัวเอง",
      creditsBalance: "เครดิต:",
      download: "ดาวน์โหลด",
      buyCredits: "ซื้อเครดิต",
      credit: "เครดิต",
      noTemplates: "ไม่มีเทมเพลต",
      categories: {
        checklists: "รายการตรวจสอบ",
        pre_signing: "ก่อนลงนาม",
        initial_resolution: "แก้ไขเบื้องต้น",
        professional: "มืออาชีพ",
        final: "เรียกร้องครั้งสุดท้าย"
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
          <EmptyState
            icon={FileText}
            title={strings.noTemplates}
            description="Templates exist but are not visible due to filters. Check entity data."
            isDarkMode={isDarkMode}
          />
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

                         {template.preview_image_url && (
                           <div 
                             className="relative rounded-lg overflow-hidden cursor-pointer group"
                             onClick={() => handlePreview(template)}
                             style={{ height: '120px', backgroundColor: colors.borderColor }}
                           >
                             <img 
                               src={template.preview_image_url} 
                               alt="Preview"
                               className="w-full h-full object-cover"
                               style={{ filter: 'blur(8px)', opacity: 0.6 }}
                             />
                             <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center group-hover:bg-opacity-50 transition-all">
                               <div className="text-center">
                                 <Eye className="w-6 h-6 text-white mx-auto mb-1" />
                                 <span className="text-xs text-white font-semibold">
                                   {language === 'th' ? 'ดูตัวอย่าง (เบลอ)' : 'View Preview (Blurred)'}
                                 </span>
                               </div>
                             </div>
                           </div>
                         )}

                         <div className="flex gap-2">
                           {template.preview_image_url && (
                             <Button
                               onClick={() => handlePreview(template)}
                               variant="outline"
                               className="flex-1 btn-interaction"
                               style={{ borderColor: colors.borderColor, color: colors.textPrimary }}
                             >
                               <Eye className="w-4 h-4 mr-2" />
                               {language === 'th' ? 'ดู' : 'Preview'}
                             </Button>
                           )}
                           {canDownload ? (
                             <Button
                               onClick={() => handleDownload(template)}
                               disabled={isDownloadingThis}
                               className={`${template.preview_image_url ? 'flex-1' : 'w-full'} btn-interaction`}
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
                               className="w-full btn-interaction"
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

        {/* Confirmation Modal */}
        {confirmModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => setConfirmModal(null)}
          >
            <div 
              className="w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 modal-enter"
              style={{ backgroundColor: colors.cardBg }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  {language === 'th' ? 'ดาวน์โหลดเทมเพลต?' : 'Download template?'}
                </h3>
                <button
                  onClick={() => setConfirmModal(null)}
                  className="p-2 rounded-full hover:bg-opacity-80 transition-all"
                  style={{ backgroundColor: colors.borderColor }}
                >
                  <X className="w-5 h-5" style={{ color: colors.textPrimary }} />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                  {language === 'th' ? confirmModal.title_th : confirmModal.title_en}
                </p>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {language === 'th' 
                    ? `การดาวน์โหลดนี้จะหัก ${confirmModal.cost_credits || 1} เครดิตจากบัญชีของคุณ`
                    : `This will deduct ${confirmModal.cost_credits || 1} credit from your account.`
                  }
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setConfirmModal(null)}
                  variant="outline"
                  className="flex-1 btn-interaction"
                  style={{ borderColor: colors.borderColor, color: colors.textPrimary }}
                >
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </Button>
                <Button
                  onClick={confirmDownload}
                  className="flex-1 btn-interaction"
                  style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {language === 'th' ? 'ยืนยันดาวน์โหลด' : 'Confirm Download'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            onClick={() => setPreviewModal(null)}
          >
            <div 
              className="w-full max-w-3xl rounded-2xl shadow-2xl p-6 space-y-4 modal-enter"
              style={{ backgroundColor: colors.cardBg }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  {language === 'th' ? previewModal.title_th : previewModal.title_en}
                </h3>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="p-2 rounded-full hover:bg-opacity-80 transition-all"
                  style={{ backgroundColor: colors.borderColor }}
                >
                  <X className="w-5 h-5" style={{ color: colors.textPrimary }} />
                </button>
              </div>

              {previewModal.preview_image_url ? (
                <div className="relative rounded-lg overflow-hidden" style={{ maxHeight: '60vh' }}>
                  <img 
                    src={previewModal.preview_image_url} 
                    alt="Template Preview"
                    className="w-full h-auto"
                    style={{ filter: 'blur(10px)', opacity: 0.7 }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="text-center p-6 rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <Eye className="w-12 h-12 text-white mx-auto mb-3" />
                      <p className="text-white font-bold text-lg mb-2">
                        {language === 'th' ? 'ตัวอย่างที่เบลอ' : 'Blurred Preview'}
                      </p>
                      <p className="text-white text-sm mb-4">
                        {language === 'th' 
                          ? 'ดาวน์โหลดเพื่อดูเอกสารแบบเต็ม'
                          : 'Download to access the full template'
                        }
                      </p>
                      <Button
                        onClick={() => {
                          setPreviewModal(null);
                          handleDownload(previewModal);
                        }}
                        style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {language === 'th' ? 'ดาวน์โหลดตอนนี้' : 'Download Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12" style={{ color: colors.textSecondary }}>
                  <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                  <p>{language === 'th' ? 'ไม่มีตัวอย่าง' : 'No preview available'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
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