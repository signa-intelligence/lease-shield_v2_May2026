import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripeSecretKey = Deno.env.get('SK_TEST_secret_key');
const webhookSecret = Deno.env.get('webhook_stripe');

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
      console.error('❌ webhook_stripe secret not configured');
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
      console.log('✅ WEBHOOK SIGNATURE VERIFIED');
      console.log('Event ID:', event.id);
      console.log('Event Type:', event.type);
      console.log('Event Created:', new Date(event.created * 1000).toISOString());
    } catch (err) {
      console.error('❌ SIGNATURE VERIFICATION FAILED:', err.message);
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
      
      console.log('Session ID:', session.id);
      console.log('Mode:', session.mode);
      console.log('Metadata:', JSON.stringify(metadata, null, 2));
      console.log('Customer:', session.customer);
      console.log('Client Reference ID:', session.client_reference_id);

      // Determine checkout type
      const isCreditsCheckout = 
        metadata.type === 'credits' || 
        metadata.credits || 
        session.mode === 'payment';
      
      const isSubscriptionCheckout = 
        metadata.type === 'subscription' || 
        session.mode === 'subscription';

      console.log('\n🎯 CHECKOUT TYPE:');
      console.log('Is Credits:', isCreditsCheckout);
      console.log('Is Subscription:', isSubscriptionCheckout);

      // ========================================
      // SUBSCRIPTION PATH
      // ========================================
      if (isSubscriptionCheckout) {
        console.log('\n💎 SUBSCRIPTION CHECKOUT - STARTING PROCESSING');

        // 1) Resolve user by metadata.userId first
        const userId = metadata.userId;
        const customerId = session.customer;
        
        console.log('🔍 Resolving user with:');
        console.log('  metadata.userId:', userId);
        console.log('  stripe_customer_id:', customerId);

        const allUsers = await base44.asServiceRole.entities.User.list();
        let user = null;

        // Priority 1: metadata.userId
        if (userId) {
          user = allUsers.find(u => u.id === userId);
          if (user) {
            console.log('✅ User found by metadata.userId:', user.email);
          }
        }

        // Priority 2: stripe_customer_id fallback
        if (!user && customerId) {
          user = allUsers.find(u => u.stripe_customer_id === customerId);
          if (user) {
            console.log('✅ User found by stripe_customer_id:', user.email);
          }
        }

        if (!user) {
          console.error('❌ SUBSCRIPTION FAILED - No matching user found');
          console.error('Tried userId:', userId, '| customerId:', customerId);
          return Response.json({ 
            received: true, 
            warning: 'user_not_found_for_subscription',
            userId,
            customerId
          }, { status: 200 });
        }

        console.log('✅ USER RESOLVED');
        console.log('  User ID:', user.id);
        console.log('  Email:', user.email);
        console.log('  Current plan_tier:', user.plan_tier);
        console.log('  Current member_since:', user.member_since || 'not set');

        // 2) Extract plan details from metadata
        const planTier = (metadata.plan || 'lite').toLowerCase();
        const billingInterval = (metadata.interval || 'monthly').toLowerCase();
        
        console.log('📋 PLAN DETAILS FROM METADATA:');
        console.log('  plan_tier:', planTier);
        console.log('  billing_interval:', billingInterval);
        
        // Determine if this is first paid membership or a plan change
        const isFirstPaidMembership = !user.member_since && (!user.plan_tier || user.plan_tier === 'free');
        console.log('🎯 Is first paid membership:', isFirstPaidMembership);

        if (!metadata.plan) {
          console.warn('⚠️ metadata.plan missing - defaulting to "lite"');
        }
        if (!metadata.interval) {
          console.warn('⚠️ metadata.interval missing - defaulting to "monthly"');
        }

        // 3) Get subscription renewal date
        const subscriptionId = session.subscription;
        let planRenewsAt = null;

        if (subscriptionId) {
          try {
            console.log('🔍 Fetching subscription:', subscriptionId);
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const periodEnd = subscription.current_period_end;
            
            if (periodEnd) {
              planRenewsAt = new Date(periodEnd * 1000).toISOString();
              console.log('✅ Renewal date:', planRenewsAt);
            } else {
              console.warn('⚠️ No current_period_end in subscription');
            }
          } catch (err) {
            console.error('⚠️ Failed to retrieve subscription:', err.message);
          }
        } else {
          console.warn('⚠️ No subscription ID in session');
        }

        // 4) Calculate included credits
        const includedCredits = {
          'lite': 3,
          'protect': 5,
          'secure': 10
        };
        const creditsToAdd = includedCredits[planTier] || 0;
        const currentCredits = user.letter_credits || 0;
        const newCreditBalance = currentCredits + creditsToAdd;

        console.log('💎 CREDITS:');
        console.log('  Included with tier:', creditsToAdd);
        console.log('  Current balance:', currentCredits);
        console.log('  New balance:', newCreditBalance);

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
        console.log('User ID:', user.id);
        console.log('Email:', user.email);
        console.log('plan_tier:', planTier);
        console.log('billing_interval:', billingInterval);
        console.log('plan_renews_at:', planRenewsAt);
        console.log('subscription_status: active');
        console.log('letter_credits:', newCreditBalance);
        console.log('member_since:', memberSince, isFirstPaidMembership ? '(SET NOW - FIRST MEMBERSHIP)' : '(PRESERVED - EXISTING MEMBERSHIP)');

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

        // 7) Send email notification (existing logic kept)
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
              console.log('✅ Email sent. Message ID:', resendData.id);
            } else {
              console.error('❌ Email failed:', resendData);
            }
          } catch (emailError) {
            console.error('❌ Email error:', emailError.message);
          }
        }

        console.log('\n✅ SUBSCRIPTION PATH COMPLETE');
        return Response.json({ 
          received: true, 
          processed: 'subscription',
          user: user.email,
          plan_tier: planTier,
          billing_interval: billingInterval
        }, { status: 200 });
      }

      // ========================================
      // CREDITS PATH
      // ========================================
      if (isCreditsCheckout && !isSubscriptionCheckout) {
        console.log('\n💰 CREDITS CHECKOUT - STARTING PROCESSING');

        const userId = metadata.userId;
        const customerId = session.customer;
        const email = session.customer_details?.email;
        
        const allUsers = await base44.asServiceRole.entities.User.list();
        let user = null;

        if (userId) {
          user = allUsers.find(u => u.id === userId);
          console.log('🔍 Lookup by metadata.userId:', userId, '→', user ? `✅ ${user.email}` : '❌');
        }

        if (!user && customerId) {
          user = allUsers.find(u => u.stripe_customer_id === customerId);
          console.log('🔍 Lookup by stripe_customer_id:', customerId, '→', user ? `✅ ${user.email}` : '❌');
        }

        if (!user && email) {
          user = allUsers.find(u => u.email === email);
          console.log('🔍 Lookup by email:', email, '→', user ? `✅ ${user.email}` : '❌');
        }

        if (!user) {
          console.error('❌ User not found for credits');
          return Response.json({ received: true, error: 'user_not_found' }, { status: 200 });
        }

        console.log('✅ USER RESOLVED:', user.email);

        let creditsToAdd = 0;

        if (metadata.credits) {
          creditsToAdd = parseInt(metadata.credits);
          console.log('💰 Credits from metadata:', creditsToAdd);
        } else {
          try {
            const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
              expand: ['line_items.data.price'],
            });

            const items = fullSession.line_items?.data || [];
            let totalCredits = 0;
            
            for (const item of items) {
              const priceId = item.price?.id;
              const qty = item.quantity || 1;
              const perCredits = PRICE_CREDIT_MAP[priceId] || 0;
              
              if (perCredits > 0) {
                totalCredits += perCredits * qty;
                console.log(`  Price ${priceId}: ${perCredits} × ${qty} = ${perCredits * qty}`);
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

          console.log('🔄 UPDATING CREDITS');
          console.log('  Current:', currentCredits);
          console.log('  Adding:', creditsToAdd);
          console.log('  New balance:', newBalance);

          await base44.asServiceRole.entities.User.update(user.id, {
            letter_credits: newBalance,
            total_credits_purchased: newTotalPurchased
          });

          console.log('\n✅✅✅ CREDITS UPDATED ✅✅✅');
          console.log('User ID:', user.id);
          console.log('Email:', user.email);
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

          console.log('\n✅ CREDITS PATH COMPLETE');
          return Response.json({ 
            received: true, 
            processed: 'credits',
            user: user.email,
            credits: creditsToAdd
          }, { status: 200 });
        }
      }

      console.log('⚠️ checkout.session.completed but no recognized flow');
      return Response.json({ received: true }, { status: 200 });
    }

    // ========================================
    // OTHER EVENT TYPES (kept as-is)
    // ========================================
    else if (event.type === 'invoice.payment_succeeded') {
      console.log('\n🔄 PROCESSING: invoice.payment_succeeded (renewal)');
      
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      const customerId = invoice.customer;
      const billingReason = invoice.billing_reason;

      if (!subscriptionId || billingReason !== 'subscription_cycle') {
        console.log('⚠️ Not a renewal, skipping');
        return Response.json({ received: true }, { status: 200 });
      }

      const users = await base44.asServiceRole.entities.User.list();
      let user = users.find(u => u.stripe_subscription_id === subscriptionId);
      if (!user) user = users.find(u => u.stripe_customer_id === customerId);

      if (!user) {
        console.error('❌ User not found for renewal');
        return Response.json({ received: true }, { status: 200 });
      }

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

      console.log('✅ Renewal recorded:', user.email);
      return Response.json({ received: true }, { status: 200 });
    }

    else if (event.type === 'invoice.payment_failed') {
      console.log('\n❌ PROCESSING: invoice.payment_failed');
      
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      const customerId = invoice.customer;

      if (!subscriptionId) {
        return Response.json({ received: true }, { status: 200 });
      }

      const users = await base44.asServiceRole.entities.User.list();
      let user = users.find(u => u.stripe_subscription_id === subscriptionId);
      if (!user) user = users.find(u => u.stripe_customer_id === customerId);

      if (user) {
        await base44.asServiceRole.entities.User.update(user.id, {
          subscription_status: 'past_due'
        });
        console.log('⚠️ Marked past_due:', user.email);
      }

      return Response.json({ received: true }, { status: 200 });
    }

    else if (event.type === 'customer.subscription.deleted') {
      console.log('\n🚫 PROCESSING: customer.subscription.deleted');
      
      const subscription = event.data.object;
      const subscriptionId = subscription.id;
      const customerId = subscription.customer;

      const users = await base44.asServiceRole.entities.User.list();
      let user = users.find(u => u.stripe_subscription_id === subscriptionId);
      if (!user) user = users.find(u => u.stripe_customer_id === customerId);

      if (user) {
        await base44.asServiceRole.entities.User.update(user.id, {
          plan_tier: 'free',
          subscription_status: 'expired',
          billing_interval: null,
          stripe_subscription_id: null
        });
        console.log('✅ Downgraded to free:', user.email);
      }

      return Response.json({ received: true }, { status: 200 });
    }

    else {
      console.log('ℹ️ UNHANDLED EVENT TYPE:', event.type);
      return Response.json({ received: true }, { status: 200 });
    }
    
  } catch (error) {
    console.error('\n❌ WEBHOOK ERROR:', error.message);
    console.error('Stack:', error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});