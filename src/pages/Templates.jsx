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

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templateAssets'],
    queryFn: async () => {
      const results = await base44.entities.TemplateLibrary.filter(
        { status: 'active' },
        'category,sort_order'
      );
      return results;
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
    haptic.medium();
    setDownloading(template.id);
    downloadMutation.mutate(template);
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
  const checklistTemplates = displayTemplates.filter(t => t.category === 'checklists');
  const preSigningTemplates = displayTemplates.filter(t => t.category === 'pre_signing');
  const initialResolutionTemplates = displayTemplates.filter(t => t.category === 'initial_resolution');
  const professionalTemplates = displayTemplates.filter(t => t.category === 'professional');
  const finalTemplates = displayTemplates.filter(t => t.category === 'final');

  // Auto-scroll to pre-signing if coming from scan - only after templates loaded
  React.useEffect(() => {
    if (leaseIdParam && !isLoading && preSigningTemplates.length > 0) {
      const timer = setTimeout(() => {
        const section = document.querySelector('[data-category="pre_signing"]');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [leaseIdParam, isLoading, preSigningTemplates.length]);

  const renderTemplateCard = (template, gradientClass) => {
    const title = language === 'th' && template.title_th ? template.title_th : template.title_en;
    const description = language === 'th' && template.description_th ? template.description_th : template.description_en || '';
    
    return (
      <div
        key={template.id}
        onClick={() => {
          navigate(createPageUrl("TemplateStore"));
        }}
        className="rounded-xl shadow-md hover:shadow-xl transition-all p-6 cursor-pointer"
        style={{ 
          backgroundColor: colors.cardBg, 
          border: `1px solid ${colors.borderColor}`
        }}
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
            description={language === 'th' ? 'ไม่มีเทมเพลตในขณะนี้' : 'No templates available at this time'}
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
                    const title = language === 'th' ? template.title_th : template.title_en;
                    const description = language === 'th' ? template.description_th : template.description_en;
                    const canDownload = letterCredits >= (template.cost_credits || 1);
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
                              {template.cost_credits || 1} {strings.credit}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <p className="text-sm line-clamp-3" style={{ color: colors.textSecondary }}>
                            {description}
                          </p>

                          {canDownload ? (
                            <Button
                              onClick={() => handleDownload(template)}
                              disabled={isDownloadingThis}
                              className="w-full btn-interaction"
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