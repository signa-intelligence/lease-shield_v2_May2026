import { createClient } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';
import { format } from 'npm:date-fns@2.30.0';

// === WEBHOOK FIX - USE SERVICE ROLE CLIENT ===
const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2023-10-16',
});

// Initialize Base44 client for webhooks (no request headers needed)
const base44 = createClient({
  appId: Deno.env.get('BASE44_APP_ID'),
  useServiceRole: true, // Service role for server-to-server operations
});

Deno.serve(async (req) => {
  console.log('=== WEBHOOK RECEIVED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Timestamp:', new Date().toISOString());
  
  const key = Deno.env.get('SK_TEST_secret_key');
  console.log('🔑 Using Stripe key:', key?.substring(0, 15));
  console.log('🔑 Key type:', key?.startsWith('sk_test_') ? 'TEST ✅' : 'LIVE ❌');
  
  try {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('Webhook_stripe');
    
    console.log('Has signature:', !!signature);
    console.log('Has webhook secret:', !!webhookSecret);
    console.log('Webhook secret (first 10 chars):', webhookSecret?.substring(0, 10));
    
    if (!signature || !webhookSecret) {
      console.error('MISSING:', { signature: !!signature, webhookSecret: !!webhookSecret });
      return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    const body = await req.text();
    console.log('Body length:', body.length);
    
    let event;
    try {
      const payload = JSON.parse(body);
      event = payload;
      console.log('✅ Event received:', event.type);
      console.log('Event ID:', event.id);
      console.log('Event created:', new Date(event.created * 1000).toISOString());
    } catch (err) {
      console.error('❌ Event parsing failed:', err.message);
      return Response.json({ error: `Webhook processing failed: ${err.message}` }, { status: 400 });
    }

    console.log('Base44 client created');

    // Map price IDs to plan tiers
    const planMap = {
      'price_1SM6qtQwoI6NhlUxgDDy2LuJ': { tier: 'lite', interval: 'monthly' },
      'price_1SM6rhQwoI6NhlUxZIN3WekE': { tier: 'protect', interval: 'monthly' },
      'price_1SM6t9QwoI6NhlUxy5Pl7Rrq': { tier: 'secure', interval: 'monthly' },
      'price_1SNqjfQwoI6NhlUxk9LwivBm': { tier: 'lite', interval: 'annual' },
      'price_1SNqkMQwoI6NhlUxHb2VADjs': { tier: 'protect', interval: 'annual' },
      'price_1SNqkxQwoI6NhlUx09mj0Lur': { tier: 'secure', interval: 'annual' }
    };

    console.log('Processing event type:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('=== CHECKOUT SESSION COMPLETED ===');
        const session = event.data.object;
        const customerId = session.customer;
        const metadata = session.metadata || {};
        
        console.log('Customer ID:', customerId);
        console.log('Metadata:', JSON.stringify(metadata, null, 2));
        
        // Handle credit purchase
        if (metadata.type === 'credits') {
          console.log('🪙 Processing CREDITS purchase');
          
          const users = await base44.entities.User.list();
          const user = users.find(u => u.stripe_customer_id === customerId);
          
          if (!user) {
            console.error('❌ USER NOT FOUND for customer:', customerId);
            
            // Try to find by email as fallback
            if (session.customer_details?.email) {
              console.log('🔍 Trying to find user by email:', session.customer_details.email);
              const userByEmail = users.find(u => u.email === session.customer_details.email);
              if (userByEmail) {
                console.log('✅ Found user by email! Updating stripe_customer_id...');
                await base44.entities.User.update(userByEmail.id, {
                  stripe_customer_id: customerId
                });
                
                const creditsToAdd = parseInt(metadata.credits);
                const currentCredits = userByEmail.letter_credits || 0;
                const totalPurchased = userByEmail.total_credits_purchased || 0;

                console.log(`Current credits: ${currentCredits}`);
                console.log(`Adding: ${creditsToAdd}`);
                console.log(`New balance will be: ${currentCredits + creditsToAdd}`);

                await base44.entities.User.update(userByEmail.id, {
                  letter_credits: currentCredits + creditsToAdd,
                  total_credits_purchased: totalPurchased + creditsToAdd
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

                const lang = userByEmail.language || 'en';
                const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://app.leaseshield.asia';
                const subject = lang === 'th' 
                  ? `ซื้อเครดิต ${creditsToAdd} เครดิตสำเร็จ` 
                  : `${creditsToAdd} Credits Purchased Successfully`;
                
                const body = lang === 'th'
                  ? `สวัสดี ${userByEmail.full_name},

เครดิตของคุณเพิ่มแล้ว! 🎉

• เครดิตที่ซื้อ: ${creditsToAdd}
• ยอดคงเหลือใหม่: ${currentCredits + creditsToAdd}
• จำนวนเงิน: ฿${(session.amount_total / 100).toLocaleString()}

ใช้เครดิตของคุณเพื่อสร้างจดหมายทางกฎหมายมืออาชีพได้ทันที
เข้าถึงเทมเพลตทั้ง 11 แบบ ทั้งภาษาอังกฤษและไทย

เริ่มสร้างจดหมาย: ${appBaseUrl}/templates

— ทีม Lease Shield`
                  : `Hi ${userByEmail.full_name},

Your credits have been added! 🎉

• Credits Purchased: ${creditsToAdd}
• New Balance: ${currentCredits + creditsToAdd}
• Amount Paid: ฿${(session.amount_total / 100).toLocaleString()}

Use your credits to generate professional legal letters instantly.
Access all 11 templates in both English and Thai.

Start generating: ${appBaseUrl}/templates

— The Lease Shield Team`;

                await base44.integrations.Core.SendEmail({
                  to: userByEmail.email,
                  subject,
                  body
                });
                console.log('✅ Confirmation email sent');
                console.log('=== CREDITS PROCESSING COMPLETE (via email lookup) ===');
                break;
              } else {
                console.error('❌ User not found by email either!');
              }
            }
            
            console.error('❌ CANNOT PROCESS - User not found');
            break;
          }

          const creditsToAdd = parseInt(metadata.credits);
          const currentCredits = user.letter_credits || 0;
          const totalPurchased = user.total_credits_purchased || 0;

          console.log(`✅ Found user: ${user.email}`);
          console.log(`Current credits: ${currentCredits}`);
          console.log(`Adding: ${creditsToAdd}`);
          console.log(`New balance will be: ${currentCredits + creditsToAdd}`);

          await base44.entities.User.update(user.id, {
            letter_credits: currentCredits + creditsToAdd,
            total_credits_purchased: totalPurchased + creditsToAdd
          });

          console.log('✅✅✅ CREDITS SUCCESSFULLY UPDATED! ✅✅✅');
          console.log('Updated user:', {
            email: user.email,
            creditsAdded: creditsToAdd,
            newBalance: currentCredits + creditsToAdd
          });

          await base44.entities.Payment.create({
            type: 'addon',
            amount: parseFloat((session.amount_total / 100).toFixed(2)),
            currency: 'THB',
            provider: 'stripe',
            status: 'paid',
            external_id: session.id
          });

          const lang = user.language || 'en';
          const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://app.leaseshield.asia';
          const subject = lang === 'th' 
            ? `ซื้อเครดิต ${creditsToAdd} เครดิตสำเร็จ` 
            : `${creditsToAdd} Credits Purchased Successfully`;
          
          const body = lang === 'th'
            ? `สวัสดี ${user.full_name},

เครดิตของคุณเพิ่มแล้ว! 🎉

• เครดิตที่ซื้อ: ${creditsToAdd}
• ยอดคงเหลือใหม่: ${currentCredits + creditsToAdd}
• จำนวนเงิน: ฿${(session.amount_total / 100).toLocaleString()}

ใช้เครดิตของคุณเพื่อสร้างจดหมายทางกฎหมายมืออาชีพได้ทันที
เข้าถึงเทมเพลตทั้ง 11 แบบ ทั้งภาษาอังกฤษและไทย

เริ่มสร้างจดหมาย: ${appBaseUrl}/templates

— ทีม Lease Shield`
            : `Hi ${user.full_name},

Your credits have been added! 🎉

• Credits Purchased: ${creditsToAdd}
• New Balance: ${currentCredits + creditsToAdd}
• Amount Paid: ฿${(session.amount_total / 100).toLocaleString()}

Use your credits to generate professional legal letters instantly.
Access all 11 templates in both English and Thai.

Start generating: ${appBaseUrl}/templates

— The Lease Shield Team`;

          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject,
            body
          });
          console.log('✅ Confirmation email sent');
          console.log('=== CREDITS PROCESSING COMPLETE ===');
          break;
        }
        
        // Handle case payment (Resolve service)
        if (metadata.type === 'case') {
          console.log('Processing CASE payment');
          console.log('Not a case payment, metadata.type:', metadata.type);
          
          const users = await base44.entities.User.list();
          const user = users.find(u => u.stripe_customer_id === customerId);

          if (!user) {
            console.error('❌ User not found for customer:', customerId);
            break;
          }

          const now = new Date();
          const ackDue = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          
          const caseData = {
            user_email: user.email,
            dispute_amount: parseFloat(metadata.dispute_amount),
            summary: metadata.summary,
            lease_id: metadata.lease_id || null,
            fast_track: metadata.fast_track === 'true',
            letter_pack: metadata.letter_pack === 'true',
            is_member_at_creation: metadata.is_member_at_creation === 'true',
            status: 'pending_review',
            sla: {
              ack_due: ackDue.toISOString()
            },
            timeline: [{
              timestamp: new Date().toISOString(),
              event: 'case_created',
              actor: 'system',
              meta: {
                payment_id: session.id,
                amount_paid: metadata.total_paid
              }
            }],
            checklist: {
              intake_ok: false,
              id_verified: false,
              evidence_reviewed: false,
              letters_drafted: false
            }
          };

          const newCase = await base44.entities.Case.create(caseData);
          console.log('✅ Case created:', newCase.id);

          await base44.entities.Payment.create({
            type: 'case',
            amount: parseFloat(metadata.total_paid),
            currency: 'THB',
            provider: 'stripe',
            status: 'paid',
            external_id: session.id
          });

          const language = user.language || 'en';
          const userSubject = language === 'th' ? 'เคสของคุณเริ่มดำเนินการแล้ว' : 'Your Resolve Case Has Started';
          const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://app.leaseshield.asia';
          const userBody = language === 'th' ?
            `สวัสดี ${user.full_name},\n\nเคส Resolve ของคุณเริ่มดำเนินการแล้ว\nทีมงานจะติดต่อคุณภายใน 24-48 ชั่วโมง\n\nรายละเอียดคดี:\n- เลขที่คดี: ${newCase.id.slice(0, 8)}\n- จำนวนเงินที่พิพาท: ฿${metadata.dispute_amount}\n\nตรวจสอบสถานะคดี: ${appBaseUrl}/cases\n\n— Lease Shield` :
            `Hi ${user.full_name},\n\nYour Resolve case has started.\nOur team will contact you within 24-48 hours.\n\nCase Details:\n- Case ID: ${newCase.id.slice(0, 8)}\n- Dispute Amount: ฿${metadata.dispute_amount}\n\nCheck case status: ${appBaseUrl}/cases\n\n— Lease Shield`;

          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: userSubject,
            body: userBody
          });

          const opsBody = `New Resolve Case Payment Confirmed

Case ID: ${newCase.id}
User: ${user.full_name} (${user.email})
Amount Paid: ฿${metadata.total_paid}

ACK DUE: ${format(ackDue, 'MMM d, yyyy h:mm a')}

View in Ops Console: ${appBaseUrl}/ops-console`;

          await base44.integrations.Core.SendEmail({
            to: 'ops@leaseshield.asia',
            subject: `🚨 New Resolve Case #${newCase.id.slice(0, 8)}`,
            body: opsBody
          });
          
          console.log('=== CASE PROCESSING COMPLETE ===');
        } else {
          console.log('Not a case payment, metadata.type:', metadata.type);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price?.id;
          
          const planInfo = planMap[priceId];
          
          if (planInfo) {
            const users = await base44.entities.User.list();
            const user = users.find(u => u.stripe_customer_id === customerId);
            
            if (user) {
              const renewsAt = new Date(subscription.current_period_end * 1000).toISOString();
              
              const updateData = {
                subscription_status: 'active',
                plan_tier: planInfo.tier,
                billing_interval: planInfo.interval,
                plan_renews_at: renewsAt
              };
              
              const isNewSubscription = user.plan_tier === 'free' || !user.plan_tier;
              
              if (isNewSubscription) {
                const tierCredits = {
                  lite: 3,
                  protect: 5,
                  secure: 10
                };
                
                const tierStorage = {
                  lite: 1024,
                  protect: 5120,
                  secure: 20480
                };
                
                const creditsGranted = tierCredits[planInfo.tier] || 0;
                const storageAllocated = tierStorage[planInfo.tier] || 0;
                
                if (creditsGranted > 0) {
                  updateData.letter_credits = (user.letter_credits || 0) + creditsGranted;
                }
                
                if (storageAllocated > 0) {
                  updateData.storage_quota_mb = storageAllocated;
                }
              }
              
              if (planInfo.tier === 'lite') {
                updateData.scans_this_month = 0;
                const resetDate = new Date(subscription.current_period_end * 1000);
                updateData.scan_reset_date = resetDate.toISOString().split('T')[0];
              }
              
              await base44.entities.User.update(user.id, updateData);

              const language = user.language || 'en';
              const subject = language === 'th' ? 'แพ็กเกจ Lease Shield ของคุณเปิดใช้งานแล้ว' : 'Your Lease Shield Plan is Active';
              
              await base44.integrations.Core.SendEmail({
                to: user.email,
                subject,
                body: `Your ${planInfo.tier.toUpperCase()} plan is now active.`
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
        
        const planInfo = planMap[priceId];
        
        if (planInfo) {
          const users = await base44.entities.User.list();
          const user = users.find(u => u.stripe_customer_id === customerId);
          
          if (user) {
            const renewsAt = new Date(subscription.current_period_end * 1000).toISOString();
            const isCancelled = subscription.cancel_at_period_end || subscription.status === 'canceled';
            const status = subscription.status === 'active' && !isCancelled ? 'active' 
                        : subscription.status === 'canceled' || isCancelled ? 'cancelled' 
                        : 'none';
            
            await base44.entities.User.update(user.id, {
              subscription_status: status,
              plan_tier: status === 'active' ? planInfo.tier : user.plan_tier,
              billing_interval: status === 'active' ? planInfo.interval : user.billing_interval,
              plan_renews_at: renewsAt
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        const users = await base44.entities.User.list();
        const user = users.find(u => u.stripe_customer_id === customerId);
        
        if (user) {
          await base44.entities.User.update(user.id, {
            subscription_status: 'none',
            plan_tier: 'free',
            billing_interval: null,
            plan_renews_at: null
          });

          const language = user.language || 'en';
          const subject = language === 'th' ? 'บัญชีของคุณถูกเปลี่ยนเป็นแผนฟรี' : 'Your Account Has Been Moved to Free Plan';
          
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject,
            body: 'Your subscription has ended. You can upgrade anytime from your Account page.'
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        
        const users = await base44.entities.User.list();
        const user = users.find(u => u.stripe_customer_id === customerId);
        
        if (user) {
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: 'Payment Failed - Action Required',
            body: 'Your recent payment failed. Please update your payment method.'
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    console.log('=== WEBHOOK COMPLETE ===');
    return Response.json({ received: true });
  } catch (error) {
    console.error('❌ WEBHOOK ERROR:', error);
    console.error('Error stack:', error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});