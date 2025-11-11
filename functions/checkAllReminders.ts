
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { createDepositReminderFlex, createLeaseNoticeFlex, createRentReminderFlex } from './lineFlexTemplates.js';

/**
 * Unified reminder check system with granular user preferences
 * Checks: deposits, leases, rent payments
 * Sends: LINE Flex Messages (primary) with email fallback
 * Logs: All notifications to NotificationLog entity
 * Respects: User preferences, quiet hours, timezone
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const deposits = await base44.asServiceRole.entities.DepositTracker.list();
    const leases = await base44.asServiceRole.entities.Lease.list();
    const users = await base44.asServiceRole.entities.User.list();
    
    const now = new Date();
    const notifications = [];
    
    // 🔍 DEBUG MODE - Log what we're checking
    console.log('🔍 DEBUG: Total deposits found:', deposits.length);
    console.log('🔍 DEBUG: Total users found:', users.length);

    const getUserByEmail = (email) => users.find(u => u.email === email);

    // Helper to check if notification is allowed based on user preferences
    const isNotificationAllowed = (user, notificationType) => {
      // Check if user has disabled this specific notification type
      const prefs = user.notification_preferences || {};
      
      // Map notification types to preference keys
      const typeMap = {
        '30d_deposit': 'deposit_30d',
        '7d_deposit': 'deposit_7d',
        '3d_deposit': 'deposit_3d',
        'overdue_deposit': 'deposit_overdue',
        '30d_notice': 'lease_30d',
        '7d_notice': 'lease_7d',
        '3d_notice': 'lease_3d',
        '0d_notice': 'lease_0d',
        'rent_reminder': 'rent_reminder',
        'maintenance_update': 'maintenance_updates'
      };

      const prefKey = typeMap[notificationType];
      if (prefKey && prefs[prefKey] === false) {
        console.log(`🔕 User ${user.email} disabled ${notificationType}`);
        return false;
      }

      // Check quiet hours
      if (user.quiet_hours?.enabled) {
        const userTimezone = user.notification_timezone || 'Asia/Bangkok';
        const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
        const currentHour = userTime.getHours();
        const currentMinute = userTime.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        const [startHour, startMin] = (user.quiet_hours.start || '22:00').split(':').map(Number);
        const [endHour, endMin] = (user.quiet_hours.end || '08:00').split(':').map(Number);
        const startTimeInMinutes = startHour * 60 + startMin;
        const endTimeInMinutes = endHour * 60 + endMin;

        let inQuietHours = false;
        if (startTimeInMinutes > endTimeInMinutes) {
          // Crosses midnight
          inQuietHours = currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes;
        } else {
          inQuietHours = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
        }

        if (inQuietHours) {
          console.log(`🌙 User ${user.email} in quiet hours, skipping ${notificationType}`);
          return false;
        }
      }

      return true;
    };

    // Helper to send notification with logging
    const sendNotification = async (user, messageText, subject, flexMessage = null, notificationType = '', relatedEntityType = '', relatedEntityId = '') => {
      if (!user) return false;

      // Check if notification is allowed
      if (!isNotificationAllowed(user, notificationType)) {
        console.log(`⏭️ Skipping ${notificationType} for ${user.email} (user preferences)`);
        return false;
      }

      let channel = '';
      let success = false;
      let errorMsg = '';

      // Try LINE first if enabled and flex message provided
      if (user.line_messaging_token && user.line_notifications && flexMessage) {
        try {
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: user.line_messaging_token,
            flexMessage: flexMessage
          });
          channel = 'LINE';
          success = true;
          console.log(`✅ LINE Flex sent to ${user.email}`);
        } catch (lineError) {
          console.error(`❌ LINE failed for ${user.email}:`, lineError);
          errorMsg = lineError.message;
        }
      }

      // Fallback to email
      if (!success && user.email_notifications) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: 'Lease Shield',
            to: user.email,
            subject: subject,
            body: messageText
          });
          channel = 'Email';
          success = true;
          console.log(`✅ Email sent to ${user.email}`);
        } catch (emailError) {
          console.error(`❌ Email failed for ${user.email}:`, emailError);
          errorMsg = errorMsg ? `${errorMsg}; Email: ${emailError.message}` : emailError.message;
        }
      }

      // Log notification attempt
      try {
        await base44.asServiceRole.entities.NotificationLog.create({
          user_email: user.email,
          notification_type: notificationType,
          channel: channel || 'None',
          status: success ? 'sent' : 'failed',
          related_entity_type: relatedEntityType,
          related_entity_id: relatedEntityId,
          message_preview: messageText.substring(0, 200),
          error_message: success ? null : errorMsg
        });
      } catch (logError) {
        console.error('Failed to log notification:', logError);
      }

      return success;
    };

    // ============================================
    // 1. CHECK DEPOSIT RETURN REMINDERS + AUTOMATION
    // ============================================
    for (const deposit of deposits) {
      console.log(`🔍 DEBUG: Checking deposit ${deposit.id}`, {
        status: deposit.status,
        expected_return_date: deposit.expected_return_date,
        created_by: deposit.created_by
      });
      
      if (deposit.status !== 'tracking') {
        console.log(`⏭️ Skipping deposit ${deposit.id} - status is ${deposit.status}, not "tracking"`);
        continue;
      }
      if (!deposit.expected_return_date) {
        console.log(`⏭️ Skipping deposit ${deposit.id} - no expected_return_date`);
        continue;
      }

      const user = getUserByEmail(deposit.created_by);
      if (!user) {
        console.log(`⏭️ Skipping deposit ${deposit.id} - user not found for ${deposit.created_by}`);
        continue;
      }

      const expectedDate = new Date(deposit.expected_return_date);
      const daysDiff = Math.floor((expectedDate - now) / (1000 * 60 * 60 * 24));
      
      console.log(`🔍 DEBUG: Deposit ${deposit.id} daysDiff: ${daysDiff}`);
      
      const language = user.language || 'en';
      const depositAmount = deposit.deposit_amount || 0;
      const propertyAddress = deposit.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A');
      const expectedDateStr = expectedDate.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US');

      let messageText = '';
      let subject = '';
      let flexMessage = null;
      let urgency = 'low';
      let notificationType = '';

      if (daysDiff === 30) {
        urgency = 'medium';
        notificationType = '30d_deposit';
        subject = language === 'th' ? 'อีก 30 วันถึงกำหนดคืนเงินมัดจำ' : 'Deposit due back in 30 days';
        
        flexMessage = createDepositReminderFlex({
          days: 30,
          depositAmount,
          propertyAddress,
          expectedDate: expectedDateStr,
          urgency
        }, language);
        
        messageText = language === 'th' ?
          `🔔 แจ้งเตือน Lease Shield\n\nถึงกำหนดคืนเงินมัดจำในอีก 30 วัน\n\n💰 จำนวน: ฿${depositAmount.toLocaleString()}\n🏠 ทรัพย์สิน: ${propertyAddress}\n📅 กำหนดคืน: ${expectedDateStr}\n\n💡 แนะนำ: แนบใบเสร็จและรูปภาพใน Evidence Vault ของคุณ\n\nเปิดแอป → app.leaseshield.asia` :
          `🔔 Lease Shield Reminder\n\nYour deposit is due back in 30 days\n\n💰 Amount: ฿${depositAmount.toLocaleString()}\n🏠 Property: ${propertyAddress}\n📅 Expected: ${expectedDateStr}\n\n💡 Tip: Keep receipts and photos in your Evidence Vault\n\nOpen app → app.leaseshield.asia`;

        if (await sendNotification(user, messageText, subject, flexMessage, notificationType, 'deposit', deposit.id)) {
          notifications.push({ user: user.email, type: notificationType, deposit: deposit.id });
        }
      }
      else if (daysDiff === 7) {
        urgency = 'high';
        notificationType = '7d_deposit';
        subject = language === 'th' ? 'อีก 7 วันครบกำหนดคืนเงินมัดจำ' : '7 days until deposit return';
        
        flexMessage = createDepositReminderFlex({
          days: 7,
          depositAmount,
          propertyAddress,
          expectedDate: expectedDateStr,
          urgency
        }, language);
        
        messageText = language === 'th' ?
          `⚠️ แจ้งเตือนสุดท้าย Lease Shield\n\nอีก 7 วันครบกำหนดคืนเงินมัดจำ\n\n💰 จำนวน: ฿${depositAmount.toLocaleString()}\n🏠 ทรัพย์สิน: ${propertyAddress}\n📅 กำหนดคืน: ${expectedDateStr}\n\n📝 หากยังไม่ได้รับเงิน สามารถสร้างจดหมายร้องขอได้ทันที\n\nเปิดแอป → app.leaseshield.asia` :
          `⚠️ Lease Shield Final Reminder\n\n7 days until deposit return\n\n💰 Amount: ฿${depositAmount.toLocaleString()}\n🏠 Property: ${propertyAddress}\n📅 Expected: ${expectedDateStr}\n\n📝 Generate a letter if needed\n\nOpen app → app.leaseshield.asia`;

        if (await sendNotification(user, messageText, subject, flexMessage, notificationType, 'deposit', deposit.id)) {
          notifications.push({ user: user.email, type: notificationType, deposit: deposit.id });
        }
      }
      else if (daysDiff === 3) {
        urgency = 'critical';
        notificationType = '3d_deposit';
        subject = language === 'th' ? '🚨 อีก 3 วันครบกำหนดคืนเงินมัดจำ' : '🚨 3 days until deposit return';
        
        flexMessage = createDepositReminderFlex({
          days: 3,
          depositAmount,
          propertyAddress,
          expectedDate: expectedDateStr,
          urgency
        }, language);
        
        messageText = language === 'th' ?
          `🚨 เตือนเร่งด่วน Lease Shield\n\nอีก 3 วันครบกำหนดคืนเงินมัดจำ!\n\n💰 จำนวน: ฿${depositAmount.toLocaleString()}\n🏠 ทรัพย์สิน: ${propertyAddress}\n📅 กำหนดคืน: ${expectedDateStr}\n\n⚠️ หากยังไม่ติดต่อเจ้าของบ้าน กรุณาดำเนินการทันที\n\nเปิดแอป → app.leaseshield.asia` :
          `🚨 Lease Shield Urgent\n\nOnly 3 days until deposit return!\n\n💰 Amount: ฿${depositAmount.toLocaleString()}\n🏠 Property: ${propertyAddress}\n📅 Expected: ${expectedDateStr}\n\n⚠️ Contact landlord now\n\nOpen app → app.leaseshield.asia`;

        if (await sendNotification(user, messageText, subject, flexMessage, notificationType, 'deposit', deposit.id)) {
          notifications.push({ user: user.email, type: notificationType, deposit: deposit.id });
        }
      }
      else if (daysDiff < 0) {
        // 🛡️ DEPOSIT SHIELD AUTOMATION - OVERDUE DEPOSIT (ANY NEGATIVE DAY)
        console.log(`🚨 OVERDUE DEPOSIT FOUND! ${deposit.id} - ${daysDiff} days overdue`);
        
        urgency = 'critical';
        notificationType = 'overdue_deposit';
        subject = language === 'th' ? '🚨 เงินมัดจำเกินกำหนด - Deposit Shield พร้อมช่วย' : '🚨 Deposit Overdue - Deposit Shield Ready';
        
        const daysOverdue = Math.abs(daysDiff);
        
        // Check if user already has a case for this deposit
        const existingCases = await base44.asServiceRole.entities.Case.filter({ 
          user_email: user.email,
          type: 'deposit'
        });
        
        const hasOpenCase = existingCases.some(c => 
          !['closed', 'resolved'].includes(c.status) && 
          c.summary?.includes(propertyAddress) // Assuming propertyAddress is usually part of the summary for deposit cases
        );
        
        console.log(`🔍 DEBUG: User has existing cases: ${existingCases.length}, hasOpenCase: ${hasOpenCase}`);
        console.log(`🔍 DEBUG: User notification settings:`, {
          email_notifications: user.email_notifications,
          line_notifications: user.line_notifications,
          line_messaging_token: user.line_messaging_token ? 'SET' : 'NOT SET'
        });
        
        // Create special overdue Flex Message with "Open Case" action
        flexMessage = {
          type: "bubble",
          size: "mega",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: language === 'th' ? "🚨 เงินมัดจำเกินกำหนด" : "🚨 DEPOSIT OVERDUE",
                    color: "#FFFFFF",
                    size: "lg",
                    weight: "bold"
                  },
                  {
                    type: "text",
                    text: language === 'th' ? `เกิน ${daysOverdue} วัน` : `${daysOverdue} days overdue`,
                    color: "#FFFFFF",
                    size: "sm",
                    margin: "sm"
                  }
                ],
                backgroundColor: "#DC2626",
                paddingAll: "20px",
                cornerRadius: "12px"
              }
            ]
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: language === 'th' ? "💰 จำนวนเงิน" : "💰 Amount",
                size: "xs",
                color: "#6B7280",
                margin: "md"
              },
              {
                type: "text",
                text: `฿${depositAmount.toLocaleString()}`,
                size: "xl",
                weight: "bold",
                color: "#DC2626"
              },
              {
                type: "separator",
                margin: "lg"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: language === 'th' ? "🏠 ทรัพย์สิน" : "🏠 Property",
                    size: "xs",
                    color: "#6B7280"
                  },
                  {
                    type: "text",
                    text: propertyAddress,
                    size: "sm",
                    wrap: true,
                    weight: "bold"
                  }
                ],
                margin: "lg"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: language === 'th' ? "📅 ควรคืนวันที่" : "📅 Due Date",
                    size: "xs",
                    color: "#6B7280"
                  },
                  {
                    type: "text",
                    text: expectedDateStr,
                    size: "sm",
                    weight: "bold"
                  }
                ],
                margin: "md"
              },
              {
                type: "separator",
                margin: "lg"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: language === 'th' ? "🛡️ Deposit Shield พร้อมช่วย" : "🛡️ Deposit Shield Ready",
                    size: "md",
                    weight: "bold",
                    color: "#0C3B2E",
                    margin: "md"
                  },
                  {
                    type: "text",
                    text: hasOpenCase 
                      ? (language === 'th' ? "คุณมีคดีเปิดอยู่แล้ว\nเข้าแอปเพื่อดูสถานะ" : "You have an open case\nCheck app for status")
                      : (language === 'th' ? "เปิดคดีอัตโนมัติด้วยข้อมูลเงินมัดจำของคุณ" : "Auto-open case with your deposit data"),
                    size: "xs",
                    color: "#6B7280",
                    wrap: true,
                    margin: "sm"
                  }
                ]
              }
            ],
            paddingAll: "20px"
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                style: "primary",
                action: {
                  type: "uri",
                  label: hasOpenCase 
                    ? (language === 'th' ? "ดูคดี" : "View Case")
                    : (language === 'th' ? "เปิดคดีเลย" : "Open Case Now"),
                  uri: `https://app.leaseshield.asia${hasOpenCase ? '/cases' : `/resolve-case?depositId=${deposit.id}&auto=true`}`
                },
                color: "#DC2626",
                height: "sm"
              },
              {
                type: "button",
                style: "link",
                action: {
                  type: "uri",
                  label: language === 'th' ? "ดูรายละเอียด" : "View Details",
                  uri: `https://app.leaseshield.asia/deposit-tracker`
                },
                height: "sm"
              }
            ],
            spacing: "sm",
            paddingAll: "20px"
          }
        };
        
        messageText = language === 'th' ?
          `🚨 แจ้งเตือนด่วน Lease Shield\n\n💰 เงินมัดจำเกินกำหนด ${daysOverdue} วัน\n\n🏠 ทรัพย์สิน: ${propertyAddress}\n💵 จำนวน: ฿${depositAmount.toLocaleString()}\n⏰ ควรคืน: ${expectedDateStr}\n\n🛡️ Deposit Shield พร้อมช่วยคุณ!\n\n${hasOpenCase ? '📋 คุณมีคดีเปิดอยู่แล้ว\nเข้าแอปเพื่อดูสถานะ' : '📋 คลิกเพื่อเปิดคดีอัตโนมัติ\nข้อมูลเงินมัดจำจะถูกกรอกให้อัตโนมัติ'}\n\nเปิดแอป → https://app.leaseshield.asia${hasOpenCase ? '/cases' : `/resolve-case?depositId=${deposit.id}&auto=true`}` :
          `🚨 Lease Shield Urgent Alert\n\n💰 Deposit ${daysOverdue} days overdue\n\n🏠 Property: ${propertyAddress}\n💵 Amount: ฿${depositAmount.toLocaleString()}\n⏰ Due: ${expectedDateStr}\n\n🛡️ Deposit Shield is ready to help!\n\n${hasOpenCase ? '📋 You have an open case\nCheck app for status' : '📋 Click to auto-open case\nDeposit data will be pre-filled'}\n\nOpen app → https://app.leaseshield.asia${hasOpenCase ? '/cases' : `/resolve-case?depositId=${deposit.id}&auto=true`}`;

        if (await sendNotification(user, messageText, subject, flexMessage, notificationType, 'deposit', deposit.id)) {
          notifications.push({ 
            user: user.email, 
            type: notificationType, 
            deposit: deposit.id,
            automation: 'deposit_shield',
            hasOpenCase,
            daysOverdue
          });
        }
      }
    }

    // ============================================
    // 2. CHECK LEASE NOTICE REMINDERS
    // ============================================
    for (const lease of leases) {
      if (!lease.notice_deadline || !lease.notice_alerts_enabled) continue;

      const user = getUserByEmail(lease.created_by);
      if (!user) continue;

      const noticeDeadline = new Date(lease.notice_deadline);
      const daysDiff = Math.floor((noticeDeadline - now) / (1000 * 60 * 60 * 24));
      
      const language = user.language || 'en';
      const propertyAddress = lease.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A');
      const leaseEndDate = lease.end_date ? new Date(lease.end_date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US') : 'N/A';
      const noticeDeadlineStr = noticeDeadline.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US');
      const noticePeriod = lease.notice_period_days || 30;

      let messageText = '';
      let subject = '';
      let flexMessage = null;
      let notificationType = '';

      if (daysDiff === 30) {
        notificationType = '30d_notice';
        subject = language === 'th' ? 'เตือน: อีก 30 วันถึงกำหนดแจ้งสัญญา' : 'Reminder: 30 days until notice deadline';
        
        flexMessage = createLeaseNoticeFlex({
          days: 30,
          propertyAddress,
          leaseEndDate,
          noticeDeadline: noticeDeadlineStr,
          noticePeriod
        }, language);

        messageText = language === 'th' ?
          `📅 เตือนสัญญาเช่า Lease Shield\n\nอีก 30 วันถึงกำหนดแจ้งสัญญา\n\n🏠 ทรัพย์สิน: ${propertyAddress}\n📆 สัญญาสิ้นสุด: ${leaseEndDate}\n⏰ ต้องแจ้งภายใน: ${noticeDeadlineStr}\n\nเปิดแอป → app.leaseshield.asia` :
          `📅 Lease Shield Notice Reminder\n\n30 days until notice deadline\n\n🏠 Property: ${propertyAddress}\n📆 Lease ends: ${leaseEndDate}\n⏰ Must notify by: ${noticeDeadlineStr}\n\nOpen app → app.leaseshield.asia`;

        if (await sendNotification(user, messageText, subject, flexMessage, notificationType, 'lease', lease.id)) {
          notifications.push({ user: user.email, type: notificationType, lease: lease.id });
        }
      }
      else if (daysDiff === 7) {
        notificationType = '7d_notice';
        subject = language === 'th' ? '⚠️ เหลือ 7 วัน: แจ้งเจ้าของบ้าน' : '⚠️ 7 Days Left: Notify Landlord';
        
        flexMessage = createLeaseNoticeFlex({
          days: 7,
          propertyAddress,
          leaseEndDate,
          noticeDeadline: noticeDeadlineStr,
          noticePeriod
        }, language);

        messageText = language === 'th' ?
          `⚠️ แจ้งเตือนด่วน Lease Shield\n\nเหลือ 7 วันต้องแจ้งเจ้าของบ้าน!\n\n🏠 ทรัพย์สิน: ${propertyAddress}\n🚨 ต้องแจ้งภายใน: ${noticeDeadlineStr}\n\nเปิดแอป → app.leaseshield.asia` :
          `⚠️ Lease Shield Urgent\n\n7 days left to notify!\n\n🏠 Property: ${propertyAddress}\n🚨 Must notify by: ${noticeDeadlineStr}\n\nOpen app → app.leaseshield.asia`;

        if (await sendNotification(user, messageText, subject, flexMessage, notificationType, 'lease', lease.id)) {
          notifications.push({ user: user.email, type: notificationType, lease: lease.id });
        }
      }
      else if (daysDiff === 3) {
        notificationType = '3d_notice';
        subject = language === 'th' ? '🚨 เหลือ 3 วัน: แจ้งด่วน!' : '🚨 3 Days: Notify Now!';
        
        flexMessage = createLeaseNoticeFlex({
          days: 3,
          propertyAddress,
          leaseEndDate,
          noticeDeadline: noticeDeadlineStr,
          noticePeriod
        }, language);

        messageText = language === 'th' ?
          `🚨 คำเตือนสุดท้าย Lease Shield\n\nเหลือ 3 วัน!\n\n🏠 ทรัพย์สิน: ${propertyAddress}\n🔴 ต้องแจ้งภายใน: ${noticeDeadlineStr}\n\nแจ้งเจ้าของบ้านทันที!\n\nเปิดแอป → app.leaseshield.asia` :
          `🚨 Lease Shield Final Warning\n\n3 days left!\n\n🏠 Property: ${propertyAddress}\n🔴 Must notify by: ${noticeDeadlineStr}\n\nContact landlord NOW!\n\nOpen app → app.leaseshield.asia`;

        if (await sendNotification(user, messageText, subject, flexMessage, notificationType, 'lease', lease.id)) {
          notifications.push({ user: user.email, type: notificationType, lease: lease.id });
        }
      }
      else if (daysDiff === 0) {
        notificationType = '0d_notice';
        subject = language === 'th' ? '🔴 วันนี้! ต้องแจ้งวันนี้' : '🔴 TODAY! Must Notify';
        
        flexMessage = createLeaseNoticeFlex({
          days: 0,
          propertyAddress,
          leaseEndDate,
          noticeDeadline: noticeDeadlineStr,
          noticePeriod
        }, language);

        messageText = language === 'th' ?
          `🔴 วันนี้คือกำหนด!\n\nต้องแจ้งเจ้าของบ้าน วันนี้!\n\n🏠 ทรัพย์สิน: ${propertyAddress}\n🔴 กำหนด: วันนี้\n\nเปิดแอป → app.leaseshield.asia` :
          `🔴 Deadline TODAY!\n\nMust notify landlord TODAY!\n\n🏠 Property: ${propertyAddress}\n🔴 Deadline: TODAY\n\nOpen app → app.leaseshield.asia`;

        if (await sendNotification(user, messageText, subject, flexMessage, notificationType, 'lease', lease.id)) {
          notifications.push({ user: user.email, type: notificationType, lease: lease.id });
        }
      }
    }

    // ============================================
    // 3. CHECK RENT PAYMENT REMINDERS
    // ============================================
    for (const deposit of deposits) {
      if (!deposit.rent_alerts_enabled || !deposit.rent_due_day || !deposit.rent_amount) continue;

      const user = getUserByEmail(deposit.created_by);
      if (!user) continue;

      const language = user.language || 'en';
      const currentDay = now.getDate();
      const dueDay = deposit.rent_due_day;
      const alertDaysBefore = deposit.rent_alert_days_before || 3;
      
      const targetAlertDay = dueDay - alertDaysBefore;
      const isAlertDay = currentDay === (targetAlertDay > 0 ? targetAlertDay : 1);

      if (isAlertDay) {
        const notificationType = 'rent_reminder';
        const rentAmount = deposit.rent_amount;
        const propertyAddress = deposit.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A');
        
        const subject = language === 'th' ?
          `เตือน: ค่าเช่าครบกำหนดวันที่ ${dueDay}` :
          `Reminder: Rent due on ${dueDay}${dueDay === 1 ? 'st' : dueDay === 2 ? 'nd' : dueDay === 3 ? 'rd' : 'th'}`;

        const flexMessage = createRentReminderFlex({
          rentAmount,
          propertyAddress,
          dueDay,
          daysUntilDue: alertDaysBefore
        }, language);

        const messageText = language === 'th' ?
          `💰 แจ้งเตือนค่าเช่า Lease Shield\n\nค่าเช่าครบกำหนดใน ${alertDaysBefore} วัน\n\n🏠 ทรัพย์สิน: ${propertyAddress}\n💵 จำนวน: ฿${rentAmount.toLocaleString()}\n📅 ครบกำหนด: ${dueDay} ของเดือน\n\nเปิดแอป → app.leaseshield.asia` :
          `💰 Lease Shield Rent Reminder\n\nRent due in ${alertDaysBefore} days\n\n🏠 Property: ${propertyAddress}\n💵 Amount: ฿${rentAmount.toLocaleString()}\n📅 Due: ${dueDay}${dueDay === 1 ? 'st' : dueDay === 2 ? 'nd' : dueDay === 3 ? 'rd' : 'th'}\n\nOpen app → app.leaseshield.asia`;

        if (await sendNotification(user, messageText, subject, flexMessage, notificationType, 'deposit', deposit.id)) {
          notifications.push({ user: user.email, type: notificationType, deposit: deposit.id });
        }
      }
    }

    console.log(`✅ Reminder check complete. Sent ${notifications.length} notifications.`);

    return Response.json({ 
      success: true, 
      notifications_sent: notifications.length,
      details: notifications,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Reminder check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
