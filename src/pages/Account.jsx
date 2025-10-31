
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Globe, Shield, LogOut, Save, Crown, Settings, CheckCircle2, Bell, Zap, Lock, Download, FileText, AlertCircle, Loader2, Gift, Star, MessageCircle, HelpCircle } from "lucide-react";
import { PlanBadge } from "../components/shared/FeatureGate";
import NotificationSettings from "../components/settings/NotificationSettings";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const PLAN_DETAILS = [
  {
    key: 'free',
    label: 'Free',
    priceMonthly: 0,
    priceAnnual: 0,
    priceIdMonthly: null,
    priceIdAnnual: null,
    savingsAnnual: 0,
    intervalMonthly: '',
    intervalAnnual: '',
    tagline: 'Try Before You Commit',
    description: 'Experience our AI-powered lease analysis',
    benefits: [
      '1 Lease Scan (lifetime)',
      'Basic Risk Score Preview',
      '3 Files (100MB storage)',
      'Read-only Deposit Tracker',
      'Basic Maintenance Tracker'
    ],
    bgColor: '#64748b',
    icon: Gift
  },
  {
    key: 'lite',
    label: 'Lite',
    priceMonthly: 390,
    priceAnnual: 3900,
    priceIdMonthly: 'price_1SM6qtQwoI6NhlUxgDDy2LuJ',
    priceIdAnnual: 'price_1SNqjfQwoI6NhlUxk9LwivBm',
    savingsAnnual: 780,
    intervalMonthly: '/month',
    intervalAnnual: '/year',
    tagline: 'Essential Protection',
    description: 'Core prevention tools for individuals',
    benefits: [
      '5 Lease Scans per month',
      'Full AI Risk Reports',
      'Email Notifications',
      '3 Basic Letter Templates',
      '1GB Document Storage',
      'Deposit Tracker',
      'Maintenance Tracker'
    ],
    bgColor: '#0C3B2E',
    icon: Zap
  },
  {
    key: 'protect',
    label: 'Protect',
    priceMonthly: 690,
    priceAnnual: 6900,
    priceIdMonthly: 'price_1SM6rhQwoI6NhlUxZIN3WekE',
    priceIdAnnual: 'price_1SNqkMQwoI6NhlUxHb2VADjs',
    savingsAnnual: 1380,
    intervalMonthly: '/month',
    intervalAnnual: '/year',
    tagline: 'Complete Prevention Suite',
    description: 'Everything you need for full protection',
    benefits: [
      'Everything in Lite',
      'Unlimited Lease Scans',
      'Deposit Shield Automation',
      'Rent Payment Alerts',
      'All 7+ Letter Templates',
      '5GB Document Storage',
      'LINE Notifications',
      'Automated Reminders'
    ],
    bgColor: '#C7A338',
    icon: Shield,
    popular: true
  },
  {
    key: 'secure',
    label: 'Secure',
    priceMonthly: 1290,
    priceAnnual: 12900,
    priceIdMonthly: 'price_1SM6t9QwoI6NhlUxy5Pl7Rrq',
    priceIdAnnual: 'price_1SNqkxQwoI6NhlUx09mj0Lur',
    savingsAnnual: 2580,
    intervalMonthly: '/month',
    intervalAnnual: '/year',
    tagline: 'Premium Protection',
    description: 'Maximum prevention with priority support',
    benefits: [
      'Everything in Protect',
      'Priority Case Queue',
      'Priority AI Scanning',
      '20GB Document Storage',
      'Advanced Reminders',
      'Premium Support',
      'Legal Document Archive'
    ],
    bgColor: '#1A1D1F',
    icon: Crown
  }
];

export default function Account() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [billingInterval, setBillingInterval] = useState('monthly');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    country: user?.country || '',
    language: user?.language || 'en',
    theme: user?.theme || 'light'
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        country: user.country || '',
        language: user.language || 'en',
        theme: user.theme || 'light'
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditing(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleNotificationUpdate = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handleThemeToggle = (newTheme) => {
    setFormData({...formData, theme: newTheme});
    updateProfileMutation.mutate({ theme: newTheme });
  };

  const handleSubscribe = async (planKey, interval) => {
    const plan = PLAN_DETAILS.find(p => p.key === planKey);
    if (!plan) return;

    const priceId = interval === 'annual' ? plan.priceIdAnnual : plan.priceIdMonthly;

    setSubscribing(true);
    try {
      const response = await base44.functions.invoke('createCheckout', {
        priceId: priceId,
        mode: 'subscription'
      });
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportUserData');
      
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lease_shield_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again or contact support.');
    } finally {
      setExporting(false);
    }
  };

  const currentPlanTier = user?.plan_tier || 'free';
  const isFree = currentPlanTier === 'free';
  const language = user?.language || 'en';
  const currentTheme = user?.theme || 'light';
  const isDarkMode = currentTheme === 'dark';

  // Dark mode colors
  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    inputBg: '#353A3D',
    fieldBg: '#353A3D',
    hoverBg: '#3A3D40'
  } : {
    bg: '#ECEFED',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    inputBg: '#FFFFFF',
    fieldBg: '#ECEFED',
    hoverBg: '#F8FAFC'
  };

  const t = {
    en: {
      pageTitle: "My Account",
      pageSubtitle: "Manage your profile and subscription",
      personalInfo: "Personal Information",
      editProfile: "Edit Profile",
      fullName: "Full Name",
      email: "Email",
      cannotChange: "Cannot be changed",
      phone: "Phone Number",
      phonePlaceholder: "+66 XX XXX XXXX",
      country: "Country",
      countryPlaceholder: "Thailand",
      language: "Language",
      theme: "Theme",
      lightMode: "Light Mode",
      darkMode: "Dark Mode",
      saveChanges: "Save Changes",
      cancel: "Cancel",
      currentPlan: "Current Plan",
      billedMonthly: "Billed monthly",
      billedAnnually: "Billed annually",
      renews: "Renews",
      freePlanName: "Free",
      freeIncludes: "Free Plan Includes:",
      freeBenefit1: "1 Lease Scan (lifetime)",
      freeBenefit2: "Basic Risk Score Preview",
      freeBenefit3: "3 Files (100MB storage)",
      freeBenefit4: "Read-only Deposit Tracker",
      upgradeNow: "Upgrade Now",
      allActive: "All features active",
      lineEnabled: "LINE reminders enabled",
      helpSupport: "Help & Support",
      helpDesc: "Need assistance? Submit a request and we'll respond via email",
      submitRequest: "Submit Support Request",
      submitDesc: "Report issues, ask questions, or get help",
      directEmail: "Direct Email",
      responseTime: "Response within 24-48 hours",
      dataPrivacy: "Data Privacy & Your Rights",
      privacyPolicy: "Privacy Policy",
      privacyDesc: "Learn how we protect your data",
      viewPolicy: "View Policy",
      exportData: "Export My Data",
      exportDesc: "Download all your personal data (PDPA compliant)",
      export: "Export",
      exporting: "Exporting...",
      deleteAccount: "Need to Delete Your Account?",
      deleteDesc: "To exercise your right to erasure under PDPA, please contact us at",
      deleteNote: "We will securely delete all your data within 30 days.",
      preventionBannerTitle: "Prevention-First Protection",
      preventionBannerSubtitle: "Subscription-based protection for your lease, deposit, and documentation",
      preventionBannerText: "Lease Shield helps you maintain clear, legal, and evidence-based leasing relationships. Prevent rental problems before they happen with automated alerts, risk analysis, and professional templates.",
      monthly: "Monthly",
      annual: "Annual",
      save17: "Save 17%",
      choosePlan: "Choose Your Protection Level",
      planDesc: "All plans focus on prevention and maintaining clear records",
      mostPopular: "MOST POPULAR",
      monthsFree: "2 MONTHS FREE",
      noCreditCard: "No credit card required",
      perMonth: "/month",
      save: "Save",
      currentPlanBadge: "Current Plan",
      signupFree: "Sign Up to Get Free",
      startPlan: "Start",
      processing: "Processing...",
      logout: "Logout",
      notProvided: "Not provided"
    },
    th: {
      pageTitle: "บัญชีของฉัน",
      pageSubtitle: "จัดการโปรไฟล์และการสมัครสมาชิก",
      personalInfo: "ข้อมูลส่วนตัว",
      editProfile: "แก้ไขโปรไฟล์",
      fullName: "ชื่อ-นามสกุล",
      email: "อีเมล",
      cannotChange: "ไม่สามารถเปลี่ยนแปลงได้",
      phone: "เบอร์โทรศัพท์",
      phonePlaceholder: "+66 XX XXX XXXX",
      country: "ประเทศ",
      countryPlaceholder: "ประเทศไทย",
      language: "ภาษา",
      theme: "ธีม",
      lightMode: "โหมดสว่าง",
      darkMode: "โหมดมืด",
      saveChanges: "บันทึกการเปลี่ยนแปลง",
      cancel: "ยกเลิก",
      currentPlan: "แผนปัจจุบัน",
      billedMonthly: "เรียกเก็บรายเดือน",
      billedAnnually: "เรียกเก็บรายปี",
      renews: "ต่ออายุ",
      freePlanName: "ฟรี",
      freeIncludes: "แผนฟรีประกอบด้วย:",
      freeBenefit1: "สแกนสัญญาเช่า 1 ครั้ง (ตลอดชีพ)",
      freeBenefit2: "แสดงตัวอย่างคะแนนความเสี่ยงพื้นฐาน",
      freeBenefit3: "3 ไฟล์ (พื้นที่เก็บข้อมูล 100MB)",
      freeBenefit4: "เครื่องมือติดตามเงินมัดจำแบบอ่านอย่างเดียว",
      upgradeNow: "อัปเกรดเลย",
      allActive: "ฟีเจอร์ทั้งหมดใช้งานได้",
      lineEnabled: "การแจ้งเตือน LINE เปิดใช้งาน",
      helpSupport: "ช่วยเหลือและการสนับสนุน",
      helpDesc: "ต้องการความช่วยเหลือ? ส่งคำขอและเราจะตอบกลับทางอีเมล",
      submitRequest: "ส่งคำขอช่วยเหลือ",
      submitDesc: "รายงานปัญหา ถามคำถาม หรือขอความช่วยเหลือ",
      directEmail: "อีเมลโดยตรง",
      responseTime: "ตอบกลับภายใน 24-48 ชั่วโมง",
      dataPrivacy: "ความเป็นส่วนตัวของข้อมูลและสิทธิ์ของคุณ",
      privacyPolicy: "นโยบายความเป็นส่วนตัว",
      privacyDesc: "เรียนรู้วิธีที่เราปกป้องข้อมูลของคุณ",
      viewPolicy: "ดูนโยบาย",
      exportData: "ส่งออกข้อมูลของฉัน",
      exportDesc: "ดาวน์โหลดข้อมูลส่วนบุคคลทั้งหมด (ตาม พ.ร.บ. PDPA)",
      export: "ส่งออก",
      exporting: "กำลังส่งออก...",
      deleteAccount: "ต้องการลบบัญชี?",
      deleteDesc: "หากต้องการใช้สิทธิ์ลบข้อมูลตาม พ.ร.บ. PDPA กรุณาติดต่อเราที่",
      deleteNote: "เราจะลบข้อมูลทั้งหมดของคุณอย่างปลอดภัยภายใน 30 วัน",
      preventionBannerTitle: "การป้องกันเป็นอันดับแรก",
      preventionBannerSubtitle: "การป้องกันแบบสมัครสมาชิกสำหรับสัญญาเช่า เงินมัดจำ และเอกสารของคุณ",
      preventionBannerText: "Lease Shield ช่วยให้คุณรักษาความสัมพันธ์ในการเช่าที่ชัดเจน ถูกกฎหมาย และมีหลักฐาน ป้องกันปัญหาการเช่าก่อนที่จะเกิดขึ้นด้วยการแจ้งเตือนอัตโนมัติ การวิเคราะห์ความเสี่ยง และเทมเพลตมืออาชีพ",
      monthly: "รายเดือน",
      annual: "รายปี",
      save17: "ประหยัด 17%",
      choosePlan: "เลือกระดับการป้องกันของคุณ",
      planDesc: "แผนทั้งหมดมุ่งเน้นการป้องกันและรักษาบันทึกที่ชัดเจน",
      mostPopular: "ได้รับความนิยมมากที่สุด",
      monthsFree: "ฟรี 2 เดือน",
      noCreditCard: "ไม่ต้องใช้บัตรเครดิต",
      perMonth: "/เดือน",
      save: "ประหยัด",
      currentPlanBadge: "แผนปัจจุบัน",
      signupFree: "สมัครเพื่อรับฟรี",
      startPlan: "เริ่มต้น",
      processing: "กำลังดำเนินการ...",
      logout: "ออกจากระบบ",
      notProvided: "ไม่ได้ระบุ"
    }
  };

  const strings = t[language];

  return (
    <div className="min-h-screen p-4 md:p-6 pb-32" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#0C3B2E',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(12, 59, 46, 0.2)'
            }}>
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.pageTitle}</h1>
              <p style={{ color: colors.textSecondary }}>{strings.pageSubtitle}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Personal Information Card */}
          <Card className="lg:col-span-2 border-none shadow-xl" style={{
            backgroundColor: colors.cardBg
          }}>
            <CardHeader className="border-b pb-4" style={{
              backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED',
              borderBottomColor: colors.borderColor
            }}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <Settings className="w-5 h-5 text-ls-forest" />
                  {strings.personalInfo}
                </CardTitle>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '2px solid #0C3B2E',
                      backgroundColor: colors.cardBg,
                      color: '#0C3B2E',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#C7A338';
                      e.target.style.borderColor = '#C7A338';
                      e.target.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = colors.cardBg;
                      e.target.style.borderColor = '#0C3B2E';
                      e.target.style.color = '#0C3B2E';
                    }}
                  >
                    {strings.editProfile}
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {!isEditing ? (
                <div className="space-y-3">
                  {/* Name Display */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: colors.fieldBg,
                    borderRadius: '12px',
                    borderLeft: '4px solid #0C3B2E'
                  }}>
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#0C3B2E',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.fullName}</p>
                        <p className="font-bold text-lg" style={{ color: colors.textPrimary }}>{user?.full_name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Email Display */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: colors.fieldBg,
                    borderRadius: '12px',
                    borderLeft: '4px solid #C7A338'
                  }}>
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#C7A338',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.email}</p>
                        <p className="font-bold" style={{ color: colors.textPrimary }}>{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Phone Display */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: colors.fieldBg,
                    borderRadius: '12px',
                    borderLeft: '4px solid #0C3B2E'
                  }}>
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#0C3B2E',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.phone}</p>
                        <p className="font-bold" style={{ color: colors.textPrimary }}>{user?.phone || strings.notProvided}</p>
                      </div>
                    </div>
                  </div>

                  {/* Language Display */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: colors.fieldBg,
                    borderRadius: '12px',
                    borderLeft: '4px solid #1A1D1F'
                  }}>
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#1A1D1F',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.language}</p>
                        <p className="font-bold" style={{ color: colors.textPrimary }}>
                          {user?.language === 'th' ? 'ไทย (Thai)' : 'English'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Theme Display with Toggle */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: colors.fieldBg,
                    borderRadius: '12px',
                    borderLeft: '4px solid #C7A338'
                  }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: '#C7A338',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {currentTheme === 'dark' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="5"></circle>
                              <line x1="12" y1="1" x2="12" y2="3"></line>
                              <line x1="12" y1="21" x2="12" y2="23"></line>
                              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                              <line x1="1" y1="12" x2="3" y2="12"></line>
                              <line x1="21" y1="12" x2="23" y2="12"></line>
                              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.theme}</p>
                          <p className="font-bold" style={{ color: colors.textPrimary }}>
                            {currentTheme === 'dark' ? strings.darkMode : strings.lightMode}
                          </p>
                        </div>
                      </div>
                      <div className="flex rounded-lg p-1 shadow-sm" style={{ backgroundColor: isDarkMode ? '#2A2D30' : '#FFFFFF' }}>
                        <button
                          onClick={() => handleThemeToggle('light')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: currentTheme === 'light' ? '#0C3B2E' : 'transparent',
                            color: currentTheme === 'light' ? '#FFFFFF' : colors.textSecondary,
                            fontWeight: currentTheme === 'light' ? 'bold' : 'normal',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                          </svg>
                          {language === 'th' ? 'สว่าง' : 'Light'}
                        </button>
                        <button
                          onClick={() => handleThemeToggle('dark')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: currentTheme === 'dark' ? '#0C3B2E' : 'transparent',
                            color: currentTheme === 'dark' ? '#FFFFFF' : colors.textSecondary,
                            fontWeight: currentTheme === 'dark' ? 'bold' : 'normal',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                          </svg>
                          {language === 'th' ? 'มืด' : 'Dark'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <Label htmlFor="full_name" className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                      <User className="w-4 h-4 text-ls-forest" />
                      {strings.fullName}
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      placeholder={language === 'th' ? 'ชื่อ-นามสกุลของคุณ' : 'Your full name'}
                      style={{
                        border: `2px solid ${colors.borderColor}`,
                        backgroundColor: colors.inputBg,
                        color: colors.textPrimary,
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Email Display (Read-only) */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                      <Mail className="w-4 h-4 text-ls-gold" />
                      {strings.email}
                    </Label>
                    <div style={{
                      padding: '10px 12px',
                      backgroundColor: colors.fieldBg,
                      borderRadius: '8px',
                      border: `2px solid ${colors.borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span style={{ color: colors.textPrimary, fontSize: '14px' }}>{user?.email}</span>
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '11px',
                        color: colors.textSecondary,
                        fontStyle: 'italic'
                      }}>
                        {strings.cannotChange}
                      </span>
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div>
                    <Label htmlFor="phone" className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                      <Phone className="w-4 h-4 text-ls-forest" />
                      {strings.phone}
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder={strings.phonePlaceholder}
                      style={{
                        border: `2px solid ${colors.borderColor}`,
                        backgroundColor: colors.inputBg,
                        color: colors.textPrimary,
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Country Input */}
                  <div>
                    <Label htmlFor="country" className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                      <Globe className="w-4 h-4 text-ls-forest" />
                      {strings.country}
                    </Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      placeholder={strings.countryPlaceholder}
                      style={{
                        border: `2px solid ${colors.borderColor}`,
                        backgroundColor: colors.inputBg,
                        color: colors.textPrimary,
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Language Select */}
                  <div>
                    <Label htmlFor="language" className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>{strings.language}</Label>
                    <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                      <SelectTrigger style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.borderColor }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: colors.cardBg, color: colors.textPrimary }}>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="th">ไทย (Thai)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Theme Select */}
                  <div>
                    <Label htmlFor="theme" className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>{strings.theme}</Label>
                    <Select value={formData.theme} onValueChange={(value) => setFormData({...formData, theme: value})}>
                      <SelectTrigger style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.borderColor }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: colors.cardBg, color: colors.textPrimary }}>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="5"></circle>
                              <line x1="12" y1="1" x2="12" y2="3"></line>
                              <line x1="12" y1="21" x2="12" y2="23"></line>
                              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                              <line x1="1" y1="12" x2="3" y2="12"></line>
                              <line x1="21" y1="12" x2="23" y2="12"></line>
                              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                            </svg>
                            {strings.lightMode}
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                            {strings.darkMode}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        border: 'none',
                        backgroundColor: '#0C3B2E',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(12, 59, 46, 0.3)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#C7A338';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 8px rgba(199, 163, 56, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#0C3B2E';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 6px rgba(12, 59, 46, 0.3)';
                      }}
                    >
                      <Save className="w-4 h-4" />
                      {strings.saveChanges}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        border: `2px solid ${colors.borderColor}`,
                        backgroundColor: colors.cardBg,
                        color: colors.textPrimary,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = colors.hoverBg;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = colors.cardBg;
                      }}
                    >
                      {strings.cancel}
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Current Plan Card */}
          <Card className="border-none shadow-xl overflow-hidden" style={{
            backgroundColor: colors.cardBg
          }}>
            <CardHeader className="border-b pb-4" style={{
              backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED',
              borderBottomColor: colors.borderColor
            }}>
              <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Shield className="w-5 h-5 text-ls-forest" />
                {strings.currentPlan}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <div className="mb-3">
                  <PlanBadge tier={currentPlanTier} />
                </div>
                <p className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
                  {isFree ? strings.freePlanName : (PLAN_DETAILS.find(p => p.key === currentPlanTier)?.priceMonthly ? `฿${PLAN_DETAILS.find(p => p.key === currentPlanTier)?.priceMonthly}` : '—')}
                </p>
                {!isFree && user?.billing_interval && (
                  <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    {user.billing_interval === 'annual' ? strings.billedAnnually : strings.billedMonthly}
                  </p>
                )}
                {user?.subscription_status === 'active' && user?.plan_renews_at && (
                  <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                    {strings.renews} {new Date(user.plan_renews_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              {isFree ? (
                <div className="space-y-3">
                  <div style={{ padding: '12px', backgroundColor: colors.fieldBg, borderRadius: '8px', borderLeft: '4px solid #C7A338' }}>
                    <p style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: '600', marginBottom: '8px' }}>
                      {strings.freeIncludes}
                    </p>
                    <ul style={{ fontSize: '12px', color: colors.textPrimary, lineHeight: '1.5' }}>
                      <li>• {strings.freeBenefit1}</li>
                      <li>• {strings.freeBenefit2}</li>
                      <li>• {strings.freeBenefit3}</li>
                      <li>• {strings.freeBenefit4}</li>
                    </ul>
                  </div>
                  <button 
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#C7A338',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#C7A338'}
                  >
                    {strings.upgradeNow}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div style={{ padding: '12px', backgroundColor: colors.fieldBg, borderRadius: '8px', borderLeft: '4px solid #0C3B2E' }}>
                    <p className="text-sm flex items-center gap-2" style={{ color: colors.textPrimary }}>
                      <CheckCircle2 className="w-4 h-4 text-ls-forest" />
                      {strings.allActive}
                    </p>
                  </div>
                  {(currentPlanTier === 'protect' || currentPlanTier === 'secure') && (
                    <div style={{ padding: '12px', backgroundColor: colors.fieldBg, borderRadius: '8px', borderLeft: '4px solid #C7A338' }}>
                      <p className="text-xs flex items-center gap-1" style={{ color: colors.textPrimary }}>
                        <Bell className="w-3 h-3 text-ls-gold" />
                        {strings.lineEnabled}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Help & Support Section */}
        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader className="border-b" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED', borderBottomColor: colors.borderColor }}>
            <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <HelpCircle className="w-5 h-5 text-ls-forest" />
              {strings.helpSupport}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              {strings.helpDesc}
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Submit Support Ticket */}
              <Link to={createPageUrl("Support")}>
                <div
                  style={{
                    padding: '20px',
                    backgroundColor: '#0C3B2E',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    height: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0a2f25';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0C3B2E';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white">
                        {strings.submitRequest}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-white/80">
                    {strings.submitDesc}
                  </p>
                </div>
              </Link>

              {/* Email Support */}
              <a
                href="mailto:support@leaseshield.asia"
                style={{
                  padding: '20px',
                  backgroundColor: colors.fieldBg,
                  borderRadius: '12px',
                  borderLeft: '4px solid #C7A338',
                  textDecoration: 'none',
                  display: 'block',
                  transition: 'all 0.2s',
                  height: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#C7A338';
                  e.currentTarget.querySelectorAll('p').forEach(el => {
                    el.style.color = '#FFFFFF';
                  });
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.fieldBg;
                  e.currentTarget.querySelectorAll('p:nth-child(1)').forEach(el => {
                    el.style.color = colors.textPrimary;
                  });
                  e.currentTarget.querySelectorAll('p:nth-child(2)').forEach(el => {
                    el.style.color = colors.textSecondary;
                  });
                  e.currentTarget.querySelectorAll('p:nth-child(3)').forEach(el => {
                    el.style.color = colors.textSecondary;
                  });
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#C7A338',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: colors.textPrimary }}>
                      {strings.directEmail}
                    </p>
                  </div>
                </div>
                <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>support@leaseshield.asia</p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {strings.responseTime}
                </p>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Data Privacy & Rights Section */}
        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader className="border-b" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED', borderBottomColor: colors.borderColor }}>
            <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Shield className="w-5 h-5 text-ls-forest" />
              {strings.dataPrivacy}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Privacy Policy Link */}
              <div style={{
                padding: '16px',
                backgroundColor: colors.fieldBg,
                borderRadius: '12px',
                borderLeft: '4px solid #0C3B2E'
              }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#0C3B2E',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: colors.textPrimary }}>{strings.privacyPolicy}</p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.privacyDesc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(createPageUrl("PrivacyPolicy"), '_blank')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '2px solid #0C3B2E',
                      backgroundColor: colors.cardBg,
                      color: '#0C3B2E',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#0C3B2E';
                      e.target.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = colors.cardBg;
                      e.target.style.color = '#0C3B2E';
                    }}
                  >
                    {strings.viewPolicy}
                  </button>
                </div>
              </div>

              {/* Export Data (PDPA Right to Portability) */}
              <div style={{
                padding: '16px',
                backgroundColor: colors.fieldBg,
                borderRadius: '12px',
                borderLeft: '4px solid #C7A338'
              }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#C7A338',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Download className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: colors.textPrimary }}>{strings.exportData}</p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.exportDesc}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportData}
                    disabled={exporting}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '2px solid #C7A338',
                      backgroundColor: exporting ? colors.fieldBg : colors.cardBg,
                      color: exporting ? colors.textSecondary : '#C7A338',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: exporting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      if (!exporting) {
                        e.target.style.backgroundColor = '#C7A338';
                        e.target.style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!exporting) {
                        e.target.style.backgroundColor = colors.cardBg;
                        e.target.style.color = '#C7A338';
                      }
                    }}
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {strings.exporting}
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        {strings.export}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Delete Account Notice */}
              <div style={{
                padding: '16px',
                backgroundColor: '#FEE2E2', // This is a warning, keeps red background
                borderRadius: '12px',
                borderLeft: '4px solid #DC2626'
              }}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 mb-1">{strings.deleteAccount}</p>
                    <p className="text-sm text-red-800 mb-2">
                      {strings.deleteDesc} <strong>privacy@leaseshield.asia</strong>
                    </p>
                    <p className="text-xs text-red-700">
                      {strings.deleteNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <NotificationSettings 
            user={user} 
            onUpdate={handleNotificationUpdate}
            colors={colors} // Pass colors to NotificationSettings if it needs to adapt
          />
        </div>

        {/* Prevention-First Subscription Positioning Banner */}
        <div style={{
          background: 'linear-gradient(to right, #0C3B2E, #047857)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
        }}>
          <div className="text-center">
            <Shield className="w-12 h-12 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">
              {strings.preventionBannerTitle}
            </h2>
            <p className="text-white/90 text-lg mb-2">
              {strings.preventionBannerSubtitle}
            </p>
            <p className="text-white/80 text-sm max-w-2xl mx-auto">
              {strings.preventionBannerText}
            </p>
          </div>
        </div>

        {/* Billing Toggle */}
        <div id="plans-section" className="mb-6">
          <div className="flex items-center justify-center mb-6">
            <div className="rounded-xl p-2 shadow-md inline-flex items-center gap-3" style={{ backgroundColor: colors.cardBg }}>
              <button
                onClick={() => setBillingInterval('monthly')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: billingInterval === 'monthly' ? '#0C3B2E' : 'transparent',
                  color: billingInterval === 'monthly' ? '#FFFFFF' : colors.textPrimary
                }}
              >
                {strings.monthly}
              </button>
              <button
                onClick={() => setBillingInterval('annual')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: billingInterval === 'annual' ? '#0C3B2E' : 'transparent',
                  color: billingInterval === 'annual' ? '#FFFFFF' : colors.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {strings.annual}
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  backgroundColor: '#C7A338',
                  color: '#FFFFFF'
                }}>
                  {strings.save17}
                </span>
              </button>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: colors.textPrimary }}>{strings.choosePlan}</h2>
          <p className="mb-6 text-center" style={{ color: colors.textSecondary }}>{strings.planDesc}</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {PLAN_DETAILS.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = currentPlanTier === plan.key;
              const isFreeplan = plan.key === 'free';
              const displayPrice = isFreeplan ? 0 : (billingInterval === 'annual' ? plan.priceAnnual : plan.priceMonthly);
              const displayInterval = isFreeplan ? '' : (billingInterval === 'annual' ? plan.intervalAnnual : plan.intervalMonthly);
              const effectiveMonthly = billingInterval === 'annual' ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly;
              
              return (
                <div 
                  key={plan.key}
                  style={{
                    position: 'relative',
                    borderRadius: '16px',
                    overflow: 'visible',
                    boxShadow: plan.popular ? '0 20px 25px -5px rgba(199, 163, 56, 0.3), 0 10px 10px -5px rgba(199, 163, 56, 0.15)' : '0 10px 15px -3px rgba(0,0,0,0.1)',
                    border: plan.popular ? '3px solid #C7A338' : `2px solid ${colors.borderColor}`,
                    backgroundColor: colors.cardBg,
                    transform: plan.popular ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {plan.popular && (
                    <div style={{
                      position: 'absolute',
                      top: '-16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#C7A338',
                      color: '#0C3B2E',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      padding: '10px 24px',
                      borderRadius: '20px',
                      border: '2px solid #0C3B2E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      zIndex: 10,
                      letterSpacing: '0.5px',
                      boxShadow: '0 4px 12px rgba(199, 163, 56, 0.4)'
                    }}>
                      <Star style={{ width: '16px', height: '16px', fill: '#0C3B2E', color: '#0C3B2E' }} />
                      <span>{strings.mostPopular}</span>
                      <Star style={{ width: '16px', height: '16px', fill: '#0C3B2E', color: '#0C3B2E' }} />
                    </div>
                  )}

                  {billingInterval === 'annual' && !isFreeplan && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '6px 12px',
                      borderBottomRightRadius: '8px',
                      zIndex: 10
                    }}>
                      🏷️ {strings.monthsFree}
                    </div>
                  )}
                  
                  <div style={{
                    backgroundColor: plan.bgColor,
                    padding: plan.popular ? '48px 24px 24px 24px' : '32px 24px 24px 24px',
                    color: '#FFFFFF'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Icon style={{ width: '28px', height: '28px', color: '#FFFFFF' }} />
                      <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 }}>
                        {plan.label}
                      </h3>
                    </div>
                    <p style={{ fontSize: '14px', color: '#FFFFFF', opacity: 0.95, marginBottom: '16px', minHeight: '20px' }}>
                      {plan.tagline}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                      {isFreeplan ? (
                        <span style={{ fontSize: '40px', fontWeight: 'bold', color: '#FFFFFF', lineHeight: '1' }}>
                          {strings.freePlanName}
                        </span>
                      ) : (
                        <>
                          <span style={{ fontSize: '40px', fontWeight: 'bold', color: '#FFFFFF', lineHeight: '1' }}>
                            ฿{displayPrice.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '16px', color: '#FFFFFF', opacity: 0.9 }}>
                            {displayInterval}
                          </span>
                        </>
                      )}
                    </div>
                    {billingInterval === 'annual' && !isFreeplan && (
                      <p style={{ fontSize: '13px', color: '#FFFFFF', opacity: 0.85, marginTop: '4px' }}>
                        ฿{effectiveMonthly}{strings.perMonth} • {strings.save} ฿{plan.savingsAnnual.toLocaleString()}
                      </p>
                    )}
                    {isFreeplan && (
                      <p style={{ fontSize: '13px', color: '#FFFFFF', opacity: 0.85, marginTop: '4px' }}>
                        {strings.noCreditCard}
                      </p>
                    )}
                  </div>

                  <div style={{ padding: '24px' }}>
                    <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '20px', minHeight: '40px', lineHeight: '1.5' }}>
                      {plan.description}
                    </p>
                    <ul style={{ 
                      listStyle: 'none', 
                      padding: 0, 
                      margin: '0 0 24px 0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      {plan.benefits.map((benefit, idx) => {
                        // Check if this is the "Everything in..." benefit
                        const isEverythingBenefit = benefit.startsWith('Everything in');
                        
                        return (
                          <li key={idx} style={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: '10px',
                            fontSize: '14px',
                            color: colors.textPrimary,
                            lineHeight: '1.4'
                          }}>
                            <CheckCircle2 style={{ 
                              width: '18px', 
                              height: '18px', 
                              color: '#0C3B2E',
                              flexShrink: 0,
                              marginTop: '1px'
                            }} />
                            <span style={{ fontWeight: isEverythingBenefit ? 'bold' : 'normal' }}>
                              {benefit}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    
                    {isCurrentPlan ? (
                      <button
                        disabled
                        style={{
                          width: '100%',
                          padding: '14px 20px',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          border: `2px solid ${colors.borderColor}`,
                          backgroundColor: colors.fieldBg,
                          color: colors.textSecondary,
                          cursor: 'not-allowed'
                        }}
                      >
                        {strings.currentPlanBadge}
                      </button>
                    ) : isFreeplan ? (
                      <button
                        disabled
                        style={{
                          width: '100%',
                          padding: '14px 20px',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          border: `2px solid ${colors.textSecondary}`,
                          backgroundColor: colors.cardBg,
                          color: colors.textSecondary,
                          cursor: 'not-allowed'
                        }}
                      >
                        {strings.signupFree}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan.key, billingInterval)}
                        disabled={subscribing}
                        style={{
                          width: '100%',
                          padding: '14px 20px',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          border: 'none',
                          backgroundColor: plan.bgColor,
                          color: '#FFFFFF',
                          cursor: subscribing ? 'not-allowed' : 'pointer',
                          opacity: subscribing ? 0.7 : 1,
                          transition: 'all 0.2s',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                          if (!subscribing) e.target.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          if (!subscribing) e.target.style.opacity = '1';
                        }}
                      >
                        {subscribing ? strings.processing : `${strings.startPlan} ${plan.label}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Logout Button - with extra margin */}
        <div className="mt-8 mb-4">
          <Button
            variant="outline"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={() => base44.auth.logout()}
            style={{ 
              backgroundColor: colors.cardBg, 
              borderColor: isDarkMode ? '#EF4444' : '#FECACA', 
              color: '#EF4444',
              padding: '14px 20px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = isDarkMode ? '#440000' : '#FEF2F2';
              e.target.style.color = '#DC2626';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = colors.cardBg;
              e.target.style.color = '#EF4444';
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {strings.logout}
          </Button>
        </div>
      </div>
    </div>
  );
}
