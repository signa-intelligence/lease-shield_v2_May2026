
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
import { Scale, Shield, Clock, Mail, CheckCircle2, Zap, FileText, Users, MessageCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useFeatureAccess } from "../components/shared/FeatureGate";

const SERVICE_COMPONENTS = [
  {
    category: 'Case Intake & Evidence Review',
    description: 'Our team carefully reviews your lease agreement, photos, and message history to understand your situation and prepare your case summary.'
  },
  {
    category: 'Professional Letter Pack',
    description: 'Professionally written Thai and English letters and message templates to help you communicate clearly and confidently with your landlord.'
  },
  {
    category: 'Negotiation Support',
    description: 'Lease Shield guides you through each step of communication and dispute resolution — helping you stay organised and professional while keeping all contact in your name.'
  },
  {
    category: 'Dispute Documentation Pack',
    description: 'A complete, well-structured file that includes your contract, evidence, and a clear timeline — ready to use for any further action if needed.'
  },
  {
    category: 'Optional Legal Referral',
    description: 'If your case requires formal legal action, we can connect you with a trusted partner law firm. All legal work is handled directly between you and the firm at standard rates.'
  }
];

const PROCESS_STEPS = [
  {
    number: 1,
    title: 'Submit Your Case',
    description: 'Upload your lease, evidence, and describe the issue',
    icon: FileText
  },
  {
    number: 2,
    title: 'Get Documentation',
    description: 'Receive professional letter templates and case summary',
    icon: Mail
  },
  {
    number: 3,
    title: 'Negotiation Support',
    description: 'We facilitate communication and track progress',
    icon: Users
  }
];

export default function ResolveCase() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dispute_amount: '',
    summary: '',
    fast_track: false,
    letter_pack: false
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

  const createCaseMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      navigate(createPageUrl("Cases"));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const caseData = {
      ...formData,
      dispute_amount: parseFloat(formData.dispute_amount),
      lease_id: selectedLease,
      status: 'intake',
      is_member_at_creation: isMember
    };

    createCaseMutation.mutate(caseData);
  };

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  // Pricing based on membership
  const baseMemberPrice = 1490;
  const basePublicPrice = 2490;
  const memberSuccessFee = 10;
  const publicSuccessFee = 15;
  const fastTrackPrice = isMember ? 300 : 500;
  const letterPackPrice = isMember ? 900 : 1500;
  const totalAddons = (formData.fast_track ? fastTrackPrice : 0) + (formData.letter_pack ? letterPackPrice : 0);

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
      successFee: "success fee",
      forSubscribers: "For subscription tier holders",
      lowerUpfront: "Lower upfront cost",
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
      memberPricingNote: "One-time review and support fee. Additional admin charges may apply for extended cases.",
      publicPricingNote: "One-time review and support fee. Additional admin charges may apply for extended cases."
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
      successFee: "ค่าธรรมเนียมความสำเร็จ",
      forSubscribers: "สำหรับผู้ถือแพ็กเกจสมาชิก",
      lowerUpfront: "ค่าใช้จ่ายล่วงหน้าที่ต่ำกว่า",
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
      memberPricingNote: "ค่าธรรมเนียมการตรวจสอบและสนับสนุนครั้งเดียว อาจมีค่าบริหารเพิ่มเติมสำหรับกรณีที่ขยายเวลา",
      publicPricingNote: "ค่าธรรมเนียมการตรวจสอบและสนับสนุนครั้งเดียว อาจมีค่าบริหารเพิ่มเติมสำหรับกรณีที่ขยายเวลา"
    }
  };

  const strings = t[language];

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
                      {step.number}. {step.title}
                    </h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {step.description}
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
                  + {memberSuccessFee}% {strings.successFee}
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
                  + {publicSuccessFee}% {strings.successFee}
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
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1A1D1F' }}>฿{fastTrackPrice}</span>
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
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1A1D1F' }}>฿{letterPackPrice}</span>
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
              {SERVICE_COMPONENTS.map((component, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b last:border-0" style={{ borderBottomColor: colors.borderColor }}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-ls-forest/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-ls-forest" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-1" style={{ color: colors.textPrimary }}>
                      {component.category}
                    </h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {component.description}
                    </p>
                  </div>
                </div>
              ))}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={createCaseMutation.isPending}
                style={{
                  width: '100%',
                  backgroundColor: createCaseMutation.isPending ? '#9CA3AF' : '#0C3B2E',
                  color: '#FFFFFF',
                  padding: '16px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: 'none',
                  cursor: createCaseMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: createCaseMutation.isPending ? 0.6 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
                onMouseEnter={(e) => {
                  if (!createCaseMutation.isPending) {
                    e.target.style.backgroundColor = '#0a2f25';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!createCaseMutation.isPending) {
                    e.target.style.backgroundColor = '#0C3B2E';
                  }
                }}
              >
                <Scale className="w-5 h-5" />
                {createCaseMutation.isPending ? strings.submitting : strings.submitCase}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
