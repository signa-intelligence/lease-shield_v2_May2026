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
    
    const channelSecret = Deno.env.get('LINE_CHANNEL_SECRET'); // LINE webhook signing secret
    if (!channelSecret) {
      console.error('❌ LINE_CHANNEL_SECRET not set');
      return Response.json({ error: 'Configuration error' }, { status: 500 });
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
        
        // Try to link to existing user based on userId parameter
        const replyToken = event.replyToken;
        
        // Send welcome message
        const language = 'en'; // Default, will be updated based on user preference
        const welcomeMessage = language === 'th'
          ? `🎉 ยินดีต้อนรับสู่ Lease Shield!\n\nคุณจะได้รับการแจ้งเตือนอัตโนมัติสำหรับ:\n\n📅 การแจ้งเตือนสัญญาเช่า\n💰 การคืนเงินมัดจำ\n🏠 การชำระค่าเช่า\n🔧 อัปเดตการซ่อมบำรุง\n\nกรุณาเข้าสู่ระบบที่ app.leaseshield.asia เพื่อเชื่อมต่อบัญชีของคุณ`
          : `🎉 Welcome to Lease Shield!\n\nYou'll receive automated alerts for:\n\n📅 Lease termination notices\n💰 Deposit returns\n🏠 Rent payments\n🔧 Maintenance updates\n\nPlease log in at app.leaseshield.asia to connect your account`;

        try {
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: userId,
            message: welcomeMessage
          });
          console.log('✅ Welcome message sent');
        } catch (error) {
          console.error('Failed to send welcome message:', error);
        }

        // Check if there's a pending user waiting to connect
        // (user clicked "Connect LINE" button and we're waiting for them to follow)
        const users = await base44.asServiceRole.entities.User.list();
        const pendingUser = users.find(u => u.pending_line_connection === true);
        
        if (pendingUser) {
          // Link this LINE user to the pending user account
          await base44.asServiceRole.entities.User.update(pendingUser.id, {
            line_messaging_token: userId,
            line_user_id: userId,
            line_notifications: true,
            pending_line_connection: null
          });
          
          console.log(`✅ Linked LINE ${userId} to user ${pendingUser.email}`);
          
          // Send confirmation
          const confirmMsg = pendingUser.language === 'th'
            ? `✅ เชื่อมต่อสำเร็จ!\n\nบัญชี Lease Shield ของคุณเชื่อมต่อแล้ว\n\n📧 ${pendingUser.email}\n\nคุณจะได้รับการแจ้งเตือนที่สำคัญทาง LINE ตั้งแต่นี้เป็นต้นไป`
            : `✅ Connected Successfully!\n\nYour Lease Shield account is now linked\n\n📧 ${pendingUser.email}\n\nYou'll receive important alerts via LINE from now on`;
          
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: userId,
            message: confirmMsg
          });
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
        const messageText = event.message.text.toLowerCase().trim();
        console.log(`💬 Message from ${userId}: ${messageText}`);
        
        // Find linked user
        const users = await base44.asServiceRole.entities.User.list();
        const user = users.find(u => u.line_messaging_token === userId || u.line_user_id === userId);
        
        const language = user?.language || 'en';
        
        // Simple command handling
        if (messageText === 'help' || messageText === 'ช่วยเหลือ') {
          const helpMsg = language === 'th'
            ? `📋 คำสั่ง Lease Shield:\n\n• "สถานะ" - ดูสถานะบัญชี\n• "มัดจำ" - ดูเงินมัดจำที่ติดตาม\n• "คดี" - ดูคดีที่เปิดอยู่\n• "ช่วยเหลือ" - แสดงข้อความนี้\n\nเปิดแอป: app.leaseshield.asia`
            : `📋 Lease Shield Commands:\n\n• "status" - View account status\n• "deposit" - Check deposits\n• "cases" - View open cases\n• "help" - Show this message\n\nOpen app: app.leaseshield.asia`;
          
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: userId,
            message: helpMsg
          });
        }
        else if (messageText === 'status' || messageText === 'สถานะ') {
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