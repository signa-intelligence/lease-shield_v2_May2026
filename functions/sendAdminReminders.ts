import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = Date.now();
    
    // Get all open tickets
    const allTickets = await base44.asServiceRole.entities.SupportTicket.list();
    const openTickets = allTickets.filter(t => t.status === 'open' && t.last_response_by === 'user');
    
    let remindersSent = 0;
    
    // Check high priority tickets (6 hours)
    const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000).toISOString();
    
    for (const ticket of openTickets) {
      if (ticket.priority === 'high' && ticket.last_response_at < sixHoursAgo) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: 'support@leaseshield.asia',
            subject: `⚠️ REMINDER: ${ticket.ticket_number} - 6 hours without response`,
            body: `
HIGH PRIORITY ticket needs response:

Ticket: ${ticket.ticket_number}
From: ${ticket.user_email}
Plan: ${ticket.user_plan_tier}
Opened: ${ticket.last_response_at}

View: https://app.leaseshield.asia/adminsupport
            `.trim()
          });
          remindersSent++;
        } catch (error) {
          console.error(`Failed to send reminder for ${ticket.ticket_number}:`, error);
        }
      }
    }
    
    // Check normal priority tickets by plan tier
    const planResponseTimes = {
      'protect': 12,
      'lite': 24,
      'free': 48
    };
    
    for (const [plan, hours] of Object.entries(planResponseTimes)) {
      const cutoffTime = new Date(now - hours * 60 * 60 * 1000).toISOString();
      
      for (const ticket of openTickets) {
        if (ticket.priority === 'normal' && 
            ticket.user_plan_tier === plan && 
            ticket.last_response_at < cutoffTime) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: 'support@leaseshield.asia',
              subject: `⏰ REMINDER: ${ticket.ticket_number} - ${hours} hours without response`,
              body: `
Ticket needs response:

Ticket: ${ticket.ticket_number}
From: ${ticket.user_email}
Plan: ${ticket.user_plan_tier}
Opened: ${ticket.last_response_at}

View: https://app.leaseshield.asia/adminsupport
              `.trim()
            });
            remindersSent++;
          } catch (error) {
            console.error(`Failed to send reminder for ${ticket.ticket_number}:`, error);
          }
        }
      }
    }
    
    console.log(`Sent ${remindersSent} admin reminders`);
    
    return Response.json({ 
      success: true,
      reminders_sent: remindersSent
    });
    
  } catch (error) {
    console.error('sendAdminReminders error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});