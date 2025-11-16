import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripeSecretKey = Deno.env.get('SK_TEST_secret_key');
const webhookSecret = Deno.env.get('Webhook_stripe');

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
});

// Price ID to credits mapping
const PRICE_CREDIT_MAP = {
  'price_1SR2b5QwoI6NhlUxbwA8JfsS': 1,
  'price_1SR2dLQwoI6NhlUxv0TkEsiZ': 3,
  'price_1SR2gVQwoI6NhlUxbkNkf6r4': 5,
  'price_1SR2hXQwoI6NhlUxwahfstoL': 10,
};

Deno.serve(async (req) => {
  console.log('=== STRIPE WEBHOOK RECEIVED ===');
  
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      console.error('❌ Missing signature or webhook secret');
      return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      console.log('✅ Webhook signature verified. Event type:', event.type);
    } catch (err) {
      console.error('❌ Stripe webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // ========================================
    // CHECKOUT SESSION COMPLETED
    // ========================================
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const metadata = session.metadata || {};
      const customerId = session.customer;
      const email = session.customer_details?.email;
      
      const base44 = createClientFromRequest(req);
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      
      const users = await base44.asServiceRole.entities.User.list();
      
      let user = users.find(u => 
        u.stripe_customer_id === customerId || u.email === email
      );

      if (!user) {
        console.error('❌ User not found for:', email, customerId);
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      // ========================================
      // CREDITS PURCHASE FLOW
      // ========================================
      
      let isCreditsFlow = metadata.type === 'credits';
      let creditsToAdd = 0;

      // Method 1: Metadata-based (dynamic price_data)
      if (metadata.type === 'credits' && metadata.credits) {
        creditsToAdd = parseInt(metadata.credits);
        console.log('💰 CREDITS (metadata): Adding', creditsToAdd, 'credits');
      } 
      // Method 2: Price ID-based (legacy pre-created prices)
      else if (session.mode === 'payment' && !metadata.plan) {
        try {
          const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['line_items.data.price'],
          });

          const items = fullSession.line_items?.data || [];
          let totalCredits = 0;

          for (const item of items) {
            const price = item.price;
            const qty = item.quantity || 1;
            const perCredits = PRICE_CREDIT_MAP[price.id] || 0;
            if (perCredits > 0) {
              totalCredits += perCredits * qty;
            }
          }

          if (totalCredits > 0) {
            isCreditsFlow = true;
            creditsToAdd = totalCredits;
            console.log('💰 CREDITS (price IDs): Adding', creditsToAdd, 'credits');
          }
        } catch (err) {
          console.error('⚠️ Failed to retrieve line items:', err.message);
        }
      }

      if (isCreditsFlow && creditsToAdd > 0) {
        console.log('🪙 Processing CREDITS purchase');
        
        const currentCredits = user.letter_credits || 0;
        const totalPurchased = user.total_credits_purchased || 0;

        await base44.asServiceRole.entities.User.update(user.id, {
          letter_credits: currentCredits + creditsToAdd,
          total_credits_purchased: totalPurchased + creditsToAdd
        });

        console.log('✅ CREDITS UPDATED!');
        console.log('User:', user.email);
        console.log('Added credits:', creditsToAdd);
        console.log('New balance:', currentCredits + creditsToAdd);

        await base44.asServiceRole.entities.Payment.create({
          type: 'addon',
          amount: parseFloat((session.amount_total / 100).toFixed(2)),
          currency: 'THB',
          provider: 'stripe',
          status: 'paid',
          external_id: session.id,
          created_by: user.email
        });

        const lang = user.language || 'en';
        const subject = lang === 'th' 
          ? `ซื้อเครดิต ${creditsToAdd} เครดิตสำเร็จ` 
          : `${creditsToAdd} Credits Purchased Successfully`;
        
        const emailBody = lang === 'th'
          ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #C7A338, #B89330); padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">💰 ซื้อเครดิตสำเร็จ</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>สวัสดี <strong>${user.full_name}</strong>,</p>
              <p>เครดิตของคุณเพิ่มแล้ว! 🎉</p>
              <p style="background: #FFF7ED; padding: 16px; border-radius: 8px; border-left: 4px solid #C7A338;">
                <strong>เครดิตที่ซื้อ:</strong> ${creditsToAdd}<br/>
                <strong>ยอดคงเหลือใหม่:</strong> ${currentCredits + creditsToAdd}<br/>
                <strong>จำนวนเงิน:</strong> ฿${(session.amount_total / 100).toLocaleString()}
              </p>
              <p>ใช้เครดิตของคุณเพื่อสร้างจดหมายทางกฎหมายมืออาชีพได้ทันที</p>
              <p><a href="https://app.leaseshield.asia/templates" style="color: #0C3B2E; font-weight: bold;">ดูเทมเพลต →</a></p>
              <p style="margin-top: 24px;">— ทีม Lease Shield</p>
            </div>
          </div>
          `
          : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #C7A338, #B89330); padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">💰 Credits Purchase Successful</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Hi <strong>${user.full_name}</strong>,</p>
              <p>Your credits have been added! 🎉</p>
              <p style="background: #FFF7ED; padding: 16px; border-radius: 8px; border-left: 4px solid #C7A338;">
                <strong>Credits Purchased:</strong> ${creditsToAdd}<br/>
                <strong>New Balance:</strong> ${currentCredits + creditsToAdd}<br/>
                <strong>Amount Paid:</strong> ฿${(session.amount_total / 100).toLocaleString()}
              </p>
              <p>Use your credits to generate professional legal letters instantly.</p>
              <p><a href="https://app.leaseshield.asia/templates" style="color: #0C3B2E; font-weight: bold;">View Templates →</a></p>
              <p style="margin-top: 24px;">— The Lease Shield Team</p>
            </div>
          </div>
          `;

        if (RESEND_API_KEY) {
          try {
            const resendResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'Lease Shield <no-reply@leaseshield.asia>',
                to: [user.email],
                subject: subject,
                html: emailBody,
              }),
            });

            const resendData = await resendResponse.json();
            if (resendResponse.ok) {
              console.log('✅ Credits email sent. Message ID:', resendData.id);
            } else {
              console.error('❌ Resend email failed:', resendData);
            }
          } catch (emailError) {
            console.error('❌ Email error:', emailError);
          }
        }

        if (user.line_messaging_token && user.line_notifications) {
          console.log('📱 Sending LINE notification...');
          
          const lineMessage = lang === 'th'
            ? `🎉 เครดิตเพิ่มแล้ว!\n\nคุณซื้อ ${creditsToAdd} เครดิต\nยอดคงเหลือ: ${currentCredits + creditsToAdd} เครดิต\n\nใช้สร้างจดหมายได้ทันที 📝`
            : `🎉 Credits Added!\n\nYou purchased ${creditsToAdd} credits\nNew Balance: ${currentCredits + creditsToAdd} credits\n\nStart generating letters now 📝`;

          try {
            const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')}`
              },
              body: JSON.stringify({
                to: user.line_messaging_token,
                messages: [{ type: 'text', text: lineMessage }]
              })
            });

            if (lineResponse.ok) {
              console.log('✅ LINE notification sent!');
            } else {
              const errorText = await lineResponse.text();
              console.error('⚠️ LINE notification failed:', errorText);
            }
          } catch (lineError) {
            console.error('⚠️ LINE notification error:', lineError.message);
          }
        }

        return Response.json({ ok: true, credited: creditsToAdd }, { status: 200 });
      }
      
      // ========================================
      // SUBSCRIPTION PURCHASE FLOW
      // ========================================
      
      if (session.mode === 'subscription' && metadata.plan) {
        console.log('💳 Processing SUBSCRIPTION UPGRADE!');
        console.log('Plan:', metadata.plan);
        console.log('Interval:', metadata.interval);

        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1
        });

        if (subscriptions.data.length === 0) {
          console.error('❌ No active subscription found');
          return Response.json({ error: 'No active subscription' }, { status: 404 });
        }

        const subscription = subscriptions.data[0];
        const renewalTimestamp = subscription.current_period_end;
        const renewalDate = new Date(renewalTimestamp * 1000).toISOString();
        
        console.log('📅 Subscription dates:');
        console.log('  Start:', new Date(subscription.current_period_start * 1000).toISOString());
        console.log('  End:', renewalDate);
        console.log('  Interval:', metadata.interval);

        const includedCredits = {
          'lite': 3,
          'protect': 5,
          'secure': 10
        };
        const creditsToAdd = includedCredits[metadata.plan] || 0;
        const currentCredits = user.letter_credits || 0;
        
        console.log('💳 Adding included credits:', creditsToAdd);

        await base44.asServiceRole.entities.User.update(user.id, {
          plan_tier: metadata.plan,
          billing_interval: metadata.interval,
          plan_renews_at: renewalDate,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          subscription_status: 'active',
          letter_credits: currentCredits + creditsToAdd
        });

        console.log('✅ SUBSCRIPTION + CREDITS UPDATED!');
        console.log('User:', user.email);
        console.log('New plan:', metadata.plan);
        console.log('Billing:', metadata.interval);
        console.log('Renews:', renewalDate);
        console.log('Letter credits:', currentCredits + creditsToAdd);

        await base44.asServiceRole.entities.Payment.create({
          type: 'subscription',
          amount: parseFloat((session.amount_total / 100).toFixed(2)),
          currency: 'THB',
          provider: 'stripe',
          status: 'paid',
          external_id: session.id,
          created_by: user.email
        });

        const lang = user.language || 'en';
        const planLabels = {
          lite: { en: 'Lite', th: 'ไลท์' },
          protect: { en: 'Protect', th: 'โปรเทค' },
          secure: { en: 'Secure', th: 'ซีเคียว' }
        };

        const planLabel = planLabels[metadata.plan]?.[lang] || metadata.plan;
        const intervalLabel = metadata.interval === 'year' 
          ? (lang === 'th' ? 'รายปี' : 'Annual')
          : (lang === 'th' ? 'รายเดือน' : 'Monthly');

        const subject = lang === 'th'
          ? `ยินดีต้อนรับสู่ Lease Shield ${planLabel}!`
          : `Welcome to Lease Shield ${planLabel}!`;

        const emailBody = lang === 'th'
          ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #8B5CF6, #7C3AED); padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">🎉 ยินดีต้อนรับสู่ ${planLabel}!</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>สวัสดี <strong>${user.full_name}</strong>,</p>
              <p>การสมัครสมาชิกของคุณเปิดใช้งานแล้ว! 🎉</p>
              <p style="background: #F5F3FF; padding: 16px; border-radius: 8px; border-left: 4px solid #8B5CF6;">
                <strong>แผน:</strong> ${planLabel}<br/>
                <strong>การเรียกเก็บเงิน:</strong> ${intervalLabel}<br/>
                <strong>ต่ออายุเมื่อ:</strong> ${new Date(renewalDate).toLocaleDateString('th-TH')}<br/>
                <strong>จำนวนเงิน:</strong> ฿${(session.amount_total / 100).toLocaleString()}<br/>
                <strong>เครดิตจดหมาย:</strong> ${currentCredits + creditsToAdd}
              </p>
              <p>คุณสามารถเข้าถึงฟีเจอร์ทั้งหมดในแผนของคุณได้แล้ว</p>
              <p><a href="https://app.leaseshield.asia/account" style="color: #0C3B2E; font-weight: bold;">ดูบัญชีของคุณ →</a></p>
              <p style="margin-top: 24px;">— ทีม Lease Shield</p>
            </div>
          </div>
          `
          : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #8B5CF6, #7C3AED); padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">🎉 Welcome to ${planLabel}!</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Hi <strong>${user.full_name}</strong>,</p>
              <p>Your subscription is now active! 🎉</p>
              <p style="background: #F5F3FF; padding: 16px; border-radius: 8px; border-left: 4px solid #8B5CF6;">
                <strong>Plan:</strong> ${planLabel}<br/>
                <strong>Billing:</strong> ${intervalLabel}<br/>
                <strong>Renews:</strong> ${new Date(renewalDate).toLocaleDateString('en-US')}<br/>
                <strong>Amount:</strong> ฿${(session.amount_total / 100).toLocaleString()}<br/>
                <strong>Letter Credits:</strong> ${currentCredits + creditsToAdd}
              </p>
              <p>You now have access to all features in your plan.</p>
              <p><a href="https://app.leaseshield.asia/account" style="color: #0C3B2E; font-weight: bold;">View Your Account →</a></p>
              <p style="margin-top: 24px;">— The Lease Shield Team</p>
            </div>
          </div>
          `;

        if (RESEND_API_KEY) {
          try {
            const resendResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'Lease Shield <no-reply@leaseshield.asia>',
                to: [user.email],
                subject: subject,
                html: emailBody,
              }),
            });

            const resendData = await resendResponse.json();
            if (resendResponse.ok) {
              console.log('✅ Subscription email sent. Message ID:', resendData.id);
            } else {
              console.error('❌ Resend email failed:', resendData);
            }
          } catch (emailError) {
            console.error('❌ Email error:', emailError);
          }
        }

        if (user.line_messaging_token && user.line_notifications) {
          console.log('📱 Sending LINE subscription notification...');
          
          const displayDate = new Date(renewalDate);
          const formattedDate = lang === 'th'
            ? displayDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
            : displayDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          
          const lineMessage = lang === 'th'
            ? `🎉 ยินดีต้อนรับสู่ ${planLabel}!\n\nการสมัครสมาชิกของคุณเปิดใช้งานแล้ว\nต่ออายุ: ${formattedDate}\nเครดิตจดหมาย: ${currentCredits + creditsToAdd}\n\nเข้าถึงฟีเจอร์ทั้งหมดได้เลย 🚀`
            : `🎉 Welcome to ${planLabel}!\n\nYour subscription is now active\nRenews: ${formattedDate}\nLetter Credits: ${currentCredits + creditsToAdd}\n\nAccess all features now 🚀`;

          try {
            const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')}`
              },
              body: JSON.stringify({
                to: user.line_messaging_token,
                messages: [{ type: 'text', text: lineMessage }]
              })
            });

            if (lineResponse.ok) {
              console.log('✅ LINE subscription notification sent');
            }
          } catch (lineError) {
            console.error('⚠️ LINE notification error:', lineError.message);
          }
        }

        return Response.json({ ok: true, plan: metadata.plan }, { status: 200 });
      }

      return Response.json({ ok: true, message: 'Checkout completed but no action needed' }, { status: 200 });
    }

    // ========================================
    // INVOICE PAYMENT SUCCEEDED (RENEWALS)
    // ========================================
    else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      const customerId = invoice.customer;
      const billingReason = invoice.billing_reason;

      if (!subscriptionId) {
        console.log('⚠️ invoice.payment_succeeded without subscription - skipping');
        return Response.json({ ok: true, skipped: 'not_subscription' }, { status: 200 });
      }

      if (billingReason !== 'subscription_cycle') {
        console.log('⚠️ invoice.payment_succeeded but not a renewal (reason:', billingReason, ') - skipping');
        return Response.json({ ok: true, skipped: 'not_renewal' }, { status: 200 });
      }

      console.log('🔄 Processing subscription renewal');
      console.log('Subscription ID:', subscriptionId);
      console.log('Customer ID:', customerId);

      try {
        const base44 = createClientFromRequest(req);
        const users = await base44.asServiceRole.entities.User.list();
        
        let user = users.find(u => u.stripe_subscription_id === subscriptionId);
        if (!user) {
          user = users.find(u => u.stripe_customer_id === customerId);
        }

        if (!user) {
          console.error('❌ User not found for subscription:', subscriptionId);
          return Response.json({ ok: true, warning: 'user_not_found' }, { status: 200 });
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const renewalDate = new Date(subscription.current_period_end * 1000).toISOString();

        console.log('✅ Updating renewal date:', renewalDate);

        await base44.asServiceRole.entities.User.update(user.id, {
          subscription_status: 'active',
          plan_renews_at: renewalDate
        });

        await base44.asServiceRole.entities.Payment.create({
          type: 'subscription',
          amount: parseFloat((invoice.amount_paid / 100).toFixed(2)),
          currency: 'THB',
          provider: 'stripe',
          status: 'paid',
          external_id: invoice.id,
          created_by: user.email
        });

        console.log('✅ Subscription renewal recorded for:', user.email);

        return Response.json({ ok: true, renewed: true }, { status: 200 });
      } catch (err) {
        console.error('❌ Error processing renewal:', err.message);
        return Response.json({ ok: true, error: err.message }, { status: 200 });
      }
    }

    // ========================================
    // INVOICE PAYMENT FAILED
    // ========================================
    else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      const customerId = invoice.customer;
      const attemptCount = invoice.attempt_count;
      const amountDue = invoice.amount_due;

      if (!subscriptionId) {
        console.log('⚠️ invoice.payment_failed without subscription - skipping');
        return Response.json({ ok: true, skipped: 'not_subscription' }, { status: 200 });
      }

      console.log('❌ Processing failed payment');
      console.log('Subscription ID:', subscriptionId);
      console.log('Customer ID:', customerId);
      console.log('Attempt:', attemptCount);
      console.log('Amount due:', amountDue / 100, 'THB');

      try {
        const base44 = createClientFromRequest(req);
        const users = await base44.asServiceRole.entities.User.list();
        
        let user = users.find(u => u.stripe_subscription_id === subscriptionId);
        if (!user) {
          user = users.find(u => u.stripe_customer_id === customerId);
        }

        if (!user) {
          console.error('❌ User not found for subscription:', subscriptionId);
          return Response.json({ ok: true, warning: 'user_not_found' }, { status: 200 });
        }

        await base44.asServiceRole.entities.User.update(user.id, {
          subscription_status: 'past_due'
        });

        console.log('⚠️ Subscription marked as past_due for:', user.email);
        console.log('User ID:', user.id);
        console.log('Subscription ID:', subscriptionId);
        console.log('Amount:', amountDue / 100, 'THB');
        console.log('Attempt:', attemptCount);

        return Response.json({ ok: true, marked_past_due: true }, { status: 200 });
      } catch (err) {
        console.error('❌ Error processing failed payment:', err.message);
        return Response.json({ ok: true, error: err.message }, { status: 200 });
      }
    }

    // ========================================
    // SUBSCRIPTION DELETED (EXPIRY/CANCELLATION)
    // ========================================
    else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const subscriptionId = subscription.id;
      const customerId = subscription.customer;
      const endedAt = subscription.ended_at;

      console.log('🚫 Processing subscription deletion');
      console.log('Subscription ID:', subscriptionId);
      console.log('Customer ID:', customerId);
      console.log('Ended at:', endedAt ? new Date(endedAt * 1000).toISOString() : 'unknown');

      try {
        const base44 = createClientFromRequest(req);
        const users = await base44.asServiceRole.entities.User.list();
        
        let user = users.find(u => u.stripe_subscription_id === subscriptionId);
        if (!user) {
          user = users.find(u => u.stripe_customer_id === customerId);
        }

        if (!user) {
          console.error('❌ User not found for subscription:', subscriptionId);
          return Response.json({ ok: true, warning: 'user_not_found' }, { status: 200 });
        }

        await base44.asServiceRole.entities.User.update(user.id, {
          plan_tier: 'free',
          subscription_status: 'expired',
          billing_interval: null,
          stripe_subscription_id: null,
          plan_renews_at: endedAt ? new Date(endedAt * 1000).toISOString() : null
        });

        console.log('✅ User downgraded to free plan:', user.email);

        return Response.json({ ok: true, downgraded: true }, { status: 200 });
      } catch (err) {
        console.error('❌ Error processing subscription deletion:', err.message);
        return Response.json({ ok: true, error: err.message }, { status: 200 });
      }
    }

    // ========================================
    // UNHANDLED EVENT TYPES
    // ========================================
    else {
      console.log('ℹ️ Unhandled Stripe event type:', event.type);
      return Response.json({ received: true }, { status: 200 });
    }
    
  } catch (error) {
    console.error('❌ WEBHOOK ERROR:', error.message);
    console.error('Error stack:', error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});