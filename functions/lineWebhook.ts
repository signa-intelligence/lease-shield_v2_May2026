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
        
        // Handle "confirm" command for initial linking
        if (messageText === 'confirm') {
          if (user) {
            // Already linked
            const alreadyLinkedMsg = language === 'th'
              ? `✅ คุณเชื่อมต่ออยู่แล้ว\n\n📧 ${user.email}\n⭐ แผน: ${user.plan_tier || 'free'}\n\nส่ง "ช่วยเหลือ" เพื่อดูคำสั่ง`
              : `✅ Already Connected\n\n📧 ${user.email}\n⭐ Plan: ${user.plan_tier || 'free'}\n\nSend "help" for commands`;
            
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: userId,
              message: alreadyLinkedMsg
            });
          } else {
            // New connection - find user with pending connection
            const pendingUser = users.find(u => u.pending_line_connection === true);
            
            if (pendingUser) {
              // Link tenant account
              await base44.asServiceRole.entities.User.update(pendingUser.id, {
                line_messaging_token: userId,
                line_user_id: userId,
                line_notifications: true,
                pending_line_connection: null
              });
              
              console.log(`✅ Linked LINE ${userId} to tenant ${pendingUser.email}`);
              
              const confirmMsg = pendingUser.language === 'th'
                ? `✅ เชื่อมต่อสำเร็จ!\n\nบัญชี Lease Shield ของคุณเชื่อมต่อแล้ว\n\n📧 ${pendingUser.email}\n⭐ แผน: ${pendingUser.plan_tier || 'free'}\n\nคุณจะได้รับการแจ้งเตือนที่สำคัญทาง LINE ตั้งแต่นี้เป็นต้นไป`
                : `✅ Connected Successfully!\n\nYour Lease Shield account is now linked\n\n📧 ${pendingUser.email}\n⭐ Plan: ${pendingUser.plan_tier || 'free'}\n\nYou'll receive important alerts via LINE from now on`;
              
              await base44.asServiceRole.functions.invoke('sendLineMessage', {
                userId: userId,
                message: confirmMsg
              });
            } else {
              // No pending user - ask them to initiate from app
              const noAccountMsg = language === 'th'
                ? `⚠️ ยังไม่พบบัญชีที่รอเชื่อมต่อ\n\nกรุณา:\n1. เข้าสู่ระบบที่ app.leaseshield.asia\n2. ไปที่ บัญชี → การแจ้งเตือน LINE\n3. กดปุ่ม "เชื่อมต่อ LINE"\n4. กลับมาส่ง "confirm" อีกครั้ง`
                : `⚠️ No pending account found\n\nPlease:\n1. Log in at app.leaseshield.asia\n2. Go to Account → LINE Notifications\n3. Click "Connect LINE"\n4. Come back and send "confirm"`;
              
              await base44.asServiceRole.functions.invoke('sendLineMessage', {
                userId: userId,
                message: noAccountMsg
              });
            }
          }
          continue;
        }
        
        // Handle "confirm landlord [email]" or "confirm juristic [email]"
        if (messageText.startsWith('confirm landlord ') || messageText.startsWith('confirm juristic ')) {
          const parts = messageText.split(' ');
          const role = parts[1]; // 'landlord' or 'juristic'
          const userEmail = parts[2]; // tenant's email
          
          if (!userEmail || !userEmail.includes('@')) {
            const invalidMsg = language === 'th'
              ? `⚠️ รูปแบบไม่ถูกต้อง\n\nใช้: confirm landlord [อีเมลผู้เช่า]\nหรือ: confirm juristic [อีเมลผู้เช่า]`
              : `⚠️ Invalid format\n\nUse: confirm landlord [tenant email]\nOr: confirm juristic [tenant email]`;
            
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: userId,
              message: invalidMsg
            });
            continue;
          }
          
          // Find the tenant account
          const tenantUser = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
          
          if (!tenantUser) {
            const notFoundMsg = language === 'th'
              ? `❌ ไม่พบบัญชี ${userEmail}\n\nตรวจสอบอีเมลให้ถูกต้อง`
              : `❌ Account not found: ${userEmail}\n\nPlease check the email address`;
            
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: userId,
              message: notFoundMsg
            });
            continue;
          }
          
          // Link landlord or juristic LINE to tenant's account
          const updateData = role === 'landlord'
            ? { landlord_line_token: userId }
            : { juristic_line_token: userId };
          
          await base44.asServiceRole.entities.User.update(tenantUser.id, updateData);
          
          console.log(`✅ Linked ${role} LINE ${userId} to tenant ${tenantUser.email}`);
          
          const roleLabel = role === 'landlord' 
            ? (language === 'th' ? 'เจ้าของบ้าน' : 'Landlord')
            : (language === 'th' ? 'นิติบุคคล' : 'Juristic');
          
          const linkedMsg = language === 'th'
            ? `✅ เชื่อมต่อสำเร็จ!\n\n🏷️ บทบาท: ${roleLabel}\n📧 ผู้เช่า: ${tenantUser.email}\n\nคุณจะได้รับการแจ้งเตือนเกี่ยวกับ:\n${role === 'landlord' ? '• คำขอซ่อมบำรุง\n• การแจ้งเตือนเงินประกัน\n• อัปเดตสัญญาเช่า' : '• คำขอซ่อมบำรุง\n• สถานะการดำเนินงาน\n• การสื่อสารกับผู้เช่า'}`
            : `✅ Connected Successfully!\n\n🏷️ Role: ${roleLabel}\n📧 Tenant: ${tenantUser.email}\n\nYou'll receive notifications about:\n${role === 'landlord' ? '• Maintenance requests\n• Deposit reminders\n• Lease updates' : '• Maintenance requests\n• Operation status\n• Tenant communications'}`;
          
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: userId,
            message: linkedMsg
          });
          
          // Notify tenant
          if (tenantUser.line_messaging_token) {
            const tenantNotifMsg = tenantUser.language === 'th'
              ? `✅ ${roleLabel}ของคุณเชื่อมต่อ LINE แล้ว!\n\nพวกเขาจะได้รับการแจ้งเตือนอัตโนมัติตั้งแต่นี้`
              : `✅ Your ${roleLabel} connected to LINE!\n\nThey will receive automatic notifications from now on`;
            
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: tenantUser.line_messaging_token,
              message: tenantNotifMsg
            });
          }
          
          continue;
        }
        
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