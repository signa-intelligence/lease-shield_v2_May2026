// ⚠️ LeaseShield: Dashboard overview is stabilised.
// Do not modify card themes, layout, or handlers without explicit product approval.

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, FileText, Wallet, Scale, AlertTriangle, TrendingUp, TrendingDown, Bell, Wrench, ArrowRight, ChevronDown, ChevronUp, Zap, Loader2, AlertCircle, Mail, Calendar, BarChart3, Crown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { differenceInDays, format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import StatsCard from "../components/dashboard/StatsCard";
import DepositAlert from "../components/dashboard/DepositAlert";
import RecentLeases from "../components/dashboard/RecentLeases";
import ProtectionScoreEnhanced from "../components/dashboard/ProtectionScoreEnhanced";
import NotificationSummary from "../components/dashboard/NotificationSummary";
import ProtectionScoreDetails from "../components/dashboard/ProtectionScoreDetails";
import EmptyState from "../components/shared/EmptyState";
import SkeletonLoader from "../components/shared/SkeletonLoader";
import PullToRefresh from "../components/shared/PullToRefresh";
import { ToastProvider, useToast } from "../components/shared/Toast";
import OnboardingWizard from "../components/onboarding/OnboardingWizard";
import OnboardingChecklist from "../components/onboarding/OnboardingChecklist";
import OnboardingBanner from "../components/onboarding/OnboardingBanner";
import FeatureTour from "../components/onboarding/FeatureTour";
import FirstSessionProgress from "../components/onboarding/FirstSessionProgress";
import { haptic } from "../components/shared/HapticFeedback";
import FloatingActionButton from "../components/shared/FloatingActionButton";
import { getFeatureCardStyles, FEATURE_COLORS } from "../components/shared/featureTheme";
import PageHeader from "../components/shared/PageHeader";
import { RESOLVE_PRICING, hasMemberPricing, getMembershipInfo, getResolvePricingForUser } from "../components/shared/resolvePricing";
import AuthGuard from "../components/shared/AuthGuard";
import QuickGuide from "../components/shared/QuickGuide";

function DashboardContent() {
  const [expandedSections, setExpandedSections] = React.useState({
    stats: true,
    content: true,
    recentLeases: false,
    notifications: false,
    depositAlerts: false,
  });
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [showTour, setShowTour] = React.useState(false);
  const [showQuickGuide, setShowQuickGuide] = React.useState(false);
  const [showProtectionDetails, setShowProtectionDetails] = React.useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Listen for profile updates from Account page
  React.useEffect(() => {
    const handleProfileUpdate = () => {
      refetchUser();
    };
    window.addEventListener('profile:updated', handleProfileUpdate);
    return () => window.removeEventListener('profile:updated', handleProfileUpdate);
  }, [refetchUser]);

  // Generate referral code on first login if missing
  React.useEffect(() => {
    if (user && !user.referral_code) {
      base44.functions.invoke('generateReferralCode')
        .then(() => queryClient.invalidateQueries({ queryKey: ['currentUser'] }))
        .catch(err => console.error('[DASHBOARD] Failed to generate referral code:', err));
    }
  }, [user?.id, user?.referral_code, queryClient]);

  const { data: leases = [], isLoading: leasesLoading } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }, '-created_date', 10),
    enabled: !!user,
  });

  const { data: deposits = [], isLoading: depositsLoading } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases', user?.email],
    queryFn: async () => {
      if (!user?.email) {
        console.error('🔍 [DASHBOARD] No user email - cannot fetch cases');
        return [];
      }

      console.log('🔍 [DASHBOARD] Fetching cases for user:', user.email);

      // CRITICAL: RLS filters by user_email = {{user.email}}
      const result = await base44.entities.Case.filter({ 
        is_deleted: { $ne: true }
      });

      console.log('📊 [DASHBOARD] RLS-filtered cases:', result.length);
      console.log('📊 [DASHBOARD] Case user binding verification:');
      result.forEach(c => {
        console.log({
          id: c.id.slice(0, 8),
          case_number: c.case_number,
          user_email: c.user_email,
          created_by: c.created_by,
          matches_user: c.user_email === user.email,
          status: c.status
        });
      });

      return result;
    },
    enabled: !!user?.email,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: maintenanceRequests = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => base44.entities.MaintenanceRequest.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: notificationLogs = [] } = useQuery({
    queryKey: ['notificationLogs'],
    queryFn: () => base44.entities.NotificationLog.filter({ user_email: user?.email }, '-created_date', 10),
    enabled: !!user,
  });

  const language = user?.language || 'en';
  const accessLevel = user?.access_level || 'user';
  const isAdmin = user?.role === 'admin' || ['admin', 'super_admin'].includes(accessLevel);
  const isDarkMode = user?.theme === 'dark';
  const isLitePlan = user?.plan_tier === 'lite';
  const isFreeTier = !user?.plan_tier || user.plan_tier === 'free';
  const isSecureTier = user?.plan_tier === 'secure';

  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#2A2D30',
    borderColor: 'rgba(255,255,255,0.1)',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    fieldBg: '#374151'
  } : {
    bg: '#F3F6F5',
    cardBg: '#FFFFFF',
    borderColor: 'rgba(12,59,46,0.08)',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    fieldBg: '#F8FAFC'
  };

  const handleRefresh = async (shouldShowToast = true) => {
    haptic.light();
    await queryClient.invalidateQueries();
    if (shouldShowToast) {
      toast.success(language === 'th' ? 'รีเฟรชสำเร็จ' : 'Refreshed successfully');
    }
  };

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subscriptionStatus = urlParams.get('subscription');

    if (subscriptionStatus === 'success' && user) {
      window.history.replaceState({}, '', window.location.pathname);
      toast.success(language === 'th' ? 'การสมัครสมาชิกสำเร็จ!' : 'Subscription successful!');

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
  }, [queryClient, user, toast]);

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

  // Compute feature themes once
  const leasesTheme = getFeatureCardStyles("leases", isDarkMode);
  const depositsTheme = getFeatureCardStyles("deposits", isDarkMode);
  const rentTheme = getFeatureCardStyles("rent", isDarkMode);
  const notificationsTheme = getFeatureCardStyles("notifications", isDarkMode);
  const casesTheme = getFeatureCardStyles("cases", isDarkMode);
  const maintenanceTheme = getFeatureCardStyles("maintenance", isDarkMode);

  const [checkingOverdue, setCheckingOverdue] = React.useState(false);

  const checkAndNotifyOverdue = React.useCallback(async () => {
    if (!deposits || deposits.length === 0) return;

    setCheckingOverdue(true);
    try {
      const now = new Date();
      let notificationsSent = 0;

      for (const deposit of deposits) {
        if (deposit.status !== 'tracking' || !deposit.expected_return_date) continue;

        const expectedDate = new Date(deposit.expected_return_date);
        const daysDiff = Math.floor((expectedDate - now) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) {
          console.log(`🚨 Overdue deposit found: ${deposit.id}, ${Math.abs(daysDiff)} days`);

          try {
            const response = await base44.functions.invoke('sendOverdueNotification', {
              deposit: {
                id: deposit.id,
                deposit_amount: deposit.deposit_amount,
                property_address: deposit.property_address,
                expected_return_date: deposit.expected_return_date,
                daysOverdue: Math.abs(daysDiff)
              }
            });

            if (response.data?.success) {
              notificationsSent++;
              console.log(`✅ Notification sent for deposit ${deposit.id}`);
            }
          } catch (err) {
            console.error(`❌ Failed to send notification for deposit ${deposit.id}:`, err);
          }
        }
      }

      if (notificationsSent > 0) {
        toast.success(
          language === 'th'
            ? `ส่งการแจ้งเตือน ${notificationsSent} รายการ`
            : `Sent ${notificationsSent} notifications`
        );
      } else {
        toast.info(language === 'th' ? 'ไม่พบเงินมัดจำที่เกินกำหนด' : 'No overdue deposits found');
      }

      queryClient.invalidateQueries({ queryKey: ['notificationLogs'] });
    } catch (error) {
      console.error('Failed to check overdue deposits:', error);
      toast.error(language === 'th' ? 'ไม่สามารถตรวจสอบได้' : 'Check failed');
    } finally {
      setCheckingOverdue(false);
    }
  }, [deposits, language, toast, queryClient]);

  const [triggeringReminders, setTriggeringReminders] = useState(false);

  const triggerReminders = async () => {
    setTriggeringReminders(true);
    try {
      await checkAndNotifyOverdue();
    } finally {
      setTriggeringReminders(false);
    }
  };

  const [runningScheduled, setRunningScheduled] = useState(false);

  const runScheduledReminders = async () => {
    setRunningScheduled(true);
    try {
      const response = await base44.functions.invoke('scheduledReminders');
      console.log('📊 Scheduled reminders result:', response.data);

      if (response.data?.success) {
        const { diagnostics } = response.data;
        toast.success(
          language === 'th'
            ? `ส่งแล้ว ${diagnostics.notifications_sent} การแจ้งเตือน (ตรวจสอบ ${diagnostics.users_checked} ผู้ใช้)`
            : `Sent ${diagnostics.notifications_sent} notifications (${diagnostics.users_checked} users checked)`
        );
      } else {
        toast.error(language === 'th' ? 'การตรวจสอบล้มเหลว' : 'Check failed');
      }
    } catch (error) {
      console.error('Scheduled reminders error:', error);
      toast.error(language === 'th' ? 'เกิดข้อผิดพลาด' : 'Error occurred');
    } finally {
      setRunningScheduled(false);
    }
  };

  const [testingOverdue, setTestingOverdue] = useState(false);
  const [testingSettings, setTestingSettings] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingBrowserFlex, setTestingBrowserFlex] = React.useState(false);

  const testFlexFromBrowser = async () => {
    setTestingBrowserFlex(true);
    try {
      console.log('🧪 Testing Flex message from browser...');

      const testFlex = {
        altText: '🧪 Test Flex Card',
        contents: {
          type: 'bubble',
          size: 'mega',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '🧪 TEST CARD',
                weight: 'bold',
                size: 'lg',
                color: '#FFFFFF'
              }
            ],
            backgroundColor: '#DC2626',
            paddingAll: '20px'
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'This is a test Flex message sent from the Dashboard.',
                wrap: true
              }
            ],
            paddingAll: '20px'
          }
        }
      };

      console.log('📦 Test Flex structure:', JSON.stringify(testFlex, null, 2));

      if (!user.line_messaging_token) {
        alert('No LINE token found. Please connect LINE first.');
        setTestingBrowserFlex(false);
        return;
      }

      console.log('📤 Sending to sendLineMessage...');
      const response = await base44.functions.invoke('sendLineMessage', {
        userId: user.line_messaging_token,
        flexMessage: testFlex
      });

      console.log('✅ Response from sendLineMessage:', response.data);

      if (response.data?.success) {
        toast.success(
          language === 'th'
            ? '✅ ส่ง Flex Card สำเร็จ! ตรวจสอบ LINE'
            : '✅ Flex Card sent! Check your LINE'
        );

        alert(
          `✅ TEST FLEX SENT!\n\n` +
          `Check your LINE now.\n\n` +
          `Message type: ${response.data.messageType}\n` +
          `Sent as Flex: ${response.data.sentFlexMessage}\n\n` +
          `Open browser console (F12) to see detailed logs.`
        );
      } else {
        toast.error(language === 'th' ? 'ส่งไม่สำเร็จ' : 'Failed to send');
      }
    } catch (error) {
      console.error('❌ Test failed:', error);
      alert(
        `❌ TEST FAILED:\n\n${error.message}\n\nCheck browser console for details.`
      );
      toast.error(language === 'th' ? 'เกิดข้อผิดพลาด' : 'Error occurred');
    } finally {
      setTestingBrowserFlex(false);
    }
  };

  const [testingRent, setTestingRent] = React.useState(false);

  const testRentReminder = async () => {
    setTestingRent(true);
    try {
      const rentDeposit = deposits.find(d => d.rent_amount && d.rent_due_day);

      if (!rentDeposit) {
        alert(
          `❌ NO RENT CONFIGURED\n\n` +
          `Please set up a deposit with:\n` +
          `- Rent Amount\n` +
          `- Rent Due Day\n\n` +
          `Go to: Deposit Tracker → Add/Edit Deposit`
        );
        setTestingRent(false);
        return;
      }

      console.log('💰 FORCING rent reminder:', rentDeposit);

      const daysUntilDue = rentDeposit.rent_alert_days_before || 3;
      const propertyAddress = rentDeposit.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A');
      const rentAmount = rentDeposit.deposit_amount; // Corrected from rent_amount
      const dueDay = rentDeposit.rent_due_day;

      const flexMessage = {
        altText: language === 'th'
          ? `💰 เตือนชำระค่าเช่า: ฿${rentAmount.toLocaleString()}`
          : `💰 Rent Payment Reminder: ฿${rentAmount.toLocaleString()}`,
        contents: {
          type: 'bubble',
          size: 'mega',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '💰',
                size: 'xxl',
                align: 'center'
              },
              {
                type: 'text',
                text: language === 'th' ? 'เตือนชำระค่าเช่า' : 'Rent Payment Reminder',
                weight: 'bold',
                size: 'xl',
                align: 'center',
                color: '#FFFFFF',
                margin: 'md'
              }
            ],
            backgroundColor: '#0C3B2E',
            paddingAll: '20px'
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '🏠',
                    size: 'lg',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: propertyAddress,
                    wrap: true,
                    color: '#1A1D1F',
                    size: 'sm',
                    flex: 1,
                    margin: 'sm'
                  }
                ],
                margin: 'lg'
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '💵',
                    size: 'lg',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: `฿${rentAmount.toLocaleString()}`,
                    wrap: true,
                    color: '#C7A338',
                    size: 'xl',
                    weight: 'bold',
                    flex: 1,
                    margin: 'sm'
                  }
                ],
                margin: 'lg'
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '📅',
                    size: 'lg',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: language === 'th'
                      ? `ครบกำหนด: วันที่ ${dueDay} ของเดือน`
                      : `Due: Day ${dueDay} of month`,
                    wrap: true,
                    color: '#1A1D1F',
                    size: 'sm',
                    flex: 1,
                    margin: 'sm'
                  }
                ],
                margin: 'lg'
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '⏰',
                    size: 'lg',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: language === 'th'
                      ? `เหลืออีก ${daysUntilDue} วัน`
                      : `${daysUntilDue} days until due`,
                    wrap: true,
                    color: '#DC2626',
                    size: 'sm',
                    weight: 'bold',
                    flex: 1,
                    margin: 'sm'
                  }
                ],
                margin: 'lg'
              },
              {
                type: 'separator',
                margin: 'xl'
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: language === 'th' ? '💡 เคล็ดลับ' : '💡 Tip',
                    size: 'sm',
                    color: '#047857',
                    weight: 'bold'
                  },
                  {
                    type: 'text',
                    text: language === 'th'
                      ? 'ชำระก่อนกำหนดเพื่อหลีกเลี่ยงค่าปรับ'
                      : 'Pay early to avoid late fees',
                    size: 'xs',
                    color: '#64748b',
                    wrap: true,
                    margin: 'sm'
                  }
                ],
                margin: 'xl',
                paddingAll: '12px',
                backgroundColor: '#F0FDF4',
                cornerRadius: '8px'
              }
            ],
            paddingAll: '20px'
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: language === 'th' ? 'เปิดแอป' : 'Open App',
                  uri: 'https://app.leaseshield.asia/DepositTracker'
                },
                style: 'primary',
                color: '#0C3B2E'
              }
            ],
            paddingAll: '12px'
          }
        }
      };

      const channels = [];

      if (user.line_messaging_token && user.line_notifications) {
        try {
          await base44.functions.invoke('sendLineMessage', {
            userId: user.line_messaging_token,
            flexMessage: flexMessage
          });
          channels.push('LINE');
          console.log('✅ LINE rent reminder sent');
        } catch (err) {
          console.error('❌ LINE failed:', err);
        }
      }

      if (user.email_notifications) {
        const subject = language === 'th'
          ? '💰 เตือนชำระค่าเช่า - Lease Shield'
          : '💰 Rent Payment Reminder - Lease Shield';

        const body = language === 'th'
          ? `💰 เตือนชำระค่าเช่า\n\n🏠 ทรัพย์สิน: ${propertyAddress}\n💵 จำนวน: ฿${rentAmount.toLocaleString()}\n📅 ครบกำหนด: วันที่ ${dueDay} ของเดือน\n⏰ เหลืออีก ${daysUntilDue} วัน\n\n💡 เคล็ดลับ: ชำระก่อนกำหนดเพื่อหลีกเลี่ยงค่าปรับ\n\nเปิดแอป → https://app.leaseshield.asia/DepositTracker`
          : `💰 Rent Payment Reminder\n\n🏠 Property: ${propertyAddress}\n💵 Amount: ฿${rentAmount.toLocaleString()}\n📅 Due: Day ${dueDay} of the month\n⏰ ${daysUntilDue} days until due\n\n💡 Tip: Pay early to avoid late fees\n\nOpen app → https://app.leaseshield.asia/DepositTracker`;

        try {
          await base44.integrations.Core.SendEmail({
            from_name: 'Lease Shield',
            to: user.email,
            subject: subject,
            body: body
          });
          channels.push('Email');
          console.log('✅ Email rent reminder sent');
        } catch (err) {
          console.error('❌ Email failed:', err);
        }
      }

      for (const channel of channels) {
        await base44.entities.NotificationLog.create({
          user_email: user.email,
          notification_type: 'rent_reminder',
          channel: channel,
          status: 'sent',
          related_entity_type: 'deposit',
          related_entity_id: rentDeposit.id,
          message_preview: `Test: ฿${rentAmount} due day ${dueDay}`
        });
      }

      if (channels.length > 0) {
        toast.success(
          language === 'th'
            ? `✅ ส่งการแจ้งเตือนค่าเช่าผ่าน ${channels.join(' & ')}`
            : `✅ Rent reminder sent via ${channels.join(' & ')}`
        );

        alert(
          `💰 RENT REMINDER SENT!\n\n` +
          `✅ Channels: ${channels.join(' & ')}\n\n` +
          `Property: ${propertyAddress}\n` +
          `Amount: ฿${rentAmount.toLocaleString()}\n` +
          `Due day: ${dueDay} of month\n` +
          `Alert: ${daysUntilDue} days before\n\n` +
          `🎯 FORCED TEST - Ignores schedule!\n` +
          `Check your ${channels.includes('LINE') ? 'LINE' : 'email'} now!`
        );
      } else {
        alert(
          `⚠️ NO CHANNELS ENABLED\n\n` +
          `Please enable LINE or Email notifications in:\n` +
          `Account → Notification Settings`
        );
      }

      queryClient.invalidateQueries({ queryKey: ['notificationLogs'] });
    } catch (error) {
      console.error('Rent test failed:', error);
      toast.error(language === 'th' ? 'เกิดข้อผิดพลาด' : 'Error occurred');
      alert(`❌ ERROR:\n\n${error.message}`);
    } finally {
      setTestingRent(false);
    }
  };

  const testDirectEmail = async () => {
    setTestingEmail(true);
    try {
      const response = await base44.functions.invoke('testDirectEmail');
      console.log('📧 Email test result:', response.data);

      if (response.data?.success) {
        alert(
          `✅ TEST EMAIL SENT!\n\n` +
          `Check your inbox: ${response.data.recipient}\n\n` +
          `If you don't see it:\n` +
          `1. Check spam/junk folder\n` +
          `2. Wait 1-2 minutes\n` +
          `3. Make sure ${response.data.recipient} is correct`
        );
        toast.success(language === 'th' ? 'ส่งอีเมลทดสอบแล้ว!' : 'Test email sent!');
      } else {
        alert(
          `❌ EMAIL SEND FAILED:\n\n` +
          `Error: ${response.data?.details || 'Unknown error'}\n\n` +
          `This means your email service is NOT working.\n` +
          `Contact support or check your Resend API key.`
        );
        toast.error(language === 'th' ? 'ส่งอีเมลไม่สำเร็จ' : 'Email send failed');
      }
    } catch (error) {
      console.error('Failed to test email:', error);
      alert(
        `❌ EMAIL TEST ERROR:\n\n` +
        `${error.message}\n\n` +
        `Your email service might be broken.`
      );
      toast.error(language === 'th' ? 'ทดสอบล้มเหลว' : 'Test failed');
    } finally {
      setTestingEmail(false);
    }
  };

  const calculateProtectionScore = () => {
    let actionScore = 0;
    const suggestions = [];

    // Lease uploaded/scanned: 30 points
    const hasScannedLease = leases.some(l => l.status === 'scanned' || l.status === 'paid');
    if (hasScannedLease) {
      actionScore += 30;
    } else {
      suggestions.push({
        action: language === 'th' ? 'อัปโหลดสัญญาเช่าเพื่อสแกนเต็มรูปแบบ' : language === 'zh' ? '上传租约进行完整扫描' : language === 'ja' ? 'リースをアップロードしてフルスキャン' : language === 'ko' ? '전체 스캔을 위해 임대 계약 업로드' : language === 'ru' ? 'Загрузите договор для полного сканирования' : 'Upload your lease for a full scan',
        benefit: language === 'th' ? 'ระบุความเสี่ยงและข้อกำหนดที่ซ่อนอยู่ในสัญญา' : language === 'zh' ? '识别合同中的隐藏风险和条款' : language === 'ja' ? '契約内の隠れたリスクと条項を特定' : language === 'ko' ? '계약의 숨겨진 위험과 조항 식별' : language === 'ru' ? 'Выявите скрытые риски и условия в договоре' : 'Identify hidden risks and terms in your contract',
        route: createPageUrl("UploadScan"),
        completed: false
      });
    }

    // Deposit tracker completed: 20 points
    const hasDeposit = deposits.some(d => d.deposit_amount && d.expected_return_date);
    if (hasDeposit) {
      actionScore += 20;
    } else {
      suggestions.push({
        action: language === 'th' ? 'เพิ่มรายละเอียดเงินมัดจำของคุณ' : language === 'zh' ? '添加押金详细信息' : language === 'ja' ? '敷金詳細を追加' : language === 'ko' ? '보증금 세부 정보 추가' : language === 'ru' ? 'Добавьте данные депозита' : 'Add your deposit details',
        benefit: language === 'th' ? 'ติดตามกำหนดคืนเงินและรับการแจ้งเตือนอัตโนมัติ' : language === 'zh' ? '跟踪退款截止日期并接收自动提醒' : language === 'ja' ? '返金期限を追跡し、自動リマインダーを受信' : language === 'ko' ? '환불 마감일 추적 및 자동 알림 수신' : language === 'ru' ? 'Отслеживайте сроки возврата и получайте напоминания' : 'Track refund deadlines and receive automated alerts',
        route: createPageUrl("PropertyTracker") + "#deposit",
        completed: false
      });
    }

    // Property details/lease dates completed: 20 points
    const hasLeaseDates = leases.some(l => l.start_date && l.end_date && l.notice_period_days);
    if (hasLeaseDates) {
      actionScore += 20;
    } else {
      suggestions.push({
        action: language === 'th' ? 'เพิ่มวันที่สำคัญของสัญญาเช่า (เริ่ม/สิ้นสุด/แจ้ง)' : language === 'zh' ? '添加关键租约日期（开始/结束/通知）' : language === 'ja' ? '重要なリース日付を追加（開始/終了/通知）' : language === 'ko' ? '주요 임대 날짜 추가（시작/종료/통지）' : language === 'ru' ? 'Добавьте ключевые даты договора（начало/конец/уведомление）' : 'Add key lease dates (start/end/notice)',
        benefit: language === 'th' ? 'ไม่พลาดกำหนดแจ้งล่วงหน้าและหลีกเลี่ยงค่าปรับ' : language === 'zh' ? '不错过通知截止日期，避免罚款' : language === 'ja' ? '通知期限を逃さず、罰金を回避' : language === 'ko' ? '통지 마감일을 놓치지 않고 벌금 회피' : language === 'ru' ? 'Не пропустите сроки уведомлений и избежите штрафов' : 'Never miss notice deadlines and avoid penalties',
        route: createPageUrl("PropertyTracker"),
        completed: false
      });
    }

    // Evidence vault has at least 1 item: 15 points
    if (documents.length > 0) {
      actionScore += 15;
    } else {
      suggestions.push({
        action: language === 'th' ? 'อัปโหลดรูปภาพ/ไฟล์ไปยัง Evidence Vault' : language === 'zh' ? '上传照片/文件到证据保管库' : language === 'ja' ? 'Evidence Vaultに写真/ファイルをアップロード' : language === 'ko' ? 'Evidence Vault에 사진/파일 업로드' : language === 'ru' ? 'Загрузите фото/файлы в Хранилище доказательств' : 'Upload photos/files to Evidence Vault',
        benefit: language === 'th' ? 'สร้างบันทึกที่ตรวจสอบได้สำหรับข้อพิพาทในอนาคต' : language === 'zh' ? '为未来的纠纷建立可验证的记录' : language === 'ja' ? '将来の紛争のために検証可能な記録を作成' : language === 'ko' ? '향후 분쟁을 위한 검증 가능한 기록 생성' : language === 'ru' ? 'Создайте проверяемую запись для будущих споров' : 'Build a verifiable record for future disputes',
        route: createPageUrl("EvidenceVault"),
        completed: false
      });
    }

    // Notifications enabled: 15 points
    const hasNotifications = user?.email_notifications || user?.line_notifications;
    if (hasNotifications) {
      actionScore += 15;
    } else {
      suggestions.push({
        action: language === 'th' ? 'เปิดใช้งานการแจ้งเตือน/การเตือน' : language === 'zh' ? '启用提醒/通知' : language === 'ja' ? 'リマインダー/通知を有効化' : language === 'ko' ? '알림/리마인더 활성화' : language === 'ru' ? 'Включите напоминания/уведомления' : 'Enable reminders/notifications',
        benefit: language === 'th' ? 'รับการแจ้งเตือนอัตโนมัติเพื่อไม่พลาดกำหนดสำคัญ' : language === 'zh' ? '接收自动提醒，不错过重要截止日期' : language === 'ja' ? '自動リマインダーで重要な期限を逃さない' : language === 'ko' ? '자동 알림으로 중요한 마감일을 놓치지 마세요' : language === 'ru' ? 'Получайте напоминания, чтобы не пропустить важные сроки' : 'Get automated reminders to never miss critical deadlines',
        route: createPageUrl("Account") + "#notifications",
        completed: false
      });
    }

    // TIER-BASED CAPS (hard limits)
    const tierCaps = {
      free: 30,
      lite: 60,
      protect: 85,
      secure: 100
    };
    
    const userTier = user?.plan_tier || 'free';
    const tierCap = tierCaps[userTier] || 30;
    const displayedScore = Math.min(actionScore, tierCap);
    const isLocked = actionScore >= 85 && userTier !== 'secure';

    return { 
      score: displayedScore, 
      actionScore,
      tierCap,
      isLocked,
      userTier,
      suggestions: suggestions.slice(0, 5) 
    };
  };

  const protectionData = calculateProtectionScore();
  const { score: protectionScore, actionScore, tierCap, isLocked, userTier, suggestions: protectionSuggestions } = protectionData;

  const activeDeposits = deposits.filter(d => d.status === 'tracking' || d.status === 'dispute');
  
  // Active cases - same filter as Cases page for consistency
  const ACTIVE_CASE_STATUSES = ['awaiting_payment', 'intake', 'pending_review', 'under_review', 'ready_drafts', 
                                'client_review', 'awaiting_landlord', 'in_progress', 'resolved'];
  const activeCases = (cases || []).filter(c => ACTIVE_CASE_STATUSES.includes(c.status));
  
  console.log('[RESOLVE_FLOW] Dashboard cases result:', {
    total: cases.length,
    active: activeCases.length,
    statuses: cases.map(c => ({ id: c.id.slice(0, 8), status: c.status }))
  });

  const scannedLeases = leases.filter(l => l.status === 'scanned' || l.status === 'paid');
  const totalDepositValue = activeDeposits.reduce((sum, d) => sum + (d.deposit_amount || 0), 0);
  const avgDeposit = activeDeposits.length > 0 ? Math.round(totalDepositValue / activeDeposits.length) : 0;
  const now = new Date();
  const urgentDeposits = activeDeposits.filter(d => {
    if (!d.expected_return_date) return false;
    const daysRemaining = differenceInDays(new Date(d.expected_return_date), now);
    return daysRemaining <= 30 && daysRemaining > 0;
  }).length;
  const resolvedCases = cases.filter(c => c.status === 'closed').length;
  const unreadNotifications = notificationLogs.filter(n => n.status !== 'read').length; // Added this

  const urgentLeaseNotices = leases.filter(lease => {
    if (!lease.notice_deadline || !lease.notice_alerts_enabled) return false;
    const noticeDeadline = new Date(lease.notice_deadline);
    const daysUntil = differenceInDays(noticeDeadline, now);
    return daysUntil >= 0 && daysUntil <= 30;
  }).sort((a, b) => {
    const daysA = differenceInDays(new Date(a.notice_deadline), now);
    const daysB = differenceInDays(new Date(b.notice_deadline), now);
    return daysA - daysB;
  });

  const rentTrackedCount = deposits.filter(d => d.rent_amount && d.rent_due_day).length;
  const activeMaintenanceCount = maintenanceRequests.filter(r => r.status !== 'completed' && r.status !== 'rejected').length;

  const t = {
    en: {
      welcome: "Welcome back",
      subtitle: "Prevent rental problems before they happen.",
      activeLeases: "Active Leases",
      depositsTracked: "Deposits Tracked",
      activeCases: "Active Cases",
      cases: "Cases",
      protectionScore: "Protection Score",
      protectRights: "Protect Your Rights",
      uploadCta: "Upload your lease for instant automated analysis and risk assessment",
      uploadLease: "Upload Lease",
      upgradePremium: "Upgrade to Premium",
      upgradeDesc: "Get unlimited lease scans, priority case handling, and expert legal support",
      viewPlans: "View Plans",
      uploadFirstLease: "Upload First Lease",
      noDataYet: "No Data Yet",
      getStartedDesc: "Create a clear, fair rental record by uploading the lease agreement.",
      testEmail: "Test Email",
      sending: "Sending...",
      runFullCheck: "Run Full Check",
      running: "Running...",
      checkAllUsers: "Check all users for reminders",
      testBrowserFlex: "Test Flex (Browser)",
      testRent: "Force Rent Test",
      leaseNoticeAlert: "Lease Notice Deadline",
      mustNotifyBy: "Must notify by",
      daysLeft: "days left",
      finalDay: "FINAL DAY",
      viewTemplates: "View Templates",
      notifyLandlord: "Notify Landlord",
      leaseEnds: "Lease ends",
      noticePeriod: "Notice period",
      days: "days",
      notifications: "Notifications",
      viewAll: "View All",
      rentTracked: "Rent Tracked",
      setupRent: "Setup Rent",
      maintenanceRequests: "Maintenance",
      reportMaintenance: "Report maintenance issue",
      enableNotifications: "Enable notifications",
      noNotifications: "No notifications yet",
      noMaintenance: "No requests",
      analytics: "Analytics",
      upgradePromoTitle: "Unlock Full Protection", // Kept this for original free tier upsell, but replaced below
      upgradePromoText: "Upgrade to access advanced deposit tracking, maintenance workflows, and full lease analysis.",
      leasesScanned: "Leases Scanned",
      scanNewLease: "Scan New Lease",
      totalValue: "Total Value",
      trackDeposit: "Track Deposit",
      openCase: "Open Case",
      viewTimeline: "View Timeline",
      evidenceUploaded: "Evidence Uploaded",
      manageEvidence: "Manage Evidence",
      totalFiles: "Total Files",
      // New strings for upsell banners
      unlockFullProtection: "Unlock full protection",
      upgradeToLiteProtectSecure: "Upgrade to Lite, Protect or Secure for full deposit and maintenance protection.",
      upgradeToProtectForEnhancedTools: "Upgrade to Protect for enhanced tools",
      getMoreScansLineAlerts: "Get more scans, LINE alerts, and additional letter credits.",
      upgradeToProtect: "Upgrade to Protect",
      // Resolve service strings
      resolveDispute: "Resolve Your Dispute",
      resolveDescription: "Professional case handling & legal support",
      memberPrice: "Member Price",
      publicPrice: "Public Price",
      perCase: "per case",
      submitCase: "Submit Case",
      savingsVsPublic: "Save ฿1,500 vs public rate",
      upgradeForMemberRate: "Upgrade to any paid plan for member pricing",
      startResolve: "Start Resolve",
      continueCase: "Continue",
      completeCaseSubmission: "Complete your case submission",
      continueYourCase: "Continue Your Case",
      getStartedTitle: "Get started with Lease Shield",
      overdueOnly: "Overdue Only",
      fair: "Fair.",
      transparent: "Transparent.",
      protected: "Protected.",
      recentLeases: "Recent Leases",
      myNotifications: "My Notifications",
      depositAlerts: "Deposit Alerts",
      allDepositsOnTrack: "All deposits on track",
      noPropertiesAdded: "No properties added yet",
      addFirstProperty: "Add your first property to start tracking deposits, rent schedules and maintenance in one place.",
      addProperty: "Add property",
      upgradeForAdvancedTracking: "Upgrade for advanced tracking",
      alerts: "Alerts",
      manage: "Manage",
      items: "items",
    },
    th: {
      welcome: "ยินดีต้อนรับกลับมา",
      subtitle: "ป้องกันปัญหาการเช่าก่อนที่จะเกิดขึ้น",
      activeLeases: "สัญญาเช่าที่ใช้งาน",
      depositsTracked: "เงินมัดจำที่ติดตาม",
      activeCases: "คดีที่ดำเนินการ",
      cases: "คดี",
      protectionScore: "คะแนนการป้องกัน",
      protectRights: "ปกป้องสิทธิ์ของคุณ",
      uploadCta: "อัปโหลดสัญญาเช่าเพื่อรับการวิเคราะห์และประเมินความเสี่ยงอัตโนมัติทันที",
      uploadLease: "อัปโหลดสัญญาเช่า",
      upgradePremium: "อัปเกรดเป็นพรีเมียม",
      upgradeDesc: "รับการสแกนสัญญาไม่จำกัด การจัดการคดีแบบเร่งด่วน และการสนับสนุนจากผู้เชี่ยวชาญ",
      viewPlans: "ดูแผน",
      uploadFirstLease: "อัปโหลดสัญญาแรก",
      noDataYet: "ยังไม่มีข้อมูล",
      getStartedDesc: "สร้างบันทึกการเช่าที่ชัดเจนและเป็นธรรมโดยการอัปโหลดสัญญาเช่า",
      testEmail: "ทดสอบอีเมล",
      sending: "กำลังส่ง...",
      runFullCheck: "ตรวจสอบทั้งหมด",
      running: "กำลังตรวจสอบ...",
      checkAllUsers: "ตรวจสอบการแจ้งเตือนของผู้ใช้ทั้งหมด",
      testBrowserFlex: "ทดสอบ Flex",
      testRent: "ทดสอบค่าเช่า",
      leaseNoticeAlert: "กำหนดแจ้งสัญญาเช่า",
      mustNotifyBy: "ต้องแจ้งภายใน",
      daysLeft: "วันเหลือ",
      finalDay: "วันสุดท้าย",
      viewTemplates: "ดูเทมเพลต",
      notifyLandlord: "แจ้งเจ้าของบ้าน",
      leaseEnds: "สัญญาสิ้นสุด",
      noticePeriod: "ระยะแจ้ง",
      days: "วัน",
      notifications: "การแจ้งเตือน",
      viewAll: "ดูทั้งหมด",
      rentTracked: "ติดตามค่าเช่า",
      setupRent: "ตั้งค่าเช่า",
      maintenanceRequests: "การซ่อมบำรุง",
      reportMaintenance: "รายงานปัญหาซ่อมบำรุง",
      enableNotifications: "เปิดการแจ้งเตือน",
      noNotifications: "ยังไม่มีการแจ้งเตือน",
      noMaintenance: "ไม่มีคำขอ",
      analytics: "วิเคราะห์",
      upgradePromoTitle: "ปลดล็อกการป้องกันเต็มรูปแบบ",
      upgradePromoText: "อัปเกรดเพื่อเข้าถึงระบบติดตามเงินมัดจำขั้นสูง ระบบซ่อมบำรุง และการวิเคราะห์สัญญาเช่าแบบเต็มรูปแบบ",
      leasesScanned: "สัญญาเช่าที่สแกน",
      scanNewLease: "สแกนสัญญาเช่าใหม่",
      totalValue: "มูลค่ารวม",
      trackDeposit: "ติดตามเงินมัดจำ",
      openCase: "เปิดคดี",
      evidenceUploaded: "หลักฐานที่อัปโหลด",
      manageEvidence: "จัดการหลักฐาน",
      viewTimeline: "ดูไทม์ไลน์",
      totalFiles: "ไฟล์ทั้งหมด",
      // New strings for upsell banners
      unlockFullProtection: "ปลดล็อกการป้องกันเต็มรูปแบบ",
      upgradeToLiteProtectSecure: "อัปเกรดเป็น Lite, Protect หรือ Secure เพื่อการป้องกันเงินมัดจำและการซ่อมบำรุงเต็มรูปแบบ",
      upgradeToProtectForEnhancedTools: "อัปเกรดเป็น Protect สำหรับเครื่องมือขั้นสูง",
      getMoreScansLineAlerts: "รับการสแกนเพิ่มเติม การแจ้งเตือน LINE และเครดิตจดหมายเพิ่มเติม",
      upgradeToProtect: "อัปเกรดเป็น Protect",
      // Resolve service strings
      resolveDispute: "แก้ไขข้อพิพาทของคุณ",
      resolveDescription: "การจัดการคดีอย่างมืออาชีพและการสนับสนุนทางกฎหมาย",
      memberPrice: "ราคาสมาชิก",
      publicPrice: "ราคาทั่วไป",
      perCase: "ต่อคดี",
      submitCase: "ส่งคดี",
      savingsVsPublic: "ประหยัด ฿1,500 เมื่อเทียบกับราคาทั่วไป",
      upgradeForMemberRate: "อัปเกรดเป็นแผนชำระเงินใดๆ เพื่อราคาสมาชิก",
      startResolve: "เริ่ม Resolve",
      continueCase: "ดำเนินการต่อ",
      completeCaseSubmission: "กรอกข้อมูลคดีของคุณให้เสร็จสิ้น",
      continueYourCase: "ดำเนินการต่อ",
      getStartedTitle: "เริ่มต้นกับ Lease Shield",
      overdueOnly: "เฉพาะที่เกินกำหนด",
      fair: "ยุติธรรม.",
      transparent: "โปร่งใส.",
      protected: "ปลอดภัย.",
      recentLeases: "สัญญาเช่าล่าสุด",
      myNotifications: "การแจ้งเตือนของฉัน",
      depositAlerts: "การแจ้งเตือนเงินมัดจำ",
      allDepositsOnTrack: "เงินมัดจำทั้งหมดอยู่ในการติดตาม",
      noPropertiesAdded: "ยังไม่มีการเพิ่มทรัพย์สิน",
      addFirstProperty: "เพิ่มทรัพย์สินแรกของคุณเพื่อเริ่มติดตามเงินมัดจำ, กำหนดการเช่า, และการบำรุงรักษาในที่เดียว",
      addProperty: "เพิ่มทรัพย์สิน",
      upgradeForAdvancedTracking: "อัปเกรดเพื่อการติดตามขั้นสูง",
      alerts: "การแจ้งเตือน",
      manage: "จัดการ",
      items: "รายการ",
    },
    zh: {
      welcome: "欢迎回来",
      subtitle: "在问题发生之前预防租赁问题",
      activeLeases: "活跃租约",
      depositsTracked: "追踪的押金",
      activeCases: "进行中的案件",
      cases: "案件",
      protectionScore: "保护分数",
      protectRights: "保护您的权利",
      uploadCta: "上传您的租约，立即获得自动分析和风险评估",
      uploadLease: "上传租约",
      upgradePremium: "升级至高级版",
      upgradeDesc: "获得无限制租约扫描、优先案件处理和专家法律支持",
      viewPlans: "查看计划",
      uploadFirstLease: "上传第一份租约",
      noDataYet: "暂无数据",
      getStartedDesc: "通过上传租赁协议创建清晰、公平的租赁记录",
      testEmail: "测试电子邮件",
      sending: "发送中...",
      runFullCheck: "运行完整检查",
      running: "运行中...",
      checkAllUsers: "检查所有用户的提醒",
      testBrowserFlex: "测试 Flex（浏览器）",
      testRent: "强制租金测试",
      leaseNoticeAlert: "租约通知截止日期",
      mustNotifyBy: "必须在此之前通知",
      daysLeft: "剩余天数",
      finalDay: "最后一天",
      viewTemplates: "查看模板",
      notifyLandlord: "通知房东",
      leaseEnds: "租约结束",
      noticePeriod: "通知期",
      days: "天",
      notifications: "通知",
      viewAll: "查看全部",
      rentTracked: "追踪的租金",
      setupRent: "设置租金",
      maintenanceRequests: "维护请求",
      reportMaintenance: "报告维护问题",
      enableNotifications: "启用通知",
      noNotifications: "暂无通知",
      noMaintenance: "无请求",
      analytics: "分析",
      upgradePromoTitle: "解锁全面保护",
      upgradePromoText: "升级以获取高级押金跟踪、维护工作流和完整租约分析。",
      leasesScanned: "已扫描租约",
      scanNewLease: "扫描新租约",
      totalValue: "总价值",
      trackDeposit: "追踪押金",
      openCase: "开启案件",
      viewTimeline: "查看时间线",
      evidenceUploaded: "已上传证据",
      manageEvidence: "管理证据",
      totalFiles: "文件总数",
      // New strings for upsell banners
      unlockFullProtection: "解锁全面保护",
      upgradeToLiteProtectSecure: "升级到Lite、Protect或Secure，获得全面的押金和维护保护。",
      upgradeToProtectForEnhancedTools: "升级到Protect，获取增强工具",
      getMoreScansLineAlerts: "获取更多扫描、LINE提醒和额外信函额度。",
      upgradeToProtect: "升级到Protect",
      resolveDispute: "解决您的纠纷",
      resolveDescription: "专业案件处理和法律支持",
      memberPrice: "会员价",
      publicPrice: "公开价",
      perCase: "每案",
      submitCase: "提交案件",
      savingsVsPublic: "比公开价节省 ฿1,500",
      upgradeForMemberRate: "升级到任何付费计划以获得会员定价",
      startResolve: "开始 Resolve",
      continueCase: "继续",
      completeCaseSubmission: "完成您的案件提交",
      continueYourCase: "继续您的案件",
      getStartedTitle: "开始使用 Lease Shield",
      overdueOnly: "仅限逾期",
      fair: "公平。",
      transparent: "透明。",
      protected: "受保护。",
      recentLeases: "最近的租约",
      myNotifications: "我的通知",
      depositAlerts: "押金提醒",
      allDepositsOnTrack: "所有押金都在追踪中",
      noPropertiesAdded: "尚未添加物业",
      addFirstProperty: "添加您的第一个物业，开始在一个地方追踪押金、租金计划和维护。",
      addProperty: "添加物业",
      upgradeForAdvancedTracking: "升级以进行高级追踪",
      alerts: "提醒",
      manage: "管理",
      items: "项",
    },
ja: {
      welcome: "おかえりなさい",
      subtitle: "賃貸問題を未然に防ぎます",
      activeLeases: "アクティブな賃貸契約",
      depositsTracked: "追跡中の敷金",
      activeCases: "進行中のケース",
      cases: "ケース",
      protectionScore: "保護スコア",
      protectRights: "あなたの権利を守る",
      uploadCta: "賃貸契約をアップロードして、即座に自動分析とリスク評価を受けましょう",
      uploadLease: "賃貸契約をアップロード",
      upgradePremium: "プレミアムにアップグレード",
      upgradeDesc: "無制限の賃貸契約スキャン、優先ケース処理、専門家の法的サポートを取得",
      viewPlans: "プランを見る",
      uploadFirstLease: "最初の賃貸契約をアップロード",
      noDataYet: "データなし",
      getStartedDesc: "賃貸契約をアップロードして明確で公正な賃貸記録を作成",
      testEmail: "メールをテスト",
      sending: "送信中...",
      runFullCheck: "完全チェックを実行",
      running: "実行中...",
      checkAllUsers: "すべてのユーザーのリマインダーをチェック",
      testBrowserFlex: "Flexをテスト（ブラウザ）",
      testRent: "家賃テストを強制",
      leaseNoticeAlert: "賃貸契約通知期限",
      mustNotifyBy: "通知期限",
      daysLeft: "残り日数",
      finalDay: "最終日",
      viewTemplates: "テンプレートを表示",
      notifyLandlord: "家主に通知",
      leaseEnds: "賃貸契約終了",
      noticePeriod: "通知期間",
      days: "日",
      notifications: "通知",
      viewAll: "すべて表示",
      rentTracked: "追跡中の家賃",
      setupRent: "家賃を設定",
      maintenanceRequests: "メンテナンス",
      reportMaintenance: "メンテナンスの問題を報告",
      enableNotifications: "通知を有効にする",
      noNotifications: "通知なし",
      noMaintenance: "リクエストなし",
      analytics: "分析",
      upgradePromoTitle: "完全な保護を解除",
      upgradePromoText: "高度な敷金追跡、メンテナンスワークフロー、および完全な賃貸分析にアクセスするためにアップグレードしてください。",
      leasesScanned: "スキャン済み賃貸契約",
      scanNewLease: "新しい賃貸契約をスキャン",
      totalValue: "合計金額",
      trackDeposit: "敷金を追跡",
      openCase: "ケースを開く",
      viewTimeline: "タイムラインを表示",
      evidenceUploaded: "アップロードされた証拠",
      manageEvidence: "証拠を管理",
      totalFiles: "合計ファイル数",
      // New strings for upsell banners
      unlockFullProtection: "完全な保護を解除",
      upgradeToLiteProtectSecure: "Lite、Protect、またはSecureにアップグレードして、完全な預金およびメンテナンス保護を利用しましょう。",
      upgradeToProtectForEnhancedTools: "強化されたツールにはProtectにアップグレード",
      getMoreScansLineAlerts: "より多くのスキャン、LINEアラート、追加の手紙クレジットを取得。",
      upgradeToProtect: "Protectにアップグレード",
      resolveDispute: "紛争を解決する",
      resolveDescription: "プロフェッショナルなケース処理と法的サポート",
      memberPrice: "メンバー価格",
      publicPrice: "公開価格",
      perCase: "ケースごと",
      submitCase: "ケースを送信",
      savingsVsPublic: "公開価格より ฿1,500 お得",
      upgradeForMemberRate: "有料プランにアップグレードしてメンバー価格を利用",
      startResolve: "Resolveを開始",
      continueCase: "続ける",
      completeCaseSubmission: "ケースの提出を完了してください",
      continueYourCase: "ケースを続ける",
      getStartedTitle: "Lease Shieldを始める",
      overdueOnly: "期限切れのみ",
      fair: "公正。",
      transparent: "透明。",
      protected: "保護。",
      recentLeases: "最近の賃貸契約",
      myNotifications: "マイ通知",
      depositAlerts: "敷金アラート",
      allDepositsOnTrack: "すべての敷金は順調です",
      noPropertiesAdded: "まだ物件が追加されていません",
      addFirstProperty: "最初の物件を追加して、敷金、家賃スケジュール、メンテナンスを一元管理しましょう。",
      addProperty: "物件を追加",
      upgradeForAdvancedTracking: "高度な追跡のためにアップグレード",
      alerts: "アラート",
      manage: "管理",
      items: "件",
    },
    ru: {
      welcome: "Добро пожаловать",
      subtitle: "Предотвращайте проблемы с арендой до их возникновения",
      activeLeases: "Активные договоры",
      depositsTracked: "Отслеживаемые депозиты",
      activeCases: "Активные дела",
      cases: "Дела",
      protectionScore: "Уровень защиты",
      protectRights: "Защитите свои права",
      uploadCta: "Загрузите договор для мгновенного автоматического анализа и оценки рисков",
      uploadLease: "Загрузить договор",
      upgradePremium: "Обновить до Премиум",
      upgradeDesc: "Получите неограниченное сканирование договоров, приоритетную обработку дел и экспертную юридическую поддержку",
      viewPlans: "Посмотреть планы",
      uploadFirstLease: "Загрузить первый договор",
      noDataYet: "Данных пока нет",
      getStartedDesc: "Создайте чёткую и справедливую запись аренды, загрузив договор аренды",
      testEmail: "Тест Email",
      sending: "Отправка...",
      runFullCheck: "Полная проверка",
      running: "Выполняется...",
      checkAllUsers: "Проверить напоминания всех пользователей",
      testBrowserFlex: "Тест Flex (Браузер)",
      testRent: "Принудительный тест аренды",
      leaseNoticeAlert: "Крайний срок уведомления",
      mustNotifyBy: "Необходимо уведомить до",
      daysLeft: "дней осталось",
      finalDay: "ПОСЛЕДНИЙ ДЕНЬ",
      viewTemplates: "Посмотреть шаблоны",
      notifyLandlord: "Уведомить арендодателя",
      leaseEnds: "Договор заканчивается",
      noticePeriod: "Период уведомления",
      days: "дней",
      notifications: "Уведомления",
      viewAll: "Посмотреть все",
      rentTracked: "Отслеживание аренды",
      setupRent: "Настроить аренду",
      maintenanceRequests: "Обслуживание",
      reportMaintenance: "Сообщить о проблеме",
      enableNotifications: "Включить уведомления",
      noNotifications: "Уведомлений пока нет",
      noMaintenance: "Запросов нет",
      analytics: "Аналитика",
      upgradePromoTitle: "Разблокировать полную защиту",
      upgradePromoText: "Обновитесь для доступа к расширенному отслеживанию депозитов, рабочим процессам обслуживания и полному анализу договоров",
      leasesScanned: "Отсканировано договоров",
      scanNewLease: "Сканировать новый договор",
      totalValue: "Общая стоимость",
      trackDeposit: "Отслеживать депозит",
      openCase: "Открыть дело",
      evidenceUploaded: "Загружено доказательств",
      manageEvidence: "Управление доказательствами",
      viewTimeline: "Посмотреть хронологию",
      totalFiles: "Всего файлов",
      unlockFullProtection: "Разблокировать полную защиту",
      upgradeToLiteProtectSecure: "Обновитесь до Lite, Protect или Secure для полной защиты депозитов и обслуживания",
      upgradeToProtectForEnhancedTools: "Обновитесь до Protect для расширенных инструментов",
      getMoreScansLineAlerts: "Получите больше сканирований, уведомления LINE и дополнительные кредиты писем",
      upgradeToProtect: "Обновить до Protect",
      resolveDispute: "Решите свой спор",
      resolveDescription: "Профессиональное ведение дела и юридическая поддержка",
      memberPrice: "Тариф участника",
      publicPrice: "Публичный тариф",
      perCase: "за дело",
      submitCase: "Подать дело",
      savingsVsPublic: "Экономия ฿1,500 от публичного тарифа",
      upgradeForMemberRate: "Обновитесь до любого платного плана для тарифов участника",
      startResolve: "Начать Resolve",
      continueCase: "Продолжить",
      completeCaseSubmission: "Завершите подачу вашего дела",
      continueYourCase: "Продолжить ваше дело",
      getStartedTitle: "Начните с Lease Shield",
      overdueOnly: "Только просроченные",
      fair: "Справедливо.",
      transparent: "Прозрачно.",
      protected: "Защищено.",
      recentLeases: "Недавние договоры",
      myNotifications: "Мои уведомления",
      depositAlerts: "Оповещения о депозитах",
      allDepositsOnTrack: "Все депозиты отслеживаются",
      noPropertiesAdded: "Объекты еще не добавлены",
      addFirstProperty: "Добавьте свой первый объект, чтобы начать отслеживать депозиты, графики аренды и техническое обслуживание в одном месте.",
      addProperty: "Добавить объект",
      upgradeForAdvancedTracking: "Обновитесь для расширенного отслеживания",
      alerts: "Оповещения",
      manage: "Управлять",
      items: "шт.",
    },
    ko: {
      welcome: "환영합니다",
      subtitle: "임대 문제를 사전에 예방하세요",
      activeLeases: "활성 임대 계약",
      depositsTracked: "추적된 보증금",
      activeCases: "진행 중인 사례",
      cases: "사례",
      protectionScore: "보호 점수",
      protectRights: "귀하의 권리를 보호하세요",
      uploadCta: "즉시 자동 분석 및 위험 평가를 위해 임대 계약을 업로드하세요",
      uploadLease: "임대 계약 업로드",
      upgradePremium: "프리미엄으로 업그레이드",
      upgradeDesc: "무제한 임대 계약 스캔, 우선 사례 처리 및 전문 법률 지원 받기",
      viewPlans: "플랜 보기",
      uploadFirstLease: "첫 임대 계약 업로드",
      noDataYet: "아직 데이터 없음",
      getStartedDesc: "임대 계약을 업로드하여 명확하고 공정한 임대 기록 생성",
      testEmail: "이메일 테스트",
      sending: "전송 중...",
      runFullCheck: "전체 확인 실행",
      running: "실행 중...",
      checkAllUsers: "모든 사용자의 알림 확인",
      testBrowserFlex: "Flex 테스트 (브라우저)",
      testRent: "강제 임대료 테스트",
      leaseNoticeAlert: "임대 계약 통지 마감일",
      mustNotifyBy: "통지 기한",
      daysLeft: "남은 일수",
      finalDay: "마지막 날",
      viewTemplates: "템플릿 보기",
      notifyLandlord: "집주인에게 통지",
      leaseEnds: "임대 계약 종료",
      noticePeriod: "통지 기간",
      days: "일",
      notifications: "알림",
      viewAll: "전체 보기",
      rentTracked: "추적된 임대료",
      setupRent: "임대료 설정",
      maintenanceRequests: "유지보수",
      reportMaintenance: "유지보수 문제 보고",
      enableNotifications: "알림 활성화",
      noNotifications: "알림 없음",
      noMaintenance: "요청 없음",
      analytics: "분석",
      upgradePromoTitle: "전체 보호 잠금 해제",
      upgradePromoText: "고급 보증금 추적, 유지보수 워크플로우 및 완전한 임대 계약 분석에 액세스하려면 업그레이드하세요.",
      leasesScanned: "스캔된 임대 계약",
      scanNewLease: "새 임대 계약 스캔",
      totalValue: "총 가치",
      trackDeposit: "보증금 추적",
      openCase: "사례 열기",
      viewTimeline: "타임라인 보기",
      evidenceUploaded: "업로드된 증거",
      manageEvidence: "증거 관리",
      totalFiles: "총 파일 수",
      unlockFullProtection: "전체 보호 잠금 해제",
      upgradeToLiteProtectSecure: "Lite, Protect 또는 Secure로 업그레이드하여 완전한 보증금 및 유지보수 보호를 받으세요.",
      upgradeToProtectForEnhancedTools: "향상된 도구를 위해 Protect로 업그레이드",
      getMoreScansLineAlerts: "더 많은 스캔, LINE 알림 및 추가 레터 크레딧을 받으세요.",
      upgradeToProtect: "Protect로 업그레이드",
      resolveDispute: "분쟁 해결",
      resolveDescription: "전문 사례 처리 및 법률 지원",
      memberPrice: "회원 가격",
      publicPrice: "공개 가격",
      perCase: "사례당",
      submitCase: "사례 제출",
      savingsVsPublic: "공개 가격보다 ฿1,500 절약",
      upgradeForMemberRate: "회원 가격을 위해 유료 플랜으로 업그레이드",
      startResolve: "Resolve 시작",
      continueCase: "계속",
      completeCaseSubmission: "사건 제출 완료",
      continueYourCase: "사건 계속하기",
      getStartedTitle: "Lease Shield 시작하기",
      overdueOnly: "연체만",
      fair: "공정.",
      transparent: "투명.",
      protected: "보호.",
      recentLeases: "최근 임대 계약",
      myNotifications: "내 알림",
      depositAlerts: "보증금 알림",
      allDepositsOnTrack: "모든 보증금이 정상적으로 추적 중입니다",
      noPropertiesAdded: "아직 등록된 숙소가 없습니다",
      addFirstProperty: "첫 번째 숙소를 추가하여 보증금, 임대료 일정 및 유지보수를 한 곳에서 추적하세요.",
      addProperty: "숙소 추가",
      upgradeForAdvancedTracking: "고급 추적을 위해 업그레이드",
      alerts: "알림",
      manage: "관리",
      items: "개",
    }
  };

  const strings = t[language] || t.en;

  // CANONICAL: Always use user.full_name from profile record
  const greetingName = user?.display_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || strings.welcome.split(' ').pop();
  
  // DEV VERIFICATION: Check for stale data
  React.useEffect(() => {
    if (user?.full_name && greetingName) {
      const expectedFirstName = (user.display_name || user.full_name).split(' ')[0];
      if (greetingName !== expectedFirstName && !strings.welcome.includes(greetingName)) {
        console.error('❌ STALE GREETING BUG:', {
          rendered: greetingName,
          expected: expectedFirstName,
          fullName: user.full_name,
          displayName: user.display_name
        });
      }
    }
  }, [user?.full_name, user?.display_name, greetingName, language]);

  const toggleSection = (section) => {
    haptic.light();
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Auto-expand sections with important data
  React.useEffect(() => {
    if (urgentDeposits > 0) {
      setExpandedSections(prev => ({ ...prev, depositAlerts: true }));
    }
    if (unreadNotifications > 0) {
      setExpandedSections(prev => ({ ...prev, notifications: true }));
    }
    if (leases.length > 0) {
      setExpandedSections(prev => ({ ...prev, recentLeases: true }));
    }
  }, [urgentDeposits, unreadNotifications, leases.length]);

  const isLoading = leasesLoading || depositsLoading;

  const calculateOnboardingProgress = () => {
    const tasks = [
      leases.length > 0,
      deposits.length > 0,
      maintenanceRequests.length > 0,
      documents.length >= 3,
      user?.phone && user?.tenant_address,
      user?.email_notifications || user?.line_notifications
    ];

    const completedCount = tasks.filter(Boolean).length;
    const allTasksComplete = completedCount === tasks.length;

    return { completedCount, totalTasks: tasks.length, allTasksComplete };
  };

  const onboardingProgress = calculateOnboardingProgress();

  const hasNoData = leases.length === 0 && deposits.length === 0 && documents.length === 0 && maintenanceRequests.length === 0;
  const shouldShowOnboardingChecklist = !user?.onboarding_completed && (hasNoData || !onboardingProgress.allTasksComplete);

  React.useEffect(() => {
    if (user && !user.onboarding_completed) {
      const hasAnyActivity = leases.length > 0 || deposits.length > 0 || documents.length > 0 || cases.length > 0;

      if (!hasAnyActivity) {
      }
    }
  }, [user, leases, deposits, documents, cases]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    await base44.auth.updateMe({ onboarding_completed: true });
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
  };

  const hasAnyData = leases.length > 0 || deposits.length > 0 || cases.length > 0 || documents.length > 0;
  const isProtectPlan = user?.plan_tier === 'protect';

  // Auto-show Quick Guide modal on EVERY app launch (if not previously dismissed)
  React.useEffect(() => {
    if (user && !user.quick_guide_dismissed) {
      setShowQuickGuide(true);
    }
  }, [user?.id, user?.quick_guide_dismissed]);

  // Listen for Quick Guide open event from nav (always allow manual open)
  React.useEffect(() => {
    const handleOpenQuickGuide = () => {
      setShowQuickGuide(true);
    };
    window.addEventListener('openQuickGuide', handleOpenQuickGuide);
    return () => window.removeEventListener('openQuickGuide', handleOpenQuickGuide);
  }, []);

  return (
    <PullToRefresh onRefresh={handleRefresh} isDarkMode={isDarkMode}>
      <div className="min-h-screen page-transition bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
          <FloatingActionButton
            icon={Shield}
            label={strings.uploadLease}
            onClick={() => {
              haptic.medium();
              navigate(createPageUrl("UploadScan"));
            }}
            color="#C7A338"
            position="bottom-right"
          />

          <OnboardingWizard
            open={showOnboarding}
            onClose={handleOnboardingComplete}
            user={user}
            isDarkMode={isDarkMode}
            language={language}
          />

          <div className="mb-6">
            <PageHeader
              title={`${strings.welcome}, ${greetingName}`}
              subtitle={strings.subtitle}
              isDarkMode={isDarkMode}
              actions={
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{
                    background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}>
                    <div className="w-5 h-5 flex-shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                        <path d="M12 2L4 5V11C4 16 7 20.5 12 22C17 20.5 20 16 20 11V5L12 2Z" fill="#0C3B2E" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="9" y="11" width="6" height="5" rx="1" fill="#C7A338"/>
                        <path d="M10 11V9.5C10 8.67 10.67 8 11.5 8H12.5C13.33 8 14 8.67 14 9.5V11" stroke="#C7A338" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="flex items-center gap-2 text-sm sm:text-base font-semibold">
                      {language === 'zh' ? (
                        <>
                          <span style={{ color: '#FFFFFF' }}>公平。</span>
                          <span style={{ color: '#ECEFED' }}>透明。</span>
                          <span style={{ color: '#C7A338' }}>保护。</span>
                        </>
                      ) : language === 'ja' ? (
                        <>
                          <span style={{ color: '#FFFFFF' }}>公正。</span>
                          <span style={{ color: '#ECEFED' }}>透明。</span>
                          <span style={{ color: '#C7A338' }}>保護。</span>
                        </>
                      ) : language === 'ko' ? (
                        <>
                          <span style={{ color: '#FFFFFF' }}>공정。</span>
                          <span style={{ color: '#ECEFED' }}>투명。</span>
                          <span style={{ color: '#C7A338' }}>보호。</span>
                        </>
                      ) : language === 'ru' ? (
                        <>
                          <span style={{ color: '#FFFFFF' }}>Справедливо.</span>
                          <span style={{ color: '#ECEFED' }}>Прозрачно.</span>
                          <span style={{ color: '#C7A338' }}>Защищено.</span>
                        </>
                      ) : language === 'th' ? (
                        <>
                          <span style={{ color: '#FFFFFF' }}>ยุติธรรม。</span>
                          <span style={{ color: '#ECEFED' }}>โปร่งใส。</span>
                          <span style={{ color: '#C7A338' }}>ปลอดภัย。</span>
                        </>
                      ) : (
                        <>
                          <span style={{ color: '#FFFFFF', fontSize: language === 'ru' ? '0.8rem' : 'inherit' }}>Fair.</span>
                                <span style={{ color: '#ECEFED', fontSize: language === 'ru' ? '0.8rem' : 'inherit' }}>Transparent.</span>
                                <span style={{ color: '#C7A338', fontSize: language === 'ru' ? '0.8rem' : 'inherit' }}>Protected.</span>
                        </>
                      )}
                    </div>
                  </div>

                <Link to={createPageUrl("analytics")}>
                  <button
                    onClick={() => haptic.light()}
                    className="btn-interaction"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: isDarkMode ? '#374151' : '#F8FAFC',
                      color: isDarkMode ? '#F9FAFB' : '#0F172A',
                      border: isDarkMode ? '2px solid rgba(255,255,255,0.1)' : '2px solid rgba(12,59,46,0.08)',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.08)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#0C3B2E';
                      e.target.style.borderColor = '#C7A338';
                      e.target.style.color = '#FFFFFF';
                      e.target.style.boxShadow = '0 4px 12px rgba(12,59,46,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = isDarkMode ? '#374151' : '#F8FAFC';
                      e.target.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(12,59,46,0.08)';
                      e.target.style.color = isDarkMode ? '#F9FAFB' : '#0F172A';
                      e.target.style.boxShadow = isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.08)';
                    }}
                  >
                    <BarChart3 className="w-4 h-4" />
                    {strings.analytics}
                  </button>
                </Link>

                  {false && isAdmin && (
                  <>
                  <button
                    onClick={() => {
                      haptic.medium();
                      testFlexFromBrowser();
                    }}
                    disabled={testingBrowserFlex}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: testingBrowserFlex ? '#9CA3AF' : '#8B5CF6',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: testingBrowserFlex ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: testingBrowserFlex ? 0.7 : 1,
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          if (!testingBrowserFlex) {
                            e.target.style.backgroundColor = '#7C3AED';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!testingBrowserFlex) {
                            e.target.style.backgroundColor = '#8B5CF6';
                          }
                        }}
                      >
                        {testingBrowserFlex ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {strings.sending}
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3" />
                            {strings.testBrowserFlex}
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          haptic.medium();
                          testRentReminder();
                        }}
                        disabled={testingRent}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: testingRent ? '#9CA3AF' : '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: testingRent ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: testingRent ? 0.7 : 1,
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          if (!testingRent) {
                            e.target.style.backgroundColor = '#059669';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!testingRent) {
                            e.target.style.backgroundColor = '#10B981';
                          }
                        }}
                      >
                        {testingRent ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {strings.running}
                          </>
                        ) : (
                          <>
                            <Wallet className="w-3 h-3" />
                            {strings.testRent}
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          haptic.medium();
                          testDirectEmail();
                        }}
                        disabled={testingEmail}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: testingEmail ? '#9CA3AF' : '#EF4444',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: testingEmail ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: testingEmail ? 0.7 : 1,
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          if (!testingEmail) {
                            e.target.style.backgroundColor = '#DC2626';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!testingEmail) {
                            e.target.style.backgroundColor = '#EF4444';
                          }
                        }}
                      >
                        {testingEmail ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {strings.sending}
                          </>
                        ) : (
                          <>
                            <Mail className="w-3 h-3" />
                            {strings.testEmail}
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          haptic.medium();
                          checkAndNotifyOverdue();
                        }}
                        disabled={checkingOverdue}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: checkingOverdue ? '#9CA3AF' : '#F59E0B',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: checkingOverdue ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: checkingOverdue ? 0.7 : 1,
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          if (!checkingOverdue) {
                            e.target.style.backgroundColor = '#D97706';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!checkingOverdue) {
                            e.target.style.backgroundColor = '#F59E0B';
                          }
                        }}
                      >
                        {checkingOverdue ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {strings.overdueOnly}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            {strings.overdueOnly}
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          haptic.medium();
                          runScheduledReminders();
                        }}
                        disabled={runningScheduled}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: runningScheduled ? '#9CA3AF' : '#3B82F6',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: runningScheduled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: runningScheduled ? 0.7 : 1,
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          if (!runningScheduled) {
                            e.target.style.backgroundColor = '#2563EB';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!runningScheduled) {
                            e.target.style.backgroundColor = '#3B82F6';
                          }
                        }}
                        title={strings.checkAllUsers}
                      >
                        {runningScheduled ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {strings.running}
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3" />
                            {strings.runFullCheck}
                          </>
                        )}
                      </button>
                    </>
                  )}
                  </div>
                  }
                  />
                  </div>

                  {/* Onboarding Banner - Shows for new users who haven't completed onboarding */}
                  {!user?.onboarding_completed && !user?.onboarding_banner_dismissed && (
                  <OnboardingBanner
                  user={user}
                  isDarkMode={isDarkMode}
                  language={language}
                  onStartSetup={() => setShowOnboarding(true)}
                  />
                  )}

                  {/* First Session Progress - Shows in first 24 hours */}
                  <FirstSessionProgress
                  user={user}
                  leases={leases}
                  deposits={deposits}
                  documents={documents}
                  isDarkMode={isDarkMode}
                  language={language}
                  />

                  {/* Feature Tour - Auto-shows after onboarding */}
                  {user && !user.has_seen_tour && user.onboarding_completed && (
                  <FeatureTour
                  user={user}
                  isDarkMode={isDarkMode}
                  language={language}
                  onComplete={() => setShowTour(false)}
                  />
                  )}

                  {urgentLeaseNotices.length > 0 && (
            <div className="mb-6">
              {urgentLeaseNotices.slice(0, 1).map((lease) => {
                const daysUntil = differenceInDays(new Date(lease.notice_deadline), now);
                const isCritical = daysUntil <= 3;

                return (
                  <Card
                    key={lease.id}
                    className="border-none shadow-xl overflow-hidden"
                    style={{
                      backgroundColor: isDarkMode ? '#1E3A2E' : '#F0FDF4',
                      border: `2px solid ${isDarkMode ? '#0C3B2E' : '#10B981'}`
                    }}
                  >
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                          backgroundColor: '#0C3B2E'
                        }}>
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                              {strings.leaseNoticeAlert}
                            </h3>
                            <Badge
                              className="text-xs font-bold"
                              style={{
                                backgroundColor: '#C7A338',
                                color: '#FFFFFF',
                                border: 'none'
                              }}
                            >
                              {daysUntil === 0 ? strings.finalDay : `${daysUntil} ${strings.daysLeft}`}
                            </Badge>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textPrimary }}>
                              <span className="font-semibold">{strings.mustNotifyBy}:</span>
                              <span>{format(new Date(lease.notice_deadline), 'MMM d, yyyy')}</span>
                            </div>
                            {lease.property_address && (
                              <div className="flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
                                <span>🏠</span>
                                <span className="truncate">{lease.property_address}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs" style={{ color: colors.textSecondary }}>
                              {lease.end_date && (
                                <span>{strings.leaseEnds}: {format(new Date(lease.end_date), 'MMM d, yyyy')}</span>
                              )}
                              {lease.notice_period_days && (
                                <span>{lease.notice_period_days} {strings.days}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                haptic.medium();
                                navigate(createPageUrl("NoticeLetter") + `?leaseId=${lease.id}`);
                              }}
                              className="btn-interaction"
                              style={{
                                padding: '10px 18px',
                                borderRadius: '10px',
                                backgroundColor: '#0C3B2E',
                                color: '#FFFFFF',
                                border: '2px solid #C7A338',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 6px rgba(12,59,46,0.3)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#C7A338';
                                e.target.style.borderColor = '#C7A338';
                                e.target.style.color = '#1A1D1F';
                                e.target.style.boxShadow = '0 6px 10px rgba(199,163,56,0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#0C3B2E';
                                e.target.style.borderColor = '#C7A338';
                                e.target.style.color = '#FFFFFF';
                                e.target.style.boxShadow = '0 4px 6px rgba(12,59,46,0.3)';
                              }}
                            >
                              <Bell className="w-4 h-4" />
                              {strings.notifyLandlord}
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Quick Guide Modal */}
          <QuickGuide 
            user={user}
            isOpen={showQuickGuide}
            onClose={() => {
              setShowQuickGuide(false);
              queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            }}
            colors={{
              cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
              textPrimary: isDarkMode ? '#F9FAFB' : '#0F172A',
              textSecondary: isDarkMode ? '#D1D5DB' : '#475569',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(12,59,46,0.08)',
              fieldBg: isDarkMode ? '#374151' : '#F8FAFC'
            }}
            language={language}
          />



          {shouldShowOnboardingChecklist && !showOnboarding && (
            <div className="mb-6">
              <OnboardingChecklist
                user={user}
                leases={leases}
                deposits={deposits}
                documents={documents}
                cases={cases}
                maintenanceRequests={maintenanceRequests}
                isDarkMode={isDarkMode}
                language={language}
              />
            </div>
          )}

          {/* FREE TIER UPSELL - Clean and professional */}
          {isFreeTier && (
            <Card
              className="mb-6 border-none shadow-xl overflow-hidden"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, #1F2937 0%, #111827 100%)'
                  : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                border: `2px solid ${isDarkMode ? 'rgba(199,163,56,0.4)' : '#C7A338'}`,
              }}
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #C7A338 0%, #D4B451 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 8px rgba(199,163,56,0.3)',
                      flexShrink: 0
                    }}>
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-gray-50">
                        {strings.unlockFullProtection}
                      </h3>
                      <p className="text-sm mb-2" style={{ color: colors.textSecondary, lineHeight: '1.5' }}>
                        {language === 'th' ? 'เริ่ม ฿190/เดือน สำหรับการป้องกันเต็มรูปแบบ' : language === 'zh' ? '从฿190/月开始全面保护' : language === 'ja' ? '฿190/月から完全保護' : language === 'ko' ? '฿190/월부터 완전 보호' : language === 'ru' ? 'От ฿190/мес для полной защиты' : 'Starting at ฿190/month for full protection'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md" style={{
                          backgroundColor: isDarkMode ? '#374151' : 'white',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          <span>✓</span> {language === 'th' ? 'สแกนสัญญา' : 'Lease Scans'}
                        </div>
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md" style={{
                          backgroundColor: isDarkMode ? '#374151' : 'white',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          <span>✓</span> {language === 'th' ? 'ติดตามเงินมัดจำ' : 'Deposit Tracking'}
                        </div>
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md" style={{
                          backgroundColor: isDarkMode ? '#374151' : 'white',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          <span>✓</span> {language === 'th' ? 'แจ้งเตือน' : 'Alerts'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link to={createPageUrl("Account") + '?showPlans=true'}>
                    <button
                      onClick={() => haptic.medium()}
                      className="btn-interaction w-full sm:w-auto"
                      style={{
                        padding: '12px 28px',
                        borderRadius: '12px',
                        backgroundColor: '#0C3B2E',
                        color: '#FFFFFF',
                        border: '2px solid #C7A338',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(12,59,46,0.3)',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#C7A338';
                        e.target.style.borderColor = '#C7A338';
                        e.target.style.color = '#1A1D1F';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 16px rgba(199,163,56,0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#0C3B2E';
                        e.target.style.borderColor = '#C7A338';
                        e.target.style.color = '#FFFFFF';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(12,59,46,0.3)';
                      }}
                    >
                      {strings.viewPlans}
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* LITE PLAN UPSELL - Subtle, refined */}
          {isLitePlan && (
            <Card
              className="mb-6 border-none shadow-lg overflow-hidden"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, #1F2937 0%, #111827 100%)'
                  : 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                border: `2px solid ${isDarkMode ? 'rgba(16,185,129,0.3)' : '#10B981'}`,
              }}
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 8px rgba(16,185,129,0.3)',
                      flexShrink: 0
                    }}>
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-gray-50">
                        {language === 'th' ? 'อัปเกรดเป็น Protect' : language === 'zh' ? '升级到Protect' : language === 'ja' ? 'Protectにアップグレード' : language === 'ko' ? 'Protect로 업그레이드' : language === 'ru' ? 'Обновить до Protect' : 'Upgrade to Protect'}
                      </h3>
                      <p className="text-sm mb-2" style={{ color: colors.textSecondary, lineHeight: '1.5' }}>
                        {language === 'th' ? '12 การสแกน/ปี • LINE • 5 เครดิต • แจ้งเตือนค่าเช่า' : language === 'zh' ? '12次扫描 • LINE • 5积分 • 租金提醒' : language === 'ja' ? '12スキャン • LINE • 5クレジット • 家賃アラート' : language === 'ko' ? '12회 스캔 • LINE • 5크레딧 • 임대료 알림' : language === 'ru' ? '12 сканирований • LINE • 5 кредитов • Напоминания' : '12 scans/year • LINE alerts • 5 letter credits'}
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{
                        backgroundColor: '#10B981',
                        color: 'white'
                      }}>
                        <span className="text-xs font-bold">฿390/mo</span>
                        <span className="text-xs opacity-75">or ฿3,900/yr</span>
                      </div>
                    </div>
                  </div>
                  <Link to={createPageUrl("Account") + '?showPlans=true'}>
                    <button
                      onClick={() => haptic.medium()}
                      className="btn-interaction w-full sm:w-auto"
                      style={{
                        padding: '12px 28px',
                        borderRadius: '12px',
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#059669';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 16px rgba(16,185,129,0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#10B981';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)';
                      }}
                    >
                      {language === 'th' ? 'อัปเกรดเลย' : language === 'zh' ? '立即升级' : language === 'ja' ? '今すぐアップグレード' : language === 'ko' ? '지금 업그레이드' : language === 'ru' ? 'Обновить сейчас' : 'Upgrade Now'}
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PROTECT PLAN UPSELL - Premium Secure upgrade */}
          {isProtectPlan && (
            <Card
              className="mb-6 border-none shadow-xl overflow-hidden"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, #1F2937 0%, #111827 100%)'
                  : 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                border: `2px solid ${isDarkMode ? 'rgba(139,92,246,0.4)' : '#8B5CF6'}`,
              }}
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.5) 0%, rgba(124, 58, 237, 0.5) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 8px rgba(139,92,246,0.3)',
                      flexShrink: 0
                    }}>
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-gray-50">
                        {language === 'th' ? 'อัปเกรดเป็น Secure' : language === 'zh' ? '升级到Secure' : language === 'ja' ? 'Secureにアップグレード' : language === 'ko' ? 'Secure로 업그레이드' : language === 'ru' ? 'Обновить до Secure' : 'Upgrade to Secure'}
                      </h3>
                      <p className="text-sm mb-2" style={{ color: colors.textSecondary, lineHeight: '1.5' }}>
                        {language === 'th' ? 'สแกนไม่จำกัด • 1 Resolve/ปี • FastTrack ฟรี • การสนับสนุนพิเศษ' : language === 'zh' ? '无限扫描 • 每年1个Resolve • 免费FastTrack • 优先支持' : language === 'ja' ? '無制限スキャン • 年1件Resolve • 無料FastTrack • 優先サポート' : language === 'ko' ? '무제한 스캔 • 연 1회 Resolve • 무료 FastTrack • 우선 지원' : language === 'ru' ? 'Безлимит • 1 Resolve/год • FastTrack бесплатно • Приоритет' : 'Unlimited scans • 1 Resolve/year • Free FastTrack • Priority support'}
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{
                        backgroundColor: '#8B5CF6',
                        color: 'white'
                      }}>
                        <span className="text-xs font-bold">฿990/mo</span>
                        <span className="text-xs opacity-75">or ฿9,900/yr</span>
                      </div>
                    </div>
                  </div>
                  <Link to={createPageUrl("Account") + '?showPlans=true'}>
                    <button
                      onClick={() => haptic.medium()}
                      className="btn-interaction w-full sm:w-auto"
                      style={{
                        padding: '12px 28px',
                        borderRadius: '12px',
                        backgroundColor: '#8B5CF6',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#7C3AED';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 16px rgba(139,92,246,0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#8B5CF6';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(139,92,246,0.3)';
                      }}
                    >
                      {language === 'th' ? 'อัปเกรดเลย' : language === 'zh' ? '立即升级' : language === 'ja' ? '今すぐアップグレード' : language === 'ko' ? '지금 업그레이드' : language === 'ru' ? 'Обновить сейчас' : 'Upgrade Now'}
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* RESOLVE DISPUTE COMPACT BANNER - Available to ALL users */}
          {(() => {
            const membership = getMembershipInfo(user);
            const qualifies = membership.qualifiesForMemberBenefits;
            const daysRemaining = membership.daysUntilMemberBenefits;

            // Check if user has an awaiting_details case already paid for
            const awaitingCase = cases.find(c => 
              c.status === 'intake' && c.stripe_session_id
            );

            const handleStartResolve = async (e) => {
              e.stopPropagation();
              haptic.medium();
              navigate(createPageUrl("resolvecase") + "?mode=new");
            };

            // BUG FIX #2: Unified pricing message
            let pricingMessage = '';
            if (awaitingCase) {
              pricingMessage = language === 'ru' ? 'Завершите ваше дело' : 'Complete your case submission';
            } else if (qualifies) {
              // Qualified for member rate (Secure immediate, or Lite/Protect after 30 days)
              const badge = membership.plan === 'secure' 
                ? (language === 'th' ? '⚡ Secure' : '⚡ Secure')
                : (language === 'th' ? '✓ สมาชิก' : '✓ Member');
              pricingMessage = language === 'ru' 
                ? `฿${RESOLVE_PRICING.MEMBER_RATE.toLocaleString()} за дело · ${strings.memberPrice} · ${strings.savingsVsPublic}`
                : `฿${RESOLVE_PRICING.MEMBER_RATE.toLocaleString()} per case · ${strings.memberPrice} · ${strings.savingsVsPublic}`;
            } else if (daysRemaining > 0) {
              // Lite/Protect under 30 days - public rate with countdown
              pricingMessage = language === 'th'
                ? `฿${RESOLVE_PRICING.PUBLIC_RATE.toLocaleString()} (อีก ${daysRemaining} วันสำหรับราคาสมาชิก)`
                : language === 'zh'
                  ? `฿${RESOLVE_PRICING.PUBLIC_RATE.toLocaleString()} (${daysRemaining}天后享会员价)`
                  : language === 'ja'
                    ? `฿${RESOLVE_PRICING.PUBLIC_RATE.toLocaleString()} (メンバー価格まであと${daysRemaining}日)`
                    : language === 'ko'
                      ? `฿${RESOLVE_PRICING.PUBLIC_RATE.toLocaleString()} (회원 가격까지 ${daysRemaining}일)`
                      : language === 'ru'
                        ? `฿${RESOLVE_PRICING.PUBLIC_RATE.toLocaleString()} (до тарифа участника ${daysRemaining} дн.)`
                        : `฿${RESOLVE_PRICING.PUBLIC_RATE.toLocaleString()} (member rate in ${daysRemaining} days)`;
            } else {
              // Free plan
              pricingMessage = language === 'ru'
                ? `฿${RESOLVE_PRICING.PUBLIC_RATE.toLocaleString()} за дело · ${strings.publicPrice} · ${strings.upgradeForMemberRate}`
                : `฿${RESOLVE_PRICING.PUBLIC_RATE.toLocaleString()} per case · ${strings.publicPrice} · ${strings.upgradeForMemberRate}`;
            }

            return (
              <div 
                className="mb-6 cursor-pointer card-interactive"
                style={{
                  background: isDarkMode ? '#2A1F1F' : '#FFE8E8',
                  borderRadius: '18px',
                  padding: '14px 16px',
                  boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(239,68,68,0.12)',
                  border: `1px solid ${isDarkMode ? '#EF444440' : '#FECACA'}`,
                  transition: 'all 0.2s'
                }}
                onClick={handleStartResolve}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = isDarkMode ? '0 6px 16px rgba(0,0,0,0.4)' : '0 6px 16px rgba(239,68,68,0.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(239,68,68,0.12)';
                }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                      backgroundColor: isDarkMode ? '#EF444430' : '#FEE2E2'
                    }}>
                      <Scale className="w-5 h-5" style={{ color: '#EF4444' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold mb-0.5" style={{ color: isDarkMode ? '#FCA5A5' : '#991B1B' }}>
                        {awaitingCase 
                          ? strings.continueYourCase
                          : strings.resolveDispute
                        }
                      </h4>
                      <p className="text-xs" style={{ color: isDarkMode ? '#F87171' : '#B91C1C' }}>
                        {awaitingCase ? strings.completeCaseSubmission : pricingMessage}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleStartResolve}
                    className="btn-interaction flex-shrink-0 w-full sm:w-auto"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.5)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 6px rgba(239,68,68,0.3)',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#DC2626';
                      e.target.style.boxShadow = '0 4px 8px rgba(239,68,68,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#EF4444';
                      e.target.style.boxShadow = '0 2px 6px rgba(239,68,68,0.3)';
                    }}
                  >
                    {awaitingCase ? strings.continueCase : strings.startResolve}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Main Content - Stats and Features */}
          {!showOnboarding && (
            <div className="content-fade-in">
              <style>
                {`
                  @keyframes slideDown {
                    from {
                      opacity: 0;
                      transform: translateY(-10px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}
              </style>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <SkeletonLoader variant="stat" isDarkMode={isDarkMode} />
                  <SkeletonLoader variant="stat" isDarkMode={isDarkMode} />
                  <SkeletonLoader variant="stat" isDarkMode={isDarkMode} />
                  <SkeletonLoader variant="stat" isDarkMode={isDarkMode} />
                  <SkeletonLoader variant="stat" isDarkMode={isDarkMode} />
                  <SkeletonLoader variant="stat" isDarkMode={isDarkMode} />
                </div>
              ) : (
                <>
                  {/* Compact Protection Score Summary */}
                  <div className="mb-6" style={{ animation: 'slideDown 0.3s ease-out' }}>
                    <Card className="border-none shadow-md bg-white dark:bg-gray-800" style={{
                      background: isDarkMode 
                        ? 'linear-gradient(135deg, #1F2937 0%, #111827 100%)'
                        : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
                      border: `2px solid ${isDarkMode ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)'}`
                    }}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 8px rgba(16,185,129,0.3)'
                            }}>
                              <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                                {language === 'th' ? 'คะแนนการป้องกัน' : language === 'zh' ? '保护分数' : language === 'ja' ? '保護スコア' : language === 'ko' ? '보호 점수' : language === 'ru' ? 'Уровень защиты' : 'Protection Score'}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                                  {protectionScore}/{tierCap}
                                </p>
                                {isLocked && (
                                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                                    <Crown className="w-4 h-4 text-amber-600" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              haptic.light();
                              setShowProtectionDetails(true);
                            }}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              backgroundColor: 'transparent',
                              border: `2px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(12,59,46,0.1)'}`,
                              color: colors.textPrimary,
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#10B981';
                              e.currentTarget.style.color = '#10B981';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(12,59,46,0.1)';
                              e.currentTarget.style.color = colors.textPrimary;
                            }}
                          >
                            {language === 'th' ? 'ดูรายละเอียด' : language === 'zh' ? '查看详情' : language === 'ja' ? '詳細を見る' : language === 'ko' ? '세부 정보 보기' : language === 'ru' ? 'Подробнее' : 'View Details'} →
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Six Feature Cards - Consistent 3-column grid */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6" style={{ animation: 'slideDown 0.3s ease-out' }}>
                    {[
                      {
                        title: strings.leasesScanned,
                        value: leases.length,
                        icon: FileText,
                        gradient: 'from-blue-500 to-blue-700',
                        scoreColor: FEATURE_COLORS.leases.accent,
                        miniStats: [],
                        route: createPageUrl("uploadscan"),
                        label: strings.scanNewLease,
                        compactTitle: language === 'ru'
                      },
                      {
                        title: strings.depositsTracked,
                        value: deposits.length,
                        icon: Wallet,
                        gradient: 'from-emerald-500 to-emerald-700',
                        scoreColor: FEATURE_COLORS.deposits.accent,
                        miniStats: [
                          { label: strings.totalValue, value: `฿${totalDepositValue.toLocaleString()}` }
                        ],
                        route: createPageUrl("PropertyTracker") + "#deposit",
                        label: strings.trackDeposit,
                        compactTitle: language === 'ru'
                      },
                      {
                        title: strings.activeCases,
                        value: activeCases.length,
                        icon: Scale,
                        gradient: 'from-red-500 to-red-700',
                        scoreColor: FEATURE_COLORS.cases.accent,
                        miniStats: [],
                        route: createPageUrl("cases"),
                        label: strings.cases,
                        onClick: () => {
                          haptic.light();
                          navigate(createPageUrl("cases"));
                        },
                        compactTitle: language === 'ru'
                      },
                      {
                        title: strings.rentTracked,
                        value: rentTrackedCount,
                        icon: Calendar,
                        gradient: 'from-amber-500 to-amber-700',
                        scoreColor: FEATURE_COLORS.rent.accent,
                        miniStats: [
                          { label: language === 'en' ? 'Alerts' : language === 'zh' ? '提醒' : language === 'ja' ? 'アラート' : language === 'ko' ? '알림' : language === 'ru' ? 'Уведомления' : 'เตือน', value: deposits.filter(d => d.rent_alerts_enabled).length }
                        ],
                        route: createPageUrl("PropertyTracker") + "#rent",
                        label: rentTrackedCount > 0 ? (language === 'en' ? 'Manage' : language === 'zh' ? '管理' : language === 'ja' ? '管理' : language === 'ko' ? '관리' : language === 'ru' ? 'Управление' : 'จัดการ') : strings.setupRent,
                        compactTitle: language === 'ru'
                      },
                      {
                        title: strings.notifications,
                        value: unreadNotifications,
                        icon: Bell,
                        gradient: 'from-purple-500 to-purple-700',
                        scoreColor: FEATURE_COLORS.notifications.accent,
                        miniStats: [],
                        route: createPageUrl("timeline"),
                        label: strings.viewTimeline,
                        compactTitle: language === 'ru'
                      },
                      {
                        title: strings.evidenceUploaded,
                        value: documents.length,
                        icon: FileText,
                        gradient: 'from-indigo-500 to-indigo-700',
                        scoreColor: FEATURE_COLORS.evidence.accent,
                        miniStats: [
                          { label: strings.totalFiles, value: documents.length }
                        ],
                        route: createPageUrl("evidencevault"),
                        label: strings.manageEvidence,
                        compactTitle: language === 'ru'
                      }
                    ].map((card, index) => (
                      <div key={index} className="w-full">
                        <StatsCard
                          {...card}
                          compact={false}
                          isDarkMode={isDarkMode}
                          className="card-interactive h-full"
                          language={language}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="space-y-4 sm:space-y-6 mb-8">
            {isLoading ? (
              <SkeletonLoader variant="card" count={3} isDarkMode={isDarkMode} />
            ) : (
              <>
                {/* Recent Leases Section - Enhanced */}
                <Card 
                  className="border-none shadow-lg overflow-hidden"
                  style={{
                    backgroundColor: isDarkMode ? '#2A2D30' : '#FFFFFF',
                    border: `1px solid ${colors.borderColor}`
                  }}
                >
                  <div 
                    className="cursor-pointer p-5 flex items-center justify-between transition-colors hover:bg-opacity-50"
                    onClick={() => toggleSection('recentLeases')}
                    style={{
                      borderBottom: expandedSections.recentLeases ? `1px solid ${colors.borderColor}` : 'none'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.5) 0%, rgba(37, 99, 235, 0.5) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 8px rgba(59,130,246,0.15)'
                      }}>
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-gray-50">
                          {strings.recentLeases}
                        </h3>
                        <p className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                          {leases.length} {strings.items}
                        </p>
                      </div>
                    </div>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {expandedSections.recentLeases ? (
                        <ChevronUp className="w-5 h-5" style={{ color: colors.textPrimary }} />
                      ) : (
                        <ChevronDown className="w-5 h-5" style={{ color: colors.textSecondary }} />
                      )}
                    </div>
                  </div>
                  {expandedSections.recentLeases && (
                    <div className="p-5">
                      <RecentLeases leases={leases} language={language} />
                    </div>
                  )}
                </Card>

                {/* Notifications Section - Enhanced */}
                <Card 
                  className="border-none shadow-lg overflow-hidden"
                  style={{
                    backgroundColor: isDarkMode ? '#2A2D30' : '#FFFFFF',
                    border: `1px solid ${colors.borderColor}`
                  }}
                >
                  <div 
                    className="cursor-pointer p-5 flex items-center justify-between transition-colors hover:bg-opacity-50"
                    onClick={() => toggleSection('notifications')}
                    style={{
                      borderBottom: expandedSections.notifications ? `1px solid ${colors.borderColor}` : 'none'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.5) 0%, rgba(124, 58, 237, 0.5) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 8px rgba(139,92,246,0.15)'
                      }}>
                        <Bell className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-gray-50">
                          {strings.myNotifications}
                        </h3>
                        <p className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                          {unreadNotifications} {language === 'th' ? 'ใหม่' : language === 'zh' ? '新' : language === 'ja' ? '新着' : language === 'ko' ? '새로운' : language === 'ru' ? 'новых' : 'unread'}
                        </p>
                      </div>
                    </div>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {expandedSections.notifications ? (
                        <ChevronUp className="w-5 h-5" style={{ color: colors.textPrimary }} />
                      ) : (
                        <ChevronDown className="w-5 h-5" style={{ color: colors.textSecondary }} />
                      )}
                    </div>
                  </div>
                  {expandedSections.notifications && (
                    <div className="p-5">
                      <NotificationSummary language={language} isDarkMode={isDarkMode} />
                    </div>
                  )}
                </Card>

                {/* Deposit Alerts Section - Enhanced */}
                <Card 
                  className="border-none shadow-lg overflow-hidden"
                  style={{
                    backgroundColor: isDarkMode ? '#2A2D30' : '#FFFFFF',
                    border: `1px solid ${colors.borderColor}`
                  }}
                >
                  <div 
                    className="cursor-pointer p-5 flex items-center justify-between transition-colors hover:bg-opacity-50"
                    onClick={() => toggleSection('depositAlerts')}
                    style={{
                      borderBottom: expandedSections.depositAlerts ? `1px solid ${colors.borderColor}` : 'none'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 8px rgba(16,185,129,0.3)'
                      }}>
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-gray-50">
                          {strings.depositAlerts}
                        </h3>
                        <p className="text-xs font-medium" style={{ color: urgentDeposits > 0 ? '#EF4444' : '#10B981' }}>
                          {urgentDeposits > 0 
                            ? `${urgentDeposits} ${strings.alerts}`
                            : strings.allDepositsOnTrack
                          }
                        </p>
                      </div>
                    </div>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {expandedSections.depositAlerts ? (
                        <ChevronUp className="w-5 h-5" style={{ color: colors.textPrimary }} />
                      ) : (
                        <ChevronDown className="w-5 h-5" style={{ color: colors.textSecondary }} />
                      )}
                    </div>
                  </div>
                  {expandedSections.depositAlerts && (
                    <div className="p-5">
                      <DepositAlert deposits={deposits} language={language} />
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>


        </div>

        {/* Protection Score Details Modal */}
        <ProtectionScoreDetails
          isOpen={showProtectionDetails}
          onClose={() => setShowProtectionDetails(false)}
          score={protectionScore}
          actionScore={actionScore}
          tierCap={tierCap}
          isLocked={isLocked}
          userTier={userTier}
          suggestions={protectionSuggestions}
          isDarkMode={isDarkMode}
          language={language}
        />
      </div>
    </PullToRefresh>
  );
}

export default function Dashboard() {
  return (
    <AuthGuard>
      <ToastProvider>
        <DashboardContent />
      </ToastProvider>
    </AuthGuard>
  );
}