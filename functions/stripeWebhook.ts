import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripeSecretKey = Deno.env.get('SK_TEST_secret_key');
const webhookSecret = Deno.env.get('webhook_stripe');

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
});

const PRICE_CREDIT_MAP = {
  'PRICE_LIVE_LETTER_CREDIT_1': 1,
  'PRICE_LIVE_LETTER_CREDIT_3': 3,
  'PRICE_LIVE_LETTER_CREDIT_5': 5,
  'PRICE_LIVE_LETTER_CREDIT_10': 10,
};

Deno.serve(async (req) => {
  console.log('\n\n=== STRIPE WEBHOOK RECEIVED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('[WEBHOOK_ENTRY] Request received');
  
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
    console.log('[WEBHOOK_EVENT] Type:', event.type);
    console.log('[WEBHOOK_EVENT] Mode:', event.data.object.mode);
    console.log('[WEBHOOK_EVENT] Metadata:', JSON.stringify(event.data.object.metadata, null, 2));

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

        // Set member_since if this is first paid membership
        const memberSince = isFirstPaidMembership ? new Date().toISOString() : user.member_since;

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
          letter_credits: newCreditBalance,
          member_since: memberSince
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

        // ✅ BILLING NOTIFICATIONS FOR SUBSCRIPTION (LINE + EMAIL)
        const billingEnabled = user.notifications?.billing_payments ?? true;

        console.log('[SUBSCRIPTION_WEBHOOK] Billing notification check:', {
          email: user.email,
          lineLinked: !!user.line_messaging_token,
          lineNotificationsEnabled: user.line_notifications || false,
          billingPaymentsEnabled: billingEnabled
        });

        // LINE notification for subscription
        if (user.line_messaging_token && user.line_notifications && billingEnabled) {
          try {
            const planName = planTier.charAt(0).toUpperCase() + planTier.slice(1);
            const lineMessage = `✅ Lease Shield – Your plan has been updated!\n\n` +
              `📦 Plan: ${planName}\n` +
              `💳 Billing: ${billingInterval === 'annual' ? 'Annual' : 'Monthly'}\n` +
              `🎫 Letter credits: ${newCreditBalance}\n\n` +
              `Thank you for choosing Lease Shield!`;

            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: user.line_messaging_token,
              message: lineMessage
            });

            console.log('[SUBSCRIPTION_WEBHOOK] ✅ LINE notification sent');
          } catch (lineError) {
            console.error('[SUBSCRIPTION_WEBHOOK] ❌ LINE send failed:', lineError.message);
          }
        } else {
          console.log('[SUBSCRIPTION_WEBHOOK] ⏭️ LINE not sent:', {
            reason: !user.line_messaging_token ? 'no_line_connection'
              : !user.line_notifications ? 'line_disabled'
              : !billingEnabled ? 'billing_notifications_disabled'
              : 'unknown'
          });
        }

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
      // RESOLVE CASE PATH
      // ========================================
      if (metadata.type === 'resolve_case') {
        console.log('\n⚖️ RESOLVE CASE CHECKOUT - STARTING PROCESSING');
        console.log('[RESOLVE_WEBHOOK] event.type:', event.type);
        console.log('[RESOLVE_WEBHOOK] session.id:', session.id);
        console.log('[RESOLVE_WEBHOOK] session.metadata:', JSON.stringify(metadata, null, 2));
        console.log('[RESOLVE_WEBHOOK] session.customer:', session.customer);
        console.log('[RESOLVE_WEBHOOK] session.mode:', session.mode);

        const userId = metadata.userId;
        const userEmail = metadata.userEmail;
        const priceType = metadata.priceType;
        const amount = parseFloat(metadata.amount);
        const caseId = metadata.caseId;

        console.log('[RESOLVE_WEBHOOK] Parsed metadata:');
        console.log('  userId:', userId);
        console.log('  userEmail:', userEmail);
        console.log('  priceType:', priceType);
        console.log('  amount:', amount);
        console.log('  caseId:', caseId);

        // Find the provisional case
        console.log('[RESOLVE_WEBHOOK] Looking up case with caseId:', caseId);
        let caseRecord = null;
        if (caseId) {
          try {
            const allCases = await base44.asServiceRole.entities.Case.filter({ id: caseId });
            caseRecord = allCases[0];
            console.log('[RESOLVE_WEBHOOK] Case found BEFORE update:', caseRecord ? {
              id: caseRecord.id,
              status: caseRecord.status,
              user_email: caseRecord.user_email,
              stripe_session_id: caseRecord.stripe_session_id
            } : 'NULL');
          } catch (err) {
            console.error('[RESOLVE_WEBHOOK] ⚠️ Failed to find case:', err.message);
          }
        } else {
          console.log('[RESOLVE_WEBHOOK] ⚠️ No caseId in metadata');
        }

        // CRITICAL FIX: Update case PRESERVING user_email for RLS visibility
        if (caseRecord) {
          console.log('[RESOLVE_WEBHOOK] Updating case:', caseId);
          console.log('[RESOLVE_WEBHOOK] BEFORE update - verifying user binding:', {
            id: caseRecord.id,
            case_number: caseRecord.case_number,
            user_email: caseRecord.user_email,
            created_by: caseRecord.created_by,
            status: caseRecord.status,
            type: caseRecord.type,
            dispute_amount: caseRecord.dispute_amount,
            summary: caseRecord.summary?.substring(0, 50),
            property_address: caseRecord.property_address,
            landlord_name: caseRecord.landlord_name,
            landlord_email: caseRecord.landlord_email,
            evidence_count: caseRecord.evidence?.length || 0
          });
          
          // CRITICAL: Preserve user_email - do NOT overwrite, it's already correct from creation
          const updatedCase = await base44.asServiceRole.entities.Case.update(caseId, {
            status: 'intake', // Upgrade from awaiting_payment to intake
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent,
            pricing_type: priceType,
            resolve_amount: amount,
            paid_at: new Date().toISOString(),
            // DO NOT touch user_email or created_by - already set correctly
            timeline: [
              ...(caseRecord.timeline || []),
              {
                timestamp: new Date().toISOString(),
                event: 'Payment completed - case submitted for review',
                actor: caseRecord.user_email, // Use existing user_email
                meta: {
                  stripe_session_id: session.id,
                  amount: amount,
                  price_type: priceType
                }
              }
            ]
          });
          console.log('[RESOLVE_WEBHOOK] ✅ Case AFTER payment update:', {
            id: updatedCase.id,
            case_number: updatedCase.case_number,
            status: updatedCase.status,
            user_email: updatedCase.user_email,
            created_by: updatedCase.created_by,
            type: updatedCase.type,
            dispute_amount: updatedCase.dispute_amount,
            summary: updatedCase.summary?.substring(0, 50),
            property_address: updatedCase.property_address,
            landlord_name: updatedCase.landlord_name,
            landlord_email: updatedCase.landlord_email,
            evidence_count: updatedCase.evidence?.length || 0,
            stripe_session_id: updatedCase.stripe_session_id,
            paid_at: updatedCase.paid_at
          });
          
          // CRITICAL VERIFICATION: Confirm user_email is set for RLS
          if (!updatedCase.user_email) {
            console.error('[RESOLVE_WEBHOOK] 🚨 CRITICAL: Case has NO user_email - will be invisible to user!');
            console.error('[RESOLVE_WEBHOOK] Attempting emergency fix...');
            
            // Emergency fix: Set user_email from metadata
            if (userEmail) {
              await base44.asServiceRole.entities.Case.update(caseId, {
                user_email: userEmail
              });
              console.log('[RESOLVE_WEBHOOK] ✅ Emergency fix applied - user_email set to:', userEmail);
            }
          } else {
            console.log('[RESOLVE_WEBHOOK] ✅ User binding verified - user_email:', updatedCase.user_email);
          }
          
          caseRecord = updatedCase;
        } else {
          console.error('[RESOLVE_WEBHOOK] ❌ Case not found - cannot process payment without case');
          return Response.json({ 
            received: true, 
            error: 'case_not_found',
            caseId: caseId
          }, { status: 200 });
        }

        // Create payment record
        await base44.asServiceRole.entities.Payment.create({
          type: 'case',
          amount: parseFloat((session.amount_total / 100).toFixed(2)),
          currency: 'THB',
          provider: 'stripe',
          status: 'paid',
          external_id: session.id,
          created_by: userEmail
        });

        console.log('✅✅✅ RESOLVE CASE PAYMENT PROCESSED ✅✅✅');
        console.log('Case ID:', caseRecord.id);
        console.log('User:', userEmail);
        console.log('Amount:', amount);
        console.log('Price Type:', priceType);

        return Response.json({ 
          received: true, 
          processed: 'resolve_case',
          caseId: caseRecord.id,
          priceType: priceType
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

          // ✅ PAYMENT RECORD
          await base44.asServiceRole.entities.Payment.create({
            type: 'addon',
            amount: parseFloat((session.amount_total / 100).toFixed(2)),
            currency: 'THB',
            provider: 'stripe',
            status: 'paid',
            external_id: session.id,
            created_by: user.email
          });

          // ✅ BILLING NOTIFICATIONS (LINE + EMAIL)
          console.log('[LETTER_CREDIT_WEBHOOK] User billing notification check:', {
            email: user.email,
            userId: user.id,
            lineLinked: !!user.line_messaging_token,
            lineUserId: user.line_messaging_token || null,
            lineNotificationsEnabled: user.line_notifications || false,
            billingPaymentsEnabled: user.notifications?.billing_payments ?? true,
            creditsPurchased: creditsToAdd,
            newBalance: newBalance
          });

          const billingEnabled = user.notifications?.billing_payments ?? true;

          // LINE notification
          if (user.line_messaging_token && user.line_notifications && billingEnabled) {
            try {
              console.log('[LETTER_CREDIT_WEBHOOK] Sending LINE notification...');

              const lineMessage = `🎫 Lease Shield – Letter credits purchased!\n\n` +
                `✅ Credits purchased: +${creditsToAdd}\n` +
                `💳 New balance: ${newBalance} credits\n\n` +
                `You can now generate legal letters from the Templates page.`;

              await base44.asServiceRole.functions.invoke('sendLineMessage', {
                userId: user.line_messaging_token,
                message: lineMessage
              });

              console.log('[LETTER_CREDIT_WEBHOOK] ✅ LINE notification sent', {
                email: user.email,
                lineUserId: user.line_messaging_token
              });
            } catch (lineError) {
              console.error('[LETTER_CREDIT_WEBHOOK] ❌ LINE send failed:', {
                email: user.email,
                error: lineError.message,
                stack: lineError.stack
              });
            }
          } else {
            console.log('[LETTER_CREDIT_WEBHOOK] ⏭️ LINE not sent:', {
              email: user.email,
              lineLinked: !!user.line_messaging_token,
              lineNotificationsEnabled: user.line_notifications || false,
              billingPaymentsEnabled: billingEnabled,
              reason: !user.line_messaging_token ? 'no_line_connection' 
                : !user.line_notifications ? 'line_disabled'
                : !billingEnabled ? 'billing_notifications_disabled'
                : 'unknown'
            });
          }

          // Email notification
          if (user.email_notifications && billingEnabled && RESEND_API_KEY) {
            try {
              console.log('[LETTER_CREDIT_WEBHOOK] Sending email notification...');

              const emailSubject = '🎫 Letter Credits Purchased - Lease Shield';
              const emailBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0;">🎫 Letter Credits Purchased</h2>
                  </div>
                  <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
                    <p>Hi <strong>${user.full_name || 'there'}</strong>,</p>
                    <p>Your letter credits have been successfully added to your account!</p>
                    <div style="background: #F0FDF4; padding: 16px; border-radius: 8px; border-left: 4px solid #10B981; margin: 20px 0;">
                      <p style="margin: 8px 0;"><strong>Credits purchased:</strong> +${creditsToAdd}</p>
                      <p style="margin: 8px 0;"><strong>New balance:</strong> ${newBalance} credits</p>
                    </div>
                    <p>You can now generate legal letters to your landlord and juristic office from the Templates page.</p>
                    <p><a href="https://app.leaseshield.asia/templates" style="color: #0C3B2E; font-weight: bold;">Go to Templates →</a></p>
                    <p style="margin-top: 24px; color: #666; font-size: 12px;">— The Lease Shield Team</p>
                  </div>
                </div>
              `;

              const emailResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${RESEND_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'Lease Shield <no-reply@leaseshield.asia>',
                  to: [user.email],
                  subject: emailSubject,
                  html: emailBody,
                }),
              });

              if (emailResponse.ok) {
                console.log('[LETTER_CREDIT_WEBHOOK] ✅ Email notification sent');
              } else {
                const errorData = await emailResponse.json();
                console.error('[LETTER_CREDIT_WEBHOOK] ❌ Email send failed:', errorData);
              }
            } catch (emailError) {
              console.error('[LETTER_CREDIT_WEBHOOK] ❌ Email send failed:', {
                email: user.email,
                error: emailError.message
              });
            }
          } else {
            console.log('[LETTER_CREDIT_WEBHOOK] ⏭️ Email not sent:', {
              email: user.email,
              emailNotificationsEnabled: user.email_notifications || false,
              billingPaymentsEnabled: billingEnabled,
              resendConfigured: !!RESEND_API_KEY,
              reason: !user.email_notifications ? 'email_disabled'
                : !billingEnabled ? 'billing_notifications_disabled'
                : !RESEND_API_KEY ? 'resend_not_configured'
                : 'unknown'
            });
          }

          console.log('\n✅ CREDITS PATH COMPLETE');
          return Response.json({ 
            received: true, 
            processed: 'credits',
            user: user.email,
            credits: creditsToAdd,
            lineNotificationSent: !!(user.line_messaging_token && user.line_notifications)
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