import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertCircle } from "lucide-react";

export default function Templates() {
  const navigate = useNavigate();
  const [showDebug, setShowDebug] = React.useState(false);

  // Check for debug query param
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1') {
      setShowDebug(true);
    }
  }, []);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // EXACT SAME QUERY AS ADMIN PAGE
  const { data: allTemplates = [], isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.TemplateLibrary.list('-created_date'),
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const userCredits = user?.letter_credits || 0;
  const isAdmin = ['admin', 'super_admin'].includes(user?.access_level);

  // Category normalization function - maps any category variant to canonical slug
  const normalizeCategorySlug = (rawCategory) => {
    if (!rawCategory) return 'initial_resolution';
    
    const lower = rawCategory.toLowerCase().trim();
    
    // Map variants to canonical slugs
    if (lower.includes('check')) return 'checklists';
    if (lower.includes('pre') && lower.includes('sign')) return 'pre_signing_negotiation';
    if (lower.includes('initial') || lower.includes('friendly')) return 'initial_resolution';
    if (lower.includes('professional') || lower.includes('escalation')) return 'professional_escalation';
    if (lower.includes('final')) return 'final_measures';
    
    // Default fallback
    return 'initial_resolution';
  };

  // Detect if template_key is a hex record ID (legacy)
  const isLegacyKey = (key) => {
    if (!key) return true;
    // Hex pattern: 24 chars, starts with digits/hex
    if (/^[0-9a-f]{24}$/i.test(key)) return true;
    // Also exclude 'legacy' and 'unknown'
    if (key === 'legacy' || key === 'unknown') return true;
    return false;
  };

  // Get template_key from either template_key field or old template_id field
  const getTemplateKey = (t) => {
    return t.template_key || t.template_id || t.id;
  };

  // ROBUST FILTERING: Active, non-legacy, valid keys only
  const activeTemplates = allTemplates.filter(t => {
    // Must have is_active = true (or missing = treat as true for old data)
    const isActive = t.is_active !== false;
    if (!isActive) return false;
    
    // Exclude if explicitly marked legacy
    if (t.is_legacy === true) return false;
    
    // Get the key and check if it's a legacy hex ID
    const key = getTemplateKey(t);
    if (isLegacyKey(key)) return false;
    
    return true;
  });

  // Extract raw categories for debugging
  const rawCategories = [...new Set(allTemplates.map(t => t.category || 'none'))];

  // Normalize and enrich templates
  const templatesWithCategory = activeTemplates.map(t => {
    const rawCategory = t.category;
    const normalizedCategory = normalizeCategorySlug(rawCategory);
    const key = getTemplateKey(t);
    
    return {
      ...t,
      template_key: key,
      category: normalizedCategory,
      rawCategory: rawCategory, // Keep for debug
      title_en: t.title_en || 'Untitled Template',
      title_th: t.title_th || '',
      description_en: t.description_en || '',
      description_th: t.description_th || '',
      credit_cost: t.credit_cost || t.credits_required || 1
    };
  });

  // DEDUPLICATE by template_key (keep first occurrence only)
  const dedupedTemplates = Array.from(
    new Map(templatesWithCategory.map(t => [t.template_key, t])).values()
  );

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
      title: "Letter Templates",
      subtitle: "Professional multi-language escalation ladder",
      creditBalance: "Credit Balance",
      oneLetterPerCredit: "1 letter = 1 credit",
      purchaseCredits: "Purchase Credits",
      preSigningNegotiation: "⭐ Pre-Signing Negotiation",
      initialResolution: "💬 Initial Resolution",
      professionalEscalation: "📝 Professional Escalation",
      finalMeasures: "⚖️ Final Measures",
      openTemplate: "Open",
      back: "Back",
      noTemplates: "No templates available",
      loadError: "Templates failed to load. Please refresh.",
      disclaimer: "Lease Shield provides general guidance and document templates for your convenience. Lease Shield is not a law firm, does not provide legal representation, and is not a party to your lease. You are responsible for checking the accuracy of all information and documents before sending them."
    },
    th: {
      title: "เทมเพลตจดหมาย",
      subtitle: "บันไดการยกระดับมืออาชีพสองภาษา",
      creditBalance: "เครดิตคงเหลือ",
      oneLetterPerCredit: "1 จดหมาย = 1 เครดิต",
      purchaseCredits: "ซื้อเครดิต",
      preSigningNegotiation: "⭐ เจรจาก่อนลงนาม",
      initialResolution: "💬 การแก้ไขเบื้องต้น",
      professionalEscalation: "📝 การยกระดับอย่างมืออาชีพ",
      finalMeasures: "⚖️ มาตรการสุดท้าย",
      openTemplate: "เปิด",
      back: "กลับ",
      noTemplates: "ไม่มีเทมเพลต",
      loadError: "โหลดเทมเพลตล้มเหลว กรุณารีเฟรช",
      disclaimer: "Lease Shield ให้คำแนะนำทั่วไปและเทมเพลตเอกสารเพื่อความสะดวกของคุณ Lease Shield ไม่ใช่สำนักงานกฎหมาย ไม่ให้บริการตัวแทนทางกฎหมาย และไม่ได้เป็นคู่สัญญาในสัญญาเช่าของคุณ คุณมีหน้าที่รับผิดชอบในการตรวจสอบความถูกต้องของข้อมูลและเอกสารทั้งหมดก่อนส่ง"
    }
  };

  const strings = t[language] || t.en;

  // Category filtering with fixed order - use DEDUPED templates (exclude checklists)
  const preSigningTemplates = dedupedTemplates.filter(t => t.category === 'pre_signing_negotiation');
  const initialResolutionTemplates = dedupedTemplates.filter(t => t.category === 'initial_resolution');
  const professionalTemplates = dedupedTemplates.filter(t => t.category === 'professional_escalation');
  const finalTemplates = dedupedTemplates.filter(t => t.category === 'final_measures');

  // Mapped categories for debugging
  const mappedCategories = [...new Set(dedupedTemplates.map(t => t.category))];

  // Debug data
  const debugData = {
    entityName: 'TemplateLibrary',
    queryMethod: 'list(\'-created_date\')',
    rawCount: allTemplates.length,
    filteredCount: activeTemplates.length,
    beforeDedup: templatesWithCategory.length,
    afterDedup: dedupedTemplates.length,
    templateKeys: dedupedTemplates.slice(0, 50).map(t => t.template_key).join(', '),
    rawCategoriesFound: rawCategories.join(', '),
    mappedCategories: mappedCategories.join(', '),
    userRole: user?.access_level || 'none',
    userLanguage: language,
    errorMessage: error?.message || 'none',
    categoryBreakdown: {
      pre_signing: preSigningTemplates.length,
      initial_resolution: initialResolutionTemplates.length,
      professional: professionalTemplates.length,
      final: finalTemplates.length
    }
  };

  const renderTemplateCard = (template, gradientClass) => {
    const title = language === 'th' && template.title_th ? template.title_th : template.title_en;
    const description = language === 'th' && template.description_th ? template.description_th : template.description_en || '';
    const hasValidKey = template.template_key && template.template_key !== 'unknown';
    
    return (
      <div
        key={template.id || template.template_key}
        onClick={() => hasValidKey && navigate(createPageUrl("TemplateForm") + `?subject=${template.template_key}`)}
        className="rounded-xl shadow-md hover:shadow-xl transition-all p-6"
        style={{ 
          backgroundColor: colors.cardBg, 
          border: `1px solid ${colors.borderColor}`,
          cursor: hasValidKey ? 'pointer' : 'not-allowed',
          opacity: hasValidKey ? 1 : 0.6
        }}
      >
        <div className={`h-1 ${gradientClass} rounded-t-xl mb-4`} />
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold flex-1" style={{ color: colors.textPrimary }}>
            {title}
            {!hasValidKey && (
              <span className="ml-2 px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                Missing template_key
              </span>
            )}
          </h3>
          <span className="ml-2 px-2 py-1 text-xs font-semibold rounded" style={{
            backgroundColor: '#FEF3C7',
            color: '#92400E'
          }}>
            {template.credit_cost} {template.credit_cost === 1 ? 'credit' : 'credits'}
          </span>
        </div>
        <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
          {description}
        </p>
        {hasValidKey ? (
          <button className="text-sm font-medium text-emerald-700 hover:underline">
            {strings.openTemplate} →
          </button>
        ) : (
          <span className="text-sm text-red-600">Cannot open - invalid key</span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-md p-6 rounded-lg" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.borderColor}` }}>
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-center font-semibold mb-2" style={{ color: colors.textPrimary }}>
            {strings.loadError}
          </p>
          <p className="text-sm text-center" style={{ color: colors.textSecondary }}>
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-sm font-medium hover:underline"
            style={{ color: colors.textSecondary }}
          >
            ← {strings.back}
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {strings.title}
              </h1>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {strings.subtitle}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="px-3 py-1 text-xs rounded"
                style={{
                  backgroundColor: showDebug ? '#EF4444' : '#6B7280',
                  color: '#FFFFFF'
                }}
              >
                {showDebug ? 'Hide Debug' : 'Show Debug'}
              </button>
            )}
          </div>
        </div>

        {/* DEBUG PANEL */}
        {showDebug && (
          <div className="mb-6 p-4 rounded-lg font-mono text-xs" style={{
            backgroundColor: isDarkMode ? '#1F2937' : '#FEF3C7',
            border: `2px solid ${isDarkMode ? '#374151' : '#F59E0B'}`,
            color: isDarkMode ? '#F9FAFB' : '#92400E'
          }}>
            <div className="font-bold text-sm mb-2">🔍 DEBUG: Template Data</div>
            <div className="space-y-1">
              <div><strong>Entity:</strong> {debugData.entityName}</div>
              <div><strong>Query:</strong> {debugData.queryMethod}</div>
              <div className="h-px bg-current opacity-20 my-2"></div>
              <div><strong>Raw DB Count:</strong> {debugData.rawCount}</div>
              <div><strong>After Filters:</strong> {debugData.filteredCount}</div>
              <div><strong>Before Dedup:</strong> {debugData.beforeDedup}</div>
              <div><strong>After Dedup:</strong> {debugData.afterDedup}</div>
              <div className="h-px bg-current opacity-20 my-2"></div>
              <div><strong>Raw Categories (from DB):</strong> {debugData.rawCategoriesFound}</div>
              <div><strong>Mapped Categories:</strong> {debugData.mappedCategories}</div>
              <div className="h-px bg-current opacity-20 my-2"></div>
              <div><strong>Category Counts:</strong> PreSigning={debugData.categoryBreakdown.pre_signing}, InitialResolution={debugData.categoryBreakdown.initial_resolution}, Professional={debugData.categoryBreakdown.professional}, Final={debugData.categoryBreakdown.final}</div>
              <div className="h-px bg-current opacity-20 my-2"></div>
              <div><strong>Template Keys (first 50):</strong> {debugData.templateKeys || '(none)'}</div>
              <div className="h-px bg-current opacity-20 my-2"></div>
              <div><strong>User Role:</strong> {debugData.userRole}</div>
              <div><strong>Language:</strong> {debugData.userLanguage}</div>
              <div><strong>Error:</strong> {debugData.errorMessage}</div>
              {debugData.rawCount === 0 && (
                <div className="mt-2 p-2 bg-red-100 text-red-800 rounded font-bold">
                  ⚠️ DB returned 0 templates — this is a data/query problem
                </div>
              )}
              {debugData.rawCount > 0 && debugData.filteredCount === 0 && (
                <div className="mt-2 p-2 bg-red-100 text-red-800 rounded font-bold">
                  ⚠️ Filters removed all rows — filter logic is wrong (probably legacy hex IDs)
                </div>
              )}
              {debugData.withCategoryCount > 0 && Object.values(debugData.categoryBreakdown).every(c => c === 0) && (
                <div className="mt-2 p-2 bg-orange-100 text-orange-800 rounded font-bold">
                  ⚠️ Templates exist but all category counts are 0 — category mapping failed
                </div>
              )}
            </div>
          </div>
        )}

        {/* Credit Balance Card */}
        <div className="mb-8 rounded-xl shadow-lg p-6" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.borderColor}` }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
            <button
              onClick={() => navigate(createPageUrl("Account") + '#letter-credits')}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-6 py-3 rounded-lg font-medium transition-all"
            >
              {strings.purchaseCredits}
            </button>
          </div>
        </div>

        {dedupedTemplates.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="p-6 rounded-lg max-w-md mx-auto" style={{
              backgroundColor: colors.cardBg,
              border: `2px solid ${colors.borderColor}`
            }}>
              <p className="text-xl font-semibold mb-4" style={{ color: colors.textPrimary }}>
                {strings.noTemplates}
              </p>
              <div className="text-left text-sm space-y-2" style={{ color: colors.textSecondary }}>
                <div>Raw DB Count: <strong>{allTemplates.length}</strong></div>
                <div>After Filters: <strong>{activeTemplates.length}</strong></div>
                {allTemplates.length === 0 && (
                  <div className="mt-4 p-3 bg-red-50 text-red-800 rounded text-xs">
                    No templates found in database. Admin needs to create templates.
                  </div>
                )}
                {allTemplates.length > 0 && activeTemplates.length === 0 && (
                  <div className="mt-4 p-3 bg-orange-50 text-orange-800 rounded text-xs">
                    All templates were filtered out. Check is_active and is_legacy fields.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Checklists */}
            {checklistTemplates.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                  {strings.checklists}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {checklistTemplates.map(t => renderTemplateCard(t, 'bg-gradient-to-r from-blue-400 to-indigo-600'))}
                </div>
              </div>
            )}

            {/* Pre-Signing Negotiation */}
            {preSigningTemplates.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                  {strings.preSigningNegotiation}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {preSigningTemplates.map(t => renderTemplateCard(t, 'bg-gradient-to-r from-amber-400 to-orange-600'))}
                </div>
              </div>
            )}

            {/* Initial Resolution */}
            {friendlyTemplates.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                  {strings.friendlyApproach}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friendlyTemplates.map(t => renderTemplateCard(t, 'bg-gradient-to-r from-blue-400 to-purple-600'))}
                </div>
              </div>
            )}

            {/* Professional Escalation */}
            {professionalTemplates.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                  {strings.professionalEscalation}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {professionalTemplates.map(t => renderTemplateCard(t, 'bg-gradient-to-r from-emerald-500 to-cyan-600'))}
                </div>
              </div>
            )}

            {/* Final Measures */}
            {finalTemplates.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                  {strings.finalMeasures}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {finalTemplates.map(t => renderTemplateCard(t, 'bg-gradient-to-r from-orange-600 to-red-700'))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Legal Disclaimer */}
        <div className="mt-12 p-4 rounded-lg text-center" style={{
          backgroundColor: isDarkMode ? '#2A2D30' : '#F8FAFC',
          border: `1px solid ${colors.borderColor}`
        }}>
          <p className="text-xs leading-relaxed" style={{ color: colors.textSecondary }}>
            {strings.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}