import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const TIER_CONFIG = {
  lite: {
    label: 'Lite',
    labelTh: 'ไลท์',
    color: '#2563EB',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
    price: '฿149',
    features: {
      en: ['6 Lease Scans per month', '2 Letter Credits', '500MB Document Storage', 'Email Notifications', 'Deposit Tracker', 'Maintenance Logger'],
      th: ['สแกนสัญญาเช่า 6 ครั้ง/เดือน', 'เครดิตจดหมาย 2 ฉบับ', 'พื้นที่จัดเก็บ 500MB', 'แจ้งเตือนทางอีเมล', 'ติดตามเงินมัดจำ', 'บันทึกการซ่อมบำรุง']
    },
    nextSteps: {
      en: ['Upload your lease for an AI-powered risk scan', 'Set up deposit tracking for your rental', 'Explore the Evidence Vault to store documents'],
      th: ['อัปโหลดสัญญาเช่าเพื่อสแกนความเสี่ยงด้วย AI', 'ตั้งค่าติดตามเงินมัดจำ', 'สำรวจ Evidence Vault เพื่อจัดเก็บเอกสาร']
    }
  },
  protect: {
    label: 'Protect',
    labelTh: 'โปรเทค',
    color: '#7C3AED',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
    price: '฿399',
    features: {
      en: ['12 Lease Scans per month', '10 Letter Credits', '2GB Document Storage', 'Email + LINE Notifications', 'Deposit & Rent Tracking', 'Maintenance Logger with Photos', 'Priority Support'],
      th: ['สแกนสัญญาเช่า 12 ครั้ง/เดือน', 'เครดิตจดหมาย 10 ฉบับ', 'พื้นที่จัดเก็บ 2GB', 'แจ้งเตือนทาง Email + LINE', 'ติดตามเงินมัดจำและค่าเช่า', 'บันทึกซ่อมบำรุงพร้อมรูปภาพ', 'สนับสนุนแบบด่วน']
    },
    nextSteps: {
      en: ['Upload your lease for a comprehensive risk scan', 'Connect LINE for instant notifications', 'Set up rent reminders so you never miss a payment'],
      th: ['อัปโหลดสัญญาเช่าเพื่อสแกนความเสี่ยงอย่างละเอียด', 'เชื่อมต่อ LINE เพื่อรับแจ้งเตือนทันที', 'ตั้งค่าแจ้งเตือนค่าเช่า']
    }
  },
  secure: {
    label: 'Secure',
    labelTh: 'ซีเคียว',
    color: '#C7A338',
    gradient: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
    price: '฿825',
    features: {
      en: ['50 Lease Scans/year (max 10/month)', '50 Letter Credits/year (max 10/month)', '20GB Document Storage', 'Email + LINE Notifications', 'Full Deposit, Rent & Lease Tracking', '1 Resolve Case/year (Member Pricing)', '10 FastTrack/year (max 3/month)', 'Premium Support'],
      th: ['50 สแกนสัญญา/ปี (สูงสุด 10/เดือน)', '50 เครดิตจดหมาย/ปี (สูงสุด 10/เดือน)', 'พื้นที่จัดเก็บ 20GB', 'แจ้งเตือนทาง Email + LINE', 'ติดตามเงินมัดจำ ค่าเช่า และสัญญา', '1 คดี Resolve/ปี (ราคาสมาชิก)', '10 FastTrack/ปี (สูงสุด 3/เดือน)', 'การสนับสนุนพรีเมียม']
    },
    nextSteps: {
      en: ['Upload your leases for comprehensive scanning (50/year)', 'Set up LINE notifications for real-time alerts', 'Use legal letter templates for landlord communication', 'Open a Resolve Case if you have a dispute'],
      th: ['อัปโหลดสัญญาเช่าเพื่อสแกนอย่างครบถ้วน (50/ปี)', 'ตั้งค่า LINE เพื่อรับแจ้งเตือนแบบเรียลไทม์', 'ใช้แม่แบบจดหมายเพื่อสื่อสารกับเจ้าของ', 'เปิด Resolve Case หากมีข้อพิพาท']
    }
  }
};

function buildUpgradeEmailHtml(user, tier, tierConfig, isTh) {
  const firstName = (user.display_name || user.full_name || '').split(' ')[0] || user.email.split('@')[0].replace(/[._-]/g, ' ').split(' ')[0] || 'there';
  const tierLabel = isTh ? tierConfig.labelTh : tierConfig.label;
  const appUrl = 'https://app.leaseshield.asia';
  const features = isTh ? tierConfig.features.th : tierConfig.features.en;
  const nextSteps = isTh ? tierConfig.nextSteps.th : tierConfig.nextSteps.en;
  const billingInterval = user.billing_interval === 'annual' ? (isTh ? 'รายปี' : 'Annual') : (isTh ? 'รายเดือน' : 'Monthly');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#ECEFED;margin:0;padding:0;line-height:1.6">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)">

  <!-- Header -->
  <div style="background:${tierConfig.gradient};padding:40px 32px;text-align:center">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png" alt="LeaseShield" style="max-width:70px;height:auto;margin-bottom:12px">
    <h1 style="color:#FFFFFF;font-size:28px;margin:0 0 8px 0;font-weight:800">🎉 ${isTh ? 'ยินดีต้อนรับ!' : 'Welcome Aboard!'}</h1>
    <p style="color:rgba(255,255,255,0.9);font-size:16px;margin:0;font-weight:600">${isTh ? `คุณอยู่ในแผน ${tierLabel} แล้ว!` : `You're now on ${tierLabel}!`}</p>
  </div>

  <!-- Body -->
  <div style="padding:32px;color:#1A1D1F">
    <h2 style="color:#0C3B2E;font-size:20px;margin:0 0 16px 0">${isTh ? `สวัสดี ${firstName},` : `Hi ${firstName},`}</h2>
    <p style="color:#475569;font-size:15px;margin:0 0 24px 0">${isTh
      ? `ขอบคุณที่อัปเกรดเป็นแผน <strong style="color:${tierConfig.color}">${tierLabel}</strong>! ตอนนี้คุณมีสิทธิ์เข้าถึงฟีเจอร์ระดับพรีเมียมทั้งหมดแล้ว`
      : `Thank you for upgrading to <strong style="color:${tierConfig.color}">${tierLabel}</strong>! You now have access to all premium features included in your plan.`}</p>

    <!-- Billing Info -->
    <div style="background:#F8FAFC;border-radius:12px;padding:16px;margin-bottom:24px;border:1px solid #E2E8F0">
      <h3 style="color:#0C3B2E;font-size:14px;margin:0 0 8px 0;font-weight:700">💳 ${isTh ? 'ข้อมูลการเรียกเก็บเงิน' : 'Billing Summary'}</h3>
      <table style="width:100%;font-size:13px;color:#475569">
        <tr><td style="padding:4px 0;font-weight:600">${isTh ? 'แผน' : 'Plan'}</td><td style="padding:4px 0;text-align:right;font-weight:700;color:${tierConfig.color}">${tierLabel}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600">${isTh ? 'ราคา' : 'Price'}</td><td style="padding:4px 0;text-align:right">${tierConfig.price}/${isTh ? 'เดือน' : 'mo'}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600">${isTh ? 'รอบการเรียกเก็บเงิน' : 'Billing Cycle'}</td><td style="padding:4px 0;text-align:right">${billingInterval}</td></tr>
      </table>
    </div>

    <!-- Features -->
    <div style="background:${tier === 'secure' ? '#F0FDF4' : '#EFF6FF'};border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid ${tier === 'secure' ? '#D1FAE5' : '#BFDBFE'}">
      <h3 style="color:${tierConfig.color};font-size:14px;margin:0 0 12px 0;font-weight:700">✨ ${isTh ? 'ฟีเจอร์ของคุณ' : 'Your Features'}</h3>
      <ul style="margin:0;padding:0;list-style:none">
        ${features.map(f => `<li style="padding:6px 0;font-size:13px;color:#334155;display:flex;align-items:center;gap:8px"><span style="color:${tierConfig.color};font-size:16px">✓</span> ${f}</li>`).join('')}
      </ul>
    </div>

    <!-- Next Steps -->
    <div style="background:#FFFBEB;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #FDE68A">
      <h3 style="color:#92400E;font-size:14px;margin:0 0 12px 0;font-weight:700">🚀 ${isTh ? 'ขั้นตอนต่อไป' : 'Get Started'}</h3>
      <ol style="margin:0;padding:0 0 0 20px;color:#78350F;font-size:13px">
        ${nextSteps.map(s => `<li style="padding:4px 0">${s}</li>`).join('')}
      </ol>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0">
      <a href="${appUrl}/Dashboard" style="display:inline-block;padding:14px 32px;background:#0C3B2E;color:#C7A338;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(12,59,46,0.25)">${isTh ? 'ไปที่แดชบอร์ด' : 'Go to Dashboard'}</a>
    </div>

    <!-- Support -->
    <div style="border-top:1px solid #E5E7EB;padding-top:20px;margin-top:20px">
      <p style="color:#475569;font-size:13px;margin:0">${isTh
        ? 'มีคำถาม? ตอบกลับอีเมลนี้ได้เลย เราพร้อมช่วยเหลือ!'
        : 'Questions? Just reply to this email — we\'re here to help!'}</p>
      <p style="color:#0C3B2E;font-size:14px;font-weight:600;margin:12px 0 4px 0">${isTh ? 'ขอบคุณที่เลือก LeaseShield!' : 'Thank you for choosing LeaseShield!'}</p>
      <p style="color:#64748B;font-size:13px;margin:0">${isTh ? '— ทีม LeaseShield' : '— The LeaseShield Team'}</p>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#1A1D1F;padding:20px 32px;text-align:center">
    <p style="color:#ECEFED;font-weight:700;font-size:13px;margin:0 0 4px 0">LEASE SHIELD</p>
    <p style="color:#A8ABAD;font-size:11px;margin:0 0 8px 0">${isTh ? 'ยุติธรรม • โปร่งใส • ปลอดภัย' : 'Fair • Transparent • Protected'}</p>
    <p style="color:#6B7280;font-size:10px;margin:0">© ${new Date().getFullYear()} LeaseShield. All rights reserved.</p>
  </div>
</div>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const reqClone = req.clone();
    const base44 = createClientFromRequest(reqClone);

    const { user, newTier } = await req.json();

    if (!user || !newTier) {
      return Response.json({ error: 'Missing user or newTier' }, { status: 400 });
    }

    const tierConfig = TIER_CONFIG[newTier];
    if (!tierConfig) {
      return Response.json({ error: `Unknown tier: ${newTier}` }, { status: 400 });
    }

    const language = user.language || 'en';
    const isTh = language === 'th';
    const tierLabel = isTh ? tierConfig.labelTh : tierConfig.label;

    const subject = `🎉 ${isTh ? `คุณอยู่ในแผน LeaseShield ${tierLabel} แล้ว!` : `You're now on LeaseShield ${tierLabel}!`}`;
    const html = buildUpgradeEmailHtml(user, newTier, tierConfig, isTh);

    if (RESEND_API_KEY) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'LeaseShield <hello@leaseshield.asia>',
          reply_to: 'support@leaseshield.asia',
          to: [user.email],
          subject,
          html,
        }),
      });
      const emailData = await emailRes.json();
      if (emailRes.ok) {
        console.log('[UPGRADE_EMAIL] ✅ Sent via Resend to:', user.email, 'Tier:', newTier, 'ID:', emailData.id);
        return Response.json({ success: true, emailId: emailData.id });
      } else {
        console.error('[UPGRADE_EMAIL] ⚠️ Resend failed:', emailData);
        // Fallback to built-in email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject,
          body: `${isTh ? 'สวัสดี' : 'Hi'}! ${isTh ? `คุณอัปเกรดเป็นแผน ${tierLabel} เรียบร้อยแล้ว` : `You've been upgraded to ${tierLabel}`}. ${isTh ? 'ไปที่' : 'Visit'} https://app.leaseshield.asia/Dashboard`
        });
        return Response.json({ success: true, fallback: true });
      }
    } else {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject,
        body: `${isTh ? 'สวัสดี' : 'Hi'}! ${isTh ? `คุณอัปเกรดเป็นแผน ${tierLabel} เรียบร้อยแล้ว` : `You've been upgraded to ${tierLabel}`}. ${isTh ? 'ไปที่' : 'Visit'} https://app.leaseshield.asia/Dashboard`
      });
      return Response.json({ success: true, fallback: true });
    }
  } catch (error) {
    console.error('[UPGRADE_EMAIL] ❌ Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});