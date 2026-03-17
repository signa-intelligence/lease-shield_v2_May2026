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
    
    // Skip user auth check — this function is invoked via asServiceRole from webhooks
    // The caller (omiseWebhook/stripeWebhook) already validated the request

    const { caseNumber, userName, userEmail, disputeAmount, paymentType, language } = await req.json();

    if (!caseNumber || !userEmail) {
      return Response.json({ error: 'caseNumber and userEmail are required' }, { status: 400 });
    }

    const lang = language || 'en';
    const submissionDate = new Date().toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // Detect Fast Track vs Standard from case number position 2
    const caseTrack = caseNumber.charAt(1);
    const isFastTrack = caseTrack === 'F';

    console.log(`[sendCaseConfirmationEmail] Track: ${isFastTrack ? 'Fast Track' : 'Standard'} (char: ${caseTrack})`);

    const displayName = userName || userEmail;
    const paymentLine = paymentType === 'free'
      ? (lang === 'th' ? '💰 การชำระเงิน: ฟรี (สิทธิ์ Secure)' : '💰 Payment: Free (Secure tier benefit)')
      : `💰 Payment: ฿${(disputeAmount || 0).toLocaleString()}`;

    // Dynamic subject based on track
    const subject = lang === 'th'
      ? (isFastTrack
        ? `⚡ ยื่นคดีแบบเร่งด่วน - ${caseNumber}`
        : `ยื่นคดีสำเร็จ - ${caseNumber}`)
      : (isFastTrack
        ? `⚡ Fast Track Case Submitted - ${caseNumber}`
        : `Case Submitted - ${caseNumber}`);

    // Dynamic timeframe strings
    const tf = isFastTrack
      ? {
          en: { label: '⚡ Fast Track Review (1 business day)', timeframe: 'Within 1 Business Day', step1: 'Expedited Document Review (within 1 business day)', step1Desc: 'Your case receives priority review by our consultants', contactTimeline: 'Within 1 business day', footer: 'Your Fast Track case is being prioritized by our team. We\'ll be in touch soon.', footnote: '* Business days exclude weekends and public holidays' },
          th: { label: '⚡ การตรวจสอบแบบเร่งด่วน (1 วันทำการ)', timeframe: 'ภายใน 1 วันทำการ', step1: 'การตรวจสอบเอกสารแบบเร่งด่วน (ภายใน 1 วันทำการ)', step1Desc: 'คดีของคุณได้รับการตรวจสอบอย่างเร่งด่วนโดยที่ปรึกษา', contactTimeline: 'ภายใน 1 วันทำการ', footer: 'คดีแบบเร่งด่วนของคุณกำลังได้รับความสำคัญจากทีมของเรา', footnote: '* วันทำการไม่รวมวันหยุดสุดสัปดาห์และวันหยุดนักขัตฤกษ์' }
        }
      : {
          en: { label: '📋 Standard Review (2-3 business days)', timeframe: 'Within 2-3 Business Days', step1: 'Document Review (2-3 business days)', step1Desc: 'Our consultants will review your case details and evidence', contactTimeline: 'Within 2-3 business days', footer: 'Your case is being handled by our team. We\'ll be in touch soon.', footnote: '* Business days exclude weekends and public holidays' },
          th: { label: '📋 การตรวจสอบมาตรฐาน (2-3 วันทำการ)', timeframe: 'ภายใน 2-3 วันทำการ', step1: 'ตรวจสอบเอกสาร (2-3 วันทำการ)', step1Desc: 'ที่ปรึกษาจะตรวจสอบรายละเอียดและหลักฐาน', contactTimeline: 'ภายใน 2-3 วันทำการ', footer: 'คดีของคุณกำลังได้รับการดูแลโดยทีมของเรา', footnote: '* วันทำการไม่รวมวันหยุดสุดสัปดาห์และวันหยุดนักขัตฤกษ์' }
        };

    const t = lang === 'th' ? tf.th : tf.en;

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

  <div style="background: ${isFastTrack ? '#FFF7ED' : '#F1F5F9'}; border: ${isFastTrack ? '1px solid #FDBA74' : 'none'}; border-radius: 12px; padding: 16px; margin: 12px 0;">
    <p style="color: #334155; font-size: 14px; margin: 0 0 12px 0; font-weight: bold;">${t.label}</p>
    <p style="color: #64748B; font-size: 14px; margin: 4px 0;">ที่ปรึกษาของเราจะ:</p>
    <div style="margin: 12px 0;">
      <p style="color: #334155; font-size: 14px; margin: 8px 0;"><strong>1️⃣ ${t.step1}</strong></p>
      <p style="color: #64748B; font-size: 13px; margin: 2px 0 8px 20px;">${t.step1Desc}</p>
      <p style="color: #334155; font-size: 14px; margin: 8px 0;"><strong>2️⃣ การประเมินคดี${isFastTrack ? 'อย่างรวดเร็ว' : ''}</strong></p>
      <p style="color: #64748B; font-size: 13px; margin: 2px 0 8px 20px;">เราจะประเมินสถานการณ์และระบุแนวทางที่เป็นไปได้</p>
      <p style="color: #334155; font-size: 14px; margin: 8px 0;"><strong>3️⃣ แผนปฏิบัติการและเทมเพลต</strong></p>
      <p style="color: #64748B; font-size: 13px; margin: 2px 0 0 20px;">คุณจะได้รับ:</p>
      <ul style="color: #64748B; font-size: 13px; margin: 4px 0 8px 20px; padding-left: 16px;">
        <li>การประเมินคดี</li>
        <li>ตัวเลือกกลยุทธ์ที่แนะนำ</li>
        <li>เทมเพลตจดหมายที่กำหนดเอง</li>
        <li>คำแนะนำขั้นตอนต่อไป</li>
      </ul>
      <p style="color: #334155; font-size: 14px; margin: 8px 0;"><strong>4️⃣ เราจะติดต่อคุณ</strong></p>
      <p style="color: #64748B; font-size: 13px; margin: 2px 0 2px 20px;">ผ่าน: LINE และอีเมล</p>
      <p style="color: #64748B; font-size: 13px; margin: 2px 0 0 20px;">ระยะเวลา: ${t.contactTimeline}</p>
    </div>
  </div>

  <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 16px; margin: 20px 0;">
    <p style="color: #1E40AF; font-size: 14px; margin: 0;">📋 <strong>เก็บหมายเลขคดีของคุณไว้: ${caseNumber}</strong></p>
  </div>

  <p style="color: #334155; font-size: 15px;">${t.footer}</p>

  <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 24px;">
    <p style="color: #64748B; font-size: 13px;">มีคำถาม? ตอบกลับอีเมลนี้หรือติดต่อเราทาง LINE: @leaseshield</p>
  </div>

  <p style="color: #334155; font-size: 15px;">ขอแสดงความนับถือ,<br/>ทีม LeaseShield</p>

  <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
  <p style="color: #94A3B8; font-size: 12px; text-align: center;">
    นี่คือการยืนยันอัตโนมัติ กรุณาเก็บอีเมลนี้และหมายเลขคดี (${caseNumber}) ไว้เป็นข้อมูลอ้างอิง
  </p>
  <p style="color: #94A3B8; font-size: 11px; text-align: center; margin-top: 4px;">
    ${t.footnote}
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

  <div style="background: ${isFastTrack ? '#FFF7ED' : '#F1F5F9'}; border: ${isFastTrack ? '1px solid #FDBA74' : 'none'}; border-radius: 12px; padding: 16px; margin: 12px 0;">
    <p style="color: #334155; font-size: 14px; margin: 0 0 12px 0; font-weight: bold;">${t.label}</p>
    <p style="color: #64748B; font-size: 14px; margin: 4px 0;">Our consultants will:</p>
    <div style="margin: 12px 0;">
      <p style="color: #334155; font-size: 14px; margin: 8px 0;"><strong>1️⃣ ${t.step1}</strong></p>
      <p style="color: #64748B; font-size: 13px; margin: 2px 0 8px 20px;">${t.step1Desc}</p>
      <p style="color: #334155; font-size: 14px; margin: 8px 0;"><strong>2️⃣ ${isFastTrack ? 'Rapid Case Assessment' : 'Case Assessment'}</strong></p>
      <p style="color: #64748B; font-size: 13px; margin: 2px 0 8px 20px;">We'll evaluate your situation and identify possible approaches</p>
      <p style="color: #334155; font-size: 14px; margin: 8px 0;"><strong>3️⃣ Action Plan & Templates</strong></p>
      <p style="color: #64748B; font-size: 13px; margin: 2px 0 0 20px;">You'll receive:</p>
      <ul style="color: #64748B; font-size: 13px; margin: 4px 0 8px 20px; padding-left: 16px;">
        <li>Case assessment</li>
        <li>Suggested strategy options</li>
        <li>Customised template letters</li>
        <li>Next steps guidance</li>
      </ul>
      <p style="color: #334155; font-size: 14px; margin: 8px 0;"><strong>4️⃣ We'll Contact You</strong></p>
      <p style="color: #64748B; font-size: 13px; margin: 2px 0 2px 20px;">Via: LINE and Email</p>
      <p style="color: #64748B; font-size: 13px; margin: 2px 0 0 20px;">Timeline: ${t.contactTimeline}</p>
    </div>
  </div>

  <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 16px; margin: 20px 0;">
    <p style="color: #1E40AF; font-size: 14px; margin: 0;">📋 <strong>Keep Your Case Number: ${caseNumber}</strong></p>
  </div>

  <p style="color: #334155; font-size: 15px;">${t.footer}</p>

  <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 24px;">
    <p style="color: #64748B; font-size: 13px;">Questions? Reply to this email or contact us on LINE: @leaseshield</p>
  </div>

  <p style="color: #334155; font-size: 15px;">Best regards,<br/>LeaseShield Team</p>

  <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
  <p style="color: #94A3B8; font-size: 12px; text-align: center;">
    This is an automated confirmation. Please keep this email and your case number (${caseNumber}) for reference.
  </p>
  <p style="color: #94A3B8; font-size: 11px; text-align: center; margin-top: 4px;">
    ${t.footnote}
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
        const allUsers = await base44.asServiceRole.entities.User.list();
        const targetUser = allUsers.find(u => u.email === userEmail);
        const lineUserId = targetUser?.line_messaging_token;

        if (lineUserId && lineUserId.startsWith('U') && lineUserId.length === 33) {
          const lineText = lang === 'th'
            ? (isFastTrack
              ? [
                  '⚡ ยื่นคดีแบบเร่งด่วน',
                  '',
                  `คดี: ${caseNumber}`,
                  'ความสำคัญ: เร่งด่วน ⚡',
                  'การตรวจสอบ: ภายใน 1 วันทำการ',
                  '',
                  'ที่ปรึกษาจะให้ความสำคัญกับคดีของคุณและติดต่อภายใน 1 วันทำการ',
                  '',
                  'ติดตาม: leaseshield.asia/cases',
                  '',
                  'มีคำถาม? ตอบกลับที่นี่หรืออีเมล support@leaseshield.asia'
                ].join('\n')
              : [
                  '📋 ยื่นคดี',
                  '',
                  `คดี: ${caseNumber}`,
                  'การตรวจสอบ: ภายใน 2-3 วันทำการ',
                  '',
                  'เราจะติดต่อคุณภายใน 2-3 วันทำการพร้อมการประเมินคดี',
                  '',
                  'ติดตาม: leaseshield.asia/cases',
                  '',
                  'มีคำถาม? ตอบกลับที่นี่หรืออีเมล support@leaseshield.asia'
                ].join('\n'))
            : (isFastTrack
              ? [
                  '⚡ Fast Track Case Submitted',
                  '',
                  `Case: ${caseNumber}`,
                  'Priority: Fast Track ⚡',
                  'Review: Within 1 business day',
                  '',
                  'Our consultants will prioritize your case and contact you within 1 business day with your assessment.',
                  '',
                  'Track: leaseshield.asia/cases',
                  '',
                  'Questions? Reply or email support@leaseshield.asia'
                ].join('\n')
              : [
                  '📋 Case Submitted',
                  '',
                  `Case: ${caseNumber}`,
                  'Review: Within 2-3 business days',
                  '',
                  "We'll contact you within 2-3 business days with your case assessment.",
                  '',
                  'Track: leaseshield.asia/cases',
                  '',
                  'Questions? Reply or email support@leaseshield.asia'
                ].join('\n'));

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
            console.log(`[sendCaseConfirmationEmail] ✅ LINE message sent to user ${userEmail} (${isFastTrack ? 'Fast Track' : 'Standard'})`);
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