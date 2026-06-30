import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { createDepositReminderFlex, createLeaseNoticeFlex, createRentReminderFlex } from './lineFlexTemplates.js';

/**
 * Comprehensive scheduled reminder system with Rich LINE Flex Messages
 * Checks deposits, leases, and rent alerts for ALL users
 * Designed to run daily via cron job or manual trigger
 */

Deno.serve(async (req) => {
  const startTime = Date.now();
  const diagnostics = {
    total_users: 0,
    users_checked: 0,
    deposits_checked: 0,
    leases_checked: 0,
    notifications_sent: 0,
    errors: [],
    breakdown: {
      deposit_30d: 0,
      deposit_7d: 0,
      deposit_3d: 0,
      deposit_overdue: 0,
      lease_30d: 0,
      lease_7d: 0,
      lease_3d: 0,
      lease_0d: 0,
      rent_reminder: 0,
    }
  };

  try {
    const base44 = createClientFromRequest(req);

    const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    const headerSecret = req.headers.get('x-internal-secret');
    let guardBody = {};
    try { guardBody = await req.clone().json(); } catch (_e) { guardBody = {}; }
    const providedSecret = headerSecret || guardBody.internal_secret;
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('🚀 Starting scheduled reminders check...');

    // Fetch ALL users
    let users = [];
    try {
      const allUsers = await base44.asServiceRole.entities.User.list();
      users = allUsers.filter(u => u.email);
      diagnostics.total_users = users.length;
      console.log(`✅ Found ${users.length} users`);
    } catch (err) {
      console.error('❌ Failed to fetch users:', err);
      diagnostics.errors.push(`User fetch failed: ${err.message}`);
      return Response.json({ error: 'Failed to fetch users', diagnostics }, { status: 500 });
    }

    const now = new Date();

    // Process each user
    for (const user of users) {
      diagnostics.users_checked++;
      console.log(`\n👤 Checking user: ${user.email}`);

      // Skip if both notifications disabled
      if (!user.email_notifications && !user.line_notifications) {
        console.log(`⏭️ Skipping ${user.email} - all notifications disabled`);
        continue;
      }

      const language = user.language || 'en';

      // ============================================
      // 1. CHECK DEPOSITS
      // ============================================
      try {
        const deposits = await base44.asServiceRole.entities.DepositTracker.filter({ 
          created_by: user.email,
          status: 'tracking'
        });
        
        diagnostics.deposits_checked += deposits.length;
        console.log(`📦 Found ${deposits.length} deposits for ${user.email}`);

        for (const deposit of deposits) {
          if (!deposit.expected_return_date) continue;

          const expectedDate = new Date(deposit.expected_return_date);
          const daysDiff = Math.floor((expectedDate - now) / (1000 * 60 * 60 * 24));

          let shouldNotify = false;
          let notificationType = '';
          let urgency = 'low';

          const depositAmount = deposit.deposit_amount || 0;
          const propertyAddress = deposit.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A');
          const expectedDateStr = expectedDate.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US');

          if (daysDiff === 30) {
            shouldNotify = true;
            notificationType = 'deposit_30d';
            urgency = 'medium';
          } else if (daysDiff === 7) {
            shouldNotify = true;
            notificationType = 'deposit_7d';
            urgency = 'high';
          } else if (daysDiff === 3) {
            shouldNotify = true;
            notificationType = 'deposit_3d';
            urgency = 'critical';
          } else if (daysDiff < 0) {
            shouldNotify = true;
            notificationType = 'deposit_overdue';
            urgency = 'critical';
          }

          if (shouldNotify) {
            const flexMessage = createDepositReminderFlex({
              days: daysDiff < 0 ? daysDiff : daysDiff,
              depositAmount,
              propertyAddress,
              expectedDate: expectedDateStr,
              urgency
            }, language);

            const sent = await sendNotification(base44, user, flexMessage, notificationType, 'deposit', deposit.id, language);
            if (sent) {
              diagnostics.notifications_sent++;
              diagnostics.breakdown[notificationType]++;
              console.log(`✅ Sent ${notificationType} for deposit ${deposit.id}`);
            }
          }
        }
      } catch (err) {
        console.error(`❌ Deposit check failed for ${user.email}:`, err);
        diagnostics.errors.push(`Deposit check ${user.email}: ${err.message}`);
      }

      // ============================================
      // 2. CHECK LEASES
      // ============================================
      try {
        const leases = await base44.asServiceRole.entities.Lease.filter({ 
          created_by: user.email
        });
        
        diagnostics.leases_checked += leases.length;
        console.log(`📄 Found ${leases.length} leases for ${user.email}`);

        for (const lease of leases) {
          if (!lease.notice_deadline || !lease.notice_alerts_enabled) continue;

          const noticeDeadline = new Date(lease.notice_deadline);
          const daysDiff = Math.floor((noticeDeadline - now) / (1000 * 60 * 60 * 24));

          let shouldNotify = false;
          let notificationType = '';

          const propertyAddress = lease.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A');
          const leaseEndDate = lease.end_date ? new Date(lease.end_date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US') : 'N/A';
          const noticeDeadlineStr = noticeDeadline.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US');
          const noticePeriod = lease.notice_period_days || 30;

          if (daysDiff === 30) {
            shouldNotify = true;
            notificationType = 'lease_30d';
          } else if (daysDiff === 7) {
            shouldNotify = true;
            notificationType = 'lease_7d';
          } else if (daysDiff === 3) {
            shouldNotify = true;
            notificationType = 'lease_3d';
          } else if (daysDiff === 0) {
            shouldNotify = true;
            notificationType = 'lease_0d';
          }

          if (shouldNotify) {
            const flexMessage = createLeaseNoticeFlex({
              days: daysDiff,
              propertyAddress,
              leaseEndDate,
              noticeDeadline: noticeDeadlineStr,
              noticePeriod
            }, language);

            const sent = await sendNotification(base44, user, flexMessage, notificationType, 'lease', lease.id, language);
            if (sent) {
              diagnostics.notifications_sent++;
              diagnostics.breakdown[notificationType]++;
              console.log(`✅ Sent ${notificationType} for lease ${lease.id}`);
            }
          }
        }
      } catch (err) {
        console.error(`❌ Lease check failed for ${user.email}:`, err);
        diagnostics.errors.push(`Lease check ${user.email}: ${err.message}`);
      }

      // ============================================
      // 3. CHECK RENT ALERTS
      // ============================================
      try {
        const rentDeposits = await base44.asServiceRole.entities.DepositTracker.filter({ 
          created_by: user.email,
          rent_alerts_enabled: true
        });

        for (const deposit of rentDeposits) {
          if (!deposit.rent_due_day || !deposit.rent_amount) continue;

          const currentDay = now.getDate();
          const dueDay = deposit.rent_due_day;
          const alertDaysBefore = deposit.rent_alert_days_before || 3;
          const targetAlertDay = dueDay - alertDaysBefore;
          const isAlertDay = currentDay === (targetAlertDay > 0 ? targetAlertDay : 1);

          if (isAlertDay) {
            const rentAmount = deposit.rent_amount;
            const propertyAddress = deposit.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A');

            const flexMessage = createRentReminderFlex({
              rentAmount,
              propertyAddress,
              dueDay,
              daysUntilDue: alertDaysBefore
            }, language);

            const sent = await sendNotification(base44, user, flexMessage, 'rent_reminder', 'deposit', deposit.id, language);
            if (sent) {
              diagnostics.notifications_sent++;
              diagnostics.breakdown.rent_reminder++;
              console.log(`✅ Sent rent_reminder for deposit ${deposit.id}`);
            }
          }
        }
      } catch (err) {
        console.error(`❌ Rent check failed for ${user.email}:`, err);
        diagnostics.errors.push(`Rent check ${user.email}: ${err.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n✅ Reminder check complete in ${duration}ms`);
    console.log(`📊 Sent ${diagnostics.notifications_sent} notifications`);

    return Response.json({
      success: true,
      duration_ms: duration,
      diagnostics
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
    return Response.json({
      success: false,
      error: error.message,
      diagnostics
    }, { status: 500 });
  }
});

// Helper function to send notification with Rich Flex Messages
async function sendNotification(base44, user, flexMessage, notificationType, entityType, entityId, language) {
  const channels = [];
  
  // Generate fallback plain text for email
  const plainText = generatePlainTextFromFlex(flexMessage, language);

  // Send to LINE with Flex Message if enabled
  // TIER GATING: LINE notifications require Protect or Secure tier
  const userTier = user.plan_tier || 'free';
  const lineAllowed = ['protect', 'secure'].includes(userTier);
  
  if (user.line_messaging_token && user.line_notifications && lineAllowed) {
    try {
      await base44.asServiceRole.functions.invoke('sendLineMessage', {
        userId: user.line_messaging_token,
        flexMessage: flexMessage
      });
      channels.push('LINE');
      console.log(`✅ LINE Flex sent to ${user.email}`);
    } catch (err) {
      console.error(`❌ LINE failed for ${user.email}:`, err);
    }
  } else if (!lineAllowed) {
    console.log(`⏭️ LINE skipped for ${user.email} - tier: ${userTier} (requires Protect/Secure)`);
  }

  // Send to Email if enabled
  if (user.email_notifications) {
    try {
      const subject = flexMessage.altText || 'Lease Shield Notification';
      await base44.integrations.Core.SendEmail({
        from_name: 'Lease Shield',
        to: user.email,
        subject: subject,
        body: plainText
      });
      channels.push('Email');
      console.log(`✅ Email sent to ${user.email}`);
    } catch (err) {
      console.error(`❌ Email failed for ${user.email}:`, err);
    }
  }

  // Log notifications
  for (const channel of channels) {
    try {
      await base44.asServiceRole.entities.NotificationLog.create({
        user_email: user.email,
        notification_type: notificationType,
        channel: channel,
        status: 'sent',
        related_entity_type: entityType,
        related_entity_id: entityId,
        message_preview: plainText.substring(0, 200)
      });
    } catch (err) {
      console.error(`❌ Failed to log notification:`, err);
    }
  }

  return channels.length > 0;
}

// Generate plain text version for email from Flex Message
function generatePlainTextFromFlex(flexMessage, language) {
  const bubble = flexMessage.contents;
  const header = bubble.header?.contents[0]?.contents || [];
  const body = bubble.body?.contents || [];
  
  let text = '';
  
  // Extract title from header
  const titleBox = header.find(c => c.type === 'text' && c.weight === 'bold');
  if (titleBox) {
    text += `${titleBox.text}\n`;
  }
  
  // Extract subtitle
  const subtitleBox = bubble.header?.contents.find(c => c.type === 'text' && c.size === 'sm');
  if (subtitleBox) {
    text += `${subtitleBox.text}\n\n`;
  }
  
  // Extract body content
  const contentBox = body.find(b => b.type === 'box' && b.layout === 'vertical');
  if (contentBox) {
    contentBox.contents.forEach(item => {
      if (item.type === 'box' && item.layout === 'baseline') {
        const label = item.contents[0]?.text || '';
        const value = item.contents[1]?.text || '';
        text += `${label}: ${value}\n`;
      }
    });
  }
  
  // Extract tip
  const tipBox = body.find(b => b.backgroundColor && b.cornerRadius);
  if (tipBox) {
    const tip = tipBox.contents[0]?.text || '';
    text += `\n${tip}\n`;
  }
  
  // Add link
  text += `\n${language === 'th' ? 'เปิดแอป' : 'Open app'} → https://app.leaseshield.asia/DepositTracker`;
  
  return text;
}