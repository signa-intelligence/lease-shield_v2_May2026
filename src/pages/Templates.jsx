import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ShoppingCart, Eye, Loader2 } from "lucide-react";
import AuthGuard from "../components/shared/AuthGuard";
import { ToastProvider, useToast } from "../components/shared/Toast";
import { haptic } from "../components/shared/HapticFeedback";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import TemplateViewer from "../components/templates/TemplateViewer";
import { useQueryClient } from "@tanstack/react-query";

function TemplatesContent() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [contentLang, setContentLang] = useState(null);
  const [backfillResult, setBackfillResult] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Initialize content language based on user preference
  React.useEffect(() => {
    if (user && contentLang === null) {
      setContentLang(user.language === 'th' ? 'th' : 'en');
    }
  }, [user, contentLang]);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templateAssets'],
    queryFn: async () => {
      const allResults = await base44.entities.TemplateLibrary.list();

      // Filter: only valid active templates with body content
      const validTemplates = allResults.filter(t => 
        t && 
        t.id && 
        t.template_key &&
        t.is_active !== false &&
        t.title_en
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

  // Auto-run backfill once on first admin load
  React.useEffect(() => {
    const isAdmin = user?.role === 'admin' || user?.access_level === 'admin' || user?.access_level === 'super_admin';
    const hasRun = localStorage.getItem('templateBackfillRan');
    
    if (isAdmin && !hasRun && templates.length > 0) {
      const hasMissing = templates.some(t => {
        const nested = t.preview_content || {};
        const doc = t.document_content || {};
        const previewEn = nested.en || t.preview_content_en || '';
        const previewTh = nested.th || t.preview_content_th || '';
        const docEn = doc.en || t.document_content_en || '';
        const docTh = doc.th || t.document_content_th || '';
        return previewEn.trim().length < 50 || previewTh.trim().length < 50 || 
               docEn.trim().length < 300 || docTh.trim().length < 300;
      });

      if (hasMissing) {
        console.log('[AUTO-BACKFILL] Running safe backfill on first admin load...');
        base44.functions.invoke('backfillTemplateBilingualContent', { force: false })
          .then(({ data }) => {
            console.log('[AUTO-BACKFILL] Success:', data);
            toast.success(`✅ Auto-backfill: ${data.total - data.remaining_missing}/${data.total} templates ready`);
            queryClient.invalidateQueries({ queryKey: ['templateAssets'] });
            localStorage.setItem('templateBackfillRan', '1');
          })
          .catch(err => {
            console.error('[AUTO-BACKFILL] Failed:', err);
          });
      } else {
        localStorage.setItem('templateBackfillRan', '1');
      }
    }
  }, [user, templates]);

  const handleViewTemplate = (template) => {
    if (!template || !template.id) {
      console.error('[TEMPLATE] Invalid template data');
      return;
    }
    console.log('[TEMPLATE] View action:', { template_key: template?.template_key, lang: language });
    haptic.light();
    setViewingTemplate(template);
  };

  const language = user?.language || 'en';
  const displayLang = contentLang || language;
  const isDarkMode = user?.theme === 'dark';
  const letterCredits = user?.letter_credits || 0;
  const isAdmin = user?.role === 'admin' || user?.access_level === 'admin' || user?.access_level === 'super_admin';

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
      subtitle: "View templates for free. Copy text or download Word (1 credit each).",
      creditsBalance: "Credits:",
      view: "View Template",
      buyCredits: "Buy Credits",
      noTemplates: "No templates available",
      free: "Free to view",
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
      subtitle: "ดูเทมเพลตฟรี คัดลอกข้อความหรือดาวน์โหลด Word (1 เครดิตต่อครั้ง)",
      creditsBalance: "เครดิต:",
      view: "ดูเทมเพลต",
      buyCredits: "ซื้อเครดิต",
      noTemplates: "ไม่มีเทมเพลต",
      free: "ดูฟรี",
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
            <div className="flex items-center gap-3">
              {/* Language Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: colors.fieldBg, border: `1px solid ${colors.borderColor}` }}>
                <button
                  onClick={() => {
                    setContentLang('en');
                    haptic.light();
                  }}
                  className="px-3 py-1.5 rounded text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: displayLang === 'en' ? '#0C3B2E' : 'transparent',
                    color: displayLang === 'en' ? '#FFFFFF' : colors.textSecondary
                  }}
                >
                  EN
                </button>
                <button
                  onClick={() => {
                    setContentLang('th');
                    haptic.light();
                  }}
                  className="px-3 py-1.5 rounded text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: displayLang === 'th' ? '#0C3B2E' : 'transparent',
                    color: displayLang === 'th' ? '#FFFFFF' : colors.textSecondary
                  }}
                >
                  TH
                </button>
              </div>

              {/* Credits Badge */}
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
            </div>
          }
        />



        {isAdmin && (
          <div className="space-y-4 mb-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={async () => {
                  try {
                    setBackfillResult(null);
                    const { data } = await base44.functions.invoke('backfillTemplateBilingualContent', { force: false });
                    console.log('[BACKFILL] Response:', data);
                    if (data.ok) {
                      toast.success(`✅ Updated: EN preview ${data.updated_preview_en}, TH preview ${data.updated_preview_th}, EN doc ${data.updated_doc_en}, TH doc ${data.updated_doc_th}`);
                      setBackfillResult(data);
                      queryClient.invalidateQueries({ queryKey: ['templateAssets'] });
                    } else {
                      toast.error(`❌ Backfill failed: ${data.message}`);
                    }
                  } catch (error) {
                    console.error('[BACKFILL] Error:', error);
                    toast.error(`❌ Backfill error: ${error.message || error.toString()}`);
                  }
                }}
                className="px-4 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
              >
                🌐 Backfill Missing EN/TH (Safe)
              </button>
              <button
                onClick={async () => {
                  if (!confirm('⚠️ Force overwrite ALL EN/TH content? This will replace existing templates.')) return;
                  try {
                    setBackfillResult(null);
                    const { data } = await base44.functions.invoke('backfillTemplateBilingualContent', { force: true });
                    console.log('[BACKFILL] Force response:', data);
                    if (data.ok) {
                      toast.success(`✅ Force updated: EN preview ${data.updated_preview_en}, TH preview ${data.updated_preview_th}, EN doc ${data.updated_doc_en}, TH doc ${data.updated_doc_th}`);
                      setBackfillResult(data);
                      queryClient.invalidateQueries({ queryKey: ['templateAssets'] });
                    } else {
                      toast.error(`❌ Force backfill failed: ${data.message}`);
                    }
                  } catch (error) {
                    console.error('[BACKFILL] Force error:', error);
                    toast.error(`❌ Force error: ${error.message || error.toString()}`);
                  }
                }}
                className="px-4 py-2 rounded-lg font-semibold border-2"
                style={{ backgroundColor: 'transparent', color: '#DC2626', borderColor: '#DC2626' }}
              >
                🔄 Force Overwrite EN/TH (Danger)
              </button>
            </div>
            
            {backfillResult && (
              <div className="p-4 rounded-lg border-2" style={{ 
                backgroundColor: backfillResult.ok ? '#ECFDF5' : '#FEE2E2',
                borderColor: backfillResult.ok ? '#10B981' : '#EF4444'
              }}>
                <div className="text-sm font-mono space-y-1" style={{ color: '#1F2937' }}>
                  <div><strong>Status:</strong> {backfillResult.ok ? '✅ Success' : '❌ Failed'}</div>
                  <div><strong>Total Templates:</strong> {backfillResult.total}</div>
                  <div><strong>Updated Preview EN:</strong> {backfillResult.updated_preview_en}</div>
                  <div><strong>Updated Preview TH:</strong> {backfillResult.updated_preview_th}</div>
                  <div><strong>Updated Doc EN:</strong> {backfillResult.updated_doc_en}</div>
                  <div><strong>Updated Doc TH:</strong> {backfillResult.updated_doc_th}</div>
                  <div><strong>Remaining Missing:</strong> {backfillResult.remaining_missing}</div>
                  {backfillResult.keys_missing && backfillResult.keys_missing.length > 0 && (
                    <div><strong>Missing Keys:</strong> {backfillResult.keys_missing.join(', ')}</div>
                  )}
                </div>
              </div>
            )}
          </div>
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
                    if (!template || !template.id) return null;
                    
                    const title = displayLang === 'th' ? (template.title_th || template.title_en || 'Untitled') : (template.title_en || 'Untitled');
                    
                    // Extract from nested or flat structure
                    const nestedPreview = template.preview_content || {};
                    const nestedDoc = template.document_content || {};
                    
                    const previewEn = nestedPreview.en || template.preview_content_en || template.preview_en || '';
                    const previewTh = nestedPreview.th || template.preview_content_th || template.preview_th || '';
                    const docEn = nestedDoc.en || template.document_content_en || template.document_content || '';
                    const docTh = nestedDoc.th || template.document_content_th || '';
                    
                    const previewContent = displayLang === 'th' ? previewTh : previewEn;
                    const hasPreview = previewContent && previewContent.trim().length >= 50;
                    const hasDocEn = docEn.trim().length >= 300;
                    const hasDocTh = docTh.trim().length >= 300;
                    const hasDocument = hasDocEn && hasDocTh;
                    const preview = hasPreview ? previewContent.slice(0, 300) + (previewContent.length > 300 ? '…' : '') : (language === 'th' ? 'ไม่มีเนื้อหา' : 'Content unavailable');

                    return (
                      <Card
                        key={template.id}
                        onClick={() => handleViewTemplate(template)}
                        className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer"
                        style={{ backgroundColor: colors.cardBg }}
                      >
                        <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                          <CardTitle className="flex items-start justify-between gap-2" style={{ color: colors.textPrimary }}>
                            <span className="text-base line-clamp-2">{title}</span>
                            <div className="flex gap-2 flex-shrink-0">
                              <Badge className="text-xs" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                                {strings.free}
                              </Badge>
                              {isAdmin && (
                                <Badge className="text-xs" style={{ 
                                  backgroundColor: hasDocument ? '#D1FAE5' : '#FEE2E2',
                                  color: hasDocument ? '#065F46' : '#DC2626'
                                }}>
                                  {hasDocument ? '✓ Ready' : '⚠ Needs Content'}
                                </Badge>
                              )}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <p className="text-sm line-clamp-3" style={{ color: colors.textSecondary, whiteSpace: 'pre-wrap' }}>
                            {preview}
                          </p>

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs" style={{ color: colors.textSecondary }}>
                              {language === 'th' ? 'คลิกเพื่อดูเนื้อหา' : 'Click to view content'}
                            </span>
                            <Eye className="w-4 h-4" style={{ color: '#0C3B2E' }} />
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

      {/* Template Viewer Modal */}
      <TemplateViewer
        template={viewingTemplate}
        isOpen={!!viewingTemplate}
        onClose={() => setViewingTemplate(null)}
        colors={colors}
        language={language}
        contentLang={displayLang}
        onContentLangChange={setContentLang}
        user={user}
        toast={toast}
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