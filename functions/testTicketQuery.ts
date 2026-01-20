import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Test 1: Admin query with asServiceRole
    const adminResult = await base44.asServiceRole.entities.SupportTicket.list();
    
    // Test 2: User query without asServiceRole
    const userResult = await base44.entities.SupportTicket.list();
    
    return Response.json({
      test1_admin_count: adminResult?.length || 0,
      test1_tickets: adminResult || [],
      test2_user_count: userResult?.length || 0,
      test2_tickets: userResult || []
    });
  } catch (error) {
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});