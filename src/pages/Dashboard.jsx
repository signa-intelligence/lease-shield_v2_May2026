
import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, FileText, Wallet, Scale, AlertTriangle, TrendingUp, Bell, Wrench, ArrowRight, X, ChevronDown, ChevronUp, Target, Zap, Loader2, AlertCircle, Settings, Mail, Calendar, BarChart3 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { differenceInDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import StatsCard from "../components/dashboard/StatsCard";
import DepositAlert from "../components/dashboard/DepositAlert";
import RecentLeases from "../components/dashboard/RecentLeases";
import ProtectionScoreEnhanced from "../components/dashboard/ProtectionScoreEnhanced";
import NotificationSummary from "../components/dashboard/NotificationSummary";
import EmptyState from "../components/shared/EmptyState";
import SkeletonLoader from "../components/shared/SkeletonLoader";
import PullToRefresh from "../components/shared/PullToRefresh";
import { ToastProvider, useToast } from "../components/shared/Toast";
import OnboardingWizard from "../components/onboarding/OnboardingWizard";
import OnboardingChecklist from "../components/onboarding/OnboardingChecklist";
import { haptic } from "../components/shared/HapticFeedback";

function DashboardContent() {
  const [showImprovementDialog, setShowImprovementDialog] = React.useState(false);
  const [focusMode, setFocusMode] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState({
    stats: true,
    quickActions: true,
    content: true,
  });
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Regular user queries
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
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.filter({ user_email: user?.email }),
    enabled: !!user,
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

  const handleRefresh = async () => {
    haptic.light();
    await queryClient.invalidateQueries();
    toast.success(language === 'th' ? 'รีเฟรชสำเร็จ' : 'Refreshed successfully');
  };

  // Auto-refresh logic
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

  const language = user?.language || 'en';
  const accessLevel = user?.access_level || 'user';
  const isAdmin = user?.role === 'admin' || ['admin', 'super_admin'].includes(accessLevel);
  const isDarkMode = user?.theme === 'dark';

  // Client-side overdue deposit checker
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

  // Admin: Manual reminder trigger (now calls checkAndNotifyOverdue)
  const [triggeringReminders, setTriggeringReminders] = useState(false);
  
  const triggerReminders = async () => {
    setTriggeringReminders(true);
    try {
      // Call the new client-side checker instead
      await checkAndNotifyOverdue();
    } finally {
      setTriggeringReminders(false);
    }
  };

  // Admin: Full scheduled reminder system trigger
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

  const [testingOverdue, setTestingOverdue] = useState(false); // Kept, but button removed from UI
  const [testingSettings, setTestingSettings] = useState(false); // Kept, but button removed from UI
  const [testingEmail, setTestingEmail] = useState(false);

  // ADD NEW: Simple browser-based Flex test
  const [testingBrowserFlex, setTestingBrowserFlex] = React.useState(false);
  
  const testFlexFromBrowser = async () => {
    setTestingBrowserFlex(true);
    try {
      console.log('🧪 Testing Flex message from browser...');
      
      // Create a simple Flex message directly in browser
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

  // FORCE SEND rent reminder for testing - IGNORES SCHEDULE
  const testRentReminder = async () => {
    setTestingRent(true);
    try {
      // Find deposit with rent settings
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
      const rentAmount = rentDeposit.rent_amount;
      const dueDay = rentDeposit.rent_due_day;

      // Create Flex message inline
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

      // Send LINE
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

      // Send Email
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

      // Log
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


  const testOverdueCheck = async () => { // Kept, but button removed from UI
    setTestingOverdue(true);
    try {
      const response = await base44.functions.invoke('testOverdueCheck');
      console.log('🔍 Overdue test results:', response.data);
      
      const overdueCount = response.data?.overdue_deposits || 0;
      if (overdueCount > 0) {
        toast.success(
          language === 'th' 
            ? `พบเงินมัดจำเกินกำหนด ${overdueCount} รายการ!` 
            : `Found ${overdueCount} overdue deposits!`
        );
        
        alert(
          `🔍 OVERDUE CHECK RESULTS:\n\n` +
          `Total deposits: ${response.data.total_deposits}\n` +
          `Overdue deposits: ${overdueCount}\n` +
          `Details:\n${JSON.stringify(response.data.overdue_list, null, 2)}`
        );
      } else {
        toast.info(language === 'th' ? 'ไม่พบเงินมัดจำที่เกินกำหนด' : 'No overdue deposits found');
      }
    } catch (error) {
      console.error('Failed to test overdue:', error);
      toast.error(language === 'th' ? 'การทดสอบล้มเหลว' : 'Test failed');
    } finally {
      setTestingOverdue(false);
    }
  };

  const testUserSettings = async () => { // Kept, but button removed from UI
    setTestingSettings(true);
    try {
      const response = await base44.functions.invoke('testUserSettings');
      console.log('🔍 User settings:', response.data);
      
      const settings = response.data;
      
      // Build readable message
      let message = `📧 YOUR NOTIFICATION SETTINGS:\n\n`;
      message += `Email: ${settings.notification_settings?.email_notifications ? '✅ ON' : '❌ OFF'}\n`;
      message += `LINE: ${settings.notification_settings?.line_notifications ? '✅ ON' : '❌ OFF'}\n`;
      message += `LINE Token: ${settings.notification_settings?.line_messaging_token || 'N/A'}\n\n`;
      
      message += `🔕 Notification Preferences:\n`;
      const prefs = settings.notification_preferences || {};
      message += `Overdue Deposit Alerts: ${prefs.deposit_overdue === false ? '❌ DISABLED' : '✅ Enabled'}\n`;
      message += `30d Deposit: ${prefs.deposit_30d === false ? '❌ OFF' : '✅ ON'}\n`;
      message += `7d Deposit: ${prefs.deposit_7d === false ? '❌ OFF' : '✅ ON'}\n`;
      message += `3d Deposit: ${prefs.deposit_3d === false ? '❌ OFF' : '✅ ON'}\n\n`;
      
      message += `🌙 Quiet Hours: ${settings.quiet_hours?.enabled ? '✅ ON' : '❌ OFF'}\n`;
      if (settings.quiet_hours?.enabled) {
        message += `Time: ${settings.quiet_hours.start} - ${settings.quiet_hours.end}\n`;
      }
      message += `Timezone: ${settings.notification_timezone || 'N/A'}\n\n`;
      
      message += `🚨 YOUR OVERDUE DEPOSITS: ${settings.overdue_deposits?.count || 0}\n`;
      if (settings.overdue_deposits?.deposits?.length > 0) {
        settings.overdue_deposits.deposits.forEach(d => {
          message += `\n- ฿${d.amount?.toLocaleString()} at ${d.property}\n`;
          message += `  ${d.days_overdue} days overdue\n`;
        });
      }
      
      alert(message);
      
      // Check for issues
      if (!settings.notification_settings?.email_notifications && !settings.notification_settings?.line_notifications) {
        toast.error('❌ Both email and LINE are OFF!');
      } else if (prefs.deposit_overdue === false) {
        toast.error('❌ Overdue deposit alerts are DISABLED!');
      } else if (settings.quiet_hours?.enabled) {
        toast.warning('🌙 Quiet hours might be blocking notifications');
      } else {
        toast.success('✅ Settings look good!');
      }
      
    } catch (error) {
      console.error('Failed to test settings:', error);
      toast.error(language === 'th' ? 'การทดสอบล้มเหลว' : 'Test failed');
    } finally {
      setTestingSettings(false);
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

  // Calculate protection score
  const calculateProtectionScore = () => {
    let score = 0;
    let breakdown = {
      documentation: 0,
      activeProtections: 0,
      proactiveActions: 0
    };

    const hasDepositShield = user?.plan_tier === 'protect' || user?.plan_tier === 'secure';
    const hasLineNotify = user?.plan_tier === 'protect' || user?.plan_tier === 'secure';

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
  const activeCases = cases.filter(c => !['closed'].includes(c.status));

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

  // NEW: Calculate urgent lease notice deadlines
  const urgentLeaseNotices = leases.filter(lease => {
    if (!lease.notice_deadline || !lease.notice_alerts_enabled) return false;
    const noticeDeadline = new Date(lease.notice_deadline);
    const daysUntil = differenceInDays(noticeDeadline, now);
    return daysUntil >= 0 && daysUntil <= 30; // Show if 30 days or less
  }).sort((a, b) => {
    const daysA = differenceInDays(new Date(a.notice_deadline), now);
    const daysB = differenceInDays(new Date(b.notice_deadline), now);
    return daysA - daysB; // Sort by most urgent first
  });

  // NEW CALCULATIONS
  const rentTrackedCount = deposits.filter(d => d.rent_amount && d.rent_due_day).length;
  const activeMaintenanceCount = maintenanceRequests.filter(r => r.status !== 'completed' && r.status !== 'rejected').length;
  const recentNotifications = notificationLogs.slice(0, 5);

  const t = {
    en: {
      pageTitle: "My Account",
      welcome: "Welcome back",
      tagline: "Fair. Transparent. Protected.",
      subtitle: "Prevent rental problems before they happen.",
      activeLeases: "Active Leases",
      depositsTracked: "Deposits Tracked",
      activeCases: "Active Cases",
      protectionScore: "Protection Score",
      improveScoreCta: "Improve Score",
      protectRights: "Protect Your Rights",
      uploadCta: "Upload your lease for instant automated analysis and risk assessment",
      uploadLease: "Upload Lease",
      upgradePremium: "Upgrade to Premium",
      upgradeDesc: "Get unlimited lease scans, priority case handling, and expert legal support",
      viewPlans: "View Plans",
      focusMode: "Focus Mode",
      normalView: "Normal View",
      scanned: "Scanned",
      avgDeposit: "Avg Deposit",
      urgentReturns: "Due Soon",
      resolved: "Resolved",
      addDeposit: "Add Deposit",
      openCase: "Open Case",
      manageLeases: "Manage Leases",
      uploadFirstLease: "Upload First Lease",
      noDataYet: "No Data Yet",
      getStartedDesc: "Start protecting your rental rights by uploading your lease agreement",
      startNow: "Get Started",
      testEmail: "Test Email",
      sending: "Sending...",
      runFullCheck: "Run Full Check",
      running: "Running...",
      scheduledSystem: "Scheduled System",
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
      recentActivity: "Recent Activity",
      viewAll: "View All",
      rentTracked: "Rent Tracked",
      propertiesWithRent: "properties with rent",
      setupRent: "Setup Rent",
      maintenanceRequests: "Maintenance",
      activeRequests: "active requests",
      viewMaintenance: "View All",
      noNotifications: "No notifications yet",
      noRent: "No rent tracked",
      noMaintenance: "No requests",
      analytics: "Analytics",
    },
    th: {
      pageTitle: "บัญชีของฉัน",
      welcome: "ยินดีต้อนรับกลับมา",
      tagline: "ยุติธรรม โปร่งใส ปลอดภัย",
      subtitle: "ป้องกันปัญหาการเช่าก่อนที่จะเกิดขึ้น",
      activeLeases: "สัญญาเช่าที่ใช้งาน",
      depositsTracked: "เงินมัดจำที่ติดตาม",
      activeCases: "คดีที่ดำเนินการ",
      protectionScore: "คะแนนการป้องกัน",
      improveScoreCta: "เพิ่มคะแนน",
      protectRights: "ปกป้องสิทธิ์ของคุณ",
      uploadCta: "อัปโหลดสัญญาเช่าเพื่อรับการวิเคราะห์และประเมินความเสี่ยงอัตโนมัติทันที",
      uploadLease: "อัปโหลดสัญญาเช่า",
      upgradePremium: "อัปเกรดเป็นพรีเมียม",
      upgradeDesc: "รับการสแกนสัญญาไม่จำกัด การจัดการคดีแบบเร่งด่วน และการสนับสนุนจากผู้เชี่ยวชาญ",
      viewPlans: "ดูแผน",
      focusMode: "โหมดโฟกัส",
      normalView: "มุมมองปกติ",
      scanned: "สแกนแล้ว",
      avgDeposit: "มัดจำเฉลี่ย",
      urgentReturns: "ครบกำหนดเร็วๆ นี้",
      resolved: "แก้ไขแล้ว",
      addDeposit: "เพิ่มมัดจำ",
      openCase: "เปิดคดี",
      manageLeases: "จัดการสัญญา",
      uploadFirstLease: "อัปโหลดสัญญาแรก",
      noDataYet: "ยังไม่มีข้อมูล",
      getStartedDesc: "เริ่มปกป้องสิทธิ์การเช่าของคุณโดยการอัปโหลดสัญญาเช่า",
      startNow: "เริ่มเลย",
      testEmail: "ทดสอบอีเมล",
      sending: "กำลังส่ง...",
      runFullCheck: "ตรวจสอบทั้งหมด",
      running: "กำลังตรวจสอบ...",
      scheduledSystem: "ระบบตรวจสอบอัตโนมัติ",
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
      recentActivity: "กิจกรรมล่าสุด",
      viewAll: "ดูทั้งหมด",
      rentTracked: "ติดตามค่าเช่า",
      propertiesWithRent: "ทรัพย์สินที่มีค่าเช่า",
      setupRent: "ตั้งค่าเช่า",
      maintenanceRequests: "การซ่อมบำรุง",
      activeRequests: "คำขอที่ใช้งาน",
      viewMaintenance: "ดูทั้งหมด",
      noNotifications: "ยังไม่มีการแจ้งเตือน",
      noRent: "ยังไม่ได้ติดตามค่าเช่า",
      noMaintenance: "ไม่มีคำขอ",
      analytics: "วิเคราะห์",
    }
  };

  const strings = t[language];

  const iconMap = {
    FileText: FileText,
    Shield: Shield,
    Bell: Bell,
    Wrench: Wrench
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isLoading = leasesLoading || depositsLoading;

  // FIXED: Better logic for showing onboarding checklist
  // Show checklist if:
  // 1. User hasn't explicitly completed onboarding AND
  // 2. Either they have no data OR not all tasks are complete
  const calculateOnboardingProgress = () => {
    const tasks = [
      leases.length > 0, // Upload lease
      deposits.length > 0, // Track deposit
      maintenanceRequests.length > 0, // Report maintenance
      documents.length >= 3, // Upload 3+ documents
      user?.phone && user?.tenant_address, // Complete profile
      user?.email_notifications || user?.line_notifications // Enable notifications
    ];
    
    const completedCount = tasks.filter(Boolean).length;
    const allTasksComplete = completedCount === tasks.length;
    
    return { completedCount, totalTasks: tasks.length, allTasksComplete };
  };

  const onboardingProgress = calculateOnboardingProgress();
  
  // Show checklist if:
  // - User hasn't marked onboarding as complete
  // - AND (has no data at all OR has incomplete tasks)
  const hasNoData = leases.length === 0 && deposits.length === 0 && documents.length === 0 && maintenanceRequests.length === 0;
  const shouldShowOnboardingChecklist = !user?.onboarding_completed && (hasNoData || !onboardingProgress.allTasksComplete);

  // Check if user is new and should see onboarding wizard
  React.useEffect(() => {
    if (user && !user.onboarding_completed) {
      const hasAnyActivity = leases.length > 0 || deposits.length > 0 || documents.length > 0 || cases.length > 0;
      
      if (!hasAnyActivity) {
        // Don't auto-show wizard if they're already looking at checklist
        // setShowOnboarding(true); // REMOVED: Let checklist guide them instead
      }
    }
  }, [user, leases, deposits, documents, cases]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    // Mark onboarding as completed
    await base44.auth.updateMe({ onboarding_completed: true });
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
  };

  // Check if user has any data
  const hasAnyData = leases.length > 0 || deposits.length > 0 || cases.length > 0 || documents.length > 0;

  // Show empty state for completely new users (if wizard isn't currently open)
  if (!isLoading && !hasAnyData && !showOnboarding && !shouldShowOnboardingChecklist) { // Added shouldShowOnboardingChecklist here
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <EmptyState
          icon={Shield}
          title={strings.noDataYet}
          description={strings.getStartedDesc}
          illustration="leases"
          actionLabel={strings.uploadLease}
          onAction={() => navigate(createPageUrl("UploadScan"))}
          secondaryActionLabel={language === 'th' ? 'ดูแผนการป้องกัน' : 'View Protection Plans'}
          onSecondaryAction={() => navigate(createPageUrl("Account"))}
        />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} colors={colors}>
      <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
          {/* Onboarding Wizard */}
          <OnboardingWizard
            open={showOnboarding}
            onClose={handleOnboardingComplete}
            user={user}
            colors={colors}
            language={language}
          />

          {/* Header with Focus Mode Toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
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
                  <span style={{ color: '#FFFFFF' }}>Fair.</span>
                  <span style={{ color: '#ECEFED' }}>Transparent.</span>
                  <span style={{ color: '#C7A338' }}>Protected.</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* NEW: Analytics Button */}
                <Link to={createPageUrl("Analytics")}>
                  <button
                    onClick={() => haptic.light()}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: isDarkMode ? '#353A3D' : '#FFFFFF',
                      color: '#0C3B2E',
                      border: `2px solid #0C3B2E`,
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#0C3B2E';
                      e.target.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#FFFFFF';
                      e.target.style.color = '#0C3B2E';
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
                          {strings.running}
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

                {/* Focus Mode Toggle */}
                <button
                  onClick={() => {
                    haptic.light();
                    setFocusMode(!focusMode);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: focusMode ? '#C7A338' : colors.cardBg,
                    color: focusMode ? '#FFFFFF' : colors.textPrimary,
                    border: `2px solid ${focusMode ? '#C7A338' : colors.borderColor}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (!focusMode) {
                      e.target.style.backgroundColor = colors.borderColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!focusMode) {
                      e.target.style.backgroundColor = colors.cardBg;
                    }
                  }}
                >
                  <Target className="w-4 h-4" />
                  {focusMode ? strings.normalView : strings.focusMode}
                </button>
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2" style={{ 
              color: colors.textPrimary,
              letterSpacing: '-0.02em'
            }}>
              {strings.welcome}, {user?.full_name?.split(' ')[0] || 'User'}
            </h1>
            <p style={{ 
              color: colors.textSecondary, 
              fontSize: '16px', 
              lineHeight: '1.6',
              fontWeight: '500'
            }}>
              {strings.subtitle}
            </p>
          </div>

          {/* NEW: Urgent Lease Notice Deadline Alert */}
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
                                <span>{strings.noticePeriod}: {lease.notice_period_days} {strings.days}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => navigate(createPageUrl("Templates"))}
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
                              onClick={() => navigate(createPageUrl("UploadScan") + `?leaseId=${lease.id}`)}
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

          {/* FIXED: Onboarding Checklist - Shows until ALL tasks complete */}
          {shouldShowOnboardingChecklist && !showOnboarding && (
            <div className="mb-6">
              <OnboardingChecklist
                user={user}
                leases={leases}
                deposits={deposits}
                documents={documents}
                cases={cases}
                maintenanceRequests={maintenanceRequests}
                colors={colors}
                language={language}
              />
            </div>
          )}

          {/* Stats Grid - MOBILE-OPTIMIZED: Protection Score First */}
          {(!focusMode || urgentDeposits > 0 || activeCases.length > 0) && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('stats')}
                className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg hover:bg-opacity-80 transition-all"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                  {language === 'th' ? 'ภาพรวม' : 'Overview'}
                </h2>
                {expandedSections.stats ? (
                  <ChevronUp className="w-5 h-5" style={{ color: colors.textSecondary }} />
                ) : (
                  <ChevronDown className="w-5 h-5" style={{ color: colors.textSecondary }} />
                )}
              </button>

              {expandedSections.stats && (
                <>
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
                    <div className="grid grid-cols-2 gap-3" style={{ animation: 'slideDown 0.3s ease-out' }}>
                      <SkeletonLoader variant="stat" colors={colors} />
                      <SkeletonLoader variant="stat" colors={colors} />
                      <SkeletonLoader variant="stat" colors={colors} />
                      <SkeletonLoader variant="stat" colors={colors} />
                      <SkeletonLoader variant="stat" colors={colors} />
                      <SkeletonLoader variant="stat" colors={colors} />
                    </div>
                  ) : (
                    <>
                      {/* MOBILE: Protection Score first, then 2-column grid */}
                      <div className="lg:hidden space-y-3" style={{ animation: 'slideDown 0.3s ease-out' }}>
                        {/* Protection Score - Full Width at Top */}
                        <ProtectionScoreEnhanced
                          score={protectionScore}
                          breakdown={breakdown}
                          recommendations={recommendations}
                          language={language}
                          colors={colors}
                        />

                        {/* Other Stats - 2 Columns */}
                        <div className="grid grid-cols-2 gap-3">
                          <StatsCard
                            title={strings.activeLeases}
                            value={leases.length.toString()}
                            icon={FileText}
                            scoreColor="#3B82F6"
                            miniStats={leases.length > 0 ? [
                              {
                                label: language === 'th' ? 'สแกนแล้ว' : 'Scanned',
                                value: scannedLeases.length
                              },
                              {
                                label: language === 'th' ? 'เตือน' : 'Alerts',
                                value: leases.filter(l => l.notice_alerts_enabled).length
                              }
                            ] : undefined}
                            actionButton={leases.length > 0 ? {
                              label: language === 'th' ? 'จัดการ' : 'Manage',
                              link: createPageUrl("UploadScan")
                            } : undefined}
                            ctaText={leases.length === 0 ? strings.uploadFirstLease : undefined}
                            onCtaClick={leases.length === 0 ? () => navigate(createPageUrl("UploadScan")) : undefined}
                            compact
                          />

                          <StatsCard
                            title={strings.depositsTracked}
                            value={`฿${totalDepositValue.toLocaleString()}`}
                            icon={Wallet}
                            bgGradient="bg-gradient-to-br from-ls-gold to-amber-600"
                            miniStats={[
                              { label: language === 'th' ? 'เฉลี่ย' : 'Avg', value: avgDeposit > 0 ? `฿${avgDeposit.toLocaleString()}` : '—' },
                              { label: language === 'th' ? 'เร็วๆนี้' : 'Soon', value: urgentDeposits }
                            ]}
                            actionButton={{
                              label: language === 'th' ? 'เพิ่ม' : 'Add',
                              link: createPageUrl("DepositTracker")
                            }}
                            compact
                          />
                          
                          <StatsCard
                            title={strings.rentTracked}
                            value={rentTrackedCount.toString()}
                            icon={Calendar}
                            scoreColor="#3B82F6"
                            miniStats={rentTrackedCount > 0 ? [
                              {
                                label: language === 'th' ? 'เตือน' : 'Alerts',
                                value: deposits.filter(d => d.rent_alerts_enabled).length
                              }
                            ] : undefined}
                            actionButton={rentTrackedCount > 0 ? {
                              label: language === 'th' ? 'จัดการ' : 'Manage',
                              link: createPageUrl("PropertyTracker")
                            } : undefined}
                            ctaText={rentTrackedCount === 0 ? strings.setupRent : undefined}
                            onCtaClick={rentTrackedCount === 0 ? () => navigate(createPageUrl("PropertyTracker")) : undefined}
                            compact
                          />

                          <StatsCard
                            title={strings.notifications}
                            value={notificationLogs.length.toString()}
                            icon={Bell}
                            scoreColor="#8B5CF6"
                            miniStats={notificationLogs.length > 0 ? [
                              {
                                label: language === 'th' ? 'ส่งแล้ว' : 'Sent',
                                value: notificationLogs.filter(n => n.status === 'sent').length
                              },
                              {
                                label: language === 'th' ? 'ล้มเหลว' : 'Failed',
                                value: notificationLogs.filter(n => n.status === 'failed').length
                              }
                            ] : undefined}
                            actionButton={notificationLogs.length > 0 ? {
                              label: strings.viewAll,
                              link: createPageUrl("Account")
                            } : undefined}
                            ctaText={notificationLogs.length === 0 ? strings.noNotifications : undefined}
                            compact
                          />
                          
                          <StatsCard
                            title={strings.activeCases}
                            value={activeCases.length}
                            icon={Scale}
                            bgGradient="bg-gradient-to-br from-ls-charcoal to-slate-700"
                            miniStats={[
                              { label: language === 'th' ? 'แก้ไข' : 'Resolved', value: resolvedCases }
                            ]}
                            actionButton={{
                              label: language === 'th' ? 'เปิด' : 'Open',
                              link: createPageUrl("Cases")
                            }}
                            compact
                          />

                          <StatsCard
                            title={strings.maintenanceRequests}
                            value={activeMaintenanceCount.toString()}
                            icon={Wrench}
                            scoreColor="#F59E0B"
                            miniStats={activeMaintenanceCount > 0 ? [
                              {
                                label: language === 'th' ? 'เสร็จ' : 'Done',
                                value: maintenanceRequests.filter(r => r.status === 'completed').length
                              }
                            ] : undefined}
                            actionButton={activeMaintenanceCount > 0 ? {
                              label: language === 'th' ? 'ดู' : 'View',
                              link: createPageUrl("PropertyTracker")
                            } : undefined}
                            ctaText={activeMaintenanceCount === 0 ? strings.noMaintenance : undefined}
                            onCtaClick={activeMaintenanceCount === 0 ? () => navigate(createPageUrl("PropertyTracker")) : undefined}
                            compact
                          />
                        </div>
                      </div>

                      {/* DESKTOP: 4-column grid with Protection Score spanning 2 rows */}
                      <div className="hidden lg:grid lg:grid-cols-4 gap-3" style={{ animation: 'slideDown 0.3s ease-out', gridAutoRows: 'minmax(0, 1fr)' }}>
                        <StatsCard
                          title={strings.activeLeases}
                          value={leases.length.toString()}
                          icon={FileText}
                          scoreColor="#3B82F6"
                          miniStats={leases.length > 0 ? [
                            {
                              label: language === 'th' ? 'สแกนแล้ว' : 'Scanned',
                              value: scannedLeases.length
                            },
                            {
                              label: language === 'th' ? 'เตือน' : 'Alerts',
                              value: leases.filter(l => l.notice_alerts_enabled).length
                            }
                          ] : undefined}
                          actionButton={leases.length > 0 ? {
                            label: language === 'th' ? 'จัดการ' : 'Manage',
                            link: createPageUrl("UploadScan")
                          } : undefined}
                          ctaText={leases.length === 0 ? strings.uploadFirstLease : undefined}
                          onCtaClick={leases.length === 0 ? () => navigate(createPageUrl("UploadScan")) : undefined}
                          compact
                        />

                        <StatsCard
                          title={strings.depositsTracked}
                          value={`฿${totalDepositValue.toLocaleString()}`}
                          icon={Wallet}
                          bgGradient="bg-gradient-to-br from-ls-gold to-amber-600"
                          miniStats={[
                            { label: language === 'th' ? 'เฉลี่ย' : 'Avg', value: avgDeposit > 0 ? `฿${avgDeposit.toLocaleString()}` : '—' },
                            { label: language === 'th' ? 'เร็วๆนี้' : 'Soon', value: urgentDeposits }
                          ]}
                          actionButton={{
                            label: language === 'th' ? 'เพิ่ม' : 'Add',
                            link: createPageUrl("DepositTracker")
                          }}
                          compact
                        />
                        
                        <StatsCard
                          title={strings.rentTracked}
                          value={rentTrackedCount.toString()}
                          icon={Calendar}
                          scoreColor="#3B82F6"
                          miniStats={rentTrackedCount > 0 ? [
                            {
                              label: language === 'th' ? 'เตือน' : 'Alerts',
                              value: deposits.filter(d => d.rent_alerts_enabled).length
                            }
                          ] : undefined}
                          actionButton={rentTrackedCount > 0 ? {
                            label: language === 'th' ? 'จัดการ' : 'Manage',
                            link: createPageUrl("PropertyTracker")
                          } : undefined}
                          ctaText={rentTrackedCount === 0 ? strings.setupRent : undefined}
                          onCtaClick={rentTrackedCount === 0 ? () => navigate(createPageUrl("PropertyTracker")) : undefined}
                          compact
                        />

                        <div className="row-span-2">
                          <ProtectionScoreEnhanced
                            score={protectionScore}
                            breakdown={breakdown}
                            recommendations={recommendations}
                            language={language}
                            colors={colors}
                          />
                        </div>

                        <StatsCard
                          title={strings.notifications}
                          value={notificationLogs.length.toString()}
                          icon={Bell}
                          scoreColor="#8B5CF6"
                          miniStats={notificationLogs.length > 0 ? [
                            {
                              label: language === 'th' ? 'ส่งแล้ว' : 'Sent',
                              value: notificationLogs.filter(n => n.status === 'sent').length
                            },
                            {
                              label: language === 'th' ? 'ล้มเหลว' : 'Failed',
                              value: notificationLogs.filter(n => n.status === 'failed').length
                            }
                          ] : undefined}
                          actionButton={notificationLogs.length > 0 ? {
                            label: strings.viewAll,
                            link: createPageUrl("Account")
                          } : undefined}
                          ctaText={notificationLogs.length === 0 ? strings.noNotifications : undefined}
                          compact
                        />
                        
                        <StatsCard
                          title={strings.activeCases}
                          value={activeCases.length}
                          icon={Scale}
                          bgGradient="bg-gradient-to-br from-ls-charcoal to-slate-700"
                          miniStats={[
                            { label: language === 'th' ? 'แก้ไข' : 'Resolved', value: resolvedCases }
                          ]}
                          actionButton={{
                            label: language === 'th' ? 'เปิด' : 'Open',
                            link: createPageUrl("Cases")
                          }}
                          compact
                        />

                        <StatsCard
                          title={strings.maintenanceRequests}
                          value={activeMaintenanceCount.toString()}
                          icon={Wrench}
                          scoreColor="#F59E0B"
                          miniStats={activeMaintenanceCount > 0 ? [
                            {
                              label: language === 'th' ? 'เสร็จ' : 'Done',
                              value: maintenanceRequests.filter(r => r.status === 'completed').length
                            }
                          ] : undefined}
                          actionButton={activeMaintenanceCount > 0 ? {
                              label: language === 'th' ? 'ดู' : 'View',
                              link: createPageUrl("PropertyTracker")
                          } : undefined}
                          ctaText={activeMaintenanceCount === 0 ? strings.noMaintenance : undefined}
                          onCtaClick={activeMaintenanceCount === 0 ? () => navigate(createPageUrl("PropertyTracker")) : undefined}
                          compact
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Quick Actions - Priority in Focus Mode */}
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
                <Link to={createPageUrl("UploadScan")} className="w-full">
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

          {/* Main Content Grid - Collapsible in Focus Mode */}
          {(!focusMode || expandedSections.content) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {isLoading ? (
                  <SkeletonLoader variant="card" count={3} colors={colors} />
                ) : (
                  <>
                    <RecentLeases leases={leases} language={language} />
                    <NotificationSummary language={language} colors={colors} />
                  </>
                )}
              </div>
              <div>
                {isLoading ? (
                  <SkeletonLoader variant="card" colors={colors} />
                ) : (
                  <DepositAlert deposits={deposits} language={language} />
                )}
              </div>
            </div>
          )}

          {/* Upgrade Banner */}
          {user?.plan_tier === 'free' && !focusMode && (
            <div style={{
              marginTop: '24px',
              background: isDarkMode
                ? 'linear-gradient(135deg, #C7A338 0%, #d97706 100%)'
                : 'linear-gradient(135deg, #C7A338 0%, #d97706 100%)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '16px',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <TrendingUp style={{ width: '24px', height: '24px', color: '#1A1D1F' }} />
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#1A1D1F',
                      letterSpacing: '-0.01em'
                    }}>
                      {strings.upgradePremium}
                    </h3>
                  </div>
                  <p style={{
                    fontSize: '14px',
                    color: '#292524',
                    opacity: 0.9,
                    lineHeight: '1.5'
                  }}>
                    {strings.upgradeDesc}
                  </p>
                </div>
                <Link to={createPageUrl("Account")} className="w-full">
                  <button
                    onClick={() => haptic.medium()}
                    style={{
                      width: '100%',
                      backgroundColor: '#0C3B2E',
                      color: '#FFFFFF',
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
                      e.target.style.backgroundColor = '#0a2f25';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#0C3B2E';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <ArrowRight className="w-5 h-5" />
                    {strings.viewPlans}
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
