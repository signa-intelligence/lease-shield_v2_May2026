import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Unified reminder check system
 * Checks all types of reminders: deposits, leases, rent payments
 * Sends notifications via LINE (primary) with email fallback
 * Should be called by cron job daily
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const deposits = await base44.asServiceRole.entities.DepositTracker.list();
    const leases = await base44.asServiceRole.entities.Lease.list();
    const users = await base44.asServiceRole.entities.User.list();
    
    const now = new Date();
    const notifications = [];

    // Helper to get user by email
    const getUserByEmail = (email) => users.find(u => u.email === email);

    // Helper to send notification (LINE primary, email fallback)
    const sendNotification = async (user, messageText, subject) => {
      if (!user) return false;

      // Try LINE first if enabled
      if (user.line_messaging_token && user.line_notifications) {
        try {
          const lineResult = await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: user.line_messaging_token,
            message: messageText
          });
          console.log(`✅ LINE sent to ${user.email}`);
          return true;
        } catch (lineError) {
          console.error(`❌ LINE failed for ${user.email}:`, lineError);
          // Fall through to email
        }
      }

      // Fallback to email if LINE failed or not enabled
      if (user.email_notifications) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: 'Lease Shield',
            to: user.email,
            subject: subject,
            body: messageText
          });
          console.log(`✅ Email sent to ${user.email}`);
          return true;
        } catch (emailError) {
          console.error(`❌ Email failed for ${user.email}:`, emailError);
        }
      }

      return false;
    };

    // ============================================
    // 1. CHECK DEPOSIT RETURN REMINDERS
    // ============================================
    for (const deposit of deposits) {
      if (deposit.status !== 'tracking') continue;
      if (!deposit.expected_return_date) continue;

      const user = getUserByEmail(deposit.created_by);
      if (!user) continue;

      const expectedDate = new Date(deposit.expected_return_date);
      const daysDiff = Math.floor((expectedDate - now) / (1000 * 60 * 60 * 24));
      
      const language = user.language || 'en';
      const depositAmount = deposit.deposit_amount?.toLocaleString() || '0';
      const propertyAddress = deposit.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A');
      const expectedDateStr = expectedDate.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US');

      let messageText = '';
      let subject = '';

      // 30-day reminder
      if (daysDiff === 30) {
        subject = language === 'th' ? 
          'อีก 30 วันถึงกำหนดคืนเงินมัดจำ' : 
          'Deposit due back in 30 days';
        
        messageText = language === 'th' ?
          `🔔 แจ้งเตือน Lease Shield\n\n` +
          `ถึงกำหนดคืนเงินมัดจำในอีก 30 วัน\n\n` +
          `💰 จำนวน: ฿${depositAmount}\n` +
          `🏠 ทรัพย์สิน: ${propertyAddress}\n` +
          `📅 กำหนดคืน: ${expectedDateStr}\n\n` +
          `💡 แนะนำ: แนบใบเสร็จและรูปภาพใน Evidence Vault ของคุณ\n\n` +
          `เปิดแอป → leaseshield.asia` :
          
          `🔔 Lease Shield Reminder\n\n` +
          `Your deposit is due back in 30 days\n\n` +
          `💰 Amount: ฿${depositAmount}\n` +
          `🏠 Property: ${propertyAddress}\n` +
          `📅 Expected: ${expectedDateStr}\n\n` +
          `💡 Tip: Keep receipts and photos in your Evidence Vault\n\n` +
          `Open app → leaseshield.asia`;

        if (await sendNotification(user, messageText, subject)) {
          notifications.push({ user: user.email, type: '30d_deposit', deposit: deposit.id });
        }
      }

      // 7-day warning
      else if (daysDiff === 7) {
        subject = language === 'th' ? 
          'อีก 7 วันครบกำหนดคืนเงินมัดจำ' : 
          '7 days until deposit return deadline';
        
        messageText = language === 'th' ?
          `⚠️ แจ้งเตือนสุดท้าย Lease Shield\n\n` +
          `อีก 7 วันครบกำหนดคืนเงินมัดจำ\n\n` +
          `💰 จำนวน: ฿${depositAmount}\n` +
          `🏠 ทรัพย์สิน: ${propertyAddress}\n` +
          `📅 กำหนดคืน: ${expectedDateStr}\n\n` +
          `📝 หากยังไม่ได้รับเงิน สามารถสร้างจดหมายร้องขอได้ทันที\n\n` +
          `เปิดแอป → leaseshield.asia` :
          
          `⚠️ Lease Shield Final Reminder\n\n` +
          `7 days until deposit return deadline\n\n` +
          `💰 Amount: ฿${depositAmount}\n` +
          `🏠 Property: ${propertyAddress}\n` +
          `📅 Expected: ${expectedDateStr}\n\n` +
          `📝 Generate a Deposit Return Request letter if needed\n\n` +
          `Open app → leaseshield.asia`;

        if (await sendNotification(user, messageText, subject)) {
          notifications.push({ user: user.email, type: '7d_deposit', deposit: deposit.id });
        }
      }

      // 3-day urgent
      else if (daysDiff === 3) {
        subject = language === 'th' ? 
          '🚨 อีก 3 วันครบกำหนดคืนเงินมัดจำ' : 
          '🚨 3 days until deposit return';
        
        messageText = language === 'th' ?
          `🚨 เตือนเร่งด่วน Lease Shield\n\n` +
          `อีก 3 วันครบกำหนดคืนเงินมัดจำ!\n\n` +
          `💰 จำนวน: ฿${depositAmount}\n` +
          `🏠 ทรัพย์สิน: ${propertyAddress}\n` +
          `📅 กำหนดคืน: ${expectedDateStr}\n\n` +
          `⚠️ หากยังไม่ติดต่อเจ้าของบ้าน กรุณาดำเนินการทันที\n\n` +
          `เปิดแอป → leaseshield.asia` :
          
          `🚨 Lease Shield Urgent\n\n` +
          `Only 3 days until deposit return!\n\n` +
          `💰 Amount: ฿${depositAmount}\n` +
          `🏠 Property: ${propertyAddress}\n` +
          `📅 Expected: ${expectedDateStr}\n\n` +
          `⚠️ Contact landlord if you haven't already\n\n` +
          `Open app → leaseshield.asia`;

        if (await sendNotification(user, messageText, subject)) {
          notifications.push({ user: user.email, type: '3d_deposit', deposit: deposit.id });
        }
      }

      // Overdue (1 day after expected return)
      else if (daysDiff === -1) {
        subject = language === 'th' ? 
          'ยังไม่ได้รับเงินมัดจำคืน - ดำเนินการด่วน' : 
          'Deposit Not Returned - Action Required';
        
        const daysOverdue = Math.abs(daysDiff);
        
        messageText = language === 'th' ?
          `🚨 แจ้งเตือนด่วน Lease Shield\n\n` +
          `ยังไม่ได้รับเงินมัดจำคืน\n\n` +
          `💰 จำนวน: ฿${depositAmount}\n` +
          `🏠 ทรัพย์สิน: ${propertyAddress}\n` +
          `⏰ เกินกำหนด: ${daysOverdue} วัน\n\n` +
          `📋 แนะนำให้ดำเนินการ:\n` +
          `1. สร้างจดหมายเตือนคืนเงินมัดจำ\n` +
          `2. ส่งทางไปรษณีย์ลงทะเบียน\n` +
          `3. พิจารณาเปิดคดี Resolve\n\n` +
          `เปิดแอป → leaseshield.asia` :
          
          `🚨 Lease Shield Urgent Alert\n\n` +
          `Deposit not returned\n\n` +
          `💰 Amount: ฿${depositAmount}\n` +
          `🏠 Property: ${propertyAddress}\n` +
          `⏰ Overdue: ${daysOverdue} days\n\n` +
          `📋 Recommended Actions:\n` +
          `1. Generate Late Return Reminder letter\n` +
          `2. Send via registered mail\n` +
          `3. Consider opening a Resolve case\n\n` +
          `Open app → leaseshield.asia`;

        if (await sendNotification(user, messageText, subject)) {
          notifications.push({ user: user.email, type: 'overdue_deposit', deposit: deposit.id });
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

      // 30-day notice reminder
      if (daysDiff === 30) {
        subject = language === 'th' ?
          'เตือน: อีก 30 วันถึงกำหนดแจ้งต่อ/ยกเลิกสัญญา' :
          'Reminder: 30 days until lease notice deadline';

        messageText = language === 'th' ?
          `📅 เตือนสัญญาเช่า Lease Shield\n\n` +
          `อีก 30 วันถึงกำหนดแจ้งต่อหรือยกเลิกสัญญา\n\n` +
          `🏠 ทรัพย์สิน: ${propertyAddress}\n` +
          `📆 สัญญาสิ้นสุด: ${leaseEndDate}\n` +
          `⏰ ต้องแจ้งภายใน: ${noticeDeadlineStr}\n` +
          `📝 ระยะแจ้ง: ${noticePeriod} วันก่อนหมดสัญญา\n\n` +
          `💡 ตัดสินใจว่าจะต่อสัญญาหรือยกเลิก และแจ้งเจ้าของบ้านให้ทันเวลา\n\n` +
          `เปิดแอป → leaseshield.asia` :
          
          `📅 Lease Shield Notice Reminder\n\n` +
          `30 days until lease notice deadline\n\n` +
          `🏠 Property: ${propertyAddress}\n` +
          `📆 Lease ends: ${leaseEndDate}\n` +
          `⏰ Must notify by: ${noticeDeadlineStr}\n` +
          `📝 Notice period: ${noticePeriod} days before end\n\n` +
          `💡 Decide if you'll renew or terminate, and notify landlord on time\n\n` +
          `Open app → leaseshield.asia`;

        if (await sendNotification(user, messageText, subject)) {
          notifications.push({ user: user.email, type: '30d_notice', lease: lease.id });
        }
      }

      // 7-day notice warning
      else if (daysDiff === 7) {
        subject = language === 'th' ?
          '⚠️ เหลือ 7 วัน: แจ้งเจ้าของบ้านเกี่ยวกับสัญญา' :
          '⚠️ 7 Days Left: Notify Landlord About Lease';

        messageText = language === 'th' ?
          `⚠️ แจ้งเตือนด่วน Lease Shield\n\n` +
          `เหลือ 7 วันต้องแจ้งเจ้าของบ้าน!\n\n` +
          `🏠 ทรัพย์สิน: ${propertyAddress}\n` +
          `📆 สัญญาสิ้นสุด: ${leaseEndDate}\n` +
          `🚨 ต้องแจ้งภายใน: ${noticeDeadlineStr}\n\n` +
          `📝 ดำเนินการ:\n` +
          `1. ตัดสินใจต่อหรือยกเลิก\n` +
          `2. สร้างจดหมายแจ้งในส่วน Templates\n` +
          `3. ส่งให้เจ้าของบ้านโดยด่วน\n\n` +
          `เปิดแอป → leaseshield.asia` :
          
          `⚠️ Lease Shield Urgent Reminder\n\n` +
          `7 days left to notify landlord!\n\n` +
          `🏠 Property: ${propertyAddress}\n` +
          `📆 Lease ends: ${leaseEndDate}\n` +
          `🚨 Must notify by: ${noticeDeadlineStr}\n\n` +
          `📝 Action Required:\n` +
          `1. Decide: renew or terminate\n` +
          `2. Generate notice letter in Templates\n` +
          `3. Send to landlord urgently\n\n` +
          `Open app → leaseshield.asia`;

        if (await sendNotification(user, messageText, subject)) {
          notifications.push({ user: user.email, type: '7d_notice', lease: lease.id });
        }
      }

      // 3-day final warning
      else if (daysDiff === 3) {
        subject = language === 'th' ?
          '🚨 เหลือ 3 วัน: แจ้งเจ้าของบ้านด่วน!' :
          '🚨 3 Days Left: Notify Landlord Immediately!';

        messageText = language === 'th' ?
          `🚨 คำเตือนสุดท้าย Lease Shield\n\n` +
          `เหลือเพียง 3 วัน!\n\n` +
          `🏠 ทรัพย์สิน: ${propertyAddress}\n` +
          `📆 สัญญาสิ้นสุด: ${leaseEndDate}\n` +
          `🔴 ต้องแจ้งภายใน: ${noticeDeadlineStr}\n\n` +
          `⚠️ หากไม่แจ้ง สัญญาอาจต่ออัตโนมัติหรือไม่สามารถต่อได้\n\n` +
          `แจ้งเจ้าของบ้านทันที!\n\n` +
          `เปิดแอป → leaseshield.asia` :
          
          `🚨 Lease Shield Final Warning\n\n` +
          `Only 3 days left!\n\n` +
          `🏠 Property: ${propertyAddress}\n` +
          `📆 Lease ends: ${leaseEndDate}\n` +
          `🔴 Must notify by: ${noticeDeadlineStr}\n\n` +
          `⚠️ If you don't notify, lease may auto-renew or you can't extend\n\n` +
          `Contact landlord immediately!\n\n` +
          `Open app → leaseshield.asia`;

        if (await sendNotification(user, messageText, subject)) {
          notifications.push({ user: user.email, type: '3d_notice', lease: lease.id });
        }
      }

      // Notice deadline day
      else if (daysDiff === 0) {
        subject = language === 'th' ?
          '🔴 วันนี้! ต้องแจ้งเจ้าของบ้านวันนี้' :
          '🔴 TODAY! Must Notify Landlord Today';

        messageText = language === 'th' ?
          `🔴 วันนี้คือกำหนด! Lease Shield\n\n` +
          `ต้องแจ้งเจ้าของบ้าน วันนี้!\n\n` +
          `🏠 ทรัพย์สิน: ${propertyAddress}\n` +
          `📆 สัญญาสิ้นสุด: ${leaseEndDate}\n` +
          `🔴 กำหนดแจ้ง: วันนี้\n\n` +
          `แจ้งเจ้าของบ้านทันที หรืออาจพลาดสิทธิ์!\n\n` +
          `เปิดแอป → leaseshield.asia` :
          
          `🔴 Deadline Today! Lease Shield\n\n` +
          `Must notify landlord TODAY!\n\n` +
          `🏠 Property: ${propertyAddress}\n` +
          `📆 Lease ends: ${leaseEndDate}\n` +
          `🔴 Notice deadline: TODAY\n\n` +
          `Contact landlord immediately or risk losing your rights!\n\n` +
          `Open app → leaseshield.asia`;

        if (await sendNotification(user, messageText, subject)) {
          notifications.push({ user: user.email, type: '0d_notice', lease: lease.id });
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
      
      // Calculate if today is the alert day
      const targetAlertDay = dueDay - alertDaysBefore;
      
      // Handle month wraparound (e.g., due on 5th, alert 3 days before = 2nd, but if alertDaysBefore > dueDay, it should be previous month)
      const isAlertDay = currentDay === (targetAlertDay > 0 ? targetAlertDay : 1); // Simplified: alert on day 1 if target is negative

      if (isAlertDay) {
        const rentAmount = deposit.rent_amount.toLocaleString();
        const propertyAddress = deposit.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A');
        
        const subject = language === 'th' ?
          `เตือน: ค่าเช่าครบกำหนดวันที่ ${dueDay}` :
          `Reminder: Rent due on the ${dueDay}${dueDay === 1 ? 'st' : dueDay === 2 ? 'nd' : dueDay === 3 ? 'rd' : 'th'}`;

        const messageText = language === 'th' ?
          `💰 แจ้งเตือนค่าเช่า Lease Shield\n\n` +
          `ค่าเช่าครบกำหนดในอีก ${alertDaysBefore} วัน\n\n` +
          `🏠 ทรัพย์สิน: ${propertyAddress}\n` +
          `💵 จำนวน: ฿${rentAmount}\n` +
          `📅 วันที่ครบกำหนด: ${dueDay} ของเดือน\n\n` +
          `💡 เตรียมชำระเงินให้ทันเวลา เพื่อไม่ให้เกิดปัญหา\n\n` +
          `เปิดแอป → leaseshield.asia` :
          
          `💰 Lease Shield Rent Reminder\n\n` +
          `Rent due in ${alertDaysBefore} days\n\n` +
          `🏠 Property: ${propertyAddress}\n` +
          `💵 Amount: ฿${rentAmount}\n` +
          `📅 Due date: ${dueDay}${dueDay === 1 ? 'st' : dueDay === 2 ? 'nd' : dueDay === 3 ? 'rd' : 'th'} of month\n\n` +
          `💡 Pay on time to avoid issues\n\n` +
          `Open app → leaseshield.asia`;

        if (await sendNotification(user, messageText, subject)) {
          notifications.push({ user: user.email, type: 'rent_reminder', deposit: deposit.id });
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