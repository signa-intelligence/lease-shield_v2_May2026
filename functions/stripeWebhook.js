import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2023-10-16',
});

// Direct API call helper (bypasses SDK auth issues)
async function makeDirectApiCall(method, path, body = null) {
  const appId = Deno.env.get('BASE44_APP_ID');
  const baseUrl = 'https://api.base44.app'; // FIXED: .app not .com!
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-App-Id': appId,
      'X-Use-Service-Role': 'true',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const url = `${baseUrl}/v1/apps/${appId}${path}`; // FIXED: proper path structure
  console.log(`📞 API ${method} ${url}`);
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API Error (${response.status}):`, errorText);
    throw new Error(`API call failed: ${response.status} ${errorText}`);
  }
  
  return await response.json();
}

Deno.serve(async (req) => {
  console.log('=== STRIPE WEBHOOK RECEIVED ===');
  
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
      const customerId = session.customer;
      const email = session.customer_details?.email;
      
      // HANDLE CREDITS PURCHASE
      if (metadata.type === 'credits') {
        console.log('🪙 Processing CREDITS purchase');
        
        // Fetch all users via direct API
        const usersResponse = await makeDirectApiCall('GET', '/entities/User');
        const users = usersResponse.items || usersResponse || [];
        
        let user = users.find(u => 
          u.stripe_customer_id === customerId || u.email === email
        );

        if (!user) {
          console.error('❌ User not found for:', email, customerId);
          return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const creditsToAdd = parseInt(metadata.credits);
        const currentCredits = user.letter_credits || 0;
        const totalPurchased = user.total_credits_purchased || 0;

        // Update user via direct API
        await makeDirectApiCall('PATCH', `/entities/User/${user.id}`, {
          letter_credits: currentCredits + creditsToAdd,
          total_credits_purchased: totalPurchased + creditsToAdd
        });

        console.log('✅✅✅ CREDITS SUCCESSFULLY UPDATED! ✅✅✅');
        console.log('User:', user.email);
        console.log('Previous credits:', currentCredits);
        console.log('Added credits:', creditsToAdd);
        console.log('New balance:', currentCredits + creditsToAdd);

        // Create payment record via direct API
        await makeDirectApiCall('POST', '/entities/Payment', {
          type: 'addon',
          amount: parseFloat((session.amount_total / 100).toFixed(2)),
          currency: 'THB',
          provider: 'stripe',
          status: 'paid',
          external_id: session.id,
          created_by: user.email
        });

        // Send confirmation email
        const lang = user.language || 'en';
        const subject = lang === 'th' 
          ? `ซื้อเครดิต ${creditsToAdd} เครดิตสำเร็จ` 
          : `${creditsToAdd} Credits Purchased Successfully`;
        
        const emailBody = lang === 'th'
          ? `สวัสดี ${user.full_name},

เครดิตของคุณเพิ่มแล้ว! 🎉

• เครดิตที่ซื้อ: ${creditsToAdd}
• ยอดคงเหลือใหม่: ${currentCredits + creditsToAdd}
• จำนวนเงิน: ฿${(session.amount_total / 100).toLocaleString()}

ใช้เครดิตของคุณเพื่อสร้างจดหมายทางกฎหมายมืออาชีพได้ทันที

— ทีม Lease Shield`
          : `Hi ${user.full_name},

Your credits have been added! 🎉

• Credits Purchased: ${creditsToAdd}
• New Balance: ${currentCredits + creditsToAdd}
• Amount Paid: ฿${(session.amount_total / 100).toLocaleString()}

Use your credits to generate professional legal letters instantly.

— The Lease Shield Team`;

        await makeDirectApiCall('POST', '/integrations/Core/SendEmail', {
          to: user.email,
          subject,
          body: emailBody
        });

        console.log('✅ Email sent to:', user.email);

        // 🆕 SEND LINE NOTIFICATION IF USER HAS TOKEN
        if (user.line_messaging_token && user.line_notifications) {
          console.log('📱 Sending LINE notification...');
          
          const lineMessage = lang === 'th'
            ? `🎉 เครดิตเพิ่มแล้ว!\n\nคุณซื้อ ${creditsToAdd} เครดิต\nยอดคงเหลือ: ${currentCredits + creditsToAdd} เครดิต\n\nใช้สร้างจดหมายได้ทันที 📝`
            : `🎉 Credits Added!\n\nYou purchased ${creditsToAdd} credits\nNew Balance: ${currentCredits + creditsToAdd} credits\n\nStart generating letters now 📝`;

          try {
            const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')}`
              },
              body: JSON.stringify({
                to: user.line_messaging_token,
                messages: [{ type: 'text', text: lineMessage }]
              })
            });

            if (lineResponse.ok) {
              console.log('✅ LINE notification sent!');
            } else {
              const errorText = await lineResponse.text();
              console.error('⚠️ LINE notification failed:', errorText);
            }
          } catch (lineError) {
            console.error('⚠️ LINE notification error:', lineError.message);
          }
        }

        return Response.json({ ok: true, credited: creditsToAdd }, { status: 200 });
      }
      
      // HANDLE SUBSCRIPTION
      if (session.mode === 'subscription') {
        console.log('💳 Processing SUBSCRIPTION');
        
        const usersResponse = await makeDirectApiCall('GET', '/entities/User');
        const users = usersResponse.items || usersResponse || [];
        
        let user = users.find(u => 
          u.stripe_customer_id === customerId || u.email === email
        );

        if (user) {
          console.log('✅ Subscription processed for:', user.email);
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
    console.error('Error details:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});