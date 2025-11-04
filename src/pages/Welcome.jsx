
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, FileText, Wallet, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";

export default function Welcome() {
  const navigate = useNavigate();
  const [sendingEmail, setSendingEmail] = useState(false);

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
    borderColor: '#3A3D40'
  } : {
    bg: '#ECEFED',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  // Auto-send welcome email on first visit
  useEffect(() => {
    const sendWelcomeEmail = async () => {
      if (user && !user.welcome_email_sent && !sendingEmail) {
        setSendingEmail(true);
        try {
          await base44.functions.invoke('sendWelcomeEmail');
          console.log('✅ Welcome email sent successfully');
        } catch (error) {
          console.error('Failed to send welcome email:', error);
        } finally {
          setSendingEmail(false);
        }
      }
    };

    sendWelcomeEmail();
  }, [user, sendingEmail]);

  const handleGetStarted = () => {
    navigate(createPageUrl("Dashboard"));
  };

  const t = {
    en: {
      welcome: "Welcome to Lease Shield",
      subtitle: "Your Rental Protection Starts Now",
      description: "Prevent rental problems before they happen with AI-powered lease analysis, automated deposit tracking, and professional documentation.",
      checkEmail: "Check your email for getting started tips!",
      feature1Title: "AI Lease Analysis",
      feature1Desc: "Upload your lease and get instant risk assessment with detailed insights",
      feature2Title: "Deposit Protection",
      feature2Desc: "Track your security deposit with automated return reminders",
      feature3Title: "Evidence Vault",
      feature3Desc: "Securely store photos, receipts, and documents for your protection",
      feature4Title: "Maintenance Tracker",
      feature4Desc: "Log all repair requests and communications with your landlord",
      getStarted: "Get Started",
      learnMore: "Learn More",
      preventTitle: "Prevent Problems",
      preventDesc: "Automated lease analysis identifies risks before signing",
    },
    th: {
      welcome: "ยินดีต้อนรับสู่ Lease Shield",
      subtitle: "การปกป้องการเช่าของคุณเริ่มต้นแล้ว",
      description: "ป้องกันปัญหาการเช่าก่อนที่จะเกิดขึ้นด้วยการวิเคราะห์สัญญาเช่าด้วย AI การติดตามเงินมัดจำอัตโนมัติ และการจัดทำเอกสารอย่างมืออาชีพ",
      checkEmail: "ตรวจสอบอีเมลของคุณเพื่อรับเคล็ดลับการเริ่มต้น!",
      feature1Title: "การวิเคราะห์สัญญาเช่าด้วย AI",
      feature1Desc: "อัปโหลดสัญญาเช่าและรับการประเมินความเสี่ยงทันทีพร้อมข้อมูลเชิงลึก",
      feature2Title: "การปกป้องเงินมัดจำ",
      feature2Desc: "ติดตามเงินมัดจำของคุณพร้อมการแจ้งเตือนคืนเงินอัตโนมัติ",
      feature3Title: "ที่เก็บหลักฐาน",
      feature3Desc: "จัดเก็บภาพถ่าย ใบเสร็จ และเอกสารอย่างปลอดภัยเพื่อการปกป้องของคุณ",
      feature4Title: "ตัวติดตามการซ่อมบำรุง",
      feature4Desc: "บันทึกคำขอซ่อมแซมและการสื่อสารกับเจ้าของบ้านทั้งหมด",
      getStarted: "เริ่มต้นใช้งาน",
      learnMore: "เรียนรู้เพิ่มเติม",
      preventTitle: "ป้องกันปัญหา",
      preventDesc: "การวิเคราะห์สัญญาเช่าอัตโนมัติระบุความเสี่ยงก่อนลงนาม",
    }
  };

  const strings = t[language];

  const features = [
    {
      icon: FileText,
      title: strings.feature1Title,
      description: strings.feature1Desc,
      color: '#0C3B2E'
    },
    {
      icon: Wallet,
      title: strings.feature2Title,
      description: strings.feature2Desc,
      color: '#C7A338'
    },
    {
      icon: Shield,
      title: strings.feature3Title,
      description: strings.feature3Desc,
      color: '#0C3B2E'
    },
    {
      icon: AlertTriangle,
      title: strings.feature4Title,
      description: strings.feature4Desc,
      color: '#C7A338'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: isDarkMode 
        ? 'linear-gradient(135deg, #1A1D1F 0%, #2A2D30 100%)'
        : 'linear-gradient(135deg, #ECEFED 0%, #FFFFFF 100%)',
      padding: '48px 24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '64px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '120px',
            height: '120px',
            background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
            borderRadius: '24px',
            marginBottom: '32px',
            boxShadow: '0 20px 40px rgba(12, 59, 46, 0.3)'
          }}>
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png"
              alt="Lease Shield"
              style={{ width: '80px', height: '80px' }}
            />
          </div>

          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: colors.textPrimary,
            marginBottom: '16px',
            lineHeight: '1.2'
          }}>
            {strings.welcome}
          </h1>

          <p style={{
            fontSize: '24px',
            color: '#0C3B2E',
            fontWeight: '600',
            marginBottom: '24px'
          }}>
            {strings.subtitle}
          </p>

          <p style={{
            fontSize: '18px',
            color: colors.textSecondary,
            maxWidth: '700px',
            margin: '0 auto 24px auto',
            lineHeight: '1.6'
          }}>
            {strings.description}
          </p>

          {/* Email Sent Notification */}
          {sendingEmail ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED',
              borderRadius: '8px',
              marginBottom: '32px'
            }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#C7A338' }} />
              <span style={{ fontSize: '14px', color: colors.textPrimary }}>
                {language === 'th' ? 'กำลังส่งอีเมล...' : 'Sending welcome email...'}
              </span>
            </div>
          ) : user?.welcome_email_sent && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: '#ECFDF5',
              border: '2px solid #10B981',
              borderRadius: '8px',
              marginBottom: '32px'
            }}>
              <Shield className="w-4 h-4" style={{ color: '#10B981' }} />
              <span style={{ fontSize: '14px', color: '#065F46', fontWeight: '600' }}>
                {strings.checkEmail}
              </span>
            </div>
          )}

          <button
            onClick={handleGetStarted}
            style={{
              padding: '16px 48px',
              backgroundColor: '#C7A338',
              color: '#FFFFFF',
              fontSize: '18px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(199, 163, 56, 0.3)',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 15px 30px rgba(199, 163, 56, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 20px rgba(199, 163, 56, 0.3)';
            }}
          >
            {strings.getStarted}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Features Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginTop: '64px'
        }}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                style={{
                  backgroundColor: colors.cardBg,
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s',
                  border: `2px solid ${colors.borderColor}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.borderColor = feature.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = colors.borderColor;
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: feature.color,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: colors.textPrimary,
                  marginBottom: '12px'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: colors.textSecondary,
                  lineHeight: '1.6'
                }}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div style={{
          textAlign: 'center',
          marginTop: '64px',
          padding: '48px 32px',
          backgroundColor: colors.cardBg,
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{
            fontSize: '14px',
            color: colors.textSecondary,
            marginBottom: '8px'
          }}>
            {language === 'th' ? 'ยุติธรรม • โปร่งใส • ปลอดภัย' : 'Fair • Transparent • Protected'}
          </p>
          <p style={{
            fontSize: '11px',
            color: colors.textSecondary,
            fontStyle: 'italic'
          }}>
            {language === 'th' 
              ? 'เราไม่ใช่สำนักงานกฎหมายและไม่ได้ให้คำแนะนำทางกฎหมาย' 
              : 'We are not a law firm and do not provide legal advice'}
          </p>
        </div>
      </div>
    </div>
  );
}
