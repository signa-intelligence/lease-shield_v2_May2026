import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] ━━━━ CREATE SUPPORT TICKET ━━━━`);

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description, category, attachments = [] } = await req.json();

    if (!description) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Auto-generate subject from category
    const subject = `${category} request`;

    // Generate ticket number
    const allTickets = await base44.asServiceRole.entities.SupportTicket.list();
    const ticketNumber = `SUP-${String(allTickets.length + 1).padStart(4, '0')}`;

    // Determine priority based on user tier
    let priority = 'normal';
    if (user.plan_tier === 'secure') priority = 'urgent';
    else if (user.plan_tier === 'protect') priority = 'high';

    // Create initial message
    const initialMessage = {
      sender_email: user.email,
      sender_name: user.full_name,
      sender_type: 'user',
      message: description,
      timestamp: new Date().toISOString(),
      attachments: attachments
    };

    // Create ticket
    const ticket = await base44.entities.SupportTicket.create({
      ticket_number: ticketNumber,
      subject: subject,
      description: description,
      category: category,
      priority: priority,
      status: 'open',
      attachments: attachments,
      messages: [initialMessage],
      user_email: user.email,
      user_plan_tier: user.plan_tier || 'free',
      last_response_at: new Date().toISOString(),
      last_response_by: 'user',
      has_unread_admin_reply: false
    });

    console.log(`[${requestId}] ✅ Ticket created:`, ticketNumber);

    // Send email notification to admin
    const adminEmail = Deno.env.get('ADMIN_ALERT_EMAIL') || 'support@leaseshield.asia';
    
    try {
      const emailBody = `
New Support Ticket: ${ticketNumber}

From: ${user.full_name} (${user.email})
Plan: ${user.plan_tier || 'free'}
Priority: ${priority}
Category: ${category}

Subject: ${subject}

Description:
${description}

${attachments.length > 0 ? `Attachments: ${attachments.length} file(s)` : ''}

View in admin panel:
https://app.leaseshield.asia${Deno.env.get('BASE44_APP_DOMAIN') || ''}/admin-support?ticketId=${ticket.id}
      `.trim();

      await base44.integrations.Core.SendEmail({
        to: adminEmail,
        subject: `[${priority.toUpperCase()}] New Support Ticket: ${ticketNumber}`,
        body: emailBody
      });

      console.log(`[${requestId}] 📧 Admin notification sent to:`, adminEmail);
    } catch (emailError) {
      console.error(`[${requestId}] ⚠️ Admin email failed (non-critical):`, emailError);
    }

    // Send confirmation email to user
    try {
      // CHECK EMAIL PREFERENCES
      const fullUser = await base44.asServiceRole.auth.admin.getUserByEmail(user.email);
      const emailPrefs = fullUser?.user_metadata?.email_preferences;
      
      if (!emailPrefs?.support_emails) {
        console.log(`[${requestId}] 📧 User opted out of support emails. Skipping confirmation.`);
        return Response.json({ success: true, ticket: ticket, skipped_email: true });
      }

      const userLanguage = user.language || 'en';
      
      const confirmationMessages = {
        en: `
Thank you for contacting Lease Shield Support.

Ticket Number: ${ticketNumber}
Subject: ${subject}
Status: Open

We've received your support request and will respond within:
• Secure Plan: 6 hours
• Protect Plan: 12 hours  
• Lite Plan: 24 hours
• Free Plan: 48 hours

You can track your ticket status at:
https://app.leaseshield.asia/support

Best regards,
Lease Shield Support Team
        `.trim(),
        th: `
ขอบคุณที่ติดต่อฝ่ายสนับสนุน Lease Shield

หมายเลขคำขอ: ${ticketNumber}
หัวข้อ: ${subject}
สถานะ: เปิด

เราได้รับคำขอของคุณแล้วและจะตอบกลับภายใน:
• Secure: 6 ชั่วโมง
• Protect: 12 ชั่วโมง
• Lite: 24 ชั่วโมง  
• Free: 48 ชั่วโมง

ติดตามสถานะได้ที่:
https://app.leaseshield.asia/support

ด้วยความเคารพ,
ทีมสนับสนุน Lease Shield
        `.trim()
      };

      const confirmationBody = confirmationMessages[userLanguage] || confirmationMessages.en;

      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: userLanguage === 'th' 
          ? `[${ticketNumber}] ได้รับคำขอสนับสนุนของคุณแล้ว`
          : `[${ticketNumber}] Support Request Received`,
        body: confirmationBody
      });

      console.log(`[${requestId}] 📧 User confirmation sent to:`, user.email);
    } catch (emailError) {
      console.error(`[${requestId}] ⚠️ User confirmation email failed (non-critical):`, emailError);
    }

    return Response.json({
      success: true,
      ticket: ticket,
      diagnostic: {
        buildTag: 'support-flow-v1',
        requestId,
        ticketNumber
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