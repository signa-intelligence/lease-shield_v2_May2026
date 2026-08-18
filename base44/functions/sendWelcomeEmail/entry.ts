import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function getFirstName(user) {
  if (user.display_name) return user.display_name.split(' ')[0];
  if (user.full_name) return user.full_name.split(' ')[0];
  if (user.email) return user.email.split('@')[0].replace(/[._-]/g, ' ').split(' ')[0];
  return 'there';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const targetUserId = body?.user_id;
    const isInternal = !!targetUserId;

    let user;
    if (isInternal) {
      // Server-side / automation path — caller must prove it is internal
      const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
      const serviceAuth = req.headers.get('base44-service-authorization');
      if (!serviceAuth && (!expectedSecret || body?.internal_secret !== expectedSecret)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      user = await base44.asServiceRole.entities.User.get(targetUserId);
      if (!user) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }
    } else {
      user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (user.welcome_email_sent) {
      return Response.json({ message: 'Welcome email already sent' });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const language = user.language || 'en';
    const firstName = getFirstName(user);
    const appUrl = 'https://app.leaseshield.asia';
    const tier = (user.plan_tier || 'explorer').toUpperCase();

    const t = language === 'th' ? {
      subject: 'ยินดีต้อนรับสู่ LeaseShield! 🏠 การปกป้องของคุณเริ่มต้นแล้ว',
      tagline: 'ยุติธรรม • โปร่งใส • ปลอดภัย',
      greeting: `สวัสดี ${firstName}! 👋`,
      intro: 'ยินดีต้อนรับสู่ LeaseShield — การป้องกันปัญหาการเช่าของคุณเริ่มต้นแล้ว',
      yourTier: `แผนของคุณ: ${tier}`,
      stepsTitle: '3 ขั้นตอนเริ่มต้น:',
      step1Title: '📋 สแกนสัญญาเช่าของคุณ',
      step1Desc: 'อัปโหลดสัญญาเช่าเพื่อรับการวิเคราะห์ความเสี่ยงด้วย AI',
      step1Cta: 'สแกนสัญญาเช่า',
      step2Title: '📸 บันทึกหลักฐาน',
      step2Desc: 'ถ่ายรูปสภาพห้องเมื่อเข้าอยู่และเก็บเอกสารอย่างปลอดภัย',
      step2Cta: 'เปิดที่เก็บหลักฐาน',
      step3Title: '🛡️ ตั้งค่าการติดตามเงินมัดจำ',
      step3Desc: 'ติดตามเงินมัดจำ ค่าเช่า และกำหนดแจ้งเตือนอัตโนมัติ',
      step3Cta: 'ติดตามทรัพย์สิน',
      proTip: '💡 เคล็ดลับ: ถ่ายรูปห้องทุกมุมเมื่อเข้าอยู่ — นี่คือหลักฐานที่ดีที่สุดเพื่อปกป้องเงินมัดจำของคุณ',
      helpTitle: 'ต้องการความช่วยเหลือ?',
      helpDesc: 'พูดคุยกับ Lisa ผู้ช่วย AI ของเรา หรือตอบกลับอีเมลนี้',
      signoff: 'ขอให้โชคดีกับการเช่า!',
      team: '— ทีม LeaseShield',
      footer: 'ป้องกันปัญหาการเช่าก่อนที่จะเกิดขึ้น',
      disclaimer: 'เราไม่ใช่สำนักงานกฎหมาย Lease Shield เป็นเครื่องมือป้องกันและจัดทำเอกสาร',
    } : {
      subject: 'Welcome to LeaseShield! 🏠 Your rental protection starts now',
      tagline: 'FAIR • TRANSPARENT • PROTECTED',
      greeting: `Hi ${firstName}! 👋`,
      intro: "Welcome to LeaseShield — your rental protection journey starts now.",
      yourTier: `Your plan: ${tier}`,
      stepsTitle: 'Get started in 3 steps:',
      step1Title: '📋 Scan Your Lease',
      step1Desc: 'Upload your lease contract for instant AI-powered risk analysis.',
      step1Cta: 'Scan My Lease',
      step2Title: '📸 Document Your Property',
      step2Desc: 'Take move-in photos and store important documents securely.',
      step2Cta: 'Open Evidence Vault',
      step3Title: '🛡️ Set Up Deposit Tracking',
      step3Desc: 'Track your deposit, rent payments, and set automated reminders.',
      step3Cta: 'Track My Property',
      proTip: "💡 Pro Tip: Take photos of every room on move-in day — it's the single best thing you can do to protect your deposit.",
      helpTitle: 'Need help?',
      helpDesc: 'Chat with Lisa, our AI assistant, or just reply to this email.',
      signoff: "Here's to a worry-free rental!",
      team: '— The LeaseShield Team',
      footer: 'Prevent rental problems before they happen',
      disclaimer: 'We are not a law firm. LeaseShield is a prevention and documentation tool.',
    };

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#ECEFED;margin:0;padding:0;line-height:1.6">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
  <div style="background:linear-gradient(135deg,#0C3B2E 0%,#047857 100%);padding:40px 32px;text-align:center">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png" alt="LeaseShield" style="max-width:120px;height:auto;margin-bottom:12px">
    <p style="color:#C7A338;font-size:13px;font-weight:600;letter-spacing:2px;margin:0">${t.tagline}</p>
  </div>
  <div style="padding:36px 32px;color:#1A1D1F">
    <h2 style="color:#0C3B2E;font-size:22px;margin:0 0 8px 0">${t.greeting}</h2>
    <p style="color:#475569;font-size:15px;margin:0 0 8px 0">${t.intro}</p>
    <div style="display:inline-block;background:#0C3B2E;color:#C7A338;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:700;margin:8px 0 24px 0">${t.yourTier}</div>

    <h3 style="color:#0C3B2E;font-size:16px;margin:24px 0 16px 0">${t.stepsTitle}</h3>

    <div style="background:#F0FDF4;border:1px solid #D1FAE5;border-radius:12px;padding:20px;margin-bottom:12px">
      <h4 style="margin:0 0 4px 0;color:#0C3B2E;font-size:15px">${t.step1Title}</h4>
      <p style="color:#475569;font-size:13px;margin:0 0 12px 0">${t.step1Desc}</p>
      <a href="${appUrl}/uploadscan" style="display:inline-block;padding:10px 20px;background:#0C3B2E;color:#C7A338;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px">${t.step1Cta} →</a>
    </div>
    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:20px;margin-bottom:12px">
      <h4 style="margin:0 0 4px 0;color:#92400E;font-size:15px">${t.step2Title}</h4>
      <p style="color:#475569;font-size:13px;margin:0 0 12px 0">${t.step2Desc}</p>
      <a href="${appUrl}/evidencevault" style="display:inline-block;padding:10px 20px;background:#C7A338;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px">${t.step2Cta} →</a>
    </div>
    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:20px;margin-bottom:24px">
      <h4 style="margin:0 0 4px 0;color:#1E40AF;font-size:15px">${t.step3Title}</h4>
      <p style="color:#475569;font-size:13px;margin:0 0 12px 0">${t.step3Desc}</p>
      <a href="${appUrl}/propertytracker" style="display:inline-block;padding:10px 20px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px">${t.step3Cta} →</a>
    </div>

    <div style="background:#FFF7ED;border-left:4px solid #C7A338;padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px">
      <p style="color:#92400E;font-size:13px;margin:0;font-weight:500">${t.proTip}</p>
    </div>

    <div style="border-top:1px solid #E5E7EB;padding-top:20px;margin-top:8px">
      <p style="color:#475569;font-size:14px;margin:0 0 4px 0"><strong>${t.helpTitle}</strong></p>
      <p style="color:#64748B;font-size:13px;margin:0 0 20px 0">${t.helpDesc}</p>
      <p style="color:#0C3B2E;font-size:15px;font-weight:600;margin:0 0 4px 0">${t.signoff}</p>
      <p style="color:#64748B;font-size:13px;margin:0">${t.team}</p>
    </div>
  </div>
  <div style="background:#1A1D1F;padding:24px 32px;text-align:center">
    <p style="color:#ECEFED;font-weight:700;font-size:14px;margin:0 0 4px 0">LEASE SHIELD</p>
    <p style="color:#A8ABAD;font-size:12px;margin:0 0 12px 0">${t.footer}</p>
    <p style="color:#6B7280;font-size:11px;margin:0">${t.disclaimer}</p>
    <p style="color:#6B7280;font-size:11px;margin:8px 0 0 0">© ${new Date().getFullYear()} LeaseShield. All rights reserved.</p>
  </div>
</div>
</body></html>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LeaseShield <hello@leaseshield.asia>',
        reply_to: 'support@leaseshield.asia',
        to: [user.email],
        subject: t.subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WELCOME_EMAIL] ❌ Resend error:', data);
      throw new Error(data.message || 'Failed to send welcome email');
    }

    console.log('[WELCOME_EMAIL] ✅ Sent to:', user.email, 'ID:', data.id);
    if (isInternal) {
      await base44.asServiceRole.entities.User.update(targetUserId, { welcome_email_sent: true });
    } else {
      await base44.auth.updateMe({ welcome_email_sent: true });
    }

    return Response.json({ success: true, messageId: data.id });
  } catch (error) {
    console.error('[WELCOME_EMAIL] ❌ Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});