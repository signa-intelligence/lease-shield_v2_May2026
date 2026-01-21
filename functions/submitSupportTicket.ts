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
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="color: #0F4229; margin: 0;">Thank You for Contacting Lease Shield Support</h2>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0F4229;">
    <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #0F4229;">Ticket Number:</strong> ${ticketNumber}</p>
    <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #0F4229;">Subject:</strong> ${subject}</p>
    <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #0F4229;">Status:</strong> Open</p>
    <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #0F4229;">Priority:</strong> ${priority === 'high' ? '🔴 High' : 'Normal'}</p>
  </div>
  
  <p style="font-size: 15px; line-height: 1.6; color: #333;">
    We've received your support request and will respond within <strong style="color: #0F4229;">${responseTime}</strong>.
  </p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://app.leaseshield.asia/support" 
       style="display: inline-block; background-color: #0F4229; color: white; padding: 12px 30px; 
              text-decoration: none; border-radius: 6px; font-weight: 600;">
      View Your Ticket
    </a>
  </div>
  
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
  
  <p style="color: #666; font-size: 13px; line-height: 1.5;">
    Best regards,<br>
    <strong>Lease Shield Support Team</strong><br>
    <span style="font-size: 12px;">Protecting your tenant rights in Thailand</span>
  </p>
</div>
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
    const priorityLabel = priority === 'high' ? '🔴 HIGH PRIORITY' : 'Normal';
    const adminEmailHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${priority === 'high' ? '#fee2e2' : '#f3f4f6'}; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${priority === 'high' ? '#dc2626' : '#6b7280'};">
    <h3 style="margin: 0; color: ${priority === 'high' ? '#991b1b' : '#374151'};">
      ${priorityLabel} - New Support Ticket
    </h3>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 8px 0; font-size: 14px;"><strong>Ticket Number:</strong> ${ticketNumber}</p>
    <p style="margin: 8px 0; font-size: 14px;"><strong>From:</strong> ${user.full_name || user.email} (${user.email})</p>
    <p style="margin: 8px 0; font-size: 14px;"><strong>Plan:</strong> ${user.plan_tier || 'free'}</p>
    <p style="margin: 8px 0; font-size: 14px;"><strong>Category:</strong> ${category}</p>
    <p style="margin: 8px 0; font-size: 14px;"><strong>Priority:</strong> ${priority}</p>
  </div>
  
  <div style="margin: 20px 0;">
    <p style="margin: 5px 0; font-size: 14px; font-weight: 600;">Subject:</p>
    <p style="margin: 5px 0 15px 0; font-size: 14px;">${subject}</p>
    
    <p style="margin: 5px 0; font-size: 14px; font-weight: 600;">Description:</p>
    <p style="margin: 5px 0; font-size: 14px; white-space: pre-wrap; background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0;">${description}</p>
  </div>
  
  ${attachments.length > 0 ? `<p style="font-size: 13px; color: #666;">📎 Attachments: ${attachments.length} file(s)</p>` : ''}
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://app.leaseshield.asia/adminsupport" 
       style="display: inline-block; background-color: #0F4229; color: white; padding: 12px 30px; 
              text-decoration: none; border-radius: 6px; font-weight: 600;">
      View and Respond
    </a>
  </div>
  
  <p style="font-size: 13px; color: #666; text-align: center;">
    Expected response time: <strong>${responseTime}</strong>
  </p>
</div>
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