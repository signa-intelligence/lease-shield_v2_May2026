import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.10.0';

/**
 * STRIPE WEBHOOK HANDLER - Fully self-contained (no local imports)
 * 
 * FIX (2026-03-04): 
 * 1. Removed local imports (webhookIdempotency.js, authGuards.js) that prevented deployment
 * 2. Fixed undefined `email` variable in subscription handler
 * 3. Inlined idempotency + logging helpers
 * 4. Updated SDK to 0.8.20
 * 5. Added scan credit provisioning for Lite/Protect/Secure tiers
 * 
 * Required Secrets:
 * - SK_TEST_secret_key: Stripe API key
 * - webhook_stripe: Stripe webhook signing secret (whsec_...)
 * - RESEND_API_KEY: Email service (optional)
 */

const stripeSecretKey = Deno.env.get('SK_TEST_secret_key');
const webhookSecret = Deno.env.get('webhook_stripe');

if (!stripeSecretKey) console.error('[WEBHOOK_FATAL] SK_TEST_secret_key not set');
if (!webhookSecret) console.error('[WEBHOOK_FATAL] webhook_stripe not set');

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
const isLiveMode = stripeSecretKey?.startsWith('sk_live_');
const webhookMode = isLiveMode ? 'LIVE' : 'TEST';

// ════════════════════════════════════════
// INLINED: Idempotency (was webhookIdempotency.js)
// ════════════════════════════════════════
const processedEvents = new Map();
const MAX_EVENTS = 1000;

function isEventProcessed(eventId) {
  return processedEvents.has(eventId);
}

function markEventProcessed(eventId) {
  if (processedEvents.size >= MAX_EVENTS) {
    const oldest = processedEvents.keys().next().value;
    processedEvents.delete(oldest);
  }
  processedEvents.set(eventId, Date.now());
}

// ════════════════════════════════════════
// INLINED: Safe logging (was authGuards.js)
// ════════════════════════════════════════
const PII_FIELDS = ['email', 'userEmail', 'user_email', 'owner_email'];

function redactPII(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key in sanitized) {
    if (PII_FIELDS.includes(key) && typeof sanitized[key] === 'string' && sanitized[key].includes('@')) {
      const [local, domain] = sanitized[key].split('@');
      sanitized[key] = `${local.substring(0, 3)}***@${domain}`;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = redactPII(sanitized[key]);
    }
  }
  return sanitized;
}

async function safeLog(message, data = {}) {
  console.log(`[${message}]`, redactPII(data));
}

// ════════════════════════════════════════
// Tier → scan/letter credit mapping
// ════════════════════════════════════════
function getCreditsForTier(tier) {
  switch (tier) {
    case 'lite': return { scans: 6, letters: 3 };
    case 'protect': return { scans: 12, letters: 5 };
    case 'secure': return { scans: 999, letters: 50 };
    default: return { scans: 0, letters: 0 };
  }
}

Deno.serve(async (req) => {
  const timestamp = new Date().toISOString();
  await safeLog('WEBHOOK_RECEIVED', { mode: webhookMode, timestamp });

  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

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

    // Verify signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
      await safeLog('WEBHOOK_SIGNATURE_VERIFIED', { eventType: event.type, eventId: event.id });
    } catch (err) {
      console.error('[WEBHOOK_ERROR] Signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Idempotency check
    if (isEventProcessed(event.id)) {
      await safeLog('WEBHOOK_DUPLICATE', { eventId: event.id });
      return Response.json({ received: true, ignored: true, reason: 'duplicate_event' }, { status: 200 });
    }
    markEventProcessed(event.id);

    // Create Base44 client with service role for DB operations
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
      console.log('[WEBHOOK] Metadata:', JSON.stringify(metadata));

      // ========================================
      // SUBSCRIPTION FLOW
      // ========================================
      if (metadata.type === 'subscription') {
        console.log('[SUBSCRIPTION_WEBHOOK] 📋 New subscription detected');

        const userId = metadata.userId;
        const userEmail = metadata.email; // FIX: was using undefined `email`
        const planTier = metadata.plan || 'lite';
        const billingInterval = metadata.interval || 'monthly';

        await safeLog('SUBSCRIPTION_WEBHOOK', { userId, planTier, billingInterval });

        if (!userId) {
          console.error('[SUBSCRIPTION_WEBHOOK] ❌ Missing userId in metadata');
          return Response.json({ received: true, error: 'missing_user_id' }, { status: 200 });
        }

        // Fetch user
        let allUsers = [];
        let subscribedUser;
        try {
          allUsers = await base44.asServiceRole.entities.User.list();
          // FIX: Use userEmail (from metadata) instead of undefined `email`
          subscribedUser = allUsers.find(u => u.id === userId || u.email === userEmail);

          if (!subscribedUser) {
            console.error('[SUBSCRIPTION_WEBHOOK] ❌ User not found:', userId);
            // Fallback: try customer_email from session
            const customerEmail = session.customer_email || session.customer_details?.email;
            if (customerEmail) {
              subscribedUser = allUsers.find(u => u.email === customerEmail);
              console.log('[SUBSCRIPTION_WEBHOOK] Fallback customer_email lookup:', !!subscribedUser);
            }
          }

          if (!subscribedUser) {
            await safeLog('SUBSCRIPTION_WEBHOOK_USER_NOT_FOUND', { userId, userEmail });
            return Response.json({ received: true, error: 'user_not_found' }, { status: 200 });
          }

          await safeLog('SUBSCRIPTION_WEBHOOK_USER_FOUND', { userId: subscribedUser.id });
        } catch (fetchError) {
          console.error('[SUBSCRIPTION_WEBHOOK] ❌ Failed to fetch user:', fetchError.message);
          return Response.json({ received: true, error: 'user_fetch_failed' }, { status: 200 });
        }

        // Update user plan + provision credits
        const now = new Date().toISOString();
        const isFirstPaidPlan = !subscribedUser.member_since;
        const credits = getCreditsForTier(planTier);

        const updateData = {
          plan_tier: planTier,
          billing_interval: billingInterval,
          subscription_status: 'active',
          subscription_started_at: now,
          member_since: subscribedUser.member_since || now,
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          available_scans: credits.scans,
          letter_credits: (subscribedUser.letter_credits || 0) + credits.letters,
          last_credit_refresh: now
        };

        console.log('[SUBSCRIPTION_WEBHOOK] 📝 Updating user:', JSON.stringify({
          userId: subscribedUser.id,
          planTier,
          scans: credits.scans,
          letters: credits.letters
        }));

        await base44.asServiceRole.entities.User.update(subscribedUser.id, updateData);

        console.log('[SUBSCRIPTION_WEBHOOK] ✅✅✅ USER UPGRADED SUCCESSFULLY ✅✅✅');
        console.log('[SUBSCRIPTION_WEBHOOK] Plan:', planTier, '| Scans:', credits.scans, '| Letters:', credits.letters);

        // ========================================
        // REFERRAL CREDIT LOGIC
        // ========================================
        if (isFirstPaidPlan && subscribedUser.referred_by) {
          console.log('[REFERRAL_CREDIT] 🎁 Processing referral credit...');
          try {
            const referrer = allUsers.find(u => u.id === subscribedUser.referred_by);
            if (referrer) {
              const planPrices = { lite: 190, protect: 390, secure: 990 };
              const creditTHB = planPrices[planTier] || 0;

              if (creditTHB > 0) {
                const newReferralBalance = (referrer.referral_credits_thb || 0) + creditTHB;
                const newTotalEarned = (referrer.referral_credits_total_thb || 0) + creditTHB;
                const newReferralCount = (referrer.referral_count || 0) + 1;

                await base44.asServiceRole.entities.User.update(referrer.id, {
                  referral_credits_thb: newReferralBalance,
                  referral_credits_total_thb: newTotalEarned,
                  referral_count: newReferralCount
                });

                console.log('[REFERRAL_CREDIT] ✅ Referrer credited:', creditTHB, 'THB');

                // Stripe customer balance credit
                if (referrer.stripe_customer_id) {
                  try {
                    await stripe.customers.update(referrer.stripe_customer_id, {
                      balance: -(creditTHB * 100),
                      metadata: { last_referral_credit: creditTHB.toString(), last_referral_date: now }
                    });
                  } catch (stripeErr) {
                    console.error('[REFERRAL_CREDIT] Stripe balance failed:', stripeErr.message);
                  }
                }

                // Update referral record
                const referralRecords = await base44.asServiceRole.entities.Referral.filter({
                  referrer_user_id: referrer.id,
                  referred_user_id: subscribedUser.id
                });
                if (referralRecords.length > 0) {
                  const referral = referralRecords[0];
                  if (referral.flagged_for_review && !referral.reviewed_by_admin) {
                    await base44.asServiceRole.entities.Referral.update(referral.id, {
                      status: 'pending_review',
                      stripe_subscription_id: session.subscription,
                      stripe_customer_id: session.customer,
                      months_paid: billingInterval === 'annual' ? 12 : 1,
                      last_payment_date: now
                    });
                  } else {
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
                  }
                }

                // Email notification (non-blocking)
                if (referrer.email_notifications && RESEND_API_KEY) {
                  fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      from: 'Lease Shield <no-reply@leaseshield.asia>',
                      to: [referrer.email],
                      subject: '🎉 You Earned a Referral Credit!',
                      html: `<p>Your friend subscribed! You earned ฿${creditTHB} credit. New balance: ฿${newReferralBalance}</p>`
                    })
                  }).catch(err => console.error('[REFERRAL_EMAIL] Failed:', err.message));
                }
              }
            }
          } catch (referralError) {
            console.error('[REFERRAL_CREDIT] Failed (non-critical):', referralError.message);
          }
        }

        return Response.json({ received: true, processed: 'subscription', plan: planTier }, { status: 200 });
      }

      // ========================================
      // ONE-TIME SCAN PURCHASE
      // ========================================
      if (metadata.type === 'one_time_scan') {
        const userId = metadata.userId;
        const userEmail = metadata.email;
        console.log('[ONE_TIME_SCAN_WEBHOOK] Processing for:', userId);

        const allUsers = await base44.asServiceRole.entities.User.list();
        const user = allUsers.find(u => u.id === userId || u.email === userEmail);
        if (!user) {
          console.error('[ONE_TIME_SCAN_WEBHOOK] User not found');
          return Response.json({ received: true, error: 'user_not_found' }, { status: 200 });
        }

        await base44.asServiceRole.entities.User.update(user.id, {
          one_time_scan_credits: (user.one_time_scan_credits || 0) + 1
        });
        console.log('[ONE_TIME_SCAN_WEBHOOK] ✅ Credit granted');

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
        } catch (e) { console.error('[ONE_TIME_SCAN_WEBHOOK] Payment record failed:', e.message); }

        return Response.json({ received: true, processed: 'one_time_scan' }, { status: 200 });
      }

      // ========================================
      // CREDITS PURCHASE
      // ========================================
      if (metadata.type === 'credits') {
        const userId = metadata.userId;
        const userEmail = metadata.email;
        const creditsToAdd = Number(metadata.credits || '0');
        console.log('[CREDITS_WEBHOOK] Processing:', { userId, creditsToAdd });

        if (!userId || creditsToAdd <= 0) {
          return Response.json({ received: true, error: 'invalid_params' }, { status: 200 });
        }

        const allUsers = await base44.asServiceRole.entities.User.list();
        const user = allUsers.find(u => u.id === userId || u.email === userEmail);
        if (!user) {
          return Response.json({ received: true, error: 'user_not_found' }, { status: 200 });
        }

        const newBalance = (user.letter_credits || 0) + creditsToAdd;
        await base44.asServiceRole.entities.User.update(user.id, {
          letter_credits: newBalance,
          total_credits_purchased: (user.total_credits_purchased || 0) + creditsToAdd
        });
        console.log('[CREDITS_WEBHOOK] ✅ Credits updated:', newBalance);

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
        } catch (e) { console.error('[CREDITS_WEBHOOK] Payment record failed:', e.message); }

        return Response.json({ received: true, processed: 'credits', newBalance }, { status: 200 });
      }

      console.log('[WEBHOOK] Unhandled checkout metadata type:', metadata.type);
      return Response.json({ received: true }, { status: 200 });
    }

    // ========================================
    // HANDLE: charge.refunded
    // ========================================
    if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      const customerId = charge.customer;
      console.log('[REFUND_WEBHOOK] Refund for customer:', customerId);

      try {
        const referrals = await base44.asServiceRole.entities.Referral.filter({
          stripe_customer_id: customerId,
          status: { $in: ['converted', 'pending_refund_window'] }
        });

        for (const referral of referrals) {
          const creditToReverse = referral.credit_thb || 0;
          if (creditToReverse > 0) {
            const referrer = await base44.asServiceRole.entities.User.get(referral.referrer_user_id);
            if (referrer) {
              await base44.asServiceRole.entities.User.update(referrer.id, {
                referral_credits_thb: Math.max(0, (referrer.referral_credits_thb || 0) - creditToReverse),
                referral_count: Math.max(0, (referrer.referral_count || 0) - 1)
              });
              if (referrer.stripe_customer_id) {
                try {
                  const customer = await stripe.customers.retrieve(referrer.stripe_customer_id);
                  await stripe.customers.update(referrer.stripe_customer_id, {
                    balance: (customer.balance || 0) + (creditToReverse * 100)
                  });
                } catch (e) { console.error('[REFUND] Stripe balance failed:', e.message); }
              }
            }
            await base44.asServiceRole.entities.Referral.update(referral.id, {
              status: 'refunded', refunded_at: new Date().toISOString(), credit_thb: 0
            });
          }
        }
        return Response.json({ received: true, processed: 'refund' }, { status: 200 });
      } catch (e) {
        console.error('[REFUND_WEBHOOK] Error:', e.message);
        return Response.json({ received: true, error: 'refund_failed' }, { status: 200 });
      }
    }

    // ========================================
    // HANDLE: customer.subscription.deleted
    // ========================================
    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      // Only process actual cancellations
      const isCancelled = subscription.status === 'canceled' || subscription.cancel_at_period_end === true;
      if (event.type === 'customer.subscription.updated' && !isCancelled) {
        console.log('[SUBSCRIPTION_UPDATE_WEBHOOK] Non-cancellation update, skipping');
        return Response.json({ received: true, ignored: true }, { status: 200 });
      }

      // For deleted events, always downgrade. For updated with cancel_at_period_end, just log.
      if (event.type === 'customer.subscription.updated' && subscription.cancel_at_period_end && subscription.status === 'active') {
        console.log('[SUBSCRIPTION_UPDATE_WEBHOOK] cancel_at_period_end=true, scheduled cancellation. User keeps access until period end.');
        return Response.json({ received: true, processed: 'scheduled_cancellation' }, { status: 200 });
      }

      console.log('[CANCELLATION_WEBHOOK] Subscription cancelled:', customerId, 'status:', subscription.status);

      try {
        // Find and downgrade the user
        const allUsers = await base44.asServiceRole.entities.User.list();
        const user = allUsers.find(u => u.stripe_customer_id === customerId);
        if (user) {
          await base44.asServiceRole.entities.User.update(user.id, {
            plan_tier: 'explorer',
            subscription_status: 'cancelled',
            available_scans: 1,
            letter_credits: 0,
            stripe_subscription_id: null
          });
          console.log('[CANCELLATION_WEBHOOK] ✅ User downgraded to explorer:', user.id, user.email);
        } else {
          console.error('[CANCELLATION_WEBHOOK] ❌ No user found for customer:', customerId);
        }

        // Cancel pending referrals
        const referrals = await base44.asServiceRole.entities.Referral.filter({
          stripe_customer_id: customerId,
          status: 'pending_first_payment'
        });
        for (const referral of referrals) {
          await base44.asServiceRole.entities.Referral.update(referral.id, {
            status: 'cancelled'
          });
        }
        return Response.json({ received: true, processed: 'cancellation' }, { status: 200 });
      } catch (e) {
        console.error('[CANCELLATION_WEBHOOK] Error:', e.message);
        return Response.json({ received: true, error: 'cancellation_failed' }, { status: 200 });
      }
    }

    // ========================================
    // HANDLE: invoice.payment_succeeded
    // ========================================
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      if (!subscriptionId) {
        return Response.json({ received: true, ignored: true }, { status: 200 });
      }

      console.log('[PAYMENT_WEBHOOK] Payment succeeded for subscription:', subscriptionId);

      try {
        const referrals = await base44.asServiceRole.entities.Referral.filter({
          stripe_subscription_id: subscriptionId,
          status: 'pending_first_payment'
        });

        for (const referral of referrals) {
          const monthsPaid = (referral.months_paid || 0) + 1;
          const now = new Date().toISOString();

          if (monthsPaid >= 3) {
            if (referral.flagged_for_review && !referral.reviewed_by_admin) {
              await base44.asServiceRole.entities.Referral.update(referral.id, {
                status: 'pending_review', months_paid: monthsPaid, last_payment_date: now
              });
              continue;
            }

            const creditTHB = referral.credit_thb || 0;
            if (creditTHB > 0) {
              const referrer = await base44.asServiceRole.entities.User.get(referral.referrer_user_id);
              if (referrer) {
                await base44.asServiceRole.entities.User.update(referrer.id, {
                  referral_credits_thb: (referrer.referral_credits_thb || 0) + creditTHB,
                  referral_credits_total_thb: (referrer.referral_credits_total_thb || 0) + creditTHB,
                  referral_count: (referrer.referral_count || 0) + 1
                });
                if (referrer.stripe_customer_id) {
                  try {
                    await stripe.customers.update(referrer.stripe_customer_id, {
                      balance: -(creditTHB * 100)
                    });
                  } catch (e) { console.error('[PAYMENT_WEBHOOK] Stripe balance failed:', e.message); }
                }
              }
            }
            await base44.asServiceRole.entities.Referral.update(referral.id, {
              status: 'converted', converted_at: now, months_paid: monthsPaid, last_payment_date: now
            });
          } else {
            await base44.asServiceRole.entities.Referral.update(referral.id, {
              months_paid: monthsPaid, last_payment_date: now
            });
          }
        }
        return Response.json({ received: true, processed: 'payment_tracking' }, { status: 200 });
      } catch (e) {
        console.error('[PAYMENT_WEBHOOK] Error:', e.message);
        return Response.json({ received: true, error: 'payment_tracking_failed' }, { status: 200 });
      }
    }

    // ========================================
    // HANDLE: charge.dispute.created
    // ========================================
    if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object;
      console.log('[CHARGEBACK_WEBHOOK] Dispute created for charge:', dispute.charge);

      try {
        const charge = await stripe.charges.retrieve(dispute.charge);
        const customerId = charge.customer;

        const referrals = await base44.asServiceRole.entities.Referral.filter({
          stripe_customer_id: customerId,
          status: { $in: ['converted', 'pending_refund_window'] }
        });

        for (const referral of referrals) {
          const creditToReverse = referral.credit_thb || 0;
          if (creditToReverse > 0) {
            const referrer = await base44.asServiceRole.entities.User.get(referral.referrer_user_id);
            if (referrer) {
              await base44.asServiceRole.entities.User.update(referrer.id, {
                referral_credits_thb: Math.max(0, (referrer.referral_credits_thb || 0) - creditToReverse),
                referral_count: Math.max(0, (referrer.referral_count || 0) - 1)
              });
              if (referrer.stripe_customer_id) {
                try {
                  const customer = await stripe.customers.retrieve(referrer.stripe_customer_id);
                  await stripe.customers.update(referrer.stripe_customer_id, {
                    balance: (customer.balance || 0) + (creditToReverse * 100)
                  });
                } catch (e) { console.error('[CHARGEBACK] Stripe balance failed:', e.message); }
              }
            }
            await base44.asServiceRole.entities.Referral.update(referral.id, {
              status: 'chargeback', chargeback_at: new Date().toISOString(), credit_thb: 0
            });
          }
        }
        return Response.json({ received: true, processed: 'chargeback' }, { status: 200 });
      } catch (e) {
        console.error('[CHARGEBACK_WEBHOOK] Error:', e.message);
        return Response.json({ received: true, error: 'chargeback_failed' }, { status: 200 });
      }
    }

    console.log(`[WEBHOOK_${webhookMode}] Unhandled event: ${event.type}`);
    return Response.json({ received: true, ignored: true }, { status: 200 });

  } catch (error) {
    console.error('[WEBHOOK_CRITICAL_ERROR]', error.message, error.stack?.substring(0, 300));
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
});