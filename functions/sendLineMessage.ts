import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Send LINE message via Messaging API
 * Supports text and flex message formats
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const channelAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    
    if (!channelAccessToken) {
      return Response.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' }, { status: 500 });
    }

    const { userId, message, flexMessage } = await req.json();
    
    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (!message && !flexMessage) {
      return Response.json({ error: 'Missing message or flexMessage' }, { status: 400 });
    }

    // Construct messages array
    const messages = [];
    
    if (flexMessage) {
      messages.push({
        type: 'flex',
        altText: flexMessage.altText || 'Lease Shield Notification',
        contents: flexMessage.contents
      });
    } else {
      messages.push({
        type: 'text',
        text: message
      });
    }

    // Send via LINE Messaging API
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify({
        to: userId,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ LINE API error:', errorText);
      throw new Error(`LINE API error: ${errorText}`);
    }

    console.log(`✅ LINE message sent to ${userId}`);

    return Response.json({ 
      success: true,
      sentAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ LINE message error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});