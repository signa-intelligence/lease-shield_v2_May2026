import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.14.0';
import { getAllowance } from '../../shared/planAllowances.ts';

function plusTwelveMonthsISO(from = new Date()) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 12);
  return d.toISOString();
}

const stripe = new Stripe(Deno.env.get("SK_TEST_secret_key"));
const webhookSecret = Deno.env.get("webhook_stripe");

Deno.serve(async (req) => {
  try {
    // Clone request: one for base44 SDK init, one for body reading
    const reqClone = req.clone();
    const base44 = createClientFromRequest(reqClone);

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    // Determine webhook mode
    let event;
    let webhookMode = 'VERIFIED';

    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } catch (err) {
        console.error('[WEBHOOK_SIGNATURE_FAILED]', err.message);
        // Try parsing raw body as fallback for testing
        try {
          event = JSON.parse(body);
          webhookMode = 'UNVERIFIED';
          console.warn('[WEBHOOK_FALLBACK] Using unverified event:', event.type);
        } catch (parseErr) {
          return Response.json({ error: 'Invalid signature and body' }, { status: 400 });
        }
      }
    } else {
      // No webhook secret or no signature - parse body directly
      try {
        event = JSON.parse(body);
        webhookMode = 'NO_SECRET';
        console.warn('[WEBHOOK_NO_SECRET] Processing without verification:', event.type);
      } catch (parseErr) {
        return Response.json({ error: 'Invalid body' }, { status: 400 });
      }
    }

    console.log(`[WEBHOOK_${webhookMode}] Event: ${event.type}, ID: ${event.id}`);

    // ========================================
    // HELPER: Find user by Stripe customer ID
    // ========================================
    async function findUserByCustomerId(customerId) {
      const allUsers = await base44.asServiceRole.entities.User.list();
      return allUsers.find(u => u.stripe_customer_id === customerId);
    }

    // ========================================
    // HELPER: Downgrade user to Explorer
    // ========================================
    async function downgradeToExplorer(user) {
      const previousTier = user.plan_tier || 'unknown';
      const EXPLORER_LIMIT_BYTES = 100 * 1024 * 1024; // 100MB

      // Check current storage usage
      let storageUsageBytes = 0;
      try {
        const storageRecords = await base44.asServiceRole.entities.UserStorage.filter({
          user_email: user.email
        });
        if (storageRecords.length > 0) {
          storageUsageBytes = storageRecords[0].total_bytes || 0;
        }
      } catch (e) {
        console.error('[DOWNGRADE] Storage check failed (non-blocking):', e.message);
      }

      const isOverLimit = storageUsageBytes > EXPLORER_LIMIT_BYTES;
      const gracePeriodEnds = isOverLimit
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      await base44.asServiceRole.entities.User.update(user.id, {
        plan_tier: 'explorer',
        subscription_status: 'cancelled',
        available_scans: getAllowance('explorer').scans,
        letter_credits: getAllowance('explorer').letters,
        credits_reset_at: null,
        stripe_subscription_id: null,
        previous_plan_tier: previousTier,
        storage_over_limit: isOverLimit,
        uploads_blocked: isOverLimit,
        storage_grace_period_ends: gracePeriodEnds
      });

      console.log('[DOWNGRADE] ✅ User downgraded to explorer:', user.email,
        isOverLimit ? `(OVER LIMIT: ${(storageUsageBytes / 1024 / 1024).toFixed(1)}MB > 100MB, grace until ${gracePeriodEnds})` : '(within limit)');

      // Send storage warning email if over limit
      if (isOverLimit) {
        try {
          await base44.asServiceRole.functions.invoke('sendStorageWarning', {
            internal_secret: Deno.env.get('INTERNAL_FUNCTION_SECRET'),
            email: user.email,
            full_name: user.full_name || user.display_name,
            current_usage_bytes: storageUsageBytes,
            grace_period_ends: gracePeriodEnds,
            previous_tier: previousTier
          });
          console.log('[DOWNGRADE] ✅ Storage warning email sent to:', user.email);
        } catch (emailErr) {
          console.error('[DOWNGRADE] ⚠️ Storage warning email failed (non-blocking):', emailErr.message);
        }
      }
    }

    // ========================================
    // HANDLE: checkout.session.completed
    // ========================================
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('[CHECKOUT_WEBHOOK] Session completed:', session.id, 'mode:', session.mode);

      if (session.mode === 'subscription') {
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const userEmail = session.customer_email || session.customer_details?.email;

        console.log('[CHECKOUT_WEBHOOK] Customer:', customerId, 'Sub:', subscriptionId, 'Email:', userEmail);

        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = sub.items?.data?.[0]?.price?.id;
          const interval = sub.items?.data?.[0]?.price?.recurring?.interval;

          // Determine plan from price
          let planTier = 'explorer';
          let scans = 1;
          let credits = 0;

          // Map price to plan (check metadata or price amount)
          const amount = sub.items?.data?.[0]?.price?.unit_amount || 0;
          const amountTHB = amount / 100;

          if (amountTHB <= 200 || (interval === 'year' && amountTHB <= 1900)) {
            planTier = 'lite';
            scans = 6;
            credits = 3;
          } else if (amountTHB <= 500 || (interval === 'year' && amountTHB <= 5000)) {
            planTier = 'protect';
            scans = 12;
            credits = 5;
          } else {
            planTier = 'secure';
            scans = 50;
            credits = 50;
          }

          const user = await findUserByCustomerId(customerId);
          if (user) {
            // SAFETY NET: Cancel any OTHER active subscriptions for this customer
            try {
              const allSubs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 50 });
              const orphaned = allSubs.data.filter(s => s.id !== subscriptionId);
              if (orphaned.length > 0) {
                console.warn(`[WEBHOOK] ⚠️ Found ${orphaned.length} orphaned sub(s) — auto-canceling`);
                for (const orphan of orphaned) {
                  await stripe.subscriptions.cancel(orphan.id);
                  console.log('[WEBHOOK] ✅ Auto-canceled orphaned sub:', orphan.id);
                }
              }
            } catch (cleanupErr) {
              console.error('[WEBHOOK] Orphan cleanup failed (non-blocking):', cleanupErr.message);
            }

            const now = new Date().toISOString();
            const currentMonth = now.slice(0, 7);
            await base44.asServiceRole.entities.User.update(user.id, {
              plan_tier: planTier,
              subscription_status: 'active',
              available_scans: getAllowance(planTier).scans,
              letter_credits: getAllowance(planTier).letters,
              credits_reset_at: plusTwelveMonthsISO(),
              stripe_subscription_id: subscriptionId,
              billing_interval: interval === 'year' ? 'annual' : 'monthly',
              subscription_started_at: now,
              member_since: user.member_since || now,
              plan_renews_at: new Date(sub.current_period_end * 1000).toISOString(),
              usage_month: currentMonth,
              scans_used_this_month: 0,
              letters_used_this_month: 0,
              fasttrack_used_this_month: 0,
              // Clear storage over-limit flags on upgrade
              storage_over_limit: false,
              uploads_blocked: false,
              storage_grace_period_ends: null
            });
            console.log('[CHECKOUT_WEBHOOK] ✅ User upgraded:', user.email, 'to', planTier);

            // Track revenue in Payment entity
            try {
              await base44.asServiceRole.entities.Payment.create({
                type: 'subscription',
                amount: amountTHB,
                currency: 'THB',
                provider: 'stripe',
                status: 'paid',
                external_id: session.payment_intent || session.id
              });
              console.log('[REVENUE] ✅ Payment recorded:', user.email, planTier, '฿' + amountTHB);
            } catch (revErr) {
              console.error('[REVENUE] ⚠️ Payment tracking failed (non-critical):', revErr.message);
            }

            // Send upgrade confirmation email (non-blocking)
            if (planTier !== 'explorer') {
              try {
                await base44.asServiceRole.functions.invoke('sendUpgradeEmail', {
                  internal_secret: Deno.env.get('INTERNAL_FUNCTION_SECRET'),
                  user: { ...user, plan_tier: planTier, billing_interval: interval === 'year' ? 'annual' : 'monthly' },
                  newTier: planTier
                });
                console.log('[CHECKOUT_WEBHOOK] ✅ Upgrade email sent to:', user.email);
              } catch (emailErr) {
                console.error('[CHECKOUT_WEBHOOK] ⚠️ Upgrade email failed (non-critical):', emailErr.message);
              }
            }
          } else {
            console.error('[CHECKOUT_WEBHOOK] ❌ No user found for customer:', customerId);
          }
        } catch (e) {
          console.error('[CHECKOUT_WEBHOOK] Error:', e.message);
        }
      }

      // Handle case/resolve payments
      if (session.metadata?.caseId) {
        try {
          const caseId = session.metadata.case_id;
          await base44.asServiceRole.entities.Case.update(caseId, {
            status: 'intake',
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent,
            paid_at: new Date().toISOString()
          });
          console.log('[CHECKOUT_WEBHOOK] ✅ Case payment recorded:', caseId);

          // Track case payment revenue
          try {
            const caseAmount = (session.amount_total || 0) / 100;
            if (caseAmount > 0) {
              await base44.asServiceRole.entities.Payment.create({
                type: 'case',
                amount: caseAmount,
                currency: 'THB',
                provider: 'stripe',
                status: 'paid',
                external_id: session.payment_intent || session.id
              });
              console.log('[REVENUE] ✅ Case payment tracked: ฿' + caseAmount);
            }
          } catch (revErr) {
            console.error('[REVENUE] ⚠️ Case payment tracking failed:', revErr.message);
          }

          // Send admin notification AFTER case updated to intake
          try {
            const updatedCase = await base44.asServiceRole.entities.Case.get(caseId);
            const allUsers = await base44.asServiceRole.entities.User.list();
            const caseUser = allUsers.find(u => u.email === updatedCase.user_email);
            // Pass internal secret in body so notifyAdminNewCase accepts the call
            await base44.functions.invoke('notifyAdminNewCase', {
              _internalSecret: Deno.env.get('INTERNAL_FUNCTION_SECRET'),
              caseNumber: updatedCase.case_number,
              tenantName: caseUser?.full_name || updatedCase.user_email,
              tenantEmail: updatedCase.user_email,
              landlordName: updatedCase.landlord_name,
              propertyAddress: updatedCase.property_address,
              disputeAmount: updatedCase.dispute_amount,
              planTier: caseUser?.plan_tier,
              caseId: caseId,
              paymentType: 'stripe'
            });
            console.log('[CHECKOUT_WEBHOOK] ✅ Admin notification sent for case:', caseId);
          } catch (notifyErr) {
            console.error('[CHECKOUT_WEBHOOK] ⚠️ Admin notification failed (non-blocking):', notifyErr.message);
          }
        } catch (e) {
          console.error('[CHECKOUT_WEBHOOK] Case update error:', e.message);
        }
      }

      // Handle letter credit purchases
      if (session.metadata?.type === 'credits') {
        try {
          const userId = session.metadata.userId;
          const creditsCount = parseInt(session.metadata.credits || '1', 10);
          const creditAmount = (session.amount_total || 0) / 100;

          console.log('[CHECKOUT_WEBHOOK] 💳 Credits purchase:', { userId, creditsCount, amount: creditAmount });

          const allUsers = await base44.asServiceRole.entities.User.list();
          const creditUser = allUsers.find(u => u.id === userId);

          if (creditUser) {
            const currentCredits = creditUser.letter_credits || 0;
            await base44.asServiceRole.entities.User.update(creditUser.id, {
              letter_credits: currentCredits + creditsCount
            });
            console.log('[CHECKOUT_WEBHOOK] ✅ Credits added:', creditUser.email, currentCredits, '->', currentCredits + creditsCount);

            await base44.asServiceRole.entities.Payment.create({
              type: 'addon',
              amount: creditAmount,
              currency: 'THB',
              provider: 'stripe',
              status: 'paid',
              external_id: session.payment_intent || session.id
            });
            console.log('[REVENUE] ✅ Credits payment tracked: ฿' + creditAmount);
          } else {
            console.error('[CHECKOUT_WEBHOOK] ❌ No user found for credits purchase, userId:', userId);
          }
        } catch (e) {
          console.error('[CHECKOUT_WEBHOOK] Credits fulfillment error:', e.message);
        }
      }

      // Handle one-time scan purchases
      if (session.metadata?.type === 'one_time_scan') {
        try {
          const userId = session.metadata.userId;
          const scanAmount = (session.amount_total || 0) / 100;

          console.log('[CHECKOUT_WEBHOOK] 🔍 One-time scan purchase:', { userId, amount: scanAmount });

          const allUsers = await base44.asServiceRole.entities.User.list();
          const scanUser = allUsers.find(u => u.id === userId);

          if (scanUser) {
            const currentScans = scanUser.available_scans || 0;
            await base44.asServiceRole.entities.User.update(scanUser.id, {
              available_scans: currentScans + 1
            });
            console.log('[CHECKOUT_WEBHOOK] ✅ Scan credit added:', scanUser.email, currentScans, '->', currentScans + 1);

            await base44.asServiceRole.entities.Payment.create({
              type: 'addon',
              amount: scanAmount,
              currency: 'THB',
              provider: 'stripe',
              status: 'paid',
              external_id: session.payment_intent || session.id
            });
            console.log('[REVENUE] ✅ Scan payment tracked: ฿' + scanAmount);
          } else {
            console.error('[CHECKOUT_WEBHOOK] ❌ No user found for scan purchase, userId:', userId);
          }
        } catch (e) {
          console.error('[CHECKOUT_WEBHOOK] Scan fulfillment error:', e.message);
        }
      }

      return Response.json({ received: true, processed: 'checkout' }, { status: 200 });
    }

    // ========================================
    // HANDLE: customer.subscription.updated
    // ========================================
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      console.log('[SUB_UPDATE_WEBHOOK] Customer:', customerId, 
        'status:', subscription.status, 
        'cancel_at_period_end:', subscription.cancel_at_period_end,
        'current_period_end:', new Date(subscription.current_period_end * 1000).toISOString());

      // Case 1: User scheduled cancellation (cancel_at_period_end = true, but subscription still active)
      // DO NOT downgrade. User keeps paid access until period ends.
      if (subscription.cancel_at_period_end === true && subscription.status === 'active') {
        const user = await findUserByCustomerId(customerId);
        if (user) {
          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: 'canceling',
            cancellation_date: new Date().toISOString()
          });
          console.log('[SUB_UPDATE_WEBHOOK] ✅ Marked as canceling (keeps access until period end):', user.email,
            'Period ends:', new Date(subscription.current_period_end * 1000).toISOString());
        }
        return Response.json({ received: true, processed: 'scheduled_cancellation' }, { status: 200 });
      }

      // Case 2: User reactivated (cancel_at_period_end went from true back to false)
      if (subscription.cancel_at_period_end === false && subscription.status === 'active') {
        const user = await findUserByCustomerId(customerId);
        if (user && (user.subscription_status === 'canceling' || user.subscription_status === 'cancelled')) {
          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: 'active',
            cancellation_date: null,
            cancellation_reason: null,
            cancellation_feedback: null
          });
          console.log('[SUB_UPDATE_WEBHOOK] ✅ Subscription reactivated:', user.email);
        }
        return Response.json({ received: true, processed: 'reactivated' }, { status: 200 });
      }

      // Case 3: Subscription status is now fully 'canceled' (period ended)
      if (subscription.status === 'canceled') {
        const user = await findUserByCustomerId(customerId);
        if (user) {
          await downgradeToExplorer(user);
          console.log('[SUB_UPDATE_WEBHOOK] ✅ Period ended, downgraded:', user.email);
        }
        return Response.json({ received: true, processed: 'period_ended_downgrade' }, { status: 200 });
      }

      // Case 4: Plan change (upgrade/downgrade between tiers) - subscription still active
      if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
        const user = await findUserByCustomerId(customerId);
        if (user) {
          const amount = subscription.items?.data?.[0]?.price?.unit_amount || 0;
          const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
          const amountTHB = amount / 100;

          let planTier = 'explorer';
          let scans = 1;
          let credits = 0;

          if (amountTHB <= 200 || (interval === 'year' && amountTHB <= 1900)) {
            planTier = 'lite';
            scans = 6;
            credits = 3;
          } else if (amountTHB <= 500 || (interval === 'year' && amountTHB <= 5000)) {
            planTier = 'protect';
            scans = 12;
            credits = 5;
          } else {
            planTier = 'secure';
            scans = 50;
            credits = 50;
          }

          if (planTier !== user.plan_tier) {
            const currentMonth = new Date().toISOString().slice(0, 7);
            await base44.asServiceRole.entities.User.update(user.id, {
              plan_tier: planTier,
              subscription_status: 'active',
              available_scans: getAllowance(planTier).scans,
              letter_credits: getAllowance(planTier).letters,
              credits_reset_at: plusTwelveMonthsISO(),
              billing_interval: interval === 'year' ? 'annual' : 'monthly',
              plan_renews_at: new Date(subscription.current_period_end * 1000).toISOString(),
              usage_month: currentMonth,
              scans_used_this_month: 0,
              letters_used_this_month: 0,
              fasttrack_used_this_month: 0
            });
            console.log('[SUB_UPDATE_WEBHOOK] ✅ Plan changed:', user.email, user.plan_tier, '->', planTier);
          }
        }
        return Response.json({ received: true, processed: 'plan_change' }, { status: 200 });
      }

      console.log('[SUB_UPDATE_WEBHOOK] Unhandled subscription update state:', subscription.status, 'cancel_at_period_end:', subscription.cancel_at_period_end);
      return Response.json({ received: true, ignored: true }, { status: 200 });
    }

    // ========================================
    // HANDLE: customer.subscription.deleted
    // (Fires when subscription period actually ends)
    // ========================================
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      console.log('[SUB_DELETED_WEBHOOK] Subscription ended:', customerId, 'status:', subscription.status);

      try {
        const user = await findUserByCustomerId(customerId);
        if (user) {
          await downgradeToExplorer(user);

          // Cancel pending referrals
          try {
            const referrals = await base44.asServiceRole.entities.Referral.filter({
              stripe_customer_id: customerId,
              status: 'pending_first_payment'
            });
            for (const referral of referrals) {
              await base44.asServiceRole.entities.Referral.update(referral.id, {
                status: 'cancelled'
              });
            }
          } catch (refErr) {
            console.error('[SUB_DELETED_WEBHOOK] Referral cleanup error:', refErr.message);
          }
        } else {
          console.error('[SUB_DELETED_WEBHOOK] ❌ No user found for customer:', customerId);
        }

        return Response.json({ received: true, processed: 'subscription_deleted' }, { status: 200 });
      } catch (e) {
        console.error('[SUB_DELETED_WEBHOOK] Error:', e.message);
        return Response.json({ received: true, error: 'deletion_failed' }, { status: 200 });
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

      // Track renewal revenue
      try {
        const invoiceAmount = (invoice.amount_paid || 0) / 100;
        if (invoiceAmount > 0 && invoice.billing_reason !== 'subscription_create') {
          const custId = invoice.customer;
          const renewUser = await findUserByCustomerId(custId);
          await base44.asServiceRole.entities.Payment.create({
            type: 'subscription',
            amount: invoiceAmount,
            currency: 'THB',
            provider: 'stripe',
            status: 'paid',
            external_id: invoice.id
          });
          console.log('[REVENUE] ✅ Renewal payment recorded:', renewUser?.email || custId, '฿' + invoiceAmount);
        }
      } catch (revErr) {
        console.error('[REVENUE] ⚠️ Renewal tracking failed (non-critical):', revErr.message);
      }

      // Annual credit top-up on renewal (SET to allowance, never increment)
      try {
        const renewalUser = await findUserByCustomerId(invoice.customer);
        if (renewalUser) {
          const resetAt = renewalUser.credits_reset_at ? new Date(renewalUser.credits_reset_at) : null;
          if (!resetAt || Date.now() >= resetAt.getTime()) {
            const allowance = getAllowance(renewalUser.plan_tier);
            await base44.asServiceRole.entities.User.update(renewalUser.id, {
              available_scans: allowance.scans,
              letter_credits: allowance.letters,
              credits_reset_at: plusTwelveMonthsISO()
            });
            console.log('[RENEWAL_CREDITS] ✅ Credits reset:', renewalUser.email, renewalUser.plan_tier, allowance);
          }
        }
      } catch (creditErr) {
        console.error('[RENEWAL_CREDITS] ⚠️ Credit top-up failed (non-critical):', creditErr.message);
      }

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