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
    
    const userEmailBody = `
Thank you for contacting Lease Shield Support.

Ticket Number: ${ticketNumber}
Subject: ${subject}
Status: Open
Priority: ${priority === 'high' ? 'High' : 'Normal'}

We've received your support request and will respond within ${responseTime}.

You can view your ticket by logging into your account at:
https://app.leaseshield.asia/support

Best regards,
Lease Shield Support Team
    `.trim();
    
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `[${ticketNumber}] Support Request Received`,
        body: userEmailBody
      });
    } catch (emailError) {
      console.error('User email failed:', emailError);
    }
    
    // Send admin alert email
    const priorityLabel = priority === 'high' ? '🔴 HIGH PRIORITY' : 'Normal';
    const adminEmailBody = `
${priorityLabel} - New Support Ticket

Ticket Number: ${ticketNumber}
From: ${user.full_name || user.email} (${user.email})
Plan: ${user.plan_tier || 'free'}
Category: ${category}
Priority: ${priority}

Subject: ${subject}

Description:
${description}

${attachments.length > 0 ? `Attachments: ${attachments.length} file(s)` : 'No attachments'}

View and respond:
https://app.leaseshield.asia/adminsupport

Expected response time: ${responseTime}
    `.trim();
    
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'support@leaseshield.asia',
        subject: `[${priority === 'high' ? 'HIGH' : 'NEW'}] ${ticketNumber}: ${subject}`,
        body: adminEmailBody
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