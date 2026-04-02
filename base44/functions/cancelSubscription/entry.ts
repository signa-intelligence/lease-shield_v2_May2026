import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    // Clone request so both SDK and body parsing can read it
    const reqClone = req.clone();
    const base44 = createClientFromRequest(reqClone);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason, feedback } = await req.json();

    console.log('[CANCEL] Request from:', user.email, 'Reason:', reason);

    if (!user.stripe_customer_id) {
      console.error('[CANCEL] No stripe_customer_id for user:', user.email);
      return Response.json({ error: 'No Stripe customer found. Please contact support.' }, { status: 400 });
    }

    // Try active first, then try all statuses
    let subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      // Also check for trialing subscriptions
      subscriptions = await stripe.subscriptions.list({
        customer: user.stripe_customer_id,
        status: 'trialing',
        limit: 1
      });
    }

    if (subscriptions.data.length === 0) {
      console.error('[CANCEL] No active subscription for customer:', user.stripe_customer_id);
      return Response.json({ error: 'No active subscription found. It may have already been cancelled.' }, { status: 400 });
    }

    const subscription = subscriptions.data[0];
    console.log('[CANCEL] Found subscription:', subscription.id, 'status:', subscription.status);

    // Prevent duplicate cancellation
    if (subscription.cancel_at_period_end) {
      console.log('[CANCEL] Already scheduled for cancellation:', subscription.id);
      return Response.json({
        success: true,
        already_pending: true,
        cancel_at_period_end: true,
        access_until: new Date(subscription.current_period_end * 1000).toISOString()
      });
    }

    // Cancel at period end (user keeps access until renewal date)
    const canceledSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
      cancellation_details: {
        comment: feedback || reason || 'User requested cancellation'
      }
    });

    console.log('[CANCEL] ✅ Scheduled cancellation:', canceledSubscription.id);
    console.log('[CANCEL] Cancels at:', new Date(canceledSubscription.current_period_end * 1000).toISOString());

    // Update user record - mark as canceling (not cancelled - they still have access)
    await base44.auth.updateMe({
      subscription_status: 'canceling',
      cancellation_reason: reason,
      cancellation_feedback: feedback,
      cancellation_date: new Date().toISOString()
    });

    // Send branded HTML cancellation email via Resend
    const language = user.language || 'en';
    const cancelDate = new Date(canceledSubscription.current_period_end * 1000);
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    const firstName = (user.display_name || user.full_name || '').split(' ')[0] || user.email.split('@')[0].replace(/[._-]/g, ' ').split(' ')[0] || 'there';
    const tierLabel = (user.plan_tier || 'unknown').toUpperCase();
    const endDateStr = language === 'th'
      ? cancelDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
      : cancelDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const appUrl = 'https://app.leaseshield.asia';
    const isTh = language === 'th';

    const cancelSubject = isTh
      ? `การสมัครสมาชิก LeaseShield ของคุณจะสิ้นสุดในวันที่ ${endDateStr}`
      : `Your LeaseShield subscription will end on ${endDateStr}`;

    const cancelHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#ECEFED;margin:0;padding:0;line-height:1.6">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
  <div style="background:linear-gradient(135deg,#0C3B2E 0%,#047857 100%);padding:32px;text-align:center">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png" alt="LeaseShield" style="max-width:80px;height:auto;margin-bottom:8px">
    <p style="color:#C7A338;font-size:12px;font-weight:600;letter-spacing:2px;margin:0">${isTh ? 'ยุติธรรม • โปร่งใส • ปลอดภัย' : 'FAIR • TRANSPARENT • PROTECTED'}</p>
  </div>
  <div style="padding:32px;color:#1A1D1F">
    <h2 style="color:#0C3B2E;font-size:20px;margin:0 0 16px 0">${isTh ? `สวัสดี ${firstName},` : `Hi ${firstName},`}</h2>
    <p style="color:#475569;font-size:15px;margin:0 0 16px 0">${isTh
      ? `เราได้รับคำขอยกเลิกแผน <strong>${tierLabel}</strong> ของคุณแล้ว เราเสียใจที่เห็นคุณจากไป`
      : `We've received your request to cancel your <strong>${tierLabel}</strong> plan. We're sorry to see you go.`}</p>

    <div style="background:#F0FDF4;border:1px solid #D1FAE5;border-radius:12px;padding:20px;margin:20px 0">
      <h3 style="color:#047857;font-size:14px;margin:0 0 12px 0">✅ ${isTh ? 'คุณยังใช้งานได้จนถึง' : 'You still have access until'}</h3>
      <p style="color:#0C3B2E;font-size:22px;font-weight:700;margin:0 0 12px 0">${endDateStr}</p>
      <p style="color:#475569;font-size:13px;margin:0">${isTh
        ? 'ฟีเจอร์ทั้งหมดจะทำงานตามปกติจนถึงวันนี้'
        : 'All your current features will continue to work normally until this date.'}</p>
    </div>

    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:20px;margin:20px 0">
      <h3 style="color:#991B1B;font-size:14px;margin:0 0 8px 0">${isTh ? 'หลังจากวันนั้น' : 'After that date'}</h3>
      <p style="color:#7F1D1D;font-size:13px;margin:0">${isTh
        ? 'บัญชีจะเปลี่ยนเป็นแผน Explorer (ฟรี) พร้อม 1 การสแกน, พื้นที่ 100MB และฟีเจอร์พื้นฐาน'
        : "Your account will move to the Explorer (free) plan with 1 scan, 100MB storage, and basic features."}</p>
    </div>

    <div style="text-align:center;margin:28px 0">
      <p style="color:#475569;font-size:14px;margin:0 0 12px 0;font-weight:600">${isTh ? 'เปลี่ยนใจ?' : 'Changed your mind?'}</p>
      <a href="${appUrl}/account" style="display:inline-block;padding:14px 28px;background:#0C3B2E;color:#C7A338;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px">${isTh ? 'เปิดใช้งานอีกครั้ง' : 'Reactivate My Subscription'}</a>
      <p style="color:#9CA3AF;font-size:12px;margin:10px 0 0 0">${isTh ? 'หรือเปลี่ยนเป็นแผนที่ถูกกว่า' : 'Or switch to a lower-cost plan'}</p>
    </div>

    <div style="border-top:1px solid #E5E7EB;padding-top:20px;margin-top:20px">
      <p style="color:#475569;font-size:13px;margin:0 0 12px 0">${isTh
        ? 'ขอบคุณที่เป็นสมาชิก LeaseShield หากมีสิ่งใดที่เราสามารถทำได้ดีกว่านี้ ตอบกลับอีเมลนี้ได้เลย เราอ่านทุกข้อความ'
        : "Thank you for being a LeaseShield member. If there's anything we could have done better, just reply to this email — we read every message."}</p>
      <p style="color:#0C3B2E;font-size:14px;font-weight:600;margin:0 0 4px 0">${isTh ? 'ขอให้โชคดี!' : 'Wishing you all the best!'}</p>
      <p style="color:#64748B;font-size:13px;margin:0">${isTh ? '— ทีม LeaseShield' : '— The LeaseShield Team'}</p>
    </div>
  </div>
  <div style="background:#1A1D1F;padding:20px 32px;text-align:center">
    <p style="color:#ECEFED;font-weight:700;font-size:13px;margin:0 0 4px 0">LEASE SHIELD</p>
    <p style="color:#A8ABAD;font-size:11px;margin:0 0 8px 0">${isTh ? 'ป้องกันปัญหาการเช่าก่อนที่จะเกิดขึ้น' : 'Prevent rental problems before they happen'}</p>
    <p style="color:#6B7280;font-size:10px;margin:0">© ${new Date().getFullYear()} LeaseShield. All rights reserved.</p>
  </div>
</div>
</body></html>`;

    try {
      if (RESEND_API_KEY) {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'LeaseShield <hello@leaseshield.asia>',
            reply_to: 'support@leaseshield.asia',
            to: [user.email],
            subject: cancelSubject,
            html: cancelHtml,
          }),
        });
        const emailData = await emailRes.json();
        if (emailRes.ok) {
          console.log('[CANCEL] ✅ Branded email sent via Resend. ID:', emailData.id);
        } else {
          console.error('[CANCEL] ⚠️ Resend failed, falling back:', emailData);
          await base44.asServiceRole.integrations.Core.SendEmail({ to: user.email, subject: cancelSubject, body: `Hi ${firstName}, your ${tierLabel} subscription will end on ${endDateStr}. Visit ${appUrl}/account to reactivate.` });
        }
      } else {
        await base44.asServiceRole.integrations.Core.SendEmail({ to: user.email, subject: cancelSubject, body: `Hi ${firstName}, your ${tierLabel} subscription will end on ${endDateStr}. Visit ${appUrl}/account to reactivate.` });
      }
      console.log('[CANCEL] ✅ Confirmation email sent to:', user.email);
    } catch (emailErr) {
      console.error('[CANCEL] ⚠️ Email failed (non-critical):', emailErr.message);
    }

    // Send notification to ops team (non-blocking)
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'ops@leaseshield.asia',
        subject: `Subscription Cancelled - ${user.email}`,
        body: `User: ${user.full_name} (${user.email})
Plan: ${user.plan_tier}
Reason: ${reason}
Feedback: ${feedback || 'None'}
Cancels at: ${cancelDate.toISOString()}
Customer ID: ${user.stripe_customer_id}`
      });
    } catch (opsEmailErr) {
      console.error('[CANCEL] ⚠️ Ops email failed:', opsEmailErr.message);
    }

    return Response.json({ 
      success: true,
      cancel_at: canceledSubscription.cancel_at,
      cancel_at_period_end: true,
      access_until: cancelDate.toISOString()
    });

  } catch (error) {
    console.error('[CANCEL] ❌ Error:', error.message, error.stack?.substring(0, 300));
    return Response.json({ 
      error: error.message || 'Cancellation failed',
      details: error.type || 'unknown'
    }, { status: 500 });
  }
});