import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get tickets that haven't had user response in 48 hours
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    const allTickets = await base44.asServiceRole.entities.SupportTicket.list();
    
    const ticketsToClose = allTickets.filter(ticket => 
      ['open', 'in_progress'].includes(ticket.status) &&
      ticket.last_response_by === 'admin' &&
      ticket.last_response_at < fortyEightHoursAgo
    );
    
    let closedCount = 0;
    
    for (const ticket of ticketsToClose) {
      await base44.asServiceRole.entities.SupportTicket.update(ticket.id, {
        status: 'closed',
        closed_date: new Date().toISOString()
      });
      closedCount++;
    }
    
    console.log(`Auto-closed ${closedCount} inactive tickets`);
    
    return Response.json({ 
      success: true,
      closed_count: closedCount
    });
    
  } catch (error) {
    console.error('autoCloseInactiveTickets error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});