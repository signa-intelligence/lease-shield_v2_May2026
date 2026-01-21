import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] ━━━━ REPLY TO TICKET ━━━━`);

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId, message, attachments = [] } = await req.json();

    if (!ticketId || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch ticket
    const ticket = await base44.entities.SupportTicket.filter({ id: ticketId });
    if (!ticket || ticket.length === 0) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const existingTicket = ticket[0];

    // Determine sender type
    const isAdmin = ['admin', 'super_admin', 'va'].includes(user.access_level) || 
                    ['admin', 'super_admin', 'va'].includes(user.role);
    const senderType = isAdmin ? 'admin' : 'user';

    // Create new message
    const newMessage = {
      sender_email: user.email,
      sender_name: user.full_name,
      sender_type: senderType,
      message: message,
      timestamp: new Date().toISOString(),
      attachments: attachments
    };

    // Update ticket
    const updatedMessages = [...(existingTicket.messages || []), newMessage];
    
    const updateData = {
      messages: updatedMessages,
      last_response_at: new Date().toISOString(),
      last_response_by: senderType
    };

    // If admin replies, mark as having unread admin reply
    if (senderType === 'admin') {
      updateData.has_unread_admin_reply = true;
      
      // Auto-update status to in_progress if still open
      if (existingTicket.status === 'open') {
        updateData.status = 'in_progress';
      }
    } else {
      // User reply - mark admin reply as read
      updateData.has_unread_admin_reply = false;
      
      // If waiting_user, move back to in_progress
      if (existingTicket.status === 'waiting_user') {
        updateData.status = 'in_progress';
      }
    }

    await base44.entities.SupportTicket.update(ticketId, updateData);

    console.log(`[${requestId}] ✅ Reply added by:`, user.email, `(${senderType})`);

    // Send email notification
    try {
      if (senderType === 'admin') {
        // Notify user - CHECK EMAIL PREFERENCES
        const recipientUser = await base44.asServiceRole.auth.admin.getUserByEmail(existingTicket.created_by);
        const emailPrefs = recipientUser?.user_metadata?.email_preferences;
        
        if (!emailPrefs?.support_emails) {
          console.log(`[${requestId}] 📧 User opted out of support emails. Skipping notification.`);
          return Response.json({ success: true, skipped_email: true });
        }

        const userLanguage = recipientUser?.user_metadata?.language || 'en';

        const emailBody = userLanguage === 'th'
          ? `
คุณมีข้อความใหม่สำหรับคำขอสนับสนุน: ${existingTicket.ticket_number}

จาก: ${user.full_name} (ทีมสนับสนุน)

${message}

ดูและตอบกลับได้ที่:
https://app.leaseshield.asia/support?ticketId=${ticketId}

ด้วยความเคารพ,
Lease Shield Support
          `.trim()
          : `
You have a new message for support ticket: ${existingTicket.ticket_number}

From: ${user.full_name} (Support Team)

${message}

View and reply at:
https://app.leaseshield.asia/support?ticketId=${ticketId}

Best regards,
Lease Shield Support Team
          `.trim();

        await base44.integrations.Core.SendEmail({
          to: existingTicket.created_by,
          subject: userLanguage === 'th'
            ? `[${existingTicket.ticket_number}] ตอบกลับจากทีมสนับสนุน`
            : `[${existingTicket.ticket_number}] Reply from Support Team`,
          body: emailBody
        });

        console.log(`[${requestId}] 📧 User notification sent to:`, existingTicket.created_by);
      } else {
        // Notify admin
        const adminEmail = Deno.env.get('ADMIN_ALERT_EMAIL') || 'support@leaseshield.asia';
        
        await base44.integrations.Core.SendEmail({
          to: adminEmail,
          subject: `[${existingTicket.ticket_number}] New User Reply`,
          body: `
User replied to ticket: ${existingTicket.ticket_number}

From: ${user.full_name} (${user.email})

${message}

View ticket:
https://app.leaseshield.asia/admin-support?ticketId=${ticketId}
          `.trim()
        });

        console.log(`[${requestId}] 📧 Admin notification sent`);
      }
    } catch (emailError) {
      console.error(`[${requestId}] ⚠️ Email notification failed (non-critical):`, emailError);
    }

    return Response.json({
      success: true,
      diagnostic: {
        buildTag: 'support-flow-v1',
        requestId
      }
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Error:`, error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});