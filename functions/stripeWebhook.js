import Stripe from 'npm:stripe@14.10.0';
import { format } from 'npm:date-fns@2.30.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2023-10-16',
});

// Use direct API calls instead of SDK to bypass auth
const APP_ID = Deno.env.get('BASE44_APP_ID');
const BASE_URL = `https://api.base44.com/apps/${APP_ID}`;

async function makeAuthenticatedRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-App-Id': APP_ID,
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

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
          
          // Get all users
          console.log('📞 Fetching users via API...');
          const users = await makeAuthenticatedRequest('/entities/User/records');
          console.log('✅ Got users:', users.length);
          
          let user = users.find(u => u.stripe_customer_id === customerId);
          
          if (!user && session.customer_details?.email) {
            user = users.find(u => u.email === session.customer_details.email);
            if (user) {
              await makeAuthenticatedRequest(`/entities/User/records/${user.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ stripe_customer_id: customerId })
              });
            }
          }

          if (user) {
            const creditsToAdd = parseInt(metadata.credits);
            const currentCredits = user.letter_credits || 0;

            await makeAuthenticatedRequest(`/entities/User/records/${user.id}`, {
              method: 'PATCH',
              body: JSON.stringify({
                letter_credits: currentCredits + creditsToAdd,
                total_credits_purchased: (user.total_credits_purchased || 0) + creditsToAdd
              })
            });

            console.log('✅✅✅ CREDITS SUCCESSFULLY UPDATED! ✅✅✅');

            // Create payment record
            await makeAuthenticatedRequest('/entities/Payment/records', {
              method: 'POST',
              body: JSON.stringify({
                type: 'addon',
                amount: parseFloat((session.amount_total / 100).toFixed(2)),
                currency: 'THB',
                provider: 'stripe',
                status: 'paid',
                external_id: session.id
              })
            });

            // Send email via integration
            await makeAuthenticatedRequest('/integrations/Core/InvokeLLM', {
              method: 'POST',
              body: JSON.stringify({
                to: user.email,
                subject: user.language === 'th' 
                  ? `ซื้อเครดิต ${creditsToAdd} เครดิตสำเร็จ` 
                  : `${creditsToAdd} Credits Purchased`,
                body: `Credits: ${creditsToAdd}\nNew Balance: ${currentCredits + creditsToAdd}`
              })
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
    console.error('Error message:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});