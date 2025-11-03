import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Shield, AlertCircle, FileX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const TEMPLATES = [
  {
    id: 'deposit',
    name_en: 'Deposit Return Request',
    name_th: 'จดหมายขอคืนเงินมัดจำ',
    description_en: 'Polite formal letter requesting return of security deposit (EN/TH)',
    description_th: 'จดหมายทางการสุภาพขอคืนเงินประกัน (ไทย/EN)',
    icon: <Shield className="w-full h-full" />,
    tier: 'lite',
    color: 'from-blue-400 to-blue-600'
  },
  {
    id: 'damages',
    name_en: 'Damage Claim Response',
    name_th: 'โต้แย้งค่าซ่อมแซม',
    description_en: 'Dispute unfair damage charges with evidence references (EN/TH)',
    description_th: 'โต้แย้งค่าซ่อมแซมที่ไม่ยุติธรรมพร้อมอ้างอิงหลักฐาน',
    icon: <AlertCircle className="w-full h-full" />,
    tier: 'lite',
    color: 'from-red-400 to-red-600'
  },
  {
    id: 'early_termination',
    name_en: 'Early Termination Notice',
    name_th: 'จดหมายแจ้งยกเลิกสัญญาก่อนกำหนด',
    description_en: 'Official notice to terminate lease agreement early (EN/TH)',
    description_th: 'จดหมายแจ้งยกเลิกสัญญาเช่าก่อนกำหนดอย่างเป็นทางการ',
    icon: <FileX className="w-full h-full" />,
    tier: 'lite',
    color: 'from-orange-400 to-orange-600'
  }
];

export default function Templates() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
  };

  const t = {
    en: {
      title: "Legal Templates",
      subtitle: "Standard bilingual letters for all situations",
      freeTier: "FREE",
      liteTier: "LITE",
      protectTier: "PROTECT",
      secureTier: "SECURE",
      upgradeRequired: "Upgrade plan to access"
    },
    th: {
      title: "เทมเพลตทางกฎหมาย",
      subtitle: "จดหมายสองภาษามาตรฐานสำหรับทุกสถานการณ์",
      freeTier: "ฟรี",
      liteTier: "ไลท์",
      protectTier: "โปรเทค",
      secureTier: "ซีเคียว",
      upgradeRequired: "อัปเกรดแผนเพื่อเข้าถึง"
    }
  };

  const strings = t[language];

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-ls-forest" />
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
          </div>
          <p className="text-sm sm:text-base" style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
        </div>

        {/* Template Grid - Single column on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {TEMPLATES.map((template) => {
            const userTier = user?.plan_tier || 'free';
            const hasAccess = template.tier === 'free' ||
                            (template.tier === 'lite' && ['lite', 'protect', 'secure'].includes(userTier)) ||
                            (template.tier === 'protect' && ['protect', 'secure'].includes(userTier)) ||
                            (template.tier === 'secure' && userTier === 'secure');

            const tierLabels = {
              free: strings.freeTier,
              lite: strings.liteTier,
              protect: strings.protectTier,
              secure: strings.secureTier
            };

            return (
              <Card
                key={template.id}
                className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 ${hasAccess ? 'cursor-pointer' : 'opacity-75'}`}
                style={{ backgroundColor: colors.cardBg }}
                onClick={() => hasAccess && navigate(createPageUrl("TemplateForm") + `?subject=${template.id}`)}
              >
                <div className={`h-2 bg-gradient-to-r ${template.color} rounded-t-xl`} />
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="text-3xl sm:text-4xl">{template.icon}</div>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        backgroundColor: hasAccess ? '#D1FAE5' : '#FEE2E2',
                        color: hasAccess ? '#059669' : '#DC2626',
                        borderColor: hasAccess ? '#A7F3D0' : '#FECACA'
                      }}
                    >
                      {tierLabels[template.tier]}
                    </Badge>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
                    {language === 'th' ? template.name_th : template.name_en}
                  </h3>

                  <p className="text-xs sm:text-sm mb-4" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? template.description_th : template.description_en}
                  </p>

                  {!hasAccess && (
                    <div className="text-xs text-center p-2 rounded-lg" style={{
                      backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2',
                      color: '#DC2626'
                    }}>
                      {strings.upgradeRequired}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}