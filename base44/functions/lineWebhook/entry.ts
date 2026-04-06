import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { createHmac } from 'node:crypto';

/**
 * LINE Official Account Webhook Handler
 * Handles friend events (follow/unfollow) and message events
 * Links LINE users to LeaseShield accounts
 * 
 * Required Secrets:
 * - LINE_CHANNEL_SECRET: LINE webhook signature verification secret
 */

// Helper to create LINE quick reply buttons
function qr(items) {
  return {
    items: items.map(item => ({
      type: 'action',
      action: item.uri
        ? { type: 'uri', label: item.label, uri: item.uri }
        : { type: 'message', label: item.label, text: item.text }
    }))
  };
}

const QR_MAIN = qr([
  { label: '🏠 Dashboard', uri: 'https://app.leaseshield.asia' },
  { label: '💰 Deposits', text: 'deposit' },
  { label: '📊 Status', text: 'status' },
  { label: '❓ Help', text: 'help' }
]);

const QR_CONNECT = qr([
  { label: '🏠 Dashboard', uri: 'https://app.leaseshield.asia' },
  { label: '❓ Help', text: 'help' }
]);

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

        // Check for unused connection tokens for this LINE user
        // (token passed via "link <token>" command after follow)
        // For now, just send appropriate welcome based on existing connection

        // Smart detection: check if this LINE ID is already connected
        const allUsers = await base44.asServiceRole.entities.User.filter({});
        const connectedUser = allUsers.find(u => u.line_user_id === userId || u.line_messaging_token === userId);

        let welcomeMessage;

        if (connectedUser) {
          // Already connected user re-followed
          const lang = connectedUser.language || 'en';
          welcomeMessage = lang === 'th'
            ? `✅ เชื่อมต่อเรียบร้อยแล้ว!\n\nคุณจะได้รับการแจ้งเตือนที่นี่สำหรับ:\n📅 กำหนดสัญญาเช่า\n💰 การคืนเงินมัดจำ\n🏠 เตือนค่าเช่า\n🔧 อัปเดตซ่อมบำรุง\n\n📱 เปิดแดชบอร์ด: app.leaseshield.asia\n\n💡 พิมพ์ 'ช่วยเหลือ' เมื่อต้องการดูคำสั่ง`
            : `✅ You're all set!\n\nYou'll receive notifications here for:\n📅 Lease deadlines\n💰 Deposit returns\n🏠 Rent reminders\n🔧 Maintenance updates\n\n📱 Open dashboard: app.leaseshield.asia\n\n💡 Type "help" anytime for commands`;

          await base44.asServiceRole.entities.User.update(connectedUser.id, {
            line_notifications: true
          });
          console.log(`✅ Re-enabled LINE for existing user: ${connectedUser.email}`);
        } else {
          // Check for pending connection
          const pendingUser = allUsers.find(u => u.pending_line_connection === true);

          if (pendingUser) {
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
              ? `✅ เชื่อมต่อสำเร็จ!\n\n📧 ${pendingUser.email}\n\nคุณจะได้รับการแจ้งเตือนที่สำคัญทาง LINE ตั้งแต่นี้เป็นต้นไป\n\n📱 เปิดแดชบอร์ด: app.leaseshield.asia\n\n💡 พิมพ์ 'ช่วยเหลือ' เมื่อต้องการดูคำสั่ง`
              : `✅ Connected Successfully!\n\n📧 ${pendingUser.email}\n\nYou'll receive important alerts via LINE from now on\n\n📱 Open dashboard: app.leaseshield.asia\n\n💡 Type "help" anytime for commands`;
          } else {
            // New user without existing account — prompt to connect or use token
            welcomeMessage = `🎉 Welcome to Lease Shield!\n\nThailand's #1 rental protection platform.\n\nTo connect your account:\n\n1️⃣ Have a connection token?\n   Type: link <your-token>\n\n2️⃣ Have an account?\n   Type: connect your@email.com\n\n3️⃣ New here?\n   📱 Sign up: app.leaseshield.asia\n\n💡 Type "help" for more commands`;
          }
        }

        try {
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: userId,
            message: welcomeMessage,
            quickReply: connectedUser ? QR_MAIN : QR_CONNECT
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
              message: `❌ Invalid email format.\n\nUsage: connect your@email.com\nExample: connect steve@example.com`,
              quickReply: QR_CONNECT
            });
          } else {
            const targetUser = users.find(u => u.email?.toLowerCase() === email);

            if (!targetUser) {
              await base44.asServiceRole.functions.invoke('sendLineMessage', {
                userId: userId,
                message: `❌ No account found with that email.\n\n📱 Create account first: app.leaseshield.asia`,
                quickReply: QR_CONNECT
              });
            } else if (targetUser.line_user_id && targetUser.line_user_id !== userId) {
              await base44.asServiceRole.functions.invoke('sendLineMessage', {
                userId: userId,
                message: `⚠️ This email is already connected to another LINE account.\n\nTo switch, disconnect from the other account first in Settings.`,
                quickReply: QR_CONNECT
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
                message: `✅ Connected successfully!\n\n📧 ${email}\n\nYou'll now receive notifications here for:\n📅 Lease deadlines\n💰 Deposit returns\n🏠 Rent reminders\n🔧 Maintenance updates\n\n💡 Use the buttons below to get started`,
                quickReply: QR_MAIN
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
        
        // Handle "link <token>" command for landlord/juristic connections
        else if (lowerText.startsWith('link ')) {
          const token = messageText.replace(/^link\s+/i, '').trim();

          if (!token || token.length < 10) {
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: userId,
              message: `❌ Invalid link token.\n\nPlease use the exact token from the Lease Shield app.`,
              quickReply: QR_CONNECT
            });
          } else {
            // Process the connection via the processLineConnection function
            try {
              const result = await base44.asServiceRole.functions.invoke('processLineConnection', {
                token: token,
                line_user_id: userId
              });

              if (result.data?.success) {
                const connType = result.data.connection_type;
                const addr = result.data.property_address || '';
                let successMsg;

                if (connType === 'user') {
                  successMsg = `✅ Connected successfully!\n\nYou'll now receive notifications here for:\n📅 Lease deadlines\n💰 Deposit returns\n🏠 Rent reminders\n🔧 Maintenance updates\n\n💡 Use the buttons below to get started`;
                } else if (connType === 'landlord') {
                  successMsg = `✅ Connected as landlord!\n\nProperty: ${addr}\n\nYou'll receive:\n🔧 Maintenance requests\n💰 Payment confirmations\n📝 Tenant communications\n\n💡 Use the buttons below to manage`;
                } else {
                  successMsg = `✅ Connected as juristic office!\n\nProperty: ${addr}\n\nYou'll receive:\n🏢 Move-in/out notices\n🔧 Maintenance reports\n📋 Building updates\n\n💡 Use the buttons below to manage`;
                }

                await base44.asServiceRole.functions.invoke('sendLineMessage', {
                  userId: userId,
                  message: successMsg,
                  quickReply: QR_MAIN
                });
              } else {
                await base44.asServiceRole.functions.invoke('sendLineMessage', {
                  userId: userId,
                  message: `❌ ${result.data?.error || 'Connection failed. The link may have expired.'}\n\nPlease request a new link from the Lease Shield app.`,
                  quickReply: QR_CONNECT
                });
              }
            } catch (e) {
              console.error('link command error:', e);
              await base44.asServiceRole.functions.invoke('sendLineMessage', {
                userId: userId,
                message: `❌ Connection failed. Please try again or request a new link.`,
                quickReply: QR_CONNECT
              });
            }
          }
        }
        
        // Simple command handling
        else if (lowerText === 'help' || lowerText === 'ช่วยเหลือ') {
          const helpMsg = language === 'th'
            ? `📋 Lease Shield\n\nใช้ปุ่มด้านล่างหรือพิมพ์คำสั่ง:\n\n• "สถานะ" — ดูสรุปบัญชี\n• "มัดจำ" — ดูเงินมัดจำ\n• "คดี" — ดูคดีที่เปิดอยู่\n• "link <token>" — เชื่อมต่อผ่าน QR\n• "connect อีเมล" — เชื่อมต่อบัญชี\n\nต้องการช่วยเหลือ? ติดต่อผ่านแอป`
            : `📋 Lease Shield\n\nUse the buttons below or type a command:\n\n• "status" — Account summary\n• "deposit" — View deposits\n• "cases" — Active cases\n• "link <token>" — Connect via QR\n• "connect email" — Link account\n\nNeed support? Contact us via the app.`;
          
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: userId,
            message: helpMsg,
            quickReply: QR_MAIN
          });
        }
        else if (lowerText === 'status' || lowerText === 'สถานะ') {
          if (!user) {
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: userId,
              message: language === 'th'
                ? `⚠️ ยังไม่ได้เชื่อมต่อบัญชี\n\nพิมพ์: connect your@email.com`
                : `⚠️ Account not linked\n\nType: connect your@email.com`,
              quickReply: QR_CONNECT
            });
          } else {
            const deposits = await base44.asServiceRole.entities.DepositTracker.filter({ created_by: user.email });
            const cases = await base44.asServiceRole.entities.Case.filter({ user_email: user.email });
            const activeDeposits = deposits.filter(d => d.status === 'tracking').length;
            const activeCases = cases.filter(c => !['closed', 'resolved'].includes(c.status)).length;
            
            const statusMsg = language === 'th'
              ? `📊 สถานะบัญชี Lease Shield\n\n👤 ${user.full_name}\n📧 ${user.email}\n⭐ แผน: ${(user.plan_tier || 'explorer').charAt(0).toUpperCase() + (user.plan_tier || 'explorer').slice(1)}\n\n💰 มัดจำที่ติดตาม: ${activeDeposits}\n⚖️ คดีที่เปิด: ${activeCases}\n💳 เครดิตจดหมาย: ${user.letter_credits || 0}`
              : `📊 Lease Shield Status\n\n👤 ${user.full_name}\n📧 ${user.email}\n⭐ Plan: ${(user.plan_tier || 'explorer').charAt(0).toUpperCase() + (user.plan_tier || 'explorer').slice(1)}\n\n💰 Tracking: ${activeDeposits} deposits\n⚖️ Active: ${activeCases} cases\n💳 Credits: ${user.letter_credits || 0}`;
            
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: userId,
              message: statusMsg,
              quickReply: QR_MAIN
            });
          }
        }
        // Handle "deposit" / "มัดจำ" command
        else if (lowerText === 'deposit' || lowerText === 'deposits' || lowerText === 'มัดจำ') {
          if (!user) {
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: userId,
              message: language === 'th' ? `⚠️ ยังไม่ได้เชื่อมต่อบัญชี\n\nพิมพ์: connect your@email.com` : `⚠️ Account not linked\n\nType: connect your@email.com`,
              quickReply: QR_CONNECT
            });
          } else {
            const deposits = await base44.asServiceRole.entities.DepositTracker.filter({ owner_email: user.email });
            const active = deposits.filter(d => !d.is_archived && d.status !== 'archived');
            
            if (active.length === 0) {
              await base44.asServiceRole.functions.invoke('sendLineMessage', {
                userId: userId,
                message: language === 'th'
                  ? `💰 ยังไม่มีเงินมัดจำที่ติดตาม\n\nเพิ่มเงินมัดจำแรกของคุณในแอปเพื่อเริ่มติดตามและรับการแจ้งเตือนอัตโนมัติ!`
                  : `💰 No deposits tracked yet.\n\nAdd your first deposit in the app to start tracking and get automatic return reminders!`,
                quickReply: qr([
                  { label: '🏠 Open App', uri: 'https://app.leaseshield.asia' },
                  { label: '📊 Status', text: 'status' },
                  { label: '❓ Help', text: 'help' }
                ])
              });
            } else {
              let depositText = language === 'th'
                ? `💰 เงินมัดจำของคุณ (${active.length}):\n\n`
                : `💰 Your Deposits (${active.length}):\n\n`;
              
              for (const d of active.slice(0, 5)) {
                const amt = d.deposit_amount ? `฿${d.deposit_amount.toLocaleString()}` : '-';
                const retDate = d.expected_return_date ? new Date(d.expected_return_date).toLocaleDateString('en-GB') : '-';
                const st = d.status === 'returned' ? '✅' : d.status === 'disputed' ? '⚠️' : '⏳';
                depositText += `${st} ${d.property_address || 'No address'}\n   💵 ${amt} • 📅 ${retDate}\n\n`;
              }
              if (active.length > 5) depositText += `...และอีก ${active.length - 5} รายการ\n\n`;
              depositText += language === 'th' ? 'ดูรายละเอียดเพิ่มเติมในแอป' : 'View full details in the app';
              
              await base44.asServiceRole.functions.invoke('sendLineMessage', {
                userId: userId,
                message: depositText,
                quickReply: QR_MAIN
              });
            }
          }
        }
        // Handle "cases" / "คดี" command
        else if (lowerText === 'case' || lowerText === 'cases' || lowerText === 'คดี') {
          if (!user) {
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: userId,
              message: language === 'th' ? `⚠️ ยังไม่ได้เชื่อมต่อบัญชี\n\nพิมพ์: connect your@email.com` : `⚠️ Account not linked\n\nType: connect your@email.com`,
              quickReply: QR_CONNECT
            });
          } else {
            const cases = await base44.asServiceRole.entities.Case.filter({ user_email: user.email });
            const activeCases = cases.filter(c => !['closed', 'resolved'].includes(c.status));
            
            if (activeCases.length === 0) {
              await base44.asServiceRole.functions.invoke('sendLineMessage', {
                userId: userId,
                message: language === 'th'
                  ? `⚖️ ไม่มีคดีที่เปิดอยู่\n\nต้องการช่วยเหลือเรื่องข้อพิพาทการเช่า? บริการ Resolve ของเราช่วยโดยไม่ต้องจ้างทนายความราคาแพง`
                  : `⚖️ No active cases.\n\nNeed help with a rental dispute? Our Resolve service provides professional support without expensive lawyers.`,
                quickReply: qr([
                  { label: '🏠 Open App', uri: 'https://app.leaseshield.asia' },
                  { label: '💰 Deposits', text: 'deposit' },
                  { label: '❓ Help', text: 'help' }
                ])
              });
            } else {
              let caseText = language === 'th'
                ? `⚖️ คดีที่เปิดอยู่ (${activeCases.length}):\n\n`
                : `⚖️ Active Cases (${activeCases.length}):\n\n`;
              
              for (const c of activeCases.slice(0, 5)) {
                const emoji = c.status === 'intake' ? '🟢' : c.status === 'in_progress' || c.status === 'under_review' ? '🟡' : '🟠';
                caseText += `${emoji} ${c.case_number || 'Case'}\n   📊 ${(c.status || '').replace(/_/g, ' ')}\n\n`;
              }
              caseText += language === 'th' ? 'ดูรายละเอียดและข้อความในแอป' : 'View details and messages in the app';
              
              await base44.asServiceRole.functions.invoke('sendLineMessage', {
                userId: userId,
                message: caseText,
                quickReply: QR_MAIN
              });
            }
          }
        }
        else {
          // Default response
          const defaultMsg = language === 'th'
            ? `สวัสดี! 👋\n\nใช้ปุ่มด้านล่างหรือพิมพ์ "ช่วยเหลือ" เพื่อดูคำสั่ง`
            : `Hello! 👋\n\nUse the buttons below or type "help" for commands`;
          
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: userId,
            message: defaultMsg,
            quickReply: QR_MAIN
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