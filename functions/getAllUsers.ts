import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Get all users for Admin Console
 * Uses service role to bypass RLS restrictions
 * CRITICAL: This function MUST return ALL users regardless of RLS
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // CRITICAL: Verify the requesting user is actually an admin
    const currentUser = await base44.auth.me();
    
    if (!currentUser) {
      console.error('❌ No authenticated user');
      return Response.json({ 
        error: 'Unauthorized',
        users: [] 
      }, { status: 401 });
    }
    
    const isAdmin = 
      ['admin', 'super_admin', 'va'].includes(currentUser.access_level) ||
      ['admin', 'super_admin', 'va'].includes(currentUser.role);
    
    if (!isAdmin) {
      console.error('❌ User is not admin:', currentUser.email);
      return Response.json({ 
        error: 'Forbidden - Admin access required',
        users: [] 
      }, { status: 403 });
    }
    
    console.log('✅ Admin verified:', currentUser.email, 'access_level:', currentUser.access_level);
    
    // Use asServiceRole to bypass RLS and get ALL users
    console.log('🔍 Fetching all users via service role...');
    const users = await base44.asServiceRole.entities.User.list('-created_date');
    
    console.log(`✅ Successfully fetched ${users.length} users`);
    
    // Return users array directly
    return Response.json({ 
      success: true,
      users: users,
      count: users.length 
    });
    
  } catch (error) {
    console.error('❌ Error in getAllUsers:', error);
    console.error('Stack:', error.stack);
    return Response.json({ 
      success: false,
      error: error.message,
      users: [] 
    }, { status: 500 });
  }
});