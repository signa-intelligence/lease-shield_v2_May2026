import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.10.0';
import { isEventProcessed, markEventProcessed } from './webhookIdempotency.js';
import { safeLog } from './authGuards.js';

/**
 * STRIPE WEBHOOK HANDLER - Production-hardened implementation
 * 
 * Live endpoint: https://app.leaseshield.asia/api/functions/stripeWebhook
 * 
 * Required Secrets:
 * - SK_TEST_secret_key: Stripe API key (contains LIVE sk_live_... key)
 * - webhook_stripe: Stripe webhook signing secret (whsec_...)
 * - RESEND_API_KEY: Email service (optional for notifications)
 */

const stripeSecretKey = Deno.env.get('SK_TEST_secret_key');
const webhookSecret = Deno.env.get('webhook_stripe');

// SECURITY FIX: Don't log secret values
if (!stripeSecretKey) {
  console.error('[WEBHOOK_FATAL] SK_TEST_secret_key not set');
}

if (!webhookSecret) {
  console.error('[WEBHOOK_FATAL] webhook_stripe not set');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
});

// Detect mode from secret key prefix
const isLiveMode = stripeSecretKey?.startsWith('sk_live_');
const webhookMode = isLiveMode ? 'LIVE' : 'TEST';

Deno.serve(async (req) => {
  const timestamp = new Date().toISOString();
  await safeLog('WEBHOOK_RECEIVED', { mode: webhookMode, timestamp });

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      console.error(`[WEBHOOK_ERROR] Invalid method: ${req.method}`);
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    // Read raw body and signature
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('[WEBHOOK_ERROR] No stripe-signature header');
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!webhookSecret) {
      console.error('[WEBHOOK_ERROR] webhook_stripe secret not configured');
      return Response.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // SECURITY FIX: Verify signature FIRST, before ANY business logic or auth
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
      await safeLog('WEBHOOK_SIGNATURE_VERIFIED', { eventType: event.type, eventId: event.id });
    } catch (err) {
      console.error('[WEBHOOK_ERROR] Signature verification failed');
      return Response.json({ 
        error: 'Invalid signature'
      }, { status: 400 });
    }

    // SECURITY FIX: Check idempotency - prevent duplicate processing
    if (isEventProcessed(event.id)) {
      await safeLog('WEBHOOK_DUPLICATE', { eventId: event.id, eventType: event.type });
      return Response.json({ 
        received: true, 
        ignored: true,
        reason: 'duplicate_event' 
      }, { status: 200 });
    }

    // Mark as processed immediately
    markEventProcessed(event.id);

    // NOW create Base44 client (after security checks)
    const base44 = createClientFromRequest(req);
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    // ========================================
    // HANDLE: checkout.session.completed
    // ========================================
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const metadata = session.metadata || {};

      console.log('[WEBHOOK] checkout.session.completed');
      console.log('[WEBHOOK] Session ID:', session.id);
      console.log('[WEBHOOK] Metadata type:', metadata.type);

      // ========================================
      // SUBSCRIPTION FLOW - Handle plan activation & referral
      // ========================================
      if (metadata.type === 'subscription') {
        console.log('[SUBSCRIPTION_WEBHOOK] 📋 New subscription detected');

        const userId = metadata.userId;
        const planTier = metadata.plan || 'lite';
        const billingInterval = metadata.interval || 'monthly';

        // SECURITY FIX: Redact PII from logs
        await safeLog('SUBSCRIPTION_WEBHOOK', { userId, planTier, billingInterval });

        // Fetch all users for later referral lookup
        let allUsers = [];
        let subscribedUser;
        try {
          allUsers = await base44.asServiceRole.entities.User.list();
          subscribedUser = allUsers.find(u => u.id === userId || u.email === email);

          if (!subscribedUser) {
            await safeLog('SUBSCRIPTION_WEBHOOK_USER_NOT_FOUND', { userId });
            return Response.json({ received: true, error: 'user_not_found' }, { status: 200 });
          }

          await safeLog('SUBSCRIPTION_WEBHOOK_USER_FOUND', { userId });
        } catch (fetchError) {
          console.error('[SUBSCRIPTION_WEBHOOK] ❌ Failed to fetch user:', fetchError.message);
          return Response.json({ received: true, error: 'user_fetch_failed' }, { status: 200 });
        }

        // Update user plan
        const now = new Date().toISOString();
        const isFirstPaidPlan = !subscribedUser.member_since;

        await base44.asServiceRole.entities.User.update(subscribedUser.id, {
          plan_tier: planTier,
          billing_interval: billingInterval,
          subscription_status: 'active',
          subscription_started_at: now,
          member_since: subscribedUser.member_since || now,
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer
        });

        await safeLog('SUBSCRIPTION_UPDATED', { userId, planTier });

        // ========================================
        // REFERRAL CREDIT LOGIC - First paid subscription only
        // ========================================
        if (isFirstPaidPlan && subscribedUser.referred_by) {
          console.log('[REFERRAL_CREDIT] 🎁 User was referred, processing credit...');

          try {
            // Find referrer
            const referrer = allUsers.find(u => u.id === subscribedUser.referred_by);

            if (!referrer) {
              console.error('[REFERRAL_CREDIT] ❌ Referrer not found:', subscribedUser.referred_by);
            } else {
              console.log('[REFERRAL_CREDIT] Referrer found:', referrer.email);
              console.log('[REFERRAL_CREDIT] Referrer plan:', referrer.plan_tier);
              console.log('[REFERRAL_CREDIT] Friend plan:', planTier);

              // Calculate credit (friend's plan value)
              const planPrices = {
                lite: 190,
                protect: 390,
                secure: 990
              };

              const referrerMonthlyPrice = planPrices[referrer.plan_tier] || 0;
              const friendMonthlyPrice = planPrices[planTier] || 0;

              const creditTHB = friendMonthlyPrice; // Award friend's plan value

              console.log('[REFERRAL_CREDIT] Referrer monthly price:', referrerMonthlyPrice);
              console.log('[REFERRAL_CREDIT] Friend monthly price:', friendMonthlyPrice);
              console.log('[REFERRAL_CREDIT] Credit to award:', creditTHB);

              if (creditTHB > 0) {
                // Update referrer credits
                const newReferralBalance = (referrer.referral_credits_thb || 0) + creditTHB;
                const newTotalEarned = (referrer.referral_credits_total_thb || 0) + creditTHB;
                const newReferralCount = (referrer.referral_count || 0) + 1;

                await base44.asServiceRole.entities.User.update(referrer.id, {
                  referral_credits_thb: newReferralBalance,
                  referral_credits_total_thb: newTotalEarned,
                  referral_count: newReferralCount
                });

                console.log('[REFERRAL_CREDIT] ✅ Referrer updated:', referrer.email);
                console.log('[REFERRAL_CREDIT] New balance:', newReferralBalance);
                console.log('[REFERRAL_CREDIT] Total earned:', newTotalEarned);
                console.log('[REFERRAL_CREDIT] Referral count:', newReferralCount);

                // Apply Stripe customer balance (negative = credit)
                const creditInSmallestUnit = creditTHB * 100; // THB to satang

                try {
                  await stripe.customers.update(referrer.stripe_customer_id, {
                    balance: -creditInSmallestUnit, // Negative = credit
                    metadata: {
                      last_referral_credit: creditTHB.toString(),
                      last_referral_date: now
                    }
                  });

                  console.log('[REFERRAL_CREDIT] ✅ Stripe customer balance updated');
                  console.log('[REFERRAL_CREDIT] Credit applied:', -creditInSmallestUnit, 'satang');
                } catch (stripeError) {
                  console.error('[REFERRAL_CREDIT] ⚠️ Stripe balance update failed:', stripeError.message);
                }

                // Update referral record with Stripe IDs for refund tracking
                const referralRecords = await base44.asServiceRole.entities.Referral.filter({
                  referrer_user_id: referrer.id,
                  referred_user_id: subscribedUser.id
                });

                if (referralRecords.length > 0) {
                  const referral = referralRecords[0];
                  
                  // FRAUD CHECK - Don't issue credit if flagged for review
                  if (referral.flagged_for_review && !referral.reviewed_by_admin) {
                    console.log('[CREDIT_BLOCKED_PENDING_REVIEW]', {
                      referralId: referral.id,
                      referrerEmail: referrer.email,
                      riskScore: referral.fraud_risk_score
                    });
                    
                    await base44.asServiceRole.entities.Referral.update(referral.id, {
                      status: 'pending_review',
                      stripe_subscription_id: session.subscription,
                      stripe_customer_id: session.customer,
                      months_paid: billingInterval === 'annual' ? 12 : 1,
                      last_payment_date: now
                    });
                    
                    // Send alert to admin
                    try {
                      await base44.asServiceRole.functions.invoke('notifyAdminFraudAlert', {
                        referralId: referral.id,
                        referrerEmail: referrer.email,
                        riskScore: referral.fraud_risk_score || 0,
                        patterns: referral.fraud_patterns || '[]'
                      });
                    } catch (alertErr) {
                      console.error('[FRAUD_ALERT] Failed:', alertErr.message);
                    }
                    
                    console.log('[REFERRAL_CREDIT] ⚠️ Credit held pending manual review');
                    return; // Don't issue credit yet
                  }
                  
                  // Normal flow - update referral
                  await base44.asServiceRole.entities.Referral.update(referral.id, {
                    status: billingInterval === 'annual' ? 'pending_refund_window' : 'converted',
                    credit_thb: creditTHB,
                    referrer_plan_at_conversion: referrer.plan_tier,
                    referred_plan: planTier,
                    converted_at: now,
                    stripe_subscription_id: session.subscription,
                    stripe_customer_id: session.customer,
                    months_paid: billingInterval === 'annual' ? 12 : 1,
                    last_payment_date: now
                  });

                  console.log('[REFERRAL_CREDIT] ✅ Referral record updated to', billingInterval === 'annual' ? 'pending_refund_window' : 'converted');
                }

                // Notify referrer (non-blocking)
                if (referrer.email_notifications && RESEND_API_KEY) {
                  const referrerLang = referrer.language || 'en';
                  const emailSubject = referrerLang === 'th' 
                    ? '🎉 คุณได้รับเครดิตการแนะนำ!' 
                    : '🎉 You Earned a Referral Credit!';

                  const emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
                        <h2 style="color: white; margin: 0;">🎉 Referral Credit Earned!</h2>
                      </div>
                      <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
                        <p>Hi <strong>${referrer.full_name || 'there'}</strong>,</p>
                        <p>Great news! Your friend just subscribed to Lease Shield.</p>
                        <div style="background: #FFFBEB; padding: 16px; border-radius: 8px; border-left: 4px solid #C7A338; margin: 20px 0;">
                          <p style="margin: 8px 0;"><strong>Credit earned:</strong> ฿${creditTHB}</p>
                          <p style="margin: 8px 0;"><strong>New balance:</strong> ฿${newReferralBalance}</p>
                          <p style="margin: 8px 0;"><strong>Total earned:</strong> ฿${newTotalEarned}</p>
                        </div>
                        <p>This credit will automatically reduce your next invoice(s). Keep sharing to earn more!</p>
                        <p><a href="https://app.leaseshield.asia/account" style="color: #0C3B2E; font-weight: bold;">View Your Referrals →</a></p>
                        <p style="margin-top: 24px; color: #666; font-size: 12px;">— The Lease Shield Team</p>
                      </div>
                    </div>
                  `;

                  fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${RESEND_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      from: 'Lease Shield <no-reply@leaseshield.asia>',
                      to: [referrer.email],
                      subject: emailSubject,
                      html: emailBody,
                    }),
                  }).catch((err) => console.error('[REFERRAL_CREDIT] ⚠️ Email failed:', err));
                }
              } else {
                console.log('[REFERRAL_CREDIT] ⚠️ No credit awarded (referrer on free or friend on free)');
              }
            }
          } catch (referralError) {
            console.error('[REFERRAL_CREDIT] ⚠️ Referral processing failed (non-critical):', referralError.message);
          }
        }

        console.log('[SUBSCRIPTION_WEBHOOK] ✅ Subscription processing complete');
        return Response.json({ 
          received: true,
          processed: 'subscription'
        }, { status: 200 });
      }

      // ========================================
      // ONE-TIME LEASE SCAN PURCHASE
      // ========================================
      if (metadata.type === 'one_time_scan') {
        console.log('[ONE_TIME_SCAN_WEBHOOK] 📄 One-time scan purchase detected');

        const userId = metadata.userId;
        const email = metadata.email;

        console.log('[ONE_TIME_SCAN_WEBHOOK] User:', email, `(${userId})`);

        if (!userId) {
          console.error('[ONE_TIME_SCAN_WEBHOOK] ❌ Missing userId');
          return Response.json({ received: true, error: 'missing_user_id' }, { status: 200 });
        }

        // Fetch user
        let user;
        try {
          const allUsers = await base44.asServiceRole.entities.User.list();
          user = allUsers.find(u => u.id === userId || u.email === email);

          if (!user) {
            console.error('[ONE_TIME_SCAN_WEBHOOK] ❌ User not found');
            return Response.json({ received: true, error: 'user_not_found' }, { status: 200 });
          }

          console.log('[ONE_TIME_SCAN_WEBHOOK] User found:', user.email);
        } catch (fetchError) {
          console.error('[ONE_TIME_SCAN_WEBHOOK] ❌ Failed to fetch user:', fetchError.message);
          return Response.json({ received: true, error: 'user_fetch_failed' }, { status: 200 });
        }

        // Grant one-time scan entitlement
        const currentScans = user.one_time_scan_credits || 0;
        const newScans = currentScans + 1;

        try {
          await base44.asServiceRole.entities.User.update(user.id, {
            one_time_scan_credits: newScans
          });

          console.log('[ONE_TIME_SCAN_WEBHOOK] ✅ One-time scan credit granted');
          console.log('[ONE_TIME_SCAN_WEBHOOK] New balance:', newScans);
        } catch (updateError) {
          console.error('[ONE_TIME_SCAN_WEBHOOK] ❌ Failed to update credits:', updateError.message);
          return Response.json({ received: true, error: 'credit_update_failed' }, { status: 200 });
        }

        // Create Payment record
        try {
          await base44.asServiceRole.entities.Payment.create({
            type: 'addon',
            amount: parseFloat((session.amount_total / 100).toFixed(2)),
            currency: session.currency?.toUpperCase() || 'THB',
            provider: 'stripe',
            status: 'paid',
            external_id: session.id,
            created_by: user.email
          });

          console.log('[ONE_TIME_SCAN_WEBHOOK] ✅ Payment record created');
        } catch (paymentError) {
          console.error('[ONE_TIME_SCAN_WEBHOOK] ⚠️ Payment record failed (non-critical):', paymentError.message);
        }

        console.log('[ONE_TIME_SCAN_WEBHOOK] ✅ Processing complete');
        return Response.json({ 
          received: true, 
          processed: 'one_time_scan'
        }, { status: 200 });
      }

      // ========================================
      // CREDITS PURCHASE FLOW
      // ========================================
      if (metadata.type === 'credits') {
        console.log('[CREDITS_WEBHOOK] 💰 Credit purchase detected');

        const userId = metadata.userId;
        const email = metadata.email;
        const creditsToAdd = Number(metadata.credits || '0');

        console.log('[CREDITS_WEBHOOK] User:', email, `(${userId})`);
        console.log('[CREDITS_WEBHOOK] creditsToAdd =', creditsToAdd);

        // Defensive checks
        if (!userId) {
          console.error('[CREDITS_WEBHOOK] ❌ Missing userId in metadata');
          return Response.json({ received: true, error: 'missing_user_id' }, { status: 200 });
        }

        if (creditsToAdd <= 0) {
          console.error('[CREDITS_WEBHOOK] ❌ Invalid credits amount:', creditsToAdd);
          return Response.json({ received: true, error: 'invalid_credits' }, { status: 200 });
        }

        // Fetch user
        let user;
        try {
          const allUsers = await base44.asServiceRole.entities.User.list();
          user = allUsers.find(u => u.id === userId || u.email === email);

          if (!user) {
            console.error('[CREDITS_WEBHOOK] ❌ User not found:', userId);
            return Response.json({ received: true, error: 'user_not_found' }, { status: 200 });
          }

          console.log('[CREDITS_WEBHOOK] User found:', user.email);
          console.log('[CREDITS_WEBHOOK] Current credits:', user.letter_credits || 0);
        } catch (fetchError) {
          console.error('[CREDITS_WEBHOOK] ❌ Failed to fetch user:', fetchError.message);
          return Response.json({ received: true, error: 'user_fetch_failed' }, { status: 200 });
        }

        // Update user credits
        const currentCredits = user.letter_credits || 0;
        const newBalance = currentCredits + creditsToAdd;
        const totalPurchased = (user.total_credits_purchased || 0) + creditsToAdd;

        try {
          await base44.asServiceRole.entities.User.update(user.id, {
            letter_credits: newBalance,
            total_credits_purchased: totalPurchased
          });

          console.log('[CREDITS_WEBHOOK] ✅✅✅ USER CREDITS UPDATED IN DB ✅✅✅');
          console.log('[CREDITS_WEBHOOK] Previous balance:', currentCredits);
          console.log('[CREDITS_WEBHOOK] Credits added:', creditsToAdd);
          console.log('[CREDITS_WEBHOOK] New balance:', newBalance);
          console.log('[CREDITS_WEBHOOK] Total purchased (lifetime):', totalPurchased);
        } catch (updateError) {
          console.error('[CREDITS_WEBHOOK] ❌ Failed to update user credits:', updateError.message);
          return Response.json({ received: true, error: 'credit_update_failed' }, { status: 200 });
        }

        // Create Payment record
        try {
          await base44.asServiceRole.entities.Payment.create({
            type: 'addon',
            amount: parseFloat((session.amount_total / 100).toFixed(2)),
            currency: session.currency?.toUpperCase() || 'THB',
            provider: 'stripe',
            status: 'paid',
            external_id: session.id,
            created_by: user.email
          });

          console.log('[CREDITS_WEBHOOK] ✅ Payment record created for credit purchase');
        } catch (paymentError) {
          console.error('[CREDITS_WEBHOOK] ⚠️ Failed to create Payment record (non-critical):', paymentError.message);
        }

        // Non-blocking notifications
        const billingEnabled = user.notifications?.billing_payments ?? true;

        // LINE notification (non-blocking)
        if (user.line_messaging_token && user.line_notifications && billingEnabled) {
          try {
            const lineMessage = `🎫 Lease Shield – Letter credits purchased!\n\n` +
              `✅ Credits purchased: +${creditsToAdd}\n` +
              `💳 New balance: ${newBalance} credits\n\n` +
              `You can now generate legal letters from the Templates page.`;

            base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: user.line_messaging_token,
              message: lineMessage
            }).catch((lineError) => {
              console.error('[CREDITS_WEBHOOK] ⚠️ LINE notification failed (non-critical):', lineError.message);
            });

            console.log('[CREDITS_WEBHOOK] LINE notification queued');
          } catch (lineError) {
            console.error('[CREDITS_WEBHOOK] ⚠️ LINE setup error (non-critical):', lineError.message);
          }
        }

        // Email notification (non-blocking)
        if (user.email_notifications && billingEnabled && RESEND_API_KEY) {
          try {
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
                  <p>You can now generate legal letters from the Templates page.</p>
                  <p><a href="https://app.leaseshield.asia/templates" style="color: #0C3B2E; font-weight: bold;">Go to Templates →</a></p>
                  <p style="margin-top: 24px; color: #666; font-size: 12px;">— The Lease Shield Team</p>
                </div>
              </div>
            `;

            fetch('https://api.resend.com/emails', {
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
            }).catch((emailError) => {
              console.error('[CREDITS_WEBHOOK] ⚠️ Email failed (non-critical):', emailError.message);
            });

            console.log('[CREDITS_WEBHOOK] Email notification queued');
          } catch (emailError) {
            console.error('[CREDITS_WEBHOOK] ⚠️ Email setup error (non-critical):', emailError.message);
          }
        }

        console.log('[CREDITS_WEBHOOK] ✅ Credit purchase processing complete');
        return Response.json({ 
          received: true, 
          processed: 'credits',
          creditsAdded: creditsToAdd,
          newBalance: newBalance
        }, { status: 200 });
      }

      // Non-credit checkout - ignore
      console.log('[WEBHOOK] Non-credit checkout, skipping');
      return Response.json({ received: true }, { status: 200 });
    }

    // ========================================
    // HANDLE: charge.refunded - Reverse referral credits
    // ========================================
    if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      const customerId = charge.customer;

      console.log('[REFUND_WEBHOOK] 💳 Refund detected for customer:', customerId);

      try {
        // Find converted referrals linked to this customer
        const referrals = await base44.asServiceRole.entities.Referral.filter({
          stripe_customer_id: customerId,
          status: { $in: ['converted', 'pending_refund_window'] }
        });

        console.log('[REFUND_WEBHOOK] Found', referrals.length, 'referrals to reverse');

        for (const referral of referrals) {
          const creditToReverse = referral.credit_thb || 0;

          if (creditToReverse > 0) {
            // Reverse credit from referrer
            const referrer = await base44.asServiceRole.entities.User.get(referral.referrer_user_id);
            
            if (referrer) {
              await base44.asServiceRole.entities.User.update(referrer.id, {
                referral_credits_thb: Math.max(0, (referrer.referral_credits_thb || 0) - creditToReverse),
                referral_count: Math.max(0, (referrer.referral_count || 0) - 1)
              });

              console.log('[REFUND_WEBHOOK] ✅ Credit reversed from referrer:', referrer.email);
              console.log('[REFUND_WEBHOOK] Amount reversed:', creditToReverse);

              // Reverse Stripe customer balance if applicable
              if (referrer.stripe_customer_id) {
                try {
                  const customer = await stripe.customers.retrieve(referrer.stripe_customer_id);
                  const currentBalance = customer.balance || 0;
                  const creditInSatang = creditToReverse * 100;

                  await stripe.customers.update(referrer.stripe_customer_id, {
                    balance: currentBalance + creditInSatang // Add back (remove negative credit)
                  });

                  console.log('[REFUND_WEBHOOK] ✅ Stripe balance reversed');
                } catch (stripeErr) {
                  console.error('[REFUND_WEBHOOK] ⚠️ Stripe balance reversal failed:', stripeErr.message);
                }
              }
            }

            // Update referral status
            await base44.asServiceRole.entities.Referral.update(referral.id, {
              status: 'refunded',
              refunded_at: new Date().toISOString(),
              credit_thb: 0
            });

            console.log('[REFUND_WEBHOOK] ✅ Referral marked as refunded');
          }
        }

        return Response.json({ 
          received: true, 
          processed: 'refund',
          referrals_reversed: referrals.length
        }, { status: 200 });

      } catch (refundError) {
        console.error('[REFUND_WEBHOOK] ❌ Error processing refund:', refundError.message);
        return Response.json({ received: true, error: 'refund_processing_failed' }, { status: 200 });
      }
    }

    // ========================================
    // HANDLE: charge.dispute.created - Chargeback detection
    // ========================================
    if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object;
      const chargeId = dispute.charge;
      
      console.log('[CHARGEBACK_WEBHOOK] ⚠️ Chargeback dispute created');

      try {
        // Retrieve charge to get customer ID
        const charge = await stripe.charges.retrieve(chargeId);
        const customerId = charge.customer;

        console.log('[CHARGEBACK_WEBHOOK] Customer:', customerId);

        // Find converted referrals
        const referrals = await base44.asServiceRole.entities.Referral.filter({
          stripe_customer_id: customerId,
          status: { $in: ['converted', 'pending_refund_window'] }
        });

        console.log('[CHARGEBACK_WEBHOOK] Found', referrals.length, 'referrals to reverse');

        for (const referral of referrals) {
          const creditToReverse = referral.credit_thb || 0;

          if (creditToReverse > 0) {
            // Reverse credit from referrer
            const referrer = await base44.asServiceRole.entities.User.get(referral.referrer_user_id);
            
            if (referrer) {
              await base44.asServiceRole.entities.User.update(referrer.id, {
                referral_credits_thb: Math.max(0, (referrer.referral_credits_thb || 0) - creditToReverse),
                referral_count: Math.max(0, (referrer.referral_count || 0) - 1)
              });

              console.log('[CHARGEBACK_WEBHOOK] ✅ Credit reversed from referrer:', referrer.email);
              console.log('[CHARGEBACK_WEBHOOK] Amount reversed:', creditToReverse);

              // Reverse Stripe customer balance
              if (referrer.stripe_customer_id) {
                try {
                  const customer = await stripe.customers.retrieve(referrer.stripe_customer_id);
                  const currentBalance = customer.balance || 0;
                  const creditInSatang = creditToReverse * 100;

                  await stripe.customers.update(referrer.stripe_customer_id, {
                    balance: currentBalance + creditInSatang
                  });

                  console.log('[CHARGEBACK_WEBHOOK] ✅ Stripe balance reversed');
                } catch (stripeErr) {
                  console.error('[CHARGEBACK_WEBHOOK] ⚠️ Stripe balance reversal failed:', stripeErr.message);
                }
              }

              // Send notification to referrer
              if (RESEND_API_KEY && referrer.email_notifications) {
                const emailBody = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(to right, #DC2626, #EF4444); padding: 20px; border-radius: 8px 8px 0 0;">
                      <h2 style="color: white; margin: 0;">⚠️ Referral Credit Reversed</h2>
                    </div>
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
                      <p>Hi <strong>${referrer.full_name || 'there'}</strong>,</p>
                      <p>A payment dispute was detected for one of your referrals.</p>
                      <div style="background: #FEE2E2; padding: 16px; border-radius: 8px; border-left: 4px solid #DC2626; margin: 20px 0;">
                        <p style="margin: 8px 0;"><strong>Credit reversed:</strong> ฿${creditToReverse}</p>
                        <p style="margin: 8px 0;"><strong>Current balance:</strong> ฿${Math.max(0, (referrer.referral_credits_thb || 0) - creditToReverse)}</p>
                      </div>
                      <p>This occurred due to a payment chargeback. If you have questions, please contact support.</p>
                      <p style="margin-top: 24px; color: #666; font-size: 12px;">— The Lease Shield Team</p>
                    </div>
                  </div>
                `;

                fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    from: 'Lease Shield <no-reply@leaseshield.asia>',
                    to: [referrer.email],
                    subject: '⚠️ Referral Credit Reversed - Lease Shield',
                    html: emailBody,
                  }),
                }).catch((err) => console.error('[CHARGEBACK_WEBHOOK] Email failed:', err));
              }
            }

            // Update referral status
            await base44.asServiceRole.entities.Referral.update(referral.id, {
              status: 'chargeback',
              chargeback_at: new Date().toISOString(),
              credit_thb: 0
            });

            console.log('[CHARGEBACK_WEBHOOK] ✅ Referral marked as chargeback');
          }
        }

        return Response.json({ 
          received: true, 
          processed: 'chargeback',
          referrals_reversed: referrals.length
        }, { status: 200 });

      } catch (chargebackError) {
        console.error('[CHARGEBACK_WEBHOOK] ❌ Error processing chargeback:', chargebackError.message);
        return Response.json({ received: true, error: 'chargeback_processing_failed' }, { status: 200 });
      }
    }

    // ========================================
    // HANDLE: customer.subscription.deleted - Early cancellation
    // ========================================
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      console.log('[CANCELLATION_WEBHOOK] 🚫 Subscription cancelled for customer:', customerId);

      try {
        // Find pending referrals (not yet converted - less than 3 months)
        const referrals = await base44.asServiceRole.entities.Referral.filter({
          stripe_customer_id: customerId,
          status: 'pending_first_payment'
        });

        console.log('[CANCELLATION_WEBHOOK] Found', referrals.length, 'pending referrals');

        for (const referral of referrals) {
          await base44.asServiceRole.entities.Referral.update(referral.id, {
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          });

          console.log('[CANCELLATION_WEBHOOK] ✅ Referral cancelled:', referral.id);
        }

        return Response.json({ 
          received: true, 
          processed: 'cancellation',
          referrals_cancelled: referrals.length
        }, { status: 200 });

      } catch (cancellationError) {
        console.error('[CANCELLATION_WEBHOOK] ❌ Error processing cancellation:', cancellationError.message);
        return Response.json({ received: true, error: 'cancellation_processing_failed' }, { status: 200 });
      }
    }

    // ========================================
    // HANDLE: invoice.payment_succeeded - Track monthly payments for 3-month rule
    // ========================================
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const subscriptionId = invoice.subscription;

      // Only process subscription invoices (not one-time payments)
      if (!subscriptionId) {
        return Response.json({ received: true, ignored: true }, { status: 200 });
      }

      console.log('[PAYMENT_WEBHOOK] 💰 Subscription payment succeeded');
      console.log('[PAYMENT_WEBHOOK] Customer:', customerId);
      console.log('[PAYMENT_WEBHOOK] Subscription:', subscriptionId);

      try {
        // Find pending referrals for this subscription
        const referrals = await base44.asServiceRole.entities.Referral.filter({
          stripe_subscription_id: subscriptionId,
          status: 'pending_first_payment'
        });

        console.log('[PAYMENT_WEBHOOK] Found', referrals.length, 'pending referrals');

        for (const referral of referrals) {
          const monthsPaid = (referral.months_paid || 0) + 1;
          const now = new Date().toISOString();

          console.log('[PAYMENT_WEBHOOK] Months paid:', monthsPaid, '/ 3');

          if (monthsPaid >= 3) {
            // Qualified! But check fraud flag first
            
            // FRAUD CHECK - Don't issue credit if flagged
            if (referral.flagged_for_review && !referral.reviewed_by_admin) {
              console.log('[CREDIT_BLOCKED_3MONTH] Flagged for review:', referral.id);
              
              await base44.asServiceRole.entities.Referral.update(referral.id, {
                status: 'pending_review',
                months_paid: monthsPaid,
                last_payment_date: now
              });
              
              // Alert admin
              try {
                await base44.asServiceRole.functions.invoke('notifyAdminFraudAlert', {
                  referralId: referral.id,
                  referrerEmail: referral.referrer_email,
                  riskScore: referral.fraud_risk_score || 0,
                  patterns: referral.fraud_patterns || '[]'
                });
              } catch (alertErr) {
                console.error('[FRAUD_ALERT] Failed:', alertErr.message);
              }
              
              continue; // Don't issue credit
            }
            
            // Award credit to referrer
            const creditTHB = referral.credit_thb || 0;
            
            if (creditTHB > 0) {
              const referrer = await base44.asServiceRole.entities.User.get(referral.referrer_user_id);
              
              if (referrer) {
                await base44.asServiceRole.entities.User.update(referrer.id, {
                  referral_credits_thb: (referrer.referral_credits_thb || 0) + creditTHB,
                  referral_credits_total_thb: (referrer.referral_credits_total_thb || 0) + creditTHB,
                  referral_count: (referrer.referral_count || 0) + 1
                });

                // Apply Stripe balance credit
                if (referrer.stripe_customer_id) {
                  try {
                    const creditInSatang = creditTHB * 100;
                    await stripe.customers.update(referrer.stripe_customer_id, {
                      balance: -creditInSatang, // Negative = credit
                      metadata: {
                        last_referral_credit: creditTHB.toString(),
                        last_referral_date: now
                      }
                    });

                    console.log('[PAYMENT_WEBHOOK] ✅ Stripe credit applied');
                  } catch (stripeErr) {
                    console.error('[PAYMENT_WEBHOOK] ⚠️ Stripe balance update failed:', stripeErr.message);
                  }
                }

                console.log('[PAYMENT_WEBHOOK] ✅ 3-month qualification met - credit awarded');

                // Send referrer notification
                if (RESEND_API_KEY && referrer.email_notifications) {
                  const emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
                        <h2 style="color: white; margin: 0;">🎉 Referral Credit Earned!</h2>
                      </div>
                      <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
                        <p>Hi <strong>${referrer.full_name || 'there'}</strong>,</p>
                        <p>Your friend completed 3 months of active subscription!</p>
                        <div style="background: #FFFBEB; padding: 16px; border-radius: 8px; border-left: 4px solid #C7A338; margin: 20px 0;">
                          <p style="margin: 8px 0;"><strong>Credit earned:</strong> ฿${creditTHB}</p>
                          <p style="margin: 8px 0;"><strong>New balance:</strong> ฿${(referrer.referral_credits_thb || 0) + creditTHB}</p>
                        </div>
                        <p>This credit will automatically reduce your next invoice(s).</p>
                        <p><a href="https://app.leaseshield.asia/account#referral" style="color: #0C3B2E; font-weight: bold;">View Your Referrals →</a></p>
                        <p style="margin-top: 24px; color: #666; font-size: 12px;">— The Lease Shield Team</p>
                      </div>
                    </div>
                  `;

                  fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${RESEND_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      from: 'Lease Shield <no-reply@leaseshield.asia>',
                      to: [referrer.email],
                      subject: '🎉 You Earned a Referral Credit!',
                      html: emailBody,
                    }),
                  }).catch((err) => console.error('[PAYMENT_WEBHOOK] Email failed:', err));
                }
              }
            }

            // Update referral to converted
            await base44.asServiceRole.entities.Referral.update(referral.id, {
              status: 'converted',
              converted_at: now,
              months_paid: monthsPaid,
              last_payment_date: now
            });

          } else {
            // Not yet qualified - just increment counter
            await base44.asServiceRole.entities.Referral.update(referral.id, {
              months_paid: monthsPaid,
              last_payment_date: now
            });

            console.log('[PAYMENT_WEBHOOK] Month', monthsPaid, 'of 3 tracked');
          }
        }

        return Response.json({ 
          received: true, 
          processed: 'payment_tracking'
        }, { status: 200 });

      } catch (paymentError) {
        console.error('[PAYMENT_WEBHOOK] ❌ Error tracking payment:', paymentError.message);
        return Response.json({ received: true, error: 'payment_tracking_failed' }, { status: 200 });
      }
    }

    // Other event types - acknowledge but don't process
    console.log(`[WEBHOOK_${webhookMode}] Unhandled event type: ${event.type} - acknowledged`);
    return Response.json({ received: true, ignored: true }, { status: 200 });

  } catch (error) {
    // SECURITY FIX: Don't expose error details
    console.error('[WEBHOOK_ERROR]', { error: error.message, stack: error.stack?.substring(0, 200) });
    
    // Return 500 for critical processing errors
    return Response.json({ 
      error: 'Webhook processing failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});