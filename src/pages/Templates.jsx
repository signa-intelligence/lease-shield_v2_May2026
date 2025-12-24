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
      // DIAGNOSTIC: Fetch ALL templates first (no filters)
      const allResults = await base44.entities.TemplateLibrary.list();
      console.log('🔍 DIAGNOSTIC: Total templates in DB (no filters):', allResults.length);
      
      // Group by status
      const byStatus = allResults.reduce((acc, t) => {
        const status = t.status || 'undefined';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      console.log('🔍 DIAGNOSTIC: Templates by status:', byStatus);
      
      // RELAXED FILTER: Only exclude explicitly inactive templates
      const results = allResults.filter(t => {
        return t.status !== 'inactive' && t.status !== false;
      }).sort((a, b) => {
        // Sort by updated_date (newest first), then sort_order
        const dateA = new Date(a.updated_date || a.created_date || 0);
        const dateB = new Date(b.updated_date || b.created_date || 0);
        if (dateB - dateA !== 0) return dateB - dateA;
        return (a.sort_order || 100) - (b.sort_order || 100);
      });
      
      console.log('📄 Templates after relaxed filter:', results.length);
      
      // Deduplicate and track duplicates for deactivation
      const uniqueTemplates = [];
      const duplicatesToDeactivate = [];
      const seenKeys = new Map(); // Map of key -> first template
      
      for (const t of results) {
        // Primary key: template_key
        // Fallback key: title_en + category + (language indicator)
        const primaryKey = t.template_key;
        const fallbackKey = `${t.title_en || t.title_th}_${t.category}_${t.description_en?.includes('TH+EN') ? 'bilingual' : 'single'}`;
        const dedupeKey = primaryKey || fallbackKey;
        
        if (!seenKeys.has(dedupeKey)) {
          seenKeys.set(dedupeKey, t);
          uniqueTemplates.push(t);
        } else {
          // This is a duplicate - mark for deactivation
          console.warn(`⚠️ Duplicate detected: ${t.title_en} (ID: ${t.id}, key: ${dedupeKey})`);
          duplicatesToDeactivate.push(t.id);
        }
      }
      
      console.log('📄 Unique templates after deduplication:', uniqueTemplates.length);
      console.log('📄 Duplicates found:', duplicatesToDeactivate.length);
      
      // Deactivate duplicates in background (don't block UI)
      if (duplicatesToDeactivate.length > 0) {
        Promise.all(
          duplicatesToDeactivate.map(id => 
            base44.entities.TemplateLibrary.update(id, { status: 'inactive' })
              .catch(err => console.error(`Failed to deactivate template ${id}:`, err))
          )
        ).then(() => {
          console.log(`✅ Deactivated ${duplicatesToDeactivate.length} duplicate templates`);
        });
      }
      
      return uniqueTemplates;
    }
  });

  const handleDownloadClick = (template) => {
    setConfirmTemplate(template);
  };

  const handleConfirmDownload = async () => {
    const template = confirmTemplate;
    setConfirmTemplate(null);
    
    try {
      setDownloading(template.id);
      const response = await base44.functions.invoke('downloadTemplate', {
        template_id: template.id
      });

      if (!response.data?.ok) {
        toast.error(response.data?.error || 'Download failed');
        return;
      }

      // Trigger download with signed URL
      const link = document.createElement('a');
      link.href = response.data.download_url;
      link.download = response.data.filename || `${template.template_key}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Refresh credits
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      toast.success(language === 'th' ? 'ดาวน์โหลดสำเร็จ' : 'Download started');
      haptic.success();
    } catch (error) {
      console.error('Download error:', error);
      toast.error(language === 'th' ? 'ดาวน์โหลดล้มเหลว' : 'Download failed');
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
          <div className="text-center py-12">
            <EmptyState
              icon={FileText}
              title={strings.noTemplates}
              description={language === 'th' 
                ? 'ไม่พบเทมเพลต ตรวจสอบคอนโซลสำหรับข้อมูล' 
                : 'No templates found. Check console for diagnostics.'}
              isDarkMode={isDarkMode}
            />
            <div className="mt-6 p-4 rounded-lg" style={{ 
              backgroundColor: isDarkMode ? '#374151' : '#FEF3C7',
              border: `1px solid ${isDarkMode ? '#4B5563' : '#FDE68A'}`
            }}>
              <p className="text-sm font-semibold mb-2" style={{ color: isDarkMode ? '#F9FAFB' : '#92400E' }}>
                🔍 {language === 'th' ? 'การวินิจฉัย' : 'Diagnostics'}
              </p>
              <p className="text-xs" style={{ color: isDarkMode ? '#D1D5DB' : '#78350F' }}>
                {language === 'th' 
                  ? 'เปิดคอนโซลเบราว์เซอร์เพื่อดูรายละเอียดการโหลดเทมเพลต'
                  : 'Open browser console to see detailed template loading diagnostics.'}
              </p>
            </div>
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
                          {/* Preview Image */}
                          {template.preview_image_url && (
                            <div 
                              className="relative rounded-lg overflow-hidden cursor-pointer group"
                              onClick={() => setPreviewTemplate(template)}
                              style={{ height: '120px', backgroundColor: colors.fieldBg }}
                            >
                              <img 
                                src={template.preview_image_url} 
                                alt="Template preview"
                                className="w-full h-full object-cover"
                                style={{ filter: 'blur(8px)' }}
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-white text-xs font-semibold px-3 py-1 bg-black/50 rounded-full backdrop-blur-sm">
                                  {language === 'th' ? 'ดูตัวอย่าง (เบลอ)' : 'Preview (blurred)'}
                                </span>
                              </div>
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </div>
                          )}

                          <p className="text-sm line-clamp-3" style={{ color: colors.textSecondary }}>
                            {description}
                          </p>

                          <div className="flex gap-2">
                            {template.preview_image_url && (
                              <Button
                                variant="outline"
                                onClick={() => setPreviewTemplate(template)}
                                className="flex-1"
                                style={{
                                  borderColor: colors.borderColor,
                                  color: colors.textPrimary
                                }}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                {language === 'th' ? 'ดูตัวอย่าง' : 'Preview'}
                              </Button>
                            )}
                            {canDownload ? (
                              <Button
                                onClick={() => handleDownloadClick(template)}
                                disabled={isDownloadingThis}
                                className={template.preview_image_url ? 'flex-1' : 'w-full'}
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
                                className={template.preview_image_url ? 'flex-1' : 'w-full'}
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

      {/* Confirmation Modal */}
      {confirmTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmTemplate(null)}>
          <div 
            className="rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: colors.cardBg }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0C3B2E' }}>
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>
                  {language === 'th' ? confirmTemplate.title_th : confirmTemplate.title_en}
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {language === 'th' ? confirmTemplate.description_th : confirmTemplate.description_en}
                </p>
              </div>
            </div>

            {/* Preview Section */}
            <div className="border rounded-lg p-4" style={{ 
              borderColor: colors.borderColor,
              backgroundColor: colors.fieldBg 
            }}>
              <h4 className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'ตัวอย่างเนื้อหา:' : 'Template Preview:'}
              </h4>
              
              {confirmTemplate.preview_bullets && confirmTemplate.preview_bullets.length > 0 ? (
                <ul className="space-y-1.5">
                  {confirmTemplate.preview_bullets.map((bullet, i) => (
                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: colors.textSecondary }}>
                      <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: colors.textSecondary }} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : confirmTemplate.preview_text ? (
                <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                  {confirmTemplate.preview_text.length > 600 
                    ? confirmTemplate.preview_text.substring(0, 600) + '...' 
                    : confirmTemplate.preview_text}
                </p>
              ) : (
                <p className="text-sm leading-relaxed italic" style={{ color: colors.textSecondary }}>
                  {language === 'th' 
                    ? `เทมเพลตนี้รวมถึง: ${confirmTemplate.description_th || confirmTemplate.description_en}`
                    : `This template includes: ${confirmTemplate.description_en || confirmTemplate.description_th}`}
                </p>
              )}
            </div>

            {/* Cost Info */}
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ 
              backgroundColor: colors.fieldBg,
              border: `1px solid ${colors.borderColor}`
            }}>
              <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'ค่าใช้จ่าย:' : 'Cost:'}
              </span>
              <Badge className="text-sm font-bold" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                {confirmTemplate.cost_credits || 1} {language === 'th' ? 'เครดิต' : 'credit' + ((confirmTemplate.cost_credits || 1) > 1 ? 's' : '')}
              </Badge>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmTemplate(null)}
                className="flex-1"
                style={{
                  borderColor: colors.borderColor,
                  color: colors.textPrimary
                }}
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
              <Button
                onClick={handleConfirmDownload}
                className="flex-1"
                style={{
                  backgroundColor: '#0C3B2E',
                  color: '#FFFFFF'
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                {language === 'th' ? 'ยืนยันดาวน์โหลด' : 'Confirm Download'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewTemplate(null)}>
          <div 
            className="rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4"
            style={{ backgroundColor: colors.cardBg, maxHeight: '80vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>
                  {language === 'th' ? previewTemplate.title_th : previewTemplate.title_en}
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {language === 'th' ? 'ตัวอย่างเบลอ - ดาวน์โหลดเพื่อดูเนื้อหาเต็ม' : 'Blurred preview - download to see full content'}
                </p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.fieldBg }}
              >
                <span className="text-xl" style={{ color: colors.textPrimary }}>×</span>
              </button>
            </div>

            {previewTemplate.preview_image_url && (
              <div className="relative rounded-lg overflow-hidden" style={{ minHeight: '400px', backgroundColor: colors.fieldBg }}>
                <img 
                  src={previewTemplate.preview_image_url} 
                  alt="Template preview"
                  className="w-full h-auto object-contain"
                  style={{ filter: 'blur(12px)' }}
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: '#0C3B2E' }}>
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-white font-semibold">
                      {language === 'th' ? 'ดาวน์โหลดเพื่อดูเนื้อหาที่ชัดเจน' : 'Download to see clear content'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                setPreviewTemplate(null);
                handleDownloadClick(previewTemplate);
              }}
              disabled={letterCredits < (previewTemplate.cost_credits || 1)}
              className="w-full"
              style={{
                backgroundColor: letterCredits >= (previewTemplate.cost_credits || 1) ? '#0C3B2E' : '#9CA3AF',
                color: '#FFFFFF'
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              {letterCredits >= (previewTemplate.cost_credits || 1)
                ? (language === 'th' ? `ดาวน์โหลด (${previewTemplate.cost_credits || 1} เครดิต)` : `Download (${previewTemplate.cost_credits || 1} credit${(previewTemplate.cost_credits || 1) > 1 ? 's' : ''})`)
                : (language === 'th' ? 'เครดิตไม่เพียงพอ' : 'Insufficient Credits')}
            </Button>
          </div>
        </div>
      )}
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