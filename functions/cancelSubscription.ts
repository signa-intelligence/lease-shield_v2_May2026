import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.10.0';

/**
 * STRIPE SUBSCRIPTION CANCELLATION
 * 
 * Required Secrets:
 * - SK_TEST_secret_key: Stripe API key (sk_live_... for production)
 */

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), { // ⚠️ Name is misleading - should contain LIVE key for production
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason, feedback } = await req.json();

    console.log('Cancellation request from:', user.email, 'Reason:', reason);

    // Get user's active subscriptions
    if (!user.stripe_customer_id) {
      return Response.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return Response.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const subscription = subscriptions.data[0];

    // Cancel at period end (user keeps access until renewal date)
    const canceledSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
      cancellation_details: {
        comment: feedback || reason || 'User requested cancellation'
      }
    });

    console.log('Subscription scheduled for cancellation:', canceledSubscription.id);
    console.log('Cancels at:', new Date(canceledSubscription.cancel_at * 1000).toISOString());

    // Update user record
    await base44.auth.updateMe({
      subscription_status: 'cancelled',
      cancellation_reason: reason,
      cancellation_feedback: feedback,
      cancellation_date: new Date().toISOString()
    });

    // Send confirmation email
    const language = user.language || 'en';
    const cancelDate = new Date(canceledSubscription.current_period_end * 1000);
    
    const subject = language === 'th' 
      ? 'ยืนยันการยกเลิกการสมัครสมาชิก' 
      : 'Subscription Cancellation Confirmed';
    
    const body = language === 'th'
      ? `สวัสดี ${user.full_name},

การยกเลิกการสมัครสมาชิก ${user.plan_tier.toUpperCase()} ของคุณได้รับการยืนยันแล้ว

คุณจะยังคงสามารถเข้าถึงฟีเจอร์ทั้งหมดได้จนถึง: ${cancelDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}

หลังจากนั้น คุณจะถูกเปลี่ยนเป็นแผนฟรี

เหตุผลในการยกเลิก: ${reason || 'ไม่ได้ระบุ'}

หากคุณเปลี่ยนใจ คุณสามารถเปิดใช้งานการสมัครสมาชิกอีกครั้งได้ตลอดเวลาจากหน้าบัญชีของคุณ

ขอบคุณที่ใช้ Lease Shield 🙏

— ทีม Lease Shield`
      : `Hi ${user.full_name},

Your ${user.plan_tier.toUpperCase()} subscription cancellation has been confirmed.

You'll continue to have full access until: ${cancelDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

After that, you'll be moved to the Free plan.

Cancellation reason: ${reason || 'Not specified'}

If you change your mind, you can reactivate your subscription anytime from your Account page.

Thank you for using Lease Shield 🙏

— The Lease Shield Team`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject,
      body
    });

    // Send notification to ops team
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

    return Response.json({ 
      success: true,
      cancel_at: canceledSubscription.cancel_at,
      cancel_at_period_end: true
    });

  } catch (error) {
    console.error('Cancellation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});