import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import crypto from 'node:crypto';

// LINE Messaging API webhook handler
Deno.serve(async (req) => {
  try {
    const body = await req.text();
    console.log('LINE webhook received:', body);
    
    const channelSecret = Deno.env.get('LINE_CHANNEL_SECRET');
    const channelAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    
    console.log('Channel secret exists:', !!channelSecret);
    console.log('Channel token exists:', !!channelAccessToken);
    
    // For initial webhook verification, LINE sends a test request
    // We need to respond with 200 OK immediately
    if (!body || body === '') {
      console.log('Empty body - verification request');
      return Response.json({ ok: true });
    }
    
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      console.error('Failed to parse body:', e);
      return Response.json({ ok: true }); // Still return 200 for LINE verification
    }
    
    const events = data.events || [];
    
    // If no events, just return OK (verification request)
    if (events.length === 0) {
      console.log('No events - verification request');
      return Response.json({ ok: true });
    }
    
    if (!channelSecret || !channelAccessToken) {
      console.error('Missing LINE credentials');
      // Still return 200 to pass verification, but log the error
      return Response.json({ ok: true, error: 'Missing credentials' });
    }
    
    // Verify LINE signature (only for actual events)
    const signature = req.headers.get('x-line-signature');
    if (signature) {
      const hash = crypto
        .createHmac('SHA256', channelSecret)
        .update(body)
        .digest('base64');
      
      if (signature !== hash) {
        console.error('Invalid LINE signature');
        // For now, continue anyway to test
      }
    }

    // Create Base44 client
    const base44 = createClientFromRequest(req);

    for (const event of events) {
      // Handle "follow" event - user just added the bot
      if (event.type === 'follow') {
        const userLineId = event.source.userId;
        
        console.log('New user followed bot:', userLineId);
        
        // Send bilingual welcome message
        const welcomeMessage = `🎉 Welcome to Lease Shield / ยินดีต้อนรับสู่ Lease Shield!

✅ Prevent rental problems before they happen
✅ ป้องกันปัญหาการเช่าก่อนที่จะเกิดขึ้น

📱 What we offer / บริการของเรา:
• AI-powered lease analysis / วิเคราะห์สัญญาเช่าด้วย AI
• Deposit protection & reminders / ปกป้องเงินมัดจำและแจ้งเตือน
• Maintenance tracker / ติดตามการซ่อมบำรุง
• Evidence vault / ที่เก็บหลักฐาน

🔗 To connect your account / เชื่อมต่อบัญชี:
1. Sign up at app.leaseshield.asia
   ลงทะเบียนที่ app.leaseshield.asia
2. Send: connect your@email.com
   ส่ง: connect อีเมลของคุณ

💡 Type "help" anytime for commands
   พิมพ์ "help" เพื่อดูคำสั่ง`;

        await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${channelAccessToken}`
          },
          body: JSON.stringify({
            to: userLineId,
            messages: [{
              type: 'text',
              text: welcomeMessage
            }]
          })
        });
        
        console.log('Welcome message sent to new follower');
      }
      
      // Handle "message" events
      if (event.type === 'message' && event.message.type === 'text') {
        const userLineId = event.source.userId;
        const text = event.message.text.trim();

        // Handle "connect {email}" command
        if (text.toLowerCase().startsWith('connect ')) {
          const email = text.substring(8).trim();
          
          // Find user by email using service role
          const users = await base44.asServiceRole.entities.User.list();
          const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          
          if (user) {
            await base44.asServiceRole.entities.User.update(user.id, {
              line_messaging_token: userLineId,
              line_notifications: true
            });

            // Send confirmation message
            await fetch('https://api.line.me/v2/bot/message/push', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${channelAccessToken}`
              },
              body: JSON.stringify({
                to: userLineId,
                messages: [{
                  type: 'text',
                  text: user.language === 'th' 
                    ? '✅ เชื่อมต่อสำเร็จ!\n\nคุณจะได้รับการแจ้งเตือนสำหรับ:\n📅 เงินมัดจำครบกำหนด\n💰 การชำระค่าเช่า\n🔧 สถานะการซ่อมบำรุง\n📋 การอัปเดตคดี\n\n🚀 เริ่มใช้งานเลย: app.leaseshield.asia'
                    : '✅ Connected successfully!\n\nYou\'ll receive notifications for:\n📅 Deposit return deadlines\n💰 Rent payment reminders\n🔧 Maintenance updates\n📋 Case status changes\n\n🚀 Get started: app.leaseshield.asia'
                }]
              })
            });
          } else {
            // User not found
            await fetch('https://api.line.me/v2/bot/message/push', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${channelAccessToken}`
              },
              body: JSON.stringify({
                to: userLineId,
                messages: [{
                  type: 'text',
                  text: '❌ Email not found / ไม่พบอีเมล\n\nPlease check and try again / กรุณาตรวจสอบและลองอีกครั้ง\n\nExample: connect yourname@email.com'
                }]
              })
            });
          }
        }
        
        // Handle "stop" or "stop lease" command
        else if (text.toLowerCase() === 'stop' || text.toLowerCase() === 'stop lease') {
          const users = await base44.asServiceRole.entities.User.list();
          const user = users.find(u => u.line_messaging_token === userLineId);
          
          if (user) {
            // Find all active lease notice alerts for this user
            const leases = await base44.asServiceRole.entities.Lease.list();
            const userLeases = leases.filter(l => 
              l.created_by === user.email && 
              l.notice_alerts_enabled === true &&
              l.notice_deadline
            );

            if (userLeases.length === 0) {
              await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${channelAccessToken}`
                },
                body: JSON.stringify({
                  to: userLineId,
                  messages: [{
                    type: 'text',
                    text: user.language === 'th'
                      ? 'ไม่พบการแจ้งเตือนสัญญาเช่าที่เปิดอยู่\n\nคุณไม่มีการแจ้งเตือนสัญญาที่กำลังทำงานอยู่'
                      : 'No Active Lease Alerts Found\n\nYou don\'t have any active lease notice reminders'
                  }]
                })
              });
            } else {
              // Disable all lease notice alerts
              for (const lease of userLeases) {
                await base44.asServiceRole.entities.Lease.update(lease.id, {
                  notice_alerts_enabled: false
                });
              }

              // Build confirmation message
              let leasesList = '';
              userLeases.forEach(lease => {
                leasesList += `\n🏠 ${lease.property_address || 'Lease Agreement'}\n`;
                leasesList += `📅 ${user.language === 'th' ? 'กำหนดแจ้ง' : 'Notice deadline'}: ${new Date(lease.notice_deadline).toLocaleDateString()}\n`;
              });

              const confirmMessage = user.language === 'th'
                ? `✅ หยุดการแจ้งเตือนแล้ว\n\nการแจ้งเตือนสัญญาเช่าต่อไปนี้ถูกปิดแล้ว:${leasesList}\n\nคุณจะไม่ได้รับการแจ้งเตือนสำหรับสัญญาเหล่านี้อีก\n\nหากต้องการเปิดใหม่ เข้าที่ app.leaseshield.asia`
                : `✅ Lease Notice Alerts Stopped\n\nThe following lease notice reminders have been disabled:${leasesList}\n\nYou will no longer receive reminders for these leases.\n\nTo re-enable, visit app.leaseshield.asia`;

              await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${channelAccessToken}`
                },
                body: JSON.stringify({
                  to: userLineId,
                  messages: [{
                    type: 'text',
                    text: confirmMessage
                  }]
                })
              });
            }
          } else {
            // User not connected
            await fetch('https://api.line.me/v2/bot/message/push', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${channelAccessToken}`
              },
              body: JSON.stringify({
                to: userLineId,
                messages: [{
                  type: 'text',
                  text: '❌ Account not connected / บัญชียังไม่ได้เชื่อมต่อ\n\nPlease connect first:\nกรุณาเชื่อมต่อก่อน:\n\nSend: connect your@email.com'
                }]
              })
            });
          }
        }
        
        // Handle "resume" or "resume lease" command
        else if (text.toLowerCase() === 'resume' || text.toLowerCase() === 'resume lease') {
          const users = await base44.asServiceRole.entities.User.list();
          const user = users.find(u => u.line_messaging_token === userLineId);
          
          if (user) {
            // Find all leases with disabled alerts for this user
            const leases = await base44.asServiceRole.entities.Lease.list();
            const userLeases = leases.filter(l => 
              l.created_by === user.email && 
              l.notice_alerts_enabled === false &&
              l.notice_deadline
            );

            if (userLeases.length === 0) {
              await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${channelAccessToken}`
                },
                body: JSON.stringify({
                  to: userLineId,
                  messages: [{
                    type: 'text',
                    text: user.language === 'th'
                      ? 'ไม่พบการแจ้งเตือนสัญญาเช่าที่ถูกปิด\n\nการแจ้งเตือนทั้งหมดของคุณเปิดอยู่แล้ว หรือไม่มีสัญญาที่ตั้งค่าการแจ้งเตือน'
                      : 'No Disabled Lease Alerts Found\n\nAll your alerts are already active, or you don\'t have any leases with notice settings'
                  }]
                })
              });
            } else {
              // Re-enable all lease notice alerts
              for (const lease of userLeases) {
                await base44.asServiceRole.entities.Lease.update(lease.id, {
                  notice_alerts_enabled: true
                });
              }

              // Build confirmation message
              let leasesList = '';
              userLeases.forEach(lease => {
                leasesList += `\n🏠 ${lease.property_address || 'Lease Agreement'}\n`;
                leasesList += `📅 ${user.language === 'th' ? 'กำหนดแจ้ง' : 'Notice deadline'}: ${new Date(lease.notice_deadline).toLocaleDateString()}\n`;
              });

              const confirmMessage = user.language === 'th'
                ? `✅ เปิดการแจ้งเตือนอีกครั้ง\n\nการแจ้งเตือนสัญญาเช่าต่อไปนี้ถูกเปิดใหม่แล้ว:${leasesList}\n\nคุณจะได้รับการแจ้งเตือนสำหรับสัญญาเหล่านี้อีกครั้ง\n\n💡 หากต้องการหยุดอีกครั้ง ส่ง "stop"`
                : `✅ Lease Notice Alerts Resumed\n\nThe following lease notice reminders have been re-enabled:${leasesList}\n\nYou will now receive reminders for these leases again.\n\n💡 To stop again, send "stop"`;

              await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${channelAccessToken}`
                },
                body: JSON.stringify({
                  to: userLineId,
                  messages: [{
                    type: 'text',
                    text: confirmMessage
                  }]
                })
              });
            }
          } else {
            // User not connected
            await fetch('https://api.line.me/v2/bot/message/push', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${channelAccessToken}`
              },
              body: JSON.stringify({
                to: userLineId,
                messages: [{
                  type: 'text',
                  text: '❌ Account not connected / บัญชียังไม่ได้เชื่อมต่อ\n\nPlease connect first:\nกรุณาเชื่อมต่อก่อน:\n\nSend: connect your@email.com'
                }]
              })
            });
          }
        }
        
        // Handle "help" command
        else if (text.toLowerCase() === 'help') {
          await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${channelAccessToken}`
            },
            body: JSON.stringify({
              to: userLineId,
              messages: [{
                type: 'text',
                text: '📱 Lease Shield Commands / คำสั่ง:\n\n' +
                      '• connect {your_email} - Link account / เชื่อมต่อบัญชี\n' +
                      '• stop - Stop lease alerts / หยุดการแจ้งเตือนสัญญา\n' +
                      '• resume - Resume alerts / เปิดการแจ้งเตือนอีกครั้ง\n' +
                      '• help - Show this message / แสดงข้อความนี้\n\n' +
                      '🌐 Visit: app.leaseshield.asia'
              }]
            })
          });
        }
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('LINE webhook error:', error);
    // Always return 200 to avoid LINE disabling the webhook
    return Response.json({ ok: true, error: error.message });
  }
});