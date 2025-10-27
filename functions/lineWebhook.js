import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import crypto from 'node:crypto';

// LINE Messaging API webhook handler
Deno.serve(async (req) => {
  try {
    const channelSecret = Deno.env.get('LINE_CHANNEL_SECRET');
    const channelAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    
    // Verify LINE signature
    const signature = req.headers.get('x-line-signature');
    const body = await req.text();
    
    const hash = crypto
      .createHmac('SHA256', channelSecret)
      .update(body)
      .digest('base64');
    
    if (signature !== hash) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const events = JSON.parse(body).events;

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userLineId = event.source.userId;
        const text = event.message.text.trim();

        // Handle "connect {email}" command
        if (text.toLowerCase().startsWith('connect ')) {
          const email = text.substring(8).trim();
          
          // Find user by email
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
                    ? 'เชื่อมต่อสำเร็จ! ✅\nคุณจะได้รับการแจ้งเตือนเกี่ยวกับเงินมัดจำทาง LINE'
                    : 'Connected successfully! ✅\nYou\'ll now receive deposit reminders via LINE'
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
                  text: 'Email not found. Please check and try again.\nExample: connect yourname@email.com'
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
                text: 'Lease Shield Commands:\n\n• connect {your_email} - Link your account\n• status - Check connection status\n• help - Show this message'
              }]
            })
          });
        }
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('LINE webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});