import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const channelAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    if (!channelAccessToken) {
      return Response.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' }, { status: 500 });
    }

    console.log('[RICH_MENU] Creating rich menu...');

    // Create rich menu with 2x3 grid layout
    const richMenuResponse = await fetch('https://api.line.me/v2/bot/richmenu', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        size: { width: 2500, height: 1686 },
        selected: true,
        name: 'Lease Shield Menu',
        chatBarText: '📋 Menu',
        areas: [
          // Top row: Dashboard | Deposits | Cases
          {
            bounds: { x: 0, y: 0, width: 833, height: 843 },
            action: { type: 'uri', uri: 'https://app.leaseshield.asia' }
          },
          {
            bounds: { x: 833, y: 0, width: 834, height: 843 },
            action: { type: 'message', text: 'deposit' }
          },
          {
            bounds: { x: 1667, y: 0, width: 833, height: 843 },
            action: { type: 'message', text: 'cases' }
          },
          // Bottom row: Status | Help
          {
            bounds: { x: 0, y: 843, width: 1250, height: 843 },
            action: { type: 'message', text: 'status' }
          },
          {
            bounds: { x: 1250, y: 843, width: 1250, height: 843 },
            action: { type: 'message', text: 'help' }
          }
        ]
      })
    });

    if (!richMenuResponse.ok) {
      const error = await richMenuResponse.text();
      throw new Error(`Rich menu creation failed: ${error}`);
    }

    const richMenu = await richMenuResponse.json();
    console.log('[RICH_MENU] Created:', richMenu.richMenuId);

    return Response.json({
      success: true,
      richMenuId: richMenu.richMenuId,
      nextSteps: [
        '1. Design a 2500x1686px image with 5 button areas:',
        '   Top row (3 equal): 🏠 Dashboard | 💰 Deposits | ⚖️ Cases',
        '   Bottom row (2 equal): 📊 Status | ❓ Help',
        '2. Upload image: POST /v2/bot/richmenu/{richMenuId}/content',
        '3. Set as default: POST /v2/bot/user/all/richmenu/{richMenuId}',
        'Or configure via LINE Official Account Manager at manager.line.biz'
      ]
    });

  } catch (error) {
    console.error('[RICH_MENU_ERROR]', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});