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
import AppSharingSection from "../components/settings/AppSharingSection";import RetentionModal from "../components/settings/RetentionModal";
import DowngradeFlowDialog from "../components/settings/DowngradeFlowDialog";
import DeleteAccountModal from "../components/settings/DeleteAccountModal";
import { PRICING, PLAN_DETAILS, CREDIT_PACKAGES } from "../components/settings/PlanDetails";
import PlanSelectorGrid from "../components/settings/PlanSelectorGrid";
import { getAccountStrings } from "../components/settings/AccountStrings";
function AccountContent() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [subscribing, setSubscribing] = useState({});
  const [exporting, setExporting] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelFeedback, setCancelFeedback] = useState('');
  const [copiedLink, setCopiedLink] = useState(null);
  const [buyingCredits, setBuyingCredits] = useState({});
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedInterval, setSelectedInterval] = useState('monthly');
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [pendingDowngradePlan, setPendingDowngradePlan] = useState(null);
  const [pendingDowngradeInterval, setPendingDowngradeInterval] = useState('monthly');
  
  // New state for two-step downgrade flow
  const [showDowngradeFlow, setShowDowngradeFlow] = useState(false);
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [expandedNotifPrefs, setExpandedNotifPrefs] = useState(false); // New state for Notification Preferences expansion

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  
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

    // If downgrading, show confirmation first
    if (isDowngrade) {
      setPendingDowngradePlan(planKey);
      setPendingDowngradeInterval(interval || 'monthly');
      setShowDowngradeConfirm(true);
      return;
    }

    // Show billing interval dialog
    setSelectedPlan(planKey);
    // Pre-select annual for upgrades
    setSelectedInterval(isUpgrade ? 'annual' : (interval || 'monthly'));
    setShowBillingDialog(true);
  };

  const confirmDowngradeAndProceed = () => {
    setShowDowngradeConfirm(false);
    setSelectedPlan(pendingDowngradePlan);
    setSelectedInterval(pendingDowngradeInterval);
    setShowBillingDialog(true);
  };

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

  // Delete account handler moved to DeleteAccountModal component

  const handleExportData = async () => {
    haptic.medium();
    setShowExportDialog(false);
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportUserData');
      const exportData = response.data;
      
      // Create JSON blob (PDPA-compliant machine-readable format)
      const jsonString = typeof exportData === 'string' ? exportData : JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const filename = `LeaseShield_Data_Export_${new Date().toISOString().split('T')[0]}.json`;
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      const successMsg = { en: 'Data exported successfully', th: 'ส่งออกข้อมูลเรียบร้อยแล้ว', zh: '数据导出成功', ja: 'データのエクスポートが完了しました', ko: '데이터를 성공적으로 내보냈습니다', ru: 'Данные успешно экспортированы' };
      toast.success(successMsg[language] || successMsg.en);
      haptic.success();
    } catch (error) {
      console.error('❌ Export failed:', error);
      haptic.error();
      const errorMsg = { en: 'Failed to export data. Please try again.', th: 'ส่งออกล้มเหลว กรุณาลองอีกครั้ง', zh: '导出失败，请重试', ja: 'エクスポートに失敗しました。再試行してください', ko: '내보내기 실패. 다시 시도하세요', ru: 'Не удалось экспортировать. Повторите попытку.' };
      toast.error(errorMsg[language] || errorMsg.en);
    } finally {
      setExporting(false);
    }
  };

  // Opens Step 1 of downgrade flow (retention screen)
  const handleDowngradeOrCancel = () => {
    haptic.medium();
    setShowDowngradeFlow(true);
  };

  // handleSwitchToLite and handleContinueToFree moved to DowngradeFlowDialog component
  // handleConfirmDowngradeToFree moved to DowngradeFlowDialog component

  const handleCancelSubscription = async () => {
    const lang = user?.language || 'en';
    if (!cancelReason) {
      alert(lang === 'th' ? 'กรุณาเลือกเหตุผลในการยกเลิก' : 'Please select a reason for cancellation');
      return;
    }
    haptic.medium();
    setCancelling(true);
    try {
      const response = await base44.functions.invoke('cancelSubscription', {
        reason: cancelReason, feedback: cancelFeedback
      });
      if (response.data?.success) {
        refetchUser?.(); queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        setShowCancelDialog(false); setCancelReason(''); setCancelFeedback('');
        haptic.success();
        const until = response.data.access_until ? new Date(response.data.access_until).toLocaleDateString() : '';
        alert(lang === 'th' ? `ยกเลิกสำเร็จ เข้าถึงได้จนถึง ${until}` : `Cancelled. Access until ${until}.`);
      } else if (response.data?.error) {
        haptic.error(); alert(`${lang === 'th' ? 'ยกเลิกล้มเหลว' : 'Cancel failed'}: ${response.data.error}`);
      }
    } catch (error) {
      console.error('[CANCEL]', error); haptic.error();
      alert(`${lang === 'th' ? 'ยกเลิกล้มเหลว' : 'Cancel failed'}: ${error.response?.data?.error || error.message}`);
    } finally { setCancelling(false); }
  };

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
  const [reactivating, setReactivating] = useState(false);
  const handleReactivateSubscription = async () => { haptic.medium(); setReactivating(true); try { const r = await base44.functions.invoke('reactivateSubscription', {}); if (r.data?.success) { haptic.success(); toast.success(language === 'th' ? 'เปิดใช้งานอีกครั้งแล้ว!' : 'Subscription reactivated!'); await refetchUser(); queryClient.invalidateQueries({ queryKey: ['currentUser'] }); } else { haptic.error(); toast.error(r.data?.error || 'Failed'); } } catch (e) { haptic.error(); toast.error(e.response?.data?.error || e.message); } finally { setReactivating(false); } };
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

  const t = { en: getAccountStrings('en'), th: getAccountStrings('th'), zh: getAccountStrings('zh'), ja: getAccountStrings('ja'), ko: getAccountStrings('ko'), ru: getAccountStrings('ru') };
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
                    
                    {isScheduledForCancellation && (
                      <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#2A2500' : '#FFF8E1', border: '2px solid #F59E0B' }}>
                        <p className="text-xs font-bold mb-1" style={{ color: '#F59E0B' }}>⏳ {language === 'th' ? 'กำลังรอการยกเลิก' : 'Cancellation Pending'}</p>
                        <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>{language === 'th' ? 'จะสิ้นสุดวันที่' : 'Ends'} {user?.plan_renews_at ? new Date(user.plan_renews_at).toLocaleDateString() : '—'}</p>
                        <button onClick={handleReactivateSubscription} disabled={reactivating} className="btn-interaction" style={{ width: '100%', padding: '8px 12px', backgroundColor: '#10B981', color: '#FFF', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', border: 'none', cursor: reactivating ? 'not-allowed' : 'pointer', opacity: reactivating ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {reactivating ? <><Loader2 className="w-3 h-3 animate-spin" />{language === 'th' ? 'กำลังดำเนินการ...' : 'Reactivating...'}</> : (language === 'th' ? `เก็บแผน ${(user?.plan_tier||'').charAt(0).toUpperCase()+(user?.plan_tier||'').slice(1)} ไว้` : `Keep ${(user?.plan_tier||'').charAt(0).toUpperCase()+(user?.plan_tier||'').slice(1)} Plan`)}
                        </button>
                      </div>
                    )}
                    <button onClick={() => { haptic.medium(); if (plansSectionRef.current) plansSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="btn-interaction" style={{ width: '100%', padding: '12px 16px', backgroundColor: '#0C3B2E', color: '#FFFFFF', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'} onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}>
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



        <AppSharingSection language={language} colors={colors} isDarkMode={isDarkMode} />

        {/* Old App & Sharing section removed - replaced by AppSharingSection component above
        handleInstallApp
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
        Old App & Sharing and Install Instructions dialog end here */}

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

        {/* TWO-STEP DOWNGRADE FLOW DIALOG */}
        <DowngradeFlowDialog
          isOpen={showDowngradeFlow}
          onClose={() => setShowDowngradeFlow(false)}
          user={user}
          language={language}
          colors={colors}
          isDarkMode={isDarkMode}
          strings={strings}
          isLitePlan={isLitePlan}
          planTier={planTier}
          currentPlan={currentPlan}
          handleSubscribe={handleSubscribe}
          refetchUser={refetchUser}
          queryClient={queryClient}
        />

        {/* SEPARATE CANCEL SUBSCRIPTION DIALOG (full cancellation, not downgrade) */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent 
            className="modal-enter" 
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.borderColor,
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
              <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl" style={{ color: colors.textPrimary }}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <div>
                  {strings.cancelDialogTitle}
                  <p className="text-xs sm:text-sm font-normal mt-1" style={{ color: colors.textSecondary }}>
                    {strings.cancelDialogDesc}
                  </p>
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
                {currentPlan && (
                  <div className="p-3 sm:p-4 rounded-lg" style={{
                    backgroundColor: '#FEE2E2',
                    border: '2px solid #FECACA'
                  }}>
                    <p className="font-semibold text-red-900 mb-2 text-sm">{strings.whatYoullLose}:</p>
                    <ul className="space-y-1 text-xs sm:text-sm text-red-800">
                      {(language === 'th' ? currentPlan.benefitsTh : language === 'zh' ? currentPlan.benefitsZh : language === 'ja' ? currentPlan.benefitsJa : language === 'ko' ? currentPlan.benefitsKo : language === 'ru' ? currentPlan.benefitsRu : currentPlan.benefits).filter(b => !b.startsWith('Everything') && !b.startsWith('ทุกอย่างใน') && !b.startsWith('Все из') && !b.startsWith('包含') && !b.startsWith('の全て') && !b.startsWith('플랜의 모든')).map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <XCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <Label htmlFor="cancelReason" className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {strings.cancelReason} <span className="text-red-500">*</span>
                  </Label>
                  <Select value={cancelReason} onValueChange={setCancelReason}>
                    <SelectTrigger className="mt-2" style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary,
                      minHeight: '44px'
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
                  <Label htmlFor="cancelFeedback" className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {strings.additionalFeedback}
                  </Label>
                  <Textarea
                    id="cancelFeedback"
                    value={cancelFeedback}
                    onChange={(e) => setCancelFeedback(e.target.value)}
                    placeholder={strings.feedbackPlaceholder}
                    rows={3}
                    className="mt-2"
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

                <div className="p-3 rounded-lg text-xs sm:text-sm" style={{
                  backgroundColor: isDarkMode ? '#2A2D30' : '#F3F4F6',
                  border: `1px solid ${colors.borderColor}`
                }}>
                  <p style={{ color: colors.textSecondary }}>
                    {strings.downgradeNote.replace('{date}', user?.plan_renews_at ? new Date(user.plan_renews_at).toLocaleDateString() : '')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 pt-3" style={{ 
              flexShrink: 0, 
              borderTop: `1px solid ${colors.borderColor}`, 
              paddingTop: '12px'
            }}>
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReason('');
                  setCancelFeedback('');
                }}
                disabled={cancelling}
                className="btn-interaction"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: 'none',
                  backgroundColor: '#0C3B2E',
                  color: '#FFFFFF',
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  opacity: cancelling ? 0.5 : 1,
                  transition: 'all 0.2s',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => !cancelling && (e.target.style.backgroundColor = '#0a2f25')}
                onMouseLeave={(e) => !cancelling && (e.target.style.backgroundColor = '#0C3B2E')}
              >
                {strings.keepSubscription}
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling || !cancelReason}
                className="btn-interaction"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: 'none',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  cursor: (cancelling || !cancelReason) ? 'not-allowed' : 'pointer',
                  opacity: (cancelling || !cancelReason) ? 0.5 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => (!cancelling && cancelReason) && (e.target.style.backgroundColor = '#DC2626')}
                onMouseLeave={(e) => (!cancelling && cancelReason) && (e.target.style.backgroundColor = '#EF4444')}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span className="text-xs sm:text-sm">{strings.cancelling}</span>
                  </>
                ) : (
                  <span className="text-xs sm:text-sm">{strings.confirmCancel}</span>
                )}
              </button>
            </div>
          </DialogContent>
        </Dialog>

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
            
            <PlanSelectorGrid planTier={planTier} isFreePlan={isFreePlan} billingPeriod={billingPeriod} subscribing={subscribing} colors={colors} isDarkMode={isDarkMode} language={language} strings={strings} handleSubscribe={handleSubscribe} handleDowngradeOrCancel={handleDowngradeOrCancel} haptic={haptic} isScheduledForCancellation={isScheduledForCancellation} />
          </div>

          {/* Subtle cancel subscription link */}
          {!isFreePlan && !isScheduledForCancellation && (
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <p style={{ fontSize: "12px", color: colors.textSecondary }}>
                {language === 'th' ? 'ต้องการยกเลิกการสมัครสมาชิก?' : language === 'zh' ? '需要取消订阅吗？' : language === 'ja' ? 'サブスクリプションをキャンセルする必要がありますか？' : language === 'ko' ? '구독을 취소해야 합니까？' : language === 'ru' ? 'Нужно отменить подписку?' : 'Need to cancel your subscription?'}{" "}
                <button
                  type="button"
                  onClick={() => { try { base44.analytics.track({ eventName: 'cancellation_initiated', properties: { current_tier: planTier, monthly_value: currentPlan?.priceMonthly || 0 } }); } catch(e) { console.log('[Analytics] cancellation_initiated'); } setShowRetentionModal(true); }}
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
          <RetentionModal open={showRetentionModal} onClose={() => setShowRetentionModal(false)} />
        </section>

        {/* Downgrade Confirmation Dialog */}
        <Dialog open={showDowngradeConfirm} onOpenChange={setShowDowngradeConfirm}>
          <DialogContent 
            className="modal-enter w-full max-w-lg" 
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.borderColor,
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-bold" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'กำลังคิดจะลดระดับ?' : language === 'zh' ? '考虑降级？' : language === 'ja' ? 'ダウングレードを検討中？' : language === 'ko' ? '다운그레이드를 고려 중이신가요?' : language === 'ru' ? 'Думаете о понижении плана?' : 'Thinking about downgrading?'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                {language === 'th' 
                  ? 'การลดระดับจะลบเครื่องมือป้องกันที่สำคัญและเพิ่มความเสี่ยงของคุณ' 
                  : language === 'zh' 
                    ? '降级会删除关键保护工具并增加您的风险。' 
                    : language === 'ja' 
                      ? 'ダウングレードすると、重要な保護ツールが削除され、リスクが高まります。' 
                      : language === 'ko' 
                        ? '다운그레이드하면 주요 보호 도구가 제거되고 위험이 증가합니다.'
                        : language === 'ru'
                          ? 'Понижение плана удалит ключевые инструменты защиты и увеличит ваши риски.'
                          : 'Downgrading removes key protection tools and increases your risk.'}
              </p>
              <div className="p-4 rounded-lg" style={{
                backgroundColor: isDarkMode ? '#2A1F1F' : '#FEE2E2',
                border: `2px solid ${isDarkMode ? '#EF4444' : '#FECACA'}`
              }}>
                <p className="text-sm font-semibold mb-3" style={{ color: isDarkMode ? '#FCA5A5' : '#991B1B' }}>
                  {language === 'th' ? 'คุณจะสูญเสีย:' : language === 'zh' ? '您将失去：' : language === 'ja' ? '失うもの：' : language === 'ko' ? '잃게 될 것:' : language === 'ru' ? 'Вы потеряете:' : 'You will lose:'}
                </p>
                <ul className="space-y-2 text-sm" style={{ color: isDarkMode ? '#FCA5A5' : '#991B1B' }}>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>{language === 'th' ? 'การแจ้งเตือนกำหนดเวลาขั้นสูง' : language === 'zh' ? '高级截止日期提醒' : language === 'ja' ? '高度な期限リマインダー' : language === 'ko' ? '고급 마감일 알림' : language === 'ru' ? 'Расширенные напоминания о сроках' : 'Advanced deadline reminders'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>{language === 'th' ? 'การติดตามเงินมัดจำและการซ่อมบำรุงแบบเต็มรูปแบบ' : language === 'zh' ? '完整押金和维护追踪' : language === 'ja' ? '完全な敷金とメンテナンス追跡' : language === 'ko' ? '완전한 보증금 및 유지보수 추적' : language === 'ru' ? 'Полное отслеживание депозитов и обслуживания' : 'Full deposit & maintenance tracking'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>{language === 'th' ? 'การสนับสนุนคดีลำดับความสำคัญ' : language === 'zh' ? '优先案件支持' : language === 'ja' ? '優先ケースサポート' : language === 'ko' ? '우선 사례 지원' : language === 'ru' ? 'Приоритетная поддержка дел' : 'Priority case support'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>{language === 'th' ? 'การสแกนสัญญาเพิ่มเติม' : language === 'zh' ? '额外租约扫描' : language === 'ja' ? '追加リーススキャン' : language === 'ko' ? '추가 임대 스캔' : language === 'ru' ? 'Дополнительные сканирования договоров' : 'Additional lease scans'}</span>
                  </li>
                </ul>
              </div>
              <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                {language === 'th' 
                  ? 'สิ่งนี้ทำให้การป้องกันของคุณอ่อนแอลง อยู่ในแผนปัจจุบันเพื่อรักษาสิทธิ์ของคุณให้ได้รับการป้องกันอย่างเต็มที่' 
                  : language === 'zh' 
                    ? '这会削弱您的保护。保持当前计划以全面保护您的权利。' 
                    : language === 'ja' 
                      ? 'これにより保護が弱まります。現在のプランを維持して、権利を完全に守りましょう。' 
                      : language === 'ko' 
                        ? '이는 보호를 약화시킵니다. 현재 플랜을 유지하여 권리를 완전히 보호하세요.'
                        : language === 'ru'
                          ? 'Это ослабляет вашу защиту. Оставайтесь на текущем плане, чтобы полностью защитить свои права.'
                          : 'This weakens your protection. Stay on your current plan to keep your rights fully defended.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4" style={{ borderTop: `1px solid ${colors.borderColor}`, paddingTop: '16px' }}>
              <button
                onClick={() => {
                  haptic.light();
                  setShowDowngradeConfirm(false);
                  setPendingDowngradePlan(null);
                }}
                className="w-full sm:flex-1 btn-interaction"
                style={{
                  padding: '14px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#0C3B2E',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(12,59,46,0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#0a2f25';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#0C3B2E';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {language === 'th' ? 'รักษาการป้องกันของฉัน' : language === 'zh' ? '保持我的保护' : language === 'ja' ? '私の保護を維持' : language === 'ko' ? '내 보호 유지' : language === 'ru' ? 'Сохранить мою защиту' : 'Keep My Protection'}
              </button>
              <button
                onClick={() => {
                  haptic.medium();
                  confirmDowngradeAndProceed();
                }}
                className="w-full sm:flex-1 btn-interaction"
                style={{
                  padding: '14px 20px',
                  borderRadius: '10px',
                  border: `2px solid ${colors.borderColor}`,
                  backgroundColor: 'transparent',
                  color: '#EF4444',
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = isDarkMode ? 'rgba(239,68,68,0.1)' : '#FEE2E2';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                {language === 'th' ? 'ลดระดับต่อไป' : language === 'zh' ? '继续降级' : language === 'ja' ? 'ダウングレードを続行' : language === 'ko' ? '다운그레이드 계속' : language === 'ru' ? 'Всё равно понизить' : 'Downgrade Anyway'}
              </button>
            </div>
          </DialogContent>
        </Dialog>

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
                  <div
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: `2px solid #0C3B2E`,
                      backgroundColor: isDarkMode ? 'rgba(12,59,46,0.2)' : '#F0FDF4',
                      color: colors.textPrimary,
                      fontWeight: '700',
                      textAlign: 'center'
                    }}
                  >
                    JSON ({language === 'th' ? 'ตาม PDPA' : 'PDPA compliant'})
                  </div>
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

        {/* Delete Account Confirmation Dialog - Branded Component */}
        <DeleteAccountModal
          open={showDeleteAccountModal}
          onClose={() => setShowDeleteAccountModal(false)}
          user={user}
          colors={colors}
          language={language}
          isDarkMode={isDarkMode}
          toast={toast}
          haptic={haptic}
        />

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