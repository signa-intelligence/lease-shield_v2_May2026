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
  
  // Debug mode from query param
  const urlParams = new URLSearchParams(window.location.search);
  const debugMode = urlParams.get('debug') === '1';

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templateAssets'],
    queryFn: async () => {
      const allResults = await base44.entities.TemplateLibrary.list();

      // Filter: only active templates
      const activeTemplates = allResults.filter(t => t.status === 'active');

      // Defensive deduplication: unique by template_key first, then by (category, title_en)
      const seenKeys = new Set();
      const seenCategoryTitles = new Set();
      const uniqueTemplates = [];

      for (const t of activeTemplates) {
        const key = t.template_key;
        const categoryTitleKey = `${t.category}:${t.title_en}`;

        if (!seenKeys.has(key) && !seenCategoryTitles.has(categoryTitleKey)) {
          seenKeys.add(key);
          seenCategoryTitles.add(categoryTitleKey);
          uniqueTemplates.push(t);
        }
      }

      // Sort by category sort_order, then by template sort_order
      uniqueTemplates.sort((a, b) => {
        const catOrder = { checklists: 1, pre_signing: 2, initial_resolution: 3, professional: 4, final: 5 };
        const catA = catOrder[a.category] || 99;
        const catB = catOrder[b.category] || 99;
        if (catA !== catB) return catA - catB;
        return (a.sort_order || 100) - (b.sort_order || 100);
      });

      console.log(`✅ ${uniqueTemplates.length} unique templates loaded`);
      return uniqueTemplates;
    }
  });

  const handleDownloadClick = (template) => {
    console.log('📋 Template Full Record:', JSON.stringify(template, null, 2));
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
        const errorMsg = response.data?.error || 'Download failed';
        toast.error(errorMsg);
        haptic.error();
        return;
      }

      // Trigger download with signed URL
      const link = document.createElement('a');
      link.href = response.data.download_url;
      link.download = response.data.filename || `${template.template_key}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Refresh credits (deducted only after successful download)
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      toast.success(language === 'th' ? 'ดาวน์โหลดสำเร็จ - หักเครดิตแล้ว' : 'Download started - credit deducted');
      haptic.success();
    } catch (error) {
      console.error('Download error:', error);
      toast.error(language === 'th' ? 'ดาวน์โหลดล้มเหลว - ไม่มีการหักเครดิต' : 'Download failed - no credit deducted');
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

        {/* Admin Debug Panel */}
        {debugMode && user?.role === 'admin' && (
          <Card className="mb-6 border-2" style={{ 
            backgroundColor: isDarkMode ? '#1F2937' : '#FEF9C3',
            borderColor: '#C7A338'
          }}>
            <CardContent className="p-4">
              <h3 className="text-sm font-bold mb-2" style={{ color: colors.textPrimary }}>
                🔧 Admin Debug Panel
              </h3>
              <div className="text-xs font-mono space-y-1" style={{ color: colors.textSecondary }}>
                <div>Templates loaded: {templates.length}</div>
                <div>Keys: {templates.map(t => t.template_key).join(', ')}</div>
                <div className="pt-2">
                  {templates.map(t => (
                    <div key={t.id} className="mb-1">
                      • {t.template_key}: file={t.file_path ? '✓' : '✗'} preview={t.preview_headings?.length > 0 ? '✓' : '✗'}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

                          {/* Debug Meta Line */}
                          {debugMode && (
                            <div className="text-xs font-mono mt-2 p-2 rounded" style={{ 
                              color: colors.textSecondary, 
                              backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
                              borderLeft: `2px solid ${colors.borderColor}`
                            }}>
                              <div>key: {template.template_key || 'missing'}</div>
                              <div>id: {template.id.substring(0, 8)}...</div>
                              <div>file: {template.file_path || template.docx_url || template.pdf_url || 'missing'}</div>
                              <div>langs: {template.title_en ? '🇬🇧' : ''} {template.title_th ? '🇹🇭' : ''}</div>
                            </div>
                          )}

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
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#0C3B2E' }}>
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {strings.confirmDownloadTitle}
              </h3>
              <p className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>
                {language === 'th' ? confirmTemplate.title_th : confirmTemplate.title_en}
              </p>
              <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                {language === 'th' ? confirmTemplate.description_th : confirmTemplate.description_en}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{
                backgroundColor: isDarkMode ? '#374151' : '#FEF3C7',
                border: `1px solid ${isDarkMode ? '#4B5563' : '#FDE68A'}`
              }}>
                <AlertCircle className="w-4 h-4" style={{ color: '#D97706' }} />
                <span className="text-sm font-bold" style={{ color: isDarkMode ? '#FCD34D' : '#92400E' }}>
                  {strings.creditWillBeDeducted}
                </span>
              </div>
            </div>

            {/* Preview Section - Only show if data exists */}
            {(confirmTemplate.preview_headings?.length > 0 || 
              confirmTemplate.preview_bullets?.length > 0 || 
              confirmTemplate.preview_placeholders?.length > 0) ? (
              <div className="border rounded-lg p-4 space-y-3" style={{ 
                borderColor: colors.borderColor,
                backgroundColor: colors.fieldBg 
              }}>
                <h4 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                  {strings.insideTemplate}
                </h4>
                
                {confirmTemplate.preview_headings && confirmTemplate.preview_headings.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                      {strings.mainSections}
                    </p>
                    <ul className="space-y-1">
                      {confirmTemplate.preview_headings.map((heading, i) => (
                        <li key={i} className="text-sm flex items-start gap-2" style={{ color: colors.textPrimary }}>
                          <span className="font-bold" style={{ color: '#0C3B2E' }}>§</span>
                          <span className="font-medium">{heading}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {confirmTemplate.preview_bullets && confirmTemplate.preview_bullets.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                      {strings.includes}
                    </p>
                    <ul className="space-y-1">
                      {confirmTemplate.preview_bullets.map((bullet, i) => (
                        <li key={i} className="text-sm flex items-start gap-2" style={{ color: colors.textSecondary }}>
                          <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#0C3B2E' }} />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {confirmTemplate.preview_placeholders && confirmTemplate.preview_placeholders.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                      {strings.fillInFields}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {confirmTemplate.preview_placeholders.map((placeholder, i) => (
                        <span 
                          key={i} 
                          className="text-xs px-2 py-1 rounded font-mono"
                          style={{ 
                            backgroundColor: colors.cardBg,
                            border: `1px solid ${colors.borderColor}`,
                            color: colors.textSecondary 
                          }}
                        >
                          {placeholder}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border rounded-lg p-4 text-center" style={{ 
                borderColor: colors.borderColor,
                backgroundColor: colors.fieldBg 
              }}>
                <p className="text-sm italic" style={{ color: colors.textSecondary }}>
                  {strings.previewUnavailable}
                </p>
              </div>
            )}



            {/* Debug Meta Line */}
            {debugMode && (
              <div className="text-xs font-mono p-3 rounded-lg space-y-1" style={{ 
                color: colors.textSecondary, 
                backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
                border: `1px solid ${colors.borderColor}`
              }}>
                <div><strong>Key:</strong> {confirmTemplate.template_key || 'missing'}</div>
                <div><strong>ID:</strong> {confirmTemplate.id}</div>
                <div><strong>File:</strong> {confirmTemplate.file_path || confirmTemplate.docx_url || confirmTemplate.pdf_url || 'missing'}</div>
                <div><strong>Updated:</strong> {confirmTemplate.updated_date ? new Date(confirmTemplate.updated_date).toLocaleString() : 'N/A'}</div>
                <div><strong>Status:</strong> {confirmTemplate.status || 'unknown'}</div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmTemplate(null)}
                className="flex-1"
                style={{
                  borderColor: colors.borderColor,
                  color: colors.textPrimary
                }}
              >
                {strings.cancel}
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
                {strings.confirmDownload}
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