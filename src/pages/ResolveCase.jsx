
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Scale, Shield, Clock, Mail, CheckCircle2, Zap, FileText, Users, MessageCircle, ArrowRight, Gift, AlertCircle, Send, Database } from "lucide-react"; // Added Send, Database
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useFeatureAccess } from "../components/shared/FeatureGate";

const PROCESS_STEPS = [
  {
    number: 1,
    icon: FileText,
    title: {
      en: "Submit Your Case",
      th: "ส่งคดีของคุณ",
    },
    description: {
      en: "Upload your lease, evidence, and describe the issue",
      th: "อัปโหลดสัญญาเช่า หลักฐาน และอธิบายปัญหา"
    }
  },
  {
    number: 2,
    icon: Send, // Changed icon
    title: {
      en: "Get Documentation",
      th: "รับเอกสาร",
    },
    description: {
      en: "Receive professional letter templates and case summary",
      th: "รับเทมเพลตจดหมายมืออาชีพและสรุปคดี"
    }
  },
  {
    number: 3,
    icon: Users,
    title: {
      en: "Negotiation Support",
      th: "การสนับสนุนการเจรจา",
    },
    description: {
      en: "We facilitate communication and track progress",
      th: "เราอำนวยความสะดวกในการสื่อสารและติดตามความคืบหน้า"
    }
  }
];

const SERVICE_COMPONENTS = [
  {
    icon: CheckCircle2,
    title: {
      en: "Case Intake & Evidence Review",
      th: "รับคดีและตรวจสอบหลักฐาน",
    },
    description: {
      en: "Our team carefully reviews your lease agreement, photos, and message history to understand your situation and prepare your case summary.",
      th: "ทีมงานของเราตรวจสอบสัญญาเช่า รูปภาพ และประวัติข้อความของคุณอย่างละเอียดเพื่อทำความเข้าใจสถานการณ์และเตรียมสรุปคดี"
    }
  },
  {
    icon: FileText,
    title: {
      en: "Professional Letter Pack",
      th: "แพ็กจดหมายมืออาชีพ",
    },
    description: {
      en: "Professionally written Thai and English letters and message templates to help you communicate clearly and confidently with your landlord.",
      th: "จดหมายและเทมเพลตข้อความภาษาไทยและอังกฤษที่เขียนอย่างมืออาชีพเพื่อช่วยให้คุณสื่อสารกับเจ้าของบ้านได้อย่างชัดเจนและมั่นใจ"
    }
  },
  {
    icon: Users,
    title: {
      en: "Negotiation Support",
      th: "การสนับสนุนการเจรจา",
    },
    description: {
      en: "Lease Shield guides you through each step of communication and dispute resolution — helping you stay organised and professional while keeping all contact in your name.",
      th: "Lease Shield แนะนำคุณในทุกขั้นตอนของการสื่อสารและการแก้ไขข้อพิพาท — ช่วยให้คุณจัดการอย่างเป็นระเบียบและมืออาชีพ ขณะที่รักษาการติดต่อทั้งหมดในนามของคุณ"
    }
  },
  {
    icon: Database, // Added icon
    title: {
      en: "Dispute Documentation Pack",
      th: "แพ็กเอกสารข้อพิพาท",
    },
    description: {
      en: "A complete, well-structured file that includes your contract, evidence, and a clear timeline — ready to use for any further action if needed.",
      th: "ไฟล์ที่สมบูรณ์และจัดโครงสร้างอย่างดีที่รวมสัญญา หลักฐาน และไทม์ไลน์ที่ชัดเจน — พร้อมใช้สำหรับการดำเนินการเพิ่มเติมหากจำเป็น"
    }
  },
  {
    icon: Scale, // Added icon
    title: {
      en: "Optional Legal Referral",
      th: "การแนะนำทนายความ (ถ้าต้องการ)",
    },
    description: {
      en: "If your case requires formal legal action, we can connect you with trusted legal partners who understand tenant rights in Thailand.", // Updated description
      th: "หากคดีของคุณต้องการการดำเนินการทางกฎหมาย เราสามารถเชื่อมต่อคุณกับพันธมิตรทางกฎหมายที่เชื่อถือได้ซึ่งเข้าใจสิทธิ์ผู้เช่าในประเทศไทย" // Updated description
    }
  }
];

export default function ResolveCase() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false); // Replaced isSubmittingPayment
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState(''); // Specific error for promo codes
  const [generalError, setGeneralError] = useState(null); // New state for other submission errors
  const [uploadedEvidence, setUploadedEvidence] = useState([]); // Added for new case creation structure

  // Get URL parameters for pre-filling
  const urlParams = new URLSearchParams(window.location.search);
  const prefilledAmount = urlParams.get('amount') || '';
  const prefilledAddress = urlParams.get('address') || '';
  const prefilledType = urlParams.get('type') || '';
  
  const [formData, setFormData] = useState({
    dispute_amount: prefilledAmount,
    summary: '',
    fast_track: false,
    letter_pack: false,
    type: prefilledType, // Added for case creation
    landlord_name: '', // Added for case creation
    landlord_email: '' // Added for case creation
  });
  const [selectedLease, setSelectedLease] = useState(null);

  const queryClient = useQueryClient();
  const { hasAccess: isMember } = useFeatureAccess('resolve_member_price');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  // createCaseMutation is removed as per outline, as case creation is now handled directly within handleSubmit

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  // Pricing based on membership - ALL-INCLUSIVE
  const baseMemberPrice = 2490;
  const basePublicPrice = 3990;
  const fastTrackPrice = isMember ? 300 : 500;
  const letterPackPrice = isMember ? 900 : 1500;
  const totalAddons = (formData.fast_track ? fastTrackPrice : 0) + (formData.letter_pack ? letterPackPrice : 0);

  // Pre-fill property address if available
  React.useEffect(() => {
    if (prefilledAddress && leases.length > 0) {
      const matchingLease = leases.find(lease => 
        lease.property_address?.toLowerCase().includes(prefilledAddress.toLowerCase())
      );
      if (matchingLease) {
        setSelectedLease(matchingLease.id);
      }
    }
  }, [prefilledAddress, leases]);

  const colors = {
    bg: isDarkMode ? '#1A1D1F' : '#F9FAFB',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#9CA3AF' : '#6B7280',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
    inputBg: isDarkMode ? '#353A3D' : '#FFFFFF',
  };

  const t = {
    en: {
      title: "Open Dispute Case",
      subtitle: "Get help resolving rental disputes with professional support",
      serviceComponents: "Service Components",
      serviceFees: "Service Fees",
      howItWorks: "How It Works",
      transparentPricing: "Transparent Pricing",
      memberRate: "Member Rate",
      publicRate: "Public Rate",
      allInclusive: "All-Inclusive",
      forSubscribers: "For subscription tier holders",
      lowerUpfront: "Discounted rate",
      prioritySupport: "Priority support",
      noSubRequired: "No subscription required",
      payAsYouGo: "Pay as you go",
      sameQuality: "Same quality service",
      getStarted: "Get Started",
      availableAddons: "Available Add-ons",
      fastTrack: "Fast Track",
      fastTrackDesc: "Priority review within 12 hours instead of standard 24-48 hours",
      letterPack: "Legal Letter Pack",
      letterPackDesc: "Professional escalation templates for serious disputes",
      public: "public",
      member: "member",
      leaseLabel: "Related Lease (Optional)",
      selectLease: "Select a lease",
      amountLabel: "Dispute Amount (฿)",
      summaryLabel: "Case Summary",
      summaryPlaceholder: "Describe your dispute: What happened? What are you claiming? What evidence do you have?",
      addons: "Available Add-ons",
      totalCost: "Total Add-ons Cost",
      submitCase: "Submit Case",
      submitting: "Submitting...",
      memberPricingNote: "All-inclusive case support fee. Includes full review, documentation, and negotiation support.",
      publicPricingNote: "All-inclusive case support fee. Includes full review, documentation, and negotiation support.",
      promoCode: "Promo Code",
      promoCodePlaceholder: "Enter promo code",
      promoCodeOptional: "(Optional)",
      promoApplied: "Promo code will be applied at checkout",
    },
    th: {
      title: "เปิดคดีข้อพิพาท",
      subtitle: "รับความช่วยเหลือในการแก้ไขข้อพิพาทการเช่าด้วยการสนับสนุนจากผู้เชี่ยวชาญ",
      serviceComponents: "ส่วนประกอบของบริการ",
      serviceFees: "ค่าบริการ",
      howItWorks: "วิธีการทำงาน",
      transparentPricing: "ราคาโปร่งใส",
      memberRate: "ราคาสมาชิก",
      publicRate: "ราคาทั่วไป",
      allInclusive: "ราคารวมทั้งหมด",
      forSubscribers: "สำหรับผู้ถือแพ็กเกจสมาชิก",
      lowerUpfront: "ราคาพิเศษ",
      prioritySupport: "การสนับสนุนแบบเร่งด่วน",
      noSubRequired: "ไม่ต้องสมัครสมาชิก",
      payAsYouGo: "จ่ายตามที่ใช้",
      sameQuality: "บริการคุณภาพเดียวกัน",
      getStarted: "เริ่มต้น",
      availableAddons: "บริการเสริมที่มี",
      fastTrack: "Fast Track",
      fastTrackDesc: "ตรวจสอบแบบเร่งด่วนภายใน 12 ชั่วโมงแทนที่จะเป็น 24-48 ชั่วโมงมาตรฐาน",
      letterPack: "ชุดจดหมายทางกฎหมาย",
      letterPackDesc: "เทมเพลตการยกระดับอย่างมืออาชีพสำหรับข้อพิพาทร้ายแรง",
      public: "ทั่วไป",
      member: "สมาชิก",
      leaseLabel: "สัญญาเช่าที่เกี่ยวข้อง (ไม่บังคับ)",
      selectLease: "เลือกสัญญาเช่า",
      amountLabel: "จำนวนเงินที่พิพาท (฿)",
      summaryLabel: "สรุปคดี",
      summaryPlaceholder: "อธิบายข้อพิพาทของคุณ: เกิดอะไรขึ้น? คุณเรียกร้องอะไร? คุณมีหลักฐานอะไร?",
      addons: "บริการเสริมที่มี",
      totalCost: "ค่าใช้จ่ายบริการเสริมทั้งหมด",
      submitCase: "ส่งคดี",
      submitting: "กำลังส่ง...",
      memberPricingNote: "ค่าธรรมเนียมการสนับสนุนคดีรวมทั้งหมด รวมการตรวจสอบ เอกสาร และการเจรจาต่อรอง",
      publicPricingNote: "ค่าธรรมเนียมการสนับสนุนคดีรวมทั้งหมด รวมการตรวจสอบ เอกสาร และการเจรจาต่อรอง",
      promoCode: "รหัสโปรโมชัน",
      promoCodePlaceholder: "ใส่รหัสโปรโมชัน",
      promoCodeOptional: "(ไม่บังคับ)",
      promoApplied: "รหัสโปรโมชันจะถูกใช้เมื่อชำระเงิน",
    }
  };

  const strings = t[language];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setPromoError(''); // Clear any previous promo code error
    setGeneralError(null); // Clear any previous general errors
    
    try {
      // Step 1: Determine user's tier and member status
      const userTier = user?.plan_tier || 'free';
      const tierMap = {
        'lite': 'L',
        'protect': 'P',
        'secure': 'S',
        'free': 'F'
      };
      const tierLevel = tierMap[userTier];

      console.log('📋 Creating case with:', {
        isMember,
        fastTrack: formData.fast_track,
        tierLevel,
        userTier
      });

      // Step 2: Generate case number
      const caseNumberResponse = await base44.functions.invoke('generateCaseNumber', {
        isMember,
        fastTrack: formData.fast_track || false,
        tierLevel
      });

      if (!caseNumberResponse.data?.success) {
        throw new Error(language === 'th' ? 'ไม่สามารถสร้างหมายเลขคดีได้' : 'Failed to generate case number');
      }

      const caseNumber = caseNumberResponse.data.caseNumber;
      console.log('✅ Generated case number:', caseNumber);

      // Step 3: Create case with generated number
      const caseData = {
        case_number: caseNumber,
        user_email: user.email,
        type: formData.type,
        dispute_amount: parseFloat(formData.dispute_amount),
        summary: formData.summary,
        lease_id: selectedLease || undefined,
        landlord_name: formData.landlord_name || undefined,
        landlord_email: formData.landlord_email || undefined,
        status: 'intake',
        is_member_at_creation: isMember,
        fast_track: formData.fast_track || false,
        letter_pack: formData.letter_pack || false,
        evidence: uploadedEvidence.length > 0 ? uploadedEvidence : undefined,
        timeline: [
          {
            timestamp: new Date().toISOString(),
            event: `Case ${caseNumber} opened`,
            actor: user.email
          }
        ]
      };

      const createdCase = await base44.entities.Case.create(caseData);
      console.log('✅ Case created:', createdCase.id, 'Number:', caseNumber);

      // Step 4: Handle payment if needed
      if (!isMember) {
        const response = await base44.functions.invoke('createCheckout', {
          mode: 'case',
          caseId: createdCase.id,
          fastTrack: formData.fast_track || false,
          letterPack: formData.letter_pack || false,
          promoCode: promoCode || undefined
        });

        if (response.data?.url) {
          window.location.href = response.data.url;
          return;
        } else if (response.data?.code === 'invalid_promo_code') {
          setPromoError(language === 'th' ? 'รหัสโปรโมชันไม่ถูกต้องหรือหมดอายุ' : 'Invalid or expired promo code');
          setSubmitting(false); // Stop loading on promo code error
          return;
        } else {
          throw new Error('No checkout URL returned');
        }
      }

      // Step 5: Navigate to cases page
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      navigate(createPageUrl("Cases"));

    } catch (error) {
      console.error('❌ Case submission failed:', error);
      if (error.response?.data?.code === 'invalid_promo_code') {
        setPromoError(language === 'th' ? 'รหัสโปรโมชันไม่ถูกต้องหรือหมดอายุ' : 'Invalid or expired promo code');
      } else {
        setGeneralError(language === 'th' 
          ? 'ไม่สามารถส่งคำร้องได้ กรุณาลองอีกครั้ง' 
          : 'Failed to submit case. Please try again.');
      }
    } finally {
      setSubmitting(false); // Always reset loading state
    }
  };


  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Scale className="w-8 h-8 md:w-10 md:h-10 text-ls-forest" />
            <h1 className="text-3xl md:text-4xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
          </div>
          <p className="text-lg" style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: colors.textPrimary }}>
            {strings.howItWorks}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PROCESS_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <Card key={step.number} className="border-none shadow-lg text-center" style={{ backgroundColor: colors.cardBg }}>
                  <CardContent className="p-6">
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{
                      backgroundColor: '#C7A338'
                    }}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                      {step.number}. {step.title[language]} {/* Updated to use language */}
                    </h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {step.description[language]} {/* Updated to use language */}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Transparent Pricing Section */}
        <div className="mb-12 p-8 rounded-2xl" style={{
          background: isDarkMode 
            ? 'linear-gradient(135deg, #C7A338 0%, #d4af37 100%)'
            : 'linear-gradient(135deg, #C7A338 0%, #d4af37 100%)'
        }}>
          <h2 style={{ 
            fontSize: '30px', 
            fontWeight: 'bold', 
            textAlign: 'center', 
            marginBottom: '32px',
            color: '#1A1D1F'
          }}>
            {strings.transparentPricing}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Member Rate */}
            <Card style={{ 
              border: 'none', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
              backgroundColor: '#FFFFFF'
            }}>
              <div style={{ 
                backgroundColor: '#0C3B2E',
                padding: '24px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <h3 style={{ 
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    margin: 0
                  }}>
                    {strings.memberRate}
                  </h3>
                  <Shield style={{ 
                    width: '32px', 
                    height: '32px',
                    color: '#FFFFFF'
                  }} />
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'baseline', 
                  gap: '8px'
                }}>
                  <span style={{ 
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#FFFFFF'
                  }}>
                    ฿{baseMemberPrice.toLocaleString()}
                  </span>
                </div>
                <p style={{ 
                  fontSize: '14px',
                  marginTop: '8px',
                  color: '#FFFFFF',
                  opacity: 0.9
                }}>
                  {strings.allInclusive}
                </p>
              </div>
              <CardContent style={{ 
                padding: '24px',
                backgroundColor: '#FFFFFF'
              }}>
                <ul style={{ 
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <li style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '8px'
                  }}>
                    <CheckCircle2 style={{ 
                      width: '20px', 
                      height: '20px',
                      flexShrink: 0,
                      marginTop: '2px',
                      color: '#10B981'
                    }} />
                    <span style={{ 
                      fontSize: '14px',
                      color: '#334155'
                    }}>
                      {strings.forSubscribers}
                    </span>
                  </li>
                  <li style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '8px'
                  }}>
                    <CheckCircle2 style={{ 
                      width: '20px', 
                      height: '20px',
                      flexShrink: 0,
                      marginTop: '2px',
                      color: '#10B981'
                    }} />
                    <span style={{ 
                      fontSize: '14px',
                      color: '#334155'
                    }}>
                      {strings.lowerUpfront}
                    </span>
                  </li>
                  <li style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '8px'
                  }}>
                    <CheckCircle2 style={{ 
                      width: '20px', 
                      height: '20px',
                      flexShrink: 0,
                      marginTop: '2px',
                      color: '#10B981'
                    }} />
                    <span style={{ 
                      fontSize: '14px',
                      color: '#334155'
                    }}>
                      {strings.prioritySupport}
                    </span>
                  </li>
                </ul>
                <p style={{ 
                  fontSize: '12px',
                  marginTop: '16px',
                  color: '#64748B'
                }}>
                  {strings.memberPricingNote}
                </p>
              </CardContent>
            </Card>

            {/* Public Rate */}
            <Card style={{ 
              border: 'none', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
              backgroundColor: '#FFFFFF'
            }}>
              <div style={{ 
                backgroundColor: '#1A1D1F',
                padding: '24px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <h3 style={{ 
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    margin: 0
                  }}>
                    {strings.publicRate}
                  </h3>
                  <Scale style={{ 
                    width: '32px', 
                    height: '32px',
                    color: '#FFFFFF'
                  }} />
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'baseline', 
                  gap: '8px'
                }}>
                  <span style={{ 
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#FFFFFF'
                  }}>
                    ฿{basePublicPrice.toLocaleString()}
                  </span>
                </div>
                <p style={{ 
                  fontSize: '14px',
                  marginTop: '8px',
                  color: '#FFFFFF',
                  opacity: 0.9
                }}>
                  {strings.allInclusive}
                </p>
              </div>
              <CardContent style={{ 
                padding: '24px',
                backgroundColor: '#FFFFFF'
              }}>
                <ul style={{ 
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <li style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '8px'
                  }}>
                    <CheckCircle2 style={{ 
                      width: '20px', 
                      height: '20px',
                      flexShrink: 0,
                      marginTop: '2px',
                      color: '#10B981'
                    }} />
                    <span style={{ 
                      fontSize: '14px',
                      color: '#334155'
                    }}>
                      {strings.noSubRequired}
                    </span>
                  </li>
                  <li style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '8px'
                  }}>
                    <CheckCircle2 style={{ 
                      width: '20px', 
                      height: '20px',
                      flexShrink: 0,
                      marginTop: '2px',
                      color: '#10B981'
                    }} />
                    <span style={{ 
                      fontSize: '14px',
                      color: '#334155'
                    }}>
                      {strings.payAsYouGo}
                    </span>
                  </li>
                  <li style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '8px'
                  }}>
                    <CheckCircle2 style={{ 
                      width: '20px', 
                      height: '20px',
                      flexShrink: 0,
                      marginTop: '2px',
                      color: '#10B981'
                    }} />
                    <span style={{ 
                      fontSize: '14px',
                      color: '#334155'
                    }}>
                      {strings.sameQuality}
                    </span>
                  </li>
                </ul>
                <p style={{ 
                  fontSize: '12px',
                  marginTop: '16px',
                  color: '#64748B'
                }}>
                  {strings.publicPricingNote}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Available Add-ons */}
          <div>
            <h3 style={{ 
              fontSize: '24px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '24px',
              color: '#1A1D1F'
            }}>
              {strings.availableAddons}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Fast Track */}
              <Card style={{ 
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                backgroundColor: '#FFFFFF'
              }}>
                <CardContent style={{ padding: '24px' }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        backgroundColor: '#F3E8FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Zap style={{ width: '24px', height: '24px', color: '#9333EA' }} />
                      </div>
                      <div>
                        <h4 style={{ 
                          fontWeight: 'bold',
                          fontSize: '18px',
                          color: '#1F2937',
                          margin: 0
                        }}>
                          {strings.fastTrack}
                        </h4>
                      </div>
                    </div>
                  </div>
                  <p style={{ 
                    fontSize: '14px',
                    marginBottom: '16px',
                    color: '#4B5563'
                  }}>
                    {strings.fastTrackDesc}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1A1D1F' }}>฿500</span>
                    <span style={{ fontSize: '14px', color: '#6B7280' }}>({strings.public})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '4px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0C3B2E' }}>฿300</span>
                    <span style={{ fontSize: '14px', color: '#6B7280' }}>({strings.member})</span>
                  </div>
                </CardContent>
              </Card>

              {/* Letter Pack */}
              <Card style={{ 
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                backgroundColor: '#FFFFFF'
              }}>
                <CardContent style={{ padding: '24px' }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        backgroundColor: '#DBEAFE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FileText style={{ width: '24px', height: '24px', color: '#2563EB' }} />
                      </div>
                      <div>
                        <h4 style={{ 
                          fontWeight: 'bold',
                          fontSize: '18px',
                          color: '#1F2937',
                          margin: 0
                        }}>
                          {strings.letterPack}
                        </h4>
                      </div>
                    </div>
                  </div>
                  <p style={{ 
                    fontSize: '14px',
                    marginBottom: '16px',
                    color: '#4B5563'
                  }}>
                    {strings.letterPackDesc}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1A1D1F' }}>฿1,500</span>
                    <span style={{ fontSize: '14px', color: '#6B7280' }}>({strings.public})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '4px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0C3B2E' }}>฿900</span>
                    <span style={{ fontSize: '14px', color: '#6B7280' }}>({strings.member})</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Service Components */}
        <Card className="mb-8 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader className="border-b" style={{ borderBottomColor: colors.borderColor }}>
            <CardTitle className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
              {strings.serviceComponents}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {SERVICE_COMPONENTS.map((component, index) => {
                const Icon = component.icon; // Get the icon from the component object
                return (
                  <div key={index} className="flex gap-4 pb-4 border-b last:border-0" style={{ borderBottomColor: colors.borderColor }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-ls-forest/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-ls-forest" /> {/* Use the component's icon */}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-1" style={{ color: colors.textPrimary }}>
                        {component.title[language]} {/* Updated to use language */}
                      </h3>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        {component.description[language]} {/* Updated to use language */}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Case Submission Form */}
        <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader className="border-b" style={{ borderBottomColor: colors.borderColor }}>
            <CardTitle style={{ color: colors.textPrimary }}>Case Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Lease Selection */}
              <div>
                <Label htmlFor="lease" style={{ color: colors.textPrimary }}>{strings.leaseLabel}</Label>
                <select
                  id="lease"
                  value={selectedLease || ''}
                  onChange={(e) => setSelectedLease(e.target.value)}
                  className="w-full p-3 mt-2 border-2 rounded-lg"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                >
                  <option value="">{strings.selectLease}</option>
                  {leases.map((lease) => (
                    <option key={lease.id} value={lease.id}>
                      {lease.property_address || `Lease ${lease.id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dispute Amount */}
              <div>
                <Label htmlFor="amount" style={{ color: colors.textPrimary }}>{strings.amountLabel}</Label>
                <Input
                  id="amount"
                  type="number"
                  required
                  value={formData.dispute_amount}
                  onChange={(e) => setFormData({...formData, dispute_amount: e.target.value})}
                  placeholder="10000"
                  className="mt-2"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>

              {/* Summary */}
              <div>
                <Label htmlFor="summary" style={{ color: colors.textPrimary }}>{strings.summaryLabel}</Label>
                <Textarea
                  id="summary"
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({...formData, summary: e.target.value})}
                  placeholder={strings.summaryPlaceholder}
                  rows={6}
                  className="mt-2"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>

              {/* Add-ons Section */}
              <div className="pt-4 border-t" style={{ borderTopColor: colors.borderColor }}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <Zap className="w-5 h-5 text-ls-gold" />
                  {strings.addons}
                </h3>

                {/* Fast Track */}
                <Card className="mb-4 border-2 hover:border-ls-forest/40 transition-colors" style={{
                  borderColor: formData.fast_track ? '#0C3B2E' : colors.borderColor,
                  backgroundColor: colors.cardBg
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="fast_track"
                        checked={formData.fast_track}
                        onCheckedChange={(checked) => setFormData({...formData, fast_track: checked})}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-5 h-5 text-ls-forest" />
                          <Label htmlFor="fast_track" className="text-base font-bold cursor-pointer" style={{ color: colors.textPrimary }}>
                            {strings.fastTrack}
                          </Label>
                        </div>
                        <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>{strings.fastTrackDesc}</p>
                        <div className="flex gap-3">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            {strings.memberRate}: ฿300
                          </Badge>
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                            {strings.publicRate}: ฿500
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-ls-forest">฿{fastTrackPrice}</p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {isMember ? strings.memberRate : strings.publicRate}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Letter Pack */}
                <Card className="mb-4 border-2 hover:border-ls-gold/60 transition-colors" style={{
                  borderColor: formData.letter_pack ? '#C7A338' : colors.borderColor,
                  backgroundColor: colors.cardBg
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="letter_pack"
                        checked={formData.letter_pack}
                        onCheckedChange={(checked) => setFormData({...formData, letter_pack: checked})}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="w-5 h-5 text-ls-gold" />
                          <Label htmlFor="letter_pack" className="text-base font-bold cursor-pointer" style={{ color: colors.textPrimary }}>
                            {strings.letterPack}
                          </Label>
                        </div>
                        <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>{strings.letterPackDesc}</p>
                        <div className="flex gap-3">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            {strings.memberRate}: ฿900
                          </Badge>
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                            {strings.publicRate}: ฿1,500
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-ls-gold">฿{letterPackPrice}</p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {isMember ? strings.memberRate : strings.publicRate}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Cost */}
                {totalAddons > 0 && (
                  <div className="mt-4 p-4 rounded-xl border-2" style={{
                    backgroundColor: isDarkMode ? 'rgba(12, 59, 46, 0.1)' : 'rgba(12, 59, 46, 0.05)',
                    borderColor: '#0C3B2E'
                  }}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ls-charcoal">{strings.totalCost}:</span>
                      <span className="text-2xl font-bold text-ls-forest">฿{totalAddons.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Promo Code Input */}
              <div className="pt-4 border-t" style={{ borderTopColor: colors.borderColor }}>
                <Label htmlFor="promoCode" className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <Gift className="w-4 h-4 text-ls-gold" />
                  {strings.promoCode} <span style={{ color: colors.textSecondary, fontWeight: 'normal' }}>{strings.promoCodeOptional}</span>
                </Label>
                <Input
                  id="promoCode"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoError(''); // Clear specific promo error when typing
                  }}
                  placeholder={strings.promoCodePlaceholder}
                  className="mt-2"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: promoError ? '#EF4444' : colors.borderColor, // Use promoError for border
                    color: colors.textPrimary,
                    borderWidth: '2px'
                  }}
                />
                {promoError && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {promoError}
                  </p>
                )}
                {promoCode && !promoError && ( // Show promo applied text only if promoCode is present and no promoError
                  <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {strings.promoApplied}
                  </p>
                )}
              </div>

              {/* General Error Display */}
              {generalError && (
                <div className="text-sm text-red-600 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  backgroundColor: submitting ? '#9CA3AF' : '#0C3B2E',
                  color: '#FFFFFF',
                  padding: '16px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.target.style.backgroundColor = '#0a2f25';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.target.style.backgroundColor = '#0C3B2E';
                  }
                }}
              >
                <Scale className="w-5 h-5" />
                {submitting ? strings.submitting : strings.submitCase}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
