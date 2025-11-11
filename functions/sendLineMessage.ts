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
      console.log('📦 Flex message received:', JSON.stringify(flexMessage, null, 2));
      messages.push({
        type: 'flex',
        altText: flexMessage.altText || 'Lease Shield Notification',
        contents: flexMessage.contents
      });
      console.log('📤 Sending to LINE:', JSON.stringify(messages[0], null, 2));
    } else {
      messages.push({
        type: 'text',
        text: message
      });
    }

    // Send via LINE Messaging API
    const linePayload = {
      to: userId,
      messages: messages
    };
    
    console.log('🚀 LINE API payload:', JSON.stringify(linePayload, null, 2));
    
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify(linePayload)
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ LINE API error:', response.status, responseText);
      throw new Error(`LINE API error ${response.status}: ${responseText}`);
    }

    console.log(`✅ LINE message sent successfully. Response:`, responseText);

    return Response.json({ 
      success: true,
      sentAt: new Date().toISOString(),
      lineResponse: responseText
    });

  } catch (error) {
    console.error('❌ LINE message error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});