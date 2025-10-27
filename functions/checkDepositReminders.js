import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This should be called by a cron job (daily)
    const deposits = await base44.asServiceRole.entities.DepositTracker.list();
    const now = new Date();
    
    const notifications = [];

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

        notifications.push({ user: user.email, type: '30d', deposit: deposit.id });
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

        notifications.push({ user: user.email, type: '7d', deposit: deposit.id });
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

        notifications.push({ user: user.email, type: 'overdue', deposit: deposit.id });
      }

      // Send notification if we have a message
      if (messageText) {
        // Send via LINE if connected and enabled
        if (user.line_messaging_token && user.line_notifications) {
          try {
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: user.line_messaging_token,
              message: messageText
            });
          } catch (lineError) {
            console.error('LINE send failed:', lineError);
            // Fall back to email if LINE fails
            if (user.email_notifications) {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: user.email,
                subject: subject,
                body: messageText
              });
            }
          }
        }
        // Send via email if LINE not available or email notifications enabled
        else if (user.email_notifications) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: subject,
            body: messageText
          });
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