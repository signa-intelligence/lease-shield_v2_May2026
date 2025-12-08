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
import EmptyState from "../components/shared/EmptyState";
import SkeletonLoader from "../components/shared/SkeletonLoader";
import PullToRefresh from "../components/shared/PullToRefresh";
import { ToastProvider, useToast } from "../components/shared/Toast";
import OnboardingChecklist from "../components/onboarding/OnboardingChecklist";
import FirstSessionProgress from "../components/onboarding/FirstSessionProgress";
import { haptic } from "../components/shared/HapticFeedback";
import FloatingActionButton from "../components/shared/FloatingActionButton";
import { getFeatureCardStyles, FEATURE_COLORS } from "../components/shared/featureTheme";
import PageHeader from "../components/shared/PageHeader";
import { RESOLVE_PRICING, hasMemberPricing, getMembershipInfo, getResolvePricingForUser } from "../components/shared/resolvePricing";

function DashboardContent() {
  const [expandedSections, setExpandedSections] = React.useState({
    stats: true,
    quickActions: true,
    content: true,
    recentLeases: false,
    notifications: false,
    depositAlerts: false,
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

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

  const handleRefresh = async () => {
    haptic.light();
    await queryClient.invalidateQueries();
    toast.success(language === 'th' ? 'รีเฟรชสำเร็จ' : 'Refreshed successfully');
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
    let score = 0;
    let breakdown = {
      documentation: 0,
      activeProtections: 0,
      proactiveActions: 0
    };

    const scannedLeases = leases.filter(l => l.status === 'scanned' || l.status === 'paid');
    if (scannedLeases.length > 0) breakdown.documentation += 15;
    if (deposits.length > 0) breakdown.documentation += 10;
    if (documents.length > 0) breakdown.documentation += 10;
    if (documents.length >= 5) breakdown.documentation += 5;

    const activeDepositsForProtectionScore = deposits.filter(d => d.status === 'tracking');
    if (activeDepositsForProtectionScore.length > 0) breakdown.activeProtections += 10;

    const rentAlertsEnabled = deposits.some(d => d.rent_alerts_enabled);
    if (rentAlertsEnabled) breakdown.activeProtections += 7;

    if (maintenanceRequests.length > 0) breakdown.activeProtections += 6;

    if (user?.email_notifications || user?.line_notifications) breakdown.activeProtections += 7;

    const now = new Date();
    const recentLeases = leases.filter(l => {
      const leaseDate = new Date(l.created_date);
      const daysSinceCreated = differenceInDays(now, leaseDate);
      return daysSinceCreated <= 90;
    });
    if (recentLeases.length > 0) breakdown.proactiveActions += 10;

    const recentDeposits = deposits.filter(d => {
      const depositDate = new Date(d.created_date);
      const daysSinceCreated = differenceInDays(now, depositDate);
      return daysSinceCreated <= 90;
    });
    if (recentDeposits.length > 0) breakdown.proactiveActions += 8;

    const recentDocuments = documents.filter(doc => {
      const docDate = new Date(doc.created_date);
      const daysSinceCreated = differenceInDays(now, docDate);
      return daysSinceCreated <= 30;
    });
    if (recentDocuments.length > 0) breakdown.proactiveActions += 7;

    if (recentDocuments.length >= 3) breakdown.proactiveActions += 5;

    score = breakdown.documentation + breakdown.activeProtections + breakdown.proactiveActions;

    const recommendations = [];

    if (scannedLeases.length === 0) {
      recommendations.push({
        action: language === 'th' ? 'สแกนสัญญาเช่า' : 'Scan your lease',
        points: 15,
        route: 'UploadScan',
        icon: 'FileText'
      });
    }
    if (deposits.length === 0) {
      recommendations.push({
        action: language === 'th' ? 'เริ่มติดตามเงินมัดจำ' : 'Start tracking deposit',
        points: 10,
        route: 'DepositTracker',
        icon: 'Shield'
      });
    }

    return { score, breakdown, recommendations: recommendations.slice(0, 5) };
  };

  const protectionData = calculateProtectionScore();
  const { score: protectionScore, breakdown, recommendations } = protectionData;

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
      getStartedDesc: "Start protecting your rental rights by uploading your lease agreement",
      getStarted: "Get started with Lease Shield",
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
      upgradePromoText: "Upgrade to access advanced deposit tracking, maintenance workflows, and full AI-powered lease analysis.", // Kept this for original free tier upsell, but replaced below
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
      getStartedDesc: "เริ่มปกป้องสิทธิ์การเช่าของคุณโดยการอัปโหลดสัญญาเช่า",
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
      upgradePromoText: "อัปเกรดเพื่อเข้าถึงระบบติดตามเงินมัดจำขั้นสูง ระบบซ่อมบำรุง และการวิเคราะห์สัญญาเช่าด้วย AI แบบเต็มรูปแบบ",
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
      getStartedDesc: "通过上传租赁协议开始保护您的租赁权利",
      getStarted: "开始使用 Lease Shield",
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
      upgradePromoText: "升级以获取高级押金跟踪、维护工作流和全AI驱动的租约分析。",
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
      getStartedDesc: "賃貸契約をアップロードして賃貸権の保護を開始",
      getStarted: "Lease Shieldを始める",
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
      upgradePromoText: "高度な敷金追跡、メンテナンスワークフロー、およびAIを活用した完全な賃貸分析にアクセスするためにアップグレードしてください。",
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
      getStartedDesc: "Начните защищать свои права арендатора, загрузив договор аренды",
      getStarted: "Начните с Lease Shield",
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
      upgradePromoText: "Обновитесь для доступа к расширенному отслеживанию депозитов, рабочим процессам обслуживания и полному анализу договоров с помощью ИИ",
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
      getStartedDesc: "임대 계약을 업로드하여 임대 권리 보호 시작",
      getStarted: "Lease Shield 시작하기",
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
      upgradePromoText: "고급 보증금 추적, 유지보수 워크플로우 및 완전한 AI 기반 임대 계약 분석에 액세스하려면 업그레이드하세요.",
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
    }
  };

  const strings = t[language] || t.en;

  const toggleSection = (section) => {
    haptic.light();
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  const shouldShowOnboardingChecklist = !onboardingProgress.allTasksComplete;

  const hasAnyData = leases.length > 0 || deposits.length > 0 || cases.length > 0 || documents.length > 0;

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

          <div className="mb-6">
            <PageHeader
              title={`${strings.welcome}, ${user?.full_name?.split(' ')[0] || 'User'}`}
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

                  {isAdmin && (
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
                            Overdue Only
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Overdue Only
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

                  {/* First Session Progress - Shows in first 24 hours */}
                  <FirstSessionProgress
                  user={user}
                  leases={leases}
                  deposits={deposits}
                  documents={documents}
                  isDarkMode={isDarkMode}
                  language={language}
                  />

                  {/* Onboarding Checklist - Persistent collapsible checklist */}
                  {shouldShowOnboardingChecklist && (
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

                  {urgentLeaseNotices.length > 0 && (
            <div className="mb-6">
              {urgentLeaseNotices.slice(0, 1).map((lease) => {
                const daysUntil = differenceInDays(new Date(lease.notice_deadline), now);
                const isCritical = daysUntil <= 3;
                const isUrgent = daysUntil <= 7;

                return (
                  <Card
                    key={lease.id}
                    className="border-none shadow-xl overflow-hidden"
                    style={{
                      background: isCritical
                        ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
                        : isUrgent
                          ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                          : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                    }}
                  >
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-white">
                              {strings.leaseNoticeAlert}
                            </h3>
                            <Badge
                              className="text-xs font-bold"
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                color: '#FFFFFF',
                                border: '1px solid rgba(255, 255, 255, 0.5)'
                              }}
                            >
                              {daysUntil === 0 ? strings.finalDay : `${daysUntil} ${strings.daysLeft}`}
                            </Badge>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-white/90 text-sm">
                              <span className="font-semibold">{strings.mustNotifyBy}:</span>
                              <span>{format(new Date(lease.notice_deadline), 'MMM d, yyyy')}</span>
                            </div>
                            {lease.property_address && (
                              <div className="flex items-center gap-2 text-white/80 text-xs">
                                <span>🏠</span>
                                <span className="truncate">{lease.property_address}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-white/80 text-xs">
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
                              onClick={() => navigate(createPageUrl("templates"))}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                color: '#FFFFFF',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                              }}
                            >
                              <FileText className="w-4 h-4" />
                              {strings.viewTemplates}
                            </button>
                            <button
                              onClick={() => navigate(createPageUrl("uploadscan") + `?leaseId=${lease.id}`)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                backgroundColor: '#FFFFFF',
                                color: isCritical ? '#DC2626' : isUrgent ? '#F59E0B' : '#3B82F6',
                                border: 'none',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
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



          {/* FREE TIER UPSELL BANNER */}
          {isFreeTier && (
            <div
              className="mb-6 p-4 sm:p-5 rounded-2xl shadow-lg"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(199,163,56,0.15) 0%, rgba(12,59,46,0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(199,163,56,0.08) 0%, rgba(12,59,46,0.08) 100%)',
                border: `2px solid ${isDarkMode ? 'rgba(199,163,56,0.3)' : 'rgba(12,59,46,0.2)'}`,
              }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold mb-1 text-gray-900 dark:text-gray-50">
                  {strings.unlockFullProtection}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {strings.upgradeToLiteProtectSecure}
                  </p>
                </div>
                <Link to={createPageUrl("Account") + '?showPlans=true'}>
                  <button
                    onClick={() => haptic.medium()}
                    className="btn-interaction"
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      backgroundColor: '#0C3B2E',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: '600',
                      fontSize: language === 'ru' ? '13px' : '14px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 8px rgba(12,59,46,0.3)',
                      whiteSpace: language === 'ru' ? 'normal' : 'nowrap',
                      textAlign: 'center',
                      lineHeight: '1.3'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#C7A338';
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 6px 10px rgba(199,163,56,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#0C3B2E';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 8px rgba(12,59,46,0.3)';
                    }}
                  >
                    {strings.viewPlans}
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* LITE PLAN UPSELL */}
          {isLitePlan && (
            <div
              className="mb-6 p-5 rounded-2xl shadow-lg"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(199,163,56,0.15) 0%, rgba(12,59,46,0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(199,163,56,0.08) 0%, rgba(12,59,46,0.08) 100%)',
                border: `2px solid ${isDarkMode ? 'rgba(199,163,56,0.3)' : 'rgba(12,59,46,0.2)'}`,
              }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-50">
                    {strings.upgradeToProtectForEnhancedTools}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {strings.getMoreScansLineAlerts}
                  </p>
                </div>
                <Link to={createPageUrl("Account") + '?showPlans=true'}>
                  <button
                    onClick={() => haptic.medium()}
                    className="btn-interaction"
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      backgroundColor: '#C7A338',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 8px rgba(199,163,56,0.3)',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#D4B451';
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 6px 10px rgba(199,163,56,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#C7A338';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 8px rgba(199,163,56,0.3)';
                    }}
                  >
                    {strings.upgradeToProtect}
                  </button>
                </Link>
              </div>
            </div>
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
                          ? (language === 'ru' ? 'Продолжить дело' : 'Continue Your Case')
                          : strings.resolveDispute
                        }
                      </h4>
                      <p className="text-xs" style={{ color: isDarkMode ? '#F87171' : '#B91C1C' }}>
                        {pricingMessage}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleStartResolve}
                    className="btn-interaction flex-shrink-0 w-full sm:w-auto"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#EF4444',
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
                  <div className="mb-6" style={{ animation: 'slideDown 0.3s ease-out' }}>
                    <ProtectionScoreEnhanced
                      score={protectionScore}
                      breakdown={breakdown}
                      recommendations={recommendations}
                      language={language}
                      isDarkMode={isDarkMode}
                      user={user}
                    />
                  </div>

                  {/* Six Feature Cards - Fixed consistent grid layout */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6" style={{ animation: 'slideDown 0.3s ease-out' }}>
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
                        route: createPageUrl("propertytracker") + "#deposit",
                        label: strings.trackDeposit,
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
                        }
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
                        route: createPageUrl("propertytracker") + "#rent",
                        label: rentTrackedCount > 0 ? (language === 'en' ? 'Manage' : language === 'zh' ? '管理' : language === 'ja' ? '管理' : language === 'ko' ? '관리' : language === 'ru' ? 'Управление' : 'จัดการ') : strings.setupRent,
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
                      }
                    ].map((card, index) => (
                      <div key={index} className="w-full">
                        <StatsCard
                          {...card}
                          compact={false}
                          isDarkMode={isDarkMode}
                          className="card-interactive h-full"
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          <div className="space-y-4 sm:space-y-6 mb-8">
            {isLoading ? (
              <SkeletonLoader variant="card" count={3} isDarkMode={isDarkMode} />
            ) : (
              <>
                {/* Recent Leases Section */}
                <Card 
                  className="border-none shadow-xl overflow-hidden bg-white dark:bg-gray-800"
                >
                  <div 
                    className="cursor-pointer p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700"
                    onClick={() => toggleSection('recentLeases')}
                  >
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: '#3B82F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-gray-50">
                          {language === 'th' ? 'สัญญาเช่าล่าสุด' : language === 'zh' ? '最近的租约' : language === 'ja' ? '最近の賃貸契約' : language === 'ko' ? '최근 임대 계약' : language === 'ru' ? 'Последние договоры' : 'Recent Leases'}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {leases.length} {language === 'th' ? 'รายการ' : language === 'zh' ? '项' : language === 'ja' ? '件' : language === 'ko' ? '항목' : language === 'ru' ? 'элементов' : 'items'}
                        </p>
                      </div>
                    </div>
                    {expandedSections.recentLeases ? (
                      <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  {expandedSections.recentLeases && (
                    <div className="p-4">
                      <RecentLeases leases={leases} language={language} />
                    </div>
                  )}
                </Card>

                {/* Notifications Section */}
                <Card 
                  className="border-none shadow-xl overflow-hidden bg-white dark:bg-gray-800"
                >
                  <div 
                    className="cursor-pointer p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700"
                    onClick={() => toggleSection('notifications')}
                  >
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: '#8B5CF6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-gray-50">
                          {language === 'th' ? 'การแจ้งเตือนของฉัน' : language === 'zh' ? '我的通知' : language === 'ja' ? 'マイ通知' : language === 'ko' ? '내 알림' : language === 'ru' ? 'Мои уведомления' : 'My Notifications'}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {unreadNotifications} {language === 'th' ? 'การแจ้งเตือน' : language === 'zh' ? '通知' : language === 'ja' ? '通知' : language === 'ko' ? '알림' : language === 'ru' ? 'уведомлений' : 'notifications'}
                        </p>
                      </div>
                    </div>
                    {expandedSections.notifications ? (
                      <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  {expandedSections.notifications && (
                    <div className="p-4">
                      <NotificationSummary language={language} isDarkMode={isDarkMode} />
                    </div>
                  )}
                </Card>

                {/* Deposit Alerts Section */}
                <Card 
                  className="border-none shadow-xl overflow-hidden bg-white dark:bg-gray-800"
                >
                  <div 
                    className="cursor-pointer p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700"
                    onClick={() => toggleSection('depositAlerts')}
                  >
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Wallet className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-gray-50">
                          {language === 'th' ? 'การแจ้งเตือนเงินมัดจำ' : language === 'zh' ? '押金提醒' : language === 'ja' ? '敷金アラート' : language === 'ko' ? '보증금 알림' : language === 'ru' ? 'Уведомления о депозитах' : 'Deposit Alerts'}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {urgentDeposits > 0 
                            ? `${urgentDeposits} ${language === 'th' ? 'การแจ้งเตือน' : language === 'zh' ? '提醒' : language === 'ja' ? 'アラート' : language === 'ko' ? '알림' : language === 'ru' ? 'уведомлений' : 'alerts'}`
                            : (language === 'th' ? 'ทุกอย่างเรียบร้อย' : language === 'zh' ? '一切正常' : language === 'ja' ? 'すべて正常' : language === 'ko' ? '모두 정상' : language === 'ru' ? 'Все депозиты в порядке' : 'All deposits on track')
                          }
                        </p>
                      </div>
                    </div>
                    {expandedSections.depositAlerts ? (
                      <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  {expandedSections.depositAlerts && (
                    <div className="p-4">
                      <DepositAlert deposits={deposits} language={language} />
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>

          {expandedSections.quickActions && (
            <div style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)'
                : 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
              borderRadius: '24px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              animation: 'scaleIn 0.3s ease-out',
            }}>
              <style>
                {`
                  @keyframes scaleIn {
                    from {
                      opacity: 0;
                      transform: scale(0.95);
                    }
                    to {
                      opacity: 1;
                      transform: scale(1);
                    }
                  }
                `}
              </style>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '16px',
              }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    marginBottom: '12px',
                    letterSpacing: '-0.01em'
                  }}>
                    {strings.protectRights}
                  </h2>
                  <p style={{
                    fontSize: '16px',
                    color: '#D1FAE5',
                    lineHeight: '1.6'
                  }}>
                    {strings.uploadCta}
                  </p>
                </div>
                <Link to={createPageUrl("uploadscan")} className="w-full">
                  <button
                    onClick={() => haptic.medium()}
                    style={{
                      width: '100%',
                      backgroundColor: '#C7A338',
                      color: '#1A1D1F',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#D4B451';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#C7A338';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <Shield className="w-5 h-5" />
                    {strings.uploadLease}
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}

export default function Dashboard() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}