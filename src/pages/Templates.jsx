import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ShoppingCart, Eye, Loader2, CheckSquare, Mail, AlertTriangle, Clipboard, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import AuthGuard from "../components/shared/AuthGuard";
import { ToastProvider, useToast } from "../components/shared/Toast";
import { haptic } from "../components/shared/HapticFeedback";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import TemplateViewer from "../components/templates/TemplateViewer";
import { translateTemplateMetadata } from "../components/templates/translateTemplate";

function TemplatesContent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [filter, setFilter] = useState('all');
  const [expandedSections, setExpandedSections] = useState({
    lease_agreement: true,
    before_signing: true,
    during_tenancy: true,
    preparing_moveout: false,
    after_moveout: false,
    landlord: false,
    disputes: false
  });
  const [showMoreSections, setShowMoreSections] = useState({});
  const [translatedMetadata, setTranslatedMetadata] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const letterCredits = user?.letter_credits || 0;
  const hasUnlimitedCredits = false; // Secure tier now has 50 credits, not unlimited
  const isAdmin = user?.role === 'admin' || user?.access_level === 'admin' || user?.access_level === 'super_admin';
  const userTier = user?.plan_tier || 'free';

  // Fetch template download usage
  const { data: templateUsage } = useQuery({
    queryKey: ['templateUsage', user?.email],
    queryFn: async () => {
      const response = await base44.functions.invoke('checkTemplateDownloadLimit', {
        userEmail: user.email,
        tier: userTier
      });
      return response?.data;
    },
    enabled: !!user
  });

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
        const catOrder = { checklists: 1, pre_signing: 2, initial_resolution: 3, professional: 4, final: 5, landlord: 6, lease_agreement: 7 };
        const catA = catOrder[a.category] || 99;
        const catB = catOrder[b.category] || 99;
        if (catA !== catB) return catA - catB;
        return (a.sort_order || 100) - (b.sort_order || 100);
      });
      
      return uniqueTemplates;
    }
  });

  // Translate template metadata for non-EN/TH languages
  React.useEffect(() => {
    if (!templates || templates.length === 0 || !language) return;
    if (['en', 'th'].includes(language)) return;

    const translateAll = async () => {
      const translations = {};
      
      // Translate only visible templates (first 10) to avoid overwhelming the API
      const visibleTemplates = templates.slice(0, 10);
      
      for (const template of visibleTemplates) {
        try {
          const metadata = await translateTemplateMetadata(template, language);
          translations[template.template_key] = metadata;
        } catch (error) {
          console.error(`[TRANSLATE] Failed for ${template.template_key}:`, error);
          // Fallback to EN
          translations[template.template_key] = {
            title: template.title_en,
            description: template.description_en
          };
        }
      }
      
      setTranslatedMetadata(translations);
    };

    translateAll();
  }, [templates, language]);

  const handleViewTemplate = (template) => {
    if (!template || !template.id) {
      console.error('[TEMPLATE] Invalid template data');
      return;
    }
    console.log('[TEMPLATE] View action:', { template_key: template?.template_key, lang: language });
    haptic.light();
    setViewingTemplate(template);
  };

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
      subtitle: "View templates for free. Copy text or download Word. Credit cost shown on each template.",
      creditsBalance: "Credits:",
      view: "View",
      noTemplates: "No templates available",
      showMore: "Show more",
      all: "All",
      checklists: "Checklists",
      letters: "Letters",
      disputes: "Disputes",
      inventory: "Inventory",
      sections: {
        lease_agreement: "Lease Agreement",
        before_signing: "Pre-Signing",
        during_tenancy: "During Tenancy",
        preparing_moveout: "Preparing to Move-Out",
        after_moveout: "End of Lease",
        landlord: "Landlord",
        disputes: "Escalation"
      }
    },
    th: {
      title: "เทมเพลตเอกสาร",
      subtitle: "ดูเทมเพลตฟรี คัดลอกข้อความหรือดาวน์โหลด Word ค่าเครดิตแสดงในแต่ละเทมเพลต",
      creditsBalance: "เครดิต:",
      view: "ดู",
      noTemplates: "ไม่มีเทมเพลต",
      showMore: "แสดงเพิ่ม",
      all: "ทั้งหมด",
      checklists: "รายการตรวจสอบ",
      letters: "จดหมาย",
      disputes: "ข้อพิพาท",
      inventory: "ทะเบียนทรัพย์สิน",
      sections: {
        lease_agreement: "สัญญาเช่า",
        before_signing: "ก่อนลงนาม",
        during_tenancy: "ระหว่างการเช่า",
        preparing_moveout: "เตรียมย้ายออก",
        after_moveout: "สิ้นสุดการเช่า",
        landlord: "เจ้าของที่พัก",
        disputes: "การยกระดับ"
      }
    },
    zh: {
      title: "文档模板",
      subtitle: "免费查看模板。复制文本或下载Word。每个模板显示积分费用。",
      creditsBalance: "积分：",
      view: "查看",
      noTemplates: "没有可用的模板",
      showMore: "显示更多",
      all: "全部",
      checklists: "清单",
      letters: "信函",
      disputes: "争议",
      inventory: "清单",
      sections: {
        lease_agreement: "租赁协议",
        before_signing: "签署前",
        during_tenancy: "租赁期间",
        preparing_moveout: "准备搬出",
        after_moveout: "租约结束",
        landlord: "房东",
        disputes: "升级"
      }
    },
    ja: {
      title: "文書テンプレート",
      subtitle: "無料でテンプレートを表示。テキストをコピーまたはWordをダウンロード。各テンプレートにクレジットコストが表示されます。",
      creditsBalance: "クレジット：",
      view: "表示",
      noTemplates: "利用可能なテンプレートがありません",
      showMore: "もっと見る",
      all: "すべて",
      checklists: "チェックリスト",
      letters: "手紙",
      disputes: "紛争",
      inventory: "目録",
      sections: {
        lease_agreement: "賃貸契約書",
        before_signing: "署名前",
        during_tenancy: "賃貸期間中",
        preparing_moveout: "退去準備",
        after_moveout: "賃貸終了",
        landlord: "大家さん",
        disputes: "エスカレーション"
      }
    },
    ko: {
      title: "문서 템플릿",
      subtitle: "무료로 템플릿 보기. 텍스트 복사 또는 Word 다운로드. 각 템플릿에 크레딧 비용이 표시됩니다.",
      creditsBalance: "크레딧：",
      view: "보기",
      noTemplates: "사용 가능한 템플릿이 없습니다",
      showMore: "더 보기",
      all: "전체",
      checklists: "체크리스트",
      letters: "레터",
      disputes: "분쟁",
      inventory: "목록",
      sections: {
        lease_agreement: "임대 계약서",
        before_signing: "서명 전",
        during_tenancy: "임대 기간",
        preparing_moveout: "이사 준비",
        after_moveout: "이사 후",
        disputes: "분쟁 및 에스컬레이션"
      }
    },
    ru: {
      title: "Шаблоны документов",
      subtitle: "Просмотр шаблонов бесплатно. Копирование текста или загрузка Word. Стоимость кредитов указана на каждом шаблоне.",
      creditsBalance: "Кредиты：",
      view: "Просмотр",
      noTemplates: "Нет доступных шаблонов",
      showMore: "Показать еще",
      all: "Все",
      checklists: "Чек-листы",
      letters: "Письма",
      disputes: "Споры",
      inventory: "Опись",
      sections: {
        lease_agreement: "Договор аренды",
        before_signing: "До подписания",
        during_tenancy: "Во время аренды",
        preparing_moveout: "Подготовка к выезду",
        after_moveout: "Окончание аренды",
        landlord: "Арендодатель",
        disputes: "Эскалация"
      }
    }
  };

  const strings = t[language] || t.en;

  // Template to lifecycle section mapping
  const templateToSection = {
    'thailand-standard-lease-agreement': 'lease_agreement',
    'pre_signing_checklist': 'before_signing',
    'pre_signing_negotiation': 'before_signing',
    'clause_modification_request': 'before_signing',
    'pre_move_in_condition_challenge': 'before_signing',
    'lease_amendment_request': 'during_tenancy',
    'move_in_condition_checklist': 'during_tenancy',
    'asset_register_checklist': 'during_tenancy',
    'unauthorised_entry_complaint': 'during_tenancy',
    'quiet_enjoyment_concern': 'during_tenancy',
    'utility_overcharging_query': 'during_tenancy',
    'subletting_permission_request': 'during_tenancy',
    'pet_modification_approval': 'during_tenancy',
    'rent_reduction_request': 'during_tenancy',
    'notice_to_vacate': 'preparing_moveout',
    'pre_move_out_inspection_request': 'preparing_moveout',
    'move_out_preparation_checklist': 'preparing_moveout',
    'evidence_preservation_notice': 'preparing_moveout',
    'request_for_evidence': 'after_moveout',
    'deposit_itemised_deductions': 'after_moveout',
    'deposit_deduction_dispute': 'after_moveout',
    'property_condition_dispute': 'disputes',
    'deposit_withholding_dispute_formal': 'disputes',
    'polite_final_followup': 'disputes',
    'building_management_complaint': 'disputes',
    'notice_intent_external_guidance': 'disputes',
    'response_deposit_dispute': 'landlord',
    'property_inspection_notice': 'landlord',
    'property_abandonment_notice': 'landlord'
  };

  // Template to type mapping for filtering
  const templateToType = {
    'pre_signing_checklist': 'checklists',
    'move_in_condition_checklist': 'checklists',
    'move_out_preparation_checklist': 'checklists',
    'asset_register_checklist': 'inventory',
    'pre_signing_negotiation': 'letters',
    'clause_modification_request': 'letters',
    'pre_move_in_condition_challenge': 'letters',
    'lease_amendment_request': 'letters',
    'notice_to_vacate': 'letters',
    'pre_move_out_inspection_request': 'letters',
    'request_for_evidence': 'letters',
    'deposit_itemised_deductions': 'letters',
    'unauthorised_entry_complaint': 'letters',
    'quiet_enjoyment_concern': 'letters',
    'utility_overcharging_query': 'letters',
    'subletting_permission_request': 'letters',
    'pet_modification_approval': 'letters',
    'rent_reduction_request': 'letters',
    'deposit_deduction_dispute': 'disputes',
    'evidence_preservation_notice': 'letters',
    'polite_final_followup': 'disputes',
    'response_deposit_dispute': 'letters',
    'property_inspection_notice': 'letters',
    'property_abandonment_notice': 'letters',
    'building_management_complaint': 'disputes',
    'notice_intent_external_guidance': 'disputes',
    'property_condition_dispute': 'disputes',
    'deposit_withholding_dispute_formal': 'disputes'
  };

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    if (filter === 'all') return true;
    return templateToType[t.template_key] === filter;
  });

  // Group by lifecycle section
  const sectionedTemplates = filteredTemplates.reduce((acc, template) => {
    const section = templateToSection[template.template_key] || 'disputes';
    if (!acc[section]) acc[section] = [];
    acc[section].push(template);
    return acc;
  }, {});

  // Section order
  const sectionOrder = ['lease_agreement', 'before_signing', 'during_tenancy', 'preparing_moveout', 'after_moveout', 'landlord', 'disputes'];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    haptic.light();
  };

  const toggleShowMore = (section) => {
    setShowMoreSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    haptic.light();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-6xl mx-auto flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#0C3B2E' }} />
        </div>
      </div>
    );
  }

  // Check for return URL in sessionStorage
  const returnUrl = typeof window !== 'undefined' ? sessionStorage.getItem('reportReturnUrl') : null;

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg, paddingBottom: '100px' }}>
      <div className="max-w-6xl mx-auto">
        {/* Back to Report Button */}
        {returnUrl && (
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => {
                haptic.light();
                sessionStorage.removeItem('reportReturnUrl');
                window.location.href = returnUrl;
              }}
              className="flex items-center gap-2"
              style={{ color: colors.textPrimary }}
            >
              <ArrowLeft className="w-4 h-4" />
              {language === 'th' ? '← กลับไปที่รายงาน' : language === 'ru' ? '← Вернуться к отчету' : '← Back to Report'}
            </Button>
          </div>
        )}
        
        <PageHeader
          title={strings.title}
          subtitle={strings.subtitle}
          icon={FileText}
          iconColor="#0C3B2E"
          showBack={false}
          isDarkMode={isDarkMode}
          actions={
            <div className="flex flex-col gap-2">
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

              {/* Template Usage for Free/Lite tiers */}
              {['free', 'lite', 'explorer'].includes(userTier) && templateUsage && (
                <Card className="border-none shadow-md" style={{ backgroundColor: colors.cardBg }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                        {language === 'th' ? 'เทมเพลตที่ใช้' : 'Templates Used'}
                      </span>
                      <span className="text-sm font-bold" style={{ 
                        color: templateUsage.used >= templateUsage.limit ? '#EF4444' : '#0C3B2E' 
                      }}>
                        {templateUsage.used}/{templateUsage.limit}
                      </span>
                    </div>
                    {templateUsage.used >= templateUsage.limit && (
                      <div className="mt-2 p-2 rounded-lg text-center" style={{ backgroundColor: '#FEE2E2' }}>
                        <p className="text-xs font-semibold" style={{ color: '#DC2626' }}>
                          {language === 'th' 
                            ? 'ถึงขอบเขตแล้ว! อัปเกรดเพื่อเทมเพลตไม่จำกัด' 
                            : 'Limit reached! Upgrade for unlimited templates'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Secure tier badge */}
              {userTier === 'secure' && (
                <Card className="border-none shadow-md" style={{ backgroundColor: colors.cardBg }}>
                  <CardContent className="p-3 flex items-center justify-center">
                    <Badge className="text-sm font-bold px-3 py-1" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                      {language === 'th' ? '✨ 50 เครดิต/เดือน' : '✨ 50 credits/month'}
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>
          }
        />

        {/* Platform Disclaimer */}
        <div className="mb-6 p-4 rounded-xl" style={{
          backgroundColor: isDarkMode ? '#1E293B' : '#FFFBEB',
          border: `1px solid ${isDarkMode ? 'rgba(245,158,11,0.3)' : '#FDE68A'}`,
        }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
            <p className="text-xs leading-relaxed" style={{ color: isDarkMode ? '#FDE68A' : '#92400E' }}>
              {language === 'th'
                ? 'Lease Shield ไม่ใช่สำนักงานกฎหมายและไม่ได้ให้คำปรึกษาทางกฎหมาย แม่แบบจดหมายเหล่านี้เป็นเครื่องมือสื่อสารเชิงปฏิบัติที่ออกแบบมาเพื่อช่วยให้คุณสามารถอธิบายสถานการณ์ของคุณได้อย่างชัดเจนและเป็นมืออาชีพ ไม่ถือเป็นเอกสารทางกฎหมายหรือคำแนะนำทางกฎหมายแต่อย่างใด Lease Shield ไม่รับผิดชอบต่อผลลัพธ์ใด ๆ ที่เกิดจากการใช้แม่แบบเหล่านี้'
                : 'Lease Shield is not a law firm and does not provide legal advice. These letter templates are practical communication tools designed to help you express your situation clearly and professionally. They do not constitute legal documents or legal advice, and should not be treated as such. If your situation involves a significant financial dispute or potential legal action, we recommend seeking independent legal advice from a qualified professional. Lease Shield accepts no responsibility for outcomes arising from the use of these templates.'}
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'checklists', 'letters', 'disputes', 'inventory'].map(filterType => (
            <button
              key={filterType}
              onClick={() => {
                setFilter(filterType);
                haptic.light();
              }}
              className="px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all"
              style={{
                backgroundColor: filter === filterType ? '#0C3B2E' : colors.fieldBg,
                color: filter === filterType ? '#FFFFFF' : colors.textPrimary,
                border: `1px solid ${filter === filterType ? '#0C3B2E' : colors.borderColor}`
              }}
            >
              {strings[filterType]}
            </button>
          ))}
        </div>





        {filteredTemplates.length === 0 ? (
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
          <div className="space-y-4">
            {sectionOrder.map(section => {
              const sectionTemplates = sectionedTemplates[section] || [];
              if (sectionTemplates.length === 0) return null;

              const isExpanded = expandedSections[section];
              const showingMore = showMoreSections[section];
              const visibleTemplates = showingMore ? sectionTemplates : sectionTemplates.slice(0, 3);
              const hasMore = sectionTemplates.length > 3;

              return (
                <div key={section} className="rounded-xl overflow-hidden" style={{ 
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.borderColor}`
                }}>
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section)}
                    className="w-full flex items-center justify-between p-4 hover:bg-black/5 transition-all"
                  >
                    <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                      {strings.sections[section] || section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h2>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" style={{ color: colors.textSecondary }} />
                    ) : (
                      <ChevronDown className="w-5 h-5" style={{ color: colors.textSecondary }} />
                    )}
                  </button>

                  {/* Section Content */}
                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {visibleTemplates.map((template) => {
                       if (!template || !template.id) return null;

                       // Get translated metadata from state or use original
                       const metadata = translatedMetadata[template.template_key] || {
                         title: language === 'th' ? (template.title_th || template.title_en || 'Untitled') : (template.title_en || 'Untitled'),
                         description: language === 'th' ? (template.description_th || template.description_en || '') : (template.description_en || '')
                       };

                       const title = metadata.title;
                       const description = metadata.description;
                        
                        // Determine icon
                        let TemplateIcon = FileText;
                        if (template.template_key === 'asset_register_checklist') {
                          TemplateIcon = Clipboard;
                        } else if (templateToType[template.template_key] === 'checklists') {
                          TemplateIcon = CheckSquare;
                        } else if (templateToType[template.template_key] === 'letters') {
                          TemplateIcon = Mail;
                        } else if (templateToType[template.template_key] === 'disputes') {
                          TemplateIcon = AlertTriangle;
                        }

                        return (
                          <Card
                            key={template.id}
                            className="border-none shadow-sm transition-all cursor-pointer"
                            onClick={() => handleViewTemplate(template)}
                            style={{ 
                              backgroundColor: colors.fieldBg,
                              minHeight: '120px',
                              maxHeight: '120px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                              e.currentTarget.style.borderColor = '#0C3B2E';
                              e.currentTarget.style.border = '1px solid #0C3B2E';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = '';
                              e.currentTarget.style.border = 'none';
                            }}
                          >
                            <CardContent className="p-4 h-full flex items-center gap-4">
                              {/* Icon */}
                              <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center" style={{ 
                                backgroundColor: colors.cardBg,
                                border: `1px solid ${colors.borderColor}`
                              }}>
                                <TemplateIcon className="w-6 h-6" style={{ color: '#0C3B2E' }} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm line-clamp-1 mb-1" style={{ color: colors.textPrimary }}>
                                  {title}
                                  {template.template_key === 'asset_register_checklist' && (
                                    <span className="block text-xs font-normal opacity-75 mt-0.5">
                                      {language === 'th' ? 'รายการตรวจสอบ · ต้องลงนามทั้งสองฝ่าย' : 'Checklist · Requires tenant & landlord signatures'}
                                    </span>
                                  )}
                                </h3>
                                <p className="text-xs line-clamp-2" style={{ color: colors.textSecondary }}>
                                  {description || (language === 'th' ? 'ดูรายละเอียดเพิ่มเติม' : 'View details')}
                                </p>
                              </div>

                              {/* View indicator */}
                              <div className="flex-shrink-0 flex items-center">
                                <Eye className="w-4 h-4" style={{ color: colors.textSecondary }} />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}

                      {/* Show More Button */}
                      {hasMore && !showingMore && (
                        <button
                          onClick={() => toggleShowMore(section)}
                          className="w-full py-3 rounded-lg font-semibold text-sm transition-all hover:bg-black/5"
                          style={{ 
                            color: colors.textPrimary,
                            border: `1px dashed ${colors.borderColor}`
                          }}
                        >
                          {strings.showMore} ({sectionTemplates.length - 3})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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