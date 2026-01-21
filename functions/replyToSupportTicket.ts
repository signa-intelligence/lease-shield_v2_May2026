import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    
    const { ticket_id, message, is_admin = false } = await req.json();
    
    // Validate message
    if (!message || message.trim().length < 10) {
      return Response.json({ 
        success: false, 
        error: 'Message must be at least 10 characters' 
      }, { status: 400 });
    }
    
    if (message.length > 1000) {
      return Response.json({ 
        success: false, 
        error: 'Message must not exceed 1000 characters' 
      }, { status: 400 });
    }
    
    // Get ticket
    const tickets = await base44.asServiceRole.entities.SupportTicket.filter({ id: ticket_id });
    const ticket = tickets?.[0];
    
    if (!ticket) {
      return Response.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }
    
    // Check if ticket is closed
    if (ticket.status === 'closed') {
      return Response.json({ 
        success: false, 
        error: 'Cannot reply to closed ticket' 
      }, { status: 400 });
    }
    
    // Create new message
    const newMessage = {
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      sender_type: is_admin ? 'admin' : 'user',
      message: message.trim(),
      timestamp: new Date().toISOString(),
      attachments: []
    };
    
    // Update ticket
    const updatedMessages = [...(ticket.messages || []), newMessage];
    const updateData = {
      messages: updatedMessages,
      last_response_at: new Date().toISOString(),
      last_response_by: is_admin ? 'admin' : 'user'
    };
    
    // If admin is replying, change status to in_progress
    if (is_admin && ticket.status === 'open') {
      updateData.status = 'in_progress';
    }
    
    await base44.asServiceRole.entities.SupportTicket.update(ticket_id, updateData);
    
    // Send email notification
    if (is_admin) {
      // Admin replied, notify user
      const userEmailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <tr><td style="background-color: #0F4229; padding: 25px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">💬 Support Team Response</h1>
        </td></tr>
        <tr><td style="padding: 30px;">
          <p style="color: #333; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">Your support ticket has been updated.</p>
          <table width="100%" cellpadding="12" cellspacing="0" style="background-color: #f8f8f8; border-radius: 6px; margin: 20px 0;">
            <tr><td>
              <p style="margin: 5px 0; color: #555;"><strong style="color: #0F4229;">Ticket:</strong> ${ticket.ticket_number}</p>
              <p style="margin: 5px 0; color: #555;"><strong style="color: #0F4229;">Subject:</strong> ${ticket.subject}</p>
              <p style="margin: 5px 0; color: #555;"><strong style="color: #0F4229;">Status:</strong> ${updateData.status || ticket.status}</p>
            </td></tr>
          </table>
          <h3 style="color: #0F4229; margin: 20px 0 10px 0;">Support Team Reply:</h3>
          <div style="background-color: #e8f5e9; border-left: 4px solid #0F4229; padding: 15px; border-radius: 4px;">
            <p style="color: #333; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
            <tr><td align="center">
              <a href="https://app.leaseshield.asia/support" style="display: inline-block; background-color: #0F4229; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold;">View Ticket & Reply</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background-color: #f8f8f8; padding: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">Best regards,<br><strong style="color: #0F4229;">Lease Shield Support Team</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
      `.trim();
      
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: ticket.user_email,
          subject: `[${ticket.ticket_number}] Support Team Response`,
          body: userEmailHtml
        });
      } catch (emailError) {
        console.error('User notification email failed:', emailError);
      }
    } else {
      // User replied, notify admin
      const adminEmailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <tr><td style="background-color: #1976d2; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">↩️ User Reply</h1>
        </td></tr>
        <tr><td style="padding: 25px;">
          <p style="color: #333; margin: 0 0 15px 0;">User has replied to ticket <strong>${ticket.ticket_number}</strong></p>
          <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f8f8f8; border-radius: 6px; margin: 15px 0;">
            <tr><td>
              <p style="margin: 3px 0; color: #555; font-size: 14px;"><strong>From:</strong> ${user.email}</p>
              <p style="margin: 3px 0; color: #555; font-size: 14px;"><strong>Subject:</strong> ${ticket.subject}</p>
            </td></tr>
          </table>
          <h4 style="color: #0F4229; margin: 15px 0 8px 0;">User Reply:</h4>
          <div style="background-color: #ffffff; border: 1px solid #ddd; border-radius: 4px; padding: 12px;">
            <p style="color: #333; line-height: 1.5; margin: 0; white-space: pre-wrap; font-size: 14px;">${message}</p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0 0 0;">
            <tr><td align="center">
              <a href="https://app.leaseshield.asia/adminsupport" style="display: inline-block; background-color: #0F4229; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; font-size: 14px;">View & Respond</a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
      `.trim();
      
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: 'support@leaseshield.asia',
          subject: `[REPLY] ${ticket.ticket_number}: ${ticket.subject}`,
          body: adminEmailHtml
        });
      } catch (emailError) {
        console.error('Admin notification email failed:', emailError);
      }
    }
    
    return Response.json({ 
      success: true,
      message: 'Reply sent successfully'
    });
    
  } catch (error) {
    console.error('replyToSupportTicket error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});