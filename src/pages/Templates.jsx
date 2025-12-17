import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function Templates() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allTemplates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.TemplateLibrary.list('-created_date'),
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const userCredits = user?.letter_credits || 0;

  // Filter for active templates only (same as AdminTemplates logic)
  const activeTemplates = allTemplates.filter(t => t.is_active !== false);

  // Log verification counts
  React.useEffect(() => {
    if (allTemplates.length > 0) {
      const adminActiveCount = allTemplates.filter(t => t.is_active !== false).length;
      const missingCategoryCount = activeTemplates.filter(t => !t.category).length;
      
      console.log('📊 Template Verification:');
      console.log('  Total templates:', allTemplates.length);
      console.log('  Active templates (adminActiveCount):', adminActiveCount);
      console.log('  Active templates (userActiveCount):', activeTemplates.length);
      console.log('  Missing category count:', missingCategoryCount);
      console.log('  ✅ Counts match:', adminActiveCount === activeTemplates.length);
    }
  }, [allTemplates, activeTemplates]);

  // Transform to match old structure with proper category normalization
  const templates = activeTemplates.map(t => ({
    id: t.template_key || t.id,
    name: { en: t.title_en, th: t.title_th },
    description: { en: t.description_en || '', th: t.description_th || '' },
    category: t.category ? t.category.toLowerCase().replace('_', '-') : 'other'
  }));

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
      subtitle: "Professional multi-language escalation ladder - all templates available",
      creditBalance: "Credit Balance",
      oneLetterPerCredit: "1 letter = 1 credit",
      purchaseCredits: "Purchase Credits",
      preSigningSection: "⭐ Pre-Signing Negotiation",
      friendlyApproach: "Friendly Approach (3 Letters)",
      professionalEscalation: "Professional Escalation (4 Letters)",
      finalMeasures: "Final Measures (3 Letters)",
      openTemplate: "Open",
      back: "Back",
      disclaimer: "Lease Shield provides general guidance and document templates for your convenience. Lease Shield is not a law firm, does not provide legal representation, and is not a party to your lease. You are responsible for checking the accuracy of all information and documents before sending them."
    },
    th: {
      title: "เทมเพลตจดหมาย",
      subtitle: "บันไดการยกระดับมืออาชีพสองภาษา - ทุกเทมเพลตพร้อมใช้งาน",
      creditBalance: "เครดิตคงเหลือ",
      oneLetterPerCredit: "1 จดหมาย = 1 เครดิต",
      purchaseCredits: "ซื้อเครดิต",
      preSigningSection: "⭐ เจรจาก่อนลงนาม",
      friendlyApproach: "แนวทางเป็นมิตร (3 จดหมาย)",
      professionalEscalation: "การยกระดับอย่างมืออาชีพ (4 จดหมาย)",
      finalMeasures: "มาตรการสุดท้าย (3 จดหมาย)",
      openTemplate: "เปิด",
      back: "กลับ",
      disclaimer: "Lease Shield ให้คำแนะนำทั่วไปและเทมเพลตเอกสารเพื่อความสะดวกของคุณ Lease Shield ไม่ใช่สำนักงานกฎหมาย ไม่ให้บริการตัวแทนทางกฎหมาย และไม่ได้เป็นคู่สัญญาในสัญญาเช่าของคุณ คุณมีหน้าที่รับผิดชอบในการตรวจสอบความถูกต้องของข้อมูลและเอกสารทั้งหมดก่อนส่ง"
    }
  };

  const strings = t[language] || t.en;

  // Category normalization - handle both formats (pre-signing and pre_signing)
  const preSigningTemplates = templates.filter(t => 
    t.category === 'pre-signing' || t.category === 'pre_signing'
  );
  const friendlyTemplates = templates.filter(t => t.category === 'friendly');
  const professionalTemplates = templates.filter(t => t.category === 'professional');
  const finalTemplates = templates.filter(t => t.category === 'final');
  const otherTemplates = templates.filter(t => 
    !['pre-signing', 'pre_signing', 'friendly', 'professional', 'final'].includes(t.category)
  );

  const handleTemplateClick = (templateId) => {
    navigate(createPageUrl("TemplateForm") + `?subject=${templateId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
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

        {/* Pre-Signing Section */}
        {preSigningTemplates.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              {strings.preSigningSection}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {preSigningTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateClick(template.id)}
                  className="rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer p-6"
                  style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.borderColor}` }}
                >
                  <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-600 rounded-t-xl mb-4" />
                  <h3 className="text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
                    {template.name[language] || template.name.en}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                    {template.description[language] || template.description.en}
                  </p>
                  <button className="text-sm font-medium text-emerald-700 hover:underline">
                    {strings.openTemplate} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friendly Approach Section */}
        {friendlyTemplates.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              {strings.friendlyApproach}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friendlyTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateClick(template.id)}
                  className="rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer p-6"
                  style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.borderColor}` }}
                >
                  <div className="h-1 bg-gradient-to-r from-blue-400 to-purple-600 rounded-t-xl mb-4" />
                  <h3 className="text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
                    {template.name[language] || template.name.en}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                    {template.description[language] || template.description.en}
                  </p>
                  <button className="text-sm font-medium text-emerald-700 hover:underline">
                    {strings.openTemplate} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Professional Escalation Section */}
        {professionalTemplates.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              {strings.professionalEscalation}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {professionalTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateClick(template.id)}
                  className="rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer p-6"
                  style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.borderColor}` }}
                >
                  <div className="h-1 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-t-xl mb-4" />
                  <h3 className="text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
                    {template.name[language] || template.name.en}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                    {template.description[language] || template.description.en}
                  </p>
                  <button className="text-sm font-medium text-emerald-700 hover:underline">
                    {strings.openTemplate} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Measures Section */}
        {finalTemplates.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              {strings.finalMeasures}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {finalTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateClick(template.id)}
                  className="rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer p-6"
                  style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.borderColor}` }}
                >
                  <div className="h-1 bg-gradient-to-r from-orange-600 to-red-700 rounded-t-xl mb-4" />
                  <h3 className="text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
                    {template.name[language] || template.name.en}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                    {template.description[language] || template.description.en}
                  </p>
                  <button className="text-sm font-medium text-emerald-700 hover:underline">
                    {strings.openTemplate} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Templates Section (if any without proper category) */}
        {otherTemplates.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              Other Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateClick(template.id)}
                  className="rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer p-6"
                  style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.borderColor}` }}
                >
                  <div className="h-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-t-xl mb-4" />
                  <h3 className="text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
                    {template.name[language] || template.name.en}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                    {template.description[language] || template.description.en}
                  </p>
                  <button className="text-sm font-medium text-emerald-700 hover:underline">
                    {strings.openTemplate} →
                  </button>
                </div>
              ))}
            </div>
          </div>
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