import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Send LINE message via Messaging API
 * Supports text and flex message formats
 * 
 * ENHANCED DEBUG VERSION - Shows exactly what's being sent
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const channelAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    
    if (!channelAccessToken) {
      console.error('❌ LINE_CHANNEL_ACCESS_TOKEN not configured');
      return Response.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' }, { status: 500 });
    }

    const body = await req.json();
    console.log('📥 Request body received:', JSON.stringify(body, null, 2));
    
    const { userId, message, flexMessage } = body;
    
    if (!userId) {
      console.error('❌ Missing userId');
      return Response.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (!message && !flexMessage) {
      console.error('❌ Missing both message and flexMessage');
      return Response.json({ error: 'Missing message or flexMessage' }, { status: 400 });
    }

    // Construct messages array
    const messages = [];
    
    if (flexMessage) {
      console.log('✅ Flex message detected!');
      console.log('📦 flexMessage structure:', JSON.stringify(flexMessage, null, 2));
      
      const lineFlexMessage = {
        type: 'flex',
        altText: flexMessage.altText || 'Lease Shield Notification',
        contents: flexMessage.contents
      };
      
      messages.push(lineFlexMessage);
      console.log('📤 Final LINE Flex message to send:', JSON.stringify(lineFlexMessage, null, 2));
    } else {
      console.log('📝 Plain text message mode');
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
    
    console.log('🚀 Complete LINE API payload:', JSON.stringify(linePayload, null, 2));
    
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify(linePayload)
    });

    const responseText = await response.text();
    
    console.log('📊 LINE API Response Status:', response.status);
    console.log('📊 LINE API Response Headers:', JSON.stringify([...response.headers.entries()]));
    console.log('📊 LINE API Response Body:', responseText);
    
    if (!response.ok) {
      console.error('❌ LINE API error:', response.status, responseText);
      throw new Error(`LINE API error ${response.status}: ${responseText}`);
    }

    console.log(`✅ LINE message sent successfully!`);

    return Response.json({ 
      success: true,
      sentAt: new Date().toISOString(),
      lineResponse: responseText,
      sentFlexMessage: !!flexMessage,
      messageType: flexMessage ? 'flex' : 'text'
    });

  } catch (error) {
    console.error('❌ LINE message error:', error);
    console.error('Stack:', error.stack);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});