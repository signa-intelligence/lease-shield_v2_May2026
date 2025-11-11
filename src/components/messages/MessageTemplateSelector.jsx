import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Mail, Wrench, Wallet, HelpCircle, Loader2 } from "lucide-react";

const CATEGORY_ICONS = {
  rent_reminder: Mail,
  maintenance: Wrench,
  deposit: Wallet,
  lease_inquiry: FileText,
  general: HelpCircle
};

const CATEGORY_COLORS = {
  rent_reminder: '#3B82F6',
  maintenance: '#F59E0B',
  deposit: '#C7A338',
  lease_inquiry: '#0C3B2E',
  general: '#6B7280'
};

export default function MessageTemplateSelector({ open, onClose, onSelect }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['messageTemplates'],
    queryFn: () => base44.entities.MessageTemplate.filter({ is_active: true }),
    enabled: open,
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = {
    bg: isDarkMode ? '#1A1D1F' : '#F8FAFC',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#9CA3AF' : '#64748b',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
    hoverBg: isDarkMode ? '#353A3D' : '#F3F4F6'
  };

  const t = {
    en: {
      selectTemplate: "Select Template",
      noTemplates: "No templates available",
      rentReminder: "Rent Reminder",
      maintenance: "Maintenance",
      deposit: "Deposit",
      leaseInquiry: "Lease Inquiry",
      general: "General"
    },
    th: {
      selectTemplate: "เลือกเทมเพลต",
      noTemplates: "ไม่มีเทมเพลต",
      rentReminder: "เตือนค่าเช่า",
      maintenance: "การซ่อมบำรุง",
      deposit: "เงินมัดจำ",
      leaseInquiry: "สอบถามสัญญา",
      general: "ทั่วไป"
    }
  };

  const strings = t[language];

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.borderColor
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <FileText className="w-6 h-6 text-ls-forest" />
            {strings.selectTemplate}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-ls-forest" />
          </div>
        ) : Object.keys(groupedTemplates).length === 0 ? (
          <div className="text-center py-12" style={{ color: colors.textSecondary }}>
            {strings.noTemplates}
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
              const Icon = CATEGORY_ICONS[category] || HelpCircle;
              const color = CATEGORY_COLORS[category] || '#6B7280';

              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: `${color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <h3 className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                      {strings[category.replace('_', '')] || category}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {categoryTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className="border-none cursor-pointer hover:shadow-md transition-all"
                        style={{
                          backgroundColor: colors.hoverBg,
                          borderLeft: `3px solid ${color}`
                        }}
                        onClick={() => onSelect(template)}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-bold mb-1" style={{ color: colors.textPrimary }}>
                            {language === 'th' ? template.title_th : template.title_en}
                          </h4>
                          <p className="text-sm line-clamp-2" style={{ color: colors.textSecondary }}>
                            {language === 'th' ? template.content_th : template.content_en}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}