import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Globe, Shield, LogOut, Save, Edit2, X, Settings, CheckCircle2, Download, FileText, AlertCircle, Loader2, MessageCircle, HelpCircle, XCircle, Copy, Share2, Coins, Crown, Zap, Lock, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PlanBadge } from "../components/shared/FeatureGate";
import NotificationPreferences from "../components/settings/NotificationPreferences";
import NotificationAnalytics from "../components/dashboard/NotificationAnalytics";
import LineConnectionStatus from "../components/shared/LineConnectionStatus";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { haptic } from "../components/shared/HapticFeedback";

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
    tagline: { en: 'Try Before You Commit', th: 'ทดลองก่อนตัดสินใจ', zh: '先试后决定', ja: 'コミット前にお試し', ko: '약정 전에 시도' },
    description: { en: 'Experience our automated lease analysis', th: 'สัมผัสการวิเคราะห์สัญญาเช่าอัตโนมัติ', zh: '体验我们的自动租约分析', ja: '自動賃貸契約分析を体験', ko: '자동 임대 계약 분석 체험' },
    benefits: {
      en: ['1 Lease Scan (lifetime)', 'Basic Risk Score Preview', '3 Files (100MB storage)', 'Read-only Deposit Tracker', 'Basic Maintenance Tracker'],
      th: ['1 การสแกนสัญญาเช่า (ตลอดชีพ)', 'ดูคะแนนความเสี่ยงเบื้องต้น', '3 ไฟล์ (พื้นที่ 100MB)', 'ติดตามเงินมัดจำแบบอ่านอย่างเดียว', 'ติดตามการซ่อมบำรุงเบื้องต้น'],
      zh: ['1次租约扫描（终身）', '基本风险评分预览', '3个文件（100MB存储）', '只读押金追踪器', '基本维护追踪器'],
      ja: ['1回の賃貸契約スキャン（生涯）', '基本リスクスコアプレビュー', '3ファイル（100MBストレージ）', '読み取り専用敷金トラッカー', '基本メンテナンストラッカー'],
      ko: ['1회 임대 계약 스캔（평생）', '기본 위험 점수 미리보기', '3개 파일（100MB 저장소）', '읽기 전용 보증금 추적기', '기본 유지보수 추적기']
    },
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
    tagline: { en: 'Essential Protection', th: 'การป้องกันที่จำเป็น', zh: '基本保护', ja: '基本的な保護', ko: '필수 보호' },
    description: { en: 'Core prevention tools for individuals', th: 'เครื่องมือป้องกันหลักสำหรับบุคคล', zh: '个人核心预防工具', ja: '個人向けコア予防ツール', ko: '개인을 위한 핵심 예방 도구' },
    benefits: {
      en: ['Everything in Free', '6 Lease Scans per annum', '5 Risks Reported', 'Email Notifications', '3 Letter Credits', '1GB Document Storage', 'Maintenance Tracker', 'Deposit Tracker'],
      th: ['ทุกอย่างในแผน Free', '6 การสแกนสัญญาต่อปี', 'รายงานความเสี่ยง 5 จุด', 'การแจ้งเตือนทางอีเมล', 'เครดิตจดหมาย 3 ใบ', 'พื้นที่จัดเก็บ 1GB', 'ติดตามการซ่อมบำรุง', 'ติดตามเงินมัดจำ'],
      zh: ['Free计划中的所有内容', '每年6次租约扫描', '报告5个风险', '电子邮件通知', '3个信件积分', '1GB文档存储', '维护追踪器', '押金追踪器'],
      ja: ['Freeのすべて', '年間6回の賃貸契約スキャン', '5つのリスク報告', 'メール通知', '3レタークレジット', '1GBドキュメントストレージ', 'メンテナンストラッカー', '敷金トラッカー'],
      ko: ['Free 플랜의 모든 것', '연간 6회 임대 계약 스캔', '5개 위험 보고', '이메일 알림', '3개 편지 크레딧', '1GB 문서 저장소', '유지보수 추적기', '보증금 추적기']
    },
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
    tagline: { en: 'Complete Prevention Suite', th: 'ชุดป้องกันครบครัน', zh: '完整预防套件', ja: '完全な予防スイート', ko: '완전한 예방 제품군' },
    description: { en: 'Everything you need for full protection', th: 'ทุกสิ่งที่คุณต้องการสำหรับการป้องกันแบบเต็มรูปแบบ', zh: '全面保护所需的一切', ja: '完全な保護に必要なすべて', ko: '완전한 보호에 필요한 모든 것' },
    benefits: {
      en: ['Everything in Lite', '12 Lease Scans per annum', 'Full Risk Reports', 'LINE Notifications', '5 Letter Credits', '5GB Document Storage', 'Rent Payment Alerts', 'Automated Reminders', 'Deposit Shield Automation'],
      th: ['ทุกอย่างในแผน Lite', '12 การสแกนสัญญาต่อปี', 'รายงานความเสี่ยงฉบับเต็ม', 'การแจ้งเตือนทาง LINE', 'เครดิตจดหมาย 5 ใบ', 'พื้นที่จัดเก็บ 5GB', 'แจ้งเตือนการชำระค่าเช่า', 'การแจ้งเตือนอัตโนมัติ', 'ระบบอัตโนมัติป้องกันเงินมัดจำ'],
      zh: ['Lite计划中的所有内容', '每年12次租约扫描', '完整风险报告', 'LINE通知', '5个信件积分', '5GB文档存储', '租金支付提醒', '自动提醒', '押金保护自动化'],
      ja: ['Liteのすべて', '年間12回の賃貸契約スキャン', '完全なリスクレポート', 'LINE通知', '5レタークレジット', '5GBドキュメントストレージ', '家賃支払いアラート', '自動リマインダー', '敷金保護の自動化'],
      ko: ['Lite 플랜의 모든 것', '연간 12회 임대 계약 스캔', '전체 위험 보고서', 'LINE 알림', '5개 편지 크레딧', '5GB 문서 저장소', '임대료 지불 알림', '자동 알림', '보증금 보호 자동화']
    },
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
    tagline: { en: 'Premium Protection', th: 'การป้องกันระดับพรีเมียม', zh: '高级保护', ja: 'プレミアム保護', ko: '프리미엄 보호' },
    description: { en: 'Maximum prevention with priority support', th: 'การป้องกันสูงสุดพร้อมการสนับสนุนลำดับความสำคัญ', zh: '最大预防与优先支持', ja: '優先サポート付き最大予防', ko: '우선 지원이 포함된 최대 예방' },
    benefits: {
      en: ['Everything in Protect', 'Unlimited Lease Scans', 'Advanced Reminders', '10 Letter Credits', '20GB Document Storage', 'Deposit Tracker', 'Priority Case Queue', 'Priority Scanning', 'Premium Support'],
      th: ['ทุกอย่างในแผน Protect', 'สแกนสัญญาได้ไม่จำกัด', 'การแจ้งเตือนขั้นสูง', 'เครดิตจดหมาย 10 ใบ', 'พื้นที่จัดเก็บ 20GB', 'ติดตามเงินมัดจำ', 'คิวคดีลำดับความสำคัญ', 'สแกนลำดับความสำคัญ', 'การสนับสนุนพรีเมียม'],
      zh: ['Protect计划中的所有内容', '无限制租约扫描', '高级提醒', '10个信件积分', '20GB文档存储', '押金追踪器', '优先案件队列', '优先扫描', '高级支持'],
      ja: ['Protectのすべて', '無制限の賃貸契約スキャン', '高度なリマインダー', '10レタークレジット', '20GBドキュメントストレージ', '敷金トラッカー', '優先ケースキュー', '優先スキャン', 'プレミアムサポート'],
      ko: ['Protect 플랜의 모든 것', '무제한 임대 계약 스캔', '고급 알림', '10개 편지 크레딧', '20GB 문서 저장소', '보증금 추적기', '우선 케이스 대기열', '우선 스캔', '프리미엄 지원']
    },
    bgColor: '#1A1D1F',
    icon: Crown
  }
];

const CREDIT_PACKAGES = [
  { id: 'credits_1', credits: 1, price: 99, savings: 0 },
  { id: 'credits_3', credits: 3, price: 249, savings: 16, popular: false },
  { id: 'credits_5', credits: 5, price: 399, savings: 20, popular: true },
  { id: 'credits_10', credits: 10, price: 699, savings: 30, popular: false }
];

export default function Profile() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [subscribing, setSubscribing] = useState({});
  const [exporting, setExporting] = useState(false);
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelFeedback, setCancelFeedback] = useState('');
  const [copiedLink, setCopiedLink] = useState(null);
  const [buyingCredits, setBuyingCredits] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const subscriptionStatus = urlParams.get('subscription');
    
    if (paymentStatus === 'success' || subscriptionStatus === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      
      let pollCount = 0;
      const maxPolls = 12;
      
      const pollInterval = setInterval(() => {
        pollCount++;
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
        }
      }, 5000);
      
      return () => clearInterval(pollInterval);
    }
  }, [queryClient]);

  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#notifications') {
      setTimeout(() => {
        const notificationSection = document.getElementById('notification-analytics');
        if (notificationSection) {
          notificationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, []);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    country: user?.country || '',
    language: user?.language || 'en',
    theme: user?.theme || 'light',
    tenant_address: user?.tenant_address || '',
    tenant_city: user?.tenant_city || '',
    tenant_state: user?.tenant_state || '',
    tenant_zip: user?.tenant_zip || ''
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
        theme: user.theme || 'light',
        tenant_address: user.tenant_address || '',
        tenant_city: user.tenant_city || '',
        tenant_state: user.tenant_state || '',
        tenant_zip: user.tenant_zip || ''
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
    haptic.medium();
    updateProfileMutation.mutate(formData);
  };

  const handleNotificationUpdate = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handleThemeToggle = (newTheme) => {
    haptic.light();
    setFormData({...formData, theme: newTheme});
    updateProfileMutation.mutate({ theme: newTheme });
  };

  const handleSubscribe = async (planKey, interval) => {
    const plan = PLAN_DETAILS.find(p => p.key === planKey);
    if (!plan) return;

    haptic.medium();

    const amount = interval === 'annual' ? plan.priceAnnual : plan.priceMonthly;
    const intervalType = interval === 'annual' ? 'year' : 'month';

    setSubscribing(prev => ({ ...prev, [planKey]: true }));
    try {
      const response = await base44.functions.invoke('createCheckout', {
        mode: 'subscription',
        amount: amount,
        currency: 'thb',
        description: `Lease Shield ${plan.label} - ${interval === 'annual' ? 'Annual' : 'Monthly'}`,
        successUrl: `${window.location.origin}${createPageUrl('Profile')}?subscription=success`,
        cancelUrl: `${window.location.origin}${createPageUrl('Profile')}?subscription=cancelled`,
        metadata: {
          plan: planKey,
          interval: intervalType
        }
      });
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        haptic.error();
        throw new Error('No checkout URL returned from server');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      haptic.error();
      const lang = user?.language || 'en';
      const errorMsg = error.response?.data?.details || error.response?.data?.error || error.message;
      const failMsg = lang === 'zh' ? '无法启动订阅' : lang === 'ja' ? 'サブスクリプションを開始できません' : lang === 'ko' ? '구독을 시작할 수 없습니다' : lang === 'th' ? 'ไม่สามารถสร้างการสมัครได้' : 'Failed to start subscription';
      alert(`${failMsg}\n\n${errorMsg}`);
      
      setSubscribing(prev => ({ ...prev, [planKey]: false }));
    }
  };

  const handleBuyCredits = async (pkg) => {
    haptic.medium();
    setBuyingCredits(prev => ({ ...prev, [pkg.id]: true }));
    try {
      const response = await base44.functions.invoke('createCheckout', {
        priceId: null,
        mode: 'payment',
        amount: pkg.price,
        currency: 'thb',
        description: `${pkg.credits} Letter Credits`,
        successUrl: `${window.location.origin}${createPageUrl('Profile')}?payment=success`,
        cancelUrl: `${window.location.origin}${createPageUrl('Profile')}?payment=cancelled`,
        metadata: {
          type: 'credits',
          credits: pkg.credits.toString(),
          packageId: pkg.id
        }
      });
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);
      haptic.error();
      const lang = user?.language || 'en';
      const failMsg = lang === 'zh' ? '无法创建结账。请重试。' : lang === 'ja' ? 'チェックアウトの作成に失敗しました。再試行してください。' : lang === 'ko' ? '체크아웃 생성에 실패했습니다. 다시 시도하세요.' : lang === 'th' ? 'ไม่สามารถสร้างการชำระเงินได้ กรุณาลองอีกครั้ง' : 'Failed to create checkout. Please try again.';
      alert(failMsg);
    } finally {
      setBuyingCredits(prev => ({ ...prev, [pkg.id]: false }));
    }
  };

  const handleExportData = async () => {
    haptic.medium();
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportUserData');
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LeaseShield_Personal_Data_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      haptic.success();
    } catch (error) {
      console.error('Export failed:', error);
      haptic.error();
      alert('Failed to export data. Please try again or contact support.');
    } finally {
      setExporting(false);
    }
  };

  const handleCancelSubscription = async () => {
    const lang = user?.language || 'en';
    if (!cancelReason) {
      const selectMsg = lang === 'zh' ? '请选择取消原因' : lang === 'ja' ? 'キャンセル理由を選択してください' : lang === 'ko' ? '취소 이유를 선택하세요' : lang === 'th' ? 'กรุณาเลือกเหตุผลในการยกเลิก' : 'Please select a reason';
      alert(selectMsg);
      return;
    }

    haptic.medium();
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
        haptic.success();
        const successMsg = lang === 'zh' ? '取消成功。您将保留访问权限直到续订日期。' : lang === 'ja' ? 'キャンセルに成功しました。更新日までアクセスを維持できます。' : lang === 'ko' ? '취소 성공。갱신 날짜까지 액세스를 유지합니다。' : lang === 'th' ? 'การยกเลิกสำเร็จ คุณจะยังคงสามารถเข้าถึงฟีเจอร์ได้จนถึงวันที่ต่ออายุ' : 'Cancellation successful. You\'ll keep access until your renewal date.';
        alert(successMsg);
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      haptic.error();
      const failMsg = lang === 'zh' ? '取消失败。请重试或联系支持。' : lang === 'ja' ? 'キャンセルに失敗しました。再試行するかサポートに連絡してください。' : lang === 'ko' ? '취소 실패。다시 시도하거나 지원팀에 문의하세요。' : lang === 'th' ? 'ไม่สามารถยกเลิกได้ กรุณาลองอีกครั้งหรือติดต่อฝ่ายสนับสนุน' : 'Failed to cancel. Please try again or contact support.';
      alert(failMsg);
    } finally {
      setCancelling(false);
    }
  };

  const handleLandlordUpdate = () => {
    haptic.medium();
    updateProfileMutation.mutate(landlordData);
  };

  const handleJuristicUpdate = () => {
    haptic.medium();
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
    haptic.light();
    const link = generateLineOALink(role);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(role);
      haptic.success();
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      haptic.error();
    }
  };

  const handleShareLink = async (role) => {
    const link = generateLineOALink(role);
    const lang = user?.language || 'en';
    const title = role === 'landlord' 
      ? (lang === 'zh' ? '将房东连接到LINE' : lang === 'ja' ? '家主をLINEに接続' : lang === 'ko' ? '집주인을 LINE에 연결' : lang === 'th' ? 'เชื่อมต่อเจ้าของบ้านกับ LINE' : 'Connect Landlord to LINE')
      : (lang === 'zh' ? '将物业连接到LINE' : lang === 'ja' ? '管理事務所をLINEに接続' : lang === 'ko' ? '관리 사무소를 LINE에 연결' : lang === 'th' ? 'เชื่อมต่อนิติบุคคลกับ LINE' : 'Connect Juristic to LINE');
    
    if (navigator.share) {
      try {
        await navigator.share({ title: title, url: link });
      } catch (err) {
        handleCopyLink(role);
      }
    } else {
      handleCopyLink(role);
    }
  };

  const currentPlanTier = user?.plan_tier || 'free';
  const isFree = currentPlanTier === 'free';
  const language = user?.language || 'en';
  const currentTheme = user?.theme || 'light';
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
      pageTitle: "My Profile",
      pageSubtitle: "Manage your account settings",
      personalInfo: "Personal Information",
      editProfile: "Edit Profile",
      cancel: "Cancel",
      fullName: "Full Name",
      email: "Email",
      cannotChange: "Cannot be changed",
      phone: "Phone",
      phonePlaceholder: "+66 XX XXX XXXX",
      country: "Country",
      countryPlaceholder: "Thailand",
      language: "Language",
      theme: "Theme",
      lightMode: "Light Mode",
      darkMode: "Dark Mode",
      tenantAddress: "Your Address",
      tenantAddressPlaceholder: "Street address",
      tenantCity: "City",
      tenantCityPlaceholder: "Bangkok",
      tenantState: "State/Province",
      tenantStatePlaceholder: "Bangkok",
      tenantZip: "Postal Code",
      tenantZipPlaceholder: "10110",
      saveChanges: "Save Changes",
      saving: "Saving...",
      currentPlan: "Current Plan",
      renewsOn: "Renews on",
      viewPlans: "View Plans",
      logout: "Logout",
      notProvided: "Not provided",
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
      buyCredits: "Buy Letter Credits",
      creditBalance: "Credit Balance",
      credits: "Credits",
      perCredit: "per credit",
      buyNow: "Buy Now",
      bestValue: "Best Value",
      oneLetterPerCredit: "1 letter = 1 credit",
      accessTemplateLibrary: "Access template library",
      bilingual: "Bilingual Templates",
      humanAndAiGeneration: "Human and AI generation",
      creditsNeverExpire: "Credits never expire"
    },
    th: {
      pageTitle: "โปรไฟล์ของฉัน",
      pageSubtitle: "จัดการการตั้งค่าบัญชีของคุณ",
      personalInfo: "ข้อมูลส่วนตัว",
      editProfile: "แก้ไขโปรไฟล์",
      cancel: "ยกเลิก",
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
      tenantAddress: "ที่อยู่ของคุณ",
      tenantAddressPlaceholder: "ที่อยู่",
      tenantCity: "เมือง",
      tenantCityPlaceholder: "กรุงเทพฯ",
      tenantState: "จังหวัด",
      tenantStatePlaceholder: "กรุงเทพฯ",
      tenantZip: "รหัสไปรษณีย์",
      tenantZipPlaceholder: "10110",
      saveChanges: "บันทึกการเปลี่ยนแปลง",
      saving: "กำลังบันทึก...",
      currentPlan: "แผนปัจจุบัน",
      renewsOn: "ต่ออายุเมื่อ",
      viewPlans: "ดูแผน",
      logout: "ออกจากระบบ",
      notProvided: "ไม่ได้ระบุ",
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
      buyCredits: "ซื้อเครดิตจดหมาย",
      creditBalance: "เครดิตคงเหลือ",
      credits: "เครดิต",
      perCredit: "ต่อเครดิต",
      buyNow: "ซื้อเลย",
      bestValue: "คุ้มที่สุด",
      oneLetterPerCredit: "1 จดหมาย = 1 เครดิต",
      accessTemplateLibrary: "เข้าถึงคลังเทมเพลต",
      bilingual: "เทมเพลตสองภาษา",
      humanAndAiGeneration: "สร้างโดยมนุษย์และ AI",
      creditsNeverExpire: "เครดิตไม่หมดอายุ"
    },
    zh: {
      pageTitle: "我的个人资料",
      pageSubtitle: "管理您的账户设置",
      personalInfo: "个人信息",
      editProfile: "编辑个人资料",
      cancel: "取消",
      fullName: "全名",
      email: "电子邮件",
      cannotChange: "无法更改",
      phone: "电话",
      phonePlaceholder: "+66 XX XXX XXXX",
      country: "国家",
      countryPlaceholder: "泰国",
      language: "语言",
      theme: "主题",
      lightMode: "浅色模式",
      darkMode: "深色模式",
      tenantAddress: "您的地址",
      tenantAddressPlaceholder: "街道地址",
      tenantCity: "城市",
      tenantCityPlaceholder: "曼谷",
      tenantState: "州/省",
      tenantStatePlaceholder: "曼谷",
      tenantZip: "邮政编码",
      tenantZipPlaceholder: "10110",
      saveChanges: "保存更改",
      saving: "保存中...",
      currentPlan: "当前计划",
      renewsOn: "续订日期",
      viewPlans: "查看计划",
      logout: "登出",
      notProvided: "未提供",
      landlordInfo: "房东信息",
      landlordInfoDesc: "存储房东的联系方式以便快速通知",
      landlordName: "房东姓名",
      landlordEmail: "房东电子邮件",
      landlordPhone: "房东电话（WhatsApp）",
      landlordLine: "房东LINE ID",
      landlordAddress: "房东地址",
      juristicInfo: "物业办公室联系方式",
      juristicInfoDesc: "存储物业办公室详细信息以接收维护通知",
      juristicName: "联系人姓名",
      juristicEmail: "电子邮件",
      juristicPhone: "电话（WhatsApp）",
      juristicLine: "LINE ID",
      saveContactInfo: "保存联系信息",
      connectLineOA: "连接到LINE OA",
      connectLineOADesc: "分享此链接以将他们添加到Lease Shield通知",
      copyLink: "复制链接",
      shareLink: "分享链接",
      linkCopied: "链接已复制！",
      orManualEntry: "或手动输入LINE ID",
      landlordLineConnect: "将房东连接到LINE",
      juristicLineConnect: "将物业连接到LINE",
      helpSupport: "帮助与支持",
      helpDesc: "需要帮助？提交请求，我们将通过电子邮件回复",
      submitRequest: "提交支持请求",
      submitDesc: "报告问题、提问或获取帮助",
      directEmail: "直接电子邮件",
      responseTime: "24-48小时内回复",
      dataPrivacy: "数据隐私与您的权利",
      privacyPolicy: "隐私政策",
      privacyDesc: "了解我们如何保护您的数据",
      viewPolicy: "查看政策",
      exportData: "导出我的数据",
      exportDesc: "下载您的所有个人数据（符合PDPA）",
      export: "导出",
      exporting: "导出中...",
      deleteAccount: "需要删除您的账户？",
      deleteDesc: "要根据PDPA行使您的删除权，请联系我们",
      deleteNote: "我们将在30天内安全删除您的所有数据。",
      preventionBannerTitle: "预防优先保护",
      preventionBannerSubtitle: "基于订阅的租约、押金和文档保护",
      preventionBannerText: "Lease Shield帮助您维护清晰、合法且基于证据的租赁关系。通过自动提醒、风险分析和专业模板，在问题发生前预防租赁问题。",
      monthly: "按月",
      annual: "按年",
      save17: "节省17%",
      choosePlan: "选择您的保护级别",
      planDesc: "所有计划都专注于预防和维护清晰的记录",
      mostPopular: "最受欢迎",
      monthsFree: "免费2个月",
      noCreditCard: "无需信用卡",
      perMonth: "/月",
      save: "节省",
      currentPlanBadge: "当前计划",
      signupFree: "注册获取免费",
      startPlan: "开始",
      processing: "处理中...",
      cancelPlan: "更改或取消计划",
      cancelDialogTitle: "取消您的订阅？",
      cancelDialogDesc: "很遗憾看到您离开。请告诉我们您离开的原因以帮助我们改进。",
      cancelReason: "取消原因",
      selectReason: "选择原因",
      reasonTooExpensive: "太贵了",
      reasonNotUsingEnough: "使用不够频繁",
      reasonFoundAlternative: "找到了更好的替代品",
      reasonMissingFeatures: "缺少我需要的功能",
      reasonTechnicalIssues: "技术问题",
      reasonOther: "其他",
      additionalFeedback: "其他反馈（可选）",
      feedbackPlaceholder: "帮助我们了解我们可以做得更好...",
      keepSubscription: "保留我的订阅",
      confirmCancel: "确认取消",
      cancelling: "处理中...",
      whatYoullLose: "您将失去的内容",
      downgradeNote: "您的订阅将保持活动状态直到{date}。之后，您将降级到免费计划。",
      buyCredits: "购买信件积分",
      creditBalance: "积分余额",
      credits: "积分",
      perCredit: "每积分",
      buyNow: "立即购买",
      bestValue: "最佳价值",
      oneLetterPerCredit: "1封信件 = 1积分",
      accessTemplateLibrary: "访问模板库",
      bilingual: "双语模板",
      humanAndAiGeneration: "人工和AI生成",
      creditsNeverExpire: "积分永不过期"
    },
    ja: {
      pageTitle: "マイプロフィール",
      pageSubtitle: "アカウント設定を管理",
      personalInfo: "個人情報",
      editProfile: "プロフィールを編集",
      cancel: "キャンセル",
      fullName: "フルネーム",
      email: "メールアドレス",
      cannotChange: "変更できません",
      phone: "電話番号",
      phonePlaceholder: "+66 XX XXX XXXX",
      country: "国",
      countryPlaceholder: "タイ",
      language: "言語",
      theme: "テーマ",
      lightMode: "ライトモード",
      darkMode: "ダークモード",
      tenantAddress: "あなたの住所",
      tenantAddressPlaceholder: "住所",
      tenantCity: "市",
      tenantCityPlaceholder: "バンコク",
      tenantState: "州/県",
      tenantStatePlaceholder: "バンコク",
      tenantZip: "郵便番号",
      tenantZipPlaceholder: "10110",
      saveChanges: "変更を保存",
      saving: "保存中...",
      currentPlan: "現在のプラン",
      renewsOn: "更新日",
      viewPlans: "プランを表示",
      logout: "ログアウト",
      notProvided: "未提供",
      landlordInfo: "家主情報",
      landlordInfoDesc: "迅速な通知のために家主の連絡先を保存",
      landlordName: "家主名",
      landlordEmail: "家主メール",
      landlordPhone: "家主電話（WhatsApp）",
      landlordLine: "家主LINE ID",
      landlordAddress: "家主住所",
      juristicInfo: "管理事務所連絡先",
      juristicInfoDesc: "メンテナンス通知用に管理事務所の詳細を保存",
      juristicName: "連絡先名",
      juristicEmail: "メール",
      juristicPhone: "電話（WhatsApp）",
      juristicLine: "LINE ID",
      saveContactInfo: "連絡先情報を保存",
      connectLineOA: "LINE OAに接続",
      connectLineOADesc: "このリンクを共有してLease Shield通知に追加",
      copyLink: "リンクをコピー",
      shareLink: "リンクを共有",
      linkCopied: "リンクをコピーしました！",
      orManualEntry: "またはLINE IDを手動入力",
      landlordLineConnect: "家主をLINEに接続",
      juristicLineConnect: "管理事務所をLINEに接続",
      helpSupport: "ヘルプとサポート",
      helpDesc: "サポートが必要ですか？リクエストを送信すると、メールで返信します",
      submitRequest: "サポートリクエストを送信",
      submitDesc: "問題を報告、質問、またはヘルプを取得",
      directEmail: "直接メール",
      responseTime: "24〜48時間以内に返信",
      dataPrivacy: "データプライバシーとあなたの権利",
      privacyPolicy: "プライバシーポリシー",
      privacyDesc: "データの保護方法を学ぶ",
      viewPolicy: "ポリシーを表示",
      exportData: "マイデータをエクスポート",
      exportDesc: "すべての個人データをダウンロード（PDPA準拠）",
      export: "エクスポート",
      exporting: "エクスポート中...",
      deleteAccount: "アカウントを削除する必要がありますか？",
      deleteDesc: "PDPAに基づく削除権を行使するには、お問い合わせください",
      deleteNote: "30日以内にすべてのデータを安全に削除します。",
      preventionBannerTitle: "予防第一の保護",
      preventionBannerSubtitle: "賃貸契約、敷金、文書のためのサブスクリプションベースの保護",
      preventionBannerText: "Lease Shieldは、明確で合法的かつ証拠に基づく賃貸関係の維持を支援します。自動アラート、リスク分析、プロフェッショナルテンプレートで賃貸問題を事前に防止します。",
      monthly: "月額",
      annual: "年額",
      save17: "17%節約",
      choosePlan: "保護レベルを選択",
      planDesc: "すべてのプランは予防と明確な記録の維持に焦点を当てています",
      mostPopular: "最も人気",
      monthsFree: "2ヶ月無料",
      noCreditCard: "クレジットカード不要",
      perMonth: "/月",
      save: "節約",
      currentPlanBadge: "現在のプラン",
      signupFree: "無料でサインアップ",
      startPlan: "開始",
      processing: "処理中...",
      cancelPlan: "プランを変更またはキャンセル",
      cancelDialogTitle: "サブスクリプションをキャンセルしますか？",
      cancelDialogDesc: "お別れするのは残念です。なぜ離れるのか教えてください。",
      cancelReason: "キャンセル理由",
      selectReason: "理由を選択",
      reasonTooExpensive: "高すぎる",
      reasonNotUsingEnough: "十分に使用していない",
      reasonFoundAlternative: "より良い代替品を見つけた",
      reasonMissingFeatures: "必要な機能がない",
      reasonTechnicalIssues: "技術的な問題",
      reasonOther: "その他",
      additionalFeedback: "追加のフィードバック（オプション）",
      feedbackPlaceholder: "改善できることを教えてください...",
      keepSubscription: "サブスクリプションを維持",
      confirmCancel: "キャンセルを確認",
      cancelling: "処理中...",
      whatYoullLose: "失うもの",
      downgradeNote: "サブスクリプションは{date}まで有効です。その後、無料プランにダウングレードされます。",
      buyCredits: "レタークレジットを購入",
      creditBalance: "クレジット残高",
      credits: "クレジット",
      perCredit: "クレジットあたり",
      buyNow: "今すぐ購入",
      bestValue: "最高の価値",
      oneLetterPerCredit: "1レター = 1クレジット",
      accessTemplateLibrary: "テンプレートライブラリにアクセス",
      bilingual: "バイリンガルテンプレート",
      humanAndAiGeneration: "人間とAIの生成",
      creditsNeverExpire: "クレジットは期限切れになりません"
    },
    ko: {
      pageTitle: "내 프로필",
      pageSubtitle: "계정 설정 관리",
      personalInfo: "개인 정보",
      editProfile: "프로필 편집",
      cancel: "취소",
      fullName: "전체 이름",
      email: "이메일",
      cannotChange: "변경할 수 없음",
      phone: "전화번호",
      phonePlaceholder: "+66 XX XXX XXXX",
      country: "국가",
      countryPlaceholder: "태국",
      language: "언어",
      theme: "테마",
      lightMode: "라이트 모드",
      darkMode: "다크 모드",
      tenantAddress: "귀하의 주소",
      tenantAddressPlaceholder: "도로명 주소",
      tenantCity: "도시",
      tenantCityPlaceholder: "방콕",
      tenantState: "주/도",
      tenantStatePlaceholder: "방콕",
      tenantZip: "우편번호",
      tenantZipPlaceholder: "10110",
      saveChanges: "변경 사항 저장",
      saving: "저장 중...",
      currentPlan: "현재 계획",
      renewsOn: "갱신 날짜",
      viewPlans: "계획 보기",
      logout: "로그아웃",
      notProvided: "제공되지 않음",
      landlordInfo: "집주인 정보",
      landlordInfoDesc: "빠른 알림을 위해 집주인의 연락처 저장",
      landlordName: "집주인 이름",
      landlordEmail: "집주인 이메일",
      landlordPhone: "집주인 전화（WhatsApp）",
      landlordLine: "집주인 LINE ID",
      landlordAddress: "집주인 주소",
      juristicInfo: "관리 사무소 연락처",
      juristicInfoDesc: "유지보수 알림을 위해 관리 사무소 세부 정보 저장",
      juristicName: "담당자 이름",
      juristicEmail: "이메일",
      juristicPhone: "전화（WhatsApp）",
      juristicLine: "LINE ID",
      saveContactInfo: "연락처 정보 저장",
      connectLineOA: "LINE OA에 연결",
      connectLineOADesc: "이 링크를 공유하여 Lease Shield 알림에 추가",
      copyLink: "링크 복사",
      shareLink: "링크 공유",
      linkCopied: "링크 복사됨！",
      orManualEntry: "또는 LINE ID를 수동으로 입력",
      landlordLineConnect: "집주인을 LINE에 연결",
      juristicLineConnect: "관리 사무소를 LINE에 연결",
      helpSupport: "도움말 및 지원",
      helpDesc: "도움이 필요하신가요? 요청을 제출하면 이메일로 답변드립니다",
      submitRequest: "지원 요청 제출",
      submitDesc: "문제 보고, 질문 또는 도움 받기",
      directEmail: "직접 이메일",
      responseTime: "24-48시간 내 응답",
      dataPrivacy: "데이터 프라이버시 및 귀하의 권리",
      privacyPolicy: "개인정보 보호정책",
      privacyDesc: "데이터 보호 방법 알아보기",
      viewPolicy: "정책 보기",
      exportData: "내 데이터 내보내기",
      exportDesc: "모든 개인 데이터 다운로드（PDPA 준수）",
      export: "내보내기",
      exporting: "내보내는 중...",
      deleteAccount: "계정을 삭제해야 합니까？",
      deleteDesc: "PDPA에 따른 삭제 권한을 행사하려면 문의하세요",
      deleteNote: "30일 이내에 모든 데이터를 안전하게 삭제합니다。",
      preventionBannerTitle: "예방 우선 보호",
      preventionBannerSubtitle: "임대 계약、보증금 및 문서에 대한 구독 기반 보호",
      preventionBannerText: "Lease Shield는 명확하고 합법적이며 증거 기반의 임대 관계를 유지하도록 돕습니다。자동 알림、위험 분석 및 전문 템플릿으로 임대 문제를 사전에 예방하세요。",
      monthly: "월간",
      annual: "연간",
      save17: "17% 절약",
      choosePlan: "보호 수준 선택",
      planDesc: "모든 플랜은 예방과 명확한 기록 유지에 중점을 둡니다",
      mostPopular: "가장 인기",
      monthsFree: "2개월 무료",
      noCreditCard: "신용카드 불필요",
      perMonth: "/월",
      save: "절약",
      currentPlanBadge: "현재 계획",
      signupFree: "무료로 가입",
      startPlan: "시작",
      processing: "처리 중...",
      cancelPlan: "플랜 변경 또는 취소",
      cancelDialogTitle: "구독을 취소하시겠습니까？",
      cancelDialogDesc: "떠나시는 것을 유감스럽게 생각합니다。개선을 위해 떠나는 이유를 알려주세요。",
      cancelReason: "취소 이유",
      selectReason: "이유 선택",
      reasonTooExpensive: "너무 비쌉니다",
      reasonNotUsingEnough: "충분히 사용하지 않음",
      reasonFoundAlternative: "더 나은 대안을 찾았습니다",
      reasonMissingFeatures: "필요한 기능이 없음",
      reasonTechnicalIssues: "기술적 문제",
      reasonOther: "기타",
      additionalFeedback: "추가 피드백（선택사항）",
      feedbackPlaceholder: "개선할 수 있는 부분을 알려주세요...",
      keepSubscription: "구독 유지",
      confirmCancel: "취소 확인",
      cancelling: "처리 중...",
      whatYoullLose: "잃게 될 것",
      downgradeNote: "구독은 {date}까지 활성 상태로 유지됩니다。그 후 무료 플랜으로 다운그레이드됩니다。",
      buyCredits: "레터 크레딧 구매",
      creditBalance: "크레딧 잔액",
      credits: "크레딧",
      perCredit: "크레딧당",
      buyNow: "지금 구매",
      bestValue: "최고 가치",
      oneLetterPerCredit: "1편지 = 1크레딧",
      accessTemplateLibrary: "템플릿 라이브러리 액세스",
      bilingual: "이중 언어 템플릿",
      humanAndAiGeneration: "인간 및 AI 생성",
      creditsNeverExpire: "크레딧은 만료되지 않습니다"
    }
  };

  const strings = (t && t[language] && typeof t[language] === 'object') ? t[language] : t.en;
  const currentPlan = PLAN_DETAILS.find(p => p.key === currentPlanTier);
  const isScheduledForCancellation = user?.subscription_status === 'cancelled' && user?.plan_renews_at;

  return (
    <div className="min-h-screen p-4 md:p-6 pb-32" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
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
          <Card className="lg:col-span-2 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
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
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                    <Edit2 className="w-4 h-4 mr-2" />
                    {strings.editProfile}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {!isEditing ? (
                <div className="space-y-3">
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
                        <Phone className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.phone}</p>
                        <p className="font-bold" style={{ color: colors.textPrimary }}>{user?.phone || strings.notProvided}</p>
                      </div>
                    </div>
                  </div>

                  {(user?.tenant_address || user?.tenant_city || user?.tenant_state || user?.tenant_zip) && (
                    <div style={{
                      padding: '16px',
                      backgroundColor: colors.fieldBg,
                      borderRadius: '12px',
                      borderLeft: '4px solid #C7A338'
                    }}>
                      <div className="flex items-start gap-3">
                        <div style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: '#C7A338',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.tenantAddress}</p>
                          <p className="font-bold" style={{ color: colors.textPrimary }}>
                            {user?.tenant_address && <span>{user.tenant_address}<br /></span>}
                            {user?.tenant_city && <span>{user.tenant_city}</span>}
                            {user?.tenant_state && <span>, {user.tenant_state}</span>}
                            {user?.tenant_zip && <span> {user.tenant_zip}</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

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
                          {user?.language === 'zh' ? '中文 (Chinese)' : user?.language === 'ja' ? '日本語 (Japanese)' : user?.language === 'ko' ? '한국어 (Korean)' : user?.language === 'th' ? 'ไทย (Thai)' : 'English'}
                        </p>
                      </div>
                    </div>
                  </div>

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
                          {language === 'zh' ? '浅' : language === 'ja' ? 'ライト' : language === 'ko' ? '라이트' : language === 'th' ? 'สว่าง' : 'Light'}
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
                          {language === 'zh' ? '深' : language === 'ja' ? 'ダーク' : language === 'ko' ? '다크' : language === 'th' ? 'มืด' : 'Dark'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="full_name" style={{ color: colors.textPrimary }}>{strings.fullName}</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="mt-2"
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                    />
                  </div>
                  <div>
                    <Label style={{ color: colors.textPrimary }}>{strings.email}</Label>
                    <div style={{
                      padding: '10px 12px',
                      backgroundColor: colors.fieldBg,
                      borderRadius: '8px',
                      border: `2px solid ${colors.borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '8px'
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
                  <div>
                    <Label htmlFor="phone" style={{ color: colors.textPrimary }}>{strings.phone}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder={strings.phonePlaceholder}
                      className="mt-2"
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant_address" style={{ color: colors.textPrimary }}>{strings.tenantAddress}</Label>
                    <Input
                      id="tenant_address"
                      value={formData.tenant_address}
                      onChange={(e) => setFormData({...formData, tenant_address: e.target.value})}
                      placeholder={strings.tenantAddressPlaceholder}
                      className="mt-2"
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="tenant_city" style={{ color: colors.textPrimary }}>{strings.tenantCity}</Label>
                      <Input
                        id="tenant_city"
                        value={formData.tenant_city}
                        onChange={(e) => setFormData({...formData, tenant_city: e.target.value})}
                        placeholder={strings.tenantCityPlaceholder}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tenant_state" style={{ color: colors.textPrimary }}>{strings.tenantState}</Label>
                      <Input
                        id="tenant_state"
                        value={formData.tenant_state}
                        onChange={(e) => setFormData({...formData, tenant_state: e.target.value})}
                        placeholder={strings.tenantStatePlaceholder}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tenant_zip" style={{ color: colors.textPrimary }}>{strings.tenantZip}</Label>
                      <Input
                        id="tenant_zip"
                        value={formData.tenant_zip}
                        onChange={(e) => setFormData({...formData, tenant_zip: e.target.value})}
                        placeholder={strings.tenantZipPlaceholder}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="country" style={{ color: colors.textPrimary }}>{strings.country}</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      placeholder={strings.countryPlaceholder}
                      className="mt-2"
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="language" style={{ color: colors.textPrimary }}>{strings.language}</Label>
                    <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                      <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: colors.cardBg }}>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="th">ไทย (Thai)</SelectItem>
                        <SelectItem value="zh">中文 (Chinese)</SelectItem>
                        <SelectItem value="ja">日本語 (Japanese)</SelectItem>
                        <SelectItem value="ko">한국어 (Korean)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-ls-forest hover:bg-ls-forest/90"
                      disabled={updateProfileMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateProfileMutation.isPending ? strings.saving : strings.saveChanges}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {strings.cancel}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl overflow-hidden" style={{ backgroundColor: colors.cardBg }}>
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
                        {language === 'zh' ? '计划取消' : language === 'ja' ? 'キャンセル予定' : language === 'ko' ? '취소 예정' : language === 'th' ? 'กำหนดการยกเลิกแล้ว' : 'Scheduled Cancellation'}
                      </Badge>
                    </div>
                  )}
                </div>
                <p className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
                  {isFree ? (language === 'zh' ? '免费' : language === 'ja' ? '無料' : language === 'ko' ? '무료' : language === 'th' ? 'ฟรี' : 'Free') : (currentPlan ? `฿${currentPlan.priceMonthly}` : '—')}
                </p>
                {!isFree && user?.billing_interval && (
                  <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    {user.billing_interval === 'annual' ? (language === 'zh' ? '按年计费' : language === 'ja' ? '年間請求' : language === 'ko' ? '연간 청구' : language === 'th' ? 'เรียกเก็บรายปี' : 'Billed annually') : (language === 'zh' ? '按月计费' : language === 'ja' ? '月額請求' : language === 'ko' ? '월간 청구' : language === 'th' ? 'เรียกเก็บรายเดือน' : 'Billed monthly')}
                  </p>
                )}
                {user?.plan_renews_at && (
                  <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                    {strings.renewsOn} {new Date(user.plan_renews_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              {isFree ? (
                <Button 
                  className="w-full bg-ls-gold hover:bg-ls-gold/90 text-ls-charcoal"
                  onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {strings.viewPlans}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {strings.cancelPlan}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <LineConnectionStatus user={user} colors={colors} />
        </div>

        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader className="border-b pb-4" style={{
            backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED',
            borderBottomColor: colors.borderColor
          }}>
            <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <User className="w-5 h-5 text-ls-forest" />
              {strings.landlordInfo}
            </CardTitle>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>{strings.landlordInfoDesc}</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6 p-4 rounded-xl border-2 border-dashed" style={{
              backgroundColor: isDarkMode ? '#2A2D30' : '#F0FDF4',
              borderColor: isDarkMode ? '#10B981' : '#86EFAC'
            }}>
              <div className="flex items-start gap-3 mb-3">
                <MessageCircle className="w-5 h-5 text-emerald-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-bold mb-1" style={{ color: colors.textPrimary }}>{strings.landlordLineConnect}</h4>
                  <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>{strings.connectLineOADesc}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopyLink('landlord')}>
                      {copiedLink === 'landlord' ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copiedLink === 'landlord' ? strings.linkCopied : strings.copyLink}
                    </Button>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleShareLink('landlord')}>
                      <Share2 className="w-4 h-4 mr-2" />
                      {strings.shareLink}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-center mb-4" style={{ color: colors.textSecondary }}>{strings.orManualEntry}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="landlord_name" style={{ color: colors.textPrimary }}>{strings.landlordName}</Label>
                <Input
                  id="landlord_name"
                  value={landlordData.landlord_name}
                  onChange={(e) => setLandlordData({...landlordData, landlord_name: e.target.value})}
                  className="mt-2"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
              </div>
              <div>
                <Label htmlFor="landlord_email" style={{ color: colors.textPrimary }}>{strings.landlordEmail}</Label>
                <Input
                  id="landlord_email"
                  type="email"
                  value={landlordData.landlord_email}
                  onChange={(e) => setLandlordData({...landlordData, landlord_email: e.target.value})}
                  className="mt-2"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
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
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
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
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="landlord_address" style={{ color: colors.textPrimary }}>{strings.landlordAddress}</Label>
                <Textarea
                  id="landlord_address"
                  value={landlordData.landlord_address}
                  onChange={(e) => setLandlordData({...landlordData, landlord_address: e.target.value})}
                  rows={2}
                  className="mt-2"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleLandlordUpdate} disabled={updateProfileMutation.isPending} className="bg-ls-forest hover:bg-ls-forest/90">
                <Save className="w-4 h-4 mr-2" />
                {updateProfileMutation.isPending ? strings.saving : strings.saveContactInfo}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader className="border-b pb-4" style={{
            backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED',
            borderBottomColor: colors.borderColor
          }}>
            <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Settings className="w-5 h-5 text-ls-gold" />
              {strings.juristicInfo}
            </CardTitle>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>{strings.juristicInfoDesc}</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6 p-4 rounded-xl border-2 border-dashed" style={{
              backgroundColor: isDarkMode ? '#2A2D30' : '#FFFBEB',
              borderColor: isDarkMode ? '#F59E0B' : '#FDE047'
            }}>
              <div className="flex items-start gap-3 mb-3">
                <MessageCircle className="w-5 h-5 text-amber-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-bold mb-1" style={{ color: colors.textPrimary }}>{strings.juristicLineConnect}</h4>
                  <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>{strings.connectLineOADesc}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopyLink('juristic')}>
                      {copiedLink === 'juristic' ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copiedLink === 'juristic' ? strings.linkCopied : strings.copyLink}
                    </Button>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => handleShareLink('juristic')}>
                      <Share2 className="w-4 h-4 mr-2" />
                      {strings.shareLink}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-center mb-4" style={{ color: colors.textSecondary }}>{strings.orManualEntry}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="juristic_name" style={{ color: colors.textPrimary }}>{strings.juristicName}</Label>
                <Input
                  id="juristic_name"
                  value={juristicData.juristic_name}
                  onChange={(e) => setJuristicData({...juristicData, juristic_name: e.target.value})}
                  className="mt-2"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
              </div>
              <div>
                <Label htmlFor="juristic_email" style={{ color: colors.textPrimary }}>{strings.juristicEmail}</Label>
                <Input
                  id="juristic_email"
                  type="email"
                  value={juristicData.juristic_email}
                  onChange={(e) => setJuristicData({...juristicData, juristic_email: e.target.value})}
                  className="mt-2"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
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
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
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
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleJuristicUpdate} disabled={updateProfileMutation.isPending} className="bg-ls-gold hover:bg-ls-gold/90 text-ls-charcoal">
                <Save className="w-4 h-4 mr-2" />
                {updateProfileMutation.isPending ? strings.saving : strings.saveContactInfo}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <NotificationPreferences 
            user={user} 
            onUpdate={handleNotificationUpdate}
            colors={colors}
          />
          <div id="notification-analytics">
            <NotificationAnalytics 
              language={language}
              colors={colors}
            />
          </div>
        </div>

        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader className="border-b" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED', borderBottomColor: colors.borderColor }}>
            <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <HelpCircle className="w-5 h-5 text-ls-forest" />
              {strings.helpSupport}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>{strings.helpDesc}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <Link to={createPageUrl("Support")}>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#0C3B2E',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  height: '100%'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0a2f25'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0C3B2E'}
                >
                  <MessageCircle className="w-6 h-6 text-white mb-2" />
                  <p className="font-bold text-white mb-1">{strings.submitRequest}</p>
                  <p className="text-sm text-white/80">{strings.submitDesc}</p>
                </div>
              </Link>
              <a href="mailto:support@leaseshield.asia" style={{
                padding: '20px',
                backgroundColor: colors.fieldBg,
                borderRadius: '12px',
                borderLeft: '4px solid #C7A338',
                textDecoration: 'none',
                display: 'block',
                transition: 'all 0.2s',
                height: '100%'
              }}>
                <Mail className="w-6 h-6 text-ls-gold mb-2" />
                <p className="font-bold mb-1" style={{ color: colors.textPrimary }}>{strings.directEmail}</p>
                <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>support@leaseshield.asia</p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>{strings.responseTime}</p>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader className="border-b" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED', borderBottomColor: colors.borderColor }}>
            <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Shield className="w-5 h-5 text-ls-forest" />
              {strings.dataPrivacy}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div style={{
              padding: '16px',
              backgroundColor: colors.fieldBg,
              borderRadius: '12px',
              borderLeft: '4px solid #0C3B2E'
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-ls-forest" />
                  <div>
                    <p className="font-semibold" style={{ color: colors.textPrimary }}>{strings.privacyPolicy}</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.privacyDesc}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer">
                    {strings.viewPolicy}
                  </a>
                </Button>
              </div>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: colors.fieldBg,
              borderRadius: '12px',
              borderLeft: '4px solid #C7A338'
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-ls-gold" />
                  <div>
                    <p className="font-semibold" style={{ color: colors.textPrimary }}>{strings.exportData}</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.exportDesc}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportData} disabled={exporting}>
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span className="ml-2">{exporting ? strings.exporting : strings.export}</span>
                </Button>
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
                  <p className="text-xs text-red-700">{strings.deleteNote}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div style={{
          background: 'linear-gradient(to right, #0C3B2E, #047857)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
        }}>
          <div className="text-center">
            <Shield className="w-12 h-12 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">{strings.preventionBannerTitle}</h2>
            <p className="text-white/90 text-lg mb-2">{strings.preventionBannerSubtitle}</p>
            <p className="text-white/80 text-sm max-w-2xl mx-auto">{strings.preventionBannerText}</p>
          </div>
        </div>

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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLAN_DETAILS.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = currentPlanTier === plan.key;
              const isFreeplan = plan.key === 'free';
              const displayPrice = isFreeplan ? 0 : (billingInterval === 'annual' ? plan.priceAnnual : plan.priceMonthly);
              const displayInterval = isFreeplan ? '' : (billingInterval === 'annual' ? (language === 'zh' ? '/年' : language === 'ja' ? '/年' : language === 'ko' ? '/년' : language === 'th' ? '/ปี' : '/year') : (language === 'zh' ? '/月' : language === 'ja' ? '/月' : language === 'ko' ? '/월' : language === 'th' ? '/เดือน' : '/month'));
              const isSubscribing = subscribing[plan.key];
              
              return (
                <Card key={plan.key} className={`border-2 ${plan.popular ? 'border-amber-400 shadow-lg' : ''}`} style={{
                  backgroundColor: plan.popular ? (isDarkMode ? '#2D2520' : '#FFFBEB') : colors.cardBg,
                  borderColor: plan.popular ? '#C7A338' : colors.borderColor,
                  padding: '16px'
                }}>
                  <div style={{ height: '24px', marginBottom: '12px' }}>
                    {plan.popular && (
                      <Badge className="bg-amber-500 text-white text-xs font-bold w-full justify-center">
                        ⭐ {strings.mostPopular}
                      </Badge>
                    )}
                    {billingInterval === 'annual' && !isFreeplan && !plan.popular && (
                      <Badge className="bg-emerald-500 text-white text-xs font-bold w-full justify-center">
                        🏷️ {strings.monthsFree}
                      </Badge>
                    )}
                  </div>
                  <div className="text-center mb-4">
                    <Icon className="w-8 h-8 mx-auto mb-2" style={{ color: plan.bgColor }} />
                    <h3 className="text-xl font-bold mb-1" style={{ color: colors.textPrimary }}>{plan.label}</h3>
                    <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>{plan.tagline[language] || plan.tagline.en}</p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>{plan.description[language] || plan.description.en}</p>
                  </div>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold" style={{ color: '#C7A338' }}>
                      {isFreeplan ? (language === 'zh' ? '免费' : language === 'ja' ? '無料' : language === 'ko' ? '무료' : language === 'th' ? 'ฟรี' : 'Free') : `฿${displayPrice.toLocaleString()}`}
                    </div>
                    {!isFreeplan && <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>{displayInterval}</div>}
                  </div>
                  <ul className="space-y-2 mb-4 flex-1">
                    {(plan.benefits[language] || plan.benefits.en || []).map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs" style={{ color: colors.textPrimary }}>
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5 text-ls-forest" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrentPlan ? (
                    <Button disabled className="w-full" style={{ backgroundColor: colors.fieldBg, color: colors.textSecondary }}>
                      {strings.currentPlanBadge}
                    </Button>
                  ) : isFreeplan ? (
                    <Button disabled className="w-full" variant="outline">
                      {strings.signupFree}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(plan.key, billingInterval)}
                      disabled={isSubscribing}
                      className="w-full"
                      style={{
                        backgroundColor: isSubscribing ? '#9CA3AF' : (plan.popular ? '#C7A338' : '#0C3B2E'),
                        color: '#FFFFFF'
                      }}
                    >
                      {isSubscribing ? strings.processing : `${strings.startPlan} ${plan.label}`}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold" style={{ color: colors.textPrimary }}>{strings.buyCredits}</CardTitle>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.oneLetterPerCredit}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{strings.creditBalance}</p>
                <p className="text-3xl font-bold" style={{ color: '#C7A338' }}>{user?.letter_credits || 0}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-xl" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFF7ED' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs" style={{ color: colors.textPrimary }}>{strings.accessTemplateLibrary}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs" style={{ color: colors.textPrimary }}>{strings.bilingual}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs" style={{ color: colors.textPrimary }}>{strings.humanAndAiGeneration}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs" style={{ color: colors.textPrimary }}>{strings.creditsNeverExpire}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CREDIT_PACKAGES.map((pkg) => (
                <Card key={pkg.id} className={`border-2 ${pkg.popular ? 'border-amber-400' : ''}`} style={{
                  backgroundColor: pkg.popular ? (isDarkMode ? '#2D2520' : '#FFFBEB') : colors.cardBg,
                  borderColor: pkg.popular ? '#C7A338' : colors.borderColor,
                  padding: '16px'
                }}>
                  {pkg.popular && (
                    <Badge className="bg-amber-500 text-white text-xs font-bold w-full justify-center mb-2">
                      ⭐ {strings.mostPopular}
                    </Badge>
                  )}
                  <div className="text-center mb-3">
                    <div className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{pkg.credits}</div>
                    <div className="text-xs" style={{ color: colors.textSecondary }}>{strings.credits}</div>
                  </div>
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold" style={{ color: '#C7A338' }}>฿{pkg.price}</div>
                    <div className="text-xs" style={{ color: colors.textSecondary }}>฿{Math.round(pkg.price / pkg.credits)} {strings.perCredit}</div>
                    {pkg.savings > 0 && (
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs mt-2">
                        {strings.save} {pkg.savings}%
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={() => handleBuyCredits(pkg)}
                    disabled={buyingCredits[pkg.id]}
                    className="w-full"
                    style={{
                      backgroundColor: buyingCredits[pkg.id] ? '#9CA3AF' : (pkg.popular ? '#C7A338' : '#0C3B2E'),
                      color: '#FFFFFF'
                    }}
                  >
                    {buyingCredits[pkg.id] ? strings.processing : strings.buyNow}
                  </Button>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3" style={{ color: colors.textPrimary }}>
                <XCircle className="w-6 h-6 text-red-600" />
                {strings.cancelDialogTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.cancelDialogDesc}</p>
              <div>
                <Label style={{ color: colors.textPrimary }}>{strings.cancelReason}</Label>
                <Select value={cancelReason} onValueChange={setCancelReason}>
                  <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
                    <SelectValue placeholder={strings.selectReason} />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: colors.cardBg }}>
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
                <Label style={{ color: colors.textPrimary }}>{strings.additionalFeedback}</Label>
                <Textarea
                  value={cancelFeedback}
                  onChange={(e) => setCancelFeedback(e.target.value)}
                  placeholder={strings.feedbackPlaceholder}
                  rows={4}
                  className="mt-2"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="flex-1">
                  {strings.keepSubscription}
                </Button>
                <Button onClick={handleCancelSubscription} disabled={cancelling || !cancelReason} className="flex-1 bg-red-600 hover:bg-red-700">
                  {cancelling ? strings.cancelling : strings.confirmCancel}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          onClick={() => base44.auth.logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {strings.logout}
        </Button>
      </div>
    </div>
  );
}