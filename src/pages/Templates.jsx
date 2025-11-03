
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Shield, AlertCircle, FileX, Scale, Camera, Mail, AlertTriangle, Gavel, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const TEMPLATES = [
  // LITE TIER (L1-L3)
  {
    id: 'deposit',
    letterKey: 'L1',
    name_en: 'Deposit Return Request',
    name_th: 'จดหมายขอคืนเงินมัดจำ',
    description_en: 'Friendly formal request for security deposit return',
    description_th: 'จดหมายทางการสุภาพขอคืนเงินประกัน',
    icon: Shield,
    tier: 'lite',
    color: 'from-blue-400 to-blue-600'
  },
  {
    id: 'deductions',
    letterKey: 'L2',
    name_en: 'Request for Itemised Deductions',
    name_th: 'ขอรายละเอียดการหักเงิน',
    description_en: 'Request breakdown of damage charges and deductions',
    description_th: 'ขอรายละเอียดค่าเสียหายและการหักเงินแบบแยกรายการ',
    icon: FileText,
    tier: 'lite',
    color: 'from-amber-400 to-amber-600'
  },
  {
    id: 'reminder',
    letterKey: 'L3',
    name_en: 'Friendly Reminder',
    name_th: 'จดหมายเตือนแบบมิตร',
    description_en: 'Gentle follow-up on pending deposit return',
    description_th: 'จดหมายติดตามความคืบหน้าอย่างสุภาพ',
    icon: Mail,
    tier: 'lite',
    color: 'from-purple-400 to-purple-600'
  },
  
  // SECURE TIER (S1-S7)
  {
    id: 'dispute',
    letterKey: 'S1',
    name_en: 'Formal Dispute of Withholding',
    name_th: 'จดหมายคัดค้านการระงับเงิน',
    description_en: 'Formal dispute of unfair deposit withholding',
    description_th: 'จดหมายคัดค้านการระงับเงินประกันอย่างเป็นทางการ',
    icon: Scale,
    tier: 'secure',
    color: 'from-red-500 to-red-700'
  },
  {
    id: 'early_termination',
    letterKey: 'S2',
    name_en: 'Early Termination Reconciliation',
    name_th: 'ประสานยุติสัญญาก่อนกำหนด',
    description_en: 'Coordinate early lease termination details',
    description_th: 'ประสานรายละเอียดการยุติสัญญาก่อนกำหนด',
    icon: FileX,
    tier: 'secure',
    color: 'from-orange-500 to-orange-700'
  },
  {
    id: 'condition_dispute',
    letterKey: 'S3',
    name_en: 'Property Condition Dispute',
    name_th: 'โต้แย้งสภาพทรัพย์สิน',
    description_en: 'Dispute claimed property damages',
    description_th: 'โต้แย้งการเรียกร้องค่าเสียหายทรัพย์สิน',
    icon: Camera,
    tier: 'secure',
    color: 'from-pink-500 to-pink-700'
  },
  {
    id: 'evidence',
    letterKey: 'S4',
    name_en: 'Request for Evidence',
    name_th: 'ขอหลักฐานประกอบ',
    description_en: 'Request supporting documents for claimed damages',
    description_th: 'ขอเอกสารหลักฐานสำหรับค่าเสียหายที่อ้าง',
    icon: FileText,
    tier: 'secure',
    color: 'from-indigo-500 to-indigo-700'
  },
  {
    id: 'final_opportunity',
    letterKey: 'S5',
    name_en: 'Final Opportunity',
    name_th: 'โอกาสสุดท้าย',
    description_en: 'Last chance before formal escalation',
    description_th: 'โอกาสสุดท้ายก่อนดำเนินการทางกฎหมาย',
    icon: AlertTriangle,
    tier: 'secure',
    color: 'from-yellow-600 to-orange-700'
  },
  {
    id: 'non_compliance',
    letterKey: 'S6',
    name_en: 'Notice of Non-Compliance',
    name_th: 'แจ้งไม่ปฏิบัติตามสัญญา',
    description_en: 'Official notice of contract breach',
    description_th: 'แจ้งการฝ่าฝืนสัญญาอย่างเป็นทางการ',
    icon: Gavel,
    tier: 'secure',
    color: 'from-red-600 to-red-800'
  },
  {
    id: 'settlement',
    letterKey: 'S7',
    name_en: 'Settlement Confirmation',
    name_th: 'ยืนยันการตกลงชำระเงิน',
    description_en: 'Confirm successful deposit transfer',
    description_th: 'ยืนยันการคืนเงินประกันสำเร็จ',
    icon: CheckCircle,
    tier: 'secure',
    color: 'from-emerald-500 to-emerald-700'
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
  const userTier = user?.plan_tier || 'free';

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
      title: "Legal Letter Templates",
      subtitle: "Professional bilingual escalation ladder - from friendly to formal",
      liteTier: "LITE",
      protectTier: "PROTECT",
      secureTier: "SECURE",
      upgradeRequired: "Upgrade to access",
      tierSection: {
        lite: "Lite Tier - Friendly Approach (3 Letters)",
        protect: "Protect Tier - Professional Escalation (7 Letters)",
        secure: "Secure Tier - Complete Arsenal (10 Letters)"
      }
    },
    th: {
      title: "เทมเพลตจดหมายทางกฎหมาย",
      subtitle: "บันไดการยกระดับมืออาชีพสองภาษา - จากเป็นมิตรไปเป็นทางการ",
      liteTier: "ไลท์",
      protectTier: "โปรเทค",
      secureTier: "ซีเคียว",
      upgradeRequired: "อัปเกรดเพื่อเข้าถึง",
      tierSection: {
        lite: "ไลท์ เทียร์ - แนวทางเป็นมิตร (3 จดหมาย)",
        protect: "โปรเทค เทียร์ - การยกระดับอย่างมืออาชีพ (7 จดหมาย)",
        secure: "ซีเคียว เทียร์ - คลังแสงอาวุธครบครัน (10 จดหมาย)"
      }
    }
  };

  const strings = t[language];

  // Progressive tier access
  const tierLetters = {
    lite: ["deposit", "deductions", "reminder"],
    protect: ["deposit", "deductions", "reminder", "dispute", "early_termination", "condition_dispute", "evidence"],
    secure: ["deposit", "deductions", "reminder", "dispute", "early_termination", "condition_dispute", "evidence", "final_opportunity", "non_compliance", "settlement"]
  };

  const userLetters = tierLetters[userTier] || [];
  const hasAccessToLetter = (letterId) => userLetters.includes(letterId);

  // Group templates by display tiers
  const liteTemplates = TEMPLATES.filter(t => t.tier === 'lite');
  const secureTemplates = TEMPLATES.filter(t => t.tier === 'secure');

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-ls-forest" />
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
          </div>
          <p className="text-sm sm:text-base mb-4" style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
          
          {/* Tier indicator */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${['lite', 'protect', 'secure'].includes(userTier) ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500'}`}>
              {strings.liteTier} (3)
            </Badge>
            <Badge className={`${['protect', 'secure'].includes(userTier) ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500'}`}>
              {strings.protectTier} (7)
            </Badge>
            <Badge className={`${userTier === 'secure' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-500'}`}>
              {strings.secureTier} (10)
            </Badge>
            <span className="text-xs ml-2" style={{ color: colors.textSecondary }}>
              {language === 'th' ? 'แผนปัจจุบัน: ' : 'Current plan: '} 
              <span className="font-semibold" style={{ color: colors.textPrimary }}>{userTier.toUpperCase()}</span>
            </span>
          </div>
        </div>

        {/* LITE TIER SECTION (L1-L3) */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded"></div>
            <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
              {strings.tierSection.lite}
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-l from-blue-400 to-blue-600 rounded"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {liteTemplates.map((template) => {
              const Icon = template.icon;
              const hasAccess = hasAccessToLetter(template.id);

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
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            backgroundColor: hasAccess ? '#DBEAFE' : '#FEE2E2',
                            color: hasAccess ? '#1D4ED8' : '#DC2626',
                            borderColor: hasAccess ? '#BFDBFE' : '#FECACA'
                          }}
                        >
                          {template.letterKey}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            backgroundColor: hasAccess ? '#DBEAFE' : '#FEE2E2',
                            color: hasAccess ? '#1D4ED8' : '#DC2626',
                            borderColor: hasAccess ? '#BFDBFE' : '#FECACA'
                          }}
                        >
                          {strings.liteTier}
                        </Badge>
                      </div>
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

        {/* PROTECT & SECURE TIER SECTION (S1-S7) */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-emerald-500 via-purple-500 to-red-600 rounded"></div>
            <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
              {userTier === 'secure' ? strings.tierSection.secure : strings.tierSection.protect}
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-l from-emerald-500 via-purple-500 to-red-600 rounded"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {secureTemplates.map((template) => {
              const Icon = template.icon;
              const hasAccess = hasAccessToLetter(template.id);
              
              // Determine which tier unlocks this letter
              const requiredTier = template.id === 'final_opportunity' || template.id === 'non_compliance' || template.id === 'settlement' 
                ? 'secure' 
                : 'protect';

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
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            backgroundColor: hasAccess 
                              ? (requiredTier === 'secure' ? '#F3E8FF' : '#D1FAE5')
                              : '#FEE2E2',
                            color: hasAccess 
                              ? (requiredTier === 'secure' ? '#7C3AED' : '#059669')
                              : '#DC2626',
                            borderColor: hasAccess 
                              ? (requiredTier === 'secure' ? '#E9D5FF' : '#A7F3D0')
                              : '#FECACA'
                          }}
                        >
                          {template.letterKey}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            backgroundColor: hasAccess 
                              ? (requiredTier === 'secure' ? '#F3E8FF' : '#D1FAE5')
                              : '#FEE2E2',
                            color: hasAccess 
                              ? (requiredTier === 'secure' ? '#7C3AED' : '#059669')
                              : '#DC2626',
                            borderColor: hasAccess 
                              ? (requiredTier === 'secure' ? '#E9D5FF' : '#A7F3D0')
                              : '#FECACA'
                          }}
                        >
                          {requiredTier === 'secure' ? strings.secureTier : strings.protectTier}
                        </Badge>
                      </div>
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
    </div>
  );
}
