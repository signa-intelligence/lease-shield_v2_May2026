import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
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

    // This should be called by a cron job (daily)
    const deposits = await base44.asServiceRole.entities.DepositTracker.list();
    const leases = await base44.asServiceRole.entities.Lease.list();
    const now = new Date();
    
    const notifications = [];

    // Check deposit return reminders
    for (const deposit of deposits) {
      if (deposit.status !== 'tracking') continue;

      const expectedDate = new Date(deposit.expected_return_date);
      const daysDiff = Math.floor((expectedDate - now) / (1000 * 60 * 60 * 24));
      
      // Get user for this deposit
      const users = await base44.asServiceRole.entities.User.list();
      const user = users.find(u => u.email === deposit.created_by);
      
      if (!user) continue;

      const language = user.language || 'en';
      const notificationData = {
        userName: user.full_name,
        depositAmount: deposit.deposit_amount,
        propertyAddress: deposit.property_address,
        expectedDate: expectedDate.toLocaleDateString(),
        daysOverdue: Math.abs(daysDiff)
      };

      let messageText = '';
      let subject = '';

      // 30-day reminder
      if (daysDiff === 30) {
        subject = language === 'th' ? 
          'อีก 30 วันถึงกำหนดคืนเงินมัดจำ' : 
          'Deposit due back in 30 days';
        
        messageText = language === 'th' ?
          `🔔 แจ้งเตือน Lease Shield\n\nถึงกำหนดคืนเงินมัดจำในอีก 30 วัน\n\n` +
          `💰 จำนวน: ฿${notificationData.depositAmount.toLocaleString()}\n` +
          `🏠 ทรัพย์สิน: ${notificationData.propertyAddress || 'ไม่ระบุ'}\n` +
          `📅 กำหนดคืน: ${notificationData.expectedDate}\n\n` +
          `💡 แนะนำ: แนบใบเสร็จและรูปภาพใน Evidence Vault ของคุณ` :
          
          `🔔 Lease Shield Reminder\n\nYour deposit is due back in 30 days\n\n` +
          `💰 Amount: ฿${notificationData.depositAmount.toLocaleString()}\n` +
          `🏠 Property: ${notificationData.propertyAddress || 'N/A'}\n` +
          `📅 Expected: ${notificationData.expectedDate}\n\n` +
          `💡 Tip: Keep receipts and photos in your Evidence Vault`;

        notifications.push({ user: user.email, type: '30d_deposit', deposit: deposit.id });
      }

      // 7-day reminder
      else if (daysDiff === 7) {
        subject = language === 'th' ? 
          'อีก 7 วันครบกำหนดคืนเงินมัดจำ' : 
          '7 days until deposit return deadline';
        
        messageText = language === 'th' ?
          `⚠️ แจ้งเตือนสุดท้าย Lease Shield\n\nอีก 7 วันครบกำหนดคืนเงินมัดจำ\n\n` +
          `💰 จำนวน: ฿${notificationData.depositAmount.toLocaleString()}\n` +
          `🏠 ทรัพย์สิน: ${notificationData.propertyAddress || 'ไม่ระบุ'}\n` +
          `📅 กำหนดคืน: ${notificationData.expectedDate}\n\n` +
          `📝 หากยังไม่ได้รับเงิน สามารถสร้างจดหมายร้องขอได้ทันที` :
          
          `⚠️ Lease Shield Final Reminder\n\n7 days until deposit return deadline\n\n` +
          `💰 Amount: ฿${notificationData.depositAmount.toLocaleString()}\n` +
          `🏠 Property: ${notificationData.propertyAddress || 'N/A'}\n` +
          `📅 Expected: ${notificationData.expectedDate}\n\n` +
          `📝 Generate a Deposit Return Request letter if needed`;

        notifications.push({ user: user.email, type: '7d_deposit', deposit: deposit.id });
      }

      // Overdue (1 day after expected return)
      else if (daysDiff === -1) {
        subject = language === 'th' ? 
          'ยังไม่ได้รับเงินมัดจำคืน - ดำเนินการด่วน' : 
          'Deposit Not Returned - Action Required';
        
        messageText = language === 'th' ?
          `🚨 แจ้งเตือนด่วน Lease Shield\n\nยังไม่ได้รับเงินมัดจำคืน\n\n` +
          `💰 จำนวน: ฿${notificationData.depositAmount.toLocaleString()}\n` +
          `🏠 ทรัพย์สิน: ${notificationData.propertyAddress || 'ไม่ระบุ'}\n` +
          `⏰ เกินกำหนด: ${notificationData.daysOverdue} วัน\n\n` +
          `📋 แนะนำให้ดำเนินการ:\n` +
          `1. สร้างจดหมายเตือนคืนเงินมัดจำ\n` +
          `2. ส่งทางไปรษณีย์ลงทะเบียน\n` +
          `3. พิจารณาเปิดคดี Resolve` :
          
          `🚨 Lease Shield Urgent Alert\n\nDeposit not returned\n\n` +
          `💰 Amount: ฿${notificationData.depositAmount.toLocaleString()}\n` +
          `🏠 Property: ${notificationData.propertyAddress || 'N/A'}\n` +
          `⏰ Overdue: ${notificationData.daysOverdue} days\n\n` +
          `📋 Recommended Actions:\n` +
          `1. Generate Late Return Reminder letter\n` +
          `2. Send via registered mail\n` +
          `3. Consider opening a Resolve case`;

        notifications.push({ user: user.email, type: 'overdue_deposit', deposit: deposit.id });
      }

      // Send notification if we have a message
      if (messageText) {
        if (user.line_messaging_token && user.line_notifications) {
          try {
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              internal_secret: Deno.env.get('INTERNAL_FUNCTION_SECRET'),
              userId: user.line_messaging_token,
              message: messageText
            });
          } catch (lineError) {
            console.error('LINE send failed:', lineError);
            if (user.email_notifications) {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: user.email,
                subject: subject,
                body: messageText
              });
            }
          }
        } else if (user.email_notifications) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: subject,
            body: messageText
          });
        }

        // Send to tenant via User.line_id (if set and different from line_messaging_token)
        if (user.line_id && user.line_id !== user.line_messaging_token) {
          try {
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              internal_secret: Deno.env.get('INTERNAL_FUNCTION_SECRET'),
              userId: user.line_id,
              message: messageText
            });
            console.log('[DEPOSIT_REMIND] ✅ Tenant LINE (line_id) sent:', deposit.id);
          } catch (lineIdError) {
            console.error('[DEPOSIT_REMIND] ❌ Tenant LINE (line_id) failed:', lineIdError.message);
          }
        }
      }
    }

    // Check lease notice reminders
    for (const lease of leases) {
      if (!lease.notice_deadline || !lease.notice_alerts_enabled) continue;

      const noticeDeadline = new Date(lease.notice_deadline);
      const daysDiff = Math.floor((noticeDeadline - now) / (1000 * 60 * 60 * 24));
      
      // Get user for this lease
      // This part was duplicated in the original logic. 
      // It's generally better to fetch users once or optimize if many leases/deposits belong to the same user.
      // However, to strictly adhere to the instruction "preserving all other features, elements and functionality", 
      // and given that the user list is currently small and fetched for each item, I will keep this as is.
      const users = await base44.asServiceRole.entities.User.list(); 
      const user = users.find(u => u.email === lease.created_by);
      
      if (!user) continue;

      const language = user.language || 'en';
      const leaseEndDate = new Date(lease.end_date);
      
      let messageText = '';
      let subject = '';

      // 30-day notice reminder
      if (daysDiff === 30) {
        subject = language === 'th' ?
          'เตือน: อีก 30 วันถึงกำหนดแจ้งต่อ/ยกเลิกสัญญา' :
          'Reminder: 30 days until lease notice deadline';

        messageText = language === 'th' ?
          `📅 เตือนสัญญาเช่า Lease Shield\n\nอีก 30 วันถึงกำหนดแจ้งต่อหรือยกเลิกสัญญา\n\n` +
          `🏠 ทรัพย์สิน: ${lease.property_address || 'ไม่ระบุ'}\n` +
          `📆 สัญญาสิ้นสุด: ${leaseEndDate.toLocaleDateString()}\n` +
          `⏰ ต้องแจ้งภายใน: ${noticeDeadline.toLocaleDateString()}\n` +
          `📝 ระยะแจ้ง: ${lease.notice_period_days} วันก่อนหมดสัญญา\n\n` +
          `💡 ตัดสินใจว่าจะต่อสัญญาหรือยกเลิก และแจ้งเจ้าของบ้านให้ทันเวลา\n\n` +
          `✅ แจ้งเจ้าของบ้านเรียบร้อยแล้ว? ส่ง "stop" เพื่อหยุดการแจ้งเตือน` :
          
          `📅 Lease Shield Notice Reminder\n\n30 days until lease notice deadline\n\n` +
          `🏠 Property: ${lease.property_address || 'N/A'}\n` +
          `📆 Lease ends: ${leaseEndDate.toLocaleDateString()}\n` +
          `⏰ Must notify by: ${noticeDeadline.toLocaleDateString()}\n` +
          `📝 Notice period: ${lease.notice_period_days} days before end\n\n` +
          `💡 Decide if you'll renew or terminate, and notify landlord on time\n\n` +
          `✅ Already notified landlord? Send "stop" to disable reminders`;

        notifications.push({ user: user.email, type: '30d_notice', lease: lease.id });
      }

      // 7-day notice warning
      else if (daysDiff === 7) {
        subject = language === 'th' ?
          '⚠️ เหลือ 7 วัน: แจ้งเจ้าของบ้านเกี่ยวกับสัญญา' :
          '⚠️ 7 Days Left: Notify Landlord About Lease';

        messageText = language === 'th' ?
          `⚠️ แจ้งเตือนด่วน Lease Shield\n\nเหลือ 7 วันต้องแจ้งเจ้าของบ้าน!\n\n` +
          `🏠 ทรัพย์สิน: ${lease.property_address || 'ไม่ระบุ'}\n` +
          `📆 สัญญาสิ้นสุด: ${leaseEndDate.toLocaleDateString()}\n` +
          `🚨 ต้องแจ้งภายใน: ${noticeDeadline.toLocaleDateString()}\n\n` +
          `📝 ดำเนินการ:\n` +
          `1. ตัดสินใจต่อหรือยกเลิก\n` +
          `2. สร้างจดหมายแจ้งในส่วน Templates\n` +
          `3. ส่งให้เจ้าของบ้านโดยด่วน\n\n` +
          `✅ แจ้งเรียบร้อยแล้ว? ส่ง "stop"` :
          
          `⚠️ Lease Shield Urgent Reminder\n\n7 days left to notify landlord!\n\n` +
          `🏠 Property: ${lease.property_address || 'N/A'}\n` +
          `📆 Lease ends: ${leaseEndDate.toLocaleDateString()}\n` +
          `🚨 Must notify by: ${noticeDeadline.toLocaleDateString()}\n\n` +
          `📝 Action Required:\n` +
          `1. Decide: renew or terminate\n` +
          `2. Generate notice letter in Templates\n` +
          `3. Send to landlord urgently\n\n` +
          `✅ Already notified? Send "stop"`;

        notifications.push({ user: user.email, type: '7d_notice', lease: lease.id });
      }

      // 3-day final warning
      else if (daysDiff === 3) {
        subject = language === 'th' ?
          '🚨 เหลือ 3 วัน: แจ้งเจ้าของบ้านด่วน!' :
          '🚨 3 Days Left: Notify Landlord Immediately!';

        messageText = language === 'th' ?
          `🚨 คำเตือนสุดท้าย Lease Shield\n\nเหลือเพียง 3 วัน!\n\n` +
          `🏠 ทรัพย์สิน: ${lease.property_address || 'ไม่ระบุ'}\n` +
          `📆 สัญญาสิ้นสุด: ${leaseEndDate.toLocaleDateString()}\n` +
          `🔴 ต้องแจ้งภายใน: ${noticeDeadline.toLocaleDateString()}\n\n` +
          `⚠️ หากไม่แจ้ง สัญญาอาจต่ออัตโนมัติหรือไม่สามารถต่อได้\n\n` +
          `แจ้งเจ้าของบ้านทันที!\n\n` +
          `✅ แจ้งแล้ว? ส่ง "stop"` :
          
          `🚨 Lease Shield Final Warning\n\nOnly 3 days left!\n\n` +
          `🏠 Property: ${lease.property_address || 'N/A'}\n` +
          `📆 Lease ends: ${leaseEndDate.toLocaleDateString()}\n` +
          `🔴 Must notify by: ${noticeDeadline.toLocaleDateString()}\n\n` +
          `⚠️ If you don't notify, lease may auto-renew or you can't extend\n\n` +
          `Contact landlord immediately!\n\n` +
          `✅ Notified? Send "stop"`;

        notifications.push({ user: user.email, type: '3d_notice', lease: lease.id });
      }

      // Notice deadline day
      else if (daysDiff === 0) {
        subject = language === 'th' ?
          '🔴 วันนี้! ต้องแจ้งเจ้าของบ้านวันนี้' :
          '🔴 TODAY! Must Notify Landlord Today';

        messageText = language === 'th' ?
          `🔴 วันนี้คือกำหนด! Lease Shield\n\nต้องแจ้งเจ้าของบ้าน วันนี้!\n\n` +
          `🏠 ทรัพย์สิน: ${lease.property_address || 'ไม่ระบุ'}\n` +
          `📆 สัญญาสิ้นสุด: ${leaseEndDate.toLocaleDateString()}\n` +
          `🔴 กำหนดแจ้ง: วันนี้\n\n` +
          `แจ้งเจ้าของบ้านทันที หรืออาจพลาดสิทธิ์!\n\n` +
          `✅ แจ้งแล้ว? ส่ง "stop"` :
          
          `🔴 Deadline Today! Lease Shield\n\nMust notify landlord TODAY!\n\n` +
          `🏠 Property: ${lease.property_address || 'N/A'}\n` +
          `📆 Lease ends: ${leaseEndDate.toLocaleDateString()}\n` +
          `🔴 Notice deadline: TODAY\n\n` +
          `Contact landlord immediately or risk losing your rights!\n\n` +
          `✅ Notified? Send "stop"`;

        notifications.push({ user: user.email, type: '0d_notice', lease: lease.id });
      }

      // Send notification if we have a message
      if (messageText) {
        if (user.line_messaging_token && user.line_notifications) {
          try {
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              internal_secret: Deno.env.get('INTERNAL_FUNCTION_SECRET'),
              userId: user.line_messaging_token,
              message: messageText
            });
          } catch (lineError) {
            console.error('LINE send failed:', lineError);
            if (user.email_notifications) {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: user.email,
                subject: subject,
                body: messageText
              });
            }
          }
        } else if (user.email_notifications) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: subject,
            body: messageText
          });
        }

        // Send to tenant via User.line_id (if set and different from line_messaging_token)
        if (user.line_id && user.line_id !== user.line_messaging_token) {
          try {
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              internal_secret: Deno.env.get('INTERNAL_FUNCTION_SECRET'),
              userId: user.line_id,
              message: messageText
            });
            console.log('[LEASE_REMIND] ✅ Tenant LINE (line_id) sent:', lease.id);
          } catch (lineIdError) {
            console.error('[LEASE_REMIND] ❌ Tenant LINE (line_id) failed:', lineIdError.message);
          }
        }
      }
    }

    return Response.json({ 
      success: true, 
      notifications_sent: notifications.length,
      details: notifications 
    });
  } catch (error) {
    console.error('Reminder check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});