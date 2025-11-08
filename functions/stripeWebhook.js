import { createClient } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2023-10-16',
});

const base44 = createClient({
  appId: Deno.env.get('BASE44_APP_ID'),
  useServiceRole: true,
});

Deno.serve(async (req) => {
  console.log('=== SUBSCRIPTION WEBHOOK RECEIVED ===');
  
  try {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('Webhook_stripe');
    
    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    const body = await req.text();
    let event = JSON.parse(body);

    console.log('Processing event type:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const metadata = session.metadata || {};
      
      // Skip if this is a credits purchase (handled by stripeLetterCreditsWebhook)
      if (metadata.type === 'credits') {
        console.log('⏭️ Credits purchase - handled by separate webhook');
        return Response.json({ ok: true }, { status: 200 });
      }
      
      // Only handle subscription events here
      if (session.mode === 'subscription') {
        console.log('💳 Processing SUBSCRIPTION');
        
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        
        const users = await base44.entities.User.list();
        let user = users.find(u => u.stripe_customer_id === customerId);
        
        if (!user && session.customer_details?.email) {
          user = users.find(u => u.email === session.customer_details.email);
          if (user) {
            await base44.entities.User.update(user.id, {
              stripe_customer_id: customerId
            });
          }
        }

        if (user) {
          console.log('✅ Subscription processed for:', user.email);
          // Subscription handling logic would go here
          return Response.json({ ok: true }, { status: 200 });
        } else {
          console.error('❌ User not found');
          return Response.json({ error: 'User not found' }, { status: 404 });
        }
      }
    }

    console.log('Event not handled:', event.type);
    return Response.json({ ok: true }, { status: 200 });
    
  } catch (error) {
    console.error('❌ WEBHOOK ERROR:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});