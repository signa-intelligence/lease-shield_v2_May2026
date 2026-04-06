import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { createHmac } from 'node:crypto';

/**
 * LINE Official Account Webhook Handler
 * Handles friend events (follow/unfollow) and message events
 * Links LINE users to LeaseShield accounts
 * 
 * Required Secrets:
 * - LINE_CHANNEL_SECRET: LINE webhook signature verification secret
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify LINE signature
    const signature = req.headers.get('x-line-signature');
    const body = await req.text();
    
    const channelSecret = Deno.env.get('LINE_CHANNEL_SECRET');
    // SECURITY FIX: Don't log secret existence
    if (!channelSecret) {
      console.error('[LINE_WEBHOOK_ERROR] Channel secret not configured');
      return new Response(JSON.stringify({ errorCode: 'CONFIG_ERROR', message: 'Configuration error', requestId: crypto.randomUUID().slice(0,8) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const hash = createHmac('sha256', channelSecret).update(body).digest('base64');
    
    if (hash !== signature) {
      console.error('❌ Invalid LINE signature');
      return Response.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const data = JSON.parse(body);
    console.log('📨 LINE Webhook received:', JSON.stringify(data, null, 2));

    if (!data.events || data.events.length === 0) {
      return Response.json({ message: 'No events' });
    }

    for (const event of data.events) {
      const userId = event.source.userId;
      
      // Handle FOLLOW event (user adds the OA)
      if (event.type === 'follow') {
        console.log(`👋 New follower: ${userId}`);

        // Smart detection: check if this LINE ID is already connected
        const allUsers = await base44.asServiceRole.entities.User.filter({});
        const connectedUser = allUsers.find(u => u.line_user_id === userId || u.line_messaging_token === userId);

        let welcomeMessage;

        if (connectedUser) {
          // Path C: Already connected user re-followed
          const lang = connectedUser.language || 'en';
          welcomeMessage = lang === 'th'
            ? `✅ เชื่อมต่อเรียบร้อยแล้ว!\n\nบัญชี Lease Shield ของคุณเชื่อมต่ออยู่\n\nคุณจะได้รับการแจ้งเตือนสำหรับ:\n📅 กำหนดสัญญาเช่า\n💰 การคืนเงินมัดจำ\n🏠 เตือนค่าเช่า\n🔧 อัปเดตซ่อมบำรุง\n\nเปิดแดชบอร์ด: https://app.leaseshield.asia\n\nพิมพ์ 'ช่วยเหลือ' เพื่อดูคำสั่ง`
            : `✅ You're all set!\n\nYour Lease Shield account is connected.\n\nYou'll receive notifications here for:\n📅 Lease deadlines\n💰 Deposit returns\n🏠 Rent reminders\n🔧 Maintenance updates\n\nView dashboard: https://app.leaseshield.asia\n\nType 'help' for commands`;

          // Re-enable notifications in case they were disabled
          await base44.asServiceRole.entities.User.update(connectedUser.id, {
            line_notifications: true
          });
          console.log(`✅ Re-enabled LINE for existing user: ${connectedUser.email}`);
        } else {
          // Check for pending connection
          const pendingUser = allUsers.find(u => u.pending_line_connection === true);

          if (pendingUser) {
            // Link this LINE user to the pending account
            await base44.asServiceRole.entities.User.update(pendingUser.id, {
              line_messaging_token: userId,
              line_user_id: userId,
              line_notifications: true,
              pending_line_connection: null,
              line_connected_at: new Date().toISOString()
            });
            console.log(`✅ Linked LINE ${userId} to pending user ${pendingUser.email}`);

            const lang = pendingUser.language || 'en';
            welcomeMessage = lang === 'th'
              ? `✅ เชื่อมต่อสำเร็จ!\n\nบัญชี Lease Shield ของคุณเชื่อมต่อแล้ว\n\n📧 ${pendingUser.email}\n\nคุณจะได้รับการแจ้งเตือนที่สำคัญทาง LINE ตั้งแต่นี้เป็นต้นไป`
              : `✅ Connected Successfully!\n\nYour Lease Shield account is now linked\n\n📧 ${pendingUser.email}\n\nYou'll receive important alerts via LINE from now on`;
          } else {
            // Path A: New user — direct to sign up
            welcomeMessage = `🎉 Welcome to Lease Shield!\n\nThailand's #1 rental protection platform.\n\n🔐 First, create your free account:\nhttps://app.leaseshield.asia\n\nAfter signing up, return here and type:\n'connect your@email.com'\n\nThis connects notifications to LINE.\n\nType 'help' for more info`;
          }
        }

        try {
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: userId,
            message: welcomeMessage
          });
          console.log('✅ Welcome message sent');
        } catch (error) {
          console.error('Failed to send welcome message:', error);
        }
      }
      
      // Handle UNFOLLOW event (user blocks/removes the OA)
      else if (event.type === 'unfollow') {
        console.log(`👋 User unfollowed: ${userId}`);
        
        // Find user and disable LINE notifications
        const users = await base44.asServiceRole.entities.User.list();
        const user = users.find(u => u.line_messaging_token === userId || u.line_user_id === userId);
        
        if (user) {
          await base44.asServiceRole.entities.User.update(user.id, {
            line_notifications: false,
            line_messaging_token: null
          });
          console.log(`✅ Disabled LINE for ${user.email}`);
        }
      }
      
      // Handle MESSAGE event (user sends a message to the OA)
      else if (event.type === 'message' && event.message.type === 'text') {
        const messageText = event.message.text.trim();
        const lowerText = messageText.toLowerCase();
        console.log(`💬 Message from ${userId}: ${messageText}`);
        
        // Find linked user
        const users = await base44.asServiceRole.entities.User.filter({});
        const user = users.find(u => u.line_messaging_token === userId || u.line_user_id === userId);
        
        const language = user?.language || 'en';

        // Handle "connect email@example.com" command
        if (lowerText.startsWith('connect ')) {
          const email = messageText.replace(/^connect\s+/i, '').trim().toLowerCase();

          if (!email.includes('@')) {
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: userId,
              message: `❌ Invalid email format.\n\nUsage: connect your@email.com\nExample: connect steve@example.com`
            });
          } else {
            const targetUser = users.find(u => u.email?.toLowerCase() === email);

            if (!targetUser) {
              await base44.asServiceRole.functions.invoke('sendLineMessage', {
                userId: userId,
                message: `❌ No account found with that email.\n\nCreate account first:\nhttps://app.leaseshield.asia`
              });
            } else if (targetUser.line_user_id && targetUser.line_user_id !== userId) {
              await base44.asServiceRole.functions.invoke('sendLineMessage', {
                userId: userId,
                message: `⚠️ This email is already connected to another LINE account.\n\nTo switch, disconnect from the other account first in Settings.`
              });
            } else {
              // Connect LINE to account
              await base44.asServiceRole.entities.User.update(targetUser.id, {
                line_user_id: userId,
                line_messaging_token: userId,
                line_notifications: true,
                line_connected_at: new Date().toISOString()
              });

              await base44.asServiceRole.functions.invoke('sendLineMessage', {
                userId: userId,
                message: `✅ Connected successfully!\n\nAccount: ${email}\n\nYou'll now receive notifications here for:\n📅 Lease deadlines\n💰 Deposit returns\n🏠 Rent reminders\n🔧 Maintenance updates\n\nView dashboard: https://app.leaseshield.asia`
              });

              // Create timeline event
              try {
                await base44.asServiceRole.entities.TimelineEvent.create({
                  owner_email: email,
                  event_type: 'lease_scanned',
                  title: 'LINE Notifications Connected',
                  description: 'LINE notifications successfully connected via connect command',
                  event_date: new Date().toISOString(),
                  source: 'system'
                });
              } catch (e) {
                console.warn('Timeline event creation failed (non-critical):', e.message);
              }
              console.log(`✅ Connected LINE ${userId} to ${email}`);
            }
          }
        }
        
        // Simple command handling
        else if (lowerText === 'help' || lowerText === 'ช่วยเหลือ') {
          const helpMsg = language === 'th'
            ? `📋 คำสั่ง Lease Shield:\n\n• "connect อีเมล" - เชื่อมต่อบัญชี\n• "สถานะ" - ดูสถานะบัญชี\n• "มัดจำ" - ดูเงินมัดจำที่ติดตาม\n• "คดี" - ดูคดีที่เปิดอยู่\n• "ช่วยเหลือ" - แสดงข้อความนี้\n\nเปิดแอป: app.leaseshield.asia`
            : `📋 Lease Shield Commands:\n\n• "connect email" - Link your account\n• "status" - View account status\n• "deposit" - Check deposits\n• "cases" - View open cases\n• "help" - Show this message\n\nOpen app: app.leaseshield.asia`;
          
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: userId,
            message: helpMsg
          });
        }
        else if (lowerText === 'status' || lowerText === 'สถานะ') {
          if (!user) {
            const notLinkedMsg = language === 'th'
              ? `⚠️ ยังไม่ได้เชื่อมต่อบัญชี\n\nกรุณาเข้าสู่ระบบที่ app.leaseshield.asia และกดปุ่ม "เชื่อมต่อ LINE"`
              : `⚠️ Account not linked\n\nPlease log in at app.leaseshield.asia and click "Connect LINE"`;
            
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: userId,
              message: notLinkedMsg
            });
          } else {
            const deposits = await base44.asServiceRole.entities.DepositTracker.filter({ created_by: user.email });
            const cases = await base44.asServiceRole.entities.Case.filter({ user_email: user.email });
            const activeDeposits = deposits.filter(d => d.status === 'tracking').length;
            const activeCases = cases.filter(c => !['closed', 'resolved'].includes(c.status)).length;
            
            const statusMsg = language === 'th'
              ? `📊 สถานะบัญชี Lease Shield\n\n👤 ${user.full_name}\n📧 ${user.email}\n⭐ แผน: ${user.plan_tier || 'free'}\n\n💰 มัดจำที่ติดตาม: ${activeDeposits}\n⚖️ คดีที่เปิด: ${activeCases}\n💳 เครดิตจดหมาย: ${user.letter_credits || 0}\n\nเปิดแอป: app.leaseshield.asia`
              : `📊 Lease Shield Status\n\n👤 ${user.full_name}\n📧 ${user.email}\n⭐ Plan: ${user.plan_tier || 'free'}\n\n💰 Tracking: ${activeDeposits} deposits\n⚖️ Active: ${activeCases} cases\n💳 Credits: ${user.letter_credits || 0}\n\nOpen app: app.leaseshield.asia`;
            
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: userId,
              message: statusMsg
            });
          }
        }
        else {
          // Default response
          const defaultMsg = language === 'th'
            ? `สวัสดี! 👋\n\nส่ง "ช่วยเหลือ" เพื่อดูคำสั่งที่ใช้ได้\n\nหรือเปิดแอป: app.leaseshield.asia`
            : `Hello! 👋\n\nSend "help" to see available commands\n\nOr open the app: app.leaseshield.asia`;
          
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: userId,
            message: defaultMsg
          });
        }
      }
    }

    return Response.json({ message: 'OK' });

  } catch (error) {
    console.error('❌ LINE Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});