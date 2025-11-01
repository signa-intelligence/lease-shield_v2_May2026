
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Keep Button if used elsewhere, otherwise remove. Not used in the final snippet.
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
// Keep all icon imports from lucide-react as they are now used directly as JSX elements within the template data.
import { FileCheck, ArrowLeft, Mail, AlertCircle, FileText, Shield, Scale, Clock, ClipboardCheck, ScrollText, FileX, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
// Remove FeatureGate and useFeatureAccess as the new access logic is directly implemented using user?.plan_tier.
// import { FeatureGate, useFeatureAccess } from "../components/shared/FeatureGate";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CardContent } from "@/components/ui/card"; // Add CardContent import

// Define colors and isDarkMode. Assuming a light theme for colors and isDarkMode=false as no context is provided.
const isDarkMode = false; // Placeholder, integrate with actual theme context if available
const colors = {
  bg: '#F9FAFB', // Lighter background color
  textPrimary: '#1A1D1F', // Dark charcoal for primary text
  textSecondary: '#6B7280', // Slate gray for secondary text
  cardBg: '#FFFFFF', // White card background
};


// Update TEMPLATES structure
const TEMPLATES = [
  {
    id: 'deposit_request',
    name_en: 'Deposit Return Request',
    name_th: 'จดหมายขอคืนเงินมัดจำ',
    description_en: 'Polite formal letter requesting return of security deposit (EN/TH)',
    description_th: 'จดหมายทางการสุภาพขอคืนเงินประกัน (ไทย/EN)',
    icon: <Shield className="w-full h-full" />,
    tier: 'lite',
    color: 'from-blue-400 to-blue-600' // Example color gradient
  },
  {
    id: 'deposit_late',
    name_en: 'Late Deposit Return Reminder',
    name_th: 'จดหมายเตือนคืนเงินมัดจำล่าช้า',
    description_en: 'Follow-up reminder for overdue deposit return with timeline request',
    description_th: 'จดหมายติดตามเงินมัดจำที่เกินกำหนดพร้อมขอกำหนดเวลา',
    icon: <Clock className="w-full h-full" />,
    tier: 'lite',
    color: 'from-yellow-400 to-yellow-600'
  },
  {
    id: 'repair_dispute',
    name_en: 'Repair Cost Dispute',
    name_th: 'โต้แย้งค่าซ่อมแซม',
    description_en: 'Dispute unfair repair charges with evidence references',
    description_th: 'โต้แย้งค่าซ่อมแซมที่ไม่ยุติธรรมพร้อมอ้างอิงหลักฐาน',
    icon: <AlertCircle className="w-full h-full" />,
    tier: 'protect',
    color: 'from-red-400 to-red-600'
  },
  {
    id: 'pdpa_request',
    name_en: 'PDPA Data Request',
    name_th: 'ขอข้อมูลตาม พ.ร.บ. PDPA',
    description_en: 'Request personal data and lease documents under PDPA',
    description_th: 'ขอข้อมูลส่วนบุคคลและเอกสารเช่าตาม พ.ร.บ. PDPA',
    icon: <FileText className="w-full h-full" />,
    tier: 'protect',
    color: 'from-purple-400 to-purple-600'
  },
  {
    id: 'pre_move_out',
    name_en: 'Pre-Move-Out Notice',
    name_th: 'แจ้งก่อนย้ายออก',
    description_en: 'Formal notice of move-out date and inspection request',
    description_th: 'แจ้งวันย้ายออกและขอตรวจสอบอย่างเป็นทางการ',
    icon: <Mail className="w-full h-full" />,
    tier: 'lite',
    color: 'from-indigo-400 to-indigo-600'
  },
  {
    id: 'handover_check',
    name_en: 'Handover Inspection Checklist',
    name_th: 'รายการตรวจสอบการส่งมอบ',
    description_en: 'Comprehensive checklist for property handover with photo slots',
    description_th: 'รายการตรวจสอบครบถ้วนสำหรับการส่งมอบพร้อมช่องรูปภาพ',
    icon: <ClipboardCheck className="w-full h-full" />,
    tier: 'protect',
    color: 'from-teal-400 to-teal-600'
  },
  {
    id: 'contract_clarification',
    name_en: 'Contract Clarification Request',
    name_th: 'ขอชี้แจงสัญญา',
    description_en: 'Request clarification on specific lease clauses',
    description_th: 'ขอให้ชี้แจงข้อกำหนดเฉพาะในสัญญาเช่า',
    icon: <Scale className="w-full h-full" />,
    tier: 'lite',
    color: 'from-lime-400 to-lime-600'
  },
  {
    id: 'lease_extension',
    name_en: 'Lease Extension Request',
    name_th: 'จดหมายขอต่อสัญญาเช่า',
    description_en: 'Formal request to extend your lease agreement',
    description_th: 'จดหมายขอต่อสัญญาเช่าอย่างเป็นทางการ',
    icon: <ScrollText className="w-full h-full" />,
    tier: 'lite',
    color: 'from-green-400 to-green-600'
  },
  {
    id: 'lease_termination',
    name_en: 'Lease Termination Notice',
    name_th: 'จดหมายแจ้งยกเลิกสัญญาเช่า',
    description_en: 'Official notice to terminate your lease agreement',
    description_th: 'จดหมายแจ้งยกเลิกสัญญาเช่าอย่างเป็นทางการ',
    icon: <FileX className="w-full h-full" />,
    tier: 'lite',
    color: 'from-orange-400 to-orange-600'
  },
  {
    id: 'noise_complaint',
    name_en: 'Noise Complaint Letter',
    name_th: 'จดหมายร้องเรียนเสียงรบกวน',
    description_en: 'Formal complaint about noise disturbances',
    description_th: 'จดหมายร้องเรียนเสียงรบกวนอย่างเป็นทางการ',
    icon: <Volume2 className="w-full h-full" />,
    tier: 'lite',
    color: 'from-pink-400 to-pink-600'
  }
];

export default function Templates() {
  const navigate = useNavigate();
  // Remove useFeatureAccess as access is now determined by user?.plan_tier
  // const { hasAccess: hasTemplatesLite } = useFeatureAccess('templates_lite');
  // const { hasAccess: hasTemplatesFull } = useFeatureAccess('templates_full');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';

  // Update t object with new string keys
  const t = {
    en: {
      title: "Legal Templates", // Changed title slightly for conciseness
      subtitle: "Standard bilingual letters and messages for all situations",
      backToEvidence: "Back to Evidence Vault", // Not used in new UI, but keeping for completeness
      generateLetter: "Generate Letter", // Not used in new UI, card click handles it
      planRequired: "PLAN REQUIRED", // Not used in new UI, replaced by upgradeRequired
      freeTier: "FREE",
      liteTier: "LITE",
      protectTier: "PROTECT",
      secureTier: "SECURE",
      upgradeRequired: "Upgrade plan to access"
    },
    th: {
      title: "เทมเพลตทางกฎหมาย", // Changed title slightly for conciseness
      subtitle: "จดหมายและข้อความสองภาษามาตรฐานสำหรับทุกสถานการณ์",
      backToEvidence: "กลับไปยังคลังหลักฐาน", // Not used in new UI
      generateLetter: "สร้างจดหมาย", // Not used in new UI
      planRequired: "ต้องการแผน", // Not used in new UI
      freeTier: "ฟรี",
      liteTier: "ไลท์",
      protectTier: "โปรเทค",
      secureTier: "ซีเคียว",
      upgradeRequired: "อัปเกรดแผนเพื่อเข้าถึง"
    }
  };

  const strings = t[language];

  // Remove canAccessTemplate as access logic is now inline
  // const canAccessTemplate = (tier) => {
  //   if (tier === 'lite') return hasTemplatesLite || hasTemplatesFull;
  //   if (tier === 'protect') return hasTemplatesFull;
  //   return true;
  // };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        {/* Removed the back button as per outline */}
        <div className="mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            {/* Using FileText directly for consistency with new card icon usage */}
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-ls-forest" />
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
          </div>
          <p className="text-sm sm:text-base" style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
        </div>

        {/* Template Grid - Single column on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {TEMPLATES.map((template) => {
            const userTier = user?.plan_tier || 'free'; // Default to 'free' if no plan is set
            // New access logic based on user's plan_tier
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
                onClick={() => hasAccess && navigate(createPageUrl("TemplateForm") + `?template=${template.id}`)}
              >
                {/* Dynamic color strip at the top of the card */}
                <div className={`h-2 bg-gradient-to-r ${template.color} rounded-t-xl`} />
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    {/* Render icon directly as JSX element */}
                    <div className="text-3xl sm:text-4xl">{template.icon}</div>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        // Apply distinct colors based on access for the tier badge
                        backgroundColor: hasAccess ? '#D1FAE5' : '#FEE2E2', // Green for access, Red for no access
                        color: hasAccess ? '#059669' : '#DC2626', // Darker text for status
                        borderColor: hasAccess ? '#A7F3D0' : '#FECACA' // Lighter border for status
                      }}
                    >
                      {/* Display tier label */}
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
                      backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2', // Darker red for dark mode, light red for light mode
                      color: '#DC2626' // Red text for the upgrade message
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
