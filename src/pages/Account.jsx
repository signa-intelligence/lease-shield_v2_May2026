import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Globe, Shield, LogOut, Save, Crown, Settings, CheckCircle2, Bell, Zap, Lock, Download, FileText, AlertCircle, Loader2, Gift, Star, MessageCircle, HelpCircle, XCircle, Copy, Share2, Coins, TrendingUp, ChevronUp, ChevronDown, BarChart3, Database, Trash2, ArrowRight } from "lucide-react";
import { PlanBadge } from "../components/shared/FeatureGate";
import NotificationPreferences from "../components/settings/NotificationPreferences";

import { createPageUrl } from "@/utils";
import { Link, useLocation } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import LineConnectionStatus from "../components/shared/LineConnectionStatus";
import { haptic } from "../components/shared/HapticFeedback";
import PageHeader from "../components/shared/PageHeader";
import { ToastProvider, useToast } from "../components/shared/Toast";
import AuthGuard from "../components/shared/AuthGuard";
import ReferralCard from "../components/referral/ReferralCard";

// Centralized pricing config with real Stripe price IDs
const PRICING = {
  lite: {
    monthly: { amount: 190, priceId: "price_1SbtXQQwol6NhlUxKMIyoEbs" },
    annual: { amount: 1900, priceId: "price_1SbtXQQwol6NhlUxXqxUROyx" }
  },
  protect: {
    monthly: { amount: 390, priceId: "price_1SbtZ4Qwol6NhlUxxxUML4Un" },
    annual: { amount: 3900, priceId: "price_1SbtZ4Qwol6NhlUxUwsvYbkS" }
  },
  secure: {
    monthly: { amount: 990, priceId: "price_1SbtaWQwol6NhlUxJboFevsu" },
    annual: { amount: 9900, priceId: "price_1SbtaWQwol6NhlUxAfPLTDeE" }
  }
};

const PLAN_DETAILS = [
  {
    key: 'free',
    label: 'Explorer',
    priceMonthly: 0,
    priceAnnual: 0,
    savingsAnnual: 0,
    tagline: 'Explore Features',
    taglineTh: 'สำรวจฟีเจอร์',
    taglineRu: 'Изучите возможности',
    taglineZh: '探索功能',
    taglineJa: '機能を探索',
    taglineKo: '기능 탐색',
    description: 'Preview core features',
    descriptionTh: 'ดูฟีเจอร์หลักก่อน',
    descriptionRu: 'Предварительный просмотр функций',
    descriptionZh: '预览核心功能',
    descriptionJa: 'コア機能のプレビュー',
    descriptionKo: '핵심 기능 미리보기',
    benefits: [
      '1 Lease Scan (lifetime)',
      'Basic Risk Score Preview',
      '3 Files (100MB storage)',
      'Read-only Deposit Tracker',
      'Basic Maintenance Tracker'
    ],
    benefitsTh: [
      '1 การสแกนสัญญาเช่า (ตลอดชีพ)',
      'ดูคะแนนความเสี่ยงเบื้องต้น',
      '3 ไฟล์ (พื้นที่ 100MB)',
      'ติดตามเงินมัดจำแบบอ่านอย่างเดียว',
      'ติดตามการซ่อมบำรุงเบื้องต้น'
    ],
    benefitsRu: [
      '1 сканирование договора (навсегда)',
      'Базовый просмотр рисков',
      '3 файла (100MB хранилище)',
      'Отслеживание депозита (только чтение)',
      'Базовое отслеживание обслуживания'
    ],
    benefitsZh: [
      '1次租约扫描（终身）',
      '基本风险评分预览',
      '3个文件（100MB存储）',
      '只读押金追踪',
      '基本维护追踪'
    ],
    benefitsJa: [
      '1回のリーススキャン（生涯）',
      '基本リスクスコアプレビュー',
      '3ファイル（100MBストレージ）',
      '読み取り専用敷金トラッカー',
      '基本メンテナンストラッカー'
    ],
    benefitsKo: [
      '1회 임대 계약 스캔（평생）',
      '기본 위험 점수 미리보기',
      '3개 파일（100MB 저장소）',
      '읽기 전용 보증금 추적기',
      '기본 유지보수 추적기'
    ],
    bgColor: '#64748b',
    icon: Gift
  },
  {
    key: 'lite',
    label: 'Lite',
    priceMonthly: 190,
    priceAnnual: 1900,
    savingsAnnual: 380,
    tagline: 'Essential Protection',
    taglineTh: 'การป้องกันที่จำเป็น',
    taglineRu: 'Базовая защита',
    taglineZh: '基本保护',
    taglineJa: '必須保護',
    taglineKo: '필수 보호',
    description: 'Core prevention tools for individuals',
    descriptionTh: 'เครื่องมือป้องกันหลักสำหรับบุคคล',
    descriptionRu: 'Основные инструменты профилактики для частных арендаторов',
    descriptionZh: '个人核心预防工具',
    descriptionJa: '個人向けコア予防ツール',
    descriptionKo: '개인을 위한 핵심 예방 도구',
    benefits: [
      '6 Lease Scans per annum',
      '5 Risks Reported',
      'Email Notifications',
      '3 Letter Credits',
      '1GB Document Storage',
      'Maintenance Tracker',
      'Deposit Tracker'
    ],
    benefitsTh: [
      '6 การสแกนสัญญาต่อปี',
      'รายงานความเสี่ยง 5 จุด',
      'การแจ้งเตือนทางอีเมล',
      'เครดิตจดหมาย 3 ใบ',
      'พื้นที่จัดเก็บ 1GB',
      'ติดตามการซ่อมบำรุง',
      'ติดตามเงินมัดจำ'
    ],
    benefitsRu: [
      '6 сканирований договора в год',
      '5 выявленных рисков',
      'Уведомления по электронной почте',
      '3 кредита на письма',
      '1 ГБ хранилища документов',
      'Отслеживание обслуживания',
      'Отслеживание депозита'
    ],
    benefitsZh: [
      '每年6次租约扫描',
      '报告5个风险',
      '电子邮件通知',
      '3个信件积分',
      '1GB文档存储',
      '维护追踪器',
      '押金追踪器'
    ],
    benefitsJa: [
      '年6回のリーススキャン',
      '5つのリスク報告',
      'メール通知',
      '3つのレタークレジット',
      '1GBドキュメントストレージ',
      'メンテナンストラッカー',
      '敷金トラッカー'
    ],
    benefitsKo: [
      '연간 6회 임대 계약 스캔',
      '5개 위험 보고',
      '이메일 알림',
      '3개 레터 크레딧',
      '1GB 문서 저장소',
      '유지보수 추적기',
      '보증금 추적기'
    ],
    bgColor: '#0C3B2E',
    icon: Zap
  },
  {
    key: 'protect',
    label: 'Protect',
    priceMonthly: 390,
    priceAnnual: 3900,
    savingsAnnual: 780,
    tagline: 'Complete Prevention Suite',
    taglineTh: 'ชุดป้องกันครบครัน',
    taglineRu: 'Полный комплекс профилактической защиты',
    taglineZh: '完整预防套件',
    taglineJa: '完全な予防スイート',
    taglineKo: '완전한 예방 제품군',
    description: 'Everything you need for full protection',
    descriptionTh: 'ทุกสิ่งที่คุณต้องการสำหรับการป้องกันแบบเต็มรูปแบบ',
    descriptionRu: 'Все, что нужно для полной защиты',
    descriptionZh: '全面保护所需的一切',
    descriptionJa: '完全な保護に必要なすべて',
    descriptionKo: '완전한 보호에 필요한 모든 것',
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
    benefitsTh: [
      'ทุกอย่างในแผน Lite',
      '12 การสแกนสัญญาต่อปี',
      'รายงานความเสี่ยงฉบับเต็ม',
      'การแจ้งเตือนทาง LINE',
      'เครดิตจดหมาย 5 ใบ',
      'พื้นที่จัดเก็บ 5GB',
      'แจ้งเตือนการชำระค่าเช่า',
      'การแจ้งเตือนอัตโนมัติ',
      'ระบบอัตโนมัติป้องกันเงินมัดจำ'
    ],
    benefitsRu: [
      'Все из тарифа Lite',
      '12 сканирований договора в год',
      'Полные отчёты о рисках',
      'Уведомления в LINE',
      '5 кредитов на письма',
      '5 ГБ хранилища документов',
      'Напоминания об оплате аренды',
      'Автоматические напоминания',
      'Автоматизация защиты депозита'
    ],
    benefitsZh: [
      '包含Lite计划所有内容',
      '每年12次租约扫描',
      '完整风险报告',
      'LINE通知',
      '5个信件积分',
      '5GB文档存储',
      '租金支付提醒',
      '自动提醒',
      '押金保护自动化'
    ],
    benefitsJa: [
      'Liteの全て',
      '年12回のリーススキャン',
      '完全なリスクレポート',
      'LINE通知',
      '5つのレタークレジット',
      '5GBドキュメントストレージ',
      '家賃支払いアラート',
      '自動リマインダー',
      '敷金保護自動化'
    ],
    benefitsKo: [
      'Lite 플랜의 모든 내용',
      '연간 12회 임대 계약 스캔',
      '전체 위험 보고서',
      'LINE 알림',
      '5개 레터 크레딧',
      '5GB 문서 저장소',
      '임대료 납부 알림',
      '자동 알림',
      '보증금 보호 자동화'
    ],
    bgColor: '#C7A338',
    icon: Shield,
    popular: true
  },
  {
    key: 'secure',
    label: 'Secure',
    priceMonthly: 990,
    priceAnnual: 9900,
    savingsAnnual: 1980,
    tagline: 'Premium Protection',
    taglineTh: 'การป้องกันระดับพรีเมียม',
    taglineRu: 'Премиальная защита',
    taglineZh: '高级保护',
    taglineJa: 'プレミアム保護',
    taglineKo: '프리미엄 보호',
    description: 'Maximum prevention with priority support',
    descriptionTh: 'การป้องกันสูงสุดพร้อมการสนับสนุนลำดับความสำคัญ',
    descriptionRu: 'Максимальная профилактика с приоритетной поддержкой',
    descriptionZh: '最大程度预防与优先支持',
    descriptionJa: '優先サポート付き最大予防',
    descriptionKo: '우선 지원이 포함된 최대 예방',
    benefits: [
      'Everything in Protect',
      'Unlimited Lease Scans', '50 Letter Credits/month',
      '20GB Document Storage',
      'Deposit Tracker',
      'Priority Case Queue',
      'Priority Scanning',
      'Premium Support',
      '1 Resolve Case per year',
      'Unlimited FastTrack (no charge)'
    ],
    benefitsTh: [
      'ทุกอย่างในแผน Protect',
      'สแกนสัญญาได้ไม่จำกัด', '50 เครดิตจดหมาย/เดือน',
      'พื้นที่จัดเก็บ 20GB',
      'ติดตามเงินมัดจำ',
      'คิวคดีลำดับความสำคัญ',
      'สแกนลำดับความสำคัญ',
      'การสนับสนุนพรีเมียม',
      '1 คดี Resolve ต่อปี',
      'FastTrack ไม่จำกัด (ฟรี)'
    ],
    benefitsRu: [
      'Все из тарифа Protect',
      'Неограниченное количество сканирований договора', '50 кредитов писем/месяц',
      '20 ГБ хранилища документов',
      'Отслеживание депозита',
      'Приоритетная очередь по делам',
      'Приоритетное сканирование',
      'Премиальная поддержка',
      '1 дело Resolve в год',
      'Безлимитный FastTrack (бесплатно)'
    ],
    benefitsZh: [
      '包含Protect计划所有内容',
      '无限次租约扫描', '每月50个信件积分',
      '20GB文档存储',
      '押金追踪器',
      '优先案件队列',
      '优先扫描',
      '高级支持',
      '每年1个Resolve案件',
      '无限FastTrack（免费）'
    ],
    benefitsJa: [
      'Protectの全て',
      '無制限のリーススキャン', '月50レタークレジット',
      '20GBドキュメントストレージ',
      '敷金トラッカー',
      '優先ケースキュー',
      '優先スキャン',
      'プレミアムサポート',
      '年1件のResolveケース',
      '無制限FastTrack（無料）'
    ],
    benefitsKo: [
      'Protect 플랜의 모든 내용',
      '무제한 임대 계약 스캔', '월 50개 레터 크레딧',
      '20GB 문서 저장소',
      '보증금 추적기',
      '우선 사례 대기열',
      '우선 스캔',
      '프리미엄 지원',
      '연간 1건 Resolve 케이스',
      '무제한 FastTrack（무료）'
    ],
    bgColor: '#1A1D1F',
    icon: Crown
  }
];

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

function AccountContent() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [subscribing, setSubscribing] = useState({});
  const [exporting, setExporting] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [copiedLink, setCopiedLink] = useState(null);
  const [buyingCredits, setBuyingCredits] = useState({});
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedInterval, setSelectedInterval] = useState('monthly');
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [expandedNotifPrefs, setExpandedNotifPrefs] = useState(false); // New state for Notification Preferences expansion

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState('');
  const [confirmDeleteUnderstand, setConfirmDeleteUnderstand] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const plansSectionRef = React.useRef(null);

  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
    cacheTime: 0,
  });

  // Generate referral code on first load if missing
  React.useEffect(() => {
    if (user && !user.referral_code) {
      base44.functions.invoke('generateReferralCode')
        .then(() => refetchUser())
        .catch(err => console.error('[ACCOUNT] Failed to generate referral code:', err));
    }
  }, [user?.id, user?.referral_code, refetchUser]);

  // Handle post-checkout refresh
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutSuccess = urlParams.get('checkout_success');
    const paymentStatus = urlParams.get('payment');
    const subscriptionStatus = urlParams.get('subscription');
    
    if (checkoutSuccess === 'true' || paymentStatus === 'success' || subscriptionStatus === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      
      let pollCount = 0;
      const maxPolls = 12;
      
      const pollInterval = setInterval(() => {
        pollCount++;
        refetchUser?.();
        
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
        }
      }, 5000);
      
      return () => clearInterval(pollInterval);
    }
  }, [refetchUser]);

  // Handle plan selector scroll + force light mode
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const showPlans = urlParams.get('showPlans');
    const highlight = urlParams.get('highlight');
    const section = urlParams.get('section');
    const hash = window.location.hash;
    
    // Force light mode when arriving via ?showPlans=true
    if (showPlans === 'true') {
      document.documentElement.classList.remove('dark');
    }
    
    if (showPlans === 'true' || highlight === 'plans' || hash === '#plans' || hash === '#plans-section' || hash === '#pricing') {
      setTimeout(() => {
        const el = document.getElementById('plan-selector');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    } else if (highlight === 'plan') {
      setTimeout(() => {
        const el = document.getElementById('account-current-plan');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
    
    if (hash === '#notifications' || section === 'notifications') {
      setTimeout(() => {
        // Automatically expand notification preferences if hash or section param is present
        setExpandedNotifPrefs(true); 
        const notificationSection = document.getElementById('notification-preferences');
        if (notificationSection) {
          notificationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }

    if (hash === '#letter-credits') {
      setTimeout(() => {
        const creditsSection = document.getElementById('letter-credits');
        if (creditsSection) {
          creditsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }

    if (hash === '#refer-friends' || hash === '#referral') {
      setTimeout(() => {
        const referralSection = document.getElementById('referral-section');
        if (referralSection) {
          referralSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Highlight for 1s
          referralSection.style.boxShadow = '0 0 0 4px rgba(199,163,56,0.3)';
          setTimeout(() => {
            referralSection.style.boxShadow = '';
          }, 1000);
        }
      }, 300);
    }
  }, [location]);

  React.useEffect(() => {
    let intervalId;
    
    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      let count = 0;
      intervalId = setInterval(() => {
        count++;
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        
        if (count >= 6) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 5000);
    };
    
    const handleBlur = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [queryClient]);

  // isDark and initialTheme moved inside useEffect for formData for better reactivity.
  // The state definitions below use a direct check for the initial render fallback.
  const [formData, setFormData] = useState({
    full_name: user?.display_name || user?.full_name || '',
    phone: user?.phone || '',
    country: user?.country || '',
    language: user?.language || 'en',
    theme: user?.theme || (document.documentElement.classList.contains('dark') ? 'dark' : 'light'),
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

  // CRITICAL: Only sync form state from user data when NOT editing
  React.useEffect(() => {
    if (user && !isEditing) {
      console.log('[FORM_SYNC] Loading form from user data:', { 
        full_name: user.full_name, 
        display_name: user.display_name,
        phone: user.phone 
      });
      
      const isDark = document.documentElement.classList.contains('dark');
      const initialTheme = isDark ? 'dark' : 'light';
      
      // Use display_name if available, fallback to full_name (built-in, read-only)
      const effectiveName = user.display_name || user.full_name || '';
      
      setFormData({
        full_name: effectiveName,
        phone: user.phone || '',
        country: user.country || '',
        language: user.language || 'en',
        theme: user.theme || initialTheme,
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
  }, [user?.id, user?.display_name, user?.full_name, user?.phone, isEditing]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await refetchUser();
      setIsEditing(false);
      toast.success(language === 'th' ? 'บันทึกโปรไฟล์แล้ว' : language === 'zh' ? '个人资料已保存' : language === 'ja' ? 'プロフィールを保存しました' : language === 'ko' ? '프로필 저장됨' : language === 'ru' ? 'Профиль сохранён' : 'Profile updated');
      haptic.success();
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
      toast.error(language === 'th' ? 'ไม่สามารถบันทึกโปรไฟล์ได้ กรุณาลองอีกครั้ง' : language === 'zh' ? '无法保存个人资料，请重试' : language === 'ja' ? 'プロフィールを保存できませんでした。もう一度お試しください' : language === 'ko' ? '프로필을 저장할 수 없습니다. 다시 시도하세요' : language === 'ru' ? 'Не удалось сохранить профиль. Попробуйте снова' : 'Failed to save profile. Please try again.');
      haptic.error();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    haptic.medium();
    
    // DATA PIPELINE: Read = base44.auth.me() -> User entity
    //                Write = base44.auth.updateMe() -> User entity (custom field: display_name)
    //                Key = authenticated user ID (auto-managed)
    // ROOT CAUSE FIX: full_name is READ-ONLY built-in field. Use display_name instead.
    
    const savePayload = {
      display_name: formData.full_name,
      phone: formData.phone,
      country: formData.country,
      language: formData.language,
      theme: formData.theme,
      tenant_address: formData.tenant_address,
      tenant_city: formData.tenant_city,
      tenant_state: formData.tenant_state,
      tenant_zip: formData.tenant_zip
    };
    
    console.log('[PROFILE_SAVE] Payload:', savePayload);
    
    try {
      const response = await base44.auth.updateMe(savePayload);
      console.log('[PROFILE_SAVE] Response:', response);
      
      if (!response) {
        throw new Error('Empty response from server');
      }
      
      // CRITICAL: Invalidate and refetch to update canonical profile
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      const freshData = await refetchUser();
      console.log('[PROFILE_SAVE] Fresh data:', freshData.data);
      
      // Broadcast profile update event for reactive pages
      window.dispatchEvent(new CustomEvent('profile:updated'));
      
      const savedName = freshData.data?.display_name || freshData.data?.full_name || 'N/A';
      const savedPhone = freshData.data?.phone || 'N/A';
      const timestamp = new Date().toLocaleTimeString();
      
      setIsEditing(false);
      
      toast.success(`✅ Saved: name=${savedName} phone=${savedPhone} @${timestamp}`);
      haptic.success();
    } catch (error) {
      console.error('[PROFILE_SAVE] Failed:', error);
      toast.error(`❌ Save failed: ${error.message || 'Unknown error'}`);
      haptic.error();
    }
  };

  const handleNotificationUpdate = async (data) => {
    try {
      await base44.auth.updateMe(data);
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await refetchUser();
      toast.success(language === 'th' ? 'อัปเดตการตั้งค่าการแจ้งเตือนแล้ว' : language === 'zh' ? '通知设置已更新' : language === 'ja' ? '通知設定を更新しました' : language === 'ko' ? '알림 설정 업데이트됨' : language === 'ru' ? 'Настройки уведомлений обновлены' : 'Notification settings updated');
      haptic.success();
    } catch (error) {
      console.error('Notification update failed:', error);
      toast.error(language === 'th' ? 'ไม่สามารถอัปเดตการตั้งค่าได้' : language === 'zh' ? '无法更新设置' : language === 'ja' ? '設定を更新できませんでした' : language === 'ko' ? '설정을 업데이트할 수 없습니다' : language === 'ru' ? 'Не удалось обновить настройки' : 'Failed to update settings');
      haptic.error();
    }
  };

  const handleThemeToggle = async (newTheme) => {
    haptic.light();
    setFormData({...formData, theme: newTheme});
    try {
      await base44.auth.updateMe({ theme: newTheme });
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await refetchUser();
      haptic.success();
    } catch (error) {
      console.error('Theme update failed:', error);
      toast.error(language === 'th' ? 'ไม่สามารถเปลี่ยนธีมได้' : language === 'zh' ? '无法更改主题' : language === 'ja' ? 'テーマを変更できませんでした' : language === 'ko' ? '테마를 변경할 수 없습니다' : language === 'ru' ? 'Не удалось изменить тему' : 'Failed to change theme');
      haptic.error();
    }
  };

  const handleSubscribe = async (planKey, interval) => {
    const plan = PLAN_DETAILS.find(p => p.key === planKey);
    if (!plan) return;

    // Detect if this is an upgrade or downgrade
    const currentPlanData = PLAN_DETAILS.find(p => p.key === planTier);
    const targetPlanData = PLAN_DETAILS.find(p => p.key === planKey);
    
    const currentMonthlyPrice = currentPlanData?.priceMonthly || 0;
    const targetMonthlyPrice = targetPlanData?.priceMonthly || 0;
    
    const isUpgrade = targetMonthlyPrice > currentMonthlyPrice;
    const isDowngrade = targetMonthlyPrice < currentMonthlyPrice && !isFreePlan;

    // If downgrading, show retention modal
    if (isDowngrade) {
      setShowRetentionModal(true);
      return;
    }

    // Show billing interval dialog
    setSelectedPlan(planKey);
    // Pre-select annual for upgrades
    setSelectedInterval(isUpgrade ? 'annual' : (interval || 'monthly'));
    setShowBillingDialog(true);
  };

  // Downgrade confirmation handled by RetentionModal

  const confirmSubscribe = async () => {
    const plan = PLAN_DETAILS.find(p => p.key === selectedPlan);
    if (!plan) return;

    // Get Stripe price ID from PRICING config
    const pricingData = PRICING[selectedPlan];
    if (!pricingData) {
      alert(language === 'th' ? 'ราคาไม่พร้อมใช้งานชั่วคราว' : 'Pricing temporarily unavailable');
      return;
    }

    const selectedPriceData = pricingData[selectedInterval];
    if (!selectedPriceData?.priceId) {
      alert(language === 'th' ? 'ราคาไม่พร้อมใช้งานชั่วคราว' : 'Pricing temporarily unavailable');
      return;
    }

    haptic.medium();
    setShowBillingDialog(false);

    const amount = selectedPriceData.amount;
    const billingInterval = selectedInterval === 'annual' ? 'annual' : 'monthly';

    setSubscribing(prev => ({ ...prev, [selectedPlan]: true }));
    try {
      const response = await base44.functions.invoke('createCheckout', {
        mode: 'subscription',
        amount: amount,
        currency: 'thb',
        description: `Lease Shield ${plan.label} - ${selectedInterval === 'annual' ? 'Annual' : 'Monthly'}`,
        successUrl: `${window.location.origin}/account?checkout_success=true`,
        cancelUrl: `${window.location.origin}/account?subscription=cancelled`,
        priceId: selectedPriceData.priceId,
        metadata: {
          type: 'subscription',
          userId: user.id,
          email: user.email,
          plan: selectedPlan,
          interval: billingInterval
        }
      });
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        haptic.error();
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('❌ Subscription error:', error);
      haptic.error();
      const language = user?.language || 'en';
      const errorMsg = error.response?.data?.details || error.message;
      alert(`${language === 'th' ? 'ไม่สามารถสร้างการสมัครได้' : 'Failed to start subscription'}\n\n${errorMsg}`);
      setSubscribing(prev => ({ ...prev, [selectedPlan]: false }));
    }
  };

  const handleBuyCredits = async (pkg) => {
    haptic.medium();
    setBuyingCredits(prev => ({ ...prev, [pkg.id]: true }));
    try {
      const response = await base44.functions.invoke('createCheckout', {
        mode: 'payment',
        amount: pkg.price,
        currency: 'thb',
        description: `${pkg.credits} Letter Credits`,
        successUrl: `${window.location.origin}${createPageUrl('Templates')}?checkout_success=true`,
        cancelUrl: `${window.location.origin}${createPageUrl('Templates')}?payment=cancelled`,
        metadata: {
          type: 'credits',
          userId: user.id,
          email: user.email,
          credits: pkg.credits,
          packageId: pkg.id
        }
      });
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('❌ Credit purchase error:', error);
      haptic.error();
      alert(language === 'th' ? 'ไม่สามารถสร้างการชำระเงินได้ กรุณาลองอีกครั้ง' : 'Failed to create checkout. Please try again.');
    } finally {
      setBuyingCredits(prev => ({ ...prev, [pkg.id]: false }));
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmDeleteEmail !== user?.email || !confirmDeleteUnderstand) {
      toast.error(language === 'th' ? 'กรุณายืนยันอีเมลและยอมรับข้อกำหนด' : 'Please confirm email and accept terms');
      return;
    }

    haptic.medium();
    setIsDeleting(true);

    try {
      const response = await base44.functions.invoke('deleteUserData', {
        confirmEmail: confirmDeleteEmail
      });

      if (response.data?.ok) {
        haptic.success();
        alert(language === 'th' 
          ? 'บัญชีและข้อมูลทั้งหมดของคุณถูกลบอย่างถาวร คุณจะถูกออกจากระบบตอนนี้'
          : language === 'zh'
            ? '您的账户和所有数据已被永久删除。您现在将被注销。'
            : language === 'ja'
              ? 'アカウントとすべてのデータが完全に削除されました。今すぐログアウトします。'
              : language === 'ko'
                ? '계정 및 모든 데이터가 영구적으로 삭제되었습니다. 지금 로그아웃됩니다.'
                : language === 'ru'
                  ? 'Ваша учётная запись и все данные были окончательно удалены. Сейчас вы будете выведены из системы.'
                  : 'Your account and all data have been permanently deleted. You will now be logged out.');
        
        await base44.auth.logout();
        window.location.href = '/';
      } else {
        haptic.error();
        alert(language === 'th' 
          ? `การลบล้มเหลว: ${response.data?.message || 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`
          : `Deletion failed: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[DELETE_ACCOUNT_ERROR]', error);
      haptic.error();
      alert(language === 'th' 
        ? 'เกิดข้อผิดพลาดระหว่างการลบบัญชี กรุณาติดต่อฝ่ายสนับสนุน'
        : 'An error occurred during account deletion. Please contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportData = async () => {
    haptic.medium();
    setShowExportDialog(false);
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportUserData');
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Try to use Web Share API first (mobile)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], `LeaseShield_Data_${new Date().toISOString().split('T')[0]}.pdf`, { type: 'application/pdf' })] })) {
        const file = new File([blob], `LeaseShield_Data_${new Date().toISOString().split('T')[0]}.pdf`, { type: 'application/pdf' });
        try {
          await navigator.share({
            files: [file],
            title: language === 'th' ? 'ข้อมูล Lease Shield ของฉัน' : 'My Lease Shield Data'
          });
          toast.success(language === 'th' ? 'แชร์ไฟล์สำเร็จ' : 'File shared successfully');
        } catch (shareError) {
          if (shareError.name !== 'AbortError') {
            // Fallback to download
            const a = document.createElement('a');
            a.href = url;
            a.download = `Lease_Shield_Personal_Data_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            toast.success(language === 'th' ? 'บันทึกไฟล์แล้ว' : 'File saved to Downloads');
          }
        }
      } else {
        // Fallback to download
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lease_Shield_Personal_Data_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(language === 'th' ? 'บันทึกไฟล์แล้ว' : 'File saved to Downloads');
      }
      
      window.URL.revokeObjectURL(url);
      haptic.success();
    } catch (error) {
      console.error('❌ Export failed:', error);
      haptic.error();
      toast.error(language === 'th' ? 'ส่งออกล้มเหลว กรุณาลองอีกครั้ง' : 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Retention modal handles all cancel/downgrade logic now

  const handleLandlordUpdate = async () => {
    haptic.medium();
    try {
      await base44.auth.updateMe(landlordData);
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await refetchUser();
      toast.success(language === 'th' ? 'บันทึกข้อมูลเจ้าของบ้านแล้ว' : language === 'zh' ? '房东信息已保存' : language === 'ja' ? '家主情報を保存しました' : language === 'ko' ? '집주인 정보 저장됨' : language === 'ru' ? 'Информация арендодателя сохранена' : 'Landlord info saved');
      haptic.success();
    } catch (error) {
      console.error('Landlord update failed:', error);
      toast.error(language === 'th' ? 'ไม่สามารถบันทึกได้ กรุณาลองอีกครั้ง' : language === 'zh' ? '无法保存，请重试' : language === 'ja' ? '保存できませんでした。もう一度お試しください' : language === 'ko' ? '저장 실패, 다시 시도하세요' : language === 'ru' ? 'Не удалось сохранить. Попробуйте снова' : 'Failed to save. Please try again.');
      haptic.error();
    }
  };

  const handleJuristicUpdate = async () => {
    haptic.medium();
    try {
      await base44.auth.updateMe(juristicData);
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await refetchUser();
      toast.success(language === 'th' ? 'บันทึกข้อมูลนิติบุคคลแล้ว' : language === 'zh' ? '物业信息已保存' : language === 'ja' ? '管理事務所情報を保存しました' : language === 'ko' ? '관리 사무소 정보 저장됨' : language === 'ru' ? 'Информация управляющей компании сохранена' : 'Juristic info saved');
      haptic.success();
    } catch (error) {
      console.error('Juristic update failed:', error);
      toast.error(language === 'th' ? 'ไม่สามารถบันทึกได้ กรุณาลองอีกครั้ง' : language === 'zh' ? '无法保存，请重试' : language === 'ja' ? '保存できませんでした。もう一度お試しください' : language === 'ko' ? '저장 실패, 다시 시도하세요' : language === 'ru' ? 'Не удалось сохранить. Попробуйте снова' : 'Failed to save. Please try again.');
      haptic.error();
    }
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
    const title = language === 'th' ? 'Lease Shield LINE' : 'Lease Shield LINE notifications';
    const text = role === 'landlord'
      ? (language === 'th' 
          ? 'เชื่อมต่อกับ Lease Shield เพื่อรับการแจ้งเตือนอัตโนมัติ' 
          : 'Connect to Lease Shield for automated notifications')
      : (language === 'th'
          ? 'เชื่อมต่อนิติบุคคลกับ Lease Shield'
          : 'Connect juristic office to Lease Shield');
    
    haptic.light();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: link
        });
        toast.success(language === 'th' ? 'แชร์แล้ว' : 'Shared successfully');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          await handleCopyLink(role);
          toast.info(language === 'th' ? 'คัดลอกลิงก์แล้ว – แปะใน LINE' : 'Link copied – paste into LINE chat');
        }
      }
    } else {
      await handleCopyLink(role);
      toast.info(language === 'th' ? 'คัดลอกลิงก์แล้ว – แปะใน LINE' : 'Link copied – paste into LINE chat');
    }
  };

  const [installPrompt, setInstallPrompt] = React.useState(null);
  const [showInstallInstructions, setShowInstallInstructions] = React.useState(false);
  const [appLinkCopied, setAppLinkCopied] = React.useState(false);

  React.useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    haptic.medium();
    
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
          toast.success(language === 'th' ? 'กำลังติดตั้งแอป...' : language === 'zh' ? '正在安装应用...' : language === 'ja' ? 'アプリをインストール中...' : language === 'ko' ? '앱 설치 중...' : language === 'ru' ? 'Установка приложения...' : 'Installing app...');
          haptic.success();
        }
        setInstallPrompt(null);
      } catch (err) {
        console.error('Install failed:', err);
      }
    } else {
      setShowInstallInstructions(true);
    }
  };

  const handleShareApp = async () => {
    haptic.light();
    const appUrl = 'https://app.leaseshield.asia';
    const title = 'LeaseShield';
    const text = language === 'th' 
      ? 'ป้องกันปัญหาการเช่าด้วย Lease Shield - วิเคราะห์สัญญา ติดตามเงินมัดจำ และเปิดคดีได้ง่ายๆ'
      : language === 'zh' 
        ? '用 Lease Shield 防止租赁问题 - 分析合同、追踪押金、轻松开案'
        : language === 'ja'
          ? 'Lease Shieldで賃貸問題を防ぐ - 契約分析、敷金追跡、簡単にケース開設'
          : language === 'ko'
            ? 'Lease Shield로 임대 문제 예방 - 계약 분석, 보증금 추적, 쉬운 사례 개설'
            : language === 'ru'
              ? 'Предотвращайте проблемы аренды с Lease Shield - анализ договоров, отслеживание депозитов, простое открытие дел'
              : 'Prevent rental problems with Lease Shield - analyze contracts, track deposits, open cases easily';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: appUrl
        });
        toast.success(language === 'th' ? 'แชร์แล้ว!' : language === 'zh' ? '已分享！' : language === 'ja' ? '共有しました！' : language === 'ko' ? '공유됨!' : language === 'ru' ? 'Поделились!' : 'Shared!');
        haptic.success();
      } catch (err) {
        if (err.name !== 'AbortError') {
          await navigator.clipboard.writeText(appUrl);
          setAppLinkCopied(true);
          toast.success(language === 'th' ? 'คัดลอกลิンก์แล้ว!' : language === 'zh' ? '链接已复制！' : language === 'ja' ? 'リンクをコピーしました！' : language === 'ko' ? '링크 복사됨!' : language === 'ru' ? 'Ссылка скопирована!' : 'Link copied!');
          setTimeout(() => setAppLinkCopied(false), 2000);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(appUrl);
        setAppLinkCopied(true);
        toast.success(language === 'th' ? 'คัดลอกลินก์แล้ว!' : language === 'zh' ? '链接已复制！' : language === 'ja' ? 'リンクをコピーしました！' : language === 'ko' ? '링크 복사됨!' : language === 'ru' ? 'Ссылка скопирована!' : 'Link copied!');
        haptic.success();
        setTimeout(() => setAppLinkCopied(false), 2000);
      } catch (err) {
        console.error('Copy failed:', err);
        toast.error(language === 'th' ? 'ไม่สามารถคัดลอกได้' : language === 'zh' ? '无法复制' : language === 'ja' ? 'コピーできませんでした' : language === 'ko' ? '복사 실패' : language === 'ru' ? 'Не удалось скопировать' : 'Failed to copy');
      }
    }
  };

  const planTier = ((user?.plan_tier || 'free').toLowerCase() === 'explorer') ? 'free' : (user?.plan_tier || 'free');
  const userBillingInterval = user?.billing_interval || 'monthly';
  const subscriptionStatus = user?.subscription_status || 'inactive';
  const isFreePlan = planTier === 'free';
  const isLitePlan = planTier === 'lite';
  const isProtectPlan = planTier === 'protect';
  const isSecurePlan = planTier === 'secure';
  const isScheduledForCancellation = (subscriptionStatus === 'cancelled' || subscriptionStatus === 'canceling') && user?.plan_renews_at;
  
  // Admin access check
  const userRole = user?.role?.toLowerCase();
  const accessLevel = user?.access_level?.toLowerCase();
  const isAdmin = 
    userRole === 'admin' || 
    userRole === 'super_admin' || 
    userRole === 'va' ||
    accessLevel === 'admin' || 
    accessLevel === 'super_admin' || 
    accessLevel === 'va';

  const language = user?.language || 'en';
  const isDark = document.documentElement.classList.contains('dark');
  const currentTheme = user?.theme || (isDark ? 'dark' : 'light');
  const isDarkMode = currentTheme === 'dark';

  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#2A2D30',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)',
    inputBg: '#374151',
    fieldBg: '#374151',
    hoverBg: '#3A3D40'
  } : {
    bg: '#F3F6F5',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderColor: 'rgba(12,59,46,0.08)',
    inputBg: '#FFFFFF',
    fieldBg: '#F8FAFC',
    hoverBg: '#F1F5F9'
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
      tenantAddress: "Your Address",
      tenantAddressPlaceholder: "Street address",
      tenantCity: "City",
      tenantCityPlaceholder: "Bangkok",
      tenantState: "State/Province",
      tenantStatePlaceholder: "Bangkok",
      tenantZip: "Postal Code",
      tenantZipPlaceholder: "10110",
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
      responseTime: "Response within 2-3 business days",
      dataPrivacy: "Data Privacy & Your Rights",
      privacyPolicy: "Privacy Policy",
      privacyDesc: "Learn how we protect your data",
      viewPolicy: "View Policy",
      exportData: "Export My Data",
      exportDesc: "Download all your personal data (PDPA compliant)",
      export: "Export",
      exporting: "Exporting...",
      deleteAccount: "Need to Delete Your Account?",
      deleteDesc: "To request permanent deletion of your account and data, please email us from your registered email at",
      deleteNote: "After verification, your data will be deleted within 14 days, except where we must keep certain records for legal or accounting reasons.",
      preventionBannerTitle: "Prevention-First Protection",
      preventionBannerSubtitle: "Subscription-based protection for your lease, deposit, and documentation",
      preventionBannerText: "Lease Shield helps you maintain clear, legal, and evidence-based leasing relationships. Prevent rental problems before they happen with automated alerts, risk analysis, and professional templates.",
      monthly: "Monthly",
      annual: "Annual",
      save17: "Save 17%",
      notificationPreferences: "Notification Preferences",
      notificationInsights: "Notification Insights",
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
      monthlyBillingAvailable: "Monthly billing available at checkout",
      save17OnLite: "Save 17% on Lite",
      save17OnProtect: "Save 17% on Protect",
      save17OnSecure: "Save 17% on Secure",
      discountSubtext: "17% OFF — paid annually",
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
      purchaseCredits: "Purchase Credits",
      currentPlanFree: "Current plan: Free",
      freeUpgradeText: "You're on basic coverage. Upgrade to Lite, Protect, or Secure for full deposit and maintenance protection.",
      chooseBillingInterval: "Choose Billing Cycle",
      payMonthly: "Pay Monthly",
      payAnnually: "Pay Annually",
      annualSavings: "Save 17% annually",
      bestValueBadge: "Best Value",
      proceedToCheckout: "Proceed to Checkout",
      upgradeToSecure: "Upgrade to Secure",
      unlockPremium: "Unlock Premium Features",
      secureFeatures: "Unlimited scans, priority support & 50 letter credits/month",
      managementOptions: "Management options",
      downgradeToFree: "Downgrade to Free",
      keepProtectionActive: "Keep your protection active?",
      retentionCopy: "You'll lose important protections if you downgrade. You can switch to a lower-cost plan instead.",
      switchToLite: "Switch to Lite",
      continueToFree: "Continue to Free plan",
      confirmDowngradeTitle: "Downgrade to Free plan",
      confirmDowngradeWarning: "You'll lose Unlimited Lease Scans, Advanced Reminders, extra Letter Credits and other premium protections.",
      reasonForDowngrade: "Reason for downgrading",
      goBack: "Go back",
      confirmDowngradeBtn: "Confirm downgrade to Free"
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
      tenantAddress: "ที่อยู่ของคุณ",
      tenantAddressPlaceholder: "ที่อยู่",
      tenantCity: "เมือง",
      tenantCityPlaceholder: "กรุงเทพฯ",
      tenantState: "จังหวัด",
      tenantStatePlaceholder: "กรุงเทพฯ",
      tenantZip: "รหัสไปรษณีย์",
      tenantZipPlaceholder: "10110",
      saveChanges: "บันทึกการเปลี่ยนแปลง",
      cancel: "ยกเลิก",
      currentPlan: "แผนปัจจุบัน",
      billedMonthly: "เรียกเก็บรายเดือน",
      billedAnnually: "เรียกเก็บรายปี",
      renews: "ต่ออายุ",
      freePlanName: "ฟรี",
      freeIncludes: "แผนฟรีประกอบด้วย:",
      freeBenefit1: "สแกนสัญญาเช่า 1 ครั้ง (ตลอดชีพ)",
      freeBenefit2: "ดูคะแนนความเสี่ยงเบื้องต้น",
      freeBenefit3: "3 ไฟล์ (พื้นที่ 100MB)",
      freeBenefit4: "เครื่องมือติดตามเงินมัดจำแบบอ่านอย่างเดียว",
      upgradeNow: "อัปเกรดเลย",
      allActive: "ฟีเจอร์ทั้งหมดใช้งานได้",
      lineEnabled: "การแจ้งเตือน LINE เปิดใช้งาน",
      helpSupport: "ช่วยเหลือและการสนับสนุน",
      helpDesc: "ต้องการความช่วยเหลือ? ส่งคำขอและเราจะตอบกลับทางอีเมล",
      submitRequest: "ส่งคำขอช่วยเหลือ",
      submitDesc: "รายงานปัญหา ถามคำถาม หรือขอความช่วยเหลือ",
      directEmail: "อีเมลโดยตรง",
      responseTime: "ตอบกลับภายใน 2-3 วันทำการ",
      dataPrivacy: "ความเป็นส่วนตัวของข้อมูลและสิทธิ์ของคุณ",
      privacyPolicy: "นโยบายความเป็นส่วนตัว",
      privacyDesc: "เรียนรู้วิธีที่เราปกป้องข้อมูลของคุณ",
      viewPolicy: "ดูนโยบาย",
      exportData: "ส่งออกข้อมูลของฉัน",
      exportDesc: "ดาวน์โหลดข้อมูลส่วนบุคคลทั้งหมด (ตาม พ.ร.บ. PDPA)",
      export: "ส่งออก",
      exporting: "กำลังส่งออก...",
      deleteAccount: "ต้องการลบบัญชี?",
      deleteDesc: "หากต้องการขอลบบัญชีและข้อมูลของคุณอย่างถาวร กรุณาส่งอีเมลจากอีเมลที่ลงทะเบียนไปที่",
      deleteNote: "หลังจากตรวจสอบแล้ว ข้อมูลของคุณจะถูกลบภายใน 14 วัน ยกเว้นกรณีที่เราต้องเก็บบันทึกบางอย่างตามกฎหมายหรือเพื่อการบัญชี",
      preventionBannerTitle: "การป้องกันเป็นอันดับแรก",
      preventionBannerSubtitle: "การป้องกันแบบสมัครสมาชิกสำหรับสัญญาเช่า เงินมัดจำ และเอกสารของคุณ",
      preventionBannerText: "Lease Shield ช่วยให้คุณรักษาความสัมพันธ์ในการเช่าที่ชัดเจน ถูกกฎหมาย และมีหลักฐาน ป้องกันปัญหาการเช่าก่อนที่จะเกิดขึ้นด้วยการแจ้งเตือนอัตโนมัติ การวิเคราะห์ความเสี่ยง และเทมเพลตมืออาชีพ",
      monthly: "รายเดือน",
      annual: "รายปี",
      save17: "ประหยัด 17%",
      notificationPreferences: "การตั้งค่าการแจ้งเตือน",
      notificationInsights: "สถิติการแจ้งเตือน",
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
      bestValue: "คุ้มที่สุด",
      creditPacks: "แพ็กเกจเครดิต",
      oneLetterPerCredit: "1 จดหมาย = 1 เครดิต",
      accessTemplateLibrary: "เข้าถึงคลังเทมเพลต",
      bilingual: "เทมเพลตสองภาษา",
      humanAndAiGeneration: "สร้างโดยมนุษย์และ AI",
      creditsNeverExpire: "เครดิตไม่หมดอายุ",
      purchaseCredits: "ซื้อเครดิต",
      currentPlanFree: "แผนปัจจุบัน: ฟรี",
      freeUpgradeText: "คุณอยู่ในการคุ้มครองพื้นฐาน อัปเกรดเป็น Lite, Protect หรือ Secure เพื่อการป้องกันเงินมัดจำและการซ่อมบำรุงเต็มรูปแบบ",
      chooseBillingInterval: "เลือกรอบการเรียกเก็บเงิน",
      payMonthly: "ชำระรายเดือน",
      payAnnually: "ชำระรายปี",
      annualSavings: "ประหยัด 17% ต่อปี",
      bestValueBadge: "คุ้มค่าที่สุด",
      proceedToCheckout: "ไปที่การชำระเงิน",
      upgradeToSecure: "อัปเกรดเป็น Secure",
      unlockPremium: "ปลดล็อกฟีเจอร์พรีเมียม",
      secureFeatures: "สแกนไม่จำกัด การสนับสนุนลำดับความสำคัญ และเครดิตจดหมาย 50 ใบ/เดือน",
      managementOptions: "ตัวเลือกการจัดการ",
      downgradeToFree: "ลดเป็นฟรี",
      keepProtectionActive: "รักษาการป้องกันของคุณไว้?",
      retentionCopy: "คุณจะสูญเสียการป้องกันที่สำคัญหากคุณลดระดับ คุณสามารถเปลี่ยนเป็นแผนที่ถูกกว่าแทนได้",
      switchToLite: "เปลี่ยนเป็น Lite",
      continueToFree: "ดำเนินการไปยังแผนฟรี",
      confirmDowngradeTitle: "ลดเป็นแผนฟรี",
      confirmDowngradeWarning: "คุณจะสูญเสียการสแกนสัญญาไม่จำกัด การแจ้งเตือนขั้นสูง เครดิตจดหมายเพิ่มเติม และการป้องกันพรีเมียมอื่นๆ",
      reasonForDowngrade: "เหตุผลในการลดระดับ",
      goBack: "กลับ",
      confirmDowngradeBtn: "ยืนยันการลดเป็นฟรี",
      installApp: "ติดตั้งแอป Lease Shield",
      installAppDesc: "เพิ่มลงในหน้าจอหลักเพื่อเข้าถึงง่ายๆ",
      shareApp: "แชร์แอปกับเพื่อน",
      shareAppDesc: "ชวนคนอื่นมาป้องกันเงินมัดจำของพวกเขา",
      installInstructions: "วิธีติดตั้ง",
      iosInstructions: "บน iPhone/iPad:\n1. แตะปุ่มแชร์ใน Safari\n2. แตะ 'เพิ่มที่หน้าจอโฮม'\n3. แตะ 'เพิ่ม'",
      androidInstructions: "บน Android:\n1. แตะเมนู (⋮) ใน Chrome\n2. แตะ 'เพิ่มที่หน้าจอโฮม'\n3. แตะ 'เพิ่ม'",
      desktopInstructions: "บนเดสก์ท็อป:\n1. คลิกไอคอนติดตั้งในแถบที่อยู่\n2. หรือใช้เมนูเบราว์เซอร์ > 'ติดตั้ง Lease Shield'",
      gotIt: "เข้าใจแล้ว",
      install: "ติดตั้ง",
      alreadyInstalled: "ติดตั้งแล้ว"
    },
    zh: {
      pageTitle: "我的账户",
      pageSubtitle: "管理您的个人资料和订阅",
      personalInfo: "个人信息",
      editProfile: "编辑个人资料",
      fullName: "全名",
      email: "电子邮件",
      cannotChange: "无法更改",
      phone: "电话号码",
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
      cancel: "取消",
      currentPlan: "当前计划",
      billedMonthly: "按月计费",
      billedAnnually: "按年计费",
      renews: "续订",
      freePlanName: "免费",
      freeIncludes: "免费计划包括：",
      freeBenefit1: "1次租约扫描（终身）",
      freeBenefit2: "基本风险评分预览",
      freeBenefit3: "3个文件（100MB存储）",
      freeBenefit4: "只读押金追踪器",
      upgradeNow: "立即升级",
      allActive: "所有功能已激活",
      lineEnabled: "LINE提醒已启用",
      helpSupport: "帮助与支持",
      helpDesc: "需要帮助？提交请求，我们将通过电子邮件回复",
      submitRequest: "提交支持请求",
      submitDesc: "报告问题、提问或获取帮助",
      directEmail: "直接电子邮件",
      responseTime: "2-3个工作日内回复",
      dataPrivacy: "数据隐私与您的权利",
      privacyPolicy: "隐私政策",
      privacyDesc: "了解我们如何保护您的数据",
      viewPolicy: "查看政策",
      exportData: "导出我的数据",
      exportDesc: "下载您的所有个人数据（符合PDPA）",
      export: "导出",
      exporting: "导出中...",
      deleteAccount: "需要删除您的账户？",
      deleteDesc: "要请求永久删除您的账户和数据，请从您注册的电子邮件向我们发送邮件至",
      deleteNote: "验证后，您的数据将在14天内删除，除非我们必须出于法律或会计原因保留某些记录。",
      preventionBannerTitle: "预防优先保护",
      preventionBannerSubtitle: "基于订阅的租约、押金和文档保护",
      preventionBannerText: "Lease Shield帮助您维护清晰、合法且基于证据的租赁关系。通过自动提醒、风险分析和专业模板，在问题发生前预防租赁问题。",
      monthly: "按月",
      annual: "按年",
      save17: "节省17%",
      notificationPreferences: "通知偏好",
      notificationInsights: "通知统计",
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
      logout: "登出",
      notProvided: "未提供",
      manageSubscription: "管理订阅",
      renewsOn: "续订日期",
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
      scheduledCancellation: "计划取消",
      cancelScheduledFor: "取消日期",
      reactivate: "重新激活订阅",
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
      showQR: "显示二维码",
      hideQR: "隐藏二维码",
      scanQR: "使用LINE应用扫描此二维码",
      buyCredits: "购买信件积分",
      creditBalance: "积分余额",
      credits: "积分",
      perCredit: "每积分",
      buyNow: "立即购买",
      bestValue: "最佳价值",
      creditPacks: "积分套餐",
      oneLetterPerCredit: "1封信件 = 1积分",
      accessTemplateLibrary: "访问模板库",
      bilingual: "双语模板",
      humanAndAiGeneration: "人工和AI生成",
      creditsNeverExpire: "积分永不过期",
      purchaseCredits: "购买积分",
      currentPlanFree: "当前计划: 免费",
      freeUpgradeText: "您目前使用的是基本保障。升级到 Lite、Protect 或 Secure 方案，即可获得完整的押金和维护保障。",
      chooseBillingInterval: "选择计费周期",
      payMonthly: "按月支付",
      payAnnually: "按年支付",
      annualSavings: "每年节省17%",
      bestValueBadge: "最划算",
      proceedToCheckout: "前往结账",
      upgradeToSecure: "升级到Secure",
      unlockPremium: "解锁高级功能",
      secureFeatures: "无限次扫描，优先支持和每月50个信件积分",
      managementOptions: "管理选项",
      downgradeToFree: "降级到免费",
      keepProtectionActive: "保持您的保护活跃吗？",
      retentionCopy: "如果您降级，您将失去重要的保护。您可以改为切换到更低成本的计划。",
      switchToLite: "切换到Lite",
      continueToFree: "继续到免费计划",
      confirmDowngradeTitle: "降级到免费计划",
      confirmDowngradeWarning: "您将失去无限次租约扫描、高级提醒、额外信件积分和其他高级保护。",
      reasonForDowngrade: "降级原因",
      goBack: "返回",
      confirmDowngradeBtn: "确认降级到免费",
      dataAndStorage: "数据与存储",
      recycleBin: "回收站",
      manageDeletedItems: "管理已删除项目",
      landlordLanguage: "房东语言",
      selectLandlordLanguage: "选择房东的首选语言",
      installApp: "安装 Lease Shield 应用",
      installAppDesc: "添加到主屏幕以便快速访问",
      shareApp: "与朋友分享应用",
      shareAppDesc: "邀请他人保护他们的押金",
      installInstructions: "安装说明",
      iosInstructions: "在 iPhone/iPad 上:\n1. 在 Safari 中点击分享按钮\n2. 点击'添加到主屏幕'\n3. 点击'添加'",
      androidInstructions: "在 Android 上:\n1. 在 Chrome 中点击菜单 (⋮)\n2. 点击'添加到主屏幕'\n3. 点击'添加'",
      desktopInstructions: "在桌面上:\n1. 点击地址栏中的安装图标\n2. 或使用浏览器菜单 > '安装 Lease Shield'",
      gotIt: "知道了",
      install: "安装",
      alreadyInstalled: "已安装",
      monthlyBillingAvailable: "结账时可选择按月计费",
      save17OnLite: "Lite 省 17%",
      save17OnProtect: "Protect 省 17%",
      save17OnSecure: "Secure 省 17%",
      discountSubtext: "17% 折扣 — 按年支付",
    },
    ja: {
      pageTitle: "マイアカウント",
      pageSubtitle: "プロフィールとサブスクリプションを管理",
      personalInfo: "個人情報",
      editProfile: "プロフィールを編集",
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
      cancel: "キャンセル",
      currentPlan: "現在のプラン",
      billedMonthly: "月額請求",
      billedAnnually: "年間請求",
      renews: "更新",
      freePlanName: "無料",
      freeIncludes: "無料プランに含まれるもの：",
      freeBenefit1: "1回の賃貸契約スキャン（生涯）",
      freeBenefit2: "基本リスクスコアプレビュー",
      freeBenefit3: "3ファイル（100MBストレージ）",
      freeBenefit4: "読み取り専用敷金トラッカー",
      upgradeNow: "今すぐアップグレード",
      allActive: "すべての機能が有効",
      lineEnabled: "LINEリマインダーが有効",
      helpSupport: "ヘルプとサポート",
      helpDesc: "サポートが必要ですか？リクエストを送信すると、メールで返信します",
      submitRequest: "サポートリクエストを送信",
      submitDesc: "問題を報告、質問、またはヘルプを取得",
      directEmail: "直接メール",
      responseTime: "2-3営業日以内に返信",
      dataPrivacy: "データプライバシーとあなたの権利",
      privacyPolicy: "プライバシーポリシー",
      privacyDesc: "データの保護方法を学ぶ",
      viewPolicy: "ポリシーを表示",
      exportData: "マイデータをエクスポート",
      exportDesc: "すべての個人データをダウンロード（PDPA準拠）",
      export: "エクスポート",
      exporting: "エクスポート中...",
      deleteAccount: "アカウントを削除する必要がありますか？",
      deleteDesc: "アカウントとデータの永久削除をリクエストするには、登録されたメールアドレスから次のアドレスにメールを送信してください",
      deleteNote: "確認後、法律または会計上の理由で特定の記録を保持する必要がある場合を除き、14日以内にデータが削除されます。",
      preventionBannerTitle: "予防第一の保護",
      preventionBannerSubtitle: "賃貸契約、敷金、文書のためのサブスクリプションベースの保護",
      preventionBannerText: "Lease Shieldは、明確で合法的かつ証拠に基づく賃貸関係の維持を支援します。自動アラート、リスク分析、プロフェッショナルテンプレートで賃貸問題を事前に防止します。",
      monthly: "月額",
      annual: "年額",
      save17: "17%節約",
      notificationPreferences: "通知設定",
      notificationInsights: "通知インサイト",
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
      logout: "ログアウト",
      notProvided: "未提供",
      manageSubscription: "サブスクリプション管理",
      renewsOn: "更新日",
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
      scheduledCancellation: "キャンセル予定",
      cancelScheduledFor: "キャンセル日",
      reactivate: "サブスクリプションを再開",
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
      showQR: "QRコードを表示",
      hideQR: "QRコードを非表示",
      scanQR: "LINEアプリでこのQRコードをスキャン",
      buyCredits: "レタークレジットを購入",
      creditBalance: "クレジット残高",
      credits: "クレジット",
      perCredit: "クレジットあたり",
      buyNow: "今すぐ購入",
      bestValue: "最高の価値",
      creditPacks: "クレジットパック",
      oneLetterPerCredit: "1レター = 1クレジット",
      accessTemplateLibrary: "テンプレートライブラリにアクセス",
      bilingual: "バイリンガルテンプレート",
      humanAndAiGeneration: "人間とAIの生成",
      creditsNeverExpire: "クレジットは期限切れになりません",
      purchaseCredits: "クレジットを購入",
      currentPlanFree: "現在のプラン: 無料",
      freeUpgradeText: "あなたは基本的な補償を受けています。預金とメンテナンスの完全な保護のために、Lite、Protect、またはSecureにアップグレードしてください。",
      chooseBillingInterval: "請求サイクルを選択",
      payMonthly: "月払い",
      payAnnually: "年払い",
      annualSavings: "年間17%節約",
      bestValueBadge: "ベストバリュー",
      proceedToCheckout: "チェックアウトに進む",
      upgradeToSecure: "Secureにアップグレード",
      unlockPremium: "プレミアム機能のロックを解除",
      secureFeatures: "無制限スキャン、優先サポート、月50レタークレジット",
      managementOptions: "管理オプション",
      downgradeToFree: "無料プランにダウングレード",
      keepProtectionActive: "保護を継続しますか？",
      retentionCopy: "ダウングレードすると、重要な保護が失われます。代わりに低コストのプランに切り替えることもできます。",
      switchToLite: "Liteに切り替える",
      continueToFree: "無料プランに進む",
      confirmDowngradeTitle: "無料プランにダウングレード",
      confirmDowngradeWarning: "無制限のリーススキャン、高度なリマインダー、追加のレタークレジット、その他のプレミアム保護が失われます。",
      reasonForDowngrade: "ダウングレードの理由",
      goBack: "戻る",
      confirmDowngradeBtn: "無料プランへのダウングレードを確認",
      dataAndStorage: "データとストレージ",
      recycleBin: "ゴミ箱",
      manageDeletedItems: "削除されたアイテムを管理",
      landlordLanguage: "家主の言語",
      selectLandlordLanguage: "家主の好みの言語を選択",
      installApp: "Lease Shield アプリをインストール",
      installAppDesc: "ホーム画面に追加して素早くアクセス",
      shareApp: "友達とアプリを共有",
      shareAppDesc: "他の人に敷金保護を勧める",
      installInstructions: "インストール方法",
      iosInstructions: "iPhone/iPadで:\n1. Safariで共有ボタンをタップ\n2. 「ホーム画面に追加」をタップ\n3. 「追加」をタップ",
      androidInstructions: "Androidで:\n1. Chromeでメニュー (⋮) をタップ\n2. 「ホーム画面に追加」をタップ\n3. 「追加」をタップ",
      desktopInstructions: "デスクトップで:\n1. アドレスバーのインストールアイコンをクリック\n2. またはブラウザメニュー > 「Lease Shieldをインストール」",
      gotIt: "了解",
      install: "インストール",
      alreadyInstalled: "インストール済み",
      monthlyBillingAvailable: "月払いもチェックアウト時に選択可能",
      save17OnLite: "Lite で 17% 節約",
      save17OnProtect: "Protect で 17% 節約",
      save17OnSecure: "Secure で 17% 節約",
      discountSubtext: "17% OFF — 年払い",
    },
    ko: {
      pageTitle: "내 계정",
      pageSubtitle: "프로필 및 구독 관리",
      personalInfo: "개인 정보",
      editProfile: "프로필 편집",
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
      cancel: "취소",
      currentPlan: "현재 계획",
      billedMonthly: "월별 청구",
      billedAnnually: "연간 청구",
      renews: "갱신",
      freePlanName: "무료",
      freeIncludes: "무료 플랜 포함 사항：",
      freeBenefit1: "1회 임대 계약 스캔（평생）",
      freeBenefit2: "기본 위험 점수 미리보기",
      freeBenefit3: "3개 파일（100MB 저장소）",
      freeBenefit4: "읽기 전용 보증금 추적기",
      upgradeNow: "지금 업그레이드",
      allActive: "모든 기능 활성화",
      lineEnabled: "LINE 알림 활성화됨",
      helpSupport: "도움말 및 지원",
      helpDesc: "도움이 필요하신가요? 요청을 제출하면 이메일로 답변드립니다",
      submitRequest: "지원 요청 제출",
      submitDesc: "문제 보고, 질문 또는 도움 받기",
      directEmail: "직접 이메일",
      responseTime: "2-3영업일 내 응답",
      dataPrivacy: "데이터 프라이버시 및 귀하의 권리",
      privacyPolicy: "개인정보 보호정책",
      privacyDesc: "데이터 보호 방법 알아보기",
      viewPolicy: "정책 보기",
      exportData: "내 데이터 내보내기",
      exportDesc: "모든 개인 데이터 다운로드（PDPA 준수）",
      export: "내보내기",
      exporting: "내보내는 중...",
      deleteAccount: "계정을 삭제해야 합니까？",
      deleteDesc: "계정 및 데이터의 영구 삭제를 요청하려면 등록된 이메일에서 다음 주소로 이메일을 보내주세요",
      deleteNote: "확인 후 법적 또는 회계 목적으로 특정 기록을 보관해야 하는 경우를 제외하고 14일 이내에 데이터가 삭제됩니다。",
      preventionBannerTitle: "예방 우선 보호",
      preventionBannerSubtitle: "임대 계약、보증금 및 문서에 대한 구독 기반 보호",
      preventionBannerText: "Lease Shield는 명확하고 합법적이며 증거 기반의 임대 관계를 유지하도록 돕습니다。자동 알림、위험 분석 및 전문 템플릿으로 임대 문제를 사전에 예방하세요。",
      monthly: "월간",
      annual: "연간",
      save17: "17% 절약",
      notificationPreferences: "알림 설정",
      notificationInsights: "알림 통계",
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
      logout: "로그아웃",
      notProvided: "제공되지 않음",
      manageSubscription: "구독 관리",
      renewsOn: "갱신 날짜",
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
      scheduledCancellation: "취소 예정",
      cancelScheduledFor: "취소 날짜",
      reactivate: "구독 재개",
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
      showQR: "QR 코드 표시",
      hideQR: "QR 코드 숨기기",
      scanQR: "LINE 앱으로 이 QR 코드 스캔",
      buyCredits: "레터 크레딧 구매",
      creditBalance: "크레딧 잔액",
      credits: "크레딧",
      perCredit: "크레딧당",
      buyNow: "지금 구매",
      bestValue: "최고 가치",
      creditPacks: "크레딧 팩",
      oneLetterPerCredit: "1편지 = 1크레딧",
      accessTemplateLibrary: "템플릿 라이브러리 액세스",
      bilingual: "이중 언어 템플릿",
      humanAndAiGeneration: "인간 및 AI 생성",
      creditsNeverExpire: "크레딧은 만료되지 않습니다",
      purchaseCredits: "크레딧 구매",
      currentPlanFree: "현재 계획: 무료",
      freeUpgradeText: "기본 보장 상태입니다. 예치금 및 유지보수 전반에 대한 완벽한 보호를 위해 Lite, Protect 또는 Secure로 업그레이드하세요.",
      chooseBillingInterval: "결제 주기 선택",
      payMonthly: "월별 결제",
      payAnnually: "연간 결제",
      annualSavings: "연간 17% 절약",
      bestValueBadge: "최고의 가치",
      proceedToCheckout: "결제 진행",
      upgradeToSecure: "Secure로 업그레이드",
      unlockPremium: "프리미엄 기능 잠금 해제",
      secureFeatures: "무제한 스캔, 우선 지원 및 월 50개 레터 크레딧",
      managementOptions: "관리 옵션",
      downgradeToFree: "무료로 다운그레이드",
      keepProtectionActive: "보호를 계속 유지하시겠습니까?",
      retentionCopy: "다운그레이드하시면 중요한 보호 기능을 잃게 됩니다. 대신 저렴한 요금제로 전환하실 수 있습니다.",
      switchToLite: "Lite로 전환",
      continueToFree: "무료 요금제로 계속 진행",
      confirmDowngradeTitle: "무료 요금제로 다운그레이드",
      confirmDowngradeWarning: "무제한 임대 스캔, 고급 알림, 추가 레터 크레딧 및 기타 프리미엄 보호 기능을 잃게 됩니다.",
      reasonForDowngrade: "다운그레이드 이유",
      goBack: "돌아가기",
      confirmDowngradeBtn: "무료 요금제 다운그레이드 확인",
      dataAndStorage: "데이터 및 저장소",
      recycleBin: "휴지통",
      manageDeletedItems: "삭제된 항목 관리",
      landlordLanguage: "집주인 언어",
      selectLandlordLanguage: "집주인의 선호 언어 선택",
      installApp: "Lease Shield 앱 설치",
      installAppDesc: "빠른 액세스를 위해 홈 화면에 추가",
      shareApp: "친구와 앱 공유",
      shareAppDesc: "다른 사람들이 보증금을 보호하도록 초대",
      installInstructions: "설치 방법",
      iosInstructions: "iPhone/iPad에서:\n1. Safari에서 공유 버튼 탭\n2. '홈 화면에 추가' 탭\n3. '추가' 탭",
      androidInstructions: "Android에서:\n1. Chrome에서 메뉴 (⋮) 탭\n2. '홈 화면에 추가' 탭\n3. '추가' 탭",
      desktopInstructions: "데스크톱에서:\n1. 주소 표시줄의 설치 아이콘 클릭\n2. 또는 브라우저 메뉴 > 'Lease Shield 설치'",
      gotIt: "알겠습니다",
      install: "설치",
      alreadyInstalled: "이미 설치됨",
      monthlyBillingAvailable: "체크아웃 시 월별 결제 가능",
      save17OnLite: "Lite에서 17% 절약",
      save17OnProtect: "Protect에서 17% 절약",
      save17OnSecure: "Secure에서 17% 절약",
      discountSubtext: "17% 할인 — 연간 결제",
    },
    ru: {
      pageTitle: "Мой аккаунт",
      pageSubtitle: "Управление профилем и подпиской",
      personalInfo: "Личная информация",
      editProfile: "Редактировать профиль",
      fullName: "Полное имя",
      email: "Email",
      cannotChange: "Нельзя изменить",
      phone: "Телефон",
      phonePlaceholder: "+66 XX XXX XXXX",
      country: "Страна",
      countryPlaceholder: "Таиланд",
      language: "Язык",
      theme: "Тема",
      lightMode: "Светлая тема",
      darkMode: "Тёмная тема",
      tenantAddress: "Ваш адрес",
      tenantAddressPlaceholder: "Адрес",
      tenantCity: "Город",
      tenantCityPlaceholder: "Бангкок",
      tenantState: "Регион",
      tenantStatePlaceholder: "Бангкок",
      tenantZip: "Почтовый индекс",
      tenantZipPlaceholder: "10110",
      saveChanges: "Сохранить изменения",
      cancel: "Отмена",
      currentPlan: "Текущий план",
      billedMonthly: "Ежемесячная оплата",
      billedAnnually: "Годовая оплата",
      renews: "Продлевается",
      freePlanName: "Бесплатно",
      freeIncludes: "Бесплатный план включает:",
      freeBenefit1: "1 сканирование договора (навсегда)",
      freeBenefit2: "Базовый просмотр рисков",
      freeBenefit3: "3 файла (100MB хранилище)",
      freeBenefit4: "Отслеживание депозита (только чтение)",
      upgradeNow: "Обновить сейчас",
      allActive: "Все функции активны",
      lineEnabled: "Напоминания LINE включены",
      helpSupport: "Помощь и поддержка",
      helpDesc: "Нужна помощь? Отправьте запрос, и мы ответим по email",
      submitRequest: "Отправить запрос",
      submitDesc: "Сообщить о проблеме, задать вопрос или получить помощь",
      directEmail: "Прямой email",
      responseTime: "Ответ в течение 2-3 рабочих дней",
      dataPrivacy: "Конфиденциальность данных и ваши права",
      privacyPolicy: "Политика конфиденциальности",
      privacyDesc: "Узнайте, как мы защищаем ваши данные",
      viewPolicy: "Посмотреть политику",
      exportData: "Экспортировать мои данные",
      exportDesc: "Скачать все личные данные (соответствует PDPA)",
      export: "Экспорт",
      exporting: "Экспорт...",
      deleteAccount: "Нужно удалить аккаунт?",
      deleteDesc: "Чтобы запросить окончательное удаление вашей учётной записи и данных, отправьте письмо с зарегистрированного email на",
      deleteNote: "После проверки ваши данные будут удалены в течение 14 дней, за исключением случаев, когда мы обязаны хранить определённые записи по юридическим или бухгалтерским причинам。",
      preventionBannerTitle: "Защита прежде всего",
      preventionBannerSubtitle: "Защита на основе подписки для вашего договора, депозита и документов",
      preventionBannerText: "Lease Shield помогает поддерживать четкие, законные и основанные на доказательствах отношения по аренде. Предотвращайте проблемы до их возникновения с помощью автоматических уведомлений, анализа рисков и профессиональных шаблонов.",
      monthly: "Ежемесячно",
      annual: "Ежегодно",
      save17: "Экономия 17%",
      notificationPreferences: "Настройки уведомлений",
      notificationInsights: "Статистика уведомлений",
      choosePlan: "Выберите уровень защиты",
      planDesc: "Все планы ориентированы на профилактику и ведение четких записей",
      mostPopular: "САМЫЙ ПОПУЛЯРНЫЙ",
      monthsFree: "2 МЕСЯЦА БЕСПЛАТНО",
      noCreditCard: "Кредитная карта не требуется",
      perMonth: "/месяц",
      save: "Экономия",
      currentPlanBadge: "Текущий план",
      signupFree: "Зарегистрироваться бесплатно",
      startPlan: "Начать",
      processing: "Обработка...",
      logout: "Выход",
      notProvided: "Не указано",
      manageSubscription: "Управление подпиской",
      renewsOn: "Продлевается",
      cancelPlan: "Изменить или отменить план",
      cancelDialogTitle: "Отменить подписку?",
      cancelDialogDesc: "Жаль, что вы уходите. Помогите нам стать лучше, сообщив причину ухода.",
      cancelReason: "Причина отмены",
      selectReason: "Выберите причину",
      reasonTooExpensive: "Слишком дорого",
      reasonNotUsingEnough: "Недостаточно использую",
      reasonFoundAlternative: "Нашёл лучшую альтернативу",
      reasonMissingFeatures: "Отсутствуют нужные функции",
      reasonTechnicalIssues: "Технические проблемы",
      reasonOther: "Другое",
      additionalFeedback: "Дополнительный отзыв (необязательно)",
      feedbackPlaceholder: "Помогите нам понять, что мы можем улучшить...",
      keepSubscription: "Оставить подписку",
      confirmCancel: "Подтвердить отмену",
      cancelling: "Обработка...",
      whatYoullLose: "Что вы потеряете",
      downgradeNote: "Ваша подписка будет активна до {date}. После этого вы будете переведены на бесплатный план.",
      scheduledCancellation: "Запланирована отмена",
      cancelScheduledFor: "Отменяется",
      reactivate: "Возобновить подписку",
      landlordInfo: "Информация об арендодателе",
      landlordInfoDesc: "Сохраните контактные данные арендодателя для быстрых уведомлений",
      landlordName: "Имя арендодателя",
      landlordEmail: "Email арендодателя",
      landlordPhone: "Телефон арендодателя (WhatsApp)",
      landlordLine: "LINE ID арендодателя",
      landlordAddress: "Адрес арендодателя",
      juristicInfo: "Контакты управляющей компании",
      juristicInfoDesc: "Сохраните данные управляющей компании для уведомлений об обслуживании",
      juristicName: "Имя контактного лица",
      juristicEmail: "Email",
      juristicPhone: "Телефон (WhatsApp)",
      juristicLine: "LINE ID",
      saveContactInfo: "Сохранить контакты",
      connectLineOA: "Подключить к LINE OA",
      connectLineOADesc: "Поделитесь этой ссылкой, чтобы добавить их к уведомлениям Lease Shield",
      copyLink: "Скопировать ссылку",
      shareLink: "Поделиться ссылкой",
      linkCopied: "Ссылка скопирована!",
      orManualEntry: "Или введите LINE ID вручную",
      landlordLineConnect: "Подключить арендодателя к LINE",
      juristicLineConnect: "Подключить управляющую компанию к LINE",
      showQR: "Показать QR код",
      hideQR: "Скрыть QR код",
      scanQR: "Отсканируйте этот QR код в приложении LINE",
      buyCredits: "Купить кредиты писем",
      creditBalance: "Баланс кредитов",
      credits: "Кредиты",
      perCredit: "за кредит",
      buyNow: "Купить сейчас",
      bestValue: "Лучшее предложение",
      creditPacks: "Пакеты кредитов",
      oneLetterPerCredit: "1 письмо = 1 кредит",
      accessTemplateLibrary: "Доступ к библиотеке шаблонов",
      bilingual: "Двуязычные шаблоны",
      humanAndAiGeneration: "Создание людьми и ИИ",
      creditsNeverExpire: "Кредиты не истекают",
      purchaseCredits: "Купить кредиты",
      currentPlanFree: "Текущий план: Бесплатно",
      freeUpgradeText: "У вас базовое покрытие. Обновитесь до Lite, Protect или Secure для полной защиты депозитов и обслуживания.",
      chooseBillingInterval: "Выберите период оплаты",
      payMonthly: "Платить ежемесячно",
      payAnnually: "Платить ежегодно",
      annualSavings: "Экономия 17% в год",
      bestValueBadge: "Лучшее предложение",
      proceedToCheckout: "Перейти к оплате",
      upgradeToSecure: "Обновить до Secure",
      unlockPremium: "Разблокировать премиум функции",
      secureFeatures: "Неограниченные сканирования, приоритетная поддержка и 50 кредитов писем/месяц",
      managementOptions: "Опции управления",
      downgradeToFree: "Понизить до Бесплатного",
      keepProtectionActive: "Сохранить защиту активной?",
      retentionCopy: "Вы потеряете важные защитные функции при понижении. Вместо этого можно переключиться на более дешёвый план.",
      switchToLite: "Переключиться на Lite",
      continueToFree: "Продолжить на бесплатный план",
      confirmDowngradeTitle: "Понизить до бесплатного плана",
      confirmDowngradeWarning: "Вы потеряете неограниченные сканирования договоров, расширенные напоминания, дополнительные кредиты писем и другие премиум функции.",
      reasonForDowngrade: "Причина понижения",
      goBack: "Назад",
      confirmDowngradeBtn: "Подтвердить понижение до бесплатного",
      dataAndStorage: "Данные и хранилище",
      recycleBin: "Корзина",
      manageDeletedItems: "Управление удалёнными элементами",
      landlordLanguage: "Язык арендодателя",
      selectLandlordLanguage: "Выберите предпочтительный язык арендодателя",
      installApp: "Установить приложение Lease Shield",
      installAppDesc: "Добавьте на главный экран для быстрого доступа",
      shareApp: "Поделиться приложением с другом",
      shareAppDesc: "Пригласите других защитить свои депозиты",
      installInstructions: "Инструкция по установке",
      iosInstructions: "На iPhone/iPad:\n1. Нажмите кнопку Поделиться в Safari\n2. Нажмите 'На экран Домой'\n3. Нажмите 'Добавить'",
      androidInstructions: "На Android:\n1. Нажмите меню (⋮) в Chrome\n2. Нажмите 'Добавить на главный экран'\n3. Нажмите 'Добавить'",
      desktopInstructions: "На компьютере:\n1. Нажмите значок установки в адресной строке\n2. Или меню браузера > 'Установить Lease Shield'",
      gotIt: "Понятно",
      install: "Установить",
      alreadyInstalled: "Уже установлено",
      monthlyBillingAvailable: "Ежемесячная оплата доступна при оформлении",
      save17OnLite: "Экономия 17% на Lite",
      save17OnProtect: "Экономия 17% на Protect",
      save17OnSecure: "Экономия 17% на Secure",
      discountSubtext: "Скидка 17% — годовая оплата",
    }
  };

  const strings = (t && t[language] && typeof t[language] === 'object') ? t[language] : t.en;
  const currentPlan = PLAN_DETAILS.find(p => p.key === planTier);

  const lineQRCodeUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/81fb46460_M_gainfriends_2dbarcodes_GW.png";

  return (
    <div className="min-h-screen p-4 md:p-6 pb-36 md:pb-40 lg:pb-16 page-transition" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title={strings.pageTitle}
          subtitle={strings.pageSubtitle}
          icon={User}
          iconColor="#0C3B2E"
          colors={colors}
        />

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
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
                      border: isDarkMode ? '2px solid #C7A338' : '2px solid #0C3B2E',
                      backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
                      color: isDarkMode ? '#F9FAFB' : '#0C3B2E',
                      fontWeight: '700',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isDarkMode ? '0 2px 8px rgba(199,163,56,0.3)' : '0 2px 6px rgba(0,0,0,0.08)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#C7A338';
                      e.target.style.borderColor = '#C7A338';
                      e.target.style.color = '#FFFFFF';
                      e.target.style.boxShadow = '0 4px 12px rgba(199,163,56,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = isDarkMode ? '#374151' : '#FFFFFF';
                      e.target.style.borderColor = isDarkMode ? '#C7A338' : '#0C3B2E';
                      e.target.style.color = isDarkMode ? '#F9FAFB' : '#0C3B2E';
                      e.target.style.boxShadow = isDarkMode ? '0 2px 8px rgba(199,163,56,0.3)' : '0 2px 6px rgba(0,0,0,0.08)';
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
                        <p className="font-bold text-lg" style={{ color: colors.textPrimary }}>{user?.display_name || user?.full_name}</p>
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
                          {user?.language === 'th' ? 'ไทย (Thai)' : user?.language === 'zh' ? '中文 (Chinese)' : user?.language === 'ja' ? '日本語 (Japanese)' : user?.language === 'ko' ? '한국어 (Korean)' : user?.language === 'ru' ? 'Русский (Russian)' : 'English'}
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
                          {language === 'th' ? 'สว่าง' : language === 'ru' ? 'Светлая' : strings.lightMode}
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
                          {language === 'th' ? 'มืด' : language === 'ru' ? 'Тёмная' : strings.darkMode}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="full_name" className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                      <User className="w-4 h-4 text-ls-forest" />
                      {strings.fullName}
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      placeholder={language === 'th' ? 'ชื่อ-นามสกุลของคุณ' : language === 'ru' ? 'Ваше полное имя' : 'Your full name'}
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

                  <div>
                    <Label htmlFor="tenant_address" className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                      <Globe className="w-4 h-4 text-ls-gold" />
                      {strings.tenantAddress}
                    </Label>
                    <Input
                      id="tenant_address"
                      value={formData.tenant_address}
                      onChange={(e) => setFormData({...formData, tenant_address: e.target.value})}
                      placeholder={strings.tenantAddressPlaceholder}
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="tenant_city" className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                        {strings.tenantCity}
                      </Label>
                      <Input
                        id="tenant_city"
                        value={formData.tenant_city}
                        onChange={(e) => setFormData({...formData, tenant_city: e.target.value})}
                        placeholder={strings.tenantCityPlaceholder}
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
                    
                    <div>
                      <Label htmlFor="tenant_state" className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                        {strings.tenantState}
                      </Label>
                      <Input
                        id="tenant_state"
                        value={formData.tenant_state}
                        onChange={(e) => setFormData({...formData, tenant_state: e.target.value})}
                        placeholder={strings.tenantStatePlaceholder}
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
                    
                    <div>
                      <Label htmlFor="tenant_zip" className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                        {strings.tenantZip}
                      </Label>
                      <Input
                        id="tenant_zip"
                        value={formData.tenant_zip}
                        onChange={(e) => setFormData({...formData, tenant_zip: e.target.value})}
                        placeholder={strings.tenantZipPlaceholder}
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
                  </div>

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

                  <div>
                    <Label htmlFor="language" className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>{strings.language}</Label>
                    <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                      <SelectTrigger style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.borderColor }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: colors.cardBg, color: colors.textPrimary }}>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="th">ไทย (Thai)</SelectItem>
                        <SelectItem value="zh">中文 (Chinese)</SelectItem>
                        <SelectItem value="ja">日本語 (Japanese)</SelectItem>
                        <SelectItem value="ko">한국어 (Korean)</SelectItem>
                        <SelectItem value="ru">Русский (Russian)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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

          <section id="account-current-plan">
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
                    <PlanBadge tier={planTier} />
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
                    {isFreePlan ? (language === 'th' ? 'สำรวจ' : language === 'zh' ? '探索' : language === 'ja' ? '探索' : language === 'ko' ? '탐색' : language === 'ru' ? 'Обзор' : 'Explorer') : (currentPlan?.priceMonthly ? `฿${currentPlan?.priceMonthly}` : '—')}
                  </p>
                  {!isFreePlan && userBillingInterval && (
                    <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                      {userBillingInterval === 'annual' ? strings.billedAnnually : strings.billedMonthly}
                    </p>
                  )}
                  {user?.plan_renews_at && (
                    <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                      {isScheduledForCancellation ? strings.cancelScheduledFor : strings.renewsOn} {new Date(user.plan_renews_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                {isFreePlan ? (
                  <div className="space-y-3">
                    <div style={{ padding: '12px', backgroundColor: colors.fieldBg, borderRadius: '8px', borderLeft: '4px solid #C7A338' }}>
                      <p style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: '600', marginBottom: '8px' }}>
                        {language === 'th' ? 'บัญชีสำรวจ' : language === 'zh' ? '探索账户' : language === 'ja' ? '探索アカウント' : language === 'ko' ? '탐색 계정' : language === 'ru' ? 'Пробный аккаунт' : 'Explorer Account'}
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
                      onClick={() => document.getElementById('plan-selector')?.scrollIntoView({ behavior: 'smooth' })}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#C7A338'}
                    >
                      {strings.upgradeNow}
                    </button>
                  </div>
                ) : ( // This covers Lite, Protect, and Secure Plans
                  <div className="space-y-3">
                    <div style={{ padding: '12px', backgroundColor: colors.fieldBg, borderRadius: '8px', borderLeft: '4px solid #0C3B2E' }}>
                      <p className="text-sm flex items-center gap-2" style={{ color: colors.textPrimary }}>
                        <CheckCircle2 className="w-4 h-4 text-ls-forest" />
                        {strings.allActive}
                      </p>
                    </div>
                    {/* LINE reminders feature - only show for Protect and Secure */}
                    {(isProtectPlan || isSecurePlan) && (
                      <div style={{ padding: '12px', backgroundColor: colors.fieldBg, borderRadius: '8px', borderLeft: '4px solid #C7A338' }}>
                        <p className="text-xs flex items-center gap-1" style={{ color: colors.textPrimary }}>
                          <Bell className="w-3 h-3 text-ls-gold" />
                          {user?.line_messaging_token 
                            ? (language === 'th' ? 'การแจ้งเตือน LINE เปิดใช้งาน' : language === 'zh' ? 'LINE提醒已启用' : language === 'ja' ? 'LINEリマインダーが有効' : language === 'ko' ? 'LINE 알림 활성화됨' : language === 'ru' ? 'Напоминания LINE включены' : 'LINE reminders enabled')
                            : (language === 'th' ? 'การแจ้งเตือน LINE พร้อมใช้งาน' : language === 'zh' ? 'LINE提醒可用' : language === 'ja' ? 'LINEリマインダー利用可能' : language === 'ko' ? 'LINE 알림 사용 가능' : language === 'ru' ? 'Напоминания LINE доступны' : 'LINE reminders available')
                          }
                        </p>
                      </div>
                    )}
                    
                    <button
                      onClick={() => { haptic.medium(); if (plansSectionRef.current) plansSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                      className="btn-interaction"
                      style={{ width: '100%', padding: '12px 16px', backgroundColor: '#0C3B2E', color: '#FFFFFF', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                    >
                      <Settings className="w-4 h-4" />
                      {language === 'th' ? 'จัดการแผน' : language === 'ru' ? 'Управление планом' : 'Manage Plan'}
                    </button>

                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="mb-6">
          <LineConnectionStatus user={user} colors={colors} />
        </div>

        {/* Referral Program */}
        <div className="mb-6" id="referral-section">
          <ReferralCard user={user} colors={colors} language={language} />
        </div>

        <div className="mb-6" id="notification-preferences">
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => {
                haptic.light();
                setExpandedNotifPrefs(!expandedNotifPrefs);
              }}
              style={{ borderBottom: expandedNotifPrefs ? `1px solid ${colors.borderColor}` : 'none' }}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <Bell className="w-5 h-5 text-ls-forest" />
                  {strings.notificationPreferences}
                </CardTitle>
                {expandedNotifPrefs ? <ChevronUp className="w-5 h-5" style={{ color: colors.textSecondary }} /> : <ChevronDown className="w-5 h-5" style={{ color: colors.textSecondary }} />}
              </div>
            </CardHeader>
            {expandedNotifPrefs && (
              <CardContent className="p-6">
                <NotificationPreferences 
                  user={user} 
                  onUpdate={handleNotificationUpdate}
                  colors={colors}
                />
              </CardContent>
            )}
          </Card>
        </div>



        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
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
                  </div>
                </div>
              </div>
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
                  placeholder={language === 'th' ? 'ชื่อเจ้าของบ้าน' : language === 'ru' ? 'Имя арендодателя' : 'Landlord name'}
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
                  placeholder={language === 'th' ? 'ที่อยู่เจ้าของบ้าน' : language === 'ru' ? 'Адрес арендодателя' : 'Landlord address'}
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
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleLandlordUpdate}
                disabled={updateProfileMutation.isPending}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: 'none',
                  backgroundColor: updateProfileMutation.isPending ? '#9CA3AF' : '#0C3B2E',
                  color: '#FFFFFF',
                  cursor: updateProfileMutation.isPending ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 6px rgba(12, 59, 46, 0.3)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: updateProfileMutation.isPending ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!updateProfileMutation.isPending) {
                    e.target.style.backgroundColor = '#C7A338';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 8px rgba(199, 163, 56, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!updateProfileMutation.isPending) {
                    e.target.style.backgroundColor = '#0C3B2E';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px rgba(12, 59, 46, 0.3)';
                  }
                }}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {language === 'th' ? 'กำลังบันทึก...' : language === 'ru' ? 'Сохранение...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {strings.saveContactInfo}
                  </>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
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
                  </div>
                </div>
              </div>
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
                  placeholder={language === 'th' ? 'ชื่อผู้ติดต่อ' : language === 'ru' ? 'Имя контактного лица' : 'Contact name'}
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
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleJuristicUpdate}
                disabled={updateProfileMutation.isPending}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: 'none',
                  backgroundColor: updateProfileMutation.isPending ? '#9CA3AF' : '#C7A338',
                  color: updateProfileMutation.isPending ? '#FFFFFF' : '#1A1D1F',
                  cursor: updateProfileMutation.isPending ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 6px rgba(199, 163, 56, 0.3)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: updateProfileMutation.isPending ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!updateProfileMutation.isPending) {
                    e.target.style.backgroundColor = '#0C3B2E';
                    e.target.style.color = '#FFFFFF';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 8px rgba(12, 59, 46, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!updateProfileMutation.isPending) {
                    e.target.style.backgroundColor = '#C7A338';
                    e.target.style.color = '#1A1D1F';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px rgba(199, 163, 56, 0.3)';
                  }
                }}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {language === 'th' ? 'กำลังบันทึก...' : language === 'ru' ? 'Сохранение...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {strings.saveContactInfo}
                  </>
                )}
              </button>
            </div>
          </CardContent>
        </Card>



        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Database className="w-5 h-5 text-ls-forest" />
              {strings.dataAndStorage || (language === 'th' ? 'ข้อมูลและพื้นที่จัดเก็บ' : language === 'zh' ? '数据与存储' : language === 'ja' ? 'データとストレージ' : language === 'ko' ? '데이터 및 저장소' : language === 'ru' ? 'Данные и хранилище' : 'Data & Storage')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Link to={createPageUrl("RecycleBin")}>
              <div
                style={{
                  padding: '16px',
                  backgroundColor: colors.fieldBg,
                  borderRadius: '12px',
                  borderLeft: '4px solid #6B7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#F3F4F6';
                  e.currentTarget.style.borderLeftColor = '#C7A338';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.fieldBg;
                  e.currentTarget.style.borderLeftColor = '#6B7280';
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Trash2 className="w-5 h-5" style={{ color: '#6B7280' }} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: colors.textPrimary, opacity: 1 }}>
                        {strings.recycleBin || (language === 'th' ? 'ถังขยะ' : language === 'zh' ? '回收站' : language === 'ja' ? 'ゴミ箱' : language === 'ko' ? '휴지통' : language === 'ru' ? 'Корзина' : 'Recycle Bin')}
                      </p>
                      <p className="text-sm" style={{ color: colors.textSecondary, opacity: 1 }}>
                        {strings.manageDeletedItems || (language === 'th' ? 'จัดการรายการที่ลบ' : language === 'zh' ? '管理已删除项目' : language === 'ja' ? '削除されたアイテムを管理' : language === 'ko' ? '삭제된 항목 관리' : language === 'ru' ? 'Управление удалёнными элементами' : 'Manage deleted items')}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5" style={{ color: colors.textSecondary }} />
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Download className="w-5 h-5 text-ls-forest" />
              {language === 'th' ? 'แอปและการแชร์' : language === 'zh' ? '应用与分享' : language === 'ja' ? 'アプリと共有' : language === 'ko' ? '앱 및 공유' : language === 'ru' ? 'Приложение и обмен' : 'App & Sharing'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {isAdmin && (
                <div
                  onClick={async () => {
                    haptic.medium();
                    try {
                      const response = await base44.functions.invoke('generateUserManual');
                      const blob = new Blob([response.data], { 
                        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
                      });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'LeaseShield_User_Manual_v1.0.docx';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      toast.success(language === 'th' ? 'ดาวน์โหลดคู่มือผู้ใช้แล้ว' : 'User manual downloaded');
                      haptic.success();
                    } catch (error) {
                      console.error('Manual download failed:', error);
                      toast.error(language === 'th' ? 'ไม่สามารถดาวน์โหลดคู่มือได้' : 'Failed to download manual');
                      haptic.error();
                    }
                  }}
                  style={{
                    padding: '16px',
                    backgroundColor: colors.fieldBg,
                    borderRadius: '12px',
                    borderLeft: '4px solid #3B82F6',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#F3F4F6';
                    e.currentTarget.style.borderLeftColor = '#C7A338';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.fieldBg;
                    e.currentTarget.style.borderLeftColor = '#3B82F6';
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#3B82F6',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: colors.textPrimary, marginBottom: '2px' }}>
                          {language === 'th' ? 'คู่มือผู้ใช้ Lease Shield' : language === 'zh' ? 'Lease Shield 用户手册' : language === 'ja' ? 'Lease Shield ユーザーマニュアル' : language === 'ko' ? 'Lease Shield 사용자 매뉴얼' : language === 'ru' ? 'Руководство пользователя Lease Shield' : 'Lease Shield User Manual'}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: colors.textSecondary }}>
                          {language === 'th' ? 'ดาวน์โหลดคู่มือฉบับเต็ม (DOCX)' : language === 'zh' ? '下载完整手册 (DOCX)' : language === 'ja' ? '完全版マニュアルをダウンロード (DOCX)' : language === 'ko' ? '전체 매뉴얼 다운로드 (DOCX)' : language === 'ru' ? 'Скачать полное руководство (DOCX)' : 'Download complete guide (DOCX)'}
                        </div>
                      </div>
                    </div>
                    <Download className="w-5 h-5" style={{ color: colors.textPrimary }} />
                  </div>
                </div>
              )}
              <div
                onClick={handleInstallApp}
                style={{
                  padding: '16px',
                  backgroundColor: colors.fieldBg,
                  borderRadius: '12px',
                  borderLeft: '4px solid #0C3B2E',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#F3F4F6';
                  e.currentTarget.style.borderLeftColor = '#C7A338';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.fieldBg;
                  e.currentTarget.style.borderLeftColor = '#0C3B2E';
                }}
              >
                <div className="flex items-center justify-between">
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
                      <Download className="w-5 h-5 text-white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: colors.textPrimary, marginBottom: '2px' }}>
                        {language === 'th' ? 'ติดตั้งแอป Lease Shield' : language === 'zh' ? '安装 Lease Shield 应用' : language === 'ja' ? 'Lease Shield アプリをインストール' : language === 'ko' ? 'Lease Shield 앱 설치' : language === 'ru' ? 'Установить приложение Lease Shield' : 'Install Lease Shield App'}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: colors.textSecondary }}>
                        {language === 'th' ? 'เพิ่มลงในหน้าจอหลักเพื่อเข้าถึงง่ายๆ' : language === 'zh' ? '添加到主屏幕以便快速访问' : language === 'ja' ? 'ホーム画面に追加して素早くアクセス' : language === 'ko' ? '빠른 액세스를 위해 홈 화면에 추가' : language === 'ru' ? 'Добавьте на главный экран для быстрого доступа' : 'Add to home screen for quick access'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5" style={{ color: colors.textPrimary }} />
                </div>
              </div>

              <div
                onClick={handleShareApp}
                style={{
                  padding: '16px',
                  backgroundColor: colors.fieldBg,
                  borderRadius: '12px',
                  borderLeft: '4px solid #C7A338',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#F3F4F6';
                  e.currentTarget.style.borderLeftColor = '#0C3B2E';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.fieldBg;
                  e.currentTarget.style.borderLeftColor = '#C7A338';
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: appLinkCopied ? '#10B981' : '#C7A338',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}>
                      {appLinkCopied ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <Share2 className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: colors.textPrimary, marginBottom: '2px' }}>
                        {language === 'th' ? 'แชร์แอปกับเพื่อน' : language === 'zh' ? '与朋友分享应用' : language === 'ja' ? '友達とアプリを共有' : language === 'ko' ? '친구와 앱 공유' : language === 'ru' ? 'Поделиться приложением с другом' : 'Share App with Friends'}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: colors.textSecondary }}>
                        {language === 'th' ? 'ชวนคนอื่นมาป้องกันเงินมัดจำของพวกเขา' : language === 'zh' ? '邀请他人保护他们的押金' : language === 'ja' ? '他の人に敷金保護を勧める' : language === 'ko' ? '다른 사람들이 보증금을 보호하도록 초대' : language === 'ru' ? 'Пригласите других защитить свои депозиты' : 'Invite others to protect their deposits'}
                      </div>
                    </div>
                  </div>
                  {appLinkCopied ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ArrowRight className="w-5 h-5" style={{ color: colors.textSecondary }} />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showInstallInstructions} onOpenChange={setShowInstallInstructions}>
          <DialogContent style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.borderColor,
            maxWidth: '500px',
            width: '95vw'
          }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>
                {strings.installInstructions}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div 
                className="p-4 rounded-lg relative"
                style={{
                  backgroundColor: isDarkMode ? '#2A2D30' : '#F9FAFB',
                  borderLeft: '4px solid #9CA3AF',
                  opacity: 1
                }}
              >
                <div className="absolute top-3 right-3">
                  <Badge className="bg-gray-500 text-white text-xs">
                    {language === 'th' ? 'เร็วๆ นี้' : language === 'zh' ? '即将推出' : language === 'ja' ? '近日公開' : language === 'ko' ? '곧 출시' : language === 'ru' ? 'Скоро' : 'Coming Soon'}
                  </Badge>
                </div>
                <p className="font-semibold mb-2" style={{ color: '#9CA3AF' }}>📱 iOS (Safari)</p>
                <p className="text-sm whitespace-pre-line" style={{ color: '#9CA3AF' }}>
                  {strings.iosInstructions}
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{
                backgroundColor: colors.fieldBg,
                borderLeft: '4px solid #10B981'
              }}>
                <p className="font-semibold mb-2" style={{ color: colors.textPrimary }}>🤖 Android (Chrome)</p>
                <p className="text-sm whitespace-pre-line" style={{ color: colors.textSecondary }}>
                  {strings.androidInstructions}
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{
                backgroundColor: colors.fieldBg,
                borderLeft: '4px solid #8B5CF6'
              }}>
                <p className="font-semibold mb-2" style={{ color: colors.textPrimary }}>💻 Desktop</p>
                <p className="text-sm whitespace-pre-line" style={{ color: colors.textSecondary }}>
                  {strings.desktopInstructions}
                </p>
              </div>
              <Button
                onClick={() => {
                  haptic.light();
                  setShowInstallInstructions(false);
                }}
                className="w-full btn-interaction"
                style={{
                  backgroundColor: '#0C3B2E',
                  color: '#C9A227',
                  minHeight: '52px',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#084D38';
                  e.currentTarget.style.color = '#D9BC7E';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0C3B2E';
                  e.currentTarget.style.color = '#C9A227';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {strings.gotIt}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
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
                      <p className="font-semibold" style={{ color: colors.textPrimary, opacity: 1 }}>{strings.privacyPolicy}</p>
                      <p className="text-sm" style={{ color: colors.textSecondary, opacity: 1 }}>{strings.privacyDesc}</p>
                    </div>
                  </div>
                  <a
                    href="https://www.leaseshield.asia/legal#privacy"
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
                      textDecoration: 'none',
                      cursor: 'pointer',
                      display: 'inline-block',
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
                  </a>
                </div>
              </div>

              <div
                onClick={() => {
                  if (!exporting) {
                    setShowExportDialog(true);
                    haptic.light();
                  }
                }}
                style={{
                  padding: '16px',
                  backgroundColor: colors.fieldBg,
                  borderRadius: '12px',
                  borderLeft: '4px solid #C7A338',
                  cursor: exporting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: exporting ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!exporting) {
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#F3F4F6';
                    e.currentTarget.style.borderLeftColor = '#0C3B2E';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!exporting) {
                    e.currentTarget.style.backgroundColor = colors.fieldBg;
                    e.currentTarget.style.borderLeftColor = '#C7A338';
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: exporting ? '#9CA3AF' : '#C7A338',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}>
                      {exporting ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Download className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <p className="font-semibold text-base" style={{ color: colors.textPrimary, opacity: 1 }}>{strings.exportData}</p>
                      <p className="text-sm" style={{ color: colors.textSecondary, opacity: 1 }}>{strings.exportDesc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5" style={{ color: colors.textSecondary }} />
                </div>
              </div>

              <div
                onClick={() => {
                  haptic.medium();
                  setShowDeleteAccountModal(true);
                }}
                style={{
                  padding: '16px',
                  backgroundColor: isDarkMode ? '#2A2020' : '#FEF2F2',
                  borderRadius: '12px',
                  border: '2px solid #DC2626',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? '#3A1010' : '#FEE2E2';
                  e.currentTarget.style.borderColor = '#EF4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? '#2A2020' : '#FEF2F2';
                  e.currentTarget.style.borderColor = '#DC2626';
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#DC2626',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Trash2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold mb-2" style={{ color: isDarkMode ? '#FCA5A5' : '#991B1B' }}>
                        {language === 'th' ? 'ลบบัญชีอย่างถาวร' : language === 'zh' ? '永久删除账户' : language === 'ja' ? 'アカウントを完全に削除' : language === 'ko' ? '계정 영구 삭제' : language === 'ru' ? 'Удалить аккаунт навсегда' : 'Delete Account Permanently'}
                      </p>
                      <p className="text-sm" style={{ color: isDarkMode ? '#FCA5A5' : '#991B1B', lineHeight: '1.5' }}>
                        {language === 'th' 
                          ? 'ลบข้อมูลทั้งหมดและบัญชีของคุณอย่างถาวร การกระทำนี้ไม่สามารถยกเลิกได้'
                          : language === 'zh'
                            ? '永久删除您的所有数据和账户。此操作无法撤销。'
                            : language === 'ja'
                              ? 'すべてのデータとアカウントを完全に削除します。この操作は元に戻せません。'
                              : language === 'ko'
                                ? '모든 데이터와 계정을 영구적으로 삭제합니다. 이 작업은 취소할 수 없습니다.'
                                : language === 'ru'
                                  ? 'Окончательно удалите все ваши данные и аккаунт. Это действие нельзя отменить.'
                                  : 'Permanently delete all your data and account. This action cannot be undone.'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: '#DC2626' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RETENTION MODAL - 2-step cancel/downgrade with reason capture */}
        <RetentionModal
          isOpen={showRetentionModal}
          onClose={() => setShowRetentionModal(false)}
          user={user}
          onSubscribe={(tierKey, interval) => handleSubscribe(tierKey, interval)}
          colors={colors}
          isDarkMode={isDarkMode}
        />

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

        {isFreePlan && (
          <div
            id="plans-intro"
            style={{
              marginBottom: 24,
              padding: 20,
              borderRadius: 16,
              backgroundColor: isDarkMode ? 'rgba(199,163,56,0.15)' : 'rgba(199,163,56,0.08)',
              border: '2px solid rgba(199,163,56,0.25)',
              boxShadow: '0 4px 6px rgba(199,163,56,0.1)'
            }}
            >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>
                  {language === 'th' ? 'กำลังสำรวจอยู่' : language === 'zh' ? '当前探索中' : language === 'ja' ? '探索中' : language === 'ko' ? '탐색 중' : language === 'ru' ? 'Режим обзора' : 'Exploring Features'}
                </h3>
                <p style={{ fontSize: '0.9rem', marginBottom: 12, color: colors.textPrimary, lineHeight: 1.5 }}>
                  {language === 'th' ? 'คุณอยู่ในบัญชีสำรวจ อัปเกรดเป็น Lite, Protect หรือ Secure เพื่อการป้องกันเงินมัดจำและการซ่อมบำรุงเต็มรูปแบบ' :
                   language === 'zh' ? '您正在使用探索账户。升级到 Lite、Protect 或 Secure 以获得完整的押金和维护保护。' :
                   language === 'ja' ? '探索アカウントを使用中。完全な預金およびメンテナンス保護のために、Lite、Protect、またはSecureにアップグレードしてください。' :
                   language === 'ko' ? '탐색 계정을 사용 중입니다. 완전한 보증금 및 유지보수 보호를 위해 Lite, Protect 또는 Secure로 업그레이드하세요.' :
                   language === 'ru' ? 'Вы используете пробный аккаунт. Обновитесь до Lite, Protect или Secure для полной защиты депозита и обслуживания.' :
                   'You\'re exploring with a preview account. Upgrade to Lite, Protect, or Secure for full deposit and maintenance protection.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                haptic.medium();
                const el = document.getElementById('plan-selector');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-interaction"
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                backgroundColor: '#C7A338',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(199,163,56,0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#0C3B2E';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#C7A338';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {strings.upgradeNow}
            </button>
          </div>
        )}

        {/* One-Time Lease Scan — Standalone Product */}
        <Card className="mb-6 border-none shadow-xl overflow-hidden" style={{
          backgroundColor: colors.cardBg,
          border: `2px solid ${isDarkMode ? 'rgba(59,130,246,0.3)' : '#3B82F6'}`
        }}>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                  flexShrink: 0
                }}>
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg sm:text-xl font-bold" style={{ color: colors.textPrimary }}>
                      {language === 'th' ? 'การสแกนสัญญาเช่าครั้งเดียว' : language === 'zh' ? '一次性租约扫描' : language === 'ja' ? '一回限りリーススキャン' : language === 'ko' ? '일회성 임대 계약 스캔' : language === 'ru' ? 'Однократное сканирование договора' : 'One-Time Lease Scan'}
                    </h3>
                    <Badge className="bg-blue-100 text-blue-700 text-xs font-bold">
                      {language === 'th' ? 'ครั้งเดียว' : language === 'zh' ? '一次性' : language === 'ja' ? '一回限り' : language === 'ko' ? '일회성' : language === 'ru' ? 'Разово' : 'One-time'}
                    </Badge>
                  </div>
                  <p className="text-base sm:text-lg font-bold mb-3" style={{ color: '#3B82F6' }}>
                    ฿590 {language === 'th' ? '(ชำระครั้งเดียว)' : language === 'zh' ? '(一次性付款)' : language === 'ja' ? '(一回払い)' : language === 'ko' ? '(일회 결제)' : language === 'ru' ? '(одноразовый платёж)' : '(one-time payment)'}
                  </p>
                  <ul className="space-y-1.5 text-sm" style={{ color: colors.textPrimary }}>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                      <span>{language === 'th' ? 'อัปโหลด 1 ครั้ง + วิเคราะห์ด้วย AI' : language === 'zh' ? '1次上传 + AI分析' : language === 'ja' ? '1アップロード + AI分析' : language === 'ko' ? '1회 업로드 + AI 분석' : language === 'ru' ? '1 загрузка + AI-анализ' : '1 upload + AI scan'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                      <span>{language === 'th' ? 'สรุปโดยผู้เชี่ยวชาญ 1 ฉบับ' : language === 'zh' ? '1份专家审核摘要' : language === 'ja' ? '専門家による1件のレビュー' : language === 'ko' ? '전문가 검토 요약 1건' : language === 'ru' ? '1 экспертный обзор' : '1 human-reviewed summary'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                      <span>{language === 'th' ? 'คะแนนความเสี่ยง 1-100' : language === 'zh' ? '风险评分1-100' : language === 'ja' ? 'リスク評価1-100' : language === 'ko' ? '위험 점수 1-100' : language === 'ru' ? 'Оценка риска 1-100' : 'Risk rating 1-100'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                      <span>{language === 'th' ? 'ความเสี่ยง 5 อันดับแรก' : language === 'zh' ? '前5大风险' : language === 'ja' ? 'トップ5リスク' : language === 'ko' ? '상위 5개 위험' : language === 'ru' ? 'Топ-5 рисков' : 'Top 5 risk highlights'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                      <span>{language === 'th' ? 'ขั้นตอนแนะนำ 5 ข้อ' : language === 'zh' ? '5项建议行动' : language === 'ja' ? '5つの推奨アクション' : language === 'ko' ? '5가지 권장 조치' : language === 'ru' ? '5 рекомендаций' : '5 recommended actions'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                      <span>{language === 'th' ? 'เทมเพลตจดหมาย 1 ฉบับ (ถ้าจำเป็น)' : language === 'zh' ? '1个信件模板（如需）' : language === 'ja' ? '1レターテンプレート（必要時）' : language === 'ko' ? '1개 편지 템플릿（필요시）' : language === 'ru' ? '1 шаблон письма（при необходимости）' : '1 letter template (if needed)'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                      <span>{language === 'th' ? 'ถามชี้แจงเพิ่มเติม 1 คำถาม' : language === 'zh' ? '1次后续澄清问题' : language === 'ja' ? '1件のフォローアップ質問' : language === 'ko' ? '후속 확인 질문 1개' : language === 'ru' ? '1 уточняющий вопрос' : '1 follow-up clarification'}</span>
                    </li>
                  </ul>
                  <p className="text-xs mt-3 italic" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'ไม่มีการสมัครสมาชิก ไม่มีการแจ้งเตือนอัตโนมัติ ไม่มีพื้นที่จัดเก็บ' : language === 'zh' ? '无订阅，无自动提醒，无存储空间' : language === 'ja' ? 'サブスクなし、自動リマインダーなし、ストレージなし' : language === 'ko' ? '구독 없음, 자동 알림 없음, 저장소 없음' : language === 'ru' ? 'Без подписки, без автоматических напоминаний, без хранилища' : 'No subscription. No reminders. No storage.'}
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  haptic.medium();
                  try {
                    const response = await base44.functions.invoke('createCheckout', {
                      mode: 'payment',
                      amount: 590,
                      currency: 'thb',
                      description: 'One-Time Lease Scan',
                      successUrl: `${window.location.origin}/uploadscan?payment=success&type=one_time_scan`,
                      cancelUrl: `${window.location.origin}/account?payment=cancelled`,
                      metadata: {
                        type: 'one_time_scan',
                        userId: user.id,
                        email: user.email
                      }
                    });
                    
                    if (response.data?.url) {
                      window.location.href = response.data.url;
                    }
                  } catch (error) {
                    console.error('One-time scan checkout error:', error);
                    alert(language === 'th' ? 'ไม่สามารถสร้างการชำระเงินได้ กรุณาลองอีกครั้ง' : 'Failed to create checkout. Please try again.');
                  }
                }}
                className="btn-interaction w-full sm:w-auto"
                style={{
                  padding: '14px 32px',
                  borderRadius: '12px',
                  backgroundColor: '#0F4229',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(15,66,41,0.3)',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#0a2f1e';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(15,66,41,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#0F4229';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(15,66,41,0.3)';
                }}
              >
                {language === 'th' ? 'ซื้อการสแกนครั้งเดียว' : language === 'zh' ? '购买一次性扫描' : language === 'ja' ? '一回スキャンを購入' : language === 'ko' ? '일회 스캔 구매' : language === 'ru' ? 'Купить одноразовое сканирование' : 'Get One-Time Scan'}
              </button>
            </div>
          </CardContent>
        </Card>

        <section id="plan-selector" ref={plansSectionRef}>
          <div className="mb-6">

            <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: colors.textPrimary }}>{strings.choosePlan}</h2>
            <p className="mb-3 text-center" style={{ color: colors.textSecondary }}>{strings.planDesc}</p>
            <p className="mb-6 text-center text-sm" style={{ color: '#10B981', fontWeight: '600' }}>
              {strings.monthlyBillingAvailable}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PLAN_DETAILS.filter(plan => plan.key !== 'free').map((plan) => {
                const Icon = plan.icon;
                const isCurrentPlan = planTier === plan.key;
                const isFreeplanLocal = plan.key === 'free';
                const isSecureTierLocal = plan.key === 'secure';
                const isLiteTierLocal = plan.key === 'lite';
                const isSubscribingForPlan = subscribing[plan.key];
                
                // Check if pricing is available
                const pricingData = PRICING[plan.key];
                const hasPricing = !isFreeplanLocal && pricingData;
                
                return (
                  <div
                    key={plan.key}
                    className={`card-interactive relative border-2 ${
                      plan.popular ? 'border-amber-400 shadow-lg' : ''
                    } ${isSecureTierLocal ? 'shadow-xl' : ''}`}
                    style={{
                      backgroundColor: isSecureTierLocal 
                        ? (isDarkMode ? '#1A2E27' : '#F0FDF4')
                        : isLiteTierLocal
                          ? (isDarkMode ? '#1C2D28' : '#F0FDF9')
                          : plan.popular 
                            ? (isDarkMode ? '#2D2520' : '#FFFBEB')
                            : colors.cardBg,
                      borderColor: isSecureTierLocal ? '#0C3B2E' : isLiteTierLocal ? '#047857' : plan.popular ? '#C7A338' : colors.borderColor,
                      borderWidth: isSecureTierLocal ? '3px' : '2px',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: '580px'
                    }}
                  >
                    <div style={{ height: '24px', marginBottom: '12px' }}>
                      {plan.popular && (
                        <Badge className="bg-amber-500 text-white text-xs font-bold w-full justify-center whitespace-nowrap" style={{ padding: '4px 8px' }}>
                          ⭐ {strings.mostPopular}
                        </Badge>
                      )}
                      {billingPeriod === 'annual' && !isFreeplanLocal && !plan.popular && !isSecureTierLocal && (
                        <Badge className="bg-emerald-500 text-white text-xs font-bold w-full justify-center whitespace-nowrap" style={{ padding: '4px 8px' }}>
                          🏷️ {strings.monthsFree}
                        </Badge>
                      )}
                      {isSecureTierLocal && (
                        <Badge className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white text-xs font-bold w-full justify-center whitespace-nowrap" style={{ padding: '4px 8px' }}>
                          👑 {language === 'th' ? 'พรีเมียม' : language === 'zh' ? '高级版' : language === 'ja' ? 'プレミアム' : language === 'ko' ? '프리미엄' : language === 'ru' ? 'ПРЕМИУМ' : 'PREMIUM'}
                        </Badge>
                      )}
                    </div>

                    <div className="text-center" style={{ height: '100px', marginBottom: '12px' }}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: isSecureTierLocal ? '#0C3B2E' : isLiteTierLocal ? '#047857' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon className="w-6 h-6" style={{ color: (isSecureTierLocal || isLiteTierLocal) ? '#FFFFFF' : plan.bgColor }} />
                        </div>
                        <h3 className="text-xl font-bold" style={{ color: isSecureTierLocal ? '#0C3B2E' : colors.textPrimary }}>
                          {plan.label}
                        </h3>
                      </div>
                      <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                        {language === 'th' ? plan.taglineTh : language === 'zh' ? plan.taglineZh : language === 'ja' ? plan.taglineJa : language === 'ko' ? plan.taglineKo : language === 'ru' ? plan.taglineRu : plan.tagline}
                      </p>
                      <p className="text-xs line-clamp-2" style={{ color: colors.textSecondary }}>
                        {language === 'th' ? plan.descriptionTh : language === 'zh' ? plan.descriptionZh : language === 'ja' ? plan.descriptionJa : language === 'ko' ? plan.descriptionKo : language === 'ru' ? plan.descriptionRu : plan.description}
                      </p>
                    </div>

                    <div className="text-center" style={{ height: '140px', marginBottom: '12px' }}>
                      {isFreeplanLocal ? (
                        <>
                          <div className="text-3xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                            {language === 'th' ? 'สำรวจ' : language === 'zh' ? '探索' : language === 'ja' ? '探索' : language === 'ko' ? '탐색' : language === 'ru' ? 'Обзор' : 'Explorer'}
                          </div>
                          <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                            {strings.noCreditCard}
                          </p>
                        </>
                      ) : hasPricing ? (
                        <>
                          {/* Show annual-equivalent monthly price */}
                          <div className="mb-2">
                            <div className="text-3xl font-bold" style={{ color: isSecureTierLocal ? '#0C3B2E' : '#C7A338' }}>
                              ฿{Math.round(plan.priceAnnual / 12)}
                            </div>
                            <div className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                              {language === 'th' ? '/ เดือน' : language === 'zh' ? '/ 月' : language === 'ja' ? '/ 月' : language === 'ko' ? '/ 월' : language === 'ru' ? '/ месяц' : '/ month'}
                            </div>
                          </div>
                          <div className="pt-2" style={{ borderTop: `1px solid ${colors.borderColor}` }}>
                            <p className="text-xs font-semibold" style={{ color: '#10B981' }}>
                              {strings.discountSubtext}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm font-semibold" style={{ color: '#EF4444' }}>
                          {language === 'th' ? 'ราคาไม่พร้อมใช้งานชั่วคราว' : 'Pricing temporarily unavailable'}
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, marginBottom: '12px' }}>
                      <ul className="space-y-2">
                        {(language === 'th' ? plan.benefitsTh : language === 'zh' ? plan.benefitsZh : language === 'ja' ? plan.benefitsJa : language === 'ko' ? plan.benefitsKo : language === 'ru' ? plan.benefitsRu : plan.benefits).map((benefit, idx) => {
                          const isBold = benefit.startsWith('Everything in') || benefit.startsWith('ทุกอย่างใน') || benefit.startsWith('Все из') || benefit.startsWith('包含') || benefit.startsWith('の全て') || benefit.startsWith('플랜의 모든');
                          return (
                            <li key={idx} className="flex items-start gap-2 text-xs" style={{ color: colors.textPrimary }}>
                              <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: (isSecureTierLocal || isLiteTierLocal) ? '#0C3B2E' : '#0C3B2E' }} />
                              <span style={{ fontWeight: isBold ? 'bold' : 'normal' }}>{benefit}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div className="mt-auto">
                      {isCurrentPlan ? (
                        <Button
                          disabled
                          className="w-full h-10 text-sm btn-interaction"
                          style={{
                            backgroundColor: colors.fieldBg,
                            color: colors.textSecondary,
                            cursor: 'not-allowed',
                            border: `2px solid ${colors.borderColor}`
                          }}
                        >
                          {strings.currentPlanBadge}
                        </Button>
                      ) : isFreeplanLocal && !isFreePlan ? (
                        <Button
                          onClick={() => {
                            haptic.medium();
                            handleDowngradeOrCancel();
                          }}
                          className="w-full h-10 text-sm btn-interaction"
                          style={{
                            backgroundColor: 'transparent',
                            color: '#EF4444',
                            cursor: 'pointer',
                            border: `2px solid #EF4444`,
                            fontWeight: '600'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(239,68,68,0.1)' : '#FEE2E2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {strings.downgradeToFree}
                        </Button>
                      ) : isFreeplanLocal ? (
                        <Button
                          disabled
                          className="w-full h-10 text-sm btn-interaction"
                          style={{
                            backgroundColor: colors.cardBg,
                            color: colors.textSecondary,
                            cursor: 'not-allowed',
                            border: `2px solid ${colors.textSecondary}`
                          }}
                        >
                          {language === 'th' ? 'ลงทะเบียนเพื่อสำรวจ' : language === 'zh' ? '注册探索' : language === 'ja' ? '登録して探索' : language === 'ko' ? '등록하여 탐색' : language === 'ru' ? 'Зарегистрироваться' : 'Sign Up to Explore'}
                        </Button>
                      ) : !hasPricing ? (
                        <Button
                          disabled
                          className="w-full h-10 text-sm btn-interaction"
                          style={{
                            backgroundColor: '#9CA3AF',
                            color: '#FFFFFF',
                            cursor: 'not-allowed',
                            opacity: 0.6
                          }}
                        >
                          {language === 'th' ? 'ไม่พร้อมใช้งานชั่วคราว' : 'Temporarily Unavailable'}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            haptic.medium();
                            handleSubscribe(plan.key, 'annual');
                          }}
                          disabled={isSubscribingForPlan}
                          className="w-full h-10 btn-interaction"
                          style={{
                            backgroundColor: isSubscribingForPlan ? '#9CA3AF' : (isSecureTierLocal ? '#0C3B2E' : isLiteTierLocal ? '#047857' : plan.popular ? '#C7A338' : '#0C3B2E'),
                            color: '#FFFFFF',
                            cursor: isSubscribingForPlan ? 'not-allowed' : 'pointer',
                            opacity: isSubscribingForPlan ? 0.7 : 1,
                            fontSize: isSecureTierLocal ? '14px' : '13px',
                            fontWeight: isSecureTierLocal ? '700' : '600'
                          }}
                        >
                          {isSubscribingForPlan ? strings.processing : (
                            plan.key === 'lite' ? strings.save17OnLite :
                            plan.key === 'protect' ? strings.save17OnProtect :
                            plan.key === 'secure' ? strings.save17OnSecure :
                            `${strings.startPlan} ${plan.label}`
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subtle cancel subscription link */}
          {!isFreePlan && (
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <p style={{ fontSize: "12px", color: colors.textSecondary }}>
                {language === 'th' ? 'ต้องการยกเลิกการสมัครสมาชิก?' : language === 'zh' ? '需要取消订阅吗？' : language === 'ja' ? 'サブスクリプションをキャンセルする必要がありますか？' : language === 'ko' ? '구독을 취소해야 합니까？' : language === 'ru' ? 'Нужно отменить подписку?' : 'Need to cancel your subscription?'}{" "}
                <button
                  type="button"
                  onClick={() => { base44.analytics.track({ eventName: 'cancellation_initiated', properties: { current_tier: planTier } }); setShowRetentionModal(true); }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    cursor: "pointer",
                    color: "#0C3B2E",
                    textDecoration: "underline",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  {language === 'th' ? 'จัดการหรือยกเลิกการสมัครสมาชิก' : language === 'zh' ? '管理或取消订阅' : language === 'ja' ? 'サブスクリプションを管理またはキャンセル' : language === 'ko' ? '구독 관리 또는 취소' : language === 'ru' ? 'Управление или отмена подписки' : 'Manage or cancel subscription'}
                </button>
              </p>
            </div>
          )}
        </section>

        {/* Downgrade confirmation handled by RetentionModal */}

        {/* Export Data Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.borderColor,
            maxWidth: '500px',
            width: '95vw'
          }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>
                {strings.exportData}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {language === 'th' 
                  ? 'ข้อมูลที่จะถูกส่งออก: โปรไฟล์, ทรัพย์สิน, เอกสารหลักฐาน, การติดตามเงินมัดจำ, คดี และการตั้งค่าการแจ้งเตือน'
                  : language === 'zh'
                    ? '将导出的数据：个人资料、房产、证据文件、押金追踪、案件和通知设置'
                    : language === 'ja'
                      ? 'エクスポートされるデータ：プロフィール、物件、証拠ファイル、敷金追跡、ケース、通知設定'
                      : language === 'ko'
                        ? '내보낼 데이터: 프로필, 부동산, 증거 파일, 보증금 추적, 사례 및 알림 설정'
                        : language === 'ru'
                          ? 'Экспортируемые данные: профиль, недвижимость, файлы доказательств, отслеживание депозитов, дела и настройки уведомлений'
                          : 'Data to be exported: profile, properties, evidence files, deposit tracking, cases, and notification settings'}
              </p>
              <div className="p-4 rounded-lg" style={{
                backgroundColor: colors.fieldBg,
                border: `1px solid ${colors.borderColor}`
              }}>
                <p className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  {language === 'th' ? 'รูปแบบ:' : 'Format:'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setExportFormat('pdf');
                      haptic.light();
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: `2px solid ${exportFormat === 'pdf' ? '#0C3B2E' : colors.borderColor}`,
                      backgroundColor: exportFormat === 'pdf' ? (isDarkMode ? 'rgba(12,59,46,0.2)' : '#F0FDF4') : 'transparent',
                      color: colors.textPrimary,
                      fontWeight: exportFormat === 'pdf' ? '700' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    PDF
                  </button>
                </div>
              </div>
              <Button
                onClick={handleExportData}
                disabled={exporting}
                className="w-full"
                style={{
                  backgroundColor: exporting ? '#9CA3AF' : '#0C3B2E',
                  color: '#FFFFFF',
                  minHeight: '48px',
                  fontSize: '15px',
                  fontWeight: '700'
                }}
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {strings.exporting}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    {strings.export}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Account Confirmation Dialog */}
        <Dialog open={showDeleteAccountModal} onOpenChange={(open) => {
          setShowDeleteAccountModal(open);
          if (!open) {
            setConfirmDeleteEmail('');
            setConfirmDeleteUnderstand(false);
          }
        }}>
          <DialogContent 
            className="modal-enter" 
            style={{
              backgroundColor: colors.cardBg,
              borderColor: '#DC2626',
              color: colors.textPrimary,
              maxHeight: '90vh',
              width: '95vw',
              maxWidth: '600px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <DialogHeader style={{ flexShrink: 0, paddingBottom: '12px' }}>
              <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl" style={{ color: '#DC2626' }}>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  {language === 'th' ? 'ยืนยันการลบบัญชี' : language === 'zh' ? '确认删除账户' : language === 'ja' ? 'アカウント削除の確認' : language === 'ko' ? '계정 삭제 확인' : language === 'ru' ? 'Подтверждение удаления аккаунта' : 'Confirm Account Deletion'}
                </div>
              </DialogTitle>
            </DialogHeader>

            <div 
              style={{
                overflowY: 'auto',
                flex: 1,
                paddingRight: '4px',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg" style={{
                  backgroundColor: '#FEE2E2',
                  border: '2px solid #FCA5A5'
                }}>
                  <p className="font-bold text-red-900 mb-3">
                    {language === 'th' ? 'การกระทำนี้เป็นการถาวรและไม่สามารถยกเลิกได้' : language === 'zh' ? '此操作是永久性的，无法撤销' : language === 'ja' ? 'この操作は永続的で元に戻せません' : language === 'ko' ? '이 작업은 영구적이며 취소할 수 없습니다' : language === 'ru' ? 'Это действие необратимо' : 'This action is PERMANENT and cannot be undone'}
                  </p>
                  <p className="text-sm text-red-800 mb-3">
                    {language === 'th' ? 'ข้อมูลทั้งหมดของคุณจะถูกลบ:' : language === 'zh' ? '您的所有数据将被删除：' : language === 'ja' ? 'すべてのデータが削除されます：' : language === 'ko' ? '모든 데이터가 삭제됩니다:' : language === 'ru' ? 'Все ваши данные будут удалены:' : 'All your data will be deleted:'}
                  </p>
                  <ul className="space-y-1 text-sm text-red-800">
                    <li>• {language === 'th' ? 'สัญญาและการสแกนทั้งหมด' : language === 'zh' ? '所有租约和扫描' : language === 'ja' ? 'すべてのリースとスキャン' : language === 'ko' ? '모든 임대 및 스캔' : language === 'ru' ? 'Все договоры и сканирования' : 'All leases and scans'}</li>
                    <li>• {language === 'th' ? 'เงินมัดจำและไทม์ไลน์ทั้งหมด' : language === 'zh' ? '所有押金和时间线' : language === 'ja' ? 'すべての敷金とタイムライン' : language === 'ko' ? '모든 보증금 및 타임라인' : language === 'ru' ? 'Все депозиты и временные метки' : 'All deposits and timeline events'}</li>
                    <li>• {language === 'th' ? 'คดีและคำขอการซ่อมบำรุงทั้งหมด' : language === 'zh' ? '所有案件和维护请求' : language === 'ja' ? 'すべてのケースとメンテナンス依頼' : language === 'ko' ? '모든 사례 및 유지보수 요청' : language === 'ru' ? 'Все дела и запросы на обслуживание' : 'All cases and maintenance requests'}</li>
                    <li>• {language === 'th' ? 'ไฟล์ที่อัปโหลดทั้งหมด' : language === 'zh' ? '所有上传的文件' : language === 'ja' ? 'アップロードされたすべてのファイル' : language === 'ko' ? '업로드된 모든 파일' : language === 'ru' ? 'Все загруженные файлы' : 'All uploaded files'}</li>
                    <li>• {language === 'th' ? 'ข้อมูลบัญชีทั้งหมด' : language === 'zh' ? '所有账户数据' : language === 'ja' ? 'すべてのアカウントデータ' : language === 'ko' ? '모든 계정 데이터' : language === 'ru' ? 'Все данные аккаунта' : 'All account data'}</li>
                  </ul>
                </div>

                <div>
                  <Label htmlFor="confirmDeleteEmail" className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {language === 'th' ? 'พิมพ์อีเมลของคุณเพื่อยืนยัน:' : language === 'zh' ? '输入您的电子邮件以确认：' : language === 'ja' ? 'メールアドレスを入力して確認：' : language === 'ko' ? '확인을 위해 이메일을 입력하세요:' : language === 'ru' ? 'Введите свой email для подтверждения:' : 'Type your email to confirm:'} <strong>{user?.email}</strong>
                  </Label>
                  <Input
                    id="confirmDeleteEmail"
                    value={confirmDeleteEmail}
                    onChange={(e) => setConfirmDeleteEmail(e.target.value)}
                    placeholder={user?.email}
                    className="mt-2"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary,
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg" style={{
                  backgroundColor: colors.fieldBg,
                  border: `1px solid ${colors.borderColor}`
                }}>
                  <input
                    type="checkbox"
                    id="confirmDeleteUnderstand"
                    checked={confirmDeleteUnderstand}
                    onChange={(e) => setConfirmDeleteUnderstand(e.target.checked)}
                    className="mt-1"
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <label htmlFor="confirmDeleteUnderstand" className="text-sm" style={{ color: colors.textPrimary, cursor: 'pointer' }}>
                    {language === 'th' 
                      ? 'ฉันเข้าใจว่าการกระทำนี้เป็นการถาวรและไม่สามารถยกเลิกได้'
                      : language === 'zh'
                        ? '我理解此操作是永久性的且无法撤销'
                        : language === 'ja'
                          ? 'この操作は永続的で元に戻せないことを理解しています'
                          : language === 'ko'
                            ? '이 작업이 영구적이며 취소할 수 없음을 이해합니다'
                            : language === 'ru'
                              ? 'Я понимаю, что это действие необратимо'
                              : 'I understand this action is permanent and cannot be undone'}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3" style={{ 
              flexShrink: 0, 
              borderTop: `1px solid ${colors.borderColor}`, 
              paddingTop: '12px'
            }}>
              <button
                onClick={() => {
                  haptic.light();
                  setShowDeleteAccountModal(false);
                  setConfirmDeleteEmail('');
                  setConfirmDeleteUnderstand(false);
                }}
                disabled={isDeleting}
                className="btn-interaction"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: `2px solid ${colors.borderColor}`,
                  backgroundColor: colors.cardBg,
                  color: colors.textPrimary,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.5 : 1,
                  transition: 'all 0.2s',
                  minHeight: '48px'
                }}
                onMouseEnter={(e) => !isDeleting && (e.target.style.backgroundColor = colors.hoverBg)}
                onMouseLeave={(e) => !isDeleting && (e.target.style.backgroundColor = colors.cardBg)}
              >
                {strings.cancel}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmDeleteEmail !== user?.email || !confirmDeleteUnderstand}
                className="btn-interaction"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: 'none',
                  backgroundColor: (isDeleting || confirmDeleteEmail !== user?.email || !confirmDeleteUnderstand) ? '#9CA3AF' : '#DC2626',
                  color: '#FFFFFF',
                  cursor: (isDeleting || confirmDeleteEmail !== user?.email || !confirmDeleteUnderstand) ? 'not-allowed' : 'pointer',
                  opacity: (isDeleting || confirmDeleteEmail !== user?.email || !confirmDeleteUnderstand) ? 0.5 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  minHeight: '48px'
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting && confirmDeleteEmail === user?.email && confirmDeleteUnderstand) {
                    e.target.style.backgroundColor = '#B91C1C';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting && confirmDeleteEmail === user?.email && confirmDeleteUnderstand) {
                    e.target.style.backgroundColor = '#DC2626';
                  }
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'th' ? 'กำลังลบ...' : language === 'zh' ? '删除中...' : language === 'ja' ? '削除中...' : language === 'ko' ? '삭제 중...' : language === 'ru' ? 'Удаление...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{language === 'th' ? 'ลบบัญชีอย่างถาวร' : language === 'zh' ? '永久删除账户' : language === 'ja' ? 'アカウントを完全に削除' : language === 'ko' ? '계정 영구 삭제' : language === 'ru' ? 'Удалить навсегда' : 'Permanently Delete Account'}</span>
                  </>
                )}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Billing Interval Selection Dialog */}
        <Dialog open={showBillingDialog} onOpenChange={setShowBillingDialog}>
          <DialogContent className="w-full max-w-lg" style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.borderColor,
            maxHeight: '80vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <DialogHeader style={{ flexShrink: 0 }}>
              <DialogTitle style={{ color: colors.textPrimary }}>
                {strings.chooseBillingInterval}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4" style={{ flex: 1 }}>
              <button
                onClick={() => {
                  haptic.light();
                  setSelectedInterval('monthly');
                }}
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  borderRadius: '12px',
                  border: `2px solid ${selectedInterval === 'monthly' ? '#0C3B2E' : colors.borderColor}`,
                  backgroundColor: selectedInterval === 'monthly' ? (isDarkMode ? 'rgba(12,59,46,0.15)' : '#F0FDF4') : colors.cardBg,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  minHeight: '90px'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-base mb-2" style={{ color: colors.textPrimary, whiteSpace: 'normal' }}>
                      {strings.payMonthly}
                    </p>
                    <p className="text-lg font-bold" style={{ color: colors.textPrimary, whiteSpace: 'normal' }}>
                      {selectedPlan && PRICING[selectedPlan]
                        ? `฿${PRICING[selectedPlan].monthly.amount}/${language === 'th' ? 'เดือน' : language === 'zh' ? '月' : language === 'ja' ? '月' : language === 'ko' ? '월' : language === 'ru' ? 'месяц' : 'month'}` 
                        : '—'}
                    </p>
                  </div>
                  {selectedInterval === 'monthly' && (
                    <CheckCircle2 className="w-5 h-5 text-ls-forest flex-shrink-0" />
                  )}
                </div>
              </button>

              <button
                onClick={() => {
                  haptic.light();
                  setSelectedInterval('annual');
                }}
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  borderRadius: '12px',
                  border: `2px solid ${selectedInterval === 'annual' ? '#10B981' : colors.borderColor}`,
                  backgroundColor: selectedInterval === 'annual' ? (isDarkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5') : colors.cardBg,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  boxShadow: selectedInterval === 'annual' ? '0 4px 12px rgba(16,185,129,0.25)' : 'none',
                  minHeight: '110px'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <p className="font-bold text-base" style={{ color: colors.textPrimary, whiteSpace: 'normal' }}>
                        {language === 'th' ? 'ชำระรายปี — ประหยัด 17%' : language === 'zh' ? '年付 — 节省17%' : language === 'ja' ? '年払い — 17%節約' : language === 'ko' ? '연간 결제 — 17% 절약' : language === 'ru' ? 'Годовая оплата — Экономия 17%' : 'Pay Annually — Save 17%'}
                      </p>
                      <Badge className="bg-emerald-600 text-white text-xs font-bold px-2 py-1">
                        {language === 'th' ? 'คุ้มที่สุด' : language === 'zh' ? '最划算' : language === 'ja' ? 'ベストバリュー' : language === 'ko' ? '최고 가치' : language === 'ru' ? 'Лучшее предложение' : 'Best Value'}
                      </Badge>
                    </div>
                    <p className="text-lg font-bold mb-1" style={{ color: colors.textPrimary, whiteSpace: 'normal' }}>
                      {selectedPlan && PRICING[selectedPlan]
                        ? `฿${PRICING[selectedPlan].annual.amount.toLocaleString()}/${language === 'th' ? 'ปี' : language === 'zh' ? '年' : language === 'ja' ? '年' : language === 'ko' ? '년' : language === 'ru' ? 'год' : 'year'}` 
                        : '—'}
                    </p>
                    <p className="text-xs font-medium" style={{ color: '#10B981', whiteSpace: 'normal' }}>
                      {selectedPlan && PRICING[selectedPlan]
                        ? `${language === 'th' ? 'เท่ากับ' : language === 'zh' ? '相当于' : language === 'ja' ? '同等' : language === 'ko' ? '해당' : language === 'ru' ? 'Эквивалент' : 'Equivalent to'} ฿${Math.round(PRICING[selectedPlan].annual.amount / 12)}/${language === 'th' ? 'เดือน' : language === 'zh' ? '月' : language === 'ja' ? '月' : language === 'ko' ? '월' : language === 'ru' ? 'мес.' : 'month'}`
                        : '—'}
                    </p>
                  </div>
                  {selectedInterval === 'annual' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  )}
                </div>
              </button>

              <div className="text-center pt-2">
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {language === 'th' 
                    ? 'อัปเกรดอย่างชาญฉลาด ประหยัด 17% การเรียกเก็บรายปีช่วยรักษาการป้องกันของคุณตลอดปีและลดการจัดการรายเดือน' 
                    : language === 'zh' 
                      ? '更智能升级。节省17%。年度计费锁定全年保护并减少每月管理。' 
                      : language === 'ja' 
                        ? 'よりスマートにアップグレード。17%節約。年間請求で1年間の保護をロックし、月次管理を削減。' 
                        : language === 'ko' 
                          ? '더 스마트하게 업그레이드하세요. 17% 절약. 연간 청구로 1년간 보호를 확보하고 월별 관리를 줄입니다.'
                          : language === 'ru'
                            ? 'Обновляйтесь умнее. Экономьте 17%. Годовая оплата фиксирует вашу защиту на год и сокращает ежемесячные операции.'
                            : 'Upgrade Smarter. Save 17%. Annual billing locks in your protection for the year and reduces monthly admin.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4" style={{ 
                flexShrink: 0, 
                borderTop: `1px solid ${colors.borderColor}`,
                paddingTop: '16px' 
              }}>
                <button
                  onClick={() => {
                    haptic.light();
                    setShowBillingDialog(false);
                  }}
                  className="w-full sm:flex-1 btn-interaction"
                  style={{
                    padding: '14px 18px',
                    borderRadius: '8px',
                    border: `2px solid ${colors.borderColor}`,
                    backgroundColor: colors.cardBg,
                    color: colors.textPrimary,
                    fontWeight: '600',
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'normal',
                    textAlign: 'center',
                    minHeight: '52px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = colors.hoverBg}
                  onMouseLeave={(e) => e.target.style.backgroundColor = colors.cardBg}
                >
                  {strings.cancel}
                </button>
                <button
                  onClick={() => {
                    haptic.medium();
                    confirmSubscribe();
                  }}
                  className="w-full sm:flex-1 btn-interaction"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'normal',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minHeight: '52px',
                    boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
                    lineHeight: '1.4'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#059669';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#10B981';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                  }}
                >
                  <span style={{ 
                    display: 'inline-block',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: '16px'
                  }}>
                    {strings.proceedToCheckout}
                  </span>
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card id="letter-credits" className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-white" />
                </div >
                <div >
                  <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                    {strings.buyCredits}
                  </h2>
                  <p className="text-sm font-normal" style={{ color: colors.textSecondary }}>
                    {strings.oneLetterPerCredit}
                  </p>
                </div >
              </div >
              <div className="text-right flex items-center gap-2">
                <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                  {strings.creditBalance}
                </p>
                <p className="text-3xl font-bold" style={{ color: '#C7A338' }}>
                  {user?.letter_credits || 0}
                </p>
              </div >
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
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
                    
                    <div className="text-center" style={{ height: '60px', marginBottom: '12px' }}>
                      <div className="text-3xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                        {pkg.credits}
                      </div>
                      <div className="text-xs" style={{ color: colors.textSecondary }}>
                        {strings.credits}
                      </div>
                    </div>

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
                        {buyingCredits[pkg.id] ? (language === 'th' ? 'กำลังดำเนินการ...' : language === 'ru' ? 'Обработка...' : 'Processing...') : strings.buyNow}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

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

        {/* Signa Intelligence Attribution */}
        <div className="mt-6 mb-4 text-center">
          <p style={{
            fontSize: '12px',
            color: colors.textSecondary,
            fontWeight: '400'
          }}>
            Developed by{' '}
            <a
              href="https://www.signaintelligence.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: colors.textSecondary,
                textDecoration: 'underline',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.target.style.color = '#0C3B2E'}
              onMouseLeave={(e) => e.target.style.color = colors.textSecondary}
            >
              Signa Intelligence
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Account() {
  return (
    <AuthGuard>
      <ToastProvider>
        <AccountContent />
      </ToastProvider>
    </AuthGuard>
  );
}