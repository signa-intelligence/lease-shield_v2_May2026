import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

async function sendViaResend({ to, subject, html, fromName = 'LeaseShield' }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: `${fromName} <notifications@leaseshield.asia>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    })
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(`Resend error: ${result.message || JSON.stringify(result)}`);
  }
  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseNumber, userName, userEmail, disputeAmount, paymentType, language } = await req.json();

    if (!caseNumber || !userEmail) {
      return Response.json({ error: 'caseNumber and userEmail are required' }, { status: 400 });
    }

    const lang = language || 'en';
    const submissionDate = new Date().toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const displayName = userName || userEmail;
    const paymentLine = paymentType === 'free'
      ? (lang === 'th' ? '💰 การชำระเงิน: ฟรี (สิทธิ์ Secure)' : '💰 Payment: Free (Secure tier benefit)')
      : `💰 Payment: ฿${(disputeAmount || 0).toLocaleString()}`;

    const subject = lang === 'th'
      ? `ยื่นคดีสำเร็จ - ${caseNumber}`
      : `Case Submitted - ${caseNumber}`;

    const html = lang === 'th'
      ? `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ECFDF5, #D1FAE5); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
    <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
    <h1 style="color: #059669; margin: 0 0 8px 0; font-size: 22px;">ยื่นคดีสำเร็จ!</h1>
    <div style="background: white; display: inline-block; padding: 8px 20px; border-radius: 8px; border: 2px solid #059669;">
      <span style="color: #64748B; font-size: 14px;">หมายเลขคดี:</span>
      <span style="color: #059669; font-weight: bold; font-size: 18px; margin-left: 6px;">${caseNumber}</span>
    </div>
  </div>

  <p style="color: #334155; font-size: 15px;">สวัสดี ${displayName},</p>
  <p style="color: #334155; font-size: 15px;">ขอบคุณที่ส่งคดีมาที่ LeaseShield</p>

  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin: 20px 0;">
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">✅ หมายเลขคดี: <strong>${caseNumber}</strong></p>
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">📅 วันที่ส่ง: ${submissionDate}</p>
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">${paymentLine}</p>
  </div>

  <h2 style="color: #0F172A; font-size: 18px; margin-top: 28px;">ขั้นตอนต่อไป</h2>

  <div style="background: #F1F5F9; border-radius: 12px; padding: 16px; margin: 12px 0;">
    <p style="color: #334155; font-size: 14px; margin: 0 0 8px 0;"><strong>ภายใน 2-3 วันทำการ:</strong></p>
    <p style="color: #64748B; font-size: 14px; margin: 4px 0;">ที่ปรึกษาของเราจะ:</p>
    <ol style="color: #64748B; font-size: 14px; padding-left: 20px; margin: 8px 0;">
      <li>ตรวจสอบรายละเอียดคดีและหลักฐานที่อัปโหลด</li>
      <li>ประเมินสถานการณ์ของคุณ</li>
      <li>เตรียมตัวเลือกกลยุทธ์ที่แนะนำ</li>
      <li>สร้างเทมเพลตจดหมายที่กำหนดเอง</li>
    </ol>
  </div>

  <div style="background: #F1F5F9; border-radius: 12px; padding: 16px; margin: 12px 0;">
    <p style="color: #334155; font-size: 14px; margin: 0 0 8px 0;"><strong>เราจะติดต่อคุณผ่าน:</strong></p>
    <p style="color: #64748B; font-size: 14px; margin: 4px 0;">• ข้อความ LINE</p>
    <p style="color: #64748B; font-size: 14px; margin: 4px 0;">• อีเมลที่ ${userEmail}</p>
  </div>

  <div style="background: #F1F5F9; border-radius: 12px; padding: 16px; margin: 12px 0;">
    <p style="color: #334155; font-size: 14px; margin: 0 0 8px 0;"><strong>คุณจะได้รับ:</strong></p>
    <p style="color: #64748B; font-size: 14px; margin: 4px 0;">✅ การประเมินคดี</p>
    <p style="color: #64748B; font-size: 14px; margin: 4px 0;">✅ ตัวเลือกแนวทางที่แนะนำ</p>
    <p style="color: #64748B; font-size: 14px; margin: 4px 0;">✅ เทมเพลตจดหมายพร้อมส่ง</p>
    <p style="color: #64748B; font-size: 14px; margin: 4px 0;">✅ คำแนะนำขั้นตอนต่อไป</p>
  </div>

  <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 16px; margin: 20px 0;">
    <p style="color: #1E40AF; font-size: 14px; margin: 0;">📋 <strong>เก็บหมายเลขคดีของคุณไว้: ${caseNumber}</strong></p>
  </div>

  <p style="color: #334155; font-size: 15px;">ทีมงานของเรากำลังดำเนินการ เราจะติดต่อคุณเร็วๆ นี้</p>

  <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 24px;">
    <p style="color: #64748B; font-size: 13px;">มีคำถาม? ตอบกลับอีเมลนี้หรือติดต่อเราทาง LINE: @leaseshield</p>
  </div>

  <p style="color: #334155; font-size: 15px;">ขอแสดงความนับถือ,<br/>ทีม LeaseShield</p>

  <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
  <p style="color: #94A3B8; font-size: 12px; text-align: center;">
    นี่คือการยืนยันอัตโนมัติ กรุณาเก็บอีเมลนี้และหมายเลขคดี (${caseNumber}) ไว้เป็นข้อมูลอ้างอิง
  </p>
</div>`
      : `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ECFDF5, #D1FAE5); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
    <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
    <h1 style="color: #059669; margin: 0 0 8px 0; font-size: 22px;">Case Submitted Successfully!</h1>
    <div style="background: white; display: inline-block; padding: 8px 20px; border-radius: 8px; border: 2px solid #059669;">
      <span style="color: #64748B; font-size: 14px;">Case Number:</span>
      <span style="color: #059669; font-weight: bold; font-size: 18px; margin-left: 6px;">${caseNumber}</span>
    </div>
  </div>

  <p style="color: #334155; font-size: 15px;">Dear ${displayName},</p>
  <p style="color: #334155; font-size: 15px;">Thank you for submitting your case to LeaseShield.</p>

  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin: 20px 0;">
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">✅ Case Number: <strong>${caseNumber}</strong></p>
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">📅 Submitted: ${submissionDate}</p>
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">${paymentLine}</p>
  </div>

  <h2 style="color: #0F172A; font-size: 18px; margin-top: 28px;">What Happens Next</h2>

  <div style="background: #F1F5F9; border-radius: 12px; padding: 16px; margin: 12px 0;">
    <p style="color: #334155; font-size: 14px; margin: 0 0 8px 0;"><strong>Within 2-3 Business Days:</strong></p>
    <p style="color: #64748B; font-size: 14px; margin: 4px 0;">Our consultants will:</p>
    <ol style="color: #64748B; font-size: 14px; padding-left: 20px; margin: 8px 0;">
      <li>Review your case details and uploaded evidence</li>
      <li>Assess your situation</li>
      <li>Prepare suggested strategy options</li>
      <li>Create customised template letters</li>
    </ol>
  </div>

  <div style="background: #F1F5F9; border-radius: 12px; padding: 16px; margin: 12px 0;">
    <p style="color: #334155; font-size: 14px; margin: 0 0 8px 0;"><strong>We'll Contact You Via:</strong></p>
    <p style="color: #64748B; font-size: 14px; margin: 4px 0;">• LINE message</p>
    <p style="color: #64748B; font-size: 14px; margin: 4px 0;">• Email to ${userEmail}</p>
  </div>

  <div style="background: #F1F5F9; border-radius: 12px; padding: 16px; margin: 12px 0;">
    <p style="color: #334155; font-size: 14px; margin: 0 0 8px 0;"><strong>You'll Receive:</strong></p>
    <p style="color: #64748B; font-size: 14px; margin: 4px 0;">✅ Case assessment</p>
    <p style="color: #64748B; font-size: 14px; margin: 4px 0;">✅ Suggested approach options</p>
    <p style="color: #64748B; font-size: 14px; margin: 4px 0;">✅ Template letters ready to send</p>
    <p style="color: #64748B; font-size: 14px; margin: 4px 0;">✅ Guidance on next steps</p>
  </div>

  <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 16px; margin: 20px 0;">
    <p style="color: #1E40AF; font-size: 14px; margin: 0;">📋 <strong>Keep Your Case Number: ${caseNumber}</strong></p>
  </div>

  <p style="color: #334155; font-size: 15px;">Your case is being handled by our team. We'll be in touch soon.</p>

  <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 24px;">
    <p style="color: #64748B; font-size: 13px;">Questions? Reply to this email or contact us on LINE: @leaseshield</p>
  </div>

  <p style="color: #334155; font-size: 15px;">Best regards,<br/>LeaseShield Team</p>

  <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
  <p style="color: #94A3B8; font-size: 12px; text-align: center;">
    This is an automated confirmation. Please keep this email and your case number (${caseNumber}) for reference.
  </p>
</div>`;

    const result = await sendViaResend({
      to: userEmail,
      subject,
      html,
      fromName: 'LeaseShield'
    });

    console.log(`[sendCaseConfirmationEmail] ✅ Confirmation email sent via Resend to ${userEmail} for case ${caseNumber}, id: ${result.id}`);

    // Send user LINE notification if they have LINE connected
    try {
      const lineChannelToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
      if (lineChannelToken) {
        // Look up user's LINE ID
        const allUsers = await base44.asServiceRole.entities.User.list();
        const targetUser = allUsers.find(u => u.email === userEmail);
        const lineUserId = targetUser?.line_messaging_token;

        if (lineUserId && lineUserId.startsWith('U') && lineUserId.length === 33) {
          const lineText = lang === 'th'
            ? [
                '🔔 ยื่นคดีสำเร็จ',
                '',
                `📋 หมายเลขคดี: ${caseNumber}`,
                '📌 สถานะ: อยู่ระหว่างการตรวจสอบ',
                '',
                'เราจะติดต่อคุณภายใน 2-3 วันทำการพร้อมการประเมินคดี',
                '',
                'มีคำถาม? ตอบกลับที่นี่หรืออีเมล support@leaseshield.asia'
              ].join('\n')
            : [
                '🔔 Case Submitted Successfully',
                '',
                `📋 Case: ${caseNumber}`,
                '📌 Status: Under Review',
                '',
                "We'll contact you within 2-3 business days with your case assessment.",
                '',
                'Questions? Reply here or email support@leaseshield.asia'
              ].join('\n');

          const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${lineChannelToken}`
            },
            body: JSON.stringify({
              to: lineUserId,
              messages: [{ type: 'text', text: lineText }]
            })
          });

          if (lineRes.ok) {
            console.log(`[sendCaseConfirmationEmail] ✅ LINE message sent to user ${userEmail}`);
          } else {
            console.warn(`[sendCaseConfirmationEmail] ⚠️ LINE to user failed: ${lineRes.status}`);
          }
        }
      }
    } catch (lineErr) {
      console.warn('[sendCaseConfirmationEmail] ⚠️ LINE notification failed (non-blocking):', lineErr.message);
    }

    return Response.json({ success: true, emailId: result.id });

  } catch (error) {
    console.error('[sendCaseConfirmationEmail] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});