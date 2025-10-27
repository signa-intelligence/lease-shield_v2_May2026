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

      // 30-day reminder
      if (daysDiff === 30) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: language === 'th' ? 
            'อีก 30 วันถึงกำหนดคืนเงินมัดจำ' : 
            'Deposit due back in 30 days',
          body: language === 'th' ?
            `ระบบแจ้งเตือน: ถึงกำหนดคืนเงินมัดจำในอีก 30 วัน

ทรัพย์สิน: ${notificationData.propertyAddress || 'ไม่ระบุ'}
จำนวน: ฿${notificationData.depositAmount.toLocaleString()}
กำหนดคืน: ${notificationData.expectedDate}

กรุณาแนบใบเสร็จและรูปภาพใน Evidence Vault ของคุณ

— Lease Shield` :
            `Reminder — Your lease deposit of ฿${notificationData.depositAmount.toLocaleString()} is scheduled for return in 30 days.

Property: ${notificationData.propertyAddress || 'N/A'}
Expected Return: ${notificationData.expectedDate}

Please ensure receipts and photos are stored in your Evidence Vault.

— Lease Shield`
        });
        notifications.push({ user: user.email, type: '30d', deposit: deposit.id });
      }

      // 7-day reminder
      if (daysDiff === 7) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: language === 'th' ? 
            'อีก 7 วันครบกำหนดคืนเงินมัดจำ' : 
            '7 days until deposit return deadline',
          body: language === 'th' ?
            `ระบบแจ้งเตือน: อีก 7 วันครบกำหนดคืนเงินมัดจำ

ทรัพย์สิน: ${notificationData.propertyAddress || 'ไม่ระบุ'}
จำนวน: ฿${notificationData.depositAmount.toLocaleString()}
กำหนดคืน: ${notificationData.expectedDate}

หากยังไม่ได้รับเงิน คุณสามารถสร้างจดหมายร้องขอได้ทันที

— Lease Shield` :
            `Final reminder — Your deposit of ฿${notificationData.depositAmount.toLocaleString()} should be returned within 7 days.

Property: ${notificationData.propertyAddress || 'N/A'}
Expected Return: ${notificationData.expectedDate}

If there's an issue, you can generate a Deposit Return Request letter from your Documents section.

— Lease Shield`
        });
        notifications.push({ user: user.email, type: '7d', deposit: deposit.id });
      }

      // Overdue (1 day after expected return)
      if (daysDiff === -1) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: language === 'th' ? 
            'ยังไม่ได้รับเงินมัดจำคืน - ดำเนินการด่วน' : 
            'Deposit Not Returned - Action Required',
          body: language === 'th' ?
            `เงินมัดจำจำนวน ฿${notificationData.depositAmount.toLocaleString()} ของคุณยังไม่ได้รับคืน

ทรัพย์สิน: ${notificationData.propertyAddress || 'ไม่ระบุ'}
เกินกำหนดมาแล้ว: ${notificationData.daysOverdue} วัน

แนะนำให้ดำเนินการ:
1. สร้างจดหมายเตือนคืนเงินมัดจำ
2. ส่งทางไปรษณีย์ลงทะเบียน
3. หากไม่ได้รับการตอบกลับ พิจารณาเปิดคดี Resolve

ดูเทมเพลต: https://app.leaseshield.asia/documents/templates

— Lease Shield` :
            `Your deposit of ฿${notificationData.depositAmount.toLocaleString()} was not returned on the expected date.

Property: ${notificationData.propertyAddress || 'N/A'}
Days Overdue: ${notificationData.daysOverdue}

Recommended Actions:
1. Generate a "Late Deposit Return Reminder" letter
2. Send via registered mail
3. If no response, consider opening a Resolve case

View Templates: https://app.leaseshield.asia/documents/templates

— Lease Shield`
        });
        notifications.push({ user: user.email, type: 'overdue', deposit: deposit.id });
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