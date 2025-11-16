import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripeSecretKey = Deno.env.get('SK_TEST_secret_key');
const webhookSecret = Deno.env.get('Webhook_stripe');

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
});

const PRICE_CREDIT_MAP = {
  'price_1SR2b5QwoI6NhlUxbwA8JfsS': 1,
  'price_1SR2dLQwoI6NhlUxv0TkEsiZ': 3,
  'price_1SR2gVQwoI6NhlUxbkNkf6r4': 5,
  'price_1SR2hXQwoI6NhlUxwahfstoL': 10,
};

Deno.serve(async (req) => {
  console.log('\n\n=== STRIPE WEBHOOK RECEIVED ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    console.log('📨 Webhook signature present:', !!signature);
    console.log('🔐 Webhook secret configured:', !!webhookSecret);

    if (!signature) {
      console.error('❌ No stripe-signature header found');
      return Response.json({ error: 'No signature provided' }, { status: 400 });
    }

    if (!webhookSecret) {
      console.error('❌ Webhook_stripe secret not configured');
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      console.log('✅✅✅ WEBHOOK SIGNATURE VERIFIED ✅✅✅');
      console.log('Event ID:', event.id);
      console.log('Event Type:', event.type);
      console.log('Event Created:', new Date(event.created * 1000).toISOString());
    } catch (err) {
      console.error('❌❌❌ SIGNATURE VERIFICATION FAILED ❌❌❌');
      console.error('Error:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('\n📋 FULL EVENT DATA:');
    console.log(JSON.stringify(event.data.object, null, 2));

    const base44 = createClientFromRequest(req);
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    // ========================================
    // CHECKOUT SESSION COMPLETED
    // ========================================
    if (event.type === 'checkout.session.completed') {
      console.log('\n💳 PROCESSING: checkout.session.completed');
      
      const session = event.data.object;
      const metadata = session.metadata || {};
      const customerId = session.customer;
      const email = session.customer_details?.email;
      
      console.log('Session ID:', session.id);
      console.log('Mode:', session.mode);
      console.log('Customer ID:', customerId);
      console.log('Email:', email);
      console.log('Client Reference ID:', session.client_reference_id);
      console.log('Metadata:', JSON.stringify(metadata, null, 2));
      console.log('Amount Total:', session.amount_total);
      console.log('Currency:', session.currency);
      console.log('Subscription ID:', session.subscription);

      const isSubscriptionCheckout = session.mode === 'subscription' || metadata.type === 'subscription';
      const isCreditsCheckout = session.mode === 'payment' || metadata.type === 'credits' || metadata.credits;

      console.log('\n🎯 CHECKOUT TYPE:');
      console.log('Is Subscription:', isSubscriptionCheckout);
      console.log('Is Credits:', isCreditsCheckout);

      // ========================================
      // SUBSCRIPTION FLOW
      // ========================================
      if (isSubscriptionCheckout) {
        console.log('\n💳💳💳 SUBSCRIPTION CHECKOUT DETECTED 💳💳💳');

        // 1) Resolve user with cascade fallback
        const users = await base44.asServiceRole.entities.User.list();
        console.log('📊 Total users in DB:', users.length);
        
        let user = null;

        if (metadata.userId) {
          user = users.find(u => u.id === metadata.userId);
          console.log('🔍 Lookup by metadata.userId:', metadata.userId, '→', user ? `✅ ${user.email}` : '❌ Not found');
        }

        if (!user && session.client_reference_id) {
          user = users.find(u => u.id === session.client_reference_id);
          console.log('🔍 Lookup by client_reference_id:', session.client_reference_id, '→', user ? `✅ ${user.email}` : '❌ Not found');
        }

        if (!user && customerId) {
          user = users.find(u => u.stripe_customer_id === customerId);
          console.log('🔍 Lookup by stripe_customer_id:', customerId, '→', user ? `✅ ${user.email}` : '❌ Not found');
        }

        if (!user && email) {
          user = users.find(u => u.email === email);
          console.log('🔍 Lookup by email:', email, '→', user ? `✅ ${user.email}` : '❌ Not found');
        }

        if (!user) {
          console.error('\n❌❌❌ CRITICAL: NO USER FOUND FOR SUBSCRIPTION ❌❌❌');
          console.error('Tried:');
          console.error('  - metadata.userId:', metadata.userId);
          console.error('  - client_reference_id:', session.client_reference_id);
          console.error('  - stripe_customer_id:', customerId);
          console.error('  - email:', email);
          return Response.json({ 
            received: true, 
            error: 'user_not_found_for_subscription',
            metadata: metadata,
            session_id: session.id
          }, { status: 200 });
        }

        console.log('\n✅ USER RESOLVED:', user.email);
        console.log('User ID:', user.id);
        console.log('Current plan_tier:', user.plan_tier);
        console.log('Current letter_credits:', user.letter_credits);

        // 2) Extract plan details from metadata
        const planTier = (metadata.plan || '').toLowerCase() || 'lite';
        const intervalFromMetadata = metadata.interval || 'month';
        const billingInterval = intervalFromMetadata === 'year' ? 'annual' : 'monthly';

        console.log('\n📋 SUBSCRIPTION DETAILS:');
        console.log('Plan Tier (from metadata):', planTier);
        console.log('Interval (from metadata):', intervalFromMetadata);
        console.log('Billing Interval (normalized):', billingInterval);

        // 3) Get subscription renewal date
        const subscriptionId = session.subscription;
        let planRenewsAt = null;

        if (!subscriptionId) {
          console.warn('⚠️ No subscription ID in session');
        } else {
          try {
            console.log('🔍 Fetching subscription details:', subscriptionId);
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            console.log('Subscription status:', subscription.status);
            console.log('Current period start:', new Date(subscription.current_period_start * 1000).toISOString());
            console.log('Current period end:', new Date(subscription.current_period_end * 1000).toISOString());
            
            if (subscription.current_period_end) {
              planRenewsAt = new Date(subscription.current_period_end * 1000).toISOString();
              console.log('✅ Plan renews at:', planRenewsAt);
            }
          } catch (err) {
            console.error('⚠️ Failed to retrieve subscription:', err.message);
          }
        }

        // 4) Calculate included credits based on tier
        const includedCredits = {
          'lite': 3,
          'protect': 5,
          'secure': 10
        };
        const creditsToAdd = includedCredits[planTier] || 0;
        const currentCredits = user.letter_credits || 0;
        const newCreditBalance = currentCredits + creditsToAdd;

        console.log('\n💎 CREDITS:');
        console.log('Tier includes:', creditsToAdd);
        console.log('User current:', currentCredits);
        console.log('New balance:', newCreditBalance);

        // 5) Update user record
        console.log('\n🔄 UPDATING USER RECORD...');
        
        const updateData = {
          plan_tier: planTier,
          billing_interval: billingInterval,
          plan_renews_at: planRenewsAt,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          subscription_status: 'active',
          letter_credits: newCreditBalance
        };

        console.log('Update payload:', JSON.stringify(updateData, null, 2));

        await base44.asServiceRole.entities.User.update(user.id, updateData);

        console.log('\n✅✅✅ SUBSCRIPTION ACTIVATED ✅✅✅');
        console.log('User:', user.email);
        console.log('User ID:', user.id);
        console.log('Plan Tier:', planTier);
        console.log('Billing Interval:', billingInterval);
        console.log('Renews At:', planRenewsAt);
        console.log('Letter Credits:', newCreditBalance);
        console.log('Subscription Status: active');

        // 6) Create payment record
        try {
          await base44.asServiceRole.entities.Payment.create({
            type: 'subscription',
            amount: parseFloat((session.amount_total / 100).toFixed(2)),
            currency: 'THB',
            provider: 'stripe',
            status: 'paid',
            external_id: session.id,
            created_by: user.email
          });
          console.log('✅ Payment record created');
        } catch (paymentErr) {
          console.error('⚠️ Failed to create payment record:', paymentErr.message);
        }

        // 7) Send email notification
        const lang = user.language || 'en';
        const planLabels = {
          lite: { en: 'Lite', th: 'ไลท์' },
          protect: { en: 'Protect', th: 'โปรเทค' },
          secure: { en: 'Secure', th: 'ซีเคียว' }
        };

        const planLabel = planLabels[planTier]?.[lang] || planTier;
        const intervalLabel = billingInterval === 'annual'
          ? (lang === 'th' ? 'รายปี' : 'Annual')
          : (lang === 'th' ? 'รายเดือน' : 'Monthly');

        const subject = lang === 'th'
          ? `ยินดีต้อนรับสู่ Lease Shield ${planLabel}!`
          : `Welcome to Lease Shield ${planLabel}!`;

        const emailBody = lang === 'th'
          ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">🎉 ยินดีต้อนรับสู่ ${planLabel}!</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>สวัสดี <strong>${user.full_name}</strong>,</p>
              <p>การสมัครสมาชิกของคุณเปิดใช้งานแล้ว! 🎉</p>
              <p style="background: #F0FDF4; padding: 16px; border-radius: 8px; border-left: 4px solid #10B981;">
                <strong>แผน:</strong> ${planLabel}<br/>
                <strong>การเรียกเก็บเงิน:</strong> ${intervalLabel}<br/>
                <strong>ต่ออายุเมื่อ:</strong> ${planRenewsAt ? new Date(planRenewsAt).toLocaleDateString('th-TH') : 'N/A'}<br/>
                <strong>จำนวนเงิน:</strong> ฿${(session.amount_total / 100).toLocaleString()}<br/>
                <strong>เครดิตจดหมาย:</strong> ${newCreditBalance}
              </p>
              <p>คุณสามารถเข้าถึงฟีเจอร์ทั้งหมดในแผนของคุณได้แล้ว</p>
              <p><a href="https://app.leaseshield.asia/dashboard" style="color: #0C3B2E; font-weight: bold;">เข้าสู่แดชบอร์ด →</a></p>
              <p style="margin-top: 24px;">— ทีม Lease Shield</p>
            </div>
          </div>
          `
          : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">🎉 Welcome to ${planLabel}!</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Hi <strong>${user.full_name}</strong>,</p>
              <p>Your subscription is now active! 🎉</p>
              <p style="background: #F0FDF4; padding: 16px; border-radius: 8px; border-left: 4px solid #10B981;">
                <strong>Plan:</strong> ${planLabel}<br/>
                <strong>Billing:</strong> ${intervalLabel}<br/>
                <strong>Renews:</strong> ${planRenewsAt ? new Date(planRenewsAt).toLocaleDateString('en-US') : 'N/A'}<br/>
                <strong>Amount:</strong> ฿${(session.amount_total / 100).toLocaleString()}<br/>
                <strong>Letter Credits:</strong> ${newCreditBalance}
              </p>
              <p>You now have access to all features in your plan.</p>
              <p><a href="https://app.leaseshield.asia/dashboard" style="color: #0C3B2E; font-weight: bold;">Go to Dashboard →</a></p>
              <p style="margin-top: 24px;">— The Lease Shield Team</p>
            </div>
          </div>
          `;

        if (RESEND_API_KEY) {
          try {
            console.log('📧 Sending subscription confirmation email...');
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
              console.log('✅ Email sent successfully. Message ID:', resendData.id);
            } else {
              console.error('❌ Email send failed:', resendData);
            }
          } catch (emailError) {
            console.error('❌ Email error:', emailError.message);
          }
        } else {
          console.warn('⚠️ RESEND_API_KEY not configured, skipping email');
        }

        // 8) LINE notification
        if (user.line_messaging_token && user.line_notifications) {
          const displayDate = planRenewsAt ? new Date(planRenewsAt) : new Date();
          const formattedDate = lang === 'th'
            ? displayDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
            : displayDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          
          const lineMessage = lang === 'th'
            ? `🎉 ยินดีต้อนรับสู่ ${planLabel}!\n\nการสมัครสมาชิกของคุณเปิดใช้งานแล้ว\nต่ออายุ: ${formattedDate}\nเครดิตจดหมาย: ${newCreditBalance}\n\nเข้าถึงฟีเจอร์ทั้งหมดได้เลย 🚀`
            : `🎉 Welcome to ${planLabel}!\n\nYour subscription is now active\nRenews: ${formattedDate}\nLetter Credits: ${newCreditBalance}\n\nAccess all features now 🚀`;

          try {
            console.log('📱 Sending LINE notification...');
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
              console.log('✅ LINE notification sent');
            } else {
              const lineError = await lineResponse.json();
              console.error('❌ LINE API error:', lineError);
            }
          } catch (lineError) {
            console.error('❌ LINE error:', lineError.message);
          }
        } else {
          console.log('ℹ️ LINE notifications not enabled for user');
        }

        console.log('\n✅ SUBSCRIPTION PROCESSING COMPLETE\n');
        return Response.json({ 
          received: true, 
          processed: 'subscription',
          user: user.email,
          plan: planTier,
          interval: billingInterval
        }, { status: 200 });
      }

      // ========================================
      // CREDITS FLOW
      // ========================================
      if (!isSubscriptionCheckout && isCreditsCheckout) {
        console.log('\n💰💰💰 CREDITS CHECKOUT DETECTED 💰💰💰');

        const users = await base44.asServiceRole.entities.User.list();
        let user = null;

        if (metadata.userId) {
          user = users.find(u => u.id === metadata.userId);
          console.log('🔍 Lookup by metadata.userId:', metadata.userId, '→', user ? `✅ ${user.email}` : '❌ Not found');
        }

        if (!user && session.client_reference_id) {
          user = users.find(u => u.id === session.client_reference_id);
          console.log('🔍 Lookup by client_reference_id:', session.client_reference_id, '→', user ? `✅ ${user.email}` : '❌ Not found');
        }

        if (!user && customerId) {
          user = users.find(u => u.stripe_customer_id === customerId);
          console.log('🔍 Lookup by stripe_customer_id:', customerId, '→', user ? `✅ ${user.email}` : '❌ Not found');
        }

        if (!user && email) {
          user = users.find(u => u.email === email);
          console.log('🔍 Lookup by email:', email, '→', user ? `✅ ${user.email}` : '❌ Not found');
        }

        if (!user) {
          console.error('❌ User not found for credits:', { email, customerId });
          return Response.json({ received: true, error: 'user_not_found' }, { status: 200 });
        }

        console.log('\n✅ USER RESOLVED:', user.email);

        let creditsToAdd = 0;

        // Try metadata first
        if (metadata.credits) {
          creditsToAdd = parseInt(metadata.credits);
          console.log('💰 Credits from metadata:', creditsToAdd);
        } 
        // Fallback to price ID mapping
        else {
          try {
            console.log('🔍 Fetching line items from session...');
            const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
              expand: ['line_items.data.price'],
            });

            const items = fullSession.line_items?.data || [];
            console.log('Line items found:', items.length);

            let totalCredits = 0;
            for (const item of items) {
              const price = item.price;
              const qty = item.quantity || 1;
              const priceId = price.id;
              const perCredits = PRICE_CREDIT_MAP[priceId] || 0;
              
              console.log(`  - Price ${priceId}: ${perCredits} credits × ${qty} qty = ${perCredits * qty}`);
              
              if (perCredits > 0) {
                totalCredits += perCredits * qty;
              }
            }

            if (totalCredits > 0) {
              creditsToAdd = totalCredits;
              console.log('💰 Credits from price IDs:', creditsToAdd);
            }
          } catch (err) {
            console.error('⚠️ Failed to retrieve line items:', err.message);
          }
        }

        if (creditsToAdd > 0) {
          const currentCredits = user.letter_credits || 0;
          const totalPurchased = user.total_credits_purchased || 0;
          const newBalance = currentCredits + creditsToAdd;
          const newTotalPurchased = totalPurchased + creditsToAdd;

          console.log('\n🔄 UPDATING CREDITS...');
          console.log('Current balance:', currentCredits);
          console.log('Adding:', creditsToAdd);
          console.log('New balance:', newBalance);

          await base44.asServiceRole.entities.User.update(user.id, {
            letter_credits: newBalance,
            total_credits_purchased: newTotalPurchased
          });

          console.log('\n✅✅✅ CREDITS UPDATED ✅✅✅');
          console.log('User:', user.email);
          console.log('User ID:', user.id);
          console.log('Credits Added:', creditsToAdd);
          console.log('New Balance:', newBalance);

          await base44.asServiceRole.entities.Payment.create({
            type: 'addon',
            amount: parseFloat((session.amount_total / 100).toFixed(2)),
            currency: 'THB',
            provider: 'stripe',
            status: 'paid',
            external_id: session.id,
            created_by: user.email
          });

          // Email notification
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
                  <strong>ยอดคงเหลือใหม่:</strong> ${newBalance}<br/>
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
                  <strong>New Balance:</strong> ${newBalance}<br/>
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
                console.error('❌ Email failed:', resendData);
              }
            } catch (emailError) {
              console.error('❌ Email error:', emailError.message);
            }
          }

          if (user.line_messaging_token && user.line_notifications) {
            const lineMessage = lang === 'th'
              ? `🎉 เครดิตเพิ่มแล้ว!\n\nคุณซื้อ ${creditsToAdd} เครดิต\nยอดคงเหลือ: ${newBalance} เครดิต\n\nใช้สร้างจดหมายได้ทันที 📝`
              : `🎉 Credits Added!\n\nYou purchased ${creditsToAdd} credits\nNew Balance: ${newBalance} credits\n\nStart generating letters now 📝`;

            try {
              await fetch('https://api.line.me/v2/bot/message/push', {
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
              console.log('✅ LINE notification sent');
            } catch (lineError) {
              console.error('⚠️ LINE error:', lineError.message);
            }
          }

          console.log('\n✅ CREDITS PROCESSING COMPLETE\n');
          return Response.json({ 
            received: true, 
            processed: 'credits',
            user: user.email,
            credits: creditsToAdd
          }, { status: 200 });
        } else {
          console.warn('⚠️ No credits to add (metadata and price ID lookup both empty)');
        }
      }

      console.log('\n⚠️ checkout.session.completed but no recognized flow');
      return Response.json({ received: true }, { status: 200 });
    }

    // ========================================
    // INVOICE PAYMENT SUCCEEDED (RENEWALS)
    // ========================================
    else if (event.type === 'invoice.payment_succeeded') {
      console.log('\n🔄 PROCESSING: invoice.payment_succeeded');
      
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      const customerId = invoice.customer;
      const billingReason = invoice.billing_reason;

      console.log('Subscription ID:', subscriptionId);
      console.log('Billing reason:', billingReason);
      console.log('Amount paid:', invoice.amount_paid / 100);

      if (!subscriptionId || billingReason !== 'subscription_cycle') {
        console.log('⚠️ Not a renewal, skipping');
        return Response.json({ received: true, skipped: 'not_renewal' }, { status: 200 });
      }

      try {
        const base44 = createClientFromRequest(req);
        const users = await base44.asServiceRole.entities.User.list();
        
        let user = users.find(u => u.stripe_subscription_id === subscriptionId);
        if (!user) {
          user = users.find(u => u.stripe_customer_id === customerId);
        }

        if (!user) {
          console.error('❌ User not found for renewal:', subscriptionId);
          return Response.json({ received: true, error: 'user_not_found' }, { status: 200 });
        }

        console.log('✅ User found:', user.email);

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const renewalDate = new Date(subscription.current_period_end * 1000).toISOString();

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

        console.log('✅ Renewal recorded:', { user: user.email, renews: renewalDate });

        return Response.json({ received: true, processed: 'renewal' }, { status: 200 });
      } catch (err) {
        console.error('❌ Renewal error:', err.message);
        return Response.json({ received: true, error: err.message }, { status: 200 });
      }
    }

    // ========================================
    // INVOICE PAYMENT FAILED
    // ========================================
    else if (event.type === 'invoice.payment_failed') {
      console.log('\n❌ PROCESSING: invoice.payment_failed');
      
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      const customerId = invoice.customer;
      const attemptCount = invoice.attempt_count;

      console.log('Subscription:', subscriptionId);
      console.log('Attempt:', attemptCount);

      if (!subscriptionId) {
        console.log('⚠️ Not subscription-related, skipping');
        return Response.json({ received: true, skipped: 'not_subscription' }, { status: 200 });
      }

      try {
        const base44 = createClientFromRequest(req);
        const users = await base44.asServiceRole.entities.User.list();
        
        let user = users.find(u => u.stripe_subscription_id === subscriptionId);
        if (!user) {
          user = users.find(u => u.stripe_customer_id === customerId);
        }

        if (!user) {
          console.error('❌ User not found for failed payment');
          return Response.json({ received: true, error: 'user_not_found' }, { status: 200 });
        }

        await base44.asServiceRole.entities.User.update(user.id, {
          subscription_status: 'past_due'
        });

        console.log('⚠️ Marked past_due:', user.email);

        return Response.json({ received: true, processed: 'past_due' }, { status: 200 });
      } catch (err) {
        console.error('❌ Error:', err.message);
        return Response.json({ received: true, error: err.message }, { status: 200 });
      }
    }

    // ========================================
    // SUBSCRIPTION DELETED
    // ========================================
    else if (event.type === 'customer.subscription.deleted') {
      console.log('\n🚫 PROCESSING: customer.subscription.deleted');
      
      const subscription = event.data.object;
      const subscriptionId = subscription.id;
      const customerId = subscription.customer;

      console.log('Subscription ID:', subscriptionId);

      try {
        const base44 = createClientFromRequest(req);
        const users = await base44.asServiceRole.entities.User.list();
        
        let user = users.find(u => u.stripe_subscription_id === subscriptionId);
        if (!user) {
          user = users.find(u => u.stripe_customer_id === customerId);
        }

        if (!user) {
          console.error('❌ User not found for deleted subscription');
          return Response.json({ received: true, error: 'user_not_found' }, { status: 200 });
        }

        await base44.asServiceRole.entities.User.update(user.id, {
          plan_tier: 'free',
          subscription_status: 'expired',
          billing_interval: null,
          stripe_subscription_id: null
        });

        console.log('✅ Downgraded to free:', user.email);

        return Response.json({ received: true, processed: 'downgraded' }, { status: 200 });
      } catch (err) {
        console.error('❌ Error:', err.message);
        return Response.json({ received: true, error: err.message }, { status: 200 });
      }
    }

    // ========================================
    // UNHANDLED EVENTS
    // ========================================
    else {
      console.log('\nℹ️ UNHANDLED EVENT TYPE:', event.type);
      console.log('Event data:', JSON.stringify(event.data.object, null, 2));
      return Response.json({ received: true }, { status: 200 });
    }
    
  } catch (error) {
    console.error('\n❌❌❌ WEBHOOK ERROR ❌❌❌');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});