import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Send LINE message via Messaging API
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const channelAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    
    const { userId, message } = await req.json();
    
    if (!userId || !message) {
      return Response.json({ error: 'Missing userId or message' }, { status: 400 });
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify({
        to: userId,
        messages: [{
          type: 'text',
          text: message
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`LINE API error: ${await response.text()}`);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('LINE message error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});