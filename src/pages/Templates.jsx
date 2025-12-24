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
      
      console.log(`📦 Fetched ${allResults.length} total templates from DB`);

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

      console.log(`✅ ${uniqueTemplates.length} unique active templates loaded`);
      console.log('Template keys:', uniqueTemplates.map(t => t.template_key).join(', '));
      
      return uniqueTemplates;
    },
    staleTime: 0 // Always fetch fresh data
  });

  const handleDownloadClick = (template) => {
    console.log('📋 Template Full Record:', JSON.stringify(template, null, 2));
    console.log('📋 Has preview_en?', !!template.preview_en, 'Length:', template.preview_en?.length || 0);
    console.log('📋 Has preview_th?', !!template.preview_th, 'Length:', template.preview_th?.length || 0);
    console.log('📋 Has file_path?', !!template.file_path, 'Path:', template.file_path);
    setConfirmTemplate(template);
    // Lock body scroll when modal opens
    document.body.style.overflow = 'hidden';
    // Hide chat FAB to prevent overlap
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
              <h3 className="text-sm font-bold mb-3" style={{ color: colors.textPrimary }}>
                🔧 Template Debug Panel
              </h3>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4 text-xs font-mono">
                <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                  <div style={{ color: colors.textSecondary }}>Total</div>
                  <div className="text-lg font-bold" style={{ color: colors.textPrimary }}>{templates.length}</div>
                </div>
                <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                  <div style={{ color: colors.textSecondary }}>Missing EN</div>
                  <div className="text-lg font-bold" style={{ color: templates.filter(t => !t.preview_en).length > 0 ? '#DC2626' : '#059669' }}>
                    {templates.filter(t => !t.preview_en).length}
                  </div>
                </div>
                <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                  <div style={{ color: colors.textSecondary }}>Missing TH</div>
                  <div className="text-lg font-bold" style={{ color: templates.filter(t => !t.preview_th).length > 0 ? '#DC2626' : '#059669' }}>
                    {templates.filter(t => !t.preview_th).length}
                  </div>
                </div>
                <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                  <div style={{ color: colors.textSecondary }}>Missing File</div>
                  <div className="text-lg font-bold" style={{ color: templates.filter(t => !t.file_path).length > 0 ? '#DC2626' : '#059669' }}>
                    {templates.filter(t => !t.file_path).length}
                  </div>
                </div>
                <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                  <div style={{ color: colors.textSecondary }}>Active</div>
                  <div className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                    {templates.filter(t => t.status === 'active').length}
                  </div>
                </div>
              </div>

              {/* Template Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${colors.borderColor}` }}>
                      <th className="text-left p-2" style={{ color: colors.textPrimary }}>Key</th>
                      <th className="text-left p-2" style={{ color: colors.textPrimary }}>Category</th>
                      <th className="text-center p-2" style={{ color: colors.textPrimary }}>Active</th>
                      <th className="text-center p-2" style={{ color: colors.textPrimary }}>EN</th>
                      <th className="text-center p-2" style={{ color: colors.textPrimary }}>TH</th>
                      <th className="text-center p-2" style={{ color: colors.textPrimary }}>File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map(t => (
                      <tr key={t.id} style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                        <td className="p-2" style={{ color: colors.textPrimary }}>{t.template_key}</td>
                        <td className="p-2" style={{ color: colors.textSecondary }}>{t.category}</td>
                        <td className="p-2 text-center">
                          <span style={{ color: t.status === 'active' ? '#059669' : '#DC2626' }}>
                            {t.status === 'active' ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <span style={{ color: t.preview_en ? '#059669' : '#DC2626' }}>
                            {t.preview_en ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <span style={{ color: t.preview_th ? '#059669' : '#DC2626' }}>
                            {t.preview_th ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <span style={{ color: t.file_path ? '#059669' : '#DC2626' }}>
                            {t.file_path ? '✓' : '✗'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
        debugMode={debugMode}
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