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
  const [showBackfillConfirm, setShowBackfillConfirm] = useState(false);
  const [backfillConfirmText, setBackfillConfirmText] = useState('');
  const [showAudit, setShowAudit] = useState(false);

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

      // Filter: only valid ACTIVE templates
      const validTemplates = allResults.filter(t => 
        t && 
        t.id && 
        t.template_key &&
        t.title_en &&
        (t.status === 'active' || (t.is_active !== false && !t.status))
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
        const previewTh = t.preview_content_th || '';
        const docTh = t.document_content_th || '';
        return previewTh.trim().length < 50 || docTh.trim().length < 300;
      });

      if (hasMissing) {
        console.log('[AUTO-BACKFILL] Running safe backfill on first admin load...');
        base44.functions.invoke('backfillThaiTemplateContent', { force: false })
          .then(({ data }) => {
            console.log('[AUTO-BACKFILL] Success:', data);
            toast.success(`✅ Auto-backfill: ${data.updated_count} Thai templates updated`);
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
                    const { data } = await base44.functions.invoke('seedSixTemplatesBilingual');
                    if (data.ok) {
                      toast.success(`✅ ${data.message}`);
                      queryClient.invalidateQueries({ queryKey: ['templateAssets'] });
                    } else {
                      toast.error(`❌ Seed failed: ${data.message}`);
                    }
                  } catch (error) {
                    toast.error(`❌ Seed error: ${error.message}`);
                  }
                }}
                className="px-4 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
              >
                🌐 Seed 6 Templates (EN+TH)
              </button>
              <button
                onClick={async () => {
                  try {
                    const { data } = await base44.functions.invoke('migrateTemplateFieldsToNested');
                    if (data.ok) {
                      toast.success(`✅ Migrated ${data.migrated_count} templates to nested structure`);
                      queryClient.invalidateQueries({ queryKey: ['templateAssets'] });
                    } else {
                      toast.error(`❌ Migration failed: ${data.message}`);
                    }
                  } catch (error) {
                    toast.error(`❌ Migration error: ${error.message}`);
                  }
                }}
                className="px-4 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: '#F59E0B', color: '#FFFFFF' }}
              >
                🔄 Migrate to Nested Fields
              </button>
              <button
                onClick={() => setShowBackfillConfirm(true)}
                className="px-4 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
              >
                ✅ Run Safe Template Backfill
              </button>
              <button
                onClick={() => setShowAudit(!showAudit)}
                className="px-4 py-2 rounded-lg font-semibold border-2"
                style={{ backgroundColor: 'transparent', color: colors.textPrimary, borderColor: colors.borderColor }}
              >
                {showAudit ? '📊 Hide Audit' : '📊 Show Content Audit'}
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
                  <div><strong>Updated Count:</strong> {backfillResult.updated_count}</div>
                  <div><strong>Remaining Missing:</strong> {backfillResult.remaining_missing}</div>
                  {backfillResult.keys_missing && backfillResult.keys_missing.length > 0 && (
                    <div><strong>Missing Keys:</strong> {backfillResult.keys_missing.join(', ')}</div>
                  )}
                  {backfillResult.fill_details && Object.keys(backfillResult.fill_details).length > 0 && (
                    <div className="mt-2 pt-2 border-t" style={{ borderColor: '#10B981' }}>
                      <strong>Fields Filled:</strong>
                      {Object.entries(backfillResult.fill_details).map(([key, fields]) => (
                        <div key={key} className="ml-2">• {key}: {fields.join(', ')}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {showAudit && (
              <div className="p-4 rounded-lg border-2" style={{ 
                backgroundColor: colors.cardBg,
                borderColor: colors.borderColor
              }}>
                <h3 className="text-lg font-bold mb-3" style={{ color: colors.textPrimary }}>Template Content Audit</h3>
                <div className="space-y-2 text-xs font-mono" style={{ color: colors.textSecondary }}>
                  {templates.map(t => {
                    const previewObj = typeof t.preview_content === 'object' ? t.preview_content : {};
                    const docObj = typeof t.document_content === 'object' ? t.document_content : {};
                    const pEn = typeof previewObj.en === 'string' ? previewObj.en.length : 0;
                    const pTh = typeof previewObj.th === 'string' ? previewObj.th.length : 0;
                    const dEn = typeof docObj.en === 'string' ? docObj.en.length : 0;
                    const dTh = typeof docObj.th === 'string' ? docObj.th.length : 0;
                    const needsContent = pEn < 50 || pTh < 50 || dEn < 300 || dTh < 300;
                    
                    return (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: needsContent ? '#FEE2E2' : '#ECFDF5' }}>
                        <span className="font-semibold">{t.template_key}</span>
                        <span>
                          pEN:{pEn} pTH:{pTh} dEN:{dEn} dTH:{dTh} 
                          {needsContent && <span className="ml-2 text-red-600">⚠️ NEEDS CONTENT</span>}
                        </span>
                      </div>
                    );
                  })}
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
                    
                    // Extract from nested JSON fields (authoritative source)
                    const previewContentObj = typeof template.preview_content === 'object' ? template.preview_content : {};
                    const documentContentObj = typeof template.document_content === 'object' ? template.document_content : {};
                    
                    const previewEn = typeof previewContentObj.en === 'string' ? previewContentObj.en : '';
                    const previewTh = typeof previewContentObj.th === 'string' ? previewContentObj.th : '';
                    const docEn = typeof documentContentObj.en === 'string' ? documentContentObj.en : '';
                    const docTh = typeof documentContentObj.th === 'string' ? documentContentObj.th : '';
                    
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

      {/* Backfill Confirmation Modal */}
      {showBackfillConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: 10000 }}
          onClick={() => setShowBackfillConfirm(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-6"
            style={{ backgroundColor: colors.cardBg }}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              Confirm Template Backfill
            </h3>
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              This will fill ONLY missing content fields. Existing content will NOT be overwritten.
            </p>
            <p className="text-sm mb-4 font-semibold" style={{ color: colors.textPrimary }}>
              Type <span className="font-mono bg-yellow-100 px-2 py-1 rounded">BACKFILL</span> to confirm:
            </p>
            <input
              type="text"
              value={backfillConfirmText}
              onChange={(e) => setBackfillConfirmText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border mb-4"
              style={{ 
                backgroundColor: colors.fieldBg, 
                borderColor: colors.borderColor,
                color: colors.textPrimary
              }}
              placeholder="Type BACKFILL"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBackfillConfirm(false);
                  setBackfillConfirmText('');
                }}
                className="flex-1 px-4 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: colors.fieldBg, color: colors.textPrimary }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (backfillConfirmText !== 'BACKFILL') {
                    toast.error('Please type BACKFILL to confirm');
                    return;
                  }
                  setShowBackfillConfirm(false);
                  setBackfillConfirmText('');
                  try {
                    setBackfillResult(null);
                    const { data } = await base44.functions.invoke('backfillTemplateLibrarySafeDeterministic');
                    console.log('[SAFE_BACKFILL] Response:', data);
                    if (data.ok) {
                      toast.success(`✅ Backfill complete: ${data.updated_count} templates updated, ${data.remaining_missing} remaining missing`);
                      setBackfillResult(data);
                      queryClient.invalidateQueries({ queryKey: ['templateAssets'] });
                    } else {
                      toast.error(`❌ Backfill failed: ${data.message}`);
                    }
                  } catch (error) {
                    console.error('[SAFE_BACKFILL] Error:', error);
                    toast.error(`❌ Backfill error: ${error.message || error.toString()}`);
                  }
                }}
                disabled={backfillConfirmText !== 'BACKFILL'}
                className="flex-1 px-4 py-2 rounded-lg font-semibold"
                style={{ 
                  backgroundColor: backfillConfirmText === 'BACKFILL' ? '#10B981' : '#9CA3AF',
                  color: '#FFFFFF',
                  cursor: backfillConfirmText === 'BACKFILL' ? 'pointer' : 'not-allowed'
                }}
              >
                Run Backfill
              </button>
            </div>
          </div>
        </div>
      )}

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