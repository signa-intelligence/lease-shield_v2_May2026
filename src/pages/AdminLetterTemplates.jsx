import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FileText, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { haptic } from "@/components/shared/HapticFeedback";

export default function AdminLetterTemplates() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['letterTemplates'],
    queryFn: () => base44.entities.LetterTemplate.filter({}),
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: 'rgba(255,255,255,0.1)',
  } : {
    bg: '#F3F6F5',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#475569',
    border: 'rgba(12,59,46,0.08)',
  };

  const t = {
    en: {
      title: 'Letter Template Library',
      subtitle: 'Manage bilingual letter templates',
      loading: 'Loading templates...',
      noTemplates: 'No templates found',
      category: 'Category',
      tone: 'Tone',
      templateId: 'Template ID',
      openGenerator: 'Open in Generator',
    },
    th: {
      title: 'ไลบรารีเทมเพลตจดหมาย',
      subtitle: 'จัดการเทมเพลตจดหมายสองภาษา',
      loading: 'กำลังโหลดเทมเพลต...',
      noTemplates: 'ไม่พบเทมเพลต',
      category: 'หมวดหมู่',
      tone: 'น้ำเสียง',
      templateId: 'รหัสเทมเพลต',
      openGenerator: 'เปิดในเครื่องมือสร้าง',
    }
  };

  const strings = t[language] || t.en;

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
            {strings.title}
          </h1>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            {strings.subtitle}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12" style={{ color: colors.textSecondary }}>
            {strings.loading}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12" style={{ color: colors.textSecondary }}>
            {strings.noTemplates}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="card-interactive"
                style={{
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#0C3B2E' }}
                    >
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold mb-1" style={{ color: colors.text }}>
                        {template.title_en}
                      </h3>
                      <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                        {template.title_th}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: '#0C3B2E',
                          color: '#FFFFFF',
                        }}
                      >
                        {template.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: colors.border,
                          color: colors.textSecondary,
                        }}
                      >
                        {template.tone_level}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono" style={{ color: colors.textSecondary }}>
                      {template.template_id}
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      haptic.light();
                      navigate(createPageUrl("lettergenerator") + `?id=${template.template_id}`);
                    }}
                    className="w-full btn-interaction"
                    style={{
                      backgroundColor: '#0C3B2E',
                      color: '#FFFFFF',
                    }}
                  >
                    {strings.openGenerator}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}