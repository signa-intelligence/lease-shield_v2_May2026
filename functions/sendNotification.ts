import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

const NOTIFICATION_TEMPLATES = {
  activation_en: {
    subject: 'Lease Shield Plan Activated',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🎉 Plan Activated</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>Hi <strong>${data.userName}</strong>,</p>
          <p>Your Lease Shield <strong>${data.planTier.toUpperCase()}</strong> plan is now active.</p>
          <p>You can view your AI report and Deposit Shield dashboard anytime.</p>
          <p style="margin-top: 24px;">— The Lease Shield Team</p>
        </div>
      </div>
    `
  },
  activation_th: {
    subject: 'แพ็กเกจ Lease Shield ของคุณเปิดใช้งานแล้ว',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🎉 เปิดใช้งานแพ็กเกจแล้ว</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>สวัสดี <strong>${data.userName}</strong>,</p>
          <p>แพ็กเกจ <strong>${data.planTier}</strong> ของคุณเปิดใช้งานแล้ว</p>
          <p>เข้าดูรายงาน AI และ Deposit Shield ได้ตลอดเวลา</p>
          <p style="margin-top: 24px;">— ทีม Lease Shield</p>
        </div>
      </div>
    `
  },
  deposit_30d_en: {
    subject: 'Deposit due back in 30 days',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">⏰ Deposit Return Reminder</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p><strong>Reminder</strong> — Your lease deposit of <strong>฿${data.depositAmount.toLocaleString()}</strong> is scheduled for return in 30 days.</p>
          <p><strong>Property:</strong> ${data.propertyAddress || 'N/A'}</p>
          <p><strong>Expected Return:</strong> ${data.expectedDate}</p>
          <p>Please ensure receipts and photos are stored in your Evidence Vault.</p>
          <p style="margin-top: 24px;">— Lease Shield</p>
        </div>
      </div>
    `
  },
  deposit_30d_th: {
    subject: 'อีก 30 วันถึงกำหนดคืนเงินมัดจำ',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">⏰ แจ้งเตือนคืนเงินมัดจำ</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p><strong>ระบบแจ้งเตือน:</strong> ถึงกำหนดคืนเงินมัดจำในอีก 30 วัน</p>
          <p><strong>ทรัพย์สิน:</strong> ${data.propertyAddress || 'ไม่ระบุ'}</p>
          <p><strong>จำนวน:</strong> ฿${data.depositAmount.toLocaleString()}</p>
          <p><strong>กำหนดคืน:</strong> ${data.expectedDate}</p>
          <p>กรุณาแนบใบเสร็จและรูปภาพใน Evidence Vault ของคุณ</p>
          <p style="margin-top: 24px;">— Lease Shield</p>
        </div>
      </div>
    `
  },
  deposit_7d_en: {
    subject: '7 days until deposit return deadline',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #F59E0B, #D97706); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">⚠️ Final Deposit Reminder</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p><strong>Final reminder</strong> — Your deposit of <strong>฿${data.depositAmount.toLocaleString()}</strong> should be returned within 7 days.</p>
          <p><strong>Property:</strong> ${data.propertyAddress || 'N/A'}</p>
          <p><strong>Expected Return:</strong> ${data.expectedDate}</p>
          <p>If there's an issue, you can generate a Deposit Return Request letter from your Documents section.</p>
          <p style="margin-top: 24px;">— Lease Shield</p>
        </div>
      </div>
    `
  },
  deposit_7d_th: {
    subject: 'อีก 7 วันครบกำหนดคืนเงินมัดจำ',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #F59E0B, #D97706); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">⚠️ แจ้งเตือนครั้งสุดท้าย</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p><strong>ระบบแจ้งเตือน:</strong> อีก 7 วันครบกำหนดคืนเงินมัดจำ</p>
          <p><strong>ทรัพย์สิน:</strong> ${data.propertyAddress || 'ไม่ระบุ'}</p>
          <p><strong>จำนวน:</strong> ฿${data.depositAmount.toLocaleString()}</p>
          <p><strong>กำหนดคืน:</strong> ${data.expectedDate}</p>
          <p>หากยังไม่ได้รับเงิน คุณสามารถสร้างจดหมายร้องขอได้ทันที</p>
          <p style="margin-top: 24px;">— Lease Shield</p>
        </div>
      </div>
    `
  },
  deposit_overdue_en: {
    subject: 'Deposit Not Returned - Action Required',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #EF4444, #DC2626); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🚨 Deposit Overdue</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>Your deposit of <strong>฿${data.depositAmount.toLocaleString()}</strong> was not returned on the expected date.</p>
          <p><strong>Property:</strong> ${data.propertyAddress || 'N/A'}</p>
          <p><strong>Days Overdue:</strong> ${data.daysOverdue}</p>
          <p><strong>Recommended Actions:</strong></p>
          <ol style="color: #64748b;">
            <li>Generate a "Late Deposit Return Reminder" letter</li>
            <li>Send via registered mail</li>
            <li>If no response, consider opening a Resolve case</li>
          </ol>
          <p><a href="https://app.leaseshield.asia/templates" style="color: #0C3B2E; font-weight: bold;">View Templates →</a></p>
          <p style="margin-top: 24px;">— Lease Shield</p>
        </div>
      </div>
    `
  },
  deposit_overdue_th: {
    subject: 'ยังไม่ได้รับเงินมัดจำคืน - ดำเนินการด่วน',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #EF4444, #DC2626); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🚨 เงินมัดจำเกินกำหนด</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>เงินมัดจำจำนวน <strong>฿${data.depositAmount.toLocaleString()}</strong> ของคุณยังไม่ได้รับคืน</p>
          <p><strong>ทรัพย์สิน:</strong> ${data.propertyAddress || 'ไม่ระบุ'}</p>
          <p><strong>เกินกำหนดมาแล้ว:</strong> ${data.daysOverdue} วัน</p>
          <p><strong>แนะนำให้ดำเนินการ:</strong></p>
          <ol style="color: #64748b;">
            <li>สร้างจดหมายเตือนคืนเงินมัดจำ</li>
            <li>ส่งทางไปรษณีย์ลงทะเบียน</li>
            <li>หากไม่ได้รับการตอบกลับ พิจารณาเปิดคดี Resolve</li>
          </ol>
          <p><a href="https://app.leaseshield.asia/templates" style="color: #0C3B2E; font-weight: bold;">ดูเทมเพลต →</a></p>
          <p style="margin-top: 24px;">— Lease Shield</p>
        </div>
      </div>
    `
  },
  credits_updated_en: {
    subject: 'Letter Credits Updated',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #C7A338, #B89330); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">💰 Credits Balance Updated</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>Hi <strong>${data.userName}</strong>,</p>
          <p>Your letter credits balance has been updated.</p>
          <p style="background: #FFF7ED; padding: 16px; border-radius: 8px; border-left: 4px solid #C7A338;">
            <strong>Previous Balance:</strong> ${data.oldCredits}<br/>
            <strong>New Balance:</strong> ${data.newCredits}<br/>
            <strong>Change:</strong> ${data.change > 0 ? '+' : ''}${data.change}
          </p>
          <p><a href="https://app.leaseshield.asia/account" style="color: #0C3B2E; font-weight: bold;">View Your Account →</a></p>
          <p style="margin-top: 24px;">— Lease Shield</p>
        </div>
      </div>
    `
  },
  credits_updated_th: {
    subject: 'เครดิตจดหมายถูกอัปเดต',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #C7A338, #B89330); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">💰 ยอดเครดิตถูกอัปเดต</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>สวัสดี <strong>${data.userName}</strong>,</p>
          <p>ยอดเครดิตจดหมายของคุณถูกอัปเดตแล้ว</p>
          <p style="background: #FFF7ED; padding: 16px; border-radius: 8px; border-left: 4px solid #C7A338;">
            <strong>ยอดเดิม:</strong> ${data.oldCredits}<br/>
            <strong>ยอดใหม่:</strong> ${data.newCredits}<br/>
            <strong>เปลี่ยนแปลง:</strong> ${data.change > 0 ? '+' : ''}${data.change}
          </p>
          <p><a href="https://app.leaseshield.asia/account" style="color: #0C3B2E; font-weight: bold;">ดูบัญชีของคุณ →</a></p>
          <p style="margin-top: 24px;">— Lease Shield</p>
        </div>
      </div>
    `
  },
  tier_upgraded_en: {
    subject: 'Plan Upgraded Successfully',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #8B5CF6, #7C3AED); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🎉 Plan Upgraded</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>Hi <strong>${data.userName}</strong>,</p>
          <p>Your plan has been upgraded!</p>
          <p style="background: #F5F3FF; padding: 16px; border-radius: 8px; border-left: 4px solid #8B5CF6;">
            <strong>Previous Plan:</strong> ${data.oldTier}<br/>
            <strong>New Plan:</strong> ${data.newTier}
          </p>
          <p>All new features are now available in your account.</p>
          <p><a href="https://app.leaseshield.asia/account" style="color: #0C3B2E; font-weight: bold;">View Your Account →</a></p>
          <p style="margin-top: 24px;">— Lease Shield</p>
        </div>
      </div>
    `
  },
  tier_upgraded_th: {
    subject: 'อัปเกรดแผนสำเร็จ',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #8B5CF6, #7C3AED); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🎉 อัปเกรดแผนแล้ว</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>สวัสดี <strong>${data.userName}</strong>,</p>
          <p>แผนของคุณถูกอัปเกรดแล้ว!</p>
          <p style="background: #F5F3FF; padding: 16px; border-radius: 8px; border-left: 4px solid #8B5CF6;">
            <strong>แผนเดิม:</strong> ${data.oldTier}<br/>
            <strong>แผนใหม่:</strong> ${data.newTier}
          </p>
          <p>คุณสามารถใช้ฟีเจอร์ใหม่ทั้งหมดได้แล้ว</p>
          <p><a href="https://app.leaseshield.asia/account" style="color: #0C3B2E; font-weight: bold;">ดูบัญชีของคุณ →</a></p>
          <p style="margin-top: 24px;">— Lease Shield</p>
        </div>
      </div>
    `
  },
  case_resolved_en: {
    subject: 'Case Resolved Successfully',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #10B981, #059669); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">✅ Case Resolved</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>Hi <strong>${data.userName}</strong>,</p>
          <p>Your case has been resolved!</p>
          <p style="background: #ECFDF5; padding: 16px; border-radius: 8px; border-left: 4px solid #10B981;">
            <strong>Case ID:</strong> ${data.caseId}<br/>
            ${data.settlementAmount ? `<strong>Settlement Amount:</strong> ฿${data.settlementAmount.toLocaleString()}<br/>` : ''}
            <strong>Resolution Date:</strong> ${data.resolvedDate}
          </p>
          <p>${data.notes || 'Your case has been successfully resolved.'}</p>
          <p><a href="https://app.leaseshield.asia/cases" style="color: #0C3B2E; font-weight: bold;">View Case Details →</a></p>
          <p style="margin-top: 24px;">— Lease Shield</p>
        </div>
      </div>
    `
  },
  case_resolved_th: {
    subject: 'คดีได้รับการแก้ไขแล้ว',
    body: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #10B981, #059669); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">✅ คดีได้รับการแก้ไข</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>สวัสดี <strong>${data.userName}</strong>,</p>
          <p>คดีของคุณได้รับการแก้ไขแล้ว!</p>
          <p style="background: #ECFDF5; padding: 16px; border-radius: 8px; border-left: 4px solid #10B981;">
            <strong>รหัสคดี:</strong> ${data.caseId}<br/>
            ${data.settlementAmount ? `<strong>จำนวนเงินที่ตกลง:</strong> ฿${data.settlementAmount.toLocaleString()}<br/>` : ''}
            <strong>วันที่แก้ไข:</strong> ${data.resolvedDate}
          </p>
          <p>${data.notes || 'คดีของคุณได้รับการแก้ไขสำเร็จแล้ว'}</p>
          <p><a href="https://app.leaseshield.asia/cases" style="color: #0C3B2E; font-weight: bold;">ดูรายละเอียดคดี →</a></p>
          <p style="margin-top: 24px;">— Lease Shield</p>
        </div>
      </div>
    `
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const { templateKey, data } = await req.json();
    
    if (!templateKey || !NOTIFICATION_TEMPLATES[templateKey]) {
      return Response.json({ error: 'Invalid template key' }, { status: 400 });
    }

    const template = NOTIFICATION_TEMPLATES[templateKey];
    const emailBody = template.body(data);

    // Send via Resend with no-reply@leaseshield.asia
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Lease Shield <no-reply@leaseshield.asia>',
        to: [user.email],
        subject: template.subject,
        html: emailBody,
      }),
    });

    const resendData = await response.json();

    if (!response.ok) {
      console.error('❌ Resend API error:', resendData);
      throw new Error(resendData.message || 'Failed to send notification');
    }

    console.log('✅ Notification sent via Resend. Message ID:', resendData.id);

    return Response.json({ 
      success: true,
      messageId: resendData.id
    });

  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});