import { createClient } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';
import { format } from 'npm:date-fns@2.30.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2023-10-16',
});

// Initialize Base44 client with service role ONCE at the top level
const appId = Deno.env.get('BASE44_APP_ID');
console.log('🔑 App ID:', appId ? 'FOUND' : 'MISSING');

const base44 = createClient({
  appId: appId,
  useServiceRole: true,
});

console.log('✅ Base44 client initialized with service role');

Deno.serve(async (req) => {
  console.log('=== WEBHOOK RECEIVED ===');
  
  try {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('Webhook_stripe');
    
    if (!signature || !webhookSecret) {
      return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    const body = await req.text();
    let event = JSON.parse(body);

    console.log('Processing event type:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const metadata = session.metadata || {};
        
        if (metadata.type === 'credits') {
          console.log('🪙 Processing CREDITS purchase');
          
          console.log('📞 Calling base44.entities.User.list()...');
          const users = await base44.entities.User.list();
          console.log('✅ Got users:', users.length);
          
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
            const creditsToAdd = parseInt(metadata.credits);
            const currentCredits = user.letter_credits || 0;

            await base44.entities.User.update(user.id, {
              letter_credits: currentCredits + creditsToAdd,
              total_credits_purchased: (user.total_credits_purchased || 0) + creditsToAdd
            });

            console.log('✅✅✅ CREDITS SUCCESSFULLY UPDATED! ✅✅✅');

            await base44.entities.Payment.create({
              type: 'addon',
              amount: parseFloat((session.amount_total / 100).toFixed(2)),
              currency: 'THB',
              provider: 'stripe',
              status: 'paid',
              external_id: session.id
            });

            const subject = user.language === 'th' 
              ? `ซื้อเครดิต ${creditsToAdd} เครดิตสำเร็จ` 
              : `${creditsToAdd} Credits Purchased`;
            
            const emailBody = `Credits: ${creditsToAdd}\nNew Balance: ${currentCredits + creditsToAdd}`;

            await base44.integrations.Core.SendEmail({
              to: user.email,
              subject,
              body: emailBody
            });
          } else {
            console.error('❌ User not found');
          }
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('❌ WEBHOOK ERROR:', error);
    console.error('Error name:', error.name);
    console.error('Error status:', error.status);
    console.error('Error code:', error.code);
    if (error.data) {
      console.error('Error data:', JSON.stringify(error.data, null, 2));
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});