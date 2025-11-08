
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Globe, Shield, LogOut, Save, Crown, Settings, CheckCircle2, Bell, Zap, Lock, Download, FileText, AlertCircle, Loader2, Gift, Star, MessageCircle, HelpCircle, XCircle, Copy, QrCode, Share2, Coins } from "lucide-react";
import { PlanBadge } from "../components/shared/FeatureGate";
import NotificationSettings from "../components/settings/NotificationSettings";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";


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
    description: 'Experience our automated lease analysis',
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
      'Everything in Free',
      '6 Lease Scans per annum',
      '5 Risks Reported',
      'Email Notifications',
      '3 Letter Credits',
      '1GB Document Storage',
      'Maintenance Tracker',
      'Deposit Tracker'
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
      '12 Lease Scans per annum',
      'Full Risk Reports',
      'LINE Notifications',
      '5 Letter Credits',
      '5GB Document Storage',
      'Rent Payment Alerts',
      'Automated Reminders',
      'Deposit Shield Automation'
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
      'Unlimited Lease Scans',
      'Advanced Reminders',
      '10 Letter Credits',
      '20GB Document Storage',
      'Deposit Tracker',
      'Priority Case Queue',
      'Priority Scanning',
      'Premium Support'
    ],
    bgColor: '#1A1D1F',
    icon: Crown
  }
];

// Credit packages
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

export default function Account() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [subscribing, setSubscribing] = useState({}); // ✅ Changed to object to track each plan
  const [exporting, setExporting] = useState(false);
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelFeedback, setCancelFeedback] = useState('');
  const [copiedLink, setCopiedLink] = useState(null);
  const [showQR, setShowQR] = useState({ landlord: false, juristic: false });
  const [buyingCredits, setBuyingCredits] = useState({}); // Object to track each package separately

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Detect payment success on page load and trigger aggressive refresh
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      console.log('💳 Payment success detected - starting credit refresh...');
      
      // Clean URL immediately
      window.history.replaceState({}, '', window.location.pathname);
      
      // Aggressive polling for 60 seconds to catch webhook update
      let pollCount = 0;
      const maxPolls = 12; // 60 seconds total (5s intervals)
      
      const pollInterval = setInterval(() => {
        pollCount++;
        console.log(`🔄 Polling for credits update (${pollCount}/${maxPolls})...`);
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          console.log('✅ Credit refresh polling complete');
        }
      }, 5000); // Every 5 seconds
      
      // Cleanup on unmount
      return () => clearInterval(pollInterval);
    }
  }, [queryClient]);

  // Auto-refresh credits every 5 seconds after window regains focus
  React.useEffect(() => {
    let intervalId;
    
    const handleFocus = () => {
      // Immediate refresh
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      // Clear any existing interval to prevent multiple intervals
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null; // Important: null out the ID after clearing
      }

      // Then refresh every 5 seconds for 30 seconds
      let count = 0;
      intervalId = setInterval(() => {
        count++;
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        
        if (count >= 6) { // Stop after 30 seconds (6 * 5s)
          clearInterval(intervalId);
          intervalId = null; // Important: null out the ID after clearing
        }
      }, 5000);
    };
    
    const handleBlur = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null; // Important: null out the ID after clearing
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      if (intervalId) { // Ensure interval is cleared on component unmount
        clearInterval(intervalId);
      }
    };
  }, [queryClient]);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    country: user?.country || '',
    language: user?.language || 'en',
    theme: user?.theme || 'light'
  });

  const [landlordData, setLandlordData] = useState({
    landlord_name: user?.landlord_name || '',
    landlord_email: user?.landlord_email || '',
    landlord_phone: user?.landlord_phone || '',
    landlord_line: user?.landlord_line || '',
    landlord_address: user?.landlord_address || ''
  });

  const [juristicData, setJuristicData] = useState({
    juristic_name: user?.juristic_name || '',
    juristic_email: user?.juristic_email || '',
    juristic_phone: user?.juristic_phone || '',
    juristic_line: user?.juristic_line || ''
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
      setLandlordData({
        landlord_name: user.landlord_name || '',
        landlord_email: user.landlord_email || '',
        landlord_phone: user.landlord_phone || '',
        landlord_line: user.landlord_line || '',
        landlord_address: user.landlord_address || ''
      });
      setJuristicData({
        juristic_name: user.juristic_name || '',
        juristic_email: user.juristic_email || '',
        juristic_phone: user.juristic_phone || '',
        juristic_line: user.juristic_line || ''
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

    setSubscribing(prev => ({ ...prev, [planKey]: true }));
    try {
      const response = await base44.functions.invoke('createCheckout', {
        priceId: priceId,
        mode: 'subscription',
      });
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      const language = user?.language || 'en';
      alert(language === 'th' ? 'ไม่สามารถสร้างการสมัครได้ กรุณาลองอีกครั้ง' : 'Failed to start subscription. Please try again.');
      setSubscribing(prev => ({ ...prev, [planKey]: false }));
    }
  };

  const handleBuyCredits = async (pkg) => {
    setBuyingCredits(prev => ({ ...prev, [pkg.id]: true }));
    try {
      console.log('🔍 Sending to createCheckout:', { amount: pkg.price, packageId: pkg.id });
      
      const response = await base44.functions.invoke('createCheckout', {
        priceId: null,
        mode: 'payment',
        amount: pkg.price,
        currency: 'thb',
        description: `${pkg.credits} Letter Credits`,
        successUrl: `${window.location.origin}${createPageUrl('Account')}?payment=success`,
        cancelUrl: `${window.location.origin}${createPageUrl('Account')}?payment=cancelled`,
        metadata: {
          type: 'credits',
          credits: pkg.credits.toString(),
          packageId: pkg.id
        }
      });
      
      if (response.data?.url) {
        // Open in SAME window - when they come back, credits will auto-refresh
        window.location.href = response.data.url; 
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);
      const language = user?.language || 'en';
      alert(language === 'th' ? 'ไม่สามารถสร้างการชำระเงินได้ กรุณาลองอีกครั้ง' : 'Failed to create checkout. Please try again.');
    } finally {
      setBuyingCredits(prev => ({ ...prev, [pkg.id]: false }));
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

  const handleCancelSubscription = async () => {
    const language = user?.language || 'en';
    if (!cancelReason) {
      alert(language === 'th' ? 'กรุณาเลือกเหตุผลในการยกเลิก' : 'Please select a reason for cancellation');
      return;
    }

    setCancelling(true);
    try {
      const response = await base44.functions.invoke('cancelSubscription', {
        reason: cancelReason,
        feedback: cancelFeedback
      });

      if (response.data?.success) {
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        setShowCancelDialog(false);
        setCancelReason('');
        setCancelFeedback('');
        alert(language === 'th' 
          ? 'การยกเลิกสำเร็จ คุณจะยังคงสามารถเข้าถึงฟีเจอร์ได้จนถึงวันที่ต่ออายุ' 
          : 'Cancellation successful. You\'ll keep access until your renewal date.');
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      alert(language === 'th' 
        ? 'ไม่สามารถยกเลิกได้ กรุณาลองอีกครั้งหรือติดต่อฝ่ายสนับสนุน' 
        : 'Failed to cancel. Please try again or contact support.');
    } finally {
      setCancelling(false);
    }
  };

  const handleLandlordUpdate = () => {
    updateProfileMutation.mutate(landlordData);
  };

  const handleJuristicUpdate = () => {
    updateProfileMutation.mutate(juristicData);
  };

  const generateLineOALink = (role) => {
    const baseUrl = 'https://line.me/R/ti/p/@leaseshield';
    const params = new URLSearchParams({
      user_id: user?.id || '',
      role: role
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const handleCopyLink = async (role) => {
    const link = generateLineOALink(role);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(role);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareLink = async (role) => {
    const language = user?.language || 'en';
    const link = generateLineOALink(role);
    const title = role === 'landlord' 
      ? (language === 'th' ? 'เชื่อมต่อกับ Lease Shield' : 'Connect to Lease Shield')
      : (language === 'th' ? 'เชื่อมต่อนิติบุคคลกับ Lease Shield' : 'Connect Juristic to Lease Shield');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: language === 'th' 
            ? 'คลิกเพื่อเพิ่มเพื่อน Lease Shield LINE Official Account' 
            : 'Click to add Lease Shield LINE Official Account',
          url: link
        });
      } catch (err) {
        console.error('Share failed:', err);
        handleCopyLink(role);
      }
    } else {
      handleCopyLink(role);
    }
  };

  const currentPlanTier = user?.plan_tier || 'free';
  const isFree = currentPlanTier === 'free';
  const language = user?.language || 'en';
  const currentTheme = user?.theme || 'dark'; // Default to 'dark' if user?.theme is undefined
  const isDarkMode = currentTheme === 'dark';

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
      notProvided: "Not provided",
      manageSubscription: "Manage Subscription",
      renewsOn: "Renews on",
      cancelPlan: "Change or Cancel Plan",
      cancelDialogTitle: "Cancel Your Subscription?",
      cancelDialogDesc: "We're sorry to see you go. Help us improve by telling us why you're leaving.",
      cancelReason: "Reason for Cancellation",
      selectReason: "Select a reason",
      reasonTooExpensive: "Too expensive",
      reasonNotUsingEnough: "Not using it enough",
      reasonFoundAlternative: "Found a better alternative",
      reasonMissingFeatures: "Missing features I need",
      reasonTechnicalIssues: "Technical issues",
      reasonOther: "Other",
      additionalFeedback: "Additional Feedback (Optional)",
      feedbackPlaceholder: "Help us understand what we could do better...",
      keepSubscription: "Keep My Subscription",
      confirmCancel: "Confirm Cancellation",
      cancelling: "Processing...",
      whatYoullLose: "What you'll lose",
      downgradeNote: "Your subscription will remain active until {date}. After that, you'll be downgraded to the Free plan.",
      scheduledCancellation: "Scheduled for Cancellation",
      cancelScheduledFor: "Cancels on",
      reactivate: "Reactivate Subscription",
      landlordInfo: "Landlord Information",
      landlordInfoDesc: "Store your landlord's contact details for quick notifications",
      landlordName: "Landlord Name",
      landlordEmail: "Landlord Email",
      landlordPhone: "Landlord Phone (WhatsApp)",
      landlordLine: "Landlord LINE ID",
      landlordAddress: "Landlord Address",
      juristicInfo: "Juristic Office Contact",
      juristicInfoDesc: "Store juristic office details for maintenance notifications",
      juristicName: "Contact Name",
      juristicEmail: "Email",
      juristicPhone: "Phone (WhatsApp)",
      juristicLine: "LINE ID",
      saveContactInfo: "Save Contact Info",
      connectLineOA: "Connect to LINE OA",
      connectLineOADesc: "Share this link to add them to Lease Shield notifications",
      copyLink: "Copy Link",
      shareLink: "Share Link",
      linkCopied: "Link Copied!",
      orManualEntry: "Or enter LINE ID manually",
      landlordLineConnect: "Connect Landlord to LINE",
      juristicLineConnect: "Connect Juristic to LINE",
      showQR: "Show QR Code",
      hideQR: "Hide QR Code",
      scanQR: "Scan this QR code with LINE app",
      buyCredits: "Buy Letter Credits",
      creditBalance: "Credit Balance",
      credits: "Credits",
      perCredit: "per credit",
      buyNow: "Buy Now",
      bestValue: "Best Value",
      creditPacks: "Credit Packs",
      oneLetterPerCredit: "1 letter = 1 credit",
      accessTemplateLibrary: "Access template library",
      bilingual: "Bilingual Templates",
      humanAndAiGeneration: "Human and AI generation",
      creditsNeverExpire: "Credits never expire",
      purchaseCredits: "Purchase Credits"
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
      notProvided: "ไม่ได้ระบุ",
      manageSubscription: "จัดการการสมัครสมาชิก",
      renewsOn: "ต่ออายุเมื่อ",
      cancelPlan: "เปลี่ยนแปลงหรือยกเลิกแผน",
      cancelDialogTitle: "ยกเลิกการสมัครสมาชิก?",
      cancelDialogDesc: "เราเสียใจที่เห็นคุณจากไป ช่วยบอกเราว่าทำไมคุณถึงออกไป",
      cancelReason: "เหตุผลในการยกเลิก",
      selectReason: "เลือกเหตุผล",
      reasonTooExpensive: "แพงเกินไป",
      reasonNotUsingEnough: "ไม่ได้ใช้บ่อยพอ",
      reasonFoundAlternative: "พบทางเลือกที่ดีกว่า",
      reasonMissingFeatures: "ขาดฟีเจอร์ที่ต้องการ",
      reasonTechnicalIssues: "มีปัญหาทางเทคนิค",
      reasonOther: "อื่นๆ",
      additionalFeedback: "ข้อเสนอแนะเพิ่มเติม (ไม่บังคับ)",
      feedbackPlaceholder: "ช่วยบอกเราว่าเราสามารถทำอะไรได้ดีขึ้น...",
      keepSubscription: "เก็บการสมัครสมาชิกของฉันไว้",
      confirmCancel: "ยืนยันการยกเลิก",
      cancelling: "กำลังดำเนินการ...",
      whatYoullLose: "สิ่งที่คุณจะเสีย",
      downgradeNote: "การสมัครสมาชิกของคุณจะยังคงใช้งานได้จนถึง {date} หลังจากนั้นคุณจะถูกเปลี่ยนเป็นแผนฟรี",
      scheduledCancellation: "กำหนดการยกเลิกแล้ว",
      cancelScheduledFor: "จะยกเลิกเมื่อ",
      reactivate: "เปิดใช้งานการสมัครสมาชิกอีกครั้ง",
      landlordInfo: "ข้อมูลเจ้าของบ้าน",
      landlordInfoDesc: "เก็บข้อมูลติดต่อเจ้าของบ้านเพื่อการแจ้งเตือนอย่างรวดเร็ว",
      landlordName: "ชื่อเจ้าของบ้าน",
      landlordEmail: "อีเมลเจ้าของบ้าน",
      landlordPhone: "โทรศัพท์เจ้าของบ้าน (WhatsApp)",
      landlordLine: "LINE ID เจ้าของบ้าน",
      landlordAddress: "ที่อยู่เจ้าของบ้าน",
      juristicInfo: "ข้อมูลนิติบุคคล",
      juristicInfoDesc: "เก็บข้อมูลนิติบุคคลเพื่อการแจ้งเตือนการซ่อมบำรุง",
      juristicName: "ชื่อผู้ติดต่อ",
      juristicEmail: "อีเมล",
      juristicPhone: "โทรศัพท์ (WhatsApp)",
      juristicLine: "LINE ID",
      saveContactInfo: "บันทึกข้อมูลติดต่อ",
      connectLineOA: "เชื่อมต่อกับ LINE OA",
      connectLineOADesc: "แชร์ลิงก์นี้เพื่อเพิ่มพวกเขาในการแจ้งเตือน Lease Shield",
      copyLink: "คัดลอกลิงก์",
      shareLink: "แชร์ลิงก์",
      linkCopied: "คัดลอกลิงก์แล้ว!",
      orManualEntry: "หรือใส่ LINE ID ด้วยตนเอง",
      landlordLineConnect: "เชื่อมต่อเจ้าของบ้านกับ LINE",
      juristicLineConnect: "เชื่อมต่อนิติบุคคลกับ LINE",
      showQR: "แสดง QR Code",
      hideQR: "ซ่อน QR Code",
      scanQR: "สแกน QR Code นี้ด้วยแอป LINE",
      buyCredits: "ซื้อเครดิตจดหมาย",
      creditBalance: "เครดิตคงเหลือ",
      credits: "เครดิต",
      perCredit: "ต่อเครดิต",
      buyNow: "ซื้อเลย",
      mostPopular: "ยอดนิยม",
      bestValue: "คุ้มที่สุด",
      creditPacks: "แพ็กเกจเครดิต",
      oneLetterPerCredit: "1 จดหมาย = 1 เครดิต",
      accessTemplateLibrary: "เข้าถึงคลังเทมเพลต",
      bilingual: "เทมเพลตสองภาษา",
      humanAndAiGeneration: "สร้างโดยมนุษย์และ AI",
      creditsNeverExpire: "เครดิตไม่หมดอายุ",
      purchaseCredits: "ซื้อเครดิต"
    }
  };

  const strings = t[language];
  const currentPlan = PLAN_DETAILS.find(p => p.key === currentPlanTier);
  const isScheduledForCancellation = user?.subscription_status === 'cancelled' && user?.plan_renews_at;

  // Updated LINE QR Code URL
  const lineQRCodeUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/81fb46470_M_gainfriends_2dbarcodes_GW.png";

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
                            color: currentTheme === 'light' ? '#FFFFFF' : colors.textPrimary,
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
                            color: currentTheme === 'dark' ? '#FFFFFF' : colors.textPrimary,
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

          {/* Current Plan Card with Manage Subscription */}
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
                  {isScheduledForCancellation && (
                    <div className="mt-2">
                      <Badge style={{
                        backgroundColor: isDarkMode ? '#EF444430' : '#FEE2E2',
                        color: '#EF4444',
                        border: isDarkMode ? '1px solid #EF444450' : '1px solid #FECACA',
                        padding: '6px 12px',
                        fontWeight: 'bold',
                        borderRadius: '6px'
                      }}>
                        {strings.scheduledCancellation}
                      </Badge>
                    </div>
                  )}
                </div>
                <p className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
                  {isFree ? strings.freePlanName : (PLAN_DETAILS.find(p => p.key === currentPlanTier)?.priceMonthly ? `฿${PLAN_DETAILS.find(p => p.key === currentPlanTier)?.priceMonthly}` : '—')}
                </p>
                {!isFree && user?.billing_interval && (
                  <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    {user.billing_interval === 'annual' ? strings.billedAnnually : strings.billedMonthly}
                  </p>
                )}
                {user?.plan_renews_at && (
                  <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                    {isScheduledForCancellation ? strings.cancelScheduledFor : strings.renewsOn} {new Date(user.plan_renews_at).toLocaleDateString()}
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
                      borderRadius: '88px',
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
                <div className="space-y-3">
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
                  
                  <button
                    onClick={() => setShowCancelDialog(true)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'transparent',
                      color: colors.textPrimary,
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      border: `2px solid ${colors.borderColor}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = colors.hoverBg;
                      e.target.style.borderColor = '#EF4444';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.borderColor = colors.borderColor;
                    }}
                  >
                    <Settings className="w-4 h-4" />
                    {strings.cancelPlan}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Landlord Information Card */}
        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader className="border-b pb-4" style={{
            backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED',
            borderBottomColor: colors.borderColor
          }}>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2 mb-1" style={{ color: colors.textPrimary }}>
                  <User className="w-5 h-5 text-ls-forest" />
                  {strings.landlordInfo}
                </CardTitle>
                <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.landlordInfoDesc}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* LINE OA Connection Section */}
            <div className="mb-6 p-4 rounded-xl border-2 border-dashed" style={{
              backgroundColor: isDarkMode ? '#2A2D30' : '#F0FDF4',
              borderColor: isDarkMode ? '#10B981' : '#86EFAC'
            }}>
              <div className="flex items-start gap-3 mb-3">
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#10B981',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold mb-1" style={{ color: colors.textPrimary }}>{strings.landlordLineConnect}</h4>
                  <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>{strings.connectLineOADesc}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCopyLink('landlord')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: copiedLink === 'landlord' ? '#10B981' : (isDarkMode ? '#353A3D' : '#FFFFFF'),
                        color: copiedLink === 'landlord' ? '#FFFFFF' : colors.textPrimary,
                        border: `2px solid ${copiedLink === 'landlord' ? '#10B981' : colors.borderColor}`,
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        if (copiedLink !== 'landlord') {
                          e.target.style.borderColor = '#10B981';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (copiedLink !== 'landlord') {
                          e.target.style.borderColor = colors.borderColor;
                        }
                      }}
                    >
                      {copiedLink === 'landlord' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          {strings.linkCopied}
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          {strings.copyLink}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleShareLink('landlord')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        border: '2px solid #10B981',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#059669';
                        e.target.style.borderColor = '#059669';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#10B981';
                        e.target.style.borderColor = '#10B981';
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                      {strings.shareLink}
                    </button>
                    <button
                      onClick={() => setShowQR({...showQR, landlord: !showQR.landlord})}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: isDarkMode ? '#353A3D' : '#FFFFFF',
                        color: '#10B981',
                        border: '2px solid #10B981',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#10B981';
                        e.target.style.color = '#FFFFFF';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#FFFFFF';
                        e.target.style.color = '#10B981';
                      }}
                    >
                      <QrCode className="w-4 h-4" />
                      {showQR.landlord ? strings.hideQR : strings.showQR}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* QR Code Display */}
              {showQR.landlord && (
                <div className="mt-4 p-4 rounded-lg text-center" style={{
                  backgroundColor: isDarkMode ? '#1A1D1F' : '#FFFFFF',
                  border: `2px solid ${colors.borderColor}`
                }}>
                  <p className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>
                    {strings.scanQR}
                  </p>
                  <img 
                    src={lineQRCodeUrl}
                    alt="LINE OA QR Code"
                    className="mx-auto"
                    style={{
                      width: '200px',
                      height: '200px',
                      borderRadius: '12px'
                    }}
                  />
                  <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                    Lease Shield Official Account
                  </p>
                </div>
              )}
            </div>

            <div className="mb-4 text-center">
              <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{strings.orManualEntry}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="landlord_name" style={{ color: colors.textPrimary }}>{strings.landlordName}</Label>
                <Input
                  id="landlord_name"
                  value={landlordData.landlord_name}
                  onChange={(e) => setLandlordData({...landlordData, landlord_name: e.target.value})}
                  placeholder={language === 'th' ? 'ชื่อเจ้าของบ้าน' : 'Landlord name'}
                  className="mt-2"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>
              <div>
                <Label htmlFor="landlord_email" style={{ color: colors.textPrimary }}>{strings.landlordEmail}</Label>
                <Input
                  id="landlord_email"
                  type="email"
                  value={landlordData.landlord_email}
                  onChange={(e) => setLandlordData({...landlordData, landlord_email: e.target.value})}
                  placeholder={language === 'th' ? 'landlord@example.com' : 'landlord@example.com'}
                  className="mt-2"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>
              <div>
                <Label htmlFor="landlord_phone" style={{ color: colors.textPrimary }}>{strings.landlordPhone}</Label>
                <Input
                  id="landlord_phone"
                  value={landlordData.landlord_phone}
                  onChange={(e) => setLandlordData({...landlordData, landlord_phone: e.target.value})}
                  placeholder="+66 XX XXX XXXX"
                  className="mt-2"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>
              <div>
                <Label htmlFor="landlord_line" style={{ color: colors.textPrimary }}>{strings.landlordLine}</Label>
                <Input
                  id="landlord_line"
                  value={landlordData.landlord_line}
                  onChange={(e) => setLandlordData({...landlordData, landlord_line: e.target.value})}
                  placeholder="@lineid"
                  className="mt-2"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="landlord_address" style={{ color: colors.textPrimary }}>{strings.landlordAddress}</Label>
                <Textarea
                  id="landlord_address"
                  value={landlordData.landlord_address}
                  onChange={(e) => setLandlordData({...landlordData, landlord_address: e.target.value})}
                  placeholder={language === 'th' ? 'ที่อยู่เจ้าของบ้าน' : 'Landlord address'}
                  className="mt-2"
                  rows={2}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleLandlordUpdate} className="bg-ls-forest hover:bg-ls-forest/90 text-white w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {strings.saveContactInfo}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Juristic Office Card */}
        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader className="border-b pb-4" style={{
            backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED',
            borderBottomColor: colors.borderColor
          }}>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2 mb-1" style={{ color: colors.textPrimary }}>
                  <Settings className="w-5 h-5 text-ls-gold" />
                  {strings.juristicInfo}
                </CardTitle>
                <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.juristicInfoDesc}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* LINE OA Connection Section */}
            <div className="mb-6 p-4 rounded-xl border-2 border-dashed" style={{
              backgroundColor: isDarkMode ? '#2A2D30' : '#FFFBEB',
              borderColor: isDarkMode ? '#F59E0B' : '#FDE047'
            }}>
              <div className="flex items-start gap-3 mb-3">
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#F59E0B',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold mb-1" style={{ color: colors.textPrimary }}>{strings.juristicLineConnect}</h4>
                  <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>{strings.connectLineOADesc}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCopyLink('juristic')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: copiedLink === 'juristic' ? '#F59E0B' : (isDarkMode ? '#353A3D' : '#FFFFFF'),
                        color: copiedLink === 'juristic' ? '#FFFFFF' : colors.textPrimary,
                        border: `2px solid ${copiedLink === 'juristic' ? '#F59E0B' : colors.borderColor}`,
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        if (copiedLink !== 'juristic') {
                          e.target.style.borderColor = '#F59E0B';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (copiedLink !== 'juristic') {
                          e.target.style.borderColor = colors.borderColor;
                        }
                      }}
                    >
                      {copiedLink === 'juristic' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          {strings.linkCopied}
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          {strings.copyLink}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleShareLink('juristic')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: '#F59E0B',
                        color: '#FFFFFF',
                        border: '2px solid #F59E0B',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#D97706';
                        e.target.style.borderColor = '#D97706';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#F59E0B';
                        e.target.style.borderColor = '#F59E0B';
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                      {strings.shareLink}
                    </button>
                    <button
                      onClick={() => setShowQR({...showQR, juristic: !showQR.juristic})}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: isDarkMode ? '#353A3D' : '#FFFFFF',
                        color: '#F59E0B',
                        border: '2px solid #F59E0B',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#F59E0B';
                        e.target.style.color = '#FFFFFF';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#FFFFFF';
                        e.target.style.color = '#F59E0B';
                      }}
                    >
                      <QrCode className="w-4 h-4" />
                      {showQR.juristic ? strings.hideQR : strings.showQR}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* QR Code Display */}
              {showQR.juristic && (
                <div className="mt-4 p-4 rounded-lg text-center" style={{
                  backgroundColor: isDarkMode ? '#1A1D1F' : '#FFFFFF',
                  border: `2px solid ${colors.borderColor}`
                }}>
                  <p className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>
                    {strings.scanQR}
                  </p>
                  <img 
                    src={lineQRCodeUrl}
                    alt="LINE OA QR Code"
                    className="mx-auto"
                    style={{
                      width: '200px',
                      height: '200px',
                      borderRadius: '12px'
                    }}
                  />
                  <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                    Lease Shield Official Account
                  </p>
                </div>
              )}
            </div>

            <div className="mb-4 text-center">
              <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{strings.orManualEntry}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="juristic_name" style={{ color: colors.textPrimary }}>{strings.juristicName}</Label>
                <Input
                  id="juristic_name"
                  value={juristicData.juristic_name}
                  onChange={(e) => setJuristicData({...juristicData, juristic_name: e.target.value})}
                  placeholder={language === 'th' ? 'ชื่อผู้ติดต่อ' : 'Contact name'}
                  className="mt-2"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>
              <div>
                <Label htmlFor="juristic_email" style={{ color: colors.textPrimary }}>{strings.juristicEmail}</Label>
                <Input
                  id="juristic_email"
                  type="email"
                  value={juristicData.juristic_email}
                  onChange={(e) => setJuristicData({...juristicData, juristic_email: e.target.value})}
                  placeholder={language === 'th' ? 'juristic@example.com' : 'juristic@example.com'}
                  className="mt-2"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>
              <div>
                <Label htmlFor="juristic_phone" style={{ color: colors.textPrimary }}>{strings.juristicPhone}</Label>
                <Input
                  id="juristic_phone"
                  value={juristicData.juristic_phone}
                  onChange={(e) => setJuristicData({...juristicData, juristic_phone: e.target.value})}
                  placeholder="+66 XX XXX XXXX"
                  className="mt-2"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>
              <div>
                <Label htmlFor="juristic_line" style={{ color: colors.textPrimary }}>{strings.juristicLine}</Label>
                <Input
                  id="juristic_line"
                  value={juristicData.juristic_line}
                  onChange={(e) => setJuristicData({...juristicData, juristic_line: e.target.value})}
                  placeholder="@lineid"
                  className="mt-2"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleJuristicUpdate} className="bg-ls-gold hover:bg-ls-gold/90 text-ls-charcoal w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {strings.saveContactInfo}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <NotificationSettings 
            user={user} 
            onUpdate={handleNotificationUpdate}
            colors={colors}
          />
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
                  <a
                    href="https://www.leaseshield.asia/legal#privacy" // Changed to direct URL
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '2px solid #0C3B2E',
                      backgroundColor: colors.cardBg,
                      color: '#0C3B2E',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      textDecoration: 'none', // Added for anchor tag
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'inline-block' // Added to make it behave like a block for styling
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
                  </a>
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: colors.fieldBg, // Changed to fieldBg for consistency with theme
                borderRadius: '12px',
                borderLeft: '4px solid #C7A338' // Changed to gold color
              }}>
                <div className="flex items-start gap-3 justify-between flex-wrap">
                  <div className="flex items-start gap-3">
                    <Download className="w-5 h-5 flex-shrink-0 mt-0.5 text-ls-gold" />
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
                      gap: '8px',
                      opacity: exporting ? 0.7 : 1
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
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {exporting ? strings.exporting : strings.export}
                  </button>
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#FEE2E2',
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

        {/* Cancel Subscription Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="sm:max-w-2xl" style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.borderColor,
            color: colors.textPrimary
          }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl" style={{ color: colors.textPrimary }}>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  {strings.cancelDialogTitle}
                  <p className="text-sm font-normal mt-1" style={{ color: colors.textSecondary }}>
                    {strings.cancelDialogDesc}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {currentPlan && (
                <div className="p-4 rounded-lg" style={{
                  backgroundColor: '#FEE2E2',
                  border: '2px solid #FECACA'
                }}>
                  <p className="font-semibold text-red-900 mb-3">{strings.whatYoullLose}:</p>
                  <ul className="space-y-2 text-sm text-red-800">
                    {currentPlan.benefits.filter(b => !b.startsWith('Everything')).map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cancelReason" style={{ color: colors.textPrimary }}>
                    {strings.cancelReason} <span className="text-red-500">*</span>
                  </Label>
                  <Select value={cancelReason} onValueChange={setCancelReason}>
                    <SelectTrigger style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}>
                      <SelectValue placeholder={strings.selectReason} />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: colors.cardBg, color: colors.textPrimary }}>
                      <SelectItem value="too_expensive">{strings.reasonTooExpensive}</SelectItem>
                      <SelectItem value="not_using">{strings.reasonNotUsingEnough}</SelectItem>
                      <SelectItem value="found_alternative">{strings.reasonFoundAlternative}</SelectItem>
                      <SelectItem value="missing_features">{strings.reasonMissingFeatures}</SelectItem>
                      <SelectItem value="technical_issues">{strings.reasonTechnicalIssues}</SelectItem>
                      <SelectItem value="other">{strings.reasonOther}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cancelFeedback" style={{ color: colors.textPrimary }}>
                    {strings.additionalFeedback}
                  </Label>
                  <Textarea
                    id="cancelFeedback"
                    value={cancelFeedback}
                    onChange={(e) => setCancelFeedback(e.target.value)}
                    placeholder={strings.feedbackPlaceholder}
                    rows={4}
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg" style={{
                backgroundColor: isDarkMode ? '#2A2D30' : '#F3F4F6',
                border: `1px solid ${colors.borderColor}`
              }}>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {strings.downgradeNote.replace('{date}', user?.plan_renews_at ? new Date(user.plan_renews_at).toLocaleDateString() : '')}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelDialog(false)}
                  disabled={cancelling}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    border: 'none',
                    backgroundColor: '#0C3B2E',
                    color: '#FFFFFF',
                    cursor: cancelling ? 'not-allowed' : 'pointer',
                    opacity: cancelling ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !cancelling && (e.target.style.backgroundColor = '#0a2f25')}
                  onMouseLeave={(e) => !cancelling && (e.target.style.backgroundColor = '#0C3B2E')}
                >
                  {strings.keepSubscription}
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling || !cancelReason}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    border: 'none',
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    cursor: (cancelling || !cancelReason) ? 'not-allowed' : 'pointer',
                    opacity: (cancelling || !cancelReason) ? 0.5 : 1,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => (!cancelling && cancelReason) && (e.target.style.backgroundColor = '#DC2626')}
                  onMouseLeave={(e) => (!cancelling && cancelReason) && (e.target.style.backgroundColor = '#EF4444')}
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {strings.cancelling}
                    </>
                  ) : (
                    strings.confirmCancel
                  )}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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

        {/* Removed Promo Code Input Section */}

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
          
          {/* Plans Grid - NEW LAYOUT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLAN_DETAILS.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = currentPlanTier === plan.key;
              const isFreeplan = plan.key === 'free';
              const isSecureTier = plan.key === 'secure';
              const isLiteTier = plan.key === 'lite';
              const displayPrice = isFreeplan ? 0 : (billingInterval === 'annual' ? plan.priceAnnual : plan.priceMonthly);
              const displayInterval = isFreeplan ? '' : (billingInterval === 'annual' ? plan.intervalAnnual : plan.intervalMonthly);
              const effectiveMonthly = billingInterval === 'annual' ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly;
              const isSubscribing = subscribing[plan.key]; // ✅ Check if THIS plan is subscribing
              
              return (
                <div
                  key={plan.key}
                  className={`relative border-2 transition-all duration-200 ${
                    plan.popular ? 'border-amber-400 shadow-lg' : ''
                  } ${isSecureTier ? 'shadow-xl' : ''}`}
                  style={{
                    backgroundColor: isSecureTier 
                      ? (isDarkMode ? '#1A2E27' : '#F0FDF4')
                      : isLiteTier
                        ? (isDarkMode ? '#1C2D28' : '#F0FDF9')
                        : plan.popular 
                          ? (isDarkMode ? '#2D2520' : '#FFFBEB')
                          : colors.cardBg,
                    borderColor: isSecureTier ? '#0C3B2E' : isLiteTier ? '#047857' : plan.popular ? '#C7A338' : colors.borderColor,
                    borderWidth: isSecureTier ? '3px' : '2px',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '520px'
                  }}
                >
                  {/* Badge Area - Fixed Height */}
                  <div style={{ height: '24px', marginBottom: '12px' }}>
                    {plan.popular && (
                      <Badge className="bg-amber-500 text-white text-xs font-bold w-full justify-center whitespace-nowrap" style={{ padding: '4px 8px' }}>
                        ⭐ {strings.mostPopular}
                      </Badge>
                    )}
                    {billingInterval === 'annual' && !isFreeplan && !plan.popular && !isSecureTier && (
                      <Badge className="bg-emerald-500 text-white text-xs font-bold w-full justify-center whitespace-nowrap" style={{ padding: '4px 8px' }}>
                        🏷️ {strings.monthsFree}
                      </Badge>
                    )}
                    {isSecureTier && (
                      <Badge className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white text-xs font-bold w-full justify-center whitespace-nowrap" style={{ padding: '4px 8px' }}>
                        👑 {language === 'th' ? 'พรีเมียม' : 'PREMIUM'}
                      </Badge>
                    )}
                  </div>

                  {/* Plan Name & Icon - Fixed Height */}
                  <div className="text-center" style={{ height: '80px', marginBottom: '12px' }}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: isSecureTier ? '#0C3B2E' : isLiteTier ? '#047857' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon className="w-6 h-6" style={{ color: (isSecureTier || isLiteTier) ? '#FFFFFF' : plan.bgColor }} />
                      </div>
                      <h3 className="text-xl font-bold" style={{ color: isSecureTier ? '#0C3B2E' : colors.textPrimary }}>
                        {plan.label}
                      </h3>
                    </div>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price Section - Fixed Height */}
                  <div className="text-center" style={{ height: '100px', marginBottom: '12px' }}>
                    {isFreeplan ? (
                      <div className="text-3xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                        {strings.freePlanName}
                      </div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold mb-1" style={{ color: isSecureTier ? '#0C3B2E' : '#C7A338' }}>
                          ฿{displayPrice.toLocaleString()}
                        </div>
                        <div className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                          {displayInterval}
                        </div>
                      </>
                    )}
                    <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {billingInterval === 'annual' && !isFreeplan && (
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          ฿{effectiveMonthly}{strings.perMonth}
                        </p>
                      )}
                      {isFreeplan && (
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {strings.noCreditCard}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Benefits List - Flexible Height - SHOW ALL */}
                  <div style={{ flex: 1, marginBottom: '12px' }}>
                    <ul className="space-y-2">
                      {plan.benefits.map((benefit, idx) => {
                        const isBold = benefit.startsWith('Everything in');
                        return (
                          <li key={idx} className="flex items-start gap-2 text-xs" style={{ color: colors.textPrimary }}>
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: isSecureTier ? '#0C3B2E' : '#0C3B2E' }} />
                            <span style={{ fontWeight: isBold ? 'bold' : 'normal' }}>{benefit}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Button - Fixed at Bottom */}
                  <div className="mt-auto">
                    {isCurrentPlan ? (
                      <Button
                        disabled
                        className="w-full h-10 text-sm"
                        style={{
                          backgroundColor: colors.fieldBg,
                          color: colors.textSecondary,
                          cursor: 'not-allowed',
                          border: `2px solid ${colors.borderColor}`
                        }}
                      >
                        {strings.currentPlanBadge}
                      </Button>
                    ) : isFreeplan ? (
                      <Button
                        disabled
                        className="w-full h-10 text-sm"
                        style={{
                          backgroundColor: colors.cardBg,
                          color: colors.textSecondary,
                          cursor: 'not-allowed',
                          border: `2px solid ${colors.textSecondary}`
                        }}
                      >
                        {strings.signupFree}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSubscribe(plan.key, billingInterval)}
                        disabled={isSubscribing} // ✅ Only check THIS plan's state
                        className="w-full h-10"
                        style={{
                          backgroundColor: isSubscribing ? '#9CA3AF' : (isSecureTier ? '#0C3B2E' : isLiteTier ? '#047857' : plan.popular ? '#C7A338' : '#0C3B2E'),
                          color: '#FFFFFF',
                          cursor: isSubscribing ? 'not-allowed' : 'pointer',
                          opacity: isSubscribing ? 0.7 : 1,
                          fontSize: isSecureTier ? '15px' : '14px',
                          fontWeight: isSecureTier ? '700' : '600'
                        }}
                      >
                        {isSubscribing ? strings.processing : `${strings.startPlan} ${plan.label}`}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Letter Credits Section */}
        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
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
                  {user?.letter_credits || 0}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Benefits - UPDATED ALIGNMENT */}
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

            {/* Credit Packages - ALIGNED LAYOUT WITH DIRECT STRIPE LINKS */}
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
                      borderColor: pkg.popular ? '#C7A338' : colors.borderColor,
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

                    {/* Button - Fixed at Bottom - UPDATED */}
                    <div className="mt-auto">
                      <button
                        onClick={() => handleBuyCredits(pkg)}
                        disabled={buyingCredits[pkg.id]} // Check THIS package's loading state
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

        {/* Logout Button */}
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
