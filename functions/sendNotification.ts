import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

const NOTIFICATION_TEMPLATES = {
  activation_en: {
    subject: 'Lease Shield Plan Activated',
    body: (data) => `Hi ${data.userName},

Your Lease Shield ${data.planTier.toUpperCase()} plan is now active.
You can view your AI report and Deposit Shield dashboard anytime.

— The Lease Shield Team`
  },
  activation_th: {
    subject: 'แพ็กเกจ Lease Shield ของคุณเปิดใช้งานแล้ว',
    body: (data) => `สวัสดี ${data.userName},

แพ็กเกจ ${data.planTier} ของคุณเปิดใช้งานแล้ว
เข้าดูรายงาน AI และ Deposit Shield ได้ตลอดเวลา

— ทีม Lease Shield`
  },
  deposit_30d_en: {
    subject: 'Deposit due back in 30 days',
    body: (data) => `Reminder — Your lease deposit of ฿${data.depositAmount.toLocaleString()} is scheduled for return in 30 days.

Property: ${data.propertyAddress || 'N/A'}
Expected Return: ${data.expectedDate}

Please ensure receipts and photos are stored in your Evidence Vault.

— Lease Shield`
  },
  deposit_30d_th: {
    subject: 'อีก 30 วันถึงกำหนดคืนเงินมัดจำ',
    body: (data) => `ระบบแจ้งเตือน: ถึงกำหนดคืนเงินมัดจำในอีก 30 วัน

ทรัพย์สิน: ${data.propertyAddress || 'ไม่ระบุ'}
จำนวน: ฿${data.depositAmount.toLocaleString()}
กำหนดคืน: ${data.expectedDate}

กรุณาแนบใบเสร็จและรูปภาพใน Evidence Vault ของคุณ

— Lease Shield`
  },
  deposit_7d_en: {
    subject: '7 days until deposit return deadline',
    body: (data) => `Final reminder — Your deposit of ฿${data.depositAmount.toLocaleString()} should be returned within 7 days.

Property: ${data.propertyAddress || 'N/A'}
Expected Return: ${data.expectedDate}

If there's an issue, you can generate a Deposit Return Request letter from your Documents section.

— Lease Shield`
  },
  deposit_7d_th: {
    subject: 'อีก 7 วันครบกำหนดคืนเงินมัดจำ',
    body: (data) => `ระบบแจ้งเตือน: อีก 7 วันครบกำหนดคืนเงินมัดจำ

ทรัพย์สิน: ${data.propertyAddress || 'ไม่ระบุ'}
จำนวน: ฿${data.depositAmount.toLocaleString()}
กำหนดคืน: ${data.expectedDate}

หากยังไม่ได้รับเงิน คุณสามารถสร้างจดหมายร้องขอได้ทันที

— Lease Shield`
  },
  deposit_overdue_en: {
    subject: 'Deposit Not Returned - Action Required',
    body: (data) => `Your deposit of ฿${data.depositAmount.toLocaleString()} was not returned on the expected date.

Property: ${data.propertyAddress || 'N/A'}
Days Overdue: ${data.daysOverdue}

Recommended Actions:
1. Generate a "Late Deposit Return Reminder" letter
2. Send via registered mail
3. If no response, consider opening a Resolve case

View Templates: https://app.leaseshield.asia/documents/templates

— Lease Shield`
  },
  deposit_overdue_th: {
    subject: 'ยังไม่ได้รับเงินมัดจำคืน - ดำเนินการด่วน',
    body: (data) => `เงินมัดจำจำนวน ฿${data.depositAmount.toLocaleString()} ของคุณยังไม่ได้รับคืน

ทรัพย์สิน: ${data.propertyAddress || 'ไม่ระบุ'}
เกินกำหนดมาแล้ว: ${data.daysOverdue} วัน

แนะนำให้ดำเนินการ:
1. สร้างจดหมายเตือนคืนเงินมัดจำ
2. ส่งทางไปรษณีย์ลงทะเบียน
3. หากไม่ได้รับการตอบกลับ พิจารณาเปิดคดี Resolve

ดูเทมเพลต: https://app.leaseshield.asia/documents/templates

— Lease Shield`
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateKey, data } = await req.json();
    
    if (!templateKey || !NOTIFICATION_TEMPLATES[templateKey]) {
      return Response.json({ error: 'Invalid template key' }, { status: 400 });
    }

    const template = NOTIFICATION_TEMPLATES[templateKey];
    const emailBody = template.body(data);

    // Send email notification
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: template.subject,
      body: emailBody
    });

    // TODO: Add LINE Notify integration when credentials are available
    // if (user.line_notify_token) {
    //   await sendLineNotify(user.line_notify_token, emailBody);
    // }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});