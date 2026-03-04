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

    // Cancel at period end (user keeps access until renewal date)
    const canceledSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
      cancellation_details: {
        comment: feedback || reason || 'User requested cancellation'
      }
    });

    console.log('[CANCEL] ✅ Scheduled cancellation:', canceledSubscription.id);
    console.log('[CANCEL] Cancels at:', new Date(canceledSubscription.current_period_end * 1000).toISOString());

    const { outcome } = await req.clone().json().catch(() => ({}));

    // Update user record - mark as canceling (not cancelled - they still have access)
    await base44.auth.updateMe({
      subscription_status: 'canceling',
      cancellation_reason: reason,
      cancellation_feedback: feedback,
      cancellation_date: new Date().toISOString()
    });

    // Store cancellation reason in CancellationReason entity for analytics
    const tierPrices = { secure: 990, protect: 390, lite: 190, free: 0 };
    try {
      await base44.asServiceRole.entities.CancellationReason.create({
        user_email: user.email,
        user_id: user.id,
        previous_tier: user.plan_tier || 'unknown',
        reason: reason || 'not_specified',
        reason_details: feedback || '',
        outcome: outcome || 'cancelled',
        new_tier: outcome?.includes('downgraded') ? outcome.replace('downgraded_to_', '') : null,
        subscription_value: tierPrices[user.plan_tier] || 0,
        revenue_retained: 0
      });
      console.log('[CANCEL] ✅ Cancellation reason stored');
    } catch (crErr) {
      console.error('[CANCEL] ⚠️ Failed to store reason (non-critical):', crErr.message);
    }

    // Send confirmation email (non-blocking)
    const language = user.language || 'en';
    const cancelDate = new Date(canceledSubscription.current_period_end * 1000);
    
    const subject = language === 'th' 
      ? 'ยืนยันการยกเลิกการสมัครสมาชิก' 
      : 'Subscription Cancellation Confirmed';
    
    const body = language === 'th'
      ? `สวัสดี ${user.full_name},

การยกเลิกการสมัครสมาชิก ${(user.plan_tier || 'unknown').toUpperCase()} ของคุณได้รับการยืนยันแล้ว

คุณจะยังคงสามารถเข้าถึงฟีเจอร์ทั้งหมดได้จนถึง: ${cancelDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}

หลังจากนั้น คุณจะถูกเปลี่ยนเป็นแผนฟรี

เหตุผลในการยกเลิก: ${reason || 'ไม่ได้ระบุ'}

หากคุณเปลี่ยนใจ คุณสามารถเปิดใช้งานการสมัครสมาชิกอีกครั้งได้ตลอดเวลาจากหน้าบัญชีของคุณ

ขอบคุณที่ใช้ Lease Shield 🙏

— ทีม Lease Shield`
      : `Hi ${user.full_name},

Your ${(user.plan_tier || 'unknown').toUpperCase()} subscription cancellation has been confirmed.

You'll continue to have full access until: ${cancelDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

After that, you'll be moved to the Free plan.

Cancellation reason: ${reason || 'Not specified'}

If you change your mind, you can reactivate your subscription anytime from your Account page.

Thank you for using Lease Shield 🙏

— The Lease Shield Team`;

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject,
        body
      });
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