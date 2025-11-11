import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Comprehensive scheduled reminder system
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
    
    console.log('🚀 Starting scheduled reminders check...');

    // Fetch ALL users
    let users = [];
    try {
      const allUsers = await base44.asServiceRole.entities.User.list();
      users = allUsers.filter(u => u.email); // Only users with email
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
          let message = '';

          const depositAmount = deposit.deposit_amount || 0;
          const propertyAddress = deposit.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A');
          const caseUrl = `https://app.leaseshield.asia/ResolveCase?depositId=${deposit.id}&auto=true`;

          if (daysDiff === 30) {
            shouldNotify = true;
            notificationType = 'deposit_30d';
            message = language === 'th' ?
              `🔔 แจ้งเตือน Lease Shield\n\nเงินมัดจำครบกำหนดคืนในอีก 30 วัน\n\n💰 จำนวน: ฿${depositAmount.toLocaleString()}\n🏠 ทรัพย์สิน: ${propertyAddress}\n\n💡 แนะนำ: เก็บใบเสร็จและรูปภาพไว้ใน Evidence Vault\n\nเปิดแอป → https://app.leaseshield.asia/DepositTracker` :
              `🔔 Lease Shield Reminder\n\nDeposit due back in 30 days\n\n💰 Amount: ฿${depositAmount.toLocaleString()}\n🏠 Property: ${propertyAddress}\n\n💡 Tip: Keep receipts in your Evidence Vault\n\nOpen app → https://app.leaseshield.asia/DepositTracker`;
          } else if (daysDiff === 7) {
            shouldNotify = true;
            notificationType = 'deposit_7d';
            message = language === 'th' ?
              `⚠️ แจ้งเตือน Lease Shield\n\nอีก 7 วันครบกำหนดคืนเงินมัดจำ\n\n💰 จำนวน: ฿${depositAmount.toLocaleString()}\n🏠 ทรัพย์สิน: ${propertyAddress}\n\n📝 หากยังไม่ได้รับเงิน พร้อมช่วยคุณ\n\nเปิดแอป → https://app.leaseshield.asia/DepositTracker` :
              `⚠️ Lease Shield Alert\n\n7 days until deposit return\n\n💰 Amount: ฿${depositAmount.toLocaleString()}\n🏠 Property: ${propertyAddress}\n\n📝 We're here if you need help\n\nOpen app → https://app.leaseshield.asia/DepositTracker`;
          } else if (daysDiff === 3) {
            shouldNotify = true;
            notificationType = 'deposit_3d';
            message = language === 'th' ?
              `🚨 เตือนเร่งด่วน Lease Shield\n\nอีก 3 วันครบกำหนดคืนเงินมัดจำ!\n\n💰 จำนวน: ฿${depositAmount.toLocaleString()}\n🏠 ทรัพย์สิน: ${propertyAddress}\n\n⚠️ หากยังไม่ติดต่อเจ้าของบ้าน กรุณาดำเนินการทันที\n\nเปิดแอป → https://app.leaseshield.asia/DepositTracker` :
              `🚨 Lease Shield Urgent\n\nOnly 3 days until deposit return!\n\n💰 Amount: ฿${depositAmount.toLocaleString()}\n🏠 Property: ${propertyAddress}\n\n⚠️ Contact landlord now\n\nOpen app → https://app.leaseshield.asia/DepositTracker`;
          } else if (daysDiff < 0) {
            shouldNotify = true;
            notificationType = 'deposit_overdue';
            const daysOverdue = Math.abs(daysDiff);
            message = language === 'th' ?
              `🚨 แจ้งเตือนด่วน Lease Shield\n\n💰 เงินมัดจำเกินกำหนด ${daysOverdue} วัน\n\n🏠 ทรัพย์สิน: ${propertyAddress}\n💵 จำนวน: ฿${depositAmount.toLocaleString()}\n\n🛡️ Deposit Shield พร้อมช่วยคุณ!\n\n📋 คลิกเพื่อเปิดคดีอัตโนมัติ\n\n${caseUrl}` :
              `🚨 Lease Shield Urgent Alert\n\n💰 Deposit ${daysOverdue} days overdue\n\n🏠 Property: ${propertyAddress}\n💵 Amount: ฿${depositAmount.toLocaleString()}\n\n🛡️ Deposit Shield is ready to help!\n\n📋 Click to auto-open case\n\n${caseUrl}`;
          }

          if (shouldNotify) {
            const sent = await sendNotification(base44, user, message, notificationType, 'deposit', deposit.id);
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
          let message = '';

          const propertyAddress = lease.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A');
          const leaseEndDate = lease.end_date ? new Date(lease.end_date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US') : 'N/A';

          if (daysDiff === 30) {
            shouldNotify = true;
            notificationType = 'lease_30d';
            message = language === 'th' ?
              `📅 เตือนสัญญาเช่า Lease Shield\n\nอีก 30 วันถึงกำหนดแจ้งสัญญา\n\n🏠 ทรัพย์สิน: ${propertyAddress}\n📆 สัญญาสิ้นสุด: ${leaseEndDate}\n\nเปิดแอป → https://app.leaseshield.asia/UploadScan` :
              `📅 Lease Shield Notice Reminder\n\n30 days until notice deadline\n\n🏠 Property: ${propertyAddress}\n📆 Lease ends: ${leaseEndDate}\n\nOpen app → https://app.leaseshield.asia/UploadScan`;
          } else if (daysDiff === 7) {
            shouldNotify = true;
            notificationType = 'lease_7d';
            message = language === 'th' ?
              `⚠️ แจ้งเตือนด่วน Lease Shield\n\nเหลือ 7 วันต้องแจ้งเจ้าของบ้าน!\n\n🏠 ทรัพย์สิน: ${propertyAddress}\n\nเปิดแอป → https://app.leaseshield.asia/UploadScan` :
              `⚠️ Lease Shield Urgent\n\n7 days left to notify!\n\n🏠 Property: ${propertyAddress}\n\nOpen app → https://app.leaseshield.asia/UploadScan`;
          } else if (daysDiff === 3) {
            shouldNotify = true;
            notificationType = 'lease_3d';
            message = language === 'th' ?
              `🚨 คำเตือนสุดท้าย Lease Shield\n\nเหลือ 3 วัน!\n\n🏠 ทรัพย์สิน: ${propertyAddress}\n\nแจ้งเจ้าของบ้านทันที!\n\nเปิดแอป → https://app.leaseshield.asia/UploadScan` :
              `🚨 Lease Shield Final Warning\n\n3 days left!\n\n🏠 Property: ${propertyAddress}\n\nContact landlord NOW!\n\nOpen app → https://app.leaseshield.asia/UploadScan`;
          } else if (daysDiff === 0) {
            shouldNotify = true;
            notificationType = 'lease_0d';
            message = language === 'th' ?
              `🔴 วันนี้คือกำหนด!\n\nต้องแจ้งเจ้าของบ้าน วันนี้!\n\n🏠 ทรัพย์สิน: ${propertyAddress}\n\nเปิดแอป → https://app.leaseshield.asia/UploadScan` :
              `🔴 Deadline TODAY!\n\nMust notify landlord TODAY!\n\n🏠 Property: ${propertyAddress}\n\nOpen app → https://app.leaseshield.asia/UploadScan`;
          }

          if (shouldNotify) {
            const sent = await sendNotification(base44, user, message, notificationType, 'lease', lease.id);
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
            
            const message = language === 'th' ?
              `💰 แจ้งเตือนค่าเช่า Lease Shield\n\nค่าเช่าครบกำหนดใน ${alertDaysBefore} วัน\n\n🏠 ทรัพย์สิน: ${propertyAddress}\n💵 จำนวน: ฿${rentAmount.toLocaleString()}\n📅 ครบกำหนด: ${dueDay} ของเดือน\n\nเปิดแอป → https://app.leaseshield.asia/DepositTracker` :
              `💰 Lease Shield Rent Reminder\n\nRent due in ${alertDaysBefore} days\n\n🏠 Property: ${propertyAddress}\n💵 Amount: ฿${rentAmount.toLocaleString()}\n📅 Due: ${dueDay}${dueDay === 1 ? 'st' : dueDay === 2 ? 'nd' : dueDay === 3 ? 'rd' : 'th'}\n\nOpen app → https://app.leaseshield.asia/DepositTracker`;

            const sent = await sendNotification(base44, user, message, 'rent_reminder', 'deposit', deposit.id);
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

// Helper function to send notification
async function sendNotification(base44, user, message, notificationType, entityType, entityId) {
  const channels = [];

  // Send to LINE if enabled
  if (user.line_messaging_token && user.line_notifications) {
    try {
      await base44.asServiceRole.functions.invoke('sendLineMessage', {
        userId: user.line_messaging_token,
        message: message
      });
      channels.push('LINE');
    } catch (err) {
      console.error(`❌ LINE failed for ${user.email}:`, err);
    }
  }

  // Send to Email if enabled
  if (user.email_notifications) {
    try {
      const subject = message.split('\n')[0]; // Use first line as subject
      await base44.integrations.Core.SendEmail({
        from_name: 'Lease Shield',
        to: user.email,
        subject: subject,
        body: message
      });
      channels.push('Email');
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
        message_preview: message.substring(0, 200)
      });
    } catch (err) {
      console.error(`❌ Failed to log notification:`, err);
    }
  }

  return channels.length > 0;
}