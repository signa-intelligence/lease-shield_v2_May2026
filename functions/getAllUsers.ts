import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Helper function to get all users for the reminder system
 * Returns basic user data including notification preferences
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Use service role to get all users
    // Note: User entity might not support filter/list in some setups
    // If that fails, we'll need to handle it differently
    
    let users = [];
    
    try {
      // Try to get users via a special approach since User entity might not support standard operations
      const response = await base44.asServiceRole.functions.invoke('fetchAllAppUsers');
      users = response.data || [];
    } catch (err) {
      console.log('ℹ️ fetchAllAppUsers not available, returning empty array');
      // Return empty array - the main function will fall back to per-deposit user fetching
      users = [];
    }
    
    console.log(`📊 Found ${users.length} users`);
    
    return Response.json(users);
    
  } catch (error) {
    console.error('❌ Error getting users:', error);
    return Response.json({ 
      error: error.message,
      users: [] 
    }, { status: 500 });
  }
});