import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!signature || !webhookSecret) {
      return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    const body = await req.text();
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      return Response.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Handle different event types
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price?.id;
          
          // Map price IDs to plan tiers
          const planMap = {
            'price_1SM6qtQwoI6NhlUxgDDy2LuJ': 'lite',
            'price_1SM6rhQwoI6NhlUxZIN3WekE': 'protect',
            'price_1SM6t9QwoI6NhlUxy5Pl7Rrq': 'secure'
          };
          
          const planTier = planMap[priceId];
          
          if (planTier) {
            // Find user by Stripe customer ID
            const users = await base44.asServiceRole.entities.User.list();
            const user = users.find(u => u.stripe_customer_id === customerId);
            
            if (user) {
              const renewsAt = new Date(subscription.current_period_end * 1000).toISOString();
              
              await base44.asServiceRole.entities.User.update(user.id, {
                subscription_status: 'active',
                plan_tier: planTier,
                plan_renews_at: renewsAt
              });

              // Send notification email
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: user.email,
                subject: 'Your Lease Shield Plan is Active',
                body: `Your ${planTier.toUpperCase()} plan is now active. Thank you for subscribing!`
              });
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const priceId = subscription.items.data[0]?.price?.id;
        
        const planMap = {
          'price_1SM6qtQwoI6NhlUxgDDy2LuJ': 'lite',
          'price_1SM6rhQwoI6NhlUxZIN3WekE': 'protect',
          'price_1SM6t9QwoI6NhlUxy5Pl7Rrq': 'secure'
        };
        
        const planTier = planMap[priceId];
        
        if (planTier) {
          const users = await base44.asServiceRole.entities.User.list();
          const user = users.find(u => u.stripe_customer_id === customerId);
          
          if (user) {
            const renewsAt = new Date(subscription.current_period_end * 1000).toISOString();
            const status = subscription.status === 'active' ? 'active' : subscription.status === 'canceled' ? 'cancelled' : 'none';
            
            await base44.asServiceRole.entities.User.update(user.id, {
              subscription_status: status,
              plan_tier: status === 'active' ? planTier : 'free',
              plan_renews_at: renewsAt
            });
          }
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const metadata = session.metadata || {};
        
        // Handle case payment
        if (metadata.case_id) {
          const caseId = metadata.case_id;
          
          await base44.asServiceRole.entities.Payment.create({
            type: 'case',
            amount: session.amount_total / 100,
            currency: 'THB',
            provider: 'stripe',
            status: 'paid',
            external_id: session.id
          });

          await base44.asServiceRole.entities.Case.update(caseId, {
            status: 'active'
          });

          // Notify ops team
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: 'ops@leaseshield.asia',
            subject: 'New Resolve Case Payment Confirmed',
            body: `Case ${caseId} payment confirmed. Amount: ฿${session.amount_total / 100}`
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        
        const users = await base44.asServiceRole.entities.User.list();
        const user = users.find(u => u.stripe_customer_id === customerId);
        
        if (user) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: 'Payment Failed - Action Required',
            body: 'Your recent payment failed. Please update your payment method to continue your subscription.'
          });
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});