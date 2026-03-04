import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const TIER_CONFIG = {
  lite: {
    label: 'Lite',
    price: '฿190/month',
    color: '#047857',
    features: [
      { en: '6 Lease Scans per year', th: '6 การสแกนสัญญาเช่าต่อปี' },
      { en: '2 Letter Credits', th: '2 เครดิตจดหมาย' },
      { en: 'Email Notifications', th: 'แจ้งเตือนทางอีเมล' },
      { en: '1GB Document Storage', th: 'พื้นที่เก็บเอกสาร 1GB' },
      { en: 'Full Risk Reports', th: 'รายงานความเสี่ยงฉบับเต็ม' },
      { en: 'Deposit Tracking', th: 'ติดตามเงินประกัน' },
    ],
    nextSteps: {
      en: [
        'Upload your first lease for a full risk scan',
        'Set up deposit tracking for your property',
        'Enable email notifications for important dates',
      ],
      th: [
        'อัปโหลดสัญญาเช่าฉบับแรกเพื่อสแกนความเสี่ยง',
        'ตั้งค่าติดตามเงินประกันสำหรับทรัพย์สินของคุณ',
        'เปิดการแจ้งเตือนทางอีเมลสำหรับวันสำคัญ',
      ],
    },
  },
  protect: {
    label: 'Protect',
    price: '฿390/month',
    color: '#C7A338',
    features: [
      { en: '12 Lease Scans per year', th: '12 การสแกนสัญญาเช่าต่อปี' },
      { en: '10 Letter Credits', th: '10 เครดิตจดหมาย' },
      { en: 'LINE + Email Notifications', th: 'แจ้งเตือนทาง LINE + อีเมล' },
      { en: '5GB Document Storage', th: 'พื้นที่เก็บเอกสาร 5GB' },
      { en: 'Maintenance Tracker', th: 'ติดตามการซ่อมบำรุง' },
      { en: 'Priority Support', th: 'การสนับสนุนแบบพิเศษ' },
    ],
    nextSteps: {
      en: [
        'Upload your lease for a comprehensive risk scan',
        'Connect LINE for instant notifications',
        'Use the Evidence Vault to store important documents',
      ],
      th: [
        'อัปโหลดสัญญาเช่าเพื่อสแกนความเสี่ยงอย่างละเอียด',
        'เชื่อมต่อ LINE เพื่อรับการแจ้งเตือนทันที',
        'ใช้ห้องนิรภัยหลักฐานเก็บเอกสารสำคัญ',
      ],
    },
  },
  secure: {
    label: 'Secure',
    price: '฿990/month',
    color: '#7C3AED',
    features: [
      { en: 'Unlimited Lease Scans', th: 'สแกนสัญญาเช่าไม่จำกัด' },
      { en: '50 Letter Credits', th: '50 เครดิตจดหมาย' },
      { en: 'LINE + Email + SMS Notifications', th: 'แจ้งเตือนทาง LINE + อีเมล + SMS' },
      { en: '20GB Document Storage', th: 'พื้นที่เก็บเอกสาร 20GB' },
      { en: 'Free Resolve Cases', th: 'เคส Resolve ฟรี' },
      { en: 'Dedicated Account Manager', th: 'ผู้จัดการบัญชีส่วนตัว' },
    ],
    nextSteps: {
      en: [
        'Upload all your leases for unlimited risk scanning',
        'Open a Resolve case if you have any active disputes',
        'Connect LINE for instant priority notifications',
      ],
      th: [
        'อัปโหลดสัญญาเช่าทั้งหมดเพื่อสแกนความเสี่ยงไม่จำกัด',
        'เปิดเคส Resolve หากมีข้อพิพาทที่ยังดำเนินอยู่',
        'เชื่อมต่อ LINE เพื่อรับการแจ้งเตือนพิเศษทันที',
      ],
    },
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail, newTier, billingInterval } = await req.json();

    if (!userEmail || !newTier) {
      return Response.json({ error: 'Missing userEmail or newTier' }, { status: 400 });
    }

    const tier = TIER_CONFIG[newTier];
    if (!tier) {
      return Response.json({ error: `Unknown tier: ${newTier}` }, { status: 400 });
    }

    // Fetch user for language and name
    const allUsers = await base44.asServiceRole.entities.User.list();
    const user = allUsers.find(u => u.email === userEmail);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const language = user.language || 'en';
    const isTh = language === 'th';
    const firstName = (user.display_name || user.full_name || '').split(' ')[0] || user.email.split('@')[0].replace(/[._-]/g, ' ').split(' ')[0] || 'there';
    const appUrl = 'https://app.leaseshield.asia';
    const intervalLabel = billingInterval === 'annual'
      ? (isTh ? 'รายปี' : 'Annual')
      : (isTh ? 'รายเดือน' : 'Monthly');

    const subject = isTh
      ? `🎉 คุณอยู่ในแผน LeaseShield ${tier.label} แล้ว!`
      : `🎉 You're now on LeaseShield ${tier.label}!`;

    const featuresHtml = tier.features.map(f =>
      `<li style="padding:6px 0;font-size:14px;color:#334155"><span style="color:${tier.color};font-weight:bold;margin-right:8px">✓</span>${isTh ? f.th : f.en}</li>`
    ).join('');

    const nextSteps = (isTh ? tier.nextSteps.th : tier.nextSteps.en);
    const stepsHtml = nextSteps.map((s, i) =>
      `<li style="padding:8px 0;font-size:14px;color:#334155;display:flex;align-items:flex-start;gap:10px">
        <span style="background:${tier.color};color:#fff;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">${i + 1}</span>
        <span>${s}</span>
      </li>`
    ).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#ECEFED;margin:0;padding:0;line-height:1.6">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0C3B2E 0%,#047857 100%);padding:40px 32px;text-align:center">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png" alt="LeaseShield" style="max-width:72px;height:auto;margin-bottom:16px">
    <h1 style="color:#FFFFFF;font-size:24px;margin:0 0 4px 0">${isTh ? '🎉 ยินดีต้อนรับสู่แผน' : '🎉 Welcome to'} ${tier.label}!</h1>
    <p style="color:#C7A338;font-size:13px;font-weight:600;letter-spacing:2px;margin:0">${isTh ? 'ยุติธรรม • โปร่งใส • ปลอดภัย' : 'FAIR • TRANSPARENT • PROTECTED'}</p>
  </div>

  <!-- Body -->
  <div style="padding:32px;color:#1A1D1F">
    <h2 style="color:#0C3B2E;font-size:18px;margin:0 0 8px 0">${isTh ? `สวัสดี ${firstName}!` : `Hi ${firstName}!`}</h2>
    <p style="color:#475569;font-size:15px;margin:0 0 24px 0">${isTh
      ? `ขอบคุณที่อัปเกรดเป็นแผน <strong style="color:${tier.color}">${tier.label}</strong>! ตอนนี้คุณสามารถเข้าถึงฟีเจอร์ระดับพรีเมียมทั้งหมดได้แล้ว`
      : `Thank you for upgrading to <strong style="color:${tier.color}">${tier.label}</strong>! You now have access to all premium features.`}</p>

    <!-- Plan Badge -->
    <div style="background:linear-gradient(135deg,${tier.color}15 0%,${tier.color}08 100%);border:2px solid ${tier.color};border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
      <p style="font-size:12px;font-weight:600;color:${tier.color};text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0">${isTh ? 'แผนปัจจุบันของคุณ' : 'YOUR CURRENT PLAN'}</p>
      <p style="font-size:28px;font-weight:800;color:${tier.color};margin:0 0 4px 0">${tier.label}</p>
      <p style="font-size:14px;color:#64748B;margin:0">${tier.price} · ${intervalLabel}</p>
    </div>

    <!-- Features -->
    <div style="background:#F8FAFC;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #E2E8F0">
      <h3 style="color:#0C3B2E;font-size:15px;font-weight:700;margin:0 0 12px 0">${isTh ? 'ฟีเจอร์ที่คุณได้รับ:' : 'Your included features:'}</h3>
      <ul style="list-style:none;padding:0;margin:0">${featuresHtml}</ul>
    </div>

    <!-- Next Steps -->
    <div style="background:#F0FDF4;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #D1FAE5">
      <h3 style="color:#047857;font-size:15px;font-weight:700;margin:0 0 12px 0">${isTh ? '🚀 เริ่มต้นใช้งาน:' : '🚀 Get started:'}</h3>
      <ul style="list-style:none;padding:0;margin:0">${stepsHtml}</ul>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0">
      <a href="${appUrl}" style="display:inline-block;padding:16px 32px;background:linear-gradient(135deg,#0C3B2E 0%,#047857 100%);color:#C7A338;text-decoration:none;border-radius:12px;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(12,59,46,0.3)">${isTh ? 'ไปที่แดชบอร์ด' : 'Go to Dashboard'}</a>
    </div>

    <!-- Support -->
    <div style="border-top:1px solid #E5E7EB;padding-top:20px;margin-top:20px">
      <p style="color:#475569;font-size:13px;margin:0">${isTh
        ? 'มีคำถาม? ตอบกลับอีเมลนี้ได้เลย เรายินดีช่วยเหลือ'
        : 'Questions? Just reply to this email — we\'re happy to help.'}</p>
      <p style="color:#0C3B2E;font-size:14px;font-weight:600;margin:12px 0 0 0">${isTh ? '— ทีม LeaseShield' : '— The LeaseShield Team'}</p>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#1A1D1F;padding:20px 32px;text-align:center">
    <p style="color:#ECEFED;font-weight:700;font-size:13px;margin:0 0 4px 0">LEASE SHIELD</p>
    <p style="color:#A8ABAD;font-size:11px;margin:0 0 8px 0">${isTh ? 'ป้องกันปัญหาการเช่าก่อนที่จะเกิดขึ้น' : 'Prevent rental problems before they happen'}</p>
    <p style="color:#6B7280;font-size:10px;margin:0">© ${new Date().getFullYear()} LeaseShield. All rights reserved.</p>
  </div>
</div>
</body></html>`;

    // Send via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'LeaseShield <hello@leaseshield.asia>',
          reply_to: 'support@leaseshield.asia',
          to: [userEmail],
          subject,
          html,
        }),
      });
      const emailData = await emailRes.json();
      if (emailRes.ok) {
        console.log('[UPGRADE_EMAIL] ✅ Sent via Resend to:', userEmail, 'ID:', emailData.id);
        return Response.json({ success: true, emailId: emailData.id });
      } else {
        console.error('[UPGRADE_EMAIL] Resend error:', emailData);
        // Fallback to built-in
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: userEmail,
          subject,
          body: `Hi ${firstName}, you've been upgraded to LeaseShield ${tier.label}! Visit ${appUrl} to explore your new features.`,
        });
        return Response.json({ success: true, fallback: true });
      }
    } else {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: userEmail,
        subject,
        body: `Hi ${firstName}, you've been upgraded to LeaseShield ${tier.label}! Visit ${appUrl} to explore your new features.`,
      });
      return Response.json({ success: true, fallback: true });
    }
  } catch (error) {
    console.error('[UPGRADE_EMAIL] ❌ Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});