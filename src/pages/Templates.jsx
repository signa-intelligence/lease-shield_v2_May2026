
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Shield, AlertCircle, FileX, Scale, Camera, Mail, AlertTriangle, Gavel, CheckCircle, ArrowLeft, Coins, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const TEMPLATES = [
  {
    id: 'lease_negotiation',
    letterKey: 'N1',
    name_en: 'Pre-Signing Lease Negotiation',
    name_th: 'จดหมายทบทวนสัญญาก่อนลงนาม',
    description_en: 'Request clarification of concerning lease terms before signing',
    description_th: 'ขอชี้แจงข้อกำหนดที่น่ากังวลก่อนการลงนามสัญญา',
    icon: FileText,
    color: 'from-amber-400 to-orange-600',
    preSigning: true,
    creditCost: 1
  },
  {
    id: 'deposit',
    letterKey: 'L1',
    name_en: 'Deposit Return Request',
    name_th: 'จดหมายขอคืนเงินมัดจำ',
    description_en: 'Friendly formal request for security deposit return',
    description_th: 'จดหมายทางการสุภาพขอคืนเงินประกัน',
    icon: Shield,
    color: 'from-blue-400 to-blue-600',
    creditCost: 1
  },
  {
    id: 'deductions',
    letterKey: 'L2',
    name_en: 'Request for Itemised Deductions',
    name_th: 'ขอรายละเอียดการหักเงิน',
    description_en: 'Request breakdown of damage charges and deductions',
    description_th: 'ขอรายละเอียดค่าเสียหายและการหักเงินแบบแยกรายการ',
    icon: FileText,
    color: 'from-amber-400 to-amber-600',
    creditCost: 1
  },
  {
    id: 'reminder',
    letterKey: 'L3',
    name_en: 'Friendly Reminder',
    name_th: 'จดหมายเตือนแบบมิตร',
    description_en: 'Gentle follow-up on pending deposit return',
    description_th: 'จดหมายติดตามความคืบหน้าอย่างสุภาพ',
    icon: Mail,
    color: 'from-purple-400 to-purple-600',
    creditCost: 1
  },
  {
    id: 'dispute',
    letterKey: 'P1',
    name_en: 'Formal Dispute of Withholding',
    name_th: 'จดหมายคัดค้านการระงับเงิน',
    description_en: 'Formal dispute of unfair deposit withholding',
    description_th: 'จดหมายคัดค้านการระงับเงินประกันอย่างเป็นทางการ',
    icon: Scale,
    color: 'from-emerald-500 to-emerald-700',
    creditCost: 1
  },
  {
    id: 'early_termination',
    letterKey: 'P2',
    name_en: 'Early Termination Reconciliation',
    name_th: 'ประสานยุติสัญญาก่อนกำหนด',
    description_en: 'Coordinate early lease termination details',
    description_th: 'ประสานรายละเอียดการยุติสัญญาก่อนกำหนด',
    icon: FileX,
    color: 'from-teal-500 to-teal-700',
    creditCost: 1
  },
  {
    id: 'condition_dispute',
    letterKey: 'P3',
    name_en: 'Property Condition Dispute',
    name_th: 'โต้แย้งสภาพทรัพย์สิน',
    description_en: 'Dispute claimed property damages',
    description_th: 'โต้แย้งการเรียกร้องค่าเสียหายทรัพย์สิน',
    icon: Camera,
    color: 'from-cyan-500 to-cyan-700',
    creditCost: 1
  },
  {
    id: 'evidence',
    letterKey: 'P4',
    name_en: 'Request for Evidence',
    name_th: 'ขอหลักฐานประกอบ',
    description_en: 'Request supporting documents for claimed damages',
    description_th: 'ขอเอกสารหลักฐานสำหรับค่าเสียหายที่อ้าง',
    icon: FileText,
    color: 'from-sky-500 to-sky-700',
    creditCost: 1
  },
  {
    id: 'final_opportunity',
    letterKey: 'S1',
    name_en: 'Final Opportunity',
    name_th: 'โอกาสสุดท้าย',
    description_en: 'Last chance before formal escalation',
    description_th: 'โอกาสสุดท้ายก่อนดำเนินการทางกฎหมาย',
    icon: AlertTriangle,
    color: 'from-orange-600 to-red-600',
    creditCost: 1
  },
  {
    id: 'non_compliance',
    letterKey: 'S2',
    name_en: 'Notice of Non-Compliance',
    name_th: 'แจ้งไม่ปฏิบัติตามสัญญา',
    description_en: 'Official notice of contract breach',
    description_th: 'แจ้งการฝ่าฝืนสัญญาอย่างเป็นทางการ',
    icon: Gavel,
    color: 'from-red-600 to-red-800',
    creditCost: 1
  },
  {
    id: 'settlement',
    letterKey: 'S3',
    name_en: 'Settlement Confirmation',
    name_th: 'ยืนยันการตกลงชำระเงิน',
    description_en: 'Confirm successful deposit transfer',
    description_th: 'ยืนยันการคืนเงินประกันสำเร็จ',
    icon: CheckCircle,
    color: 'from-emerald-600 to-green-700',
    creditCost: 1
  }
];

export default function Templates() {
  const navigate = useNavigate();
  const [buyingCredits, setBuyingCredits] = useState({}); // ✅ Track individual package loading states

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const userTier = user?.plan_tier || 'free';
  const userCredits = user?.letter_credits || 0;

  // Credit packages - SAME AS ACCOUNT PAGE BUT WITHOUT STRIPE URLS
  const CREDIT_PACKAGES = [
    {
      id: 'credits_1',
      credits: 1,
      price: 99,
      savings: 0
    },
    {
      id: 'credits_3',
      credits: 3,
      price: 249,
      savings: 16,
      popular: false
    },
    {
      id: 'credits_5',
      credits: 5,
      price: 399,
      savings: 20,
      popular: true
    },
    {
      id: 'credits_10',
      credits: 10,
      price: 699,
      savings: 30,
      popular: false
    }
  ];

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
      subtitle: "Professional bilingual escalation ladder - all templates available",
      availableCredits: "Available Credits",
      creditCost: "1 Credit per Letter",
      buyCredits: "Buy Credits",
      allLetters: "All Letters (11 Templates)",
      insufficientCredits: "Insufficient credits",
      tierCredits: {
        free: "Free: 0 credits",
        lite: "Lite: 3 credits included",
        protect: "Protect: 5 credits included",
        secure: "Secure: 10 credits included"
      },
      upgradeForCredits: "Upgrade for more credits",
      preSigningSection: "⭐ Pre-Signing Negotiation",
      friendlyApproach: "Friendly Approach (3 Letters)",
      professionalEscalation: "Professional Escalation (4 Letters)",
      finalMeasures: "Final Measures (3 Letters)",
      creditBalance: "Credit Balance",
      credits: "Credits",
      perCredit: "per credit",
      buyNow: "Buy Now",
      bestValue: "Best Value",
      mostPopular: "MOST POPULAR",
      oneLetterPerCredit: "1 letter = 1 credit",
      accessTemplateLibrary: "Access template library",
      bilingual: "Bilingual Templates",
      humanAndAiGeneration: "Human and AI generation",
      creditsNeverExpire: "Credits never expire",
      save: "Save"
    },
    th: {
      title: "เทมเพลตจดหมายทางกฎหมาย",
      subtitle: "บันไดการยกระดับมืออาชีพสองภาษา - ทุกเทมเพลตพร้อมใช้งาน",
      availableCredits: "เครดิตที่มี",
      creditCost: "1 เครดิตต่อจดหมาย",
      buyCredits: "ซื้อเครดิต",
      allLetters: "จดหมายทั้งหมด (11 เทมเพลต)",
      insufficientCredits: "เครดิตไม่เพียงพอ",
      tierCredits: {
        free: "ฟรี: 0 เครดิต",
        lite: "ไลท์: 3 เครดิตรวมอยู่",
        protect: "โปรเทค: 5 เครดิตรวมอยู่",
        secure: "ซีเคียว: 10 เครดิตรวมอยู่"
      },
      upgradeForCredits: "อัปเกรดเพื่อรับเครดิตเพิ่ม",
      preSigningSection: "⭐ เจรจาก่อนลงนาม",
      friendlyApproach: "แนวทางเป็นมิตร (3 จดหมาย)",
      professionalEscalation: "การยกระดับอย่างมืออาชีพ (4 จดหมาย)",
      finalMeasures: "มาตรการสุดท้าย (3 จดหมาย)",
      creditBalance: "เครดิตคงเหลือ",
      credits: "เครดิต",
      perCredit: "ต่อเครดิต",
      buyNow: "ซื้อเลย",
      bestValue: "คุ้มที่สุด",
      mostPopular: "ยอดนิยม",
      oneLetterPerCredit: "1 จดหมาย = 1 เครดิต",
      accessTemplateLibrary: "เข้าถึงคลังเทมเพลต",
      bilingual: "เทมเพลตสองภาษา",
      humanAndAiGeneration: "สร้างโดยมนุษย์และ AI",
      creditsNeverExpire: "เครดิตไม่หมดอายุ",
      save: "ประหยัด"
    }
  };

  const strings = t[language];

  const preSigningTemplates = TEMPLATES.filter(t => t.preSigning);
  const liteTemplates = TEMPLATES.filter(t => ['deposit', 'deductions', 'reminder'].includes(t.id));
  const protectTemplates = TEMPLATES.filter(t => ['dispute', 'early_termination', 'condition_dispute', 'evidence'].includes(t.id));
  const secureTemplates = TEMPLATES.filter(t => ['final_opportunity', 'non_compliance', 'settlement'].includes(t.id));

  const handleTemplateClick = (template) => {
    if (userCredits >= template.creditCost) {
      navigate(createPageUrl("TemplateForm") + `?subject=${template.id}`);
    }
  };

  // ✅ ADD: Same credit purchase handler as Account page
  const handleBuyCredits = async (pkg) => {
    setBuyingCredits(prev => ({ ...prev, [pkg.id]: true }));
    try {
      console.log('🔍 Templates page - Sending to createCheckout:', { amount: pkg.price, packageId: pkg.id });
      
      const response = await base44.functions.invoke('createCheckout', {
        priceId: null,
        mode: 'payment',
        amount: pkg.price, // ✅ Correct - no multiplication
        currency: 'thb',
        description: `${pkg.credits} Letter Credits`,
        metadata: {
          type: 'credits',
          credits: pkg.credits.toString(),
          packageId: pkg.id
        }
      });
      
      if (response.data?.url) {
        // ✅ Open in SAME window - when they come back, credits will auto-refresh
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);
      alert(language === 'th' ? 'ไม่สามารถสร้างการชำระเงินได้ กรุณาลองอีกครั้ง' : 'Failed to create checkout. Please try again.');
      setBuyingCredits(prev => ({ ...prev, [pkg.id]: false }));
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'th' ? 'กลับ' : 'Back'}
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-ls-forest" />
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
          </div>
          <p className="text-sm sm:text-base mb-4" style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
          
          {/* Total Letters Badge */}
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs sm:text-sm">
            {strings.allLetters}
          </Badge>
        </div>

        {/* LETTER CREDITS SECTION - COPIED FROM ACCOUNT PAGE */}
        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${isDarkMode ? '#3A3D40' : '#E5E7EB'}` }}>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                    {strings.buyCredits}
                  </h2>
                  <p className="text-sm font-normal" style={{ color: colors.textSecondary }}>
                    {strings.oneLetterPerCredit}
                  </p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                  {strings.creditBalance}
                </p>
                <p className="text-3xl font-bold" style={{ color: '#C7A338' }}>
                  {userCredits}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 p-4 rounded-xl" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFF7ED' }}>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs text-center" style={{ color: colors.textPrimary }}>{strings.accessTemplateLibrary}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs text-center" style={{ color: colors.textPrimary }}>{strings.bilingual}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs text-center" style={{ color: colors.textPrimary }}>{strings.humanAndAiGeneration}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs text-center" style={{ color: colors.textPrimary }}>{strings.creditsNeverExpire}</span>
              </div>
            </div>

            {/* Credit Packages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CREDIT_PACKAGES.map((pkg) => {
                const pricePerCredit = Math.round(pkg.price / pkg.credits);
                
                return (
                  <div
                    key={pkg.id}
                    className={`relative border-2 transition-all duration-200 flex flex-col ${
                      pkg.popular ? 'border-amber-400 shadow-lg' : ''
                    }`}
                    style={{
                      backgroundColor: pkg.popular 
                        ? (isDarkMode ? '#2D2520' : '#FFFBEB')
                        : colors.cardBg,
                      borderColor: pkg.popular ? '#C7A338' : (isDarkMode ? '#3A3D40' : '#E5E7EB'),
                      borderRadius: '12px',
                      padding: '16px',
                      minHeight: '240px'
                    }}
                  >
                    {/* Badge Area - Fixed Height */}
                    <div style={{ height: '24px', marginBottom: '8px' }}>
                      {pkg.popular && (
                        <Badge className="bg-amber-500 text-white text-xs font-bold w-full justify-center whitespace-nowrap" style={{ padding: '4px 8px' }}>
                          ⭐ {strings.mostPopular}
                        </Badge>
                      )}
                      {pkg.savings >= 30 && !pkg.popular && (
                        <Badge className="bg-emerald-500 text-white text-xs font-bold w-full justify-center whitespace-nowrap" style={{ padding: '4px 8px' }}>
                          💰 {strings.bestValue}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Credit Number - Fixed Height */}
                    <div className="text-center" style={{ height: '60px', marginBottom: '12px' }}>
                      <div className="text-3xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                        {pkg.credits}
                      </div>
                      <div className="text-xs" style={{ color: colors.textSecondary }}>
                        {strings.credits}
                      </div>
                    </div>

                    {/* Price Section - Fixed Height */}
                    <div className="text-center" style={{ height: '80px', marginBottom: '12px' }}>
                      <div className="text-2xl font-bold mb-1" style={{ color: '#C7A338' }}>
                        ฿{pkg.price}
                      </div>
                      <div className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                        ฿{pricePerCredit} {strings.perCredit}
                      </div>
                      <div style={{ height: '22px' }}>
                        {pkg.savings > 0 && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                            {strings.save} {pkg.savings}%
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Button - Fixed at Bottom - REPLACED <a> WITH <button> */}
                    <div className="mt-auto">
                      <button
                        onClick={() => handleBuyCredits(pkg)}
                        disabled={buyingCredits[pkg.id]}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'center',
                          backgroundColor: buyingCredits[pkg.id] ? '#9CA3AF' : (pkg.popular ? '#C7A338' : '#0C3B2E'),
                          color: '#FFFFFF',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: 'none',
                          cursor: buyingCredits[pkg.id] ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          opacity: buyingCredits[pkg.id] ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!buyingCredits[pkg.id]) {
                            e.target.style.backgroundColor = pkg.popular ? '#B89330' : '#0a2f25';
                            e.target.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!buyingCredits[pkg.id]) {
                            e.target.style.backgroundColor = pkg.popular ? '#C7A338' : '#0C3B2E';
                            e.target.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        {buyingCredits[pkg.id] ? (language === 'th' ? 'กำลังดำเนินการ...' : 'Processing...') : strings.buyNow}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* PRE-SIGNING SECTION */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-amber-400 to-orange-600 rounded"></div>
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: colors.textPrimary }}>
              {strings.preSigningSection}
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-l from-amber-400 to-orange-600 rounded"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {preSigningTemplates.map((template) => {
              const Icon = template.icon;
              const hasEnoughCredits = userCredits >= template.creditCost;

              return (
                <Card
                  key={template.id}
                  className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 ${hasEnoughCredits ? 'cursor-pointer' : 'opacity-75'}`}
                  style={{ backgroundColor: colors.cardBg }}
                  onClick={() => handleTemplateClick(template)}
                >
                  <div className={`h-2 bg-gradient-to-r ${template.color} rounded-t-xl`} />
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                          {template.letterKey}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {template.creditCost}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
                      {language === 'th' ? template.name_th : template.name_en}
                    </h3>

                    <p className="text-xs sm:text-sm mb-4" style={{ color: colors.textSecondary }}>
                      {language === 'th' ? template.description_th : template.description_en}
                    </p>

                    {!hasEnoughCredits && (
                      <div className="text-xs text-center p-2 rounded-lg" style={{
                        backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2',
                        color: '#DC2626'
                      }}>
                        {strings.insufficientCredits}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FRIENDLY APPROACH SECTION */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-blue-400 to-purple-600 rounded"></div>
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: colors.textPrimary }}>
              {strings.friendlyApproach}
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-l from-blue-400 to-purple-600 rounded"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {liteTemplates.map((template) => {
              const Icon = template.icon;
              const hasEnoughCredits = userCredits >= template.creditCost;

              return (
                <Card
                  key={template.id}
                  className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 ${hasEnoughCredits ? 'cursor-pointer' : 'opacity-75'}`}
                  style={{ backgroundColor: colors.cardBg }}
                  onClick={() => handleTemplateClick(template)}
                >
                  <div className={`h-2 bg-gradient-to-r ${template.color} rounded-t-xl`} />
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                          {template.letterKey}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {template.creditCost}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
                      {language === 'th' ? template.name_th : template.name_en}
                    </h3>

                    <p className="text-xs sm:text-sm mb-4" style={{ color: colors.textSecondary }}>
                      {language === 'th' ? template.description_th : template.description_en}
                    </p>

                    {!hasEnoughCredits && (
                      <div className="text-xs text-center p-2 rounded-lg" style={{
                        backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2',
                        color: '#DC2626'
                      }}>
                        {strings.insufficientCredits}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* PROFESSIONAL ESCALATION SECTION */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded"></div>
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: colors.textPrimary }}>
              {strings.professionalEscalation}
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-l from-emerald-500 to-cyan-600 rounded"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {protectTemplates.map((template) => {
              const Icon = template.icon;
              const hasEnoughCredits = userCredits >= template.creditCost;

              return (
                <Card
                  key={template.id}
                  className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 ${hasEnoughCredits ? 'cursor-pointer' : 'opacity-75'}`}
                  style={{ backgroundColor: colors.cardBg }}
                  onClick={() => handleTemplateClick(template)}
                >
                  <div className={`h-2 bg-gradient-to-r ${template.color} rounded-t-xl`} />
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                          {template.letterKey}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {template.creditCost}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
                      {language === 'th' ? template.name_th : template.name_en}
                    </h3>

                    <p className="text-xs sm:text-sm mb-4" style={{ color: colors.textSecondary }}>
                      {language === 'th' ? template.description_th : template.description_en}
                    </p>

                    {!hasEnoughCredits && (
                      <div className="text-xs text-center p-2 rounded-lg" style={{
                        backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2',
                        color: '#DC2626'
                      }}>
                        {strings.insufficientCredits}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FINAL MEASURES SECTION */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-orange-600 to-red-700 rounded"></div>
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: colors.textPrimary }}>
              {strings.finalMeasures}
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-l from-orange-600 to-red-700 rounded"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {secureTemplates.map((template) => {
              const Icon = template.icon;
              const hasEnoughCredits = userCredits >= template.creditCost;

              return (
                <Card
                  key={template.id}
                  className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 ${hasEnoughCredits ? 'cursor-pointer' : 'opacity-75'}`}
                  style={{ backgroundColor: colors.cardBg }}
                  onClick={() => handleTemplateClick(template)}
                >
                  <div className={`h-2 bg-gradient-to-r ${template.color} rounded-t-xl`} />
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-200">
                          {template.letterKey}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {template.creditCost}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
                      {language === 'th' ? template.name_th : template.name_en}
                    </h3>

                    <p className="text-xs sm:text-sm mb-4" style={{ color: colors.textSecondary }}>
                      {language === 'th' ? template.description_th : template.description_en}
                    </p>

                    {!hasEnoughCredits && (
                      <div className="text-xs text-center p-2 rounded-lg" style={{
                        backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2',
                        color: '#DC2626'
                      }}>
                        {strings.insufficientCredits}
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
