import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

/**
 * STRIPE WEBHOOK HANDLER - Clean minimal implementation
 * 
 * Required Secrets:
 * - SK_LIVE_secret_key: Stripe API key (LIVE mode)
 * - webhook_stripe: Stripe webhook signing secret (whsec_...)
 * - RESEND_API_KEY: Email service (optional for notifications)
 */

const stripeSecretKey = Deno.env.get('SK_LIVE_secret_key') ?? Deno.env.get('SK_TEST_secret_key');
const webhookSecret = Deno.env.get('webhook_stripe');

console.log('[STRIPE_WEBHOOK] Secret key loaded:', stripeSecretKey ? stripeSecretKey.substring(0, 7) + '...' : 'MISSING');

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
});

Deno.serve(async (req) => {
  console.log('\n[WEBHOOK_ENTRY] Stripe webhook received');
  console.log('[WEBHOOK_ENTRY] Timestamp:', new Date().toISOString());

  try {
    // Read raw body and signature
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('[WEBHOOK_ERROR] No stripe-signature header');
      return Response.json({ error: 'No signature provided' }, { status: 400 });
    }

    if (!webhookSecret) {
      console.error('[WEBHOOK_ERROR] webhook_stripe secret not configured');
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
      console.log('[WEBHOOK_ENTRY] ✅ Signature verified');
      console.log('[WEBHOOK_ENTRY] Event type:', event.type);
      console.log('[WEBHOOK_ENTRY] Event ID:', event.id);
    } catch (err) {
      console.error('[WEBHOOK_ERROR] Signature verification failed:', err.message);
      return Response.json({ 
        error: 'Webhook signature verification failed',
        details: err.message 
      }, { status: 400 });
    }

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
      // SUBSCRIPTION FLOW - Process referral reward
      // ========================================
      if (metadata.type === 'subscription' && metadata.userId) {
        console.log('[WEBHOOK] 🎯 Subscription detected - checking referral reward');
        
        try {
          // Non-blocking call to process referral reward
          base44.asServiceRole.functions.invoke('processReferralReward', {
            referredUserId: metadata.userId
          }).catch(err => {
            console.error('[WEBHOOK] ⚠️ Referral reward processing failed (non-critical):', err.message);
          });
          
          console.log('[WEBHOOK] Referral reward check queued');
        } catch (refError) {
          console.error('[WEBHOOK] ⚠️ Referral reward setup error (non-critical):', refError.message);
        }
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

    // Other event types - acknowledge
    console.log('[WEBHOOK] Unhandled event type:', event.type);
    return Response.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('[WEBHOOK_ERROR] Fatal error:', error.message);
    console.error('[WEBHOOK_ERROR] Stack:', error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});