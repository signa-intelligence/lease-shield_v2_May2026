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
      const userEmailBody = `
Your support ticket has been updated.

Ticket Number: ${ticket.ticket_number}
Subject: ${ticket.subject}
Status: ${updateData.status || ticket.status}

Support Team Reply:
${message}

View your ticket:
https://app.leaseshield.asia/support

Best regards,
Lease Shield Support Team
      `.trim();
      
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: ticket.user_email,
          subject: `[${ticket.ticket_number}] Support Team Response`,
          body: userEmailBody
        });
      } catch (emailError) {
        console.error('User notification email failed:', emailError);
      }
    } else {
      // User replied, notify admin
      const adminEmailBody = `
User has replied to support ticket.

Ticket Number: ${ticket.ticket_number}
From: ${user.email}
Subject: ${ticket.subject}

User Reply:
${message}

View and respond:
https://app.leaseshield.asia/adminsupport
      `.trim();
      
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: 'support@leaseshield.asia',
          subject: `[REPLY] ${ticket.ticket_number}: ${ticket.subject}`,
          body: adminEmailBody
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