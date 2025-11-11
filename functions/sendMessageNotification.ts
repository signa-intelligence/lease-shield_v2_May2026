import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipientEmail, recipientName, senderName, subject, messagePreview, conversationId } = await req.json();

    if (!recipientEmail || !senderName || !subject || !messagePreview) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const conversationUrl = `${Deno.env.get('BASE44_APP_URL')}/conversation?id=${conversationId}`;

    // Send email notification
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipientEmail,
      from_name: 'Lease Shield',
      subject: `New message: ${subject}`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0C3B2E 0%, #047857 100%); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">💬 New Message</h1>
          </div>
          
          <div style="background: #FFFFFF; padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #1A1D1F; font-size: 16px; margin-bottom: 16px;">
              <strong>${senderName}</strong> sent you a message:
            </p>
            
            <div style="background: #F8FAFC; border-left: 4px solid #0C3B2E; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">
                ${subject}
              </p>
              <p style="color: #1A1D1F; font-size: 14px; margin: 0;">
                ${messagePreview}${messagePreview.length >= 100 ? '...' : ''}
              </p>
            </div>
            
            <a href="${conversationUrl}" style="display: inline-block; background: #0C3B2E; color: #FFFFFF; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              View & Reply
            </a>
            
            <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
              Lease Shield - Fair. Transparent. Protected.
            </p>
          </div>
        </div>
      `
    });

    // Try to send LINE notification if available
    try {
      // Get recipient user to check for LINE ID
      const recipientUsers = await base44.asServiceRole.entities.User.filter({ email: recipientEmail });
      const recipientUser = recipientUsers[0];

      if (recipientUser?.line_user_id) {
        await base44.asServiceRole.functions.invoke('sendLineMessage', {
          lineUserId: recipientUser.line_user_id,
          message: `💬 ข้อความใหม่จาก ${senderName}\n\n${subject}\n${messagePreview.substring(0, 80)}...`
        });
      }
    } catch (lineError) {
      console.error('LINE notification failed:', lineError);
      // Continue even if LINE fails
    }

    return Response.json({ 
      success: true,
      emailSent: true
    });

  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});