
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2023-10-16',
});

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
      
      const base44 = createClientFromRequest(req);
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      
      // HANDLE CREDITS PURCHASE
      if (metadata.type === 'credits') {
        console.log('🪙 Processing CREDITS purchase');
        
        const users = await base44.asServiceRole.entities.User.list();
        
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

        await base44.asServiceRole.entities.User.update(user.id, {
          letter_credits: currentCredits + creditsToAdd,
          total_credits_purchased: totalPurchased + creditsToAdd
        });

        console.log('✅✅✅ CREDITS SUCCESSFULLY UPDATED! ✅✅✅');
        console.log('User:', user.email);
        console.log('Previous credits:', currentCredits);
        console.log('Added credits:', creditsToAdd);
        console.log('New balance:', currentCredits + creditsToAdd);

        await base44.asServiceRole.entities.Payment.create({
          type: 'addon',
          amount: parseFloat((session.amount_total / 100).toFixed(2)),
          currency: 'THB',
          provider: 'stripe',
          status: 'paid',
          external_id: session.id,
          created_by: user.email
        });

        const lang = user.language || 'en';
        const subject = lang === 'th' 
          ? `ซื้อเครดิต ${creditsToAdd} เครดิตสำเร็จ` 
          : `${creditsToAdd} Credits Purchased Successfully`;
        
        const emailBody = lang === 'th'
          ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #C7A338, #B89330); padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">💰 ซื้อเครดิตสำเร็จ</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>สวัสดี <strong>${user.full_name}</strong>,</p>
              <p>เครดิตของคุณเพิ่มแล้ว! 🎉</p>
              <p style="background: #FFF7ED; padding: 16px; border-radius: 8px; border-left: 4px solid #C7A338;">
                <strong>เครดิตที่ซื้อ:</strong> ${creditsToAdd}<br/>
                <strong>ยอดคงเหลือใหม่:</strong> ${currentCredits + creditsToAdd}<br/>
                <strong>จำนวนเงิน:</strong> ฿${(session.amount_total / 100).toLocaleString()}
              </p>
              <p>ใช้เครดิตของคุณเพื่อสร้างจดหมายทางกฎหมายมืออาชีพได้ทันที</p>
              <p><a href="https://app.leaseshield.asia/templates" style="color: #0C3B2E; font-weight: bold;">ดูเทมเพลต →</a></p>
              <p style="margin-top: 24px;">— ทีม Lease Shield</p>
            </div>
          </div>
          `
          : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #C7A338, #B89330); padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">💰 Credits Purchase Successful</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Hi <strong>${user.full_name}</strong>,</p>
              <p>Your credits have been added! 🎉</p>
              <p style="background: #FFF7ED; padding: 16px; border-radius: 8px; border-left: 4px solid #C7A338;">
                <strong>Credits Purchased:</strong> ${creditsToAdd}<br/>
                <strong>New Balance:</strong> ${currentCredits + creditsToAdd}<br/>
                <strong>Amount Paid:</strong> ฿${(session.amount_total / 100).toLocaleString()}
              </p>
              <p>Use your credits to generate professional legal letters instantly.</p>
              <p><a href="https://app.leaseshield.asia/templates" style="color: #0C3B2E; font-weight: bold;">View Templates →</a></p>
              <p style="margin-top: 24px;">— The Lease Shield Team</p>
            </div>
          </div>
          `;

        // Send via Resend with no-reply@leaseshield.asia
        if (RESEND_API_KEY) {
          try {
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
              console.log('✅ Credits email sent via Resend. Message ID:', resendData.id);
            } else {
              console.error('❌ Resend email failed:', resendData);
            }
          } catch (emailError) {
            console.error('❌ Email error:', emailError);
          }
        }

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
      
      // ✅ HANDLE SUBSCRIPTION WITH INCLUDED CREDITS!
      if (session.mode === 'subscription' && metadata.plan) {
        console.log('💳💳💳 Processing SUBSCRIPTION UPGRADE! 💳💳💳');
        console.log('Plan:', metadata.plan);
        console.log('Interval:', metadata.interval);
        
        const users = await base44.asServiceRole.entities.User.list();
        
        let user = users.find(u => 
          u.stripe_customer_id === customerId || u.email === email
        );

        if (!user) {
          console.error('❌ User not found for:', email, customerId);
          return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch subscription details from Stripe
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1
        });

        if (subscriptions.data.length === 0) {
          console.error('❌ No active subscription found');
          return Response.json({ error: 'No active subscription' }, { status: 404 });
        }

        const subscription = subscriptions.data[0];
        
        // ✅ CRITICAL FIX: Use correct period end date
        const renewalTimestamp = subscription.current_period_end;
        const renewalDate = new Date(renewalTimestamp * 1000).toISOString();
        
        console.log('📅 Subscription dates:');
        console.log('  Start:', new Date(subscription.current_period_start * 1000).toISOString());
        console.log('  End:', renewalDate);
        console.log('  Interval:', metadata.interval);

        // ✅ CALCULATE INCLUDED LETTER CREDITS
        const includedCredits = {
          'lite': 3,
          'protect': 5,
          'secure': 10
        };
        const creditsToAdd = includedCredits[metadata.plan] || 0;
        const currentCredits = user.letter_credits || 0;
        
        console.log('💳 Adding included credits:');
        console.log('  Plan:', metadata.plan);
        console.log('  Current credits:', currentCredits);
        console.log('  Credits to add:', creditsToAdd);
        console.log('  New balance:', currentCredits + creditsToAdd);

        // ✅ UPDATE USER PLAN + ADD CREDITS
        await base44.asServiceRole.entities.User.update(user.id, {
          plan_tier: metadata.plan,
          billing_interval: metadata.interval,
          plan_renews_at: renewalDate,
          stripe_subscription_id: subscription.id,
          subscription_status: 'active',
          letter_credits: currentCredits + creditsToAdd // ✅ ADD INCLUDED CREDITS!
        });

        console.log('✅✅✅ SUBSCRIPTION + CREDITS SUCCESSFULLY UPDATED! ✅✅✅');
        console.log('User:', user.email);
        console.log('New plan:', metadata.plan);
        console.log('Billing:', metadata.interval);
        console.log('Renews:', renewalDate);
        console.log('Letter credits:', currentCredits + creditsToAdd);

        // Create payment record
        await base44.asServiceRole.entities.Payment.create({
          type: 'subscription',
          amount: parseFloat((session.amount_total / 100).toFixed(2)),
          currency: 'THB',
          provider: 'stripe',
          status: 'paid',
          external_id: session.id,
          created_by: user.email
        });

        // Send confirmation email via Resend
        const lang = user.language || 'en';
        const planLabels = {
          lite: { en: 'Lite', th: 'ไลท์' },
          protect: { en: 'Protect', th: 'โปรเทค' },
          secure: { en: 'Secure', th: 'ซีเคียว' }
        };

        const planLabel = planLabels[metadata.plan]?.[lang] || metadata.plan;
        const intervalLabel = metadata.interval === 'year' 
          ? (lang === 'th' ? 'รายปี' : 'Annual')
          : (lang === 'th' ? 'รายเดือน' : 'Monthly');

        const subject = lang === 'th'
          ? `ยินดีต้อนรับสู่ Lease Shield ${planLabel}!`
          : `Welcome to Lease Shield ${planLabel}!`;

        const emailBody = lang === 'th'
          ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #8B5CF6, #7C3AED); padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">🎉 ยินดีต้อนรับสู่ ${planLabel}!</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>สวัสดี <strong>${user.full_name}</strong>,</p>
              <p>การสมัครสมาชิกของคุณเปิดใช้งานแล้ว! 🎉</p>
              <p style="background: #F5F3FF; padding: 16px; border-radius: 8px; border-left: 4px solid #8B5CF6;">
                <strong>แผน:</strong> ${planLabel}<br/>
                <strong>การเรียกเก็บเงิน:</strong> ${intervalLabel}<br/>
                <strong>ต่ออายุเมื่อ:</strong> ${new Date(renewalDate).toLocaleDateString('th-TH')}<br/>
                <strong>จำนวนเงิน:</strong> ฿${(session.amount_total / 100).toLocaleString()}<br/>
                <strong>เครดิตจดหมาย:</strong> ${currentCredits + creditsToAdd}
              </p>
              <p>คุณสามารถเข้าถึงฟีเจอร์ทั้งหมดในแผนของคุณได้แล้ว</p>
              <p><a href="https://app.leaseshield.asia/account" style="color: #0C3B2E; font-weight: bold;">ดูบัญชีของคุณ →</a></p>
              <p style="margin-top: 24px;">— ทีม Lease Shield</p>
            </div>
          </div>
          `
          : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #8B5CF6, #7C3AED); padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">🎉 Welcome to ${planLabel}!</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Hi <strong>${user.full_name}</strong>,</p>
              <p>Your subscription is now active! 🎉</p>
              <p style="background: #F5F3FF; padding: 16px; border-radius: 8px; border-left: 4px solid #8B5CF6;">
                <strong>Plan:</strong> ${planLabel}<br/>
                <strong>Billing:</strong> ${intervalLabel}<br/>
                <strong>Renews:</strong> ${new Date(renewalDate).toLocaleDateString('en-US')}<br/>
                <strong>Amount:</strong> ฿${(session.amount_total / 100).toLocaleString()}<br/>
                <strong>Letter Credits:</strong> ${currentCredits + creditsToAdd}
              </p>
              <p>You now have access to all features in your plan.</p>
              <p><a href="https://app.leaseshield.asia/account" style="color: #0C3B2E; font-weight: bold;">View Your Account →</a></p>
              <p style="margin-top: 24px;">— The Lease Shield Team</p>
            </div>
          </div>
          `;

        // Send via Resend with no-reply@leaseshield.asia
        if (RESEND_API_KEY) {
          try {
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
              console.log('✅ Subscription email sent via Resend. Message ID:', resendData.id);
            } else {
              console.error('❌ Resend email failed:', resendData);
            }
          } catch (emailError) {
            console.error('❌ Email error:', emailError);
          }
        }

        // ✅ FIXED LINE NOTIFICATION - USE CORRECT DATE!
        if (user.line_messaging_token && user.line_notifications) {
          console.log('📱 Sending LINE subscription notification...');
          
          // Format date for LINE display
          const displayDate = new Date(renewalDate);
          const formattedDate = lang === 'th'
            ? displayDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
            : displayDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          
          const lineMessage = lang === 'th'
            ? `🎉 ยินดีต้อนรับสู่ ${planLabel}!\n\nการสมัครสมาชิกของคุณเปิดใช้งานแล้ว\nต่ออายุ: ${formattedDate}\nเครดิตจดหมาย: ${currentCredits + creditsToAdd}\n\nเข้าถึงฟีเจอร์ทั้งหมดได้เลย 🚀`
            : `🎉 Welcome to ${planLabel}!\n\nYour subscription is now active\nRenews: ${formattedDate}\nLetter Credits: ${currentCredits + creditsToAdd}\n\nAccess all features now 🚀`;

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
              console.log('✅ LINE subscription notification sent with date:', formattedDate);
            }
          } catch (lineError) {
            console.error('⚠️ LINE notification error:', lineError.message);
          }
        }

        return Response.json({ ok: true, plan: metadata.plan }, { status: 200 });
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
