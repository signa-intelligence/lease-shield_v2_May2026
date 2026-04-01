/**
 * Send LINE message via Messaging API
 * Supports text and flex message formats
 * 
 * Called by other backend functions via base44.asServiceRole.functions.invoke()
 * Tier gating is done by the CALLER (e.g. sendMaintenanceNotification)
 * 
 * Required Secrets:
 * - LINE_CHANNEL_ACCESS_TOKEN: LINE Messaging API channel access token
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const channelAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    
    if (!channelAccessToken) {
      console.error('[LINE] LINE_CHANNEL_ACCESS_TOKEN not configured');
      return Response.json({ 
        success: false, 
        error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' 
      }, { status: 500 });
    }

    const body = await req.json();
    const { userId, message, flexMessage } = body;
    
    console.log('[LINE] Request received:', { 
      userId: userId ? `${String(userId).slice(0, 8)}...` : 'MISSING',
      hasMessage: !!message,
      hasFlexMessage: !!flexMessage
    });
    
    if (!userId) {
      console.error('[LINE] Missing userId');
      return Response.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    if (!message && !flexMessage) {
      console.error('[LINE] Missing both message and flexMessage');
      return Response.json({ success: false, error: 'Missing message or flexMessage' }, { status: 400 });
    }

    // Build messages array
    const messages = [];
    
    if (flexMessage) {
      messages.push({
        type: 'flex',
        altText: flexMessage.altText || message || 'Lease Shield Notification',
        contents: flexMessage.contents
      });
    } else {
      messages.push({
        type: 'text',
        text: message
      });
    }

    const linePayload = {
      to: userId,
      messages: messages
    };
    
    console.log('[LINE] Sending to LINE API:', { 
      to: `${String(userId).slice(0, 8)}...`,
      messageCount: messages.length,
      messageType: flexMessage ? 'flex' : 'text'
    });
    
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify(linePayload)
    });

    const responseText = await response.text();
    
    console.log('[LINE] API Response:', { 
      status: response.status, 
      body: responseText.slice(0, 200)
    });
    
    if (!response.ok) {
      console.error('[LINE] API error:', response.status, responseText);
      return Response.json({ 
        success: false,
        error: `LINE API ${response.status}: ${responseText}`
      }, { status: response.status });
    }

    console.log('[LINE] Message sent successfully');

    return Response.json({ 
      success: true,
      sentAt: new Date().toISOString(),
      messageType: flexMessage ? 'flex' : 'text'
    });

  } catch (error) {
    console.error('[LINE] Error:', error.message);
    return Response.json({ 
      success: false,
      error: error.message
    }, { status: 500 });
  }
});