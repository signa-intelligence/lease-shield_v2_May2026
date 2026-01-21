import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    
    const { description, category, attachments = [] } = await req.json();
    
    // Validate description length
    if (!description || description.trim().length < 20) {
      return Response.json({ 
        success: false, 
        error: 'Description must be at least 20 characters' 
      }, { status: 400 });
    }
    
    if (description.length > 500) {
      return Response.json({ 
        success: false, 
        error: 'Description must not exceed 500 characters' 
      }, { status: 400 });
    }
    
    // Validate attachments
    if (attachments.length > 3) {
      return Response.json({ 
        success: false, 
        error: 'Maximum 3 attachments allowed' 
      }, { status: 400 });
    }
    
    // Get last ticket number
    const lastTickets = await base44.asServiceRole.entities.SupportTicket.list('-created_date', 1);
    const lastNumber = lastTickets?.[0]?.ticket_number 
      ? parseInt(lastTickets[0].ticket_number.split('-')[1]) 
      : 0;
    const ticketNumber = `SUP-${String(lastNumber + 1).padStart(4, '0')}`;
    
    // Auto-generate subject from category
    const subjectMap = {
      'deposit': 'Deposit Issue',
      'billing': 'Billing & Subscription Question',
      'technical': 'Technical Support',
      'scan': 'Lease Scan Issue',
      'other': 'General Support Request'
    };
    const subject = subjectMap[category] || 'Support Request';
    
    // Determine priority based on user plan tier
    const planTier = user.plan_tier || 'free';
    const priority = ['secure', 'protect'].includes(planTier.toLowerCase()) ? 'high' : 'normal';
    
    // Create ticket with asServiceRole
    const ticket = await base44.asServiceRole.entities.SupportTicket.create({
      ticket_number: ticketNumber,
      subject: subject,
      description: description,
      category: category,
      status: 'open',
      priority: priority,
      user_email: user.email,
      user_plan_tier: user.plan_tier || 'free',
      attachments: attachments,
      last_response_at: new Date().toISOString(),
      last_response_by: 'user',
      messages: [{
        sender_email: user.email,
        sender_name: user.full_name || user.email,
        sender_type: 'user',
        message: description,
        timestamp: new Date().toISOString(),
        attachments: attachments
      }]
    });
    
    // Send user confirmation email
    const responseTimeMap = {
      'secure': '6 hours',
      'protect': '12 hours',
      'lite': '24 hours',
      'free': '48 hours'
    };
    const responseTime = responseTimeMap[planTier.toLowerCase()] || '48 hours';
    
    const userEmailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <tr><td style="background-color: #0F4229; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🛡️ Lease Shield Support</h1>
        </td></tr>
        <tr><td style="padding: 40px 30px;">
          <h2 style="color: #0F4229; margin: 0 0 20px 0; font-size: 20px;">Support Request Received</h2>
          <p style="color: #333; line-height: 1.6; margin: 0 0 20px 0;">Thank you for contacting Lease Shield Support. We've received your request and our team will respond within <strong>${responseTime}</strong>.</p>
          <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f8f8f8; border-radius: 6px; margin: 20px 0;">
            <tr><td>
              <p style="margin: 5px 0; color: #555;"><strong style="color: #0F4229;">Ticket Number:</strong> ${ticketNumber}</p>
              <p style="margin: 5px 0; color: #555;"><strong style="color: #0F4229;">Subject:</strong> ${subject}</p>
              <p style="margin: 5px 0; color: #555;"><strong style="color: #0F4229;">Status:</strong> Open</p>
              <p style="margin: 5px 0; color: #555;"><strong style="color: #0F4229;">Priority:</strong> ${priority === 'high' ? '🔴 High' : 'Normal'}</p>
              ${attachments.length > 0 ? `<p style="margin: 5px 0; color: #555;"><strong style="color: #0F4229;">Attachments:</strong> ${attachments.length} file(s)</p>` : ''}
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
            <tr><td align="center">
              <a href="https://app.leaseshield.asia/support" style="display: inline-block; background-color: #0F4229; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px;">View Your Ticket</a>
            </td></tr>
          </table>
          <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">You'll receive an email notification when our support team responds to your ticket.</p>
        </td></tr>
        <tr><td style="background-color: #f8f8f8; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">Best regards,<br><strong style="color: #0F4229;">Lease Shield Support Team</strong></p>
          <p style="color: #999; font-size: 11px; margin: 10px 0 0 0; text-align: center;">Protecting renters' rights in Thailand</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim();
    
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `[${ticketNumber}] Support Request Received`,
        body: userEmailHtml
      });
    } catch (emailError) {
      console.error('User email failed:', emailError);
    }
    
    // Send admin alert email
    const priorityLabel = priority === 'high' ? '🔴 HIGH PRIORITY' : '⚪ Normal Priority';
    const priorityColor = priority === 'high' ? '#dc2626' : '#6b7280';
    
    const adminEmailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <tr><td style="background-color: ${priorityColor}; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">${priorityLabel}</h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">New Support Ticket</p>
        </td></tr>
        <tr><td style="padding: 30px;">
          <table width="100%" cellpadding="12" cellspacing="0" style="background-color: #f8f8f8; border-radius: 6px; margin-bottom: 20px;">
            <tr><td>
              <p style="margin: 5px 0; color: #555;"><strong style="color: #0F4229;">Ticket:</strong> ${ticketNumber}</p>
              <p style="margin: 5px 0; color: #555;"><strong style="color: #0F4229;">From:</strong> ${user.full_name || user.email}</p>
              <p style="margin: 5px 0; color: #555;"><strong style="color: #0F4229;">Email:</strong> ${user.email}</p>
              <p style="margin: 5px 0; color: #555;"><strong style="color: #0F4229;">Plan:</strong> ${user.plan_tier || 'free'}</p>
              <p style="margin: 5px 0; color: #555;"><strong style="color: #0F4229;">Category:</strong> ${category}</p>
              <p style="margin: 5px 0; color: #555;"><strong style="color: #0F4229;">Expected Response:</strong> ${responseTime}</p>
            </td></tr>
          </table>
          <h3 style="color: #0F4229; margin: 0 0 10px 0;">Subject: ${subject}</h3>
          <div style="background-color: #ffffff; border-left: 4px solid #0F4229; padding: 15px; margin: 15px 0;">
            <p style="color: #333; line-height: 1.6; margin: 0; white-space: pre-wrap;">${description}</p>
          </div>
          ${attachments.length > 0 ? `
          <div style="margin: 20px 0;">
            <h4 style="color: #0F4229; margin: 0 0 10px 0;">Attachments (${attachments.length}):</h4>
            ${attachments.map(a => `<p style="margin: 5px 0; color: #555;">📎 <a href="${a.url}" style="color: #0F4229; text-decoration: none;">${a.name}</a> <span style="color: #999; font-size: 12px;">(${(a.size / 1024).toFixed(1)} KB)</span></p>`).join('')}
          </div>` : ''}
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0;">
            <tr><td align="center">
              <a href="https://app.leaseshield.asia/adminsupport" style="display: inline-block; background-color: #0F4229; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px;">View & Respond</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background-color: #f8f8f8; padding: 15px; border-top: 1px solid #e0e0e0; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">Lease Shield Admin Panel</p>
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
        subject: `[${priority === 'high' ? 'HIGH' : 'NEW'}] ${ticketNumber}: ${subject}`,
        body: adminEmailHtml
      });
    } catch (adminEmailError) {
      console.error('Admin email failed:', adminEmailError);
    }
    
    return Response.json({ 
      success: true, 
      ticket: ticket,
      ticket_number: ticketNumber
    });
    
  } catch (error) {
    console.error('submitSupportTicket error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});