import { createClient } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2023-10-16',
});

const PRICE_CREDIT_MAP = {
  'price_1SR2b5QwoI6NhlUxbwA8JfsS': 1,
  'price_1SR2dLQwoI6NhlUxv0TkEsiZ': 3,
  'price_1SR2gVQwoI6NhlUxbkNkf6r4': 5,
  'price_1SR2hXQwoI6NhlUxwahfstoL': 10,
};

const base44 = createClient({
  appId: Deno.env.get('BASE44_APP_ID'),
  useServiceRole: true,
});

Deno.serve(async (req) => {
  console.log('=== LETTER CREDITS WEBHOOK RECEIVED ===');
  
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
      const email = session.customer_details?.email;
      const customerId = session.customer;

      if (!email && !customerId) {
        console.warn('No email or customer ID');
        return Response.json({ ok: true }, { status: 200 });
      }

      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items.data.price'],
      });

      const items = fullSession.line_items?.data || [];
      let totalCredits = 0;

      for (const item of items) {
        const price = item.price;
        const qty = item.quantity || 1;
        const perCredits = PRICE_CREDIT_MAP[price.id] || 0;
        totalCredits += perCredits * qty;
      }

      if (totalCredits <= 0) {
        console.log('No matching credits for session:', session.id);
        return Response.json({ ok: true }, { status: 200 });
      }

      const users = await base44.entities.User.list();
      const user = users.find(u => 
        u.stripe_customer_id === customerId || u.email === email
      );

      if (!user) {
        console.error('User not found for:', email, customerId);
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      const currentCredits = user.letter_credits || 0;
      const totalPurchased = user.total_credits_purchased || 0;

      await base44.entities.User.update(user.id, {
        letter_credits: currentCredits + totalCredits,
        total_credits_purchased: totalPurchased + totalCredits
      });

      console.log('✅ Credited', totalCredits, 'to', user.email);
      console.log('Previous:', currentCredits, 'New:', currentCredits + totalCredits);

      await base44.entities.Payment.create({
        type: 'addon',
        amount: parseFloat((session.amount_total / 100).toFixed(2)),
        currency: 'THB',
        provider: 'stripe',
        status: 'paid',
        external_id: session.id
      });

      const lang = user.language || 'en';
      const appBaseUrl = 'https://app.leaseshield.asia';
      const subject = lang === 'th' 
        ? `ซื้อเครดิต ${totalCredits} เครดิตสำเร็จ` 
        : `${totalCredits} Credits Purchased Successfully`;
      
      const emailBody = lang === 'th'
        ? `สวัสดี ${user.full_name},

เครดิตของคุณเพิ่มแล้ว! 🎉

• เครดิตที่ซื้อ: ${totalCredits}
• ยอดคงเหลือใหม่: ${currentCredits + totalCredits}
• จำนวนเงิน: ฿${(session.amount_total / 100).toLocaleString()}

ใช้เครดิตของคุณเพื่อสร้างจดหมายทางกฎหมายมืออาชีพได้ทันที
เข้าถึงเทมเพลตทั้ง 11 แบบ ทั้งภาษาอังกฤษและไทย

เริ่มสร้างจดหมาย: ${appBaseUrl}/templates

— ทีม Lease Shield`
        : `Hi ${user.full_name},

Your credits have been added! 🎉

• Credits Purchased: ${totalCredits}
• New Balance: ${currentCredits + totalCredits}
• Amount Paid: ฿${(session.amount_total / 100).toLocaleString()}

Use your credits to generate professional legal letters instantly.
Access all 11 templates in both English and Thai.

Start generating: ${appBaseUrl}/templates

— The Lease Shield Team`;

      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject,
        body: emailBody
      });

      console.log('✅ Email sent');
      console.log('=== COMPLETE ===');
      
      return Response.json({ ok: true, credited: totalCredits }, { status: 200 });
    }

    console.log('Event not handled:', event.type);
    return Response.json({ ok: true }, { status: 200 });
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});