import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertCircle } from "lucide-react";

export default function Templates() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allTemplates = [], isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.TemplateLibrary.list('sort_order'),
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const userCredits = user?.letter_credits || 0;

  // SINGLE SOURCE OF TRUTH: Filter active, non-legacy templates
  const activeTemplates = allTemplates.filter(t => 
    t.is_active === true && t.is_legacy !== true
  );

  // Debug logging
  React.useEffect(() => {
    if (allTemplates.length > 0) {
      const categoryBreakdown = activeTemplates.reduce((acc, t) => {
        const cat = t.category || 'uncategorized';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📊 Templates Debug:');
      console.log('  Total in DB:', allTemplates.length);
      console.log('  Active non-legacy:', activeTemplates.length);
      console.log('  Expected: 14');
      console.log('  Categories:', Object.keys(categoryBreakdown));
      console.log('  Breakdown:', categoryBreakdown);
    }
  }, [allTemplates, activeTemplates]);

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
      checklists: "📋 Checklists",
      preSigningNegotiation: "⭐ Pre-Signing Negotiation",
      friendlyApproach: "💬 Friendly Approach",
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
      checklists: "📋 รายการตรวจสอบ",
      preSigningNegotiation: "⭐ เจรจาก่อนลงนาม",
      friendlyApproach: "💬 แนวทางเป็นมิตร",
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

  // Category filtering with fixed order
  const checklistTemplates = activeTemplates.filter(t => t.category === 'checklists');
  const preSigningTemplates = activeTemplates.filter(t => t.category === 'pre_signing_negotiation');
  const friendlyTemplates = activeTemplates.filter(t => t.category === 'friendly_approach');
  const professionalTemplates = activeTemplates.filter(t => t.category === 'professional_escalation');
  const finalTemplates = activeTemplates.filter(t => t.category === 'final_measures');

  const renderTemplateCard = (template, gradientClass) => {
    const title = language === 'th' && template.title_th ? template.title_th : template.title_en;
    const description = language === 'th' && template.description_th ? template.description_th : template.description_en || '';
    
    return (
      <div
        key={template.template_key}
        onClick={() => navigate(createPageUrl("TemplateForm") + `?subject=${template.template_key}`)}
        className="rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer p-6"
        style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.borderColor}` }}
      >
        <div className={`h-1 ${gradientClass} rounded-t-xl mb-4`} />
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold flex-1" style={{ color: colors.textPrimary }}>
            {title}
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
        <button className="text-sm font-medium text-emerald-700 hover:underline">
          {strings.openTemplate} →
        </button>
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
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
            {strings.title}
          </h1>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            {strings.subtitle}
          </p>
        </div>

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

        {activeTemplates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
              {strings.noTemplates}
            </p>
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

            {/* Friendly Approach */}
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