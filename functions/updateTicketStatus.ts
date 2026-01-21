import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Check admin access
    const userRole = user?.role?.toLowerCase();
    const accessLevel = user?.access_level?.toLowerCase();
    const isAdmin = userRole === 'admin' || 
                    userRole === 'super_admin' || 
                    accessLevel === 'admin' || 
                    accessLevel === 'super_admin';
    
    if (!user || !isAdmin) {
      return Response.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }
    
    const { ticket_id, status } = await req.json();
    
    // Validate status
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return Response.json({ 
        success: false, 
        error: 'Invalid status' 
      }, { status: 400 });
    }
    
    // Update ticket
    const updateData = { status };
    
    if (status === 'resolved') {
      updateData.resolved_date = new Date().toISOString();
    }
    
    if (status === 'closed') {
      updateData.closed_date = new Date().toISOString();
    }
    
    await base44.asServiceRole.entities.SupportTicket.update(ticket_id, updateData);
    
    return Response.json({ 
      success: true,
      message: `Ticket status updated to ${status}`
    });
    
  } catch (error) {
    console.error('updateTicketStatus error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});