import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * SECURE ROLE UPDATE ENDPOINT
 * 
 * Updates a user's access_level (role) using service role permissions.
 * Only super_admin users can call this endpoint.
 * 
 * Required: The calling user must be authenticated and have access_level = 'super_admin'
 * 
 * Input:
 * - targetUserId: string - The user ID to update
 * - newAccessLevel: string - The new access level ('user', 'va', 'admin', 'super_admin')
 * - updateData: object (optional) - Additional fields to update (plan_tier, letter_credits, etc.)
 */

Deno.serve(async (req) => {
  console.log('\n[UPDATE_USER_ROLE] ════════════════════════════════════════');
  console.log('[UPDATE_USER_ROLE] Request received at:', new Date().toISOString());
  
  try {
    const base44 = createClientFromRequest(req);
    
    // 1. Verify caller is authenticated
    const callingUser = await base44.auth.me();
    if (!callingUser) {
      console.error('[UPDATE_USER_ROLE] ❌ Unauthorized - no user session');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[UPDATE_USER_ROLE] Calling user:', {
      id: callingUser.id,
      email: callingUser.email,
      access_level: callingUser.access_level,
      role: callingUser.role
    });
    
    // 2. Verify caller is super_admin
    const callerAccessLevel = callingUser.access_level || callingUser.role;
    if (callerAccessLevel !== 'super_admin') {
      console.error('[UPDATE_USER_ROLE] ❌ Forbidden - caller is not super_admin:', callerAccessLevel);
      return Response.json({ 
        error: 'Forbidden - only super_admin can update user roles',
        callerRole: callerAccessLevel
      }, { status: 403 });
    }
    
    console.log('[UPDATE_USER_ROLE] ✅ Caller verified as super_admin');
    
    // 3. Parse request body
    const { targetUserId, newAccessLevel, updateData = {} } = await req.json();
    
    if (!targetUserId) {
      console.error('[UPDATE_USER_ROLE] ❌ Missing targetUserId');
      return Response.json({ error: 'Missing targetUserId' }, { status: 400 });
    }
    
    console.log('[UPDATE_USER_ROLE] Update request:', {
      targetUserId,
      newAccessLevel,
      additionalData: Object.keys(updateData)
    });
    
    // 4. Build update payload
    const payload = { ...updateData };
    if (newAccessLevel) {
      // Validate access level value
      const validLevels = ['user', 'va', 'admin', 'super_admin'];
      if (!validLevels.includes(newAccessLevel)) {
        console.error('[UPDATE_USER_ROLE] ❌ Invalid access level:', newAccessLevel);
        return Response.json({ 
          error: `Invalid access level: ${newAccessLevel}. Must be one of: ${validLevels.join(', ')}` 
        }, { status: 400 });
      }
      payload.access_level = newAccessLevel;
    }
    
    console.log('[UPDATE_USER_ROLE] Final payload:', payload);
    
    // 5. Execute update using service role (bypasses RLS)
    console.log('[UPDATE_USER_ROLE] Executing update with asServiceRole...');
    
    const updatedUser = await base44.asServiceRole.entities.User.update(targetUserId, payload);
    
    console.log('[UPDATE_USER_ROLE] ✅ Update successful:', {
      id: updatedUser.id,
      email: updatedUser.email,
      access_level: updatedUser.access_level,
      plan_tier: updatedUser.plan_tier
    });
    
    // 6. Verify the update if access_level was changed
    if (newAccessLevel && updatedUser.access_level !== newAccessLevel) {
      console.error('[UPDATE_USER_ROLE] ⚠️ Verification failed - access_level mismatch:', {
        expected: newAccessLevel,
        actual: updatedUser.access_level
      });
      return Response.json({ 
        error: 'Update verification failed',
        expected: newAccessLevel,
        actual: updatedUser.access_level
      }, { status: 500 });
    }
    
    console.log('[UPDATE_USER_ROLE] ════════════════════════════════════════\n');
    
    return Response.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        access_level: updatedUser.access_level,
        plan_tier: updatedUser.plan_tier,
        letter_credits: updatedUser.letter_credits,
        is_active: updatedUser.is_active
      }
    });
    
  } catch (error) {
    console.error('[UPDATE_USER_ROLE] ❌ Fatal error:', error.message);
    console.error('[UPDATE_USER_ROLE] Stack:', error.stack);
    console.error('[UPDATE_USER_ROLE] ════════════════════════════════════════\n');
    
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});