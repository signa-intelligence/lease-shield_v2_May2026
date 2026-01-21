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
          const highPriorityReminderHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #dc2626; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">⚠️ HIGH PRIORITY TICKET REMINDER</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">6 hours without response</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellpadding="12" cellspacing="0" style="background-color: #f8f8f8; border-radius: 6px; margin-bottom: 20px;">
                <tr>
                  <td>
                    <p style="margin: 5px 0; color: #555;">
                      <strong style="color: #0F4229;">Ticket:</strong> ${ticket.ticket_number}
                    </p>
                    <p style="margin: 5px 0; color: #555;">
                      <strong style="color: #0F4229;">From:</strong> ${ticket.user_email}
                    </p>
                    <p style="margin: 5px 0; color: #555;">
                      <strong style="color: #0F4229;">Plan:</strong> ${ticket.user_plan_tier}
                    </p>
                    <p style="margin: 5px 0; color: #555;">
                      <strong style="color: #0F4229;">Opened:</strong> ${ticket.last_response_at}
                    </p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0;">
                <tr>
                  <td align="center">
                    <a href="https://app.leaseshield.asia/adminsupport" 
                       style="display: inline-block; background-color: #0F4229; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      View Ticket & Respond
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f8f8; padding: 15px; border-top: 1px solid #e0e0e0; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Lease Shield Admin Panel
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `.trim();
          
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: 'support@leaseshield.asia',
            subject: `⚠️ REMINDER: ${ticket.ticket_number} - 6 hours without response`,
            body: highPriorityReminderHtml
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
            const normalPriorityReminderHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #FFC107; padding: 20px; text-align: center;">
              <h1 style="color: #333; margin: 0; font-size: 22px;">⏰ TICKET REMINDER</h1>
              <p style="color: #333; margin: 10px 0 0 0; font-size: 16px;">${hours} hours without response</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellpadding="12" cellspacing="0" style="background-color: #f8f8f8; border-radius: 6px; margin-bottom: 20px;">
                <tr>
                  <td>
                    <p style="margin: 5px 0; color: #555;">
                      <strong style="color: #0F4229;">Ticket:</strong> ${ticket.ticket_number}
                    </p>
                    <p style="margin: 5px 0; color: #555;">
                      <strong style="color: #0F4229;">From:</strong> ${ticket.user_email}
                    </p>
                    <p style="margin: 5px 0; color: #555;">
                      <strong style="color: #0F4229;">Plan:</strong> ${ticket.user_plan_tier}
                    </p>
                    <p style="margin: 5px 0; color: #555;">
                      <strong style="color: #0F4229;">Opened:</strong> ${ticket.last_response_at}
                    </p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0;">
                <tr>
                  <td align="center">
                    <a href="https://app.leaseshield.asia/adminsupport" 
                       style="display: inline-block; background-color: #0F4229; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      View Ticket & Respond
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f8f8; padding: 15px; border-top: 1px solid #e0e0e0; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Lease Shield Admin Panel
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
            `.trim();
            
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: 'support@leaseshield.asia',
              subject: `⏰ REMINDER: ${ticket.ticket_number} - ${hours} hours without response`,
              body: normalPriorityReminderHtml
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